/**
 * VE MANAGEMENT — Cloud API Web App Entry Point & Router
 * School: Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)
 * Standardized Action-Driven HTTPS API Gateway for Android App and Portals.
 */

/**
 * Handles HTTP GET requests.
 */
function doGet(e) {
  try {
    return handleRequest(e, 'GET');
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: { code: 'FATAL_GET_ERROR', message: err.message, stack: err.stack },
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles HTTP POST requests.
 */
function doPost(e) {
  try {
    return handleRequest(e, 'POST');
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: { code: 'FATAL_POST_ERROR', message: err.message, stack: err.stack },
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Centralized Request Dispatcher and Response Formatter.
 */
function handleRequest(e, method) {
  let action = 'unknown';
  let payload = {};

  try {
    // 1. Parse parameters & JSON payload
    if (e && e.parameter) {
      action = e.parameter.action || action;
      payload = Object.assign({}, e.parameter);
    }

    if (e && e.postData && e.postData.contents) {
      try {
        const bodyObj = JSON.parse(e.postData.contents);
        action = bodyObj.action || action;
        payload = Object.assign(payload, bodyObj);
      } catch (jsonErr) {
        return createJsonResponse({
          success: false,
          action: action,
          data: null,
          error: { code: 'MALFORMED_JSON', message: 'Invalid JSON request payload: ' + jsonErr.message },
          timestamp: new Date().toISOString()
        });
      }
    }

    if (!action || action === 'unknown') {
      return createJsonResponse({
        success: false,
        action: 'unknown',
        data: null,
        error: { code: 'BAD_REQUEST', message: 'Missing action parameter' },
        timestamp: new Date().toISOString()
      });
    }

    // 2. Health check / Ping
    if (action === 'ping') {
      return createJsonResponse({
        success: true,
        action: 'ping',
        data: {
          status: 'ONLINE',
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          version: '5.7',
          serverTime: Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'")
        },
        error: null,
        timestamp: new Date().toISOString()
      });
    }

    // 3. Public Multi-Role Authentication
    if (action === 'auth_login' || action === 'login' || action === 'parent_login' || action === 'teacher_login' || action === 'staff_login') {
      if (action === 'parent_login' && !payload.role) {
        payload.role = 'PARENT';
      } else if ((action === 'teacher_login' || action === 'staff_login') && !payload.role) {
        payload.role = 'TEACHER';
      }
      const loginRes = Auth.login(payload);
      return createJsonResponse({
        success: loginRes.success,
        action: action,
        data: loginRes.data || null,
        error: loginRes.error || null,
        timestamp: new Date().toISOString()
      });
    }

    // 4. Schema Initialization
    if (action === 'init_schema') {
      const apiKey = payload.apiKey || (e && e.parameter ? e.parameter.apiKey : null);
      if (!Auth.validateAdminKey(apiKey)) {
        return createJsonResponse({
          success: false,
          action: action,
          data: null,
          error: { code: 'UNAUTHORIZED', message: 'Invalid Admin API Key' },
          timestamp: new Date().toISOString()
        });
      }
      Database.initializeAllSheets();
      return createJsonResponse({
        success: true,
        action: action,
        data: { message: 'All 20 Google Sheets initialized with schemas' },
        error: null,
        timestamp: new Date().toISOString()
      });
    }

    // 5. Session & API Key Resolution
    let session = null;
    const token = payload.token || (e && e.parameter ? e.parameter.token : null);
    const apiKey = payload.apiKey || (e && e.parameter ? e.parameter.apiKey : null);

    if (token) {
      session = Auth.validateSessionToken(token);
    }

    if (!session && apiKey && Auth.validateAdminKey(apiKey)) {
      // Create synthetic Admin session for API Key calls
      session = {
        userId: 'ADMIN_API_KEY',
        role: 'ADMIN',
        schoolId: payload.schoolId || DEFAULT_SCHOOL_ID,
        identifier: 'SYSTEM_ADMIN'
      };
    }

    // Public Read-Only Endpoints (No Auth Required)
    if (action === 'get_calendar' || action === 'parent_calendar') {
      const calRes = AcademicApi.getCalendar(session || { role: 'PUBLIC' }, payload);
      return createJsonResponse({ success: true, action: action, data: calRes.data, error: null, timestamp: new Date().toISOString() });
    }

    if (action === 'get_contacts' || action === 'parent_contacts') {
      const cntRes = AcademicApi.getContacts(session || { role: 'PUBLIC' }, payload);
      return createJsonResponse({ success: true, action: action, data: cntRes.data, error: null, timestamp: new Date().toISOString() });
    }

    if (action === 'verify_document' || action === 'verify_academic_document') {
      const vrfRes = DocumentApi.verifyDocument(payload);
      return createJsonResponse({ success: vrfRes.success, action: action, data: vrfRes.data, error: null, timestamp: new Date().toISOString() });
    }

    // Protected Endpoints — Require Active Session
    if (!session) {
      Audit.log('UNAUTHORIZED_CALL', 'UNKNOWN', 'ANONYMOUS', { action: action }, 'DENIED', '', payload.schoolId);
      return createJsonResponse({
        success: false,
        action: action,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Valid session token or Admin API key required' },
        timestamp: new Date().toISOString()
      });
    }

    // Real-time active account verification (session revocation for deactivated accounts)
    if (!Security.isAccountActive(session)) {
      Audit.log('DEACTIVATED_SESSION_ATTEMPT', session.role, session.userId, { action: action }, 'DENIED', '', session.schoolId);
      return createJsonResponse({
        success: false,
        action: action,
        data: null,
        error: { code: 'ACCOUNT_DEACTIVATED', message: 'Account is deactivated. Please contact the administrator.' },
        timestamp: new Date().toISOString()
      });
    }

    let res;

    // Dispatch by Action
    switch (action) {
      // Auth & Password Actions
      case 'auth_change_password':
      case 'change_password':
      case 'parent_change_password':
        res = Auth.changePassword(session, payload);
        break;

      case 'auth_reset_user_password':
        res = Auth.resetUserPasswordToCommon(session, payload);
        break;

      case 'auth_reset_all_passwords':
      case 'reset_all_parent_passwords':
        res = AdminApi.resetAllPasswordsToCommon(session, payload);
        break;

      // Academic Year Actions
      case 'get_academic_years':
        res = AcademicApi.getAcademicYears(session, payload);
        break;

      case 'save_academic_years':
      case 'save_academic_year':
        res = AcademicApi.saveAcademicYears(session, payload);
        break;

      case 'set_active_academic_year':
      case 'set_academic_year':
        res = AdminApi.setActiveAcademicYear(session, payload);
        break;

      // Class Actions
      case 'get_classes':
        res = AcademicApi.getClasses(session, payload);
        break;

      case 'save_classes':
      case 'save_class':
        res = AcademicApi.saveClasses(session, payload);
        break;

      // Subject & Subject Master Actions
      case 'get_subjects':
      case 'get_subject_master':
      case 'list_subject_master':
        res = AcademicApi.getSubjectMaster(session, payload);
        break;

      case 'save_subjects':
      case 'save_subject':
      case 'save_subject_master':
        res = AcademicApi.saveSubjectMaster(session, payload);
        break;

      case 'set_subject_status':
      case 'toggle_subject_status':
        res = AcademicApi.setSubjectStatus(session, payload);
        break;

      // Curriculum Actions (Step 9)
      case 'get_curriculum_list':
      case 'get_curriculum':
      case 'list_curriculum':
        res = AcademicApi.getCurriculumList(session, payload);
        break;

      case 'get_curriculum_by_id':
      case 'get_curriculum_profile':
      case 'curriculum_profile':
        res = AcademicApi.getCurriculumById(session, payload);
        break;

      case 'save_curriculum':
      case 'create_curriculum':
      case 'update_curriculum':
        res = AcademicApi.saveCurriculum(session, payload);
        break;

      case 'publish_curriculum':
        res = AcademicApi.publishCurriculum(session, payload);
        break;

      case 'archive_curriculum':
        res = AcademicApi.archiveCurriculum(session, payload);
        break;

      case 'duplicate_curriculum_to_year':
      case 'duplicate_curriculum':
        res = AcademicApi.duplicateCurriculumToYear(session, payload);
        break;

      case 'get_curriculum_history':
      case 'curriculum_history':
        res = AcademicApi.getCurriculumHistory(session, payload);
        break;

      // Enrollment & Roll Number Actions
      case 'get_enrollments':
        res = AcademicApi.getEnrollments(session, payload);
        break;

      case 'save_enrollments':
      case 'save_enrollment':
        res = AcademicApi.saveEnrollments(session, payload);
        break;

      case 'assign_roll_numbers':
        res = AdminApi.assignRollNumbers(session, payload);
        break;

      case 'promote_students':
        res = AdminApi.promoteStudents(session, payload);
        break;

      case 'get_student_history':
      case 'student_history':
        res = AcademicApi.getStudentHistory(session, payload);
        break;

      // Student Actions
      case 'get_students':
        res = AcademicApi.getStudents(session, payload);
        break;

      case 'admit_student':
      case 'register_student':
        res = AdminApi.admitStudent(session, payload);
        break;

      case 'check_duplicate_student':
        res = AdminApi.checkDuplicateStudent(session, payload);
        break;

      case 'update_student_profile':
        res = AdminApi.updateStudentProfile(session, payload);
        break;

      case 'update_student_status':
        res = AdminApi.updateStudentStatus(session, payload);
        break;

      case 'link_parent_student':
        res = AdminApi.linkParentStudent(session, payload);
        break;

      case 'unlink_parent_student':
        res = AdminApi.unlinkParentStudent(session, payload);
        break;

      case 'bulk_update_students':
        res = AdminApi.bulkUpdateStudents(session, payload);
        break;

      case 'import_students_csv':
        res = AdminApi.importStudentsCsv(session, payload);
        break;

      case 'export_students_csv':
        res = AdminApi.exportStudentsCsv(session, payload);
        break;

      case 'save_students':
      case 'save_student':
        res = AcademicApi.saveStudents(session, payload);
        break;

      // Attendance & Academic Operations 2.0 Actions (Step 10)
      case 'get_attendance':
      case 'parent_attendance':
        res = AcademicApi.getAttendance(session, payload);
        break;

      case 'save_attendance':
        res = AcademicApi.saveAttendance(session, payload);
        break;

      case 'get_attendance_sessions':
      case 'list_attendance_sessions':
        res = AcademicApi.getAttendanceSessions(session, payload);
        break;

      case 'correct_attendance':
      case 'correct_attendance_record':
        res = AcademicApi.correctAttendanceRecord(session, payload);
        break;

      case 'lock_attendance_session':
        res = AcademicApi.setAttendanceSessionLock(session, Object.assign({}, payload, { lock: true }));
        break;

      case 'unlock_attendance_session':
        res = AcademicApi.setAttendanceSessionLock(session, Object.assign({}, payload, { lock: false }));
        break;

      case 'get_attendance_metrics':
      case 'attendance_metrics':
        res = AcademicApi.getAttendanceMetrics(session, payload);
        break;

      case 'sync_offline_attendance':
        res = AcademicApi.syncOfflineAttendance(session, payload);
        break;

      // Examination & Result Engine Actions
      case 'get_examinations':
        res = AcademicApi.getExaminations(session, payload);
        break;

      case 'save_examinations':
      case 'save_examination':
        res = AcademicApi.saveExaminations(session, payload);
        break;

      case 'set_examination_status':
        res = AdminApi.setExaminationStatus(session, payload);
        break;

      case 'calculate_exam_results':
        res = AcademicApi.calculateExamResults(session, payload);
        break;

      case 'revise_exam_result':
        res = ExaminationApi.reviseExamResult(session, payload);
        break;

      case 'get_exam_analytics':
        res = ExaminationApi.getExamAnalytics(session, payload);
        break;

      case 'get_exam_schedules':
        res = ExaminationApi.getExamSchedules(session, payload);
        break;

      case 'save_exam_schedules':
        res = ExaminationApi.saveExamSchedules(session, payload);
        break;

      case 'get_exam_results':
      case 'get_student_results':
        res = AcademicApi.getExamResults(session, payload);
        break;

      case 'publish_exam_results':
        res = AdminApi.publishExamResults(session, payload);
        break;

      // Marks Actions
      case 'get_marks':
      case 'parent_marks':
        res = AcademicApi.getMarks(session, payload);
        break;

      case 'save_marks':
        res = AcademicApi.saveMarks(session, payload);
        break;

      // Notes Actions
      case 'get_notes':
        res = AcademicApi.getNotes(session, payload);
        break;

      case 'save_notes':
      case 'save_note':
        res = AcademicApi.saveNotes(session, payload);
        break;

      case 'delete_notes':
      case 'delete_note':
        res = AcademicApi.deleteNote(session, payload);
        break;

      // Activities Actions
      case 'get_activities':
        res = AcademicApi.getActivities(session, payload);
        break;

      case 'save_activities':
      case 'save_activity':
        res = AcademicApi.saveActivities(session, payload);
        break;

      case 'delete_activities':
      case 'delete_activity':
        res = AcademicApi.deleteActivity(session, payload);
        break;

      // Assignments Actions
      case 'get_assignments':
        res = AcademicApi.getAssignments(session, payload);
        break;

      case 'save_assignments':
      case 'save_assignment':
        res = AcademicApi.saveAssignments(session, payload);
        break;

      case 'delete_assignments':
      case 'delete_assignment':
        res = AcademicApi.deleteAssignment(session, payload);
        break;

      // Notices Actions (Step 13 Communication 2.0)
      case 'get_notices':
        res = AcademicApi.getNotices(session, payload);
        break;

      case 'save_notices':
      case 'save_notice':
        res = AcademicApi.saveNotices(session, payload);
        break;

      case 'set_notice_status':
        res = AcademicApi.setNoticeStatus(session, payload);
        break;

      case 'delete_notices':
      case 'delete_notice':
        res = AcademicApi.deleteNotice(session, payload);
        break;

      case 'record_notice_read':
        res = AcademicApi.recordNoticeRead(session, payload);
        break;

      case 'acknowledge_notice':
        res = AcademicApi.acknowledgeNotice(session, payload);
        break;

      // Calendar Actions (Step 13 Calendar 2.0)
      case 'save_calendar_events':
      case 'save_calendar_event':
        res = AcademicApi.saveCalendarEvents(session, payload);
        break;

      case 'delete_calendar_event':
        res = AcademicApi.deleteCalendarEvent(session, payload);
        break;

      // Notifications
      case 'get_notifications':
        res = AcademicApi.getNotifications(session, payload);
        break;

      // Academic Documents & Achievements (Step 4)
      case 'get_documents':
      case 'get_academic_documents':
      case 'parent_documents':
        res = DocumentApi.getDocuments(session, payload);
        break;

      case 'create_document':
      case 'create_academic_document':
        res = DocumentApi.createDocument(session, payload);
        break;

      case 'approve_document':
      case 'approve_academic_document':
        res = DocumentApi.approveDocument(session, payload);
        break;

      case 'issue_document':
      case 'issue_academic_document':
        res = DocumentApi.issueDocument(session, payload);
        break;

      case 'revise_document':
      case 'revise_academic_document':
        res = DocumentApi.reviseDocument(session, payload);
        break;

      case 'cancel_document':
      case 'cancel_academic_document':
        res = DocumentApi.cancelDocument(session, payload);
        break;

      case 'get_marksheet_data':
      case 'marksheet_data':
        res = DocumentApi.getMarksheetData(session, payload);
        break;

      case 'get_report_card_data':
      case 'report_card_data':
        res = DocumentApi.getReportCardData(session, payload);
        break;

      case 'get_certificate_data':
      case 'certificate_data':
        res = DocumentApi.getCertificateData(session, payload);
        break;

      case 'get_transfer_certificate_data':
      case 'transfer_certificate_data':
        res = DocumentApi.getTransferCertificateData(session, payload);
        break;

      case 'get_character_certificate_data':
      case 'character_certificate_data':
        res = DocumentApi.getCharacterCertificateData(session, payload);
        break;

      case 'get_migration_certificate_data':
      case 'migration_certificate_data':
        res = DocumentApi.getMigrationCertificateData(session, payload);
        break;

      case 'get_admit_card_data':
      case 'admit_card_data':
        res = DocumentApi.getAdmitCardData(session, payload);
        break;

      case 'get_bonafide_certificate_data':
      case 'bonafide_certificate_data':
        res = DocumentApi.getBonafideCertificateData(session, payload);
        break;

      case 'get_study_certificate_data':
      case 'study_certificate_data':
        res = DocumentApi.getStudyCertificateData(session, payload);
        break;

      case 'get_school_leaving_certificate_data':
      case 'school_leaving_certificate_data':
        res = DocumentApi.getSchoolLeavingCertificateData(session, payload);
        break;

      case 'get_merit_certificate_data':
      case 'merit_certificate_data':
        res = DocumentApi.getMeritCertificateData(session, payload);
        break;

      case 'get_achievement_certificate_data':
      case 'achievement_certificate_data':
        res = DocumentApi.getAchievementCertificateData(session, payload);
        break;

      case 'get_participation_certificate_data':
      case 'participation_certificate_data':
        res = DocumentApi.getParticipationCertificateData(session, payload);
        break;

      case 'get_custom_certificate_data':
      case 'custom_certificate_data':
        res = DocumentApi.getCustomCertificateData(session, payload);
        break;

      case 'check_completion_eligibility':
      case 'completion_eligibility':
        res = DocumentApi.checkCompletionEligibility(session, payload);
        break;

      case 'get_achievements':
        res = AcademicApi.getAchievements(session, payload);
        break;

      // Student Photo Upload (Requirement #6)
      case 'upload_student_photo':
      case 'save_student_photo':
        res = AcademicApi.uploadStudentPhoto(session, payload);
        break;

      // Practical List Actions (Requirement #8)
      case 'get_practical_lists':
      case 'list_practicals':
      case 'get_practicals':
        res = AcademicApi.getPracticalLists(session, payload);
        break;

      case 'save_practical_item':
      case 'save_practical':
        res = AcademicApi.savePracticalItem(session, payload);
        break;

      case 'delete_practical_item':
      case 'delete_practical':
        res = AcademicApi.deletePracticalItem(session, payload);
        break;

      // Student Attendance Report Download (Requirement #7)
      case 'generate_student_attendance_report':
      case 'student_attendance_report':
        res = AttendanceApi.generateStudentAttendanceReport(session, payload);
        break;

      // Admin School Logo & Signatures (Requirement #5)
      case 'upload_school_branding':
      case 'upload_logo_signature':
        res = SettingsApi.uploadSchoolBranding(session, payload);
        break;

      // Staff Portal Aggregated Actions (Phase 5 & Step 12 Reports 2.0)
      case 'get_dashboard_summary':
      case 'dashboard_summary':
        res = ReportApi.getDashboardSummary(session, payload);
        break;

      case 'get_student_analytics':
        res = ReportApi.getStudentAnalytics(session, payload);
        break;

      case 'get_class_analytics':
        res = ReportApi.getClassAnalytics(session, payload);
        break;

      case 'get_low_attendance_report':
        res = ReportApi.getLowAttendanceReport(session, payload);
        break;

      case 'get_subject_performance_report':
        res = ReportApi.getSubjectPerformanceReport(session, payload);
        break;

      case 'get_teacher_workload_report':
        res = ReportApi.getTeacherWorkloadReport(session, payload);
        break;

      case 'get_academic_year_comparison':
        res = ReportApi.getAcademicYearComparison(session, payload);
        break;

      case 'export_report_data':
        res = ReportApi.exportReportData(session, payload);
        break;

      case 'staff_dashboard':
      case 'get_staff_dashboard':
        res = AcademicApi.staffDashboard(session, payload);
        break;

      case 'get_student_portfolio':
      case 'student_portfolio':
        res = AcademicApi.getStudentPortfolio(session, payload);
        break;

      // Student & Parent Portal Aggregated Actions (Phase 6)
      case 'student_dashboard':
      case 'get_student_dashboard':
        res = AcademicApi.studentDashboard(session, payload);
        break;

      case 'parent_dashboard':
      case 'get_parent_dashboard':
        res = AcademicApi.parentDashboard(session, payload);
        break;

      case 'get_parent_children':
      case 'parent_children':
        res = AcademicApi.getParentChildren(session, payload);
        break;

      case 'get_student_profile':
      case 'student_profile':
        res = AcademicApi.getStudentProfile(session, payload);
        break;

      case 'get_parent_profile':
      case 'parent_profile':
        res = AcademicApi.getParentProfile(session, payload);
        break;

      case 'get_student_contacts':
      case 'student_contacts':
        res = AcademicApi.getStudentContacts(session, payload);
        break;

      case 'get_parent_contacts':
      case 'parent_contacts':
        res = AcademicApi.getParentContacts(session, payload);
        break;

      // Sync Actions
      case 'sync_upload':
      case 'admin_sync':
        res = SyncApi.upload(session, payload);
        break;

      case 'sync_download':
        res = SyncApi.download(session, payload);
        break;

      // Staff & Academic Workforce Actions (Step 8)
      case 'get_staff_list':
      case 'list_staff':
        res = AdminApi.getStaffList(session, payload);
        break;

      case 'get_staff_by_id':
      case 'get_staff':
      case 'get_staff_profile':
      case 'staff_profile':
        res = AdminApi.getStaffProfile(session, payload);
        break;

      case 'register_staff':
        res = AdminApi.registerStaff(session, payload);
        break;

      case 'update_staff':
      case 'update_staff_profile':
        res = AdminApi.updateStaff(session, payload);
        break;

      case 'set_staff_status':
      case 'update_staff_status':
        res = AdminApi.setStaffStatus(session, payload);
        break;

      case 'get_staff_assignments':
      case 'list_staff_assignments':
      case 'get_academic_assignments':
        res = AdminApi.getStaffAssignments(session, payload);
        break;

      case 'save_staff_assignment':
      case 'save_academic_assignment':
      case 'assign_staff':
        res = AdminApi.saveStaffAssignment(session, payload);
        break;

      case 'deactivate_staff_assignment':
      case 'remove_staff_assignment':
        res = AdminApi.deactivateStaffAssignment(session, payload);
        break;

      case 'bulk_assign_staff':
        res = AdminApi.bulkAssignStaff(session, payload);
        break;

      case 'get_teacher_workload':
      case 'teacher_workload':
        res = AdminApi.getTeacherWorkload(session, payload);
        break;

      case 'import_staff_csv':
        res = AdminApi.importStaffCsv(session, payload);
        break;

      case 'export_staff_csv':
        res = AdminApi.exportStaffCsv(session, payload);
        break;

      case 'link_staff_account':
        res = AdminApi.linkStaffAccount(session, payload);
        break;

      case 'register_parent':
        res = AdminApi.registerParent(session, payload);
        break;

      case 'link_parent_student':
        res = AdminApi.linkParentStudent(session, payload);
        break;

      case 'provision_parents_from_students':
        const provRes = AdminApi.provisionParentsFromStudents(payload.students || [], session.role, session.userId, session.schoolId);
        res = { success: true, data: provRes };
        break;

      case 'get_admin_summary':
        res = AdminApi.getAdminSummary(session, payload);
        break;

      case 'reset_parent_portal_data':
        res = AdminApi.resetParentPortalData(session, payload);
        break;

      // Backup & Disaster Recovery Actions (Step 14)
      case 'create_full_backup':
      case 'create_backup':
        res = BackupApi.createFullBackup(session, payload);
        break;

      case 'validate_backup_integrity':
      case 'validate_backup':
        res = BackupApi.validateBackupIntegrity(session, payload);
        break;

      case 'restore_backup':
        res = BackupApi.restoreBackup(session, payload);
        break;

      // Settings & Configuration Actions (Step 15)
      case 'get_settings':
      case 'get_setting':
        res = SettingsApi.getSettings(session, payload);
        break;

      case 'update_setting':
      case 'save_setting':
        res = SettingsApi.updateSetting(session, payload);
        break;

      case 'bulk_update_settings':
      case 'save_settings':
        res = SettingsApi.bulkUpdateSettings(session, payload);
        break;

      case 'set_policy_status':
      case 'activate_policy':
      case 'deactivate_policy':
        res = SettingsApi.setPolicyStatus(session, payload);
        break;

      // Aggregated Parent Dashboard (backward compatibility)
      case 'parent_dashboard':
        const children = Security.getAuthorizedChildren(session.userId, session.schoolId);
        const childIds = children.map(c => c.studentId);
        const allAtt = Database.readAll('Attendance').filter(a => childIds.includes(a.studentId));
        const allMrk = Database.readAll('Marks').filter(m => childIds.includes(m.studentId));
        const notices = Security.filterNoticesForSession(session, Database.readAll('Notices'));
        const activities = Database.readAll('Activities');
        res = {
          success: true,
          data: {
            children: children,
            attendance: allAtt,
            marks: allMrk,
            notices: notices,
            activities: activities
          }
        };
        break;

      default:
        res = {
          success: false,
          error: { code: 'INVALID_ACTION', message: `Unrecognized API action: ${action}` }
        };
        break;
    }

    return createJsonResponse({
      success: res.success !== false,
      action: action,
      data: res.data || (res.success ? res : null),
      error: res.error ? (typeof res.error === 'object' ? res.error : { code: 'ERROR', message: res.error }) : null,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    Audit.log('UNHANDLED_SERVER_ERROR', 'SYSTEM', 'SERVER', { error: err.message, stack: err.stack }, 'ERROR');
    return createJsonResponse({
      success: false,
      action: action,
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error: ' + err.message },
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Creates standardized JSON HTTP output.
 */
function createJsonResponse(responseObject) {
  return ContentService.createTextOutput(JSON.stringify(responseObject))
    .setMimeType(ContentService.MimeType.JSON);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { doGet, doPost, handleRequest, createJsonResponse };
}
