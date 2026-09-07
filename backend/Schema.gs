/**
 * VE MANAGEMENT — Single School Cloud Backend (Gameri Higher Secondary School, Gamiri)
 * Google Sheets Schema Definitions & Column Mappings (20 Tables)
 */

const SCHEMAS = {
  Settings: {
    sheetName: 'Settings',
    primaryKey: 'key',
    columns: [
      'key', 'schoolId', 'value', 'category', 'description', 'updatedAt'
    ]
  },
  Students: {
    sheetName: 'Students',
    primaryKey: 'studentId',
    columns: [
      'studentId', 'schoolId', 'admissionNo', 'studentName', 'rollNo', 'class', 'section',
      'gender', 'dob', 'fatherName', 'motherName', 'mobile',
      'aadhaar', 'village', 'address', 'district', 'state', 'pinCode',
      'category', 'bloodGroup', 'stream', 'admissionDate',
      'status', 'createdAt', 'updatedAt'
    ]
  },
  Parents: {
    sheetName: 'Parents',
    primaryKey: 'parentId',
    columns: [
      'parentId', 'schoolId', 'mobile', 'parentName', 'passwordHash', 'salt',
      'isCustomPassword', 'status', 'createdAt', 'updatedAt'
    ]
  },
  ParentStudentLinks: {
    sheetName: 'ParentStudentLinks',
    primaryKey: 'linkId',
    columns: [
      'linkId', 'schoolId', 'parentId', 'studentId', 'relationship', 'active',
      'createdAt', 'updatedAt'
    ]
  },
  Staff: {
    sheetName: 'Staff',
    primaryKey: 'staffId',
    columns: [
      'staffId', 'schoolId', 'employeeId', 'staffName', 'firstName', 'middleName', 'lastName',
      'role', 'gender', 'dob', 'mobile', 'email', 'address', 'village', 'district', 'state', 'pinCode',
      'designation', 'department', 'employmentType', 'joiningDate',
      'qualification', 'specialization', 'stream',
      'assignedClasses', 'assignedSubjects', 'passwordHash', 'salt',
      'isCustomPassword', 'status', 'createdAt', 'updatedAt'
    ]
  },
  Attendance: {
    sheetName: 'Attendance',
    primaryKey: 'attendanceId',
    columns: [
      'attendanceId', 'schoolId', 'studentId', 'academicYear', 'sessionId',
      'date', 'class', 'section', 'subject', 'component', 'period',
      'teacherId', 'status', 'source', 'reason', 'correctedBy', 'correctedAt', 'updatedAt'
    ]
  },
  AttendanceSessions: {
    sheetName: 'AttendanceSessions',
    primaryKey: 'sessionId',
    columns: [
      'sessionId', 'schoolId', 'academicYear', 'date', 'class', 'section',
      'stream', 'subjectId', 'subjectName', 'component', 'period',
      'teacherId', 'teacherName', 'status', 'source', 'totalStudents',
      'presentCount', 'absentCount', 'lateCount', 'leaveCount',
      'isLocked', 'lockedBy', 'lockedAt', 'createdAt', 'updatedAt'
    ]
  },
  Marks: {
    sheetName: 'Marks',
    primaryKey: 'markId',
    columns: [
      'markId', 'schoolId', 'studentId', 'academicYear', 'class', 'section',
      'exam', 'subject', 'component', 'theory', 'practical', 'total',
      'maxMarks', 'status', 'reason', 'correctedBy', 'correctedAt', 'updatedAt'
    ]
  },
  Notes: {
    sheetName: 'Notes',
    primaryKey: 'noteId',
    columns: [
      'noteId', 'schoolId', 'title', 'class', 'subject', 'teacherId',
      'teacherName', 'visibility', 'createdAt', 'updatedAt'
    ]
  },
  NoteUnits: {
    sheetName: 'NoteUnits',
    primaryKey: 'unitId',
    columns: [
      'unitId', 'schoolId', 'noteId', 'unitNumber', 'unitTitle',
      'description', 'contentUrl', 'order', 'updatedAt'
    ]
  },
  NoteQuestions: {
    sheetName: 'NoteQuestions',
    primaryKey: 'questionId',
    columns: [
      'questionId', 'schoolId', 'unitId', 'questionText', 'answerText',
      'marks', 'type', 'order', 'updatedAt'
    ]
  },
  Activities: {
    sheetName: 'Activities',
    primaryKey: 'activityId',
    columns: [
      'activityId', 'schoolId', 'title', 'description', 'date', 'category',
      'class', 'section', 'visibility', 'createdAt', 'updatedAt'
    ]
  },
  Assignments: {
    sheetName: 'Assignments',
    primaryKey: 'assignmentId',
    columns: [
      'assignmentId', 'schoolId', 'title', 'description', 'class', 'section',
      'subject', 'assignedDate', 'dueDate', 'maxMarks', 'status',
      'createdAt', 'updatedAt'
    ]
  },
  Notices: {
    sheetName: 'Notices',
    primaryKey: 'noticeId',
    columns: [
      'noticeId', 'schoolId', 'academicYear', 'title', 'summary', 'body', 'date', 'priority',
      'visibility', 'noticeType', 'audienceType', 'class', 'section', 'stream',
      'studentScope', 'staffScope', 'status', 'publishAt', 'expiryAt', 'publishedBy',
      'createdBy', 'isAcknowledgementRequired', 'attachmentUrl', 'createdAt', 'updatedAt'
    ]
  },
  Notifications: {
    sheetName: 'Notifications',
    primaryKey: 'notificationId',
    columns: [
      'notificationId', 'schoolId', 'recipientType', 'recipientId', 'title',
      'message', 'type', 'readStatus', 'sentAt', 'readAt'
    ]
  },
  Calendar: {
    sheetName: 'Calendar',
    primaryKey: 'calendarId',
    columns: [
      'calendarId', 'schoolId', 'academicYear', 'academicSession', 'date', 'startDate',
      'endDate', 'title', 'description', 'eventType', 'classScope', 'sectionScope',
      'streamScope', 'examId', 'scheduleId', 'officialStatus', 'isWorking', 'status',
      'source', 'createdBy', 'createdAt', 'updatedAt'
    ]
  },
  Documents: {
    sheetName: 'Documents',
    primaryKey: 'documentId',
    columns: [
      'documentId', 'schoolId', 'studentId', 'academicYear', 'class',
      'documentType', 'documentNumber', 'title', 'status', 'issueDate',
      'issuedBy', 'approvedBy', 'verificationId', 'version', 'revisionOf',
      'fileReference', 'url', 'category', 'description', 'metadata',
      'visibility', 'createdAt', 'updatedAt'
    ]
  },
  Achievements: {
    sheetName: 'Achievements',
    primaryKey: 'achievementId',
    columns: [
      'achievementId', 'schoolId', 'studentId', 'title', 'description',
      'date', 'category', 'award', 'visibility', 'createdAt', 'updatedAt'
    ]
  },
  Contacts: {
    sheetName: 'Contacts',
    primaryKey: 'contactId',
    columns: [
      'contactId', 'schoolId', 'category', 'name', 'designation',
      'mobile', 'email', 'whatsapp', 'address', 'updatedAt'
    ]
  },
  SyncMetadata: {
    sheetName: 'SyncMetadata',
    primaryKey: 'syncId',
    columns: [
      'syncId', 'schoolId', 'clientSyncTimestamp', 'batchSize', 'entityType',
      'status', 'processedAt', 'clientVersion', 'errors'
    ]
  },
  Audit: {
    sheetName: 'Audit',
    primaryKey: 'logId',
    columns: [
      'logId', 'schoolId', 'timestamp', 'action', 'actorType', 'actorId',
      'details', 'status', 'ipAddress'
    ]
  },
  AcademicYears: {
    sheetName: 'AcademicYears',
    primaryKey: 'yearId',
    columns: [
      'yearId', 'schoolId', 'yearName', 'startDate', 'endDate',
      'status', 'isCurrent', 'createdAt', 'updatedAt'
    ]
  },
  Classes: {
    sheetName: 'Classes',
    primaryKey: 'classId',
    columns: [
      'classId', 'schoolId', 'className', 'gradeLevel', 'sections',
      'stream', 'status', 'order', 'updatedAt'
    ]
  },
  Subjects: {
    sheetName: 'Subjects',
    primaryKey: 'subjectId',
    columns: [
      'subjectId', 'schoolId', 'subjectCode', 'subjectName', 'class',
      'stream', 'trade', 'hasTheory', 'hasPractical',
      'theoryMaxMarks', 'practicalMaxMarks', 'maxMarks',
      'isMandatory', 'displayOrder', 'description', 'status', 'updatedAt'
    ]
  },
  Curriculum: {
    sheetName: 'Curriculum',
    primaryKey: 'curriculumId',
    columns: [
      'curriculumId', 'schoolId', 'academicYear', 'class', 'sectionScope',
      'stream', 'trade', 'curriculumName', 'version', 'status',
      'effectiveFrom', 'effectiveTo', 'createdAt', 'updatedAt'
    ]
  },
  CurriculumSubjects: {
    sheetName: 'CurriculumSubjects',
    primaryKey: 'curriculumSubjectId',
    columns: [
      'curriculumSubjectId', 'schoolId', 'curriculumId', 'subjectId',
      'subjectCode', 'subjectName', 'component', 'isMandatory', 'isOptional',
      'hasTheory', 'hasPractical', 'theoryMaxMarks', 'practicalMaxMarks',
      'totalMaxMarks', 'displayOrder', 'status', 'createdAt', 'updatedAt'
    ]
  },
  Enrollments: {
    sheetName: 'Enrollments',
    primaryKey: 'enrollmentId',
    columns: [
      'enrollmentId', 'schoolId', 'studentId', 'academicYear', 'class',
      'section', 'rollNo', 'status', 'promotionDecision', 'remarks',
      'createdAt', 'updatedAt'
    ]
  },
  Examinations: {
    sheetName: 'Examinations',
    primaryKey: 'examId',
    columns: [
      'examId', 'schoolId', 'academicYear', 'class', 'sectionScope', 'stream', 'trade',
      'examName', 'examType', 'startDate', 'endDate', 'status',
      'isLocked', 'lockedBy', 'lockedAt', 'publishedAt', 'archivedAt',
      'createdAt', 'updatedAt'
    ]
  },
  ExamResults: {
    sheetName: 'ExamResults',
    primaryKey: 'resultId',
    columns: [
      'resultId', 'schoolId', 'studentId', 'academicYear', 'class', 'section', 'stream',
      'examId', 'examName', 'totalMarks', 'maxMarks', 'percentage', 'grade',
      'resultStatus', 'evaluatedSubjectsCount', 'passedSubjectsCount',
      'revision', 'revisionReason', 'revisedBy', 'revisedAt', 'publishedAt', 'updatedAt'
    ]
  },
  ExamSchedules: {
    sheetName: 'ExamSchedules',
    primaryKey: 'scheduleId',
    columns: [
      'scheduleId', 'schoolId', 'examId', 'academicYear', 'class', 'section',
      'subjectId', 'subjectCode', 'subjectName', 'component', 'examDate',
      'startTime', 'endTime', 'venue', 'instructions', 'status',
      'createdAt', 'updatedAt'
    ]
  },
  StaffAssignments: {
    sheetName: 'StaffAssignments',
    primaryKey: 'assignmentId',
    columns: [
      'assignmentId', 'schoolId', 'staffId', 'academicYear', 'class',
      'section', 'subject', 'component', 'assignmentType', 'status',
      'startDate', 'endDate', 'remarks', 'createdAt', 'updatedAt'
    ]
  },
  NoticeInteractions: {
    sheetName: 'NoticeInteractions',
    primaryKey: 'interactionId',
    columns: [
      'interactionId', 'schoolId', 'noticeId', 'userId', 'role', 'isRead',
      'readAt', 'isAcknowledged', 'acknowledgedAt', 'updatedAt'
    ]
  }
};

const DEFAULT_SCHOOL_ID = 'GAMERI-HSS-001';
const DEFAULT_SCHOOL_NAME = 'Gameri Higher Secondary School, Gamiri';
const DEFAULT_COMMON_PASSWORD = '12345';
const DEFAULT_PARENT_PASSWORD = '12345';

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SCHEMAS,
    DEFAULT_SCHOOL_ID,
    DEFAULT_SCHOOL_NAME,
    DEFAULT_COMMON_PASSWORD,
    DEFAULT_PARENT_PASSWORD
  };
}
