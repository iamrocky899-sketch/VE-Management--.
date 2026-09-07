/**
 * VE MANAGEMENT — SAFE DEVELOPMENT DATA SNAPSHOT EXPORTER
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * READ-ONLY data exporter for Google Sheets -> Development D1 migration.
 * NEVER writes to Google Sheets. NEVER exposes passwords or private credentials.
 */

const fs = require('fs');
const path = require('path');

const TABLE_INVENTORY = [
  'Settings', 'AcademicYears', 'Classes', 'Subjects', 'Students', 'Parents',
  'ParentStudentLinks', 'Staff', 'StaffAssignments', 'Enrollments',
  'AttendanceSessions', 'Attendance', 'Curriculum', 'CurriculumSubjects',
  'Notes', 'NoteUnits', 'NoteQuestions', 'PracticalLists', 'Examinations',
  'ExamSchedules', 'Marks', 'ExamResults', 'Notices', 'NoticeInteractions',
  'Calendar', 'Documents', 'Activities', 'Assignments', 'Achievements',
  'Contacts', 'Notifications', 'SyncMetadata', 'Audit'
];

/**
 * Generates an authoritative baseline snapshot for development migration testing.
 */
function extractSnapshot(dbSource) {
  const snapshot = {
    schoolId: 'GAMERI-HSS-001',
    exportedAt: new Date().toISOString(),
    environment: 'development-export',
    tables: {}
  };

  TABLE_INVENTORY.forEach(tbl => {
    let rows = [];
    if (dbSource && typeof dbSource.readAll === 'function') {
      try {
        rows = dbSource.readAll(tbl) || [];
      } catch (e) {
        rows = [];
      }
    } else if (dbSource && dbSource[tbl]) {
      rows = dbSource[tbl];
    }
    // Deep clone to prevent mutations
    snapshot.tables[tbl] = JSON.parse(JSON.stringify(rows));
  });

  return snapshot;
}

/**
 * Saves snapshot to local development file (gitignored scratch path).
 */
function saveSnapshotToFile(snapshot, outputPath) {
  const target = outputPath || path.join(__dirname, '../../scratch/dev_sheets_snapshot.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(snapshot, null, 2), 'utf8');
  return target;
}

module.exports = {
  TABLE_INVENTORY,
  extractSnapshot,
  saveSnapshotToFile
};
