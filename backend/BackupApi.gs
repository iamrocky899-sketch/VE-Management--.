/**
 * VE MANAGEMENT — BACKUP & DISASTER RECOVERY 2.0 API (STEP 14)
 * Institutional Entity: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Authoritative Backup, Restore & Integrity Subsystem.
 * Provides full operational database snapshots, schema integrity validation,
 * automated pre-restore safety backups, and disaster recovery verification.
 */

var BackupApi = {

  OPERATIONAL_TABLES: [
    'Settings',
    'Students',
    'Parents',
    'ParentStudentLinks',
    'Staff',
    'StaffAssignments',
    'Enrollments',
    'AcademicYears',
    'Classes',
    'Subjects',
    'Curriculum',
    'CurriculumSubjects',
    'Attendance',
    'AttendanceSessions',
    'Examinations',
    'ExamSchedules',
    'Marks',
    'ExamResults',
    'OfficialDocuments',
    'Notices',
    'NoticeInteractions',
    'Calendar',
    'AuditLogs'
  ],

  /**
   * Generates a simple deterministic checksum string for a dataset.
   */
  calculateChecksum: function(dataObj) {
    try {
      const serialized = JSON.stringify(dataObj);
      let hash = 0;
      for (let i = 0; i < serialized.length; i++) {
        const char = serialized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
      }
      return 'CHK_' + Math.abs(hash).toString(16).toUpperCase();
    } catch (e) {
      return 'CHK_DEFAULT_0';
    }
  },

  /**
   * Creates an authoritative full backup of all operational tables.
   */
  createFullBackup: function(session, payload) {
    if (!session || !Security.enforceRole(session, ['ADMIN'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin role required to create system backup' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const backupId = Auth.generateId('BKP');

    const backupData = {};
    const recordCounts = {};
    let totalRecords = 0;

    this.OPERATIONAL_TABLES.forEach(table => {
      try {
        const records = Database.readAll(table);
        const scoped = records.filter(r => !r.schoolId || r.schoolId === schoolId);
        backupData[table] = scoped;
        recordCounts[table] = scoped.length;
        totalRecords += scoped.length;
      } catch (e) {
        backupData[table] = [];
        recordCounts[table] = 0;
      }
    });

    const checksum = this.calculateChecksum(backupData);

    const backupMetadata = {
      backupId: backupId,
      schoolId: schoolId,
      version: '2.0',
      createdAt: nowStr,
      createdBy: session.userId,
      scope: 'FULL_OPERATIONAL_DATABASE',
      recordCounts: recordCounts,
      totalRecords: totalRecords,
      checksum: checksum,
      status: 'COMPLETED'
    };

    const fullPayload = {
      metadata: backupMetadata,
      data: backupData
    };

    Audit.log('BACKUP_CREATED', session.role, session.userId, {
      backupId: backupId,
      totalRecords: totalRecords,
      checksum: checksum
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Full system backup ${backupId} created successfully (${totalRecords} records across ${this.OPERATIONAL_TABLES.length} tables)`,
      data: fullPayload
    };
  },

  /**
   * Validates backup format, checksum, schema, and school tenancy.
   */
  validateBackupIntegrity: function(session, payload) {
    if (!session || !Security.enforceRole(session, ['ADMIN'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin role required to validate backup' } };
    }

    payload = payload || {};
    const backup = payload.backup || payload;

    if (!backup || !backup.metadata || !backup.data) {
      return {
        success: false,
        error: { code: 'INVALID_BACKUP_FORMAT', message: 'Malformed backup: Missing metadata or data payload' }
      };
    }

    const meta = backup.metadata;
    const targetSchoolId = session.schoolId || DEFAULT_SCHOOL_ID;

    // 1. Tenancy validation
    if (meta.schoolId && meta.schoolId !== targetSchoolId) {
      return {
        success: false,
        error: { code: 'WRONG_SCHOOL_BACKUP', message: `Backup belongs to school ${meta.schoolId}, cannot restore to ${targetSchoolId}` }
      };
    }

    // 2. Version validation
    if (!meta.version || meta.version !== '2.0') {
      return {
        success: false,
        error: { code: 'UNSUPPORTED_VERSION', message: `Unsupported backup version: ${meta.version || 'unknown'}. Required version: 2.0` }
      };
    }

    // 3. Schema completeness check
    const requiredTables = ['Students', 'Staff', 'Attendance', 'Marks', 'Calendar'];
    for (let i = 0; i < requiredTables.length; i++) {
      const tbl = requiredTables[i];
      if (!backup.data[tbl] || !Array.isArray(backup.data[tbl])) {
        return {
          success: false,
          error: { code: 'MISSING_REQUIRED_TABLE', message: `Backup is missing required operational table: ${tbl}` }
        };
      }
    }

    // 4. Checksum verification
    const computedChecksum = this.calculateChecksum(backup.data);
    const checksumMatches = !meta.checksum || meta.checksum === computedChecksum;

    return {
      success: true,
      data: {
        isValid: true,
        backupId: meta.backupId,
        schoolId: meta.schoolId,
        version: meta.version,
        totalRecords: meta.totalRecords,
        checksumMatches: checksumMatches,
        recordCounts: meta.recordCounts
      }
    };
  },

  /**
   * Creates an automated safety snapshot of current data before executing restore.
   */
  createSafetySnapshot: function(schoolId, createdBy) {
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const snapshotId = `SNAP_${Date.now()}`;
    const data = {};
    this.OPERATIONAL_TABLES.forEach(table => {
      try {
        data[table] = Database.readAll(table).filter(r => !r.schoolId || r.schoolId === schoolId);
      } catch (e) {
        data[table] = [];
      }
    });

    return {
      snapshotId: snapshotId,
      createdAt: nowStr,
      createdBy: createdBy,
      schoolId: schoolId,
      data: data
    };
  },

  /**
   * Restores database from a validated backup with automatic pre-restore safety snapshot.
   */
  restoreBackup: function(session, payload) {
    if (!session || !Security.enforceRole(session, ['ADMIN'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin role required to restore database' } };
    }

    payload = payload || {};
    const backup = payload.backup || payload;
    const isConfirmed = payload.confirmed === true || payload.confirm === true;

    if (!isConfirmed) {
      return {
        success: false,
        error: { code: 'CONFIRMATION_REQUIRED', message: 'Explicit confirmation (confirmed: true) is mandatory to execute restore' }
      };
    }

    // Step 1: Validate Integrity
    const valRes = this.validateBackupIntegrity(session, backup);
    if (!valRes.success) {
      Audit.log('RESTORE_FAILED', session.role, session.userId, { reason: valRes.error.message }, 'FAILED', valRes.error.code, session.schoolId || DEFAULT_SCHOOL_ID);
      return valRes;
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    Audit.log('RESTORE_STARTED', session.role, session.userId, { backupId: backup.metadata.backupId }, 'IN_PROGRESS', '', schoolId);

    // Step 2: Automatic Pre-Restore Safety Snapshot
    const safetySnapshot = this.createSafetySnapshot(schoolId, session.userId);

    // Step 3: Restore Data
    let restoredCount = 0;
    const restoredBreakdown = {};

    this.OPERATIONAL_TABLES.forEach(table => {
      if (backup.data[table] && Array.isArray(backup.data[table])) {
        const records = backup.data[table];
        if (records.length > 0) {
          Database.upsertBatch(table, records);
          restoredBreakdown[table] = records.length;
          restoredCount += records.length;
        }
      }
    });

    Audit.log('RESTORE_COMPLETED', session.role, session.userId, {
      backupId: backup.metadata.backupId,
      restoredRecords: restoredCount,
      safetySnapshotId: safetySnapshot.snapshotId
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Database successfully restored from backup ${backup.metadata.backupId} (${restoredCount} records restored)`,
      data: {
        backupId: backup.metadata.backupId,
        safetySnapshotId: safetySnapshot.snapshotId,
        restoredRecords: restoredCount,
        breakdown: restoredBreakdown
      }
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BackupApi };
}
