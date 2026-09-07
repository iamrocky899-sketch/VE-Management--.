/**
 * VE MANAGEMENT — Academic & Core Entity API Handlers
 * School: Gameri Higher Secondary School, Gamiri
 * Implements Students, Attendance (2.0 compatible), Marks, Notes/Units/Questions, Activities, Assignments, Notices, Calendar, Docs, Achievements.
 */

const AcademicApi = {

  // ==========================================
  // 1. STUDENTS
  // ==========================================

  /**
   * Authoritative helper to format a student's full display name.
   * Handles fullName, studentName, name, and split firstName/middleName/lastName fields.
   */
  getStudentDisplayName: function(student) {
    if (!student) return 'Student';
    if (typeof student === 'string') {
      const trimmed = student.trim();
      return trimmed || 'Student';
    }
    
    // Check explicit name fields first
    const directName = student.studentName || student.fullName || student.name;
    if (directName && typeof directName === 'string' && directName.trim().length > 0) {
      return directName.trim().replace(/\s+/g, ' ');
    }

    // Check composite parts: firstName, middleName, lastName
    const parts = [];
    if (student.firstName && typeof student.firstName === 'string') parts.push(student.firstName.trim());
    if (student.middleName && typeof student.middleName === 'string') parts.push(student.middleName.trim());
    if (student.lastName && typeof student.lastName === 'string') parts.push(student.lastName.trim());

    if (parts.length > 0) {
      return parts.join(' ').replace(/\s+/g, ' ').trim();
    }

    // Fallback to roll or id if available
    if (student.rollNo || student.roll) {
      return `Roll ${student.rollNo || student.roll}`;
    }
    if (student.studentId || student.id) {
      return String(student.studentId || student.id);
    }
    return 'Student';
  },

  /**
   * Maps an academic class to the authoritative Vocational Certificate Level.
   * Invariants: Class IX -> Level 1, Class X -> Level 2, Class XI -> Level 3, Class XII -> Level 4.
   */
  getCertificateLevel: function(className) {
    if (!className) return 'Level 1';
    const str = String(className).trim().toUpperCase();
    if (str === '9' || str === 'IX' || str.includes('CLASS 9') || str.includes('CLASS IX')) return 'Level 1';
    if (str === '10' || str === 'X' || str.includes('CLASS 10') || str.includes('CLASS X')) return 'Level 2';
    if (str === '11' || str === 'XI' || str.includes('CLASS 11') || str.includes('CLASS XI')) return 'Level 3';
    if (str === '12' || str === 'XII' || str.includes('CLASS 12') || str.includes('CLASS XII')) return 'Level 4';
    return 'Level 1';
  },

  /**
   * Sanitizes a student object to ensure no biometric or internal security data is exposed.
   */
  sanitizeStudent: function(student) {
    if (!student) return null;
    const clean = Object.assign({}, student);
    delete clean.faceEmbedding;
    delete clean.faces;
    delete clean.descriptor;
    delete clean.descriptors;
    delete clean.landmarks;
    delete clean.biometrics;
    delete clean.biometricData;
    delete clean.passwordHash;
    delete clean.salt;
    delete clean.aadhaar;
    return clean;
  },

  getStudents: function(session, query) {
    query = query || {};
    const allStudents = Database.readAll('Students');
    let filtered = Security.filterStudentsForSession(session, allStudents);

    if (query.class) filtered = filtered.filter(s => String(s.class) === String(query.class));
    if (query.section) filtered = filtered.filter(s => String(s.section) === String(query.section));
    if (query.status) filtered = filtered.filter(s => String(s.status) === String(query.status));

    const sanitized = filtered.map(AcademicApi.sanitizeStudent);

    return {
      success: true,
      data: {
        students: sanitized,
        total: sanitized.length
      }
    };
  },

  saveStudents: function(session, payload) {
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Write permission denied for Students' } };
    }

    const students = Array.isArray(payload.students) ? payload.students : [payload];
    const records = [];
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const studentId = s.studentId || s.id || Auth.generateId('STU');

      // Authorization check for teachers
      if (session.role === 'TEACHER' && !Security.canAccessStudent(session, studentId, s.class)) {
        return { success: false, error: { code: 'FORBIDDEN', message: `Teacher cannot modify student outside assigned class: ${studentId}` } };
      }

      records.push({
        studentId: studentId,
        schoolId: session.schoolId || DEFAULT_SCHOOL_ID,
        studentName: s.studentName || s.name || '',
        rollNo: s.rollNo || s.roll || '',
        class: String(s.class || '9'),
        section: String(s.section || 'A'),
        gender: s.gender || 'Male',
        dob: s.dob || '',
        fatherName: s.fatherName || s.father || '',
        motherName: s.motherName || s.mother || '',
        mobile: s.mobile || '',
        aadhaar: s.aadhaar || '',
        village: s.village || '',
        status: s.status || 'Active',
        createdAt: s.createdAt || nowStr,
        updatedAt: nowStr
      });
    }

    const result = Database.upsertBatch('Students', records);
    Audit.log('SAVE_STUDENTS', session.role, session.userId, { count: records.length }, 'SUCCESS', '', session.schoolId);

    return {
      success: true,
      data: {
        result: result,
        records: records
      }
    };
  },

  // ==========================================
  // 2. ATTENDANCE (Attendance 2.0 Subsystem)
  // ==========================================

  getAttendance: function(session, query) {
    if (typeof AttendanceApi !== 'undefined' && AttendanceApi.getAttendance) {
      return AttendanceApi.getAttendance(session, query);
    }
    query = query || {};
    const allAttendance = Database.readAll('Attendance');
    let filtered = Security.filterAttendanceForSession(session, allAttendance);
    if (query.studentId) filtered = filtered.filter(a => String(a.studentId) === String(query.studentId));
    if (query.date) filtered = filtered.filter(a => String(a.date) === String(query.date));
    if (query.startDate && query.endDate) {
      filtered = filtered.filter(a => a.date >= query.startDate && a.date <= query.endDate);
    }
    if (query.class) filtered = filtered.filter(a => String(a.class) === String(query.class));
    return { success: true, data: { attendance: filtered, total: filtered.length } };
  },

  saveAttendance: function(session, payload) {
    if (typeof AttendanceApi !== 'undefined' && AttendanceApi.saveAttendance) {
      return AttendanceApi.saveAttendance(session, payload);
    }
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Write permission denied for Attendance' } };
    }
    return { success: true, message: 'Saved attendance successfully' };
  },

  getAttendanceSessions: function(session, query) {
    return AttendanceApi.getAttendanceSessions(session, query);
  },

  correctAttendanceRecord: function(session, payload) {
    return AttendanceApi.correctAttendanceRecord(session, payload);
  },

  setAttendanceSessionLock: function(session, payload) {
    return AttendanceApi.setAttendanceSessionLock(session, payload);
  },

  getAttendanceMetrics: function(session, query) {
    return AttendanceApi.getAttendanceMetrics(session, query);
  },

  syncOfflineAttendance: function(session, payload) {
    return AttendanceApi.syncOfflineAttendance(session, payload);
  },

  // ==========================================
  // 3. MARKS & EXAMINATION RESULTS (Examination 2.0 Subsystem)
  // ==========================================

  getMarks: function(session, query) {
    if (typeof ExaminationApi !== 'undefined' && ExaminationApi.getMarks) {
      return ExaminationApi.getMarks(session, query);
    }
    query = query || {};
    const allMarks = Database.readAll('Marks');
    let filtered = Security.filterMarksForSession(session, allMarks);
    if (query.studentId) filtered = filtered.filter(m => String(m.studentId) === String(query.studentId));
    if (query.exam) filtered = filtered.filter(m => String(m.exam) === String(query.exam));
    if (query.subject) filtered = filtered.filter(m => String(m.subject) === String(query.subject));
    return { success: true, data: { marks: filtered, total: filtered.length } };
  },

  saveMarks: function(session, payload) {
    if (typeof ExaminationApi !== 'undefined' && ExaminationApi.saveMarks) {
      return ExaminationApi.saveMarks(session, payload);
    }
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Write permission denied for Marks' } };
    }
    return { success: true, message: 'Saved marks successfully' };
  },

  // ==========================================
  // 4. NOTES, NOTE UNITS & NOTE QUESTIONS
  // ==========================================

  getNotes: function(session, query) {
    query = query || {};
    const allNotes = Database.readAll('Notes');
    let filteredNotes = Security.filterNotesForSession(session, allNotes);

    if (query.class) filteredNotes = filteredNotes.filter(n => String(n.class) === String(query.class));
    if (query.subject) filteredNotes = filteredNotes.filter(n => String(n.subject) === String(query.subject));
    if (query.noteId) filteredNotes = filteredNotes.filter(n => String(n.noteId) === String(query.noteId));

    const allUnits = Database.readAll('NoteUnits');
    const allQuestions = Database.readAll('NoteQuestions');

    const enriched = filteredNotes.map(function(note) {
      const units = allUnits.filter(u => String(u.noteId) === String(note.noteId)).sort((a, b) => (a.order || 0) - (b.order || 0));
      const enrichedUnits = units.map(function(unit) {
        const questions = allQuestions.filter(q => String(q.unitId) === String(unit.unitId)).sort((a, b) => (a.order || 0) - (b.order || 0));
        return Object.assign({}, unit, { questions: questions });
      });
      return Object.assign({}, note, { units: enrichedUnits });
    });

    return {
      success: true,
      data: {
        notes: enriched,
        total: enriched.length
      }
    };
  },

  saveNotes: function(session, payload) {
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Write permission denied for Notes' } };
    }

    if (session.role === 'TEACHER') {
      if (payload.class && !Security.canAccessClass(session, payload.class)) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Write permission denied for unassigned class: ' + payload.class } };
      }
      if (payload.subject && !Security.canTeacherManageSubject(session, payload.subject)) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Write permission denied for unassigned subject: ' + payload.subject } };
      }
    }

    if (!payload.class || !payload.subject || !payload.title) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Class, subject, and title/category are required' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const noteId = payload.noteId || Auth.generateId('NOT');

    const noteRecord = {
      noteId: noteId,
      schoolId: schoolId,
      title: payload.title || 'Main Book',
      class: String(payload.class || '9'),
      subject: payload.subject || 'IT/ITeS',
      teacherId: session.userId,
      teacherName: payload.teacherName || session.identifier || 'Teacher',
      visibility: payload.visibility || 'PUBLIC',
      attachmentUrl: payload.attachmentUrl || payload.pdfUrl || '',
      attachmentName: payload.attachmentName || payload.pdfName || '',
      attachmentSize: parseInt(payload.attachmentSize || payload.pdfSize) || 0,
      attachmentMime: payload.attachmentMime || 'application/pdf',
      createdAt: payload.createdAt || nowStr,
      updatedAt: nowStr
    };

    Database.upsertBatch('Notes', [noteRecord]);

    if (Array.isArray(payload.units)) {
      // Fetch and clear existing units/questions for clean update
      const existingUnits = Database.readAll('NoteUnits').filter(u => String(u.noteId) === String(noteId));
      const oldUnitIds = existingUnits.map(u => u.unitId);
      if (oldUnitIds.length > 0) {
        const existingQuestions = Database.readAll('NoteQuestions').filter(q => oldUnitIds.includes(String(q.unitId)));
        const oldQIds = existingQuestions.map(q => q.questionId);
        if (oldQIds.length > 0) Database.deleteBatch('NoteQuestions', oldQIds);
        Database.deleteBatch('NoteUnits', oldUnitIds);
      }

      const unitRecords = [];
      const questionRecords = [];

      payload.units.forEach(function(unit, uIdx) {
        const unitId = unit.unitId || Auth.generateId('UNT');
        unitRecords.push({
          unitId: unitId,
          schoolId: schoolId,
          noteId: noteId,
          unitNumber: unit.unitNumber || (uIdx + 1),
          unitTitle: unit.unitTitle || `Unit ${uIdx + 1}`,
          description: unit.description || '',
          contentUrl: unit.contentUrl || '',
          attachmentUrl: unit.attachmentUrl || unit.pdfUrl || '',
          attachmentName: unit.attachmentName || unit.pdfName || '',
          attachmentSize: parseInt(unit.attachmentSize || unit.pdfSize) || 0,
          order: unit.order || (uIdx + 1),
          updatedAt: nowStr
        });

        if (Array.isArray(unit.questions)) {
          unit.questions.forEach(function(q, qIdx) {
            questionRecords.push({
              questionId: q.questionId || Auth.generateId('QST'),
              schoolId: schoolId,
              unitId: unitId,
              questionText: q.questionText || '',
              answerText: q.answerText || '',
              marks: q.marks || 1,
              type: q.type || 'SHORT_ANSWER',
              order: q.order || (qIdx + 1),
              updatedAt: nowStr
            });
          });
        }
      });

      if (unitRecords.length > 0) Database.upsertBatch('NoteUnits', unitRecords);
      if (questionRecords.length > 0) Database.upsertBatch('NoteQuestions', questionRecords);
    }

    Audit.log('SAVE_NOTE', session.role, session.userId, { noteId: noteId, title: noteRecord.title }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      data: {
        noteId: noteId,
        message: 'Note and hierarchy saved successfully'
      }
    };
  },

  deleteNote: function(session, payload) {
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Delete permission denied for Notes' } };
    }
    const noteId = payload.noteId || payload.id;
    if (!noteId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'noteId is required' } };
    }
    const note = Database.findByPk('Notes', noteId);
    if (!note) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Note not found' } };
    }
    if (session.role === 'TEACHER') {
      if (note.class && !Security.canAccessClass(session, note.class)) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Delete permission denied for unassigned class: ' + note.class } };
      }
      if (note.subject && !Security.canTeacherManageSubject(session, note.subject)) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Delete permission denied for unassigned subject: ' + note.subject } };
      }
    }

    const allUnits = Database.readAll('NoteUnits').filter(u => String(u.noteId) === String(noteId));
    const unitIds = allUnits.map(u => u.unitId);
    if (unitIds.length > 0) {
      const allQuestions = Database.readAll('NoteQuestions').filter(q => unitIds.includes(String(q.unitId)));
      const questionIds = allQuestions.map(q => q.questionId);
      if (questionIds.length > 0) {
        Database.deleteBatch('NoteQuestions', questionIds);
      }
      Database.deleteBatch('NoteUnits', unitIds);
    }
    Database.deleteBatch('Notes', [noteId]);
    Audit.log('DELETE_NOTE', session.role, session.userId, { noteId: noteId, title: note.title }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      data: {
        message: 'Note deleted successfully',
        noteId: noteId
      }
    };
  },

  // ==========================================
  // 5. ACTIVITIES (Weekly Progress, Raw Materials, Guest Lectures, Field Visits)
  // ==========================================

  getActivities: function(session, query) {
    query = query || {};
    const allActivities = Database.readAll('Activities');
    let filtered = Security.filterActivitiesForSession(session, allActivities);

    if (query.category) filtered = filtered.filter(a => a.category === query.category);
    if (query.class) filtered = filtered.filter(a => String(a.class) === String(query.class));
    if (query.subject) filtered = filtered.filter(a => String(a.subject || 'IT/ITeS') === String(query.subject));

    return {
      success: true,
      data: {
        activities: filtered,
        total: filtered.length
      }
    };
  },

  saveActivities: function(session, payload) {
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Write permission denied for Activities' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const activities = Array.isArray(payload.activities) ? payload.activities : [payload];

    for (let i = 0; i < activities.length; i++) {
      const a = activities[i];
      if (session.role === 'TEACHER') {
        if (a.class && !Security.canAccessClass(session, a.class)) {
          return { success: false, error: { code: 'UNAUTHORIZED', message: `Teacher cannot create or edit activities for unauthorized class: ${a.class}` } };
        }
        if (a.subject && !Security.canTeacherManageSubject(session, a.subject)) {
          return { success: false, error: { code: 'UNAUTHORIZED', message: `Teacher cannot create or edit activities for unauthorized subject: ${a.subject}` } };
        }
      }
      if (!a.title || !a.class) {
        return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Activity title and class are required' } };
      }
    }

    const records = activities.map(function(a) {
      return {
        activityId: a.activityId || Auth.generateId('ACT'),
        schoolId: schoolId,
        title: a.title || 'Vocational Activity',
        description: a.description || '',
        date: a.date || Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd'),
        category: (a.category || 'WEEKLY_PROGRESS').toUpperCase(),
        class: String(a.class || '9'),
        section: String(a.section || 'A'),
        subject: a.subject || 'IT/ITeS',
        visibility: a.visibility || 'PUBLIC',
        createdAt: a.createdAt || nowStr,
        updatedAt: nowStr
      };
    });

    const result = Database.upsertBatch('Activities', records);
    Audit.log('SAVE_ACTIVITIES', session.role, session.userId, { count: records.length }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      data: {
        result: result,
        records: records
      }
    };
  },

  deleteActivity: function(session, payload) {
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Delete permission denied for Activities' } };
    }
    const activityId = payload.activityId || payload.id;
    if (!activityId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'activityId is required' } };
    }
    const activity = Database.findByPk('Activities', activityId);
    if (!activity) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Activity not found' } };
    }
    if (session.role === 'TEACHER') {
      if (activity.class && !Security.canAccessClass(session, activity.class)) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Delete permission denied for unassigned class: ' + activity.class } };
      }
      if (activity.subject && !Security.canTeacherManageSubject(session, activity.subject)) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Delete permission denied for unassigned subject: ' + activity.subject } };
      }
    }

    Database.deleteBatch('Activities', [activityId]);
    Audit.log('DELETE_ACTIVITY', session.role, session.userId, { activityId: activityId, title: activity.title }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      data: {
        message: 'Activity deleted successfully',
        activityId: activityId
      }
    };
  },

  // ==========================================
  // 6. ASSIGNMENTS
  // ==========================================

  getAssignments: function(session, query) {
    query = query || {};
    const allAssignments = Database.readAll('Assignments');
    let filtered = Security.filterAssignmentsForSession(session, allAssignments);

    if (query.class) filtered = filtered.filter(a => String(a.class) === String(query.class));
    if (query.subject) filtered = filtered.filter(a => String(a.subject || 'IT/ITeS') === String(query.subject));
    if (query.status) filtered = filtered.filter(a => a.status === query.status);

    return {
      success: true,
      data: {
        assignments: filtered,
        total: filtered.length
      }
    };
  },

  saveAssignments: function(session, payload) {
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Write permission denied for Assignments' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const assignments = Array.isArray(payload.assignments) ? payload.assignments : [payload];

    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i];
      if (session.role === 'TEACHER') {
        if (a.class && !Security.canAccessClass(session, a.class)) {
          return { success: false, error: { code: 'UNAUTHORIZED', message: `Teacher cannot create or edit assignments for unauthorized class: ${a.class}` } };
        }
        if (a.subject && !Security.canTeacherManageSubject(session, a.subject)) {
          return { success: false, error: { code: 'UNAUTHORIZED', message: `Teacher cannot create or edit assignments for unauthorized subject: ${a.subject}` } };
        }
      }
      if (!a.title || !a.class) {
        return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Assignment title and class are required' } };
      }
    }

    const records = assignments.map(function(a) {
      return {
        assignmentId: a.assignmentId || Auth.generateId('ASG'),
        schoolId: schoolId,
        title: a.title || 'Assignment',
        description: a.description || '',
        class: String(a.class || '9'),
        section: String(a.section || 'A'),
        subject: a.subject || 'IT/ITeS',
        assignedDate: a.assignedDate || Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd'),
        dueDate: a.dueDate || '',
        maxMarks: a.maxMarks || 50,
        status: a.status || 'ACTIVE',
        createdAt: a.createdAt || nowStr,
        updatedAt: nowStr
      };
    });

    const result = Database.upsertBatch('Assignments', records);
    Audit.log('SAVE_ASSIGNMENTS', session.role, session.userId, { count: records.length }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      data: {
        result: result,
        records: records
      }
    };
  },

  deleteAssignment: function(session, payload) {
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Delete permission denied for Assignments' } };
    }
    const assignmentId = payload.assignmentId || payload.id;
    if (!assignmentId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'assignmentId is required' } };
    }
    const assignment = Database.findByPk('Assignments', assignmentId);
    if (!assignment) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } };
    }
    if (session.role === 'TEACHER') {
      if (assignment.class && !Security.canAccessClass(session, assignment.class)) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Delete permission denied for unassigned class: ' + assignment.class } };
      }
      if (assignment.subject && !Security.canTeacherManageSubject(session, assignment.subject)) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Delete permission denied for unassigned subject: ' + assignment.subject } };
      }
    }

    Database.deleteBatch('Assignments', [assignmentId]);
    Audit.log('DELETE_ASSIGNMENT', session.role, session.userId, { assignmentId: assignmentId, title: assignment.title }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: 'Assignment deleted successfully',
      assignmentId: assignmentId
    };
  },

  // ==========================================
  // 7. NOTICES & NOTIFICATIONS
  // ==========================================

  getNotices: function(session, query) {
    return CommunicationApi.getNotices(session, query);
  },

  saveNotices: function(session, payload) {
    return CommunicationApi.saveNotices(session, payload);
  },

  setNoticeStatus: function(session, payload) {
    return CommunicationApi.setNoticeStatus(session, payload);
  },

  deleteNotice: function(session, payload) {
    return CommunicationApi.deleteNotice(session, payload);
  },

  recordNoticeRead: function(session, payload) {
    return CommunicationApi.recordNoticeRead(session, payload);
  },

  acknowledgeNotice: function(session, payload) {
    return CommunicationApi.acknowledgeNotice(session, payload);
  },

  // ==========================================
  // 8. CALENDAR, DOCUMENTS, ACHIEVEMENTS, CONTACTS
  // ==========================================

  getCalendar: function(session, query) {
    return CommunicationApi.getCalendar(session, query);
  },

  saveCalendarEvents: function(session, payload) {
    return CommunicationApi.saveCalendarEvents(session, payload);
  },

  deleteCalendarEvent: function(session, payload) {
    return CommunicationApi.deleteCalendarEvent(session, payload);
  },

  getNotifications: function(session, query) {
    const allNotifications = Database.readAll('Notifications');
    const userId = session.userId;
    const role = session.role;

    const filtered = allNotifications.filter(function(n) {
      if (n.recipientType === 'ALL') return true;
      if (n.recipientType === role) return true;
      if (n.recipientId && String(n.recipientId) === String(userId)) return true;
      return false;
    });

    return {
      success: true,
      data: {
        notifications: filtered,
        total: filtered.length
      }
    };
  },

  // ==========================================
  // 8. CALENDAR, DOCUMENTS, ACHIEVEMENTS, CONTACTS
  // ==========================================

  getCalendar: function(session, query) {
    const calendar = Database.readAll('Calendar');
    return {
      success: true,
      data: {
        calendar: calendar,
        events: calendar,
        total: calendar.length
      }
    };
  },

  getDocuments: function(session, query) {
    const docs = Database.readAll('Documents');
    return {
      success: true,
      data: {
        documents: docs,
        total: docs.length
      }
    };
  },

  getAchievements: function(session, query) {
    const achievements = Database.readAll('Achievements');
    return {
      success: true,
      data: {
        achievements: achievements,
        total: achievements.length
      }
    };
  },

  getContacts: function(session, query) {
    const contacts = Database.readAll('Contacts');
    return {
      success: true,
      data: {
        contacts: contacts,
        total: contacts.length
      }
    };
  },

  // ==========================================
  // 9. STAFF DASHBOARD & STUDENT PORTFOLIO (Phase 5)
  // ==========================================

  /**
   * Aggregated KPI and overview endpoint for Staff Portal.
   */
  staffDashboard: function(session, payload) {
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied: Staff dashboard requires Admin, Principal, or Teacher role' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const todayStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
    const allStudents = Database.readAll('Students');
    const allAttendance = Database.readAll('Attendance');
    const allNotices = Database.readAll('Notices');
    const allCalendar = Database.readAll('Calendar');
    const allAssignments = Database.readAll('Assignments');
    const allActivities = Database.readAll('Activities');

    if (session.role === 'TEACHER') {
      const staff = Database.findByPk('Staff', session.userId);
      const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
      const activeYear = activeSetting ? String(activeSetting.value).trim() : '2026-2027';
      const scope = Security.getTeacherAcademicScope(session.userId, schoolId, activeYear);
      const assignedClasses = scope.classes;
      const assignedSubjects = scope.assignedSubjects;

      const allStaffAssignments = Database.readAll('StaffAssignments') || [];
      const teacherAssignments = allStaffAssignments.filter(a =>
        String(a.staffId) === String(session.userId) &&
        (!a.academicYear || a.academicYear === activeYear) &&
        (!a.status || a.status === 'ACTIVE' || a.status === 'Active')
      );

      const scopedStudents = allStudents.filter(function(s) {
        if (!assignedClasses.includes(String(s.class))) return false;
        const allowedSecs = scope.sectionsByClass[String(s.class)];
        if (allowedSecs && allowedSecs.length > 0 && s.section && !allowedSecs.includes(String(s.section))) return false;
        return true;
      });

      const byClassCount = {};
      assignedClasses.forEach(function(cls) {
        byClassCount[cls] = scopedStudents.filter(s => String(s.class) === String(cls)).length;
      });

      const todayAtt = allAttendance.filter(a => a.date === todayStr && assignedClasses.includes(String(a.class)));
      const uniquePresentStudentIds = new Set(todayAtt.filter(a => a.status === 'PRESENT').map(a => a.studentId));
      const presentCount = uniquePresentStudentIds.size;
      const pendingClasses = assignedClasses.filter(cls => !allAttendance.some(a => a.date === todayStr && String(a.class) === String(cls)));

      const notices = Security.filterNoticesForSession(session, allNotices).slice(-5).reverse();
      const upcomingCal = allCalendar.filter(c => c.date >= todayStr).slice(0, 5);
      const recentAsg = allAssignments.filter(a => assignedClasses.includes(String(a.class))).slice(-5).reverse();
      const recentAct = allActivities.filter(a => assignedClasses.includes(String(a.class))).slice(-5).reverse();

      const theoryCount = teacherAssignments.filter(a => a.component === 'THEORY' || a.component === 'BOTH').length;
      const practicalCount = teacherAssignments.filter(a => a.component === 'PRACTICAL' || a.component === 'BOTH').length;

      return {
        success: true,
        data: {
          role: 'TEACHER',
          userId: session.userId,
          teacherName: staff ? staff.staffName : session.identifier,
          employeeId: staff ? (staff.employeeId || staff.staffId) : session.userId,
          designation: staff ? (staff.designation || 'Vocational Teacher') : 'Teacher',
          department: staff ? (staff.department || 'Vocational Education') : 'Vocational Education',
          assignedClasses: assignedClasses,
          assignedSubjects: assignedSubjects,
          sectionsByClass: scope.sectionsByClass,
          classTeacherRoles: scope.classTeacherRoles,
          isClassTeacher: scope.classTeacherRoles.length > 0,
          academicAssignments: teacherAssignments,
          academicYear: activeYear,
          workload: {
            totalAssignments: teacherAssignments.length,
            theoryComponents: theoryCount,
            practicalComponents: practicalCount,
            classesCount: assignedClasses.length
          },
          today: todayStr,
          studentTotals: {
            total: scopedStudents.length,
            byClass: byClassCount
          },
          todayAttendance: {
            present: presentCount,
            totalStudents: scopedStudents.length,
            percentage: scopedStudents.length > 0 ? Math.round((presentCount / scopedStudents.length) * 100) : 0,
            pendingClasses: pendingClasses
          },
          recentNotices: notices,
          upcomingCalendar: upcomingCal,
          recentAssignments: recentAsg,
          recentActivities: recentAct,
          alerts: pendingClasses.map(function(cls) {
            return { type: 'PENDING_ATTENDANCE', class: cls, message: `Class ${cls} attendance is pending for today` };
          })
        }
      };
    }

    // PRINCIPAL or ADMIN (School-Wide Scope)
    const allClasses = ['9', '10', '11', '12'];
    const byClassCount = {};
    allClasses.forEach(function(cls) {
      byClassCount[cls] = allStudents.filter(s => String(s.class) === String(cls)).length;
    });

    const todayAtt = allAttendance.filter(a => a.date === todayStr);
    const uniquePresentStudentIds = new Set(todayAtt.filter(a => a.status === 'PRESENT').map(a => a.studentId));
    const presentCount = uniquePresentStudentIds.size;
    const pendingClasses = allClasses.filter(function(cls) {
      return !allAttendance.some(a => a.date === todayStr && String(a.class) === String(cls));
    });

    const staffList = Database.readAll('Staff').map(function(s) {
      return {
        staffId: s.staffId,
        staffName: s.staffName,
        role: s.role,
        status: s.status,
        assignedClasses: s.assignedClasses
      };
    });

    const notices = allNotices.slice(-5).reverse();
    const upcomingCal = allCalendar.filter(c => c.date >= todayStr).slice(0, 5);
    const recentAsg = allAssignments.slice(-5).reverse();
    const recentAct = allActivities.slice(-5).reverse();

    return {
      success: true,
      data: {
        role: session.role,
        userId: session.userId,
        today: todayStr,
        studentTotals: {
          total: allStudents.length,
          byClass: byClassCount
        },
        todayAttendance: {
          present: presentCount,
          totalStudents: allStudents.length,
          percentage: allStudents.length > 0 ? Math.round((presentCount / allStudents.length) * 100) : 0,
          pendingClasses: pendingClasses
        },
        staffSummary: {
          totalStaff: staffList.length,
          activeStaff: staffList.filter(s => (s.status || 'Active') === 'Active').length
        },
        recentNotices: notices,
        upcomingCalendar: upcomingCal,
        recentAssignments: recentAsg,
        recentActivities: recentAct,
        alerts: pendingClasses.map(function(cls) {
          return { type: 'PENDING_ATTENDANCE', class: cls, message: `Class ${cls} attendance is pending for today` };
        })
      }
    };
  },

  /**
   * Aggregated Student 360° portfolio endpoint.
   */
  getStudentPortfolio: function(session, payload) {
    const studentId = payload.studentId || payload.id;
    if (!studentId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'studentId is required' } };
    }

    const student = Database.findByPk('Students', studentId);
    if (!student) {
      return { success: false, error: { code: 'NOT_FOUND', message: `Student not found with ID: ${studentId}` } };
    }

    // Zero-Trust Server-Side Access Authorization
    if (!Security.canAccessStudent(session, student.studentId, student.class)) {
      Audit.log('UNAUTHORIZED_PORTFOLIO_ACCESS', session.role, session.userId, { studentId: studentId }, 'DENIED', '', session.schoolId);
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access forbidden: You are not authorized to view this student portfolio' } };
    }

    const sanitizedStudent = AcademicApi.sanitizeStudent(student);

    // Attendance Metrics
    const allAtt = Database.readAll('Attendance').filter(a => String(a.studentId) === String(studentId)).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const totalWorkingDays = allAtt.length;
    const presentDays = allAtt.filter(a => a.status === 'PRESENT').length;
    const absentDays = allAtt.filter(a => a.status === 'ABSENT' || a.status === 'LEAVE').length;
    const percentage = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;

    // Consecutive Absence Streak (counting backwards from latest date)
    let consecutiveAbsenceStreak = 0;
    for (let i = allAtt.length - 1; i >= 0; i--) {
      if (allAtt[i].status === 'ABSENT' || allAtt[i].status === 'LEAVE') {
        consecutiveAbsenceStreak++;
      } else {
        break;
      }
    }

    // Marks
    const marks = Database.readAll('Marks').filter(m => String(m.studentId) === String(studentId));

    // Assignments for this student's class
    const assignments = Database.readAll('Assignments').filter(a => String(a.class) === String(student.class));

    // Activities for this student's class
    const activities = Database.readAll('Activities').filter(a => String(a.class) === String(student.class));

    // Achievements
    const achievements = Database.readAll('Achievements').filter(a => String(a.studentId) === String(studentId));

    return {
      success: true,
      data: {
        student: sanitizedStudent,
        attendanceSummary: {
          totalWorkingDays: totalWorkingDays,
          presentDays: presentDays,
          absentDays: absentDays,
          percentage: percentage,
          consecutiveAbsenceStreak: consecutiveAbsenceStreak,
          recentRecords: allAtt.slice(-15)
        },
        marks: marks,
        assignments: assignments,
        activities: activities,
        achievements: achievements
      }
    };
  },

  // ==========================================
  // 12. STUDENT & PARENT PORTAL APIS (Phase 6)
  // ==========================================

  /**
   * Aggregated Student Dashboard endpoint.
   * Scoped strictly to authenticated student.
   */
  studentDashboard: function(session, payload) {
    if (!session || !session.userId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Valid session required' } };
    }

    let studentId = session.userId;
    if (['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role) && (payload.studentId || payload.id)) {
      studentId = payload.studentId || payload.id;
    }

    const student = Database.findByPk('Students', studentId);
    if (!student) {
      return { success: false, error: { code: 'NOT_FOUND', message: `Student not found with ID: ${studentId}` } };
    }

    if (!Security.canAccessStudent(session, student.studentId, student.class)) {
      Audit.log('UNAUTHORIZED_STUDENT_DASHBOARD', session.role, session.userId, { studentId: studentId }, 'DENIED', '', session.schoolId);
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access forbidden: You are not authorized to access this student dashboard' } };
    }

    const sanitizedStudent = AcademicApi.sanitizeStudent(student);

    // Attendance Summary
    const allAtt = Database.readAll('Attendance').filter(a => String(a.studentId) === String(studentId)).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const totalWorkingDays = allAtt.length;
    const presentDays = allAtt.filter(a => a.status === 'PRESENT').length;
    const absentDays = allAtt.filter(a => a.status === 'ABSENT' || a.status === 'LEAVE').length;
    const percentage = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;

    let consecutiveAbsenceStreak = 0;
    for (let i = allAtt.length - 1; i >= 0; i--) {
      if (allAtt[i].status === 'ABSENT' || allAtt[i].status === 'LEAVE') {
        consecutiveAbsenceStreak++;
      } else {
        break;
      }
    }

    // Marks
    const marks = Database.readAll('Marks').filter(m => String(m.studentId) === String(studentId));

    // Scoped Notes
    const notesRes = AcademicApi.getNotes(session, { class: student.class });

    // Scoped Activities
    const actRes = AcademicApi.getActivities(session, { class: student.class });

    // Scoped Assignments
    const asgRes = AcademicApi.getAssignments(session, { class: student.class });

    // Scoped Notices
    const ntcRes = AcademicApi.getNotices(session, { class: student.class });

    // Calendar Events
    const todayStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
    const allCalendar = Database.readAll('Calendar');
    const upcomingCalendar = allCalendar.filter(c => c.date >= todayStr).slice(0, 5);

    Audit.log('STUDENT_DASHBOARD_ACCESS', session.role, session.userId, { studentId: studentId }, 'SUCCESS', '', session.schoolId);

    return {
      success: true,
      data: {
        student: sanitizedStudent,
        attendanceSummary: {
          totalWorkingDays: totalWorkingDays,
          presentDays: presentDays,
          absentDays: absentDays,
          percentage: percentage,
          consecutiveAbsenceStreak: consecutiveAbsenceStreak,
          recentRecords: allAtt.slice(-15)
        },
        marks: marks,
        notes: (notesRes.data && notesRes.data.notes) ? notesRes.data.notes.slice(0, 5) : [],
        activities: (actRes.data && actRes.data.activities) ? actRes.data.activities.slice(0, 5) : [],
        assignments: (asgRes.data && asgRes.data.assignments) ? asgRes.data.assignments.slice(0, 5) : [],
        notices: (ntcRes.data && ntcRes.data.notices) ? ntcRes.data.notices.slice(0, 5) : [],
        upcomingCalendar: upcomingCalendar
      }
    };
  },

  /**
   * Aggregated Parent Dashboard endpoint.
   * Multi-child support resolving strictly through ParentStudentLinks.
   */
  parentDashboard: function(session, payload) {
    if (!session || !session.userId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Valid session required' } };
    }

    if (!['PARENT', 'ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Parent role authorization required' } };
    }

    const parentId = session.userId;
    const parent = Database.findByPk('Parents', parentId) || { parentId: parentId, parentName: 'Parent', mobile: session.identifier };

    const authorizedChildren = Security.getAuthorizedChildren(parentId, session.schoolId);
    const todayStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
    const allAttendance = Database.readAll('Attendance');
    const allMarks = Database.readAll('Marks');
    const allAssignments = Database.readAll('Assignments');
    const allActivities = Database.readAll('Activities');
    const allNotices = Database.readAll('Notices');
    const allCalendar = Database.readAll('Calendar');

    const childrenSummaries = authorizedChildren.map(function(child) {
      const sanitizedChild = AcademicApi.sanitizeStudent(child);
      const studentId = String(child.studentId);
      const childClass = String(child.class);

      const childAtt = allAttendance.filter(a => String(a.studentId) === studentId).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const totalWorkingDays = childAtt.length;
      const presentDays = childAtt.filter(a => a.status === 'PRESENT').length;
      const absentDays = childAtt.filter(a => a.status === 'ABSENT' || a.status === 'LEAVE').length;
      const percentage = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;

      let consecutiveAbsenceStreak = 0;
      for (let i = childAtt.length - 1; i >= 0; i--) {
        if (childAtt[i].status === 'ABSENT' || childAtt[i].status === 'LEAVE') {
          consecutiveAbsenceStreak++;
        } else {
          break;
        }
      }

      const childMarks = allMarks.filter(m => String(m.studentId) === studentId);
      const childAssignments = allAssignments.filter(a => String(a.class) === childClass && a.status !== 'DRAFT').slice(-5).reverse();
      const childActivities = allActivities.filter(a => String(a.class) === childClass && a.visibility !== 'STAFF_ONLY').slice(-5).reverse();
      const childNotices = allNotices.filter(n => (!n.class || n.class === 'All' || String(n.class) === childClass) && ['ALL', 'PARENTS', 'PUBLIC'].includes(n.visibility || 'ALL')).slice(-5).reverse();

      return {
        student: sanitizedChild,
        attendanceSummary: {
          totalWorkingDays: totalWorkingDays,
          presentDays: presentDays,
          absentDays: absentDays,
          percentage: percentage,
          consecutiveAbsenceStreak: consecutiveAbsenceStreak,
          recentRecords: childAtt.slice(-15)
        },
        marks: childMarks,
        recentAssignments: childAssignments,
        recentActivities: childActivities,
        recentNotices: childNotices
      };
    });

    const upcomingCalendar = allCalendar.filter(c => c.date >= todayStr).slice(0, 5);

    Audit.log('PARENT_DASHBOARD_ACCESS', session.role, session.userId, { childCount: childrenSummaries.length }, 'SUCCESS', '', session.schoolId);

    return {
      success: true,
      data: {
        parent: {
          parentId: parent.parentId,
          parentName: parent.parentName || 'Parent',
          mobile: parent.mobile
        },
        children: childrenSummaries,
        upcomingCalendar: upcomingCalendar
      }
    };
  },

  /**
   * Returns list of authorized children for authenticated parent.
   */
  getParentChildren: function(session, payload) {
    if (!session || !session.userId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Valid session required' } };
    }

    if (!['PARENT', 'ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Parent role authorization required' } };
    }

    const authorizedChildren = Security.getAuthorizedChildren(session.userId, session.schoolId);
    const sanitized = authorizedChildren.map(AcademicApi.sanitizeStudent);

    return {
      success: true,
      data: {
        children: sanitized,
        total: sanitized.length
      }
    };
  },

  /**
   * Safe student profile endpoint.
   * Delegates to AdminApi.getStudentProfile for comprehensive 360° student data.
   */
  getStudentProfile: function(session, payload) {
    if (typeof AdminApi !== 'undefined' && AdminApi.getStudentProfile) {
      return AdminApi.getStudentProfile(session, payload);
    }

    if (!session || !session.userId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Valid session required' } };
    }

    let studentId = session.userId;
    if (session.role !== 'STUDENT') {
      studentId = payload.studentId || payload.id;
    }

    if (!studentId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'studentId is required' } };
    }

    const student = Database.findByPk('Students', studentId);
    if (!student) {
      return { success: false, error: { code: 'NOT_FOUND', message: `Student not found with ID: ${studentId}` } };
    }

    if (!Security.canAccessStudent(session, student.studentId, student.class)) {
      Audit.log('UNAUTHORIZED_PROFILE_ACCESS', session.role, session.userId, { studentId: studentId }, 'DENIED', '', session.schoolId);
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access forbidden: You are not authorized to view this student profile' } };
    }

    return {
      success: true,
      data: {
        student: AcademicApi.sanitizeStudent(student),
        guardians: []
      }
    };
  },

  /**
   * Safe parent profile endpoint.
   * Resolves parent details and authorized linked children.
   */
  getParentProfile: function(session, payload) {
    if (!session || !session.userId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Valid session required' } };
    }

    if (!['PARENT', 'ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Parent role authorization required' } };
    }

    const parentId = session.userId;
    const parent = Database.findByPk('Parents', parentId) || {
      parentId: parentId,
      parentName: session.name || 'Parent',
      mobile: session.identifier,
      status: 'Active'
    };

    const authorizedChildren = Security.getAuthorizedChildren(parentId, session.schoolId);
    const sanitizedChildren = authorizedChildren.map(AcademicApi.sanitizeStudent);

    Audit.log('PARENT_PROFILE_ACCESS', session.role, session.userId, { childCount: sanitizedChildren.length }, 'SUCCESS', '', session.schoolId);

    return {
      success: true,
      data: {
        parent: AcademicApi.sanitizeParent(parent),
        children: sanitizedChildren,
        totalChildren: sanitizedChildren.length
      }
    };
  },

  /**
   * Sanitizes a parent object to ensure no passwordHash or salt is exposed.
   */
  sanitizeParent: function(parent) {
    if (!parent) return null;
    const clean = Object.assign({}, parent);
    delete clean.passwordHash;
    delete clean.salt;
    return clean;
  },

  /**
   * Safe Staff / Teacher Contact Sanitizer.
   */
  sanitizeStaffContact: function(staff) {
    if (!staff) return null;
    let assignedClasses = [];
    try {
      assignedClasses = staff.assignedClasses ? (Array.isArray(staff.assignedClasses) ? staff.assignedClasses : JSON.parse(staff.assignedClasses)) : [];
    } catch (e) {
      assignedClasses = String(staff.assignedClasses || '').split(',').map(s => s.trim()).filter(Boolean);
    }
    let assignedSubjects = [];
    try {
      assignedSubjects = staff.assignedSubjects ? (Array.isArray(staff.assignedSubjects) ? staff.assignedSubjects : JSON.parse(staff.assignedSubjects)) : [];
    } catch (e) {
      assignedSubjects = String(staff.assignedSubjects || '').split(',').map(s => s.trim()).filter(Boolean);
    }

    return {
      staffId: staff.staffId,
      name: staff.staffName,
      role: staff.role || 'TEACHER',
      designation: staff.designation || (staff.role === 'PRINCIPAL' ? 'Principal' : (staff.role === 'TEACHER' ? 'Teacher' : (staff.role || 'Staff Member'))),
      subject: assignedSubjects.join(', '),
      assignedClasses: assignedClasses.map(String),
      assignedSubjects: assignedSubjects,
      mobile: staff.mobile || '',
      email: staff.email || '',
      whatsapp: staff.mobile || ''
    };
  },

  /**
   * Safe student contacts endpoint.
   * Resolves only teachers assigned to the student's class, the principal, and school office contacts.
   */
  getStudentContacts: function(session, payload) {
    if (!session || !session.userId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Valid session required' } };
    }

    let studentId = session.userId;
    if (session.role !== 'STUDENT') {
      studentId = (payload && (payload.studentId || payload.id)) || studentId;
    }

    if (!studentId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'studentId is required' } };
    }

    const student = Database.findByPk('Students', studentId);
    if (!student) {
      return { success: false, error: { code: 'NOT_FOUND', message: `Student not found with ID: ${studentId}` } };
    }

    if (!Security.canAccessStudent(session, student.studentId, student.class)) {
      Audit.log('UNAUTHORIZED_CONTACTS_ACCESS', session.role, session.userId, { studentId: studentId }, 'DENIED', '', session.schoolId);
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access forbidden: You are not authorized to view contacts for this student' } };
    }

    const studentClass = String(student.class || '9');
    const allStaff = Database.readAll('Staff') || [];
    
    // 1. Resolve Principal / Head of Institution
    let principalStaff = allStaff.find(s => s.role === 'PRINCIPAL' || String(s.designation || '').toLowerCase().includes('principal') || String(s.designation || '').toLowerCase().includes('headmaster') || String(s.designation || '').toLowerCase().includes('headmistress'));
    
    const principal = principalStaff ? AcademicApi.sanitizeStaffContact(principalStaff) : null;

    // 2. Resolve Teachers assigned to student's class
    const teachers = allStaff
      .filter(s => {
        if (s.role !== 'TEACHER' && s.role !== 'STAFF') return false;
        const classes = Security.getTeacherAssignedClasses(s.staffId, session.schoolId);
        // Include if teacher is assigned to student's class or has general school assignment
        return classes.length === 0 || classes.includes(studentClass);
      })
      .map(AcademicApi.sanitizeStaffContact);

    // 3. Resolve School Office / General Contacts
    const rawSchoolContacts = Database.readAll('Contacts') || [];
    const schoolContacts = rawSchoolContacts.map(c => ({
      contactId: c.contactId,
      category: c.category || 'School Office',
      name: c.name || 'Gameri Higher Secondary School',
      designation: c.designation || 'School Administration',
      mobile: c.mobile || '',
      email: c.email || '',
      whatsapp: c.whatsapp || c.mobile || '',
      address: c.address || 'Gamiri, Biswanath, Assam'
    }));

    Audit.log('STUDENT_CONTACTS_ACCESS', session.role, session.userId, { class: studentClass, teacherCount: teachers.length }, 'SUCCESS', '', session.schoolId);

    return {
      success: true,
      data: {
        studentClass: student.class,
        studentSection: student.section,
        teachers: teachers,
        principal: principal,
        schoolContacts: schoolContacts,
        total: teachers.length + (principal ? 1 : 0) + schoolContacts.length
      }
    };
  },

  /**
   * Safe parent contacts endpoint.
   * Resolves contacts scoped to the selected authorized child.
   */
  getParentContacts: function(session, payload) {
    if (!session || !session.userId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Valid session required' } };
    }

    if (!['PARENT', 'ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Parent role authorization required' } };
    }

    const parentId = session.userId;
    const authorizedChildren = Security.getAuthorizedChildren(parentId, session.schoolId);
    if (!authorizedChildren || authorizedChildren.length === 0) {
      return {
        success: true,
        data: {
          selectedChild: null,
          children: [],
          teachers: [],
          principal: null,
          schoolContacts: [],
          total: 0
        }
      };
    }

    let selectedChildId = payload && (payload.childId || payload.studentId);
    let selectedChild = null;

    if (selectedChildId) {
      if (!Security.canAccessStudent(session, selectedChildId)) {
        Audit.log('UNAUTHORIZED_PARENT_CONTACTS_ACCESS', session.role, session.userId, { attemptedChildId: selectedChildId }, 'DENIED', '', session.schoolId);
        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access forbidden: You are not authorized for the requested child contacts' } };
      }
      selectedChild = authorizedChildren.find(c => String(c.studentId) === String(selectedChildId));
    }

    if (!selectedChild) {
      selectedChild = authorizedChildren[0];
      selectedChildId = selectedChild.studentId;
    }

    const childClass = String(selectedChild.class || '9');
    const allStaff = Database.readAll('Staff') || [];

    // 1. Resolve Principal / Head of Institution
    let principalStaff = allStaff.find(s => s.role === 'PRINCIPAL' || String(s.designation || '').toLowerCase().includes('principal') || String(s.designation || '').toLowerCase().includes('headmaster') || String(s.designation || '').toLowerCase().includes('headmistress'));
    
    const principal = principalStaff ? AcademicApi.sanitizeStaffContact(principalStaff) : null;

    // 2. Resolve Teachers assigned to child's class
    const teachers = allStaff
      .filter(s => {
        if (s.role !== 'TEACHER' && s.role !== 'STAFF') return false;
        const classes = Security.getTeacherAssignedClasses(s.staffId, session.schoolId);
        return classes.length === 0 || classes.includes(childClass);
      })
      .map(AcademicApi.sanitizeStaffContact);

    // 3. Resolve School Office / General Contacts
    const rawSchoolContacts = Database.readAll('Contacts') || [];
    const schoolContacts = rawSchoolContacts.map(c => ({
      contactId: c.contactId,
      category: c.category || 'School Office',
      name: c.name || 'Gameri Higher Secondary School',
      designation: c.designation || 'School Administration',
      mobile: c.mobile || '',
      email: c.email || '',
      whatsapp: c.whatsapp || c.mobile || '',
      address: c.address || 'Gamiri, Biswanath, Assam'
    }));

    Audit.log('PARENT_CONTACTS_ACCESS', session.role, session.userId, { childId: selectedChildId, class: childClass, teacherCount: teachers.length }, 'SUCCESS', '', session.schoolId);

    return {
      success: true,
      data: {
        selectedChild: AcademicApi.sanitizeStudent(selectedChild),
        children: authorizedChildren.map(AcademicApi.sanitizeStudent),
        teachers: teachers,
        principal: principal,
        schoolContacts: schoolContacts,
        total: teachers.length + (principal ? 1 : 0) + schoolContacts.length
      }
    };
  },

  // ==========================================
  // 10. ACADEMIC YEARS
  // ==========================================

  getAcademicYears: function(session, payload) {
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    let allYears = Database.readAll('AcademicYears');
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    if (allYears.length === 0) {
      allYears = [
        {
          yearId: 'AY_2026_2027',
          schoolId: schoolId,
          yearName: '2026-2027',
          startDate: '2026-04-01',
          endDate: '2027-03-31',
          status: 'Active',
          isCurrent: true,
          createdAt: nowStr,
          updatedAt: nowStr
        },
        {
          yearId: 'AY_2025_2026',
          schoolId: schoolId,
          yearName: '2025-2026',
          startDate: '2025-04-01',
          endDate: '2026-03-31',
          status: 'Completed',
          isCurrent: false,
          createdAt: nowStr,
          updatedAt: nowStr
        }
      ];
      Database.upsertBatch('AcademicYears', allYears);
    }

    const currentSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const activeYearName = currentSetting ? currentSetting.value : '2026-2027';

    return {
      success: true,
      data: {
        academicYears: allYears,
        activeYear: activeYearName,
        total: allYears.length
      }
    };
  },

  saveAcademicYears: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can manage academic years' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const years = Array.isArray(payload.academicYears) ? payload.academicYears : [payload];

    const records = years.map(y => {
      const yName = y.yearName || y.name || '2026-2027';
      const yearId = y.yearId || `AY_${yName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      return {
        yearId: yearId,
        schoolId: schoolId,
        yearName: yName,
        startDate: y.startDate || `${yName.substring(0, 4)}-04-01`,
        endDate: y.endDate || `${parseInt(yName.substring(0, 4), 10) + 1}-03-31`,
        status: y.status || 'Active',
        isCurrent: y.isCurrent === true || y.isCurrent === 'true',
        createdAt: y.createdAt || nowStr,
        updatedAt: nowStr
      };
    });

    Database.upsertBatch('AcademicYears', records);
    Audit.log('SAVE_ACADEMIC_YEARS', session.role, session.userId, { count: records.length }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Saved ${records.length} academic years`,
      data: { academicYears: records }
    };
  },

  // ==========================================
  // 11. CLASSES & SECTIONS
  // ==========================================

  getClasses: function(session, payload) {
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    let classes = Database.readAll('Classes');
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    if (classes.length === 0) {
      classes = [
        {
          classId: 'CLS_9',
          schoolId: schoolId,
          className: 'Class 9',
          gradeLevel: '9',
          sections: JSON.stringify(['A']),
          stream: 'Vocational IT/ITeS',
          status: 'Active',
          order: 1,
          updatedAt: nowStr
        },
        {
          classId: 'CLS_10',
          schoolId: schoolId,
          className: 'Class 10',
          gradeLevel: '10',
          sections: JSON.stringify(['A']),
          stream: 'Vocational IT/ITeS',
          status: 'Active',
          order: 2,
          updatedAt: nowStr
        },
        {
          classId: 'CLS_11',
          schoolId: schoolId,
          className: 'Class 11',
          gradeLevel: '11',
          sections: JSON.stringify(['A']),
          stream: 'Vocational IT/ITeS',
          status: 'Active',
          order: 3,
          updatedAt: nowStr
        },
        {
          classId: 'CLS_12',
          schoolId: schoolId,
          className: 'Class 12',
          gradeLevel: '12',
          sections: JSON.stringify(['A']),
          stream: 'Vocational IT/ITeS',
          status: 'Active',
          order: 4,
          updatedAt: nowStr
        }
      ];
      Database.upsertBatch('Classes', classes);
    }

    if (session.role === 'TEACHER') {
      const assigned = Security.getTeacherAssignedClasses(session.userId, schoolId);
      if (assigned.length > 0) {
        classes = classes.filter(c => assigned.includes(String(c.gradeLevel)));
      }
    }

    const parsedClasses = classes.map(c => {
      let sections = ['A'];
      try {
        sections = typeof c.sections === 'string' ? JSON.parse(c.sections) : c.sections;
      } catch (e) {
        sections = String(c.sections || 'A').split(',').map(s => s.trim());
      }
      return Object.assign({}, c, { sections: sections });
    }).sort((a, b) => (a.order || 0) - (b.order || 0));

    return {
      success: true,
      data: {
        classes: parsedClasses,
        total: parsedClasses.length
      }
    };
  },

  saveClasses: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can manage classes' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const inputClasses = Array.isArray(payload.classes) ? payload.classes : [payload];

    const records = inputClasses.map(c => {
      const gLevel = String(c.gradeLevel || c.class || '9');
      const classId = c.classId || `CLS_${gLevel}`;
      return {
        classId: classId,
        schoolId: schoolId,
        className: c.className || `Class ${gLevel}`,
        gradeLevel: gLevel,
        sections: typeof c.sections === 'object' ? JSON.stringify(c.sections) : String(c.sections || '["A"]'),
        stream: c.stream || 'Vocational IT/ITeS',
        status: c.status || 'Active',
        order: parseInt(c.order, 10) || parseInt(gLevel, 10) || 1,
        updatedAt: nowStr
      };
    });

    Database.upsertBatch('Classes', records);
    Audit.log('SAVE_CLASSES', session.role, session.userId, { count: records.length }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Saved ${records.length} classes`,
      data: { classes: records }
    };
  },

  // ==========================================
  // 12. SUBJECTS
  // ==========================================

  getSubjects: function(session, query) {
    query = query || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    let subjects = Database.readAll('Subjects');
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    if (subjects.length === 0) {
      subjects = [
        {
          subjectId: 'SUB_9_IT',
          schoolId: schoolId,
          subjectCode: 'IT-402',
          subjectName: 'Information Technology / ITeS',
          class: '9',
          hasTheory: true,
          hasPractical: true,
          maxMarks: 100,
          status: 'Active',
          updatedAt: nowStr
        },
        {
          subjectId: 'SUB_9_ES',
          schoolId: schoolId,
          subjectCode: 'ES-101',
          subjectName: 'Employability Skills',
          class: '9',
          hasTheory: true,
          hasPractical: false,
          maxMarks: 50,
          status: 'Active',
          updatedAt: nowStr
        },
        {
          subjectId: 'SUB_10_IT',
          schoolId: schoolId,
          subjectCode: 'IT-402',
          subjectName: 'Information Technology / ITeS',
          class: '10',
          hasTheory: true,
          hasPractical: true,
          maxMarks: 100,
          status: 'Active',
          updatedAt: nowStr
        },
        {
          subjectId: 'SUB_10_ES',
          schoolId: schoolId,
          subjectCode: 'ES-101',
          subjectName: 'Employability Skills',
          class: '10',
          hasTheory: true,
          hasPractical: false,
          maxMarks: 50,
          status: 'Active',
          updatedAt: nowStr
        },
        {
          subjectId: 'SUB_11_IT',
          schoolId: schoolId,
          subjectCode: 'IT-802',
          subjectName: 'Information Technology',
          class: '11',
          hasTheory: true,
          hasPractical: true,
          maxMarks: 100,
          status: 'Active',
          updatedAt: nowStr
        },
        {
          subjectId: 'SUB_12_IT',
          schoolId: schoolId,
          subjectCode: 'IT-802',
          subjectName: 'Information Technology',
          class: '12',
          hasTheory: true,
          hasPractical: true,
          maxMarks: 100,
          status: 'Active',
          updatedAt: nowStr
        }
      ];
      Database.upsertBatch('Subjects', subjects);
    }

    if (query.class) {
      subjects = subjects.filter(s => String(s.class) === String(query.class));
    }

    return {
      success: true,
      data: {
        subjects: subjects,
        total: subjects.length
      }
    };
  },

  /**
   * Resolves the authoritative curriculum and subjects for a specific academic context.
   */
  resolveCurriculumForContext: function(schoolId, academicYear, classLevel, section, stream) {
    schoolId = schoolId || DEFAULT_SCHOOL_ID;
    academicYear = String(academicYear || '').trim();
    classLevel = String(classLevel || '').trim();
    stream = stream ? String(stream).trim() : '';

    if (!academicYear) {
      const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
      academicYear = activeSetting ? String(activeSetting.value).trim() : '2026-2027';
    }

    const allCurricula = Database.readAll('Curriculum') || [];
    const allCurriculumSubjects = Database.readAll('CurriculumSubjects') || [];

    // Filter published matching curriculum
    const matchedCurricula = allCurricula.filter(function(c) {
      const matchSchool = !c.schoolId || c.schoolId === schoolId;
      const matchYear = String(c.academicYear) === academicYear;
      const matchCls = String(c.class) === classLevel;
      const matchStatus = (c.status || 'PUBLISHED').toUpperCase() === 'PUBLISHED';
      const matchStream = !stream || !c.stream || c.stream === 'All' || String(c.stream).toLowerCase() === stream.toLowerCase();
      const matchSec = !section || !c.sectionScope || c.sectionScope === 'ALL' || c.sectionScope.split(',').map(s => s.trim()).includes(String(section));
      return matchSchool && matchYear && matchCls && matchStatus && matchStream && matchSec;
    });

    if (matchedCurricula.length > 0) {
      const targetCurr = matchedCurricula.sort((a, b) => (b.version || 1) - (a.version || 1))[0];
      const currSubs = allCurriculumSubjects.filter(function(cs) {
        return String(cs.curriculumId) === String(targetCurr.curriculumId) && (cs.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
      }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      return {
        hasCurriculum: true,
        curriculum: targetCurr,
        subjects: currSubs
      };
    }

    // Graceful fallback to legacy Subjects table
    const fallbackSubjects = (Database.readAll('Subjects') || []).filter(function(s) {
      return String(s.class) === classLevel && (s.status || 'Active').toUpperCase() === 'ACTIVE';
    }).map(function(s, idx) {
      const hasTh = s.hasTheory !== false;
      const hasPr = s.hasPractical === true;
      let comp = 'THEORY';
      if (hasTh && hasPr) comp = 'BOTH';
      else if (hasPr) comp = 'PRACTICAL';

      const maxM = parseInt(s.maxMarks, 10) || 100;
      const prM = hasPr ? (parseInt(s.practicalMaxMarks, 10) || (comp === 'BOTH' ? 30 : maxM)) : 0;
      const thM = hasTh ? (parseInt(s.theoryMaxMarks, 10) || (maxM - prM)) : 0;

      return {
        curriculumSubjectId: `FALLBACK_${s.subjectId}`,
        curriculumId: `FALLBACK_${academicYear}_${classLevel}`,
        subjectId: s.subjectId,
        subjectCode: s.subjectCode || 'SUB',
        subjectName: s.subjectName || 'Subject',
        component: comp,
        isMandatory: s.isMandatory !== false,
        isOptional: s.isMandatory === false,
        hasTheory: hasTh,
        hasPractical: hasPr,
        theoryMaxMarks: thM,
        practicalMaxMarks: prM,
        totalMaxMarks: maxM,
        displayOrder: parseInt(s.displayOrder, 10) || (idx + 1),
        status: 'ACTIVE'
      };
    });

    return {
      hasCurriculum: false,
      curriculum: null,
      subjects: fallbackSubjects
    };
  },

  // ==========================================
  // 12. CURRICULUM MANAGEMENT
  // ==========================================

  getCurriculumList: function(session, query) {
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied' } };
    }

    query = query || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    let allCurricula = Database.readAll('Curriculum') || [];
    const allCurriculumSubjects = Database.readAll('CurriculumSubjects') || [];

    // Filter by school
    allCurricula = allCurricula.filter(c => !c.schoolId || c.schoolId === schoolId);

    // Scoping for Parent/Student
    if (session.role === 'STUDENT') {
      const student = Database.findByPk('Students', session.userId);
      if (student) {
        allCurricula = allCurricula.filter(c => String(c.class) === String(student.class));
      }
    } else if (session.role === 'PARENT') {
      const children = Security.getAuthorizedChildren(session.userId, schoolId);
      const childClasses = children.map(c => String(c.class));
      allCurricula = allCurricula.filter(c => childClasses.includes(String(c.class)));
    } else if (session.role === 'TEACHER' && !query.allClasses) {
      const assigned = Security.getTeacherAssignedClasses(session.userId, schoolId);
      if (assigned.length > 0) {
        allCurricula = allCurricula.filter(c => assigned.includes(String(c.class)));
      }
    }

    // Query Filters
    if (query.academicYear && query.academicYear !== 'ALL') {
      allCurricula = allCurricula.filter(c => String(c.academicYear) === String(query.academicYear));
    }
    if (query.class && query.class !== 'ALL') {
      allCurricula = allCurricula.filter(c => String(c.class) === String(query.class));
    }
    if (query.status && query.status !== 'ALL') {
      allCurricula = allCurricula.filter(c => String(c.status).toUpperCase() === String(query.status).toUpperCase());
    }
    if (query.stream && query.stream !== 'ALL') {
      allCurricula = allCurricula.filter(c => String(c.stream).toLowerCase() === String(query.stream).toLowerCase());
    }

    // Aggregate metrics for each curriculum
    const enhancedCurricula = allCurricula.map(function(curr) {
      const subjects = allCurriculumSubjects.filter(cs => String(cs.curriculumId) === String(curr.curriculumId));
      const totalMarks = subjects.reduce((sum, s) => sum + (parseInt(s.totalMaxMarks, 10) || 0), 0);
      const theoryCount = subjects.filter(s => s.component === 'THEORY' || s.component === 'BOTH').length;
      const practicalCount = subjects.filter(s => s.component === 'PRACTICAL' || s.component === 'BOTH').length;
      const mandatoryCount = subjects.filter(s => s.isMandatory !== false).length;
      const optionalCount = subjects.filter(s => s.isOptional === true).length;

      return {
        curriculumId: curr.curriculumId,
        schoolId: curr.schoolId,
        academicYear: curr.academicYear,
        class: curr.class,
        sectionScope: curr.sectionScope || 'ALL',
        stream: curr.stream || 'Vocational IT/ITeS',
        trade: curr.trade || 'IT/ITeS',
        curriculumName: curr.curriculumName || `Class ${curr.class} Curriculum (${curr.academicYear})`,
        version: curr.version || 1,
        status: curr.status || 'DRAFT',
        effectiveFrom: curr.effectiveFrom || '',
        effectiveTo: curr.effectiveTo || '',
        subjectCount: subjects.length,
        mandatoryCount: mandatoryCount,
        optionalCount: optionalCount,
        theorySubjectsCount: theoryCount,
        practicalSubjectsCount: practicalCount,
        totalMaxMarks: totalMarks,
        createdAt: curr.createdAt,
        updatedAt: curr.updatedAt
      };
    }).sort((a, b) => (parseInt(a.class, 10) || 0) - (parseInt(b.class, 10) || 0));

    return {
      success: true,
      data: {
        curricula: enhancedCurricula,
        total: enhancedCurricula.length
      }
    };
  },

  getCurriculumById: function(session, payload) {
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied' } };
    }

    payload = payload || {};
    const curriculumId = String(payload.curriculumId || '').trim();
    if (!curriculumId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'curriculumId is required' } };
    }

    const curriculum = Database.findByPk('Curriculum', curriculumId);
    if (!curriculum) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Curriculum definition not found' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const allCurriculumSubjects = Database.readAll('CurriculumSubjects') || [];
    const subjects = allCurriculumSubjects.filter(function(cs) {
      return String(cs.curriculumId) === curriculumId;
    }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    // Matching teacher assignments
    const allAssignments = Database.readAll('StaffAssignments') || [];
    const activeStaffAssignments = allAssignments.filter(function(a) {
      return (!a.schoolId || a.schoolId === schoolId) &&
             String(a.academicYear) === String(curriculum.academicYear) &&
             String(a.class) === String(curriculum.class) &&
             (!a.status || a.status === 'ACTIVE' || a.status === 'Active');
    });

    // Version history for this class & stream
    const allCurricula = Database.readAll('Curriculum') || [];
    const versionHistory = allCurricula.filter(function(c) {
      return String(c.class) === String(curriculum.class) &&
             String(c.stream || '') === String(curriculum.stream || '');
    }).sort((a, b) => String(b.academicYear).localeCompare(String(a.academicYear)) || (b.version || 1) - (a.version || 1));

    return {
      success: true,
      data: {
        curriculum: curriculum,
        subjects: subjects,
        totalSubjects: subjects.length,
        teacherAssignments: activeStaffAssignments,
        versionHistory: versionHistory
      }
    };
  },

  saveCurriculum: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can create or edit curriculum' } };
    }

    payload = payload || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    const academicYear = String(payload.academicYear || '').trim();
    const classLevel = String(payload.class || payload.gradeLevel || '').trim();
    const stream = String(payload.stream || 'Vocational IT/ITeS').trim();
    const trade = String(payload.trade || 'IT/ITeS').trim();
    const sectionScope = String(payload.sectionScope || 'ALL').trim();
    const curriculumName = String(payload.curriculumName || `Class ${classLevel} Curriculum (${academicYear})`).trim();

    if (!academicYear) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Academic Year is required' } };
    }
    if (!classLevel) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Class level is required' } };
    }

    const inputSubjects = Array.isArray(payload.subjects) ? payload.subjects : [];
    if (inputSubjects.length === 0) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'At least one subject is required in curriculum' } };
    }

    // Backend validation of subjects
    const validatedSubjects = [];
    const seenSubjectCodes = new Set();
    const seenSubjectNames = new Set();

    for (let i = 0; i < inputSubjects.length; i++) {
      const s = inputSubjects[i];
      const sName = String(s.subjectName || s.name || '').trim();
      const sCode = String(s.subjectCode || s.code || `SUB_${i + 1}`).trim().toUpperCase();

      if (!sName) {
        return { success: false, error: { code: 'VALIDATION_ERROR', message: `Subject name is missing at position ${i + 1}` } };
      }

      if (seenSubjectNames.has(sName.toLowerCase())) {
        return { success: false, error: { code: 'DUPLICATE_SUBJECT', message: `Duplicate subject "${sName}" detected in curriculum` } };
      }
      seenSubjectNames.add(sName.toLowerCase());

      const comp = String(s.component || 'THEORY').toUpperCase();
      const hasTh = comp === 'THEORY' || comp === 'BOTH';
      const hasPr = comp === 'PRACTICAL' || comp === 'BOTH';

      const totalM = parseInt(s.totalMaxMarks || s.maxMarks, 10) || 100;
      let thM = parseInt(s.theoryMaxMarks, 10);
      let prM = parseInt(s.practicalMaxMarks, 10);

      if (isNaN(thM) && isNaN(prM)) {
        if (comp === 'BOTH') { thM = 70; prM = 30; }
        else if (comp === 'THEORY') { thM = totalM; prM = 0; }
        else { thM = 0; prM = totalM; }
      } else {
        thM = isNaN(thM) ? (hasTh ? totalM - (prM || 0) : 0) : thM;
        prM = isNaN(prM) ? (hasPr ? totalM - (thM || 0) : 0) : prM;
      }

      // Theory / Practical sum consistency check
      if (thM + prM !== totalM) {
        return {
          success: false,
          error: {
            code: 'MARKS_SUM_MISMATCH',
            message: `Marks mismatch for "${sName}": Theory (${thM}) + Practical (${prM}) != Total (${totalM})`
          }
        };
      }

      // Component mismatch checks
      if (!hasTh && thM > 0) {
        return { success: false, error: { code: 'COMPONENT_MISMATCH', message: `Subject "${sName}" is practical-only but has theory marks` } };
      }
      if (!hasPr && prM > 0) {
        return { success: false, error: { code: 'COMPONENT_MISMATCH', message: `Subject "${sName}" is theory-only but has practical marks` } };
      }

      const isOpt = s.isOptional === true || s.isMandatory === false;
      const subjectId = s.subjectId || `SUB_${classLevel}_${sCode.replace(/[^a-zA-Z0-9]/g, '_')}`;

      validatedSubjects.push({
        subjectId: subjectId,
        subjectCode: sCode,
        subjectName: sName,
        component: comp,
        isMandatory: !isOpt,
        isOptional: isOpt,
        hasTheory: hasTh,
        hasPractical: hasPr,
        theoryMaxMarks: thM,
        practicalMaxMarks: prM,
        totalMaxMarks: totalM,
        displayOrder: parseInt(s.displayOrder, 10) || (i + 1),
        status: 'ACTIVE'
      });
    }

    // Determine version and curriculumId
    let curriculumId = String(payload.curriculumId || '').trim();
    let version = parseInt(payload.version, 10) || 1;
    const allCurricula = Database.readAll('Curriculum') || [];

    if (!curriculumId) {
      const existingSameContext = allCurricula.filter(c =>
        String(c.academicYear) === academicYear &&
        String(c.class) === classLevel &&
        String(c.stream || '') === stream
      );
      version = existingSameContext.length + 1;
      curriculumId = `CURR_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_CLS_${classLevel}_${stream.replace(/[^a-zA-Z0-9]/g, '_')}_V${version}`;
    }

    const curriculumStatus = String(payload.status || 'DRAFT').toUpperCase();

    // If saving directly as PUBLISHED, archive prior published
    if (curriculumStatus === 'PUBLISHED') {
      const priorPublished = allCurricula.filter(c =>
        String(c.academicYear) === academicYear &&
        String(c.class) === classLevel &&
        String(c.stream || '') === stream &&
        (c.status || 'PUBLISHED').toUpperCase() === 'PUBLISHED' &&
        c.curriculumId !== curriculumId
      );
      priorPublished.forEach(p => {
        p.status = 'ARCHIVED';
        p.updatedAt = nowStr;
      });
      if (priorPublished.length > 0) {
        Database.upsertBatch('Curriculum', priorPublished);
      }
    }

    const curriculumRecord = {
      curriculumId: curriculumId,
      schoolId: schoolId,
      academicYear: academicYear,
      class: classLevel,
      sectionScope: sectionScope,
      stream: stream,
      trade: trade,
      curriculumName: curriculumName,
      version: version,
      status: curriculumStatus,
      effectiveFrom: payload.effectiveFrom || `${academicYear.substring(0, 4)}-04-01`,
      effectiveTo: payload.effectiveTo || `${parseInt(academicYear.substring(0, 4), 10) + 1}-03-31`,
      createdAt: payload.createdAt || nowStr,
      updatedAt: nowStr
    };

    Database.upsertBatch('Curriculum', [curriculumRecord]);

    // Save curriculum subjects
    const curriculumSubjectRecords = validatedSubjects.map(function(s) {
      return {
        curriculumSubjectId: `CSUB_${curriculumId}_${s.subjectCode.replace(/[^a-zA-Z0-9]/g, '_')}`,
        schoolId: schoolId,
        curriculumId: curriculumId,
        subjectId: s.subjectId,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        component: s.component,
        isMandatory: s.isMandatory,
        isOptional: s.isOptional,
        hasTheory: s.hasTheory,
        hasPractical: s.hasPractical,
        theoryMaxMarks: s.theoryMaxMarks,
        practicalMaxMarks: s.practicalMaxMarks,
        totalMaxMarks: s.totalMaxMarks,
        displayOrder: s.displayOrder,
        status: s.status,
        createdAt: nowStr,
        updatedAt: nowStr
      };
    });

    Database.upsertBatch('CurriculumSubjects', curriculumSubjectRecords);

    // Sync master Subjects table
    const subjectMasterRecords = validatedSubjects.map(function(s) {
      return {
        subjectId: s.subjectId,
        schoolId: schoolId,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        class: classLevel,
        stream: stream,
        trade: trade,
        hasTheory: s.hasTheory,
        hasPractical: s.hasPractical,
        theoryMaxMarks: s.theoryMaxMarks,
        practicalMaxMarks: s.practicalMaxMarks,
        maxMarks: s.totalMaxMarks,
        isMandatory: s.isMandatory,
        displayOrder: s.displayOrder,
        description: `${s.subjectName} for Class ${classLevel}`,
        status: 'Active',
        updatedAt: nowStr
      };
    });
    Database.upsertBatch('Subjects', subjectMasterRecords);

    Audit.log('SAVE_CURRICULUM', session.role, session.userId, {
      curriculumId: curriculumId,
      academicYear: academicYear,
      class: classLevel,
      subjectsCount: validatedSubjects.length,
      status: curriculumStatus
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Curriculum ${curriculumName} saved successfully (${curriculumStatus})`,
      data: {
        curriculum: curriculumRecord,
        subjects: curriculumSubjectRecords
      }
    };
  },

  publishCurriculum: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can publish curriculum' } };
    }

    payload = payload || {};
    const curriculumId = String(payload.curriculumId || '').trim();
    if (!curriculumId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'curriculumId is required' } };
    }

    const curriculum = Database.findByPk('Curriculum', curriculumId);
    if (!curriculum) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Curriculum not found' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    // Archive any currently published curriculum for this academic context
    const allCurricula = Database.readAll('Curriculum') || [];
    const priorPublished = allCurricula.filter(c =>
      String(c.academicYear) === String(curriculum.academicYear) &&
      String(c.class) === String(curriculum.class) &&
      String(c.stream || '') === String(curriculum.stream || '') &&
      (c.status || 'PUBLISHED').toUpperCase() === 'PUBLISHED' &&
      c.curriculumId !== curriculumId
    );

    priorPublished.forEach(p => {
      p.status = 'ARCHIVED';
      p.updatedAt = nowStr;
    });
    if (priorPublished.length > 0) {
      Database.upsertBatch('Curriculum', priorPublished);
    }

    curriculum.status = 'PUBLISHED';
    curriculum.updatedAt = nowStr;
    Database.upsertBatch('Curriculum', [curriculum]);

    Audit.log('PUBLISH_CURRICULUM', session.role, session.userId, {
      curriculumId: curriculumId,
      academicYear: curriculum.academicYear,
      class: curriculum.class,
      version: curriculum.version
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Curriculum "${curriculum.curriculumName}" published successfully`,
      data: {
        curriculum: curriculum,
        archivedCount: priorPublished.length
      }
    };
  },

  archiveCurriculum: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can archive curriculum' } };
    }

    payload = payload || {};
    const curriculumId = String(payload.curriculumId || '').trim();
    if (!curriculumId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'curriculumId is required' } };
    }

    const curriculum = Database.findByPk('Curriculum', curriculumId);
    if (!curriculum) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Curriculum not found' } };
    }

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    curriculum.status = 'ARCHIVED';
    curriculum.updatedAt = nowStr;
    Database.upsertBatch('Curriculum', [curriculum]);

    Audit.log('ARCHIVE_CURRICULUM', session.role, session.userId, {
      curriculumId: curriculumId
    }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: `Curriculum archived successfully`,
      data: { curriculum: curriculum }
    };
  },

  duplicateCurriculumToYear: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can duplicate curriculum' } };
    }

    payload = payload || {};
    const sourceCurriculumId = String(payload.sourceCurriculumId || '').trim();
    const targetAcademicYear = String(payload.targetAcademicYear || '').trim();

    if (!sourceCurriculumId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'sourceCurriculumId is required' } };
    }
    if (!targetAcademicYear) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'targetAcademicYear is required' } };
    }

    const sourceCurr = Database.findByPk('Curriculum', sourceCurriculumId);
    if (!sourceCurr) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Source curriculum not found' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    const allCurricula = Database.readAll('Curriculum') || [];
    const existingTargetVersions = allCurricula.filter(c =>
      String(c.academicYear) === targetAcademicYear &&
      String(c.class) === String(sourceCurr.class) &&
      String(c.stream || '') === String(sourceCurr.stream || '')
    );

    const newVersion = existingTargetVersions.length + 1;
    const newCurriculumId = `CURR_${targetAcademicYear.replace(/[^a-zA-Z0-9]/g, '_')}_CLS_${sourceCurr.class}_${String(sourceCurr.stream || '').replace(/[^a-zA-Z0-9]/g, '_')}_V${newVersion}`;

    const newCurriculum = {
      curriculumId: newCurriculumId,
      schoolId: schoolId,
      academicYear: targetAcademicYear,
      class: sourceCurr.class,
      sectionScope: sourceCurr.sectionScope || 'ALL',
      stream: sourceCurr.stream || 'Vocational IT/ITeS',
      trade: sourceCurr.trade || 'IT/ITeS',
      curriculumName: `Class ${sourceCurr.class} Curriculum (${targetAcademicYear})`,
      version: newVersion,
      status: 'DRAFT',
      effectiveFrom: `${targetAcademicYear.substring(0, 4)}-04-01`,
      effectiveTo: `${parseInt(targetAcademicYear.substring(0, 4), 10) + 1}-03-31`,
      createdAt: nowStr,
      updatedAt: nowStr
    };

    Database.upsertBatch('Curriculum', [newCurriculum]);

    // Copy subjects
    const allCurriculumSubjects = Database.readAll('CurriculumSubjects') || [];
    const sourceSubjects = allCurriculumSubjects.filter(cs => String(cs.curriculumId) === sourceCurriculumId);

    const newSubjects = sourceSubjects.map(function(s) {
      return {
        curriculumSubjectId: `CSUB_${newCurriculumId}_${s.subjectCode.replace(/[^a-zA-Z0-9]/g, '_')}`,
        schoolId: schoolId,
        curriculumId: newCurriculumId,
        subjectId: s.subjectId,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        component: s.component,
        isMandatory: s.isMandatory,
        isOptional: s.isOptional,
        hasTheory: s.hasTheory,
        hasPractical: s.hasPractical,
        theoryMaxMarks: s.theoryMaxMarks,
        practicalMaxMarks: s.practicalMaxMarks,
        totalMaxMarks: s.totalMaxMarks,
        displayOrder: s.displayOrder,
        status: 'ACTIVE',
        createdAt: nowStr,
        updatedAt: nowStr
      };
    });

    if (newSubjects.length > 0) {
      Database.upsertBatch('CurriculumSubjects', newSubjects);
    }

    Audit.log('DUPLICATE_CURRICULUM', session.role, session.userId, {
      sourceCurriculumId: sourceCurriculumId,
      targetCurriculumId: newCurriculumId,
      targetAcademicYear: targetAcademicYear,
      subjectsCopied: newSubjects.length
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Curriculum successfully duplicated to ${targetAcademicYear} as DRAFT (Version ${newVersion})`,
      data: {
        curriculum: newCurriculum,
        subjects: newSubjects
      }
    };
  },

  getCurriculumHistory: function(session, query) {
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied' } };
    }

    query = query || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    let allCurricula = Database.readAll('Curriculum') || [];
    allCurricula = allCurricula.filter(c => !c.schoolId || c.schoolId === schoolId);

    if (query.class && query.class !== 'ALL') {
      allCurricula = allCurricula.filter(c => String(c.class) === String(query.class));
    }
    if (query.stream && query.stream !== 'ALL') {
      allCurricula = allCurricula.filter(c => String(c.stream).toLowerCase() === String(query.stream).toLowerCase());
    }

    const history = allCurricula.sort((a, b) => {
      return String(b.academicYear).localeCompare(String(a.academicYear)) ||
             (parseInt(a.class, 10) || 0) - (parseInt(b.class, 10) || 0) ||
             (b.version || 1) - (a.version || 1);
    });

    return {
      success: true,
      data: {
        history: history,
        total: history.length
      }
    };
  },

  // ==========================================
  // 12.1 SUBJECT MASTER
  // ==========================================

  getSubjectMaster: function(session, query) {
    query = query || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    let subjects = Database.readAll('Subjects') || [];

    if (subjects.length === 0) {
      // Seed standard Gameri HSS subjects
      const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
      subjects = [
        { subjectId: 'SUB_9_IT', schoolId: schoolId, subjectCode: 'IT-402', subjectName: 'Information Technology / ITeS', class: '9', stream: 'Vocational', trade: 'IT/ITeS', hasTheory: true, hasPractical: true, theoryMaxMarks: 70, practicalMaxMarks: 30, maxMarks: 100, isMandatory: true, displayOrder: 1, status: 'Active', updatedAt: nowStr },
        { subjectId: 'SUB_9_ES', schoolId: schoolId, subjectCode: 'ES-101', subjectName: 'Employability Skills', class: '9', stream: 'Vocational', trade: 'General', hasTheory: true, hasPractical: false, theoryMaxMarks: 50, practicalMaxMarks: 0, maxMarks: 50, isMandatory: true, displayOrder: 2, status: 'Active', updatedAt: nowStr },
        { subjectId: 'SUB_10_IT', schoolId: schoolId, subjectCode: 'IT-402', subjectName: 'Information Technology / ITeS', class: '10', stream: 'Vocational', trade: 'IT/ITeS', hasTheory: true, hasPractical: true, theoryMaxMarks: 70, practicalMaxMarks: 30, maxMarks: 100, isMandatory: true, displayOrder: 1, status: 'Active', updatedAt: nowStr },
        { subjectId: 'SUB_10_ES', schoolId: schoolId, subjectCode: 'ES-101', subjectName: 'Employability Skills', class: '10', stream: 'Vocational', trade: 'General', hasTheory: true, hasPractical: false, theoryMaxMarks: 50, practicalMaxMarks: 0, maxMarks: 50, isMandatory: true, displayOrder: 2, status: 'Active', updatedAt: nowStr },
        { subjectId: 'SUB_11_IT', schoolId: schoolId, subjectCode: 'IT-802', subjectName: 'Information Technology', class: '11', stream: 'Vocational', trade: 'IT/ITeS', hasTheory: true, hasPractical: true, theoryMaxMarks: 70, practicalMaxMarks: 30, maxMarks: 100, isMandatory: true, displayOrder: 1, status: 'Active', updatedAt: nowStr },
        { subjectId: 'SUB_12_IT', schoolId: schoolId, subjectCode: 'IT-802', subjectName: 'Information Technology', class: '12', stream: 'Vocational', trade: 'IT/ITeS', hasTheory: true, hasPractical: true, theoryMaxMarks: 70, practicalMaxMarks: 30, maxMarks: 100, isMandatory: true, displayOrder: 1, status: 'Active', updatedAt: nowStr }
      ];
      Database.upsertBatch('Subjects', subjects);
    }

    if (query.class && query.class !== 'ALL') {
      subjects = subjects.filter(s => String(s.class) === String(query.class));
    }
    if (query.status && query.status !== 'ALL') {
      subjects = subjects.filter(s => (s.status || 'Active').toUpperCase() === String(query.status).toUpperCase());
    }
    if (query.stream && query.stream !== 'ALL') {
      subjects = subjects.filter(s => String(s.stream || '').toLowerCase() === String(query.stream).toLowerCase());
    }

    return {
      success: true,
      data: {
        subjects: subjects,
        total: subjects.length
      }
    };
  },

  saveSubjectMaster: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can manage subject master' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const inputSubjects = Array.isArray(payload.subjects) ? payload.subjects : [payload];

    const records = inputSubjects.map(s => {
      const cls = String(s.class || '9');
      const code = String(s.subjectCode || 'IT').trim().toUpperCase();
      const subjectId = s.subjectId || `SUB_${cls}_${code.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const hasTh = s.hasTheory !== false;
      const hasPr = s.hasPractical === true;
      const totalM = parseInt(s.maxMarks || s.totalMaxMarks, 10) || 100;
      const prM = hasPr ? (parseInt(s.practicalMaxMarks, 10) || 30) : 0;
      const thM = hasTh ? (parseInt(s.theoryMaxMarks, 10) || (totalM - prM)) : 0;

      return {
        subjectId: subjectId,
        schoolId: schoolId,
        subjectCode: code,
        subjectName: s.subjectName || 'Subject',
        class: cls,
        stream: s.stream || 'Vocational',
        trade: s.trade || 'IT/ITeS',
        hasTheory: hasTh,
        hasPractical: hasPr,
        theoryMaxMarks: thM,
        practicalMaxMarks: prM,
        maxMarks: totalM,
        isMandatory: s.isMandatory !== false,
        displayOrder: parseInt(s.displayOrder, 10) || 1,
        description: s.description || '',
        status: s.status || 'Active',
        updatedAt: nowStr
      };
    });

    Database.upsertBatch('Subjects', records);
    Audit.log('SAVE_SUBJECT_MASTER', session.role, session.userId, { count: records.length }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Saved ${records.length} subjects in Subject Master`,
      data: { subjects: records }
    };
  },

  setSubjectStatus: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can toggle subject status' } };
    }

    payload = payload || {};
    const subjectId = String(payload.subjectId || '').trim();
    const newStatus = String(payload.status || 'Active').trim();

    if (!subjectId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'subjectId is required' } };
    }

    const subject = Database.findByPk('Subjects', subjectId);
    if (!subject) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Subject not found' } };
    }

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    subject.status = newStatus;
    subject.updatedAt = nowStr;
    Database.upsertBatch('Subjects', [subject]);

    Audit.log('SET_SUBJECT_STATUS', session.role, session.userId, {
      subjectId: subjectId,
      status: newStatus
    }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: `Subject status updated to ${newStatus}`,
      data: { subject: subject }
    };
  },

  // Legacy getSubjects & saveSubjects bridge (backward compatibility)
  getSubjects: function(session, query) {
    return this.getSubjectMaster(session, query);
  },

  saveSubjects: function(session, payload) {
    return this.saveSubjectMaster(session, payload);
  },

  // ==========================================
  // 13. ENROLLMENTS & STUDENT HISTORY
  // ==========================================

  getEnrollments: function(session, query) {
    query = query || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    let enrollments = Database.readAll('Enrollments');

    if (query.studentId) {
      if (!Security.canAccessStudent(session, query.studentId)) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to requested student enrollments' } };
      }
      enrollments = enrollments.filter(e => String(e.studentId) === String(query.studentId));
    } else {
      if (session.role === 'STUDENT') {
        enrollments = enrollments.filter(e => String(e.studentId) === String(session.userId));
      } else if (session.role === 'PARENT') {
        const authorizedIds = Security.getAuthorizedStudentIdsForParent(session.userId, schoolId);
        enrollments = enrollments.filter(e => authorizedIds.includes(String(e.studentId)));
      } else if (session.role === 'TEACHER') {
        const assigned = Security.getTeacherAssignedClasses(session.userId, schoolId);
        if (assigned.length > 0) {
          enrollments = enrollments.filter(e => assigned.includes(String(e.class)));
        }
      }
    }

    if (query.academicYear) {
      enrollments = enrollments.filter(e => e.academicYear === query.academicYear);
    }
    if (query.class) {
      enrollments = enrollments.filter(e => String(e.class) === String(query.class));
    }
    if (query.section) {
      enrollments = enrollments.filter(e => String(e.section) === String(query.section));
    }

    return {
      success: true,
      data: {
        enrollments: enrollments,
        total: enrollments.length
      }
    };
  },

  saveEnrollments: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL', 'TEACHER'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to modify enrollments' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const input = Array.isArray(payload.enrollments) ? payload.enrollments : [payload];

    const records = input.map(e => {
      const sid = String(e.studentId);
      const year = String(e.academicYear || '2026-2027');
      const enrollmentId = e.enrollmentId || `ENR_${sid}_${year.replace(/[^a-zA-Z0-9]/g, '_')}`;
      return {
        enrollmentId: enrollmentId,
        schoolId: schoolId,
        studentId: sid,
        academicYear: year,
        class: String(e.class || '9'),
        section: String(e.section || 'A'),
        rollNo: String(e.rollNo || ''),
        status: e.status || 'ACTIVE',
        promotionDecision: e.promotionDecision || 'PENDING',
        remarks: e.remarks || '',
        createdAt: e.createdAt || nowStr,
        updatedAt: nowStr
      };
    });

    Database.upsertBatch('Enrollments', records);
    Audit.log('SAVE_ENROLLMENTS', session.role, session.userId, { count: records.length }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Saved ${records.length} enrollment records`,
      data: { enrollments: records }
    };
  },

  /**
   * Retrieves full chronological academic history for a student across all academic years.
   */
  getAcademicHistory: function(session, payload) {
    return this.getStudentHistory(session, payload);
  },

  getStudentHistory: function(session, payload) {
    const studentId = payload && (payload.studentId || payload.userId || session.userId);
    if (!studentId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId is required' } };
    }

    if (!Security.canAccessStudent(session, studentId)) {
      Audit.log('UNAUTHORIZED_STUDENT_HISTORY_ACCESS', session.role, session.userId, { targetStudentId: studentId }, 'DENIED', '', session.schoolId);
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied: You are not authorized to view this student\'s academic history.' } };
    }

    const student = Database.findByPk('Students', studentId);
    if (!student) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Student not found' } };
    }

    const allEnrollments = Database.readAll('Enrollments').filter(e => String(e.studentId) === String(studentId));
    const allMarks = Database.readAll('Marks').filter(m => String(m.studentId) === String(studentId));
    const allAttendance = Database.readAll('Attendance').filter(a => String(a.studentId) === String(studentId));

    let history = allEnrollments.map(e => {
      const year = e.academicYear;
      const yrMarks = allMarks.filter(m => m.academicYear === year || (!m.academicYear && (e.status === 'ACTIVE' || e.isCurrent)));
      const yrAtt = allAttendance.filter(a => a.academicYear === year || (!a.academicYear && (e.status === 'ACTIVE' || e.isCurrent)));
      const presentCount = yrAtt.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;
      const totalAtt = yrAtt.length;
      const attPct = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 100;

      return {
        academicYear: e.academicYear,
        class: e.class,
        section: e.section,
        rollNo: e.rollNo,
        status: e.status,
        promotionDecision: e.promotionDecision,
        attendancePercentage: attPct,
        totalRecordedDays: totalAtt,
        marksCount: yrMarks.length,
        remarks: e.remarks || ''
      };
    });

    if (history.length === 0) {
      const currentSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
      const activeYear = currentSetting ? currentSetting.value : '2026-2027';
      const presentCount = allAttendance.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;
      const totalAtt = allAttendance.length;
      const attPct = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 100;

      history = [{
        academicYear: activeYear,
        class: student.class || '9',
        section: student.section || 'A',
        rollNo: student.rollNo || '',
        status: student.status || 'Active',
        promotionDecision: 'ACTIVE',
        attendancePercentage: attPct,
        totalRecordedDays: totalAtt,
        marksCount: allMarks.length,
        remarks: 'Current Active Enrollment'
      }];
    }

    history.sort((a, b) => String(a.academicYear).localeCompare(String(b.academicYear)));

    Audit.log('STUDENT_HISTORY_ACCESS', session.role, session.userId, { studentId: studentId, yearsCount: history.length }, 'SUCCESS', '', session.schoolId);

    return {
      success: true,
      data: {
        student: AcademicApi.sanitizeStudent(student),
        history: history,
        totalYears: history.length
      }
    };
  },

  // ==========================================
  // 14. EXAMINATIONS & RESULT ENGINE (Examination 2.0 Subsystem)
  // ==========================================

  getExaminations: function(session, query) {
    if (typeof ExaminationApi !== 'undefined' && ExaminationApi.getExaminations) {
      return ExaminationApi.getExaminations(session, query);
    }
    return { success: true, data: { examinations: [], total: 0 } };
  },

  saveExaminations: function(session, payload) {
    if (typeof ExaminationApi !== 'undefined' && ExaminationApi.saveExaminations) {
      return ExaminationApi.saveExaminations(session, payload);
    }
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'ExaminationApi not loaded' } };
  },

  calculateExamResults: function(session, payload) {
    if (typeof ExaminationApi !== 'undefined' && ExaminationApi.calculateExamResults) {
      return ExaminationApi.calculateExamResults(session, payload);
    }
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'ExaminationApi not loaded' } };
  },

  getExamResults: function(session, payload) {
    if (typeof ExaminationApi !== 'undefined' && ExaminationApi.getExamResults) {
      return ExaminationApi.getExamResults(session, payload);
    }
    return { success: true, data: { results: [], total: 0 } };
  },

  reviseExamResult: function(session, payload) {
    return ExaminationApi.reviseExamResult(session, payload);
  },

  getExamAnalytics: function(session, query) {
    return ExaminationApi.getExamAnalytics(session, query);
  },

  getExamSchedules: function(session, query) {
    return ExaminationApi.getExamSchedules(session, query);
  },

  saveExamSchedules: function(session, payload) {
    return ExaminationApi.saveExamSchedules(session, payload);
  },

  // ==========================================
  // STUDENT PHOTO UPLOAD (Requirement #6)
  // ==========================================
  uploadStudentPhoto: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to upload student photo' } };
    }

    const sid = String(payload.studentId || (session.role === 'STUDENT' ? session.userId : '')).trim();
    if (!sid) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId is required' } };
    }

    // Role ownership check
    if (session.role === 'STUDENT' && String(session.userId) !== sid) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Students can only upload their own profile photo' } };
    }
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) {
      return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };
    }

    const photoUrl = payload.photoUrl || payload.photo || '';
    if (!photoUrl) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'photoUrl is required' } };
    }

    if (photoUrl.length > 3000000) {
      return { success: false, error: { code: 'FILE_TOO_LARGE', message: 'Photo must be under 2MB in size' } };
    }

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    student.photoUrl = photoUrl;
    student.updatedAt = nowStr;

    Database.upsertBatch('Students', [student]);
    Audit.log('UPDATE_STUDENT_PHOTO', session.role, session.userId, { studentId: sid }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: 'Student profile photo updated successfully',
      data: {
        studentId: sid,
        photoUrl: photoUrl
      }
    };
  },

  // ==========================================
  // PRACTICAL LIST MANAGEMENT (Requirement #8)
  // ==========================================
  getPracticalLists: function(session, payload) {
    payload = payload || {};
    const schoolId = session?.schoolId || DEFAULT_SCHOOL_ID;
    const allPracticals = Database.readAll('PracticalLists').filter(p => !p.schoolId || p.schoolId === schoolId);
    let filtered = allPracticals;

    if (payload.class && payload.class !== 'All' && payload.class !== 'ALL') {
      filtered = filtered.filter(p => String(p.class) === String(payload.class));
    }
    if (payload.section && payload.section !== 'All') {
      filtered = filtered.filter(p => !p.sectionScope || p.sectionScope === 'ALL' || String(p.sectionScope).toUpperCase() === String(payload.section).toUpperCase());
    }
    if (payload.academicYear) {
      filtered = filtered.filter(p => !p.academicYear || p.academicYear === payload.academicYear);
    }
    if (payload.subject) {
      filtered = filtered.filter(p => !p.subjectName || p.subjectName.toLowerCase().includes(String(payload.subject).toLowerCase()));
    }

    filtered.sort((a, b) => (parseInt(a.displayOrder) || 0) - (parseInt(b.displayOrder) || 0));

    return {
      success: true,
      data: {
        practicals: filtered,
        total: filtered.length
      }
    };
  },

  savePracticalItem: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Write permission denied for Practical List' } };
    }

    payload = payload || {};
    const targetClass = String(payload.class || '9').trim();
    if (session.role === 'TEACHER' && !Security.canAccessClass(session, targetClass)) {
      return { success: false, error: { code: 'UNAUTHORIZED_CLASS', message: 'Permission denied for class: ' + targetClass } };
    }

    const title = String(payload.title || '').trim();
    if (!title) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Practical experiment title is required' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const practicalId = payload.practicalId || payload.id || Auth.generateId('PRAC');
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const defaultAcademicYear = activeSetting ? String(activeSetting.value).trim() : '2026-2027';

    const record = {
      practicalId: practicalId,
      schoolId: schoolId,
      academicYear: payload.academicYear || defaultAcademicYear,
      class: targetClass,
      sectionScope: (payload.sectionScope || payload.section || 'ALL').toUpperCase(),
      stream: payload.stream || 'Vocational IT/ITeS',
      trade: payload.trade || 'IT/ITeS',
      subjectId: payload.subjectId || `IT_${targetClass}`,
      subjectName: payload.subjectName || 'Information Technology (IT/ITeS)',
      title: title,
      description: payload.description || '',
      instructions: payload.instructions || '',
      displayOrder: parseInt(payload.displayOrder) || 1,
      status: (payload.status || 'ACTIVE').toUpperCase(),
      createdBy: payload.createdBy || session.userId,
      createdAt: payload.createdAt || nowStr,
      updatedAt: nowStr
    };

    Database.upsertBatch('PracticalLists', [record]);
    Audit.log('SAVE_PRACTICAL', session.role, session.userId, { practicalId: practicalId, title: title }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: 'Practical item saved successfully',
      data: {
        practical: record
      }
    };
  },

  deletePracticalItem: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Delete permission denied for Practical List' } };
    }

    payload = payload || {};
    const practicalId = payload.practicalId || payload.id;
    if (!practicalId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'practicalId is required' } };
    }

    const practical = Database.findByPk('PracticalLists', practicalId);
    if (!practical) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Practical item not found' } };
    }

    if (session.role === 'TEACHER' && practical.class && !Security.canAccessClass(session, practical.class)) {
      return { success: false, error: { code: 'UNAUTHORIZED_CLASS', message: 'Permission denied for class: ' + practical.class } };
    }

    Database.deleteBatch('PracticalLists', [practicalId]);
    Audit.log('DELETE_PRACTICAL', session.role, session.userId, { practicalId: practicalId, title: practical.title }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: 'Practical item deleted successfully',
      data: { practicalId: practicalId }
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AcademicApi };
}
