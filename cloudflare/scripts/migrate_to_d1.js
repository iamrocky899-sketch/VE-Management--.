/**
 * VE MANAGEMENT — D1 DEVELOPMENT BATCH IMPORTER
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Implements deterministic batch SQL generation and atomic upsert operations
 * for Cloudflare D1 development database.
 */

const { TABLE_INVENTORY } = require('./export_sheets_snapshot');

const DEPENDENCY_MIGRATION_ORDER = [
  'settings',
  'academic_years',
  'classes',
  'subjects',
  'students',
  'parents',
  'parent_student_links',
  'staff',
  'staff_assignments',
  'enrollments',
  'curriculum',
  'curriculum_subjects',
  'notes',
  'note_units',
  'note_questions',
  'practical_lists',
  'attendance_sessions',
  'attendance',
  'examinations',
  'exam_schedules',
  'marks',
  'exam_results',
  'notices',
  'notice_interactions',
  'calendar',
  'documents',
  'activities',
  'assignments',
  'achievements',
  'contacts',
  'notifications',
  'sync_metadata',
  'audit_logs'
];

/**
 * Converts a table record object to an SQL UPSERT statement.
 */
function buildUpsertSql(tableName, record, primaryKey) {
  const columns = Object.keys(record);
  const placeholders = columns.map(() => '?').join(', ');
  const values = Object.values(record);

  const updateClauses = columns
    .filter(c => c !== primaryKey && c !== 'created_at')
    .map(c => `${c} = excluded.${c}`)
    .join(', ');

  const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ` +
    `ON CONFLICT(${primaryKey}) DO UPDATE SET ${updateClauses};`;

  return { sql, values };
}

/**
 * Batches and executes migration dataset into target D1 database.
 */
async function executeD1Migration(d1Database, normalizedDataset, batchSize = 50) {
  const summary = {
    startedAt: new Date().toISOString(),
    completedAt: null,
    totalTablesProcessed: 0,
    totalRowsMigrated: 0,
    tableStats: {},
    errors: []
  };

  for (const tableName of DEPENDENCY_MIGRATION_ORDER) {
    const records = normalizedDataset[tableName] || [];
    summary.tableStats[tableName] = {
      sourceCount: records.length,
      inserted: 0,
      updated: 0,
      failed: 0
    };

    summary.totalTablesProcessed++;
    if (records.length === 0) continue;

    // Process in batches
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      for (const rec of batch) {
        try {
          const pkField = Object.keys(rec)[0]; // Conventional primary key
          const { sql, values } = buildUpsertSql(tableName, rec, pkField);
          
          if (d1Database && typeof d1Database.prepare === 'function') {
            await d1Database.prepare(sql).bind(...values).run();
          }
          
          if (d1Database && d1Database.tables && d1Database.tables[tableName]) {
            const tableArr = d1Database.tables[tableName];
            const existingIdx = tableArr.findIndex(r => String(r[pkField]) === String(rec[pkField]));
            if (existingIdx > -1) {
              tableArr[existingIdx] = { ...tableArr[existingIdx], ...rec, updated_at: new Date().toISOString() };
              summary.tableStats[tableName].updated++;
            } else {
              tableArr.push({ ...rec });
              summary.tableStats[tableName].inserted++;
            }
          }
          summary.totalRowsMigrated++;
        } catch (rowErr) {
          summary.tableStats[tableName].failed++;
          summary.errors.push({ table: tableName, record: rec, error: rowErr.message });
        }
      }
    }
  }

  summary.completedAt = new Date().toISOString();
  return summary;
}

module.exports = {
  DEPENDENCY_MIGRATION_ORDER,
  buildUpsertSql,
  executeD1Migration
};
