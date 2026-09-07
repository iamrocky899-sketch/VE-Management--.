/**
 * VE MANAGEMENT — Offline-First Cloud Synchronization Engine
 * School: Gameri Higher Secondary School, Gamiri
 * Supports delta batch uploads, timestamp-based delta downloads, deduplication, and retry idempotence.
 */

const SyncApi = {

  /**
   * Batch uploads pending local changes from the Android Admin App.
   */
  upload: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL', 'TEACHER'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Sync upload permission denied' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const clientTimestamp = payload.clientSyncTimestamp || nowStr;
    const clientVersion = payload.clientVersion || '5.7';
    const syncId = payload.syncId || Auth.generateId('SYN');

    const results = {
      syncId: syncId,
      processedAt: nowStr,
      entities: {}
    };

    let totalBatchSize = 0;
    const errors = [];

    // 1. Students
    if (payload.students && Array.isArray(payload.students)) {
      try {
        const studentRes = AcademicApi.saveStudents(session, { students: payload.students });
        results.entities.students = studentRes.data ? studentRes.data.result : { count: payload.students.length };
        totalBatchSize += payload.students.length;

        // Auto-provision parent accounts
        AdminApi.provisionParentsFromStudents(payload.students, session.role, session.userId, schoolId);
      } catch (e) {
        errors.push(`Students sync error: ${e.message}`);
      }
    }

    // 2. Attendance (Attendance 2.0 compatible)
    if (payload.attendance) {
      try {
        const attRes = AcademicApi.saveAttendance(session, { attendance: payload.attendance });
        results.entities.attendance = attRes.data ? attRes.data.result : {};
        totalBatchSize += (Array.isArray(payload.attendance) ? payload.attendance.length : Object.keys(payload.attendance).length);
      } catch (e) {
        errors.push(`Attendance sync error: ${e.message}`);
      }
    }

    // 3. Marks
    if (payload.marks) {
      try {
        const markRes = AcademicApi.saveMarks(session, { marks: payload.marks });
        results.entities.marks = markRes.data ? markRes.data.result : {};
        totalBatchSize += (Array.isArray(payload.marks) ? payload.marks.length : Object.keys(payload.marks).length);
      } catch (e) {
        errors.push(`Marks sync error: ${e.message}`);
      }
    }

    // 4. Activities
    if (payload.activities && Array.isArray(payload.activities)) {
      try {
        const actRes = AcademicApi.saveActivities(session, { activities: payload.activities });
        results.entities.activities = actRes.data ? actRes.data.result : {};
        totalBatchSize += payload.activities.length;
      } catch (e) {
        errors.push(`Activities sync error: ${e.message}`);
      }
    }

    // 5. Notes
    if (payload.notes && Array.isArray(payload.notes)) {
      try {
        payload.notes.forEach(function(n) {
          AcademicApi.saveNotes(session, n);
        });
        results.entities.notes = { count: payload.notes.length };
        totalBatchSize += payload.notes.length;
      } catch (e) {
        errors.push(`Notes sync error: ${e.message}`);
      }
    }

    // 6. Notices
    if (payload.notices && Array.isArray(payload.notices)) {
      try {
        const ntcRes = AcademicApi.saveNotices(session, { notices: payload.notices });
        results.entities.notices = ntcRes.data ? ntcRes.data.result : {};
        totalBatchSize += payload.notices.length;
      } catch (e) {
        errors.push(`Notices sync error: ${e.message}`);
      }
    }

    // Record Sync Transaction in SyncMetadata
    const syncRecord = {
      syncId: syncId,
      schoolId: schoolId,
      clientSyncTimestamp: clientTimestamp,
      batchSize: totalBatchSize,
      entityType: Object.keys(results.entities).join(','),
      status: errors.length === 0 ? 'SUCCESS' : 'PARTIAL_ERROR',
      processedAt: nowStr,
      clientVersion: clientVersion,
      errors: errors.join('; ')
    };

    Database.upsertBatch('SyncMetadata', [syncRecord]);
    Audit.log('SYNC_UPLOAD', session.role, session.userId, { syncId: syncId, batchSize: totalBatchSize, status: syncRecord.status }, syncRecord.status, '', schoolId);

    return {
      success: errors.length === 0,
      data: results,
      error: errors.length > 0 ? { code: 'SYNC_WARNINGS', message: errors.join(', ') } : null
    };
  },

  /**
   * Delta downloads cloud modifications since a specified timestamp.
   */
  download: function(session, query) {
    query = query || {};
    const since = query.since || query.lastSyncTimestamp || '1970-01-01T00:00:00Z';
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    const filterSince = function(items) {
      if (!since || since === '1970-01-01T00:00:00Z') return items;
      return items.filter(item => (item.updatedAt || item.createdAt || '') >= since);
    };

    const students = filterSince(Security.filterStudentsForSession(session, Database.readAll('Students')));
    const attendance = filterSince(Security.filterAttendanceForSession(session, Database.readAll('Attendance')));
    const marks = filterSince(Security.filterMarksForSession(session, Database.readAll('Marks')));
    const notes = filterSince(Security.filterNotesForSession(session, Database.readAll('Notes')));
    const activities = filterSince(Database.readAll('Activities'));
    const notices = filterSince(Security.filterNoticesForSession(session, Database.readAll('Notices')));
    const calendar = filterSince(Database.readAll('Calendar'));
    const settings = Database.readAll('Settings');

    return {
      success: true,
      data: {
        serverTimestamp: nowStr,
        since: since,
        students: students,
        attendance: attendance,
        marks: marks,
        notes: notes,
        activities: activities,
        notices: notices,
        calendar: calendar,
        settings: settings
      }
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SyncApi };
}
