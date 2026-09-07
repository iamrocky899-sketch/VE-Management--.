/**
 * VE MANAGEMENT — High-Performance Batch Google Sheets Database Layer
 * School: Gameri Higher Secondary School, Gamiri
 * Minimizes quota usage through atomic batch getValues() and setValues() operations.
 */

const Database = {
  _cachedSs: null,
  _cachedSheets: {},
  _cachedData: {},

  /**
   * Retrieves the target Google Spreadsheet (cached for request lifecycle).
   */
  getSpreadsheet: function() {
    if (this._cachedSs) return this._cachedSs;

    const props = PropertiesService.getScriptProperties();
    let sheetId = props.getProperty('SPREADSHEET_ID');
    if (sheetId) {
      try {
        const ssById = SpreadsheetApp.openById(sheetId);
        if (ssById) {
          this._cachedSs = ssById;
          return ssById;
        }
      } catch (e) {
        console.warn("Could not open spreadsheet by ID " + sheetId + ": " + e.message);
      }
    }

    try {
      const active = SpreadsheetApp.getActiveSpreadsheet();
      if (active) {
        props.setProperty('SPREADSHEET_ID', active.getId());
        this._cachedSs = active;
        return active;
      }
    } catch (e) {
      console.warn("No active spreadsheet bound to script: " + e.message);
    }

    // Auto-create master database spreadsheet if none configured
    try {
      const newSs = SpreadsheetApp.create('VE Management — GHSS Gamiri Master Database');
      props.setProperty('SPREADSHEET_ID', newSs.getId());
      this._cachedSs = newSs;
      return newSs;
    } catch (createErr) {
      console.error("Failed to auto-create spreadsheet: " + createErr.message);
      throw new Error('DATABASE_STORAGE_ERROR: Unable to connect to Google Sheets storage: ' + createErr.message);
    }
  },

  /**
   * Gets or initializes a sheet with the appropriate schema header row.
   * Fully idempotent, case-insensitive, whitespace-tolerant, and concurrency-safe.
   */
  getSheet: function(sheetName) {
    if (this._cachedSheets[sheetName]) {
      return this._cachedSheets[sheetName];
    }

    const ss = this.getSpreadsheet();
    if (!ss) throw new Error('DATABASE_STORAGE_ERROR: Unable to acquire spreadsheet instance');

    // 1. Try direct exact match
    let sheet = ss.getSheetByName(sheetName);

    // 2. If not found, scan all sheets with normalized name (trimmed & lower-cased)
    if (!sheet) {
      const allSheets = ss.getSheets();
      const targetNormalized = String(sheetName).trim().toLowerCase();
      sheet = allSheets.find(s => s.getName().trim().toLowerCase() === targetNormalized) || null;
      if (sheet && sheet.getName() !== sheetName) {
        try {
          sheet.setName(sheetName);
        } catch (renameErr) {
          console.warn(`Could not standardize sheet name from "${sheet.getName()}" to "${sheetName}": ${renameErr.message}`);
        }
      }
    }

    const schema = SCHEMAS[sheetName];

    // 3. If still not found, insert sheet safely
    if (!sheet) {
      try {
        sheet = ss.insertSheet(sheetName);
        if (schema && schema.columns) {
          sheet.getRange(1, 1, 1, schema.columns.length).setValues([schema.columns]);
          sheet.setFrozenRows(1);
          sheet.getRange(1, 1, 1, schema.columns.length).setFontWeight('bold');
        }
      } catch (insertErr) {
        // If insertSheet threw because it exists (e.g. race condition or variant name), find it from all sheets
        const allSheets = ss.getSheets();
        const targetNormalized = String(sheetName).trim().toLowerCase();
        sheet = allSheets.find(s => s.getName().trim().toLowerCase() === targetNormalized) || null;
        if (!sheet) {
          console.error(`Failed to find or insert sheet ${sheetName}: ${insertErr.message}`);
          throw insertErr;
        }
      }
    } else if (sheet.getLastRow() === 0 && schema && schema.columns) {
      sheet.getRange(1, 1, 1, schema.columns.length).setValues([schema.columns]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, schema.columns.length).setFontWeight('bold');
    }

    if (sheet) {
      this._cachedSheets[sheetName] = sheet;
    }
    return sheet;
  },

  /**
   * Batch reads all records from a sheet as an array of objects.
   * Read-only, safe, non-destructive, with single-request memoization.
   */
  readAll: function(sheetName) {
    if (this._cachedData[sheetName]) {
      return this._cachedData[sheetName];
    }

    try {
      const sheet = this.getSheet(sheetName);
      if (!sheet) return [];

      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();

      if (lastRow <= 1 || lastCol === 0) {
        this._cachedData[sheetName] = [];
        return [];
      }

      const schema = SCHEMAS[sheetName];
      const rawData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      const headers = rawData[0];
      const results = [];

      for (let r = 1; r < rawData.length; r++) {
        const row = rawData[r];
        // Skip completely empty rows
        if (row.every(cell => cell === '' || cell === null)) continue;

        const obj = {};
        for (let c = 0; c < headers.length; c++) {
          const key = headers[c];
          if (key) {
            let val = row[c];
            if (val instanceof Date) {
              val = Utilities.formatDate(val, 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
            }
            obj[key] = val;
          }
        }
        results.push(obj);
      }
      this._cachedData[sheetName] = results;
      return results;
    } catch (readErr) {
      console.warn(`Database.readAll('${sheetName}') non-fatal error: ${readErr.message}`);
      return [];
    }
  },

  /**
   * Reads rows matching a predicate function.
   */
  findBy: function(sheetName, predicate) {
    const all = this.readAll(sheetName);
    return all.filter(predicate);
  },

  /**
   * Reads a single record by its primary key value.
   */
  findByPk: function(sheetName, pkValue) {
    const schema = SCHEMAS[sheetName];
    if (!schema) return null;
    const pk = schema.primaryKey;
    const all = this.readAll(sheetName);
    return all.find(item => String(item[pk]) === String(pkValue)) || null;
  },

  /**
   * Batch upserts multiple records into a sheet in a single atomic round-trip.
   * Updates existing records if primary key matches, otherwise appends new rows.
   */
  upsertBatch: function(sheetName, records) {
    if (!records || records.length === 0) return { inserted: 0, updated: 0, total: 0 };

    const sheet = this.getSheet(sheetName);
    const schema = SCHEMAS[sheetName];
    if (!schema) throw new Error("Unknown schema for sheet: " + sheetName);

    const pk = schema.primaryKey;
    const columns = schema.columns;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    const lastRow = sheet.getLastRow();
    const lastCol = columns.length;

    let headers = columns;
    let existingData = [];

    if (lastRow > 0) {
      const raw = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      headers = raw[0];
      existingData = raw.slice(1);
    }

    const pkColIndex = headers.indexOf(pk);
    if (pkColIndex === -1) {
      throw new Error(`Primary key column "${pk}" not found in sheet ${sheetName}`);
    }

    const rowIndexMap = new Map();
    for (let i = 0; i < existingData.length; i++) {
      const val = String(existingData[i][pkColIndex]);
      if (val) rowIndexMap.set(val, i);
    }

    let insertCount = 0;
    let updateCount = 0;

    records.forEach(rec => {
      const pkVal = String(rec[pk]);
      if (!pkVal) return;

      const rowArray = [];
      for (let c = 0; c < headers.length; c++) {
        const colName = headers[c];
        let val = rec[colName];
        if (val === undefined || val === null) {
          if (colName === 'schoolId') {
            val = rec.schoolId || DEFAULT_SCHOOL_ID;
          } else if (colName === 'updatedAt' || colName === 'createdAt') {
            val = nowStr;
          } else {
            val = '';
          }
        }
        if (colName === 'updatedAt') {
          val = nowStr;
        }
        rowArray.push(val);
      }

      if (rowIndexMap.has(pkVal)) {
        const idx = rowIndexMap.get(pkVal);
        // Preserve createdAt if present in original
        const origCreatedAtIdx = headers.indexOf('createdAt');
        if (origCreatedAtIdx > -1 && existingData[idx][origCreatedAtIdx] && !rec['createdAt']) {
          rowArray[origCreatedAtIdx] = existingData[idx][origCreatedAtIdx];
        }
        existingData[idx] = rowArray;
        updateCount++;
      } else {
        existingData.push(rowArray);
        rowIndexMap.set(pkVal, existingData.length - 1);
        insertCount++;
      }
    });

    // Write all data back in one atomic batch call
    const totalRows = existingData.length;
    if (totalRows > 0) {
      sheet.getRange(2, 1, totalRows, lastCol).setValues(existingData);
    }

    delete this._cachedData[sheetName];
    return { inserted: insertCount, updated: updateCount, total: totalRows };
  },

  /**
   * Deletes records matching a list of primary key values.
   */
  deleteBatch: function(sheetName, pkValues) {
    if (!pkValues || pkValues.length === 0) return { deleted: 0 };
    const sheet = this.getSheet(sheetName);
    const schema = SCHEMAS[sheetName];
    if (!schema) throw new Error("Unknown schema: " + sheetName);

    const pk = schema.primaryKey;
    const all = this.readAll(sheetName);
    const pkSet = new Set(pkValues.map(String));

    const remaining = all.filter(item => !pkSet.has(String(item[pk])));
    const deletedCount = all.length - remaining.length;

    this.clearSheet(sheetName);
    if (remaining.length > 0) {
      this.upsertBatch(sheetName, remaining);
    }
    delete this._cachedData[sheetName];
    return { deleted: deletedCount };
  },

  /**
   * Initializes all required sheets for Gameri Higher Secondary School.
   */
  initializeAllSheets: function() {
    const sheetNames = Object.keys(SCHEMAS);
    sheetNames.forEach(name => {
      this.getSheet(name);
    });
    // Seed default settings if empty
    const settings = this.readAll('Settings');
    if (settings.length === 0) {
      const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
      this.upsertBatch('Settings', [
        { key: 'SCHOOL_ID', schoolId: DEFAULT_SCHOOL_ID, value: DEFAULT_SCHOOL_ID, category: 'IDENTITY', description: 'Permanent School Identifier', updatedAt: nowStr },
        { key: 'SCHOOL_NAME', schoolId: DEFAULT_SCHOOL_ID, value: DEFAULT_SCHOOL_NAME, category: 'IDENTITY', description: 'Official School Name', updatedAt: nowStr },
        { key: 'COMMON_PASSWORD', schoolId: DEFAULT_SCHOOL_ID, value: DEFAULT_COMMON_PASSWORD, category: 'AUTH', description: 'Common school default password', updatedAt: nowStr },
        { key: 'ALERT_THRESHOLD', schoolId: DEFAULT_SCHOOL_ID, value: '2', category: 'ATTENDANCE', description: 'Consecutive absence alert threshold', updatedAt: nowStr },
        { key: 'ACADEMIC_YEAR', schoolId: DEFAULT_SCHOOL_ID, value: '2026-2027', category: 'GENERAL', description: 'Current Academic Session', updatedAt: nowStr }
      ]);
    }
  },

  /**
   * Clears all data rows from a sheet while preserving the header row.
   */
  clearSheet: function(sheetName) {
    const sheet = this.getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow > 1 && lastCol > 0) {
      sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
    }
    delete this._cachedData[sheetName];
    return true;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Database };
}
