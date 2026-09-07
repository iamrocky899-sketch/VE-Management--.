/**
 * VE MANAGEMENT — ATTENDANCE & ACADEMIC OPERATIONS 2.0 API (STEP 10)
 * Institutional Entity: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Implements authoritative attendance session lifecycle, theory/practical breakdown,
 * teacher scoping, multi-child parent isolation, offline idempotency, controlled corrections,
 * and authoritative metrics calculation without altering grading invariants.
 */

var AttendanceApi = {

  /**
   * Retrieves attendance records filtered by query and scoped by caller role.
   */
  getAttendance: function(session, query) {
    query = query || {};
    const allAttendance = Database.readAll('Attendance');
    let filtered = Security.filterAttendanceForSession(session, allAttendance);

    if (query.studentId) filtered = filtered.filter(a => String(a.studentId) === String(query.studentId));
    if (query.date) filtered = filtered.filter(a => String(a.date) === String(query.date));
    if (query.startDate && query.endDate) {
      filtered = filtered.filter(a => a.date >= query.startDate && a.date <= query.endDate);
    }
    if (query.class) filtered = filtered.filter(a => String(a.class) === String(query.class));
    if (query.section && query.section !== 'ALL') {
      filtered = filtered.filter(a => String(a.section || 'A').toUpperCase() === String(query.section).toUpperCase());
    }
    if (query.academicYear) {
      filtered = filtered.filter(a => !a.academicYear || String(a.academicYear) === String(query.academicYear));
    }
    if (query.subject) {
      filtered = filtered.filter(a => !a.subject || String(a.subject).toLowerCase().includes(String(query.subject).toLowerCase()));
    }
    if (query.component) {
      filtered = filtered.filter(a => !a.component || String(a.component).toUpperCase() === String(query.component).toUpperCase());
    }
    if (query.sessionId) {
      filtered = filtered.filter(a => String(a.sessionId) === String(query.sessionId));
    }

    return {
      success: true,
      data: {
        attendance: filtered,
        total: filtered.length
      }
    };
  },

  /**
   * Saves or updates attendance records with full validation, scoping, and session tracking.
   */
  saveAttendance: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Write permission denied for Attendance' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const currentSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const academicYear = String(payload.academicYear || (currentSetting ? currentSetting.value : '2026-2027')).trim();
    const targetClass = String(payload.class || '').trim();
    const targetSection = String(payload.section || 'A').trim();
    const targetSubject = String(payload.subject || '').trim();
    const targetComponent = String(payload.component || 'THEORY').toUpperCase();
    const targetPeriod = String(payload.period || '1').trim();
    const targetDate = String(payload.date || Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd')).trim();
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    // 1. Teacher Academic Scoping Check
    if (session.role === 'TEACHER') {
      if (targetClass && !Security.canAccessClass(session, targetClass)) {
        return { success: false, error: { code: 'UNAUTHORIZED_CLASS', message: 'Permission denied for unassigned class: ' + targetClass } };
      }
      if (targetSubject && !Security.canTeacherManageSubject(session, targetSubject, targetComponent)) {
        return { success: false, error: { code: 'UNAUTHORIZED_SUBJECT', message: 'Permission denied for unassigned subject or component: ' + targetSubject } };
      }
    }

    // 2. Validate Subject Component compatibility if subject specified
    if (targetSubject && targetClass) {
      const resolved = AcademicApi.resolveCurriculumForContext(schoolId, academicYear, targetClass, targetSection);
      if (resolved && resolved.subjects && resolved.subjects.length > 0) {
        const matchSub = resolved.subjects.find(s =>
          String(s.subjectName || '').toLowerCase().trim() === targetSubject.toLowerCase().trim() ||
          String(s.subjectCode || '').toLowerCase().trim() === targetSubject.toLowerCase().trim()
        );
        if (matchSub) {
          if (targetComponent === 'THEORY' && matchSub.hasTheory === false) {
            return { success: false, error: { code: 'COMPONENT_MISMATCH', message: `Subject '${targetSubject}' does not have a theory component.` } };
          }
          if (targetComponent === 'PRACTICAL' && matchSub.hasPractical === false) {
            return { success: false, error: { code: 'COMPONENT_MISMATCH', message: `Subject '${targetSubject}' does not have a practical component.` } };
          }
        }
      }
    }

    // 3. Resolve Session and Check Lock Status
    const cleanSubjCode = targetSubject.replace(/[^a-zA-Z0-9]/g, '_');
    const sessionId = payload.sessionId || `ASESS_${schoolId}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${targetDate}_${targetClass}_${targetSection}_${cleanSubjCode}_${targetComponent}_P${targetPeriod}`;
    const existingSession = Database.findByPk('AttendanceSessions', sessionId);

    if (existingSession && (existingSession.isLocked || existingSession.status === 'LOCKED')) {
      if (!['ADMIN', 'PRINCIPAL'].includes(session.role)) {
        return {
          success: false,
          error: {
            code: 'SESSION_LOCKED',
            message: 'This attendance session has been locked. Modifications require Administrator or Principal authorization.'
          }
        };
      }
    }

    // 4. Parse and Validate Attendance Records
    const attRecords = [];
    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'EXCUSED'];
    const absentStudentIds = [];

    if (Array.isArray(payload.attendance)) {
      for (let i = 0; i < payload.attendance.length; i++) {
        const item = payload.attendance[i];
        const sid = String(item.studentId || '').trim();
        if (!sid) continue;

        const rowClass = String(item.class || targetClass || '').trim();
        const rowSection = String(item.section || targetSection || 'A').trim();
        const rowDate = String(item.date || targetDate).trim();
        const rowSubject = String(item.subject || targetSubject).trim();
        const rowComponent = String(item.component || targetComponent).toUpperCase();
        const rowPeriod = String(item.period || targetPeriod).trim();
        let status = String(item.status || 'PRESENT').toUpperCase().trim();

        if (!validStatuses.includes(status)) {
          return { success: false, error: { code: 'INVALID_STATUS', message: `Invalid attendance status: '${status}'. Allowed: ${validStatuses.join(', ')}` } };
        }

        // Teacher student access check
        if (session.role === 'TEACHER') {
          if (rowClass && !Security.canAccessClass(session, rowClass)) {
            return { success: false, error: { code: 'UNAUTHORIZED_CLASS', message: 'Permission denied for class: ' + rowClass } };
          }
          if (!Security.canAccessStudent(session, sid, rowClass)) {
            return { success: false, error: { code: 'UNAUTHORIZED_STUDENT', message: 'Permission denied for student: ' + sid } };
          }
        }

        // Idempotency Key
        const cleanSub = rowSubject.replace(/[^a-zA-Z0-9]/g, '_');
        const attId = item.attendanceId || `ATT_${schoolId}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${rowDate}_${rowClass}_${rowSection}_${cleanSub}_${rowComponent}_P${rowPeriod}_${sid}`;

        if (status === 'ABSENT') {
          absentStudentIds.push(sid);
        }

        attRecords.push({
          attendanceId: attId,
          schoolId: schoolId,
          academicYear: academicYear,
          sessionId: sessionId,
          date: rowDate,
          class: rowClass,
          section: rowSection,
          subject: rowSubject,
          component: rowComponent,
          period: rowPeriod,
          teacherId: session.userId,
          studentId: sid,
          status: status,
          source: item.source || payload.source || 'STAFF_PORTAL',
          reason: item.reason || '',
          correctedBy: item.correctedBy || '',
          correctedAt: item.correctedAt || '',
          updatedAt: nowStr
        });
      }
    } else if (payload.attendance && typeof payload.attendance === 'object') {
      // Legacy map support: { [studentId]: "PRESENT" } or { "2026-08-29": ["STU_1"] }
      for (const key in payload.attendance) {
        const val = payload.attendance[key];
        if (Array.isArray(val)) {
          // Key is date, val is array of present student IDs
          val.forEach(function(sid) {
            const attId = `ATT_${schoolId}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${key}_${targetClass}_${targetSection}_${cleanSubjCode}_${targetComponent}_P${targetPeriod}_${sid}`;
            attRecords.push({
              attendanceId: attId,
              schoolId: schoolId,
              academicYear: academicYear,
              sessionId: sessionId,
              date: key,
              class: targetClass,
              section: targetSection,
              subject: targetSubject,
              component: targetComponent,
              period: targetPeriod,
              teacherId: session.userId,
              studentId: sid,
              status: 'PRESENT',
              source: payload.source || 'ADMIN_APP',
              updatedAt: nowStr
            });
          });
        } else if (typeof val === 'string') {
          // Key is studentId, val is status string
          const sid = key;
          const status = val.toUpperCase().trim();
          if (!validStatuses.includes(status)) continue;

          if (session.role === 'TEACHER' && !Security.canAccessStudent(session, sid, targetClass)) {
            continue;
          }

          if (status === 'ABSENT') absentStudentIds.push(sid);

          const attId = `ATT_${schoolId}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${targetDate}_${targetClass}_${targetSection}_${cleanSubjCode}_${targetComponent}_P${targetPeriod}_${sid}`;
          attRecords.push({
            attendanceId: attId,
            schoolId: schoolId,
            academicYear: academicYear,
            sessionId: sessionId,
            date: targetDate,
            class: targetClass,
            section: targetSection,
            subject: targetSubject,
            component: targetComponent,
            period: targetPeriod,
            teacherId: session.userId,
            studentId: sid,
            status: status,
            source: payload.source || 'STAFF_PORTAL',
            updatedAt: nowStr
          });
        }
      }
    }

    if (attRecords.length === 0) {
      return { success: true, message: 'No attendance records to save', data: { count: 0 } };
    }

    // 5. Upsert Attendance Records
    const dbResult = Database.upsertBatch('Attendance', attRecords);

    // 6. Compute Session Metrics and Upsert AttendanceSession
    const presentCount = attRecords.filter(r => r.status === 'PRESENT').length;
    const absentCount = attRecords.filter(r => r.status === 'ABSENT').length;
    const lateCount = attRecords.filter(r => r.status === 'LATE').length;
    const leaveCount = attRecords.filter(r => r.status === 'LEAVE' || r.status === 'EXCUSED').length;

    // Enrolled class student count for stability
    const enrolledStudents = Database.readAll('Students').filter(s =>
      String(s.class) === String(targetClass) &&
      (!targetSection || targetSection === 'ALL' || String(s.section || 'A').toUpperCase() === String(targetSection).toUpperCase()) &&
      (s.status || 'Active') === 'Active'
    );
    const expectedRosterCount = enrolledStudents.length > 0 ? enrolledStudents.length : attRecords.length;
    const finalTotalStudents = Math.max(expectedRosterCount, attRecords.length, (existingSession ? existingSession.totalStudents || 0 : 0));

    const sessionRecord = {
      sessionId: sessionId,
      schoolId: schoolId,
      academicYear: academicYear,
      date: targetDate,
      class: targetClass,
      section: targetSection,
      stream: payload.stream || 'Vocational IT/ITeS',
      subjectId: payload.subjectId || cleanSubjCode,
      subjectName: targetSubject,
      component: targetComponent,
      period: targetPeriod,
      teacherId: session.userId,
      teacherName: session.identifier || session.staffName || 'Teacher',
      status: payload.lockImmediately ? 'LOCKED' : (payload.status || 'SUBMITTED'),
      source: payload.source || 'STAFF_PORTAL',
      totalStudents: finalTotalStudents,
      presentCount: presentCount,
      absentCount: absentCount,
      lateCount: lateCount,
      leaveCount: leaveCount,
      isLocked: payload.lockImmediately === true,
      lockedBy: payload.lockImmediately ? session.userId : (existingSession?.lockedBy || ''),
      lockedAt: payload.lockImmediately ? nowStr : (existingSession?.lockedAt || ''),
      createdAt: existingSession?.createdAt || nowStr,
      updatedAt: nowStr
    };

    Database.upsertBatch('AttendanceSessions', [sessionRecord]);

    // 7. Trigger WhatsApp Absence Notifications (Failure-Isolated)
    if (absentStudentIds.length > 0 && payload.sendAbsenceNotification !== false) {
      try {
        this._dispatchAbsenceNotifications(schoolId, academicYear, targetDate, targetClass, targetSection, absentStudentIds);
      } catch (notifErr) {
        // Notification failure never corrupts attendance save
        console.warn('Absence notification dispatch warning:', notifErr.message);
      }
    }

    // 8. Audit Log
    Audit.log('SAVE_ATTENDANCE', session.role, session.userId, {
      sessionId: sessionId,
      count: attRecords.length,
      class: targetClass,
      section: targetSection,
      subject: targetSubject,
      component: targetComponent,
      date: targetDate,
      present: presentCount,
      absent: absentCount
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Saved attendance for ${attRecords.length} students (${presentCount} Present, ${absentCount} Absent)`,
      data: {
        sessionId: sessionId,
        count: attRecords.length,
        session: sessionRecord,
        dbResult: dbResult
      }
    };
  },

  /**
   * Retrieves list of attendance sessions.
   */
  getAttendanceSessions: function(session, query) {
    query = query || {};
    const allSessions = Database.readAll('AttendanceSessions');
    let filtered = allSessions;

    if (session.role === 'TEACHER') {
      const scope = Security.getTeacherAcademicScope(session.userId, session.schoolId, query.academicYear);
      if (scope.classes.length > 0) {
        filtered = filtered.filter(s => scope.classes.includes(String(s.class)));
      }
    }

    if (query.academicYear) filtered = filtered.filter(s => String(s.academicYear) === String(query.academicYear));
    if (query.class) filtered = filtered.filter(s => String(s.class) === String(query.class));
    if (query.section) filtered = filtered.filter(s => String(s.section).toUpperCase() === String(query.section).toUpperCase());
    if (query.date) filtered = filtered.filter(s => String(s.date) === String(query.date));
    if (query.status) filtered = filtered.filter(s => String(s.status).toUpperCase() === String(query.status).toUpperCase());

    return {
      success: true,
      data: {
        sessions: filtered.sort((a, b) => (b.date || '').localeCompare(a.date || '')),
        total: filtered.length
      }
    };
  },

  /**
   * Performs controlled correction of a single or batch attendance record.
   */
  correctAttendanceRecord: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Write permission denied for Attendance Correction' } };
    }

    const attendanceId = payload.attendanceId;
    if (!attendanceId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'attendanceId is required for correction' } };
    }

    const record = Database.findByPk('Attendance', attendanceId);
    if (!record) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Attendance record not found' } };
    }

    // Check if session is locked
    if (record.sessionId) {
      const parentSession = Database.findByPk('AttendanceSessions', record.sessionId);
      if (parentSession && (parentSession.isLocked || parentSession.status === 'LOCKED')) {
        if (!['ADMIN', 'PRINCIPAL'].includes(session.role)) {
          return {
            success: false,
            error: {
              code: 'REQUIRES_ADMIN_APPROVAL',
              message: 'Locked attendance records can only be corrected by an Administrator or Principal.'
            }
          };
        }
      }
    }

    // Teacher authorization
    if (session.role === 'TEACHER') {
      if (!Security.canAccessClass(session, record.class)) {
        return { success: false, error: { code: 'UNAUTHORIZED_CLASS', message: 'Cannot correct record outside assigned class' } };
      }
      if (record.subject && !Security.canTeacherManageSubject(session, record.subject, record.component)) {
        return { success: false, error: { code: 'UNAUTHORIZED_SUBJECT', message: 'Cannot correct record for unassigned subject' } };
      }
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'EXCUSED'];
    const newStatus = String(payload.newStatus || payload.status || '').toUpperCase().trim();
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: { code: 'INVALID_STATUS', message: 'Invalid target status. Allowed: ' + validStatuses.join(', ') } };
    }

    const originalStatus = record.status;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    record.status = newStatus;
    record.reason = payload.reason || `Corrected from ${originalStatus} to ${newStatus}`;
    record.correctedBy = session.userId;
    record.correctedAt = nowStr;
    record.updatedAt = nowStr;

    Database.upsertBatch('Attendance', [record]);

    // Recalculate session counts if applicable
    if (record.sessionId) {
      const sessionRecords = Database.findBy('Attendance', r => r.sessionId === record.sessionId);
      const parentSession = Database.findByPk('AttendanceSessions', record.sessionId);
      if (parentSession && sessionRecords.length > 0) {
        parentSession.presentCount = sessionRecords.filter(r => r.status === 'PRESENT').length;
        parentSession.absentCount = sessionRecords.filter(r => r.status === 'ABSENT').length;
        parentSession.lateCount = sessionRecords.filter(r => r.status === 'LATE').length;
        parentSession.leaveCount = sessionRecords.filter(r => r.status === 'LEAVE' || r.status === 'EXCUSED').length;
        parentSession.updatedAt = nowStr;
        Database.upsertBatch('AttendanceSessions', [parentSession]);
      }
    }

    Audit.log('ATTENDANCE_CORRECTED', session.role, session.userId, {
      attendanceId: attendanceId,
      studentId: record.studentId,
      originalStatus: originalStatus,
      newStatus: newStatus,
      reason: record.reason
    }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: `Attendance corrected successfully for student ${record.studentId}`,
      data: {
        record: record
      }
    };
  },

  /**
   * Sets the lock state of an attendance session.
   */
  setAttendanceSessionLock: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Administrator or Principal can lock/unlock attendance sessions.' } };
    }

    const sessionId = payload.sessionId;
    if (!sessionId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'sessionId is required' } };
    }

    const sess = Database.findByPk('AttendanceSessions', sessionId);
    if (!sess) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Attendance session not found' } };
    }

    const shouldLock = payload.lock === true || payload.isLocked === true;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    sess.isLocked = shouldLock;
    sess.status = shouldLock ? 'LOCKED' : 'SUBMITTED';
    sess.lockedBy = shouldLock ? session.userId : '';
    sess.lockedAt = shouldLock ? nowStr : '';
    sess.updatedAt = nowStr;

    Database.upsertBatch('AttendanceSessions', [sess]);

    Audit.log(shouldLock ? 'ATTENDANCE_LOCKED' : 'ATTENDANCE_UNLOCKED', session.role, session.userId, {
      sessionId: sessionId,
      class: sess.class,
      date: sess.date
    }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: `Attendance session ${shouldLock ? 'locked' : 'unlocked'} successfully.`,
      data: {
        session: sess
      }
    };
  },

  /**
   * Authoritative calculation of class, subject, and student attendance metrics.
   */
  getAttendanceMetrics: function(session, query) {
    query = query || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const allAttendance = Database.readAll('Attendance');
    let filtered = Security.filterAttendanceForSession(session, allAttendance);

    if (query.academicYear) filtered = filtered.filter(a => !a.academicYear || String(a.academicYear) === String(query.academicYear));
    if (query.class) filtered = filtered.filter(a => String(a.class) === String(query.class));
    if (query.section && query.section !== 'ALL') {
      filtered = filtered.filter(a => String(a.section || 'A').toUpperCase() === String(query.section).toUpperCase());
    }
    if (query.studentId) filtered = filtered.filter(a => String(a.studentId) === String(query.studentId));
    if (query.startDate && query.endDate) {
      filtered = filtered.filter(a => a.date >= query.startDate && a.date <= query.endDate);
    }

    const totalRecords = filtered.length;
    const presentCount = filtered.filter(r => r.status === 'PRESENT').length;
    const absentCount = filtered.filter(r => r.status === 'ABSENT').length;
    const lateCount = filtered.filter(r => r.status === 'LATE').length;
    const leaveCount = filtered.filter(r => r.status === 'LEAVE' || r.status === 'EXCUSED').length;

    const overallPercentage = totalRecords > 0
      ? parseFloat((((presentCount + lateCount) / totalRecords) * 100).toFixed(2))
      : 100.0;

    // Subject Breakdown (Theory vs Practical)
    const subjectMap = {};
    filtered.forEach(r => {
      const sName = r.subject || 'General Attendance';
      const comp = r.component || 'THEORY';
      const key = `${sName}___${comp}`;
      if (!subjectMap[key]) {
        subjectMap[key] = { subject: sName, component: comp, total: 0, present: 0, absent: 0, late: 0, leave: 0 };
      }
      subjectMap[key].total++;
      if (r.status === 'PRESENT') subjectMap[key].present++;
      else if (r.status === 'ABSENT') subjectMap[key].absent++;
      else if (r.status === 'LATE') subjectMap[key].late++;
      else subjectMap[key].leave++;
    });

    const subjectBreakdown = Object.values(subjectMap).map(s => ({
      ...s,
      percentage: s.total > 0 ? parseFloat((((s.present + s.late) / s.total) * 100).toFixed(2)) : 100.0
    }));

    // Monthly Breakdown
    const monthMap = {};
    filtered.forEach(r => {
      if (!r.date) return;
      const mKey = r.date.substring(0, 7); // "YYYY-MM"
      if (!monthMap[mKey]) {
        monthMap[mKey] = { month: mKey, total: 0, present: 0, absent: 0, late: 0, leave: 0 };
      }
      monthMap[mKey].total++;
      if (r.status === 'PRESENT') monthMap[mKey].present++;
      else if (r.status === 'ABSENT') monthMap[mKey].absent++;
      else if (r.status === 'LATE') monthMap[mKey].late++;
      else monthMap[mKey].leave++;
    });

    const monthlyBreakdown = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)).map(m => ({
      ...m,
      percentage: m.total > 0 ? parseFloat((((m.present + m.late) / m.total) * 100).toFixed(2)) : 100.0
    }));

    // Low Attendance Students Check
    const alertSetting = Database.findByPk('Settings', 'ALERT_THRESHOLD');
    const thresholdVal = alertSetting && alertSetting.value ? parseFloat(alertSetting.value) : null;

    return {
      success: true,
      data: {
        summary: {
          totalRecords: totalRecords,
          presentCount: presentCount,
          absentCount: absentCount,
          lateCount: lateCount,
          leaveCount: leaveCount,
          attendancePercentage: overallPercentage
        },
        subjectBreakdown: subjectBreakdown,
        monthlyBreakdown: monthlyBreakdown,
        thresholdConfig: {
          thresholdPercentage: thresholdVal,
          status: thresholdVal ? 'CONFIGURED' : 'REQUIRES_INSTITUTIONAL_APPROVAL',
          label: thresholdVal ? `${thresholdVal}%` : 'Threshold not configured'
        }
      }
    };
  },

  /**
   * Synchronizes offline attendance records from Android app with idempotency and conflict resolution.
   */
  syncOfflineAttendance: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Write permission denied for Sync' } };
    }

    const items = Array.isArray(payload.items) ? payload.items : (Array.isArray(payload.attendance) ? payload.attendance : []);
    if (items.length === 0) {
      return { success: true, message: 'No offline items to sync', data: { synced: 0, skipped: 0 } };
    }

    const results = [];
    let syncedCount = 0;
    let duplicateCount = 0;
    let lockedCount = 0;
    let rejectedCount = 0;

    const allSessions = Database.readAll('AttendanceSessions');
    const lockedSessionIds = new Set(allSessions.filter(s => s.isLocked || s.status === 'LOCKED').map(s => s.sessionId));

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const sid = String(item.studentId || '').trim();
      if (!sid) {
        rejectedCount++;
        results.push({ itemIndex: i, status: 'REJECTED', reason: 'Missing studentId' });
        continue;
      }

      // Check if mapped session is locked
      if (item.sessionId && lockedSessionIds.has(item.sessionId) && !['ADMIN', 'PRINCIPAL'].includes(session.role)) {
        lockedCount++;
        results.push({ itemIndex: i, studentId: sid, status: 'LOCKED', reason: 'Session is locked' });
        continue;
      }

      // Teacher scope check
      if (session.role === 'TEACHER') {
        if (item.class && !Security.canAccessClass(session, item.class)) {
          rejectedCount++;
          results.push({ itemIndex: i, studentId: sid, status: 'REJECTED', reason: 'Unauthorized class' });
          continue;
        }
        if (!Security.canAccessStudent(session, sid, item.class)) {
          rejectedCount++;
          results.push({ itemIndex: i, studentId: sid, status: 'REJECTED', reason: 'Unauthorized student' });
          continue;
        }
      }

      // Check existing
      let existing = item.attendanceId ? Database.findByPk('Attendance', item.attendanceId) : null;
      if (!existing) {
        const checkDate = item.date || payload.date;
        const checkSubject = item.subject || payload.subject || '';
        const checkPeriod = item.period || payload.period || '1';
        const allAtt = Database.readAll('Attendance') || [];
        existing = allAtt.find(a => String(a.studentId) === sid && a.date === checkDate && (!checkSubject || a.subject === checkSubject) && (!checkPeriod || String(a.period) === String(checkPeriod)));
      }

      if (existing && existing.status === item.status && !item.forceOverwrite) {
        duplicateCount++;
        results.push({ itemIndex: i, studentId: sid, status: 'ALREADY_EXISTS', attendanceId: existing.attendanceId || item.attendanceId });
        continue;
      }

      // Save item
      const saveRes = this.saveAttendance(session, {
        academicYear: item.academicYear || payload.academicYear,
        class: item.class || payload.class,
        section: item.section || payload.section || 'A',
        subject: item.subject || payload.subject || '',
        component: item.component || payload.component || 'THEORY',
        period: item.period || payload.period || '1',
        date: item.date || payload.date,
        source: 'ANDROID_OFFLINE_SYNC',
        sendAbsenceNotification: false,
        attendance: [item]
      });

      if (saveRes.success) {
        syncedCount++;
        results.push({ itemIndex: i, studentId: sid, status: 'SYNCED', attendanceId: item.attendanceId });
      } else {
        rejectedCount++;
        results.push({ itemIndex: i, studentId: sid, status: 'REJECTED', reason: saveRes.error?.message || 'Save failed' });
      }
    }

    Audit.log('ATTENDANCE_SYNCED', session.role, session.userId, {
      total: items.length,
      synced: syncedCount,
      duplicates: duplicateCount,
      locked: lockedCount,
      rejected: rejectedCount
    }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: `Offline sync complete: ${syncedCount} synced, ${duplicateCount} duplicates, ${lockedCount} locked, ${rejectedCount} rejected`,
      data: {
        syncedCount: syncedCount,
        duplicateCount: duplicateCount,
        lockedCount: lockedCount,
        rejectedCount: rejectedCount,
        results: results
      }
    };
  },

  /**
   * Internal helper to dispatch absence notifications.
   */
  _dispatchAbsenceNotifications: function(schoolId, academicYear, dateStr, classLevel, section, absentStudentIds) {
    if (!absentStudentIds || absentStudentIds.length === 0) return;

    const allStudents = Database.readAll('Students');
    const absentStudents = allStudents.filter(s => absentStudentIds.includes(String(s.studentId)));

    absentStudents.forEach(stu => {
      // Create an internal notification record for each absent student
      const notifRecord = {
        notificationId: `NOTIF_ABSENCE_${stu.studentId}_${dateStr}`,
        schoolId: schoolId,
        studentId: stu.studentId,
        type: 'ABSENCE_ALERT',
        title: `Absence Notice: ${stu.studentName || 'Student'} (Class ${classLevel}-${section})`,
        message: `Dear Parent/Guardian, student ${stu.studentName || 'your child'} was marked ABSENT on ${dateStr}. Please contact the school if this absence was unexcused.`,
        date: dateStr,
        status: 'DISPATCHED',
        channel: 'WHATSAPP_PORTAL',
        createdAt: Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'")
      };

      try {
        Database.upsertBatch('Notifications', [notifRecord]);
      } catch (e) {
        // Safe fallback if Notifications table is missing or readonly
      }
    });
  },

  // ==========================================
  // STUDENT ATTENDANCE REPORT (Requirement #7)
  // ==========================================
  generateStudentAttendanceReport: function(session, payload) {
    payload = payload || {};
    const sid = String(payload.studentId || (session?.role === 'STUDENT' ? session.userId : '') || '').trim();
    if (!sid) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId is required' } };
    }
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student attendance report' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) {
      return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student record not found' } };
    }

    const academicYear = payload.academicYear || '2026-2027';
    const allAttendance = Database.readAll('Attendance').filter(a =>
      String(a.studentId) === sid &&
      (!a.academicYear || a.academicYear === academicYear)
    );

    const metricsRes = this.getAttendanceMetrics(session, {
      studentId: sid,
      academicYear: academicYear
    });

    const metrics = metricsRes.success ? metricsRes.data : {
      summary: { totalRecords: 0, presentCount: 0, absentCount: 0, lateCount: 0, leaveCount: 0, attendancePercentage: 100.0 },
      subjectBreakdown: [],
      monthlyBreakdown: []
    };

    const studentName = typeof AcademicApi !== 'undefined' && AcademicApi.getStudentDisplayName
      ? AcademicApi.getStudentDisplayName(student)
      : (student.studentName || student.fullName || student.name || 'Student');

    const certLevel = typeof AcademicApi !== 'undefined' && AcademicApi.getCertificateLevel
      ? AcademicApi.getCertificateLevel(student.class)
      : 'Level 1';

    return {
      success: true,
      data: {
        school: {
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          address: 'Gamiri, Biswanath, Assam - 784172',
          affiliation: 'ASSEB / SEBA Vocational IT/ITeS'
        },
        student: {
          studentId: sid,
          studentName: studentName,
          admissionNo: student.admissionNo || sid,
          rollNo: student.rollNo || student.roll || 'N/A',
          class: student.class || '9',
          section: student.section || 'A',
          fatherName: student.fatherName || student.father || '',
          motherName: student.motherName || student.mother || '',
          mobile: student.mobile || '',
          stream: 'Vocational IT/ITeS',
          certificateLevel: certLevel,
          photoUrl: student.photoUrl || ''
        },
        academicYear: academicYear,
        summary: metrics.summary,
        subjectBreakdown: metrics.subjectBreakdown,
        monthlyBreakdown: metrics.monthlyBreakdown,
        recentRecords: allAttendance.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 30),
        generatedAt: Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        signatory: {
          classTeacher: 'Class Teacher',
          principal: 'Principal / Head of Institution'
        }
      }
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AttendanceApi };
}
