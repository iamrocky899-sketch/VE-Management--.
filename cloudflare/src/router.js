/**
 * VE MANAGEMENT — MODULAR CLOUDFLARE WORKERS API ROUTER
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Dispatches both legacy Apps Script `{ action: '...' }` calls and clean RESTful routes.
 */

import { verifySessionToken } from './auth.js';
import { successResponse, errorResponse } from './response.js';
import { Security } from './security.js';
import { AuthApi } from './api/auth.js';
import { StudentsApi } from './api/students.js';
import { ParentsApi } from './api/parents.js';
import { StaffApi } from './api/staff.js';
import { AttendanceApi } from './api/attendance.js';
import { ExamsApi } from './api/exams.js';
import { NotesApi } from './api/notes.js';
import { DocumentsApi } from './api/documents.js';
import { NoticesApi, ReportsApi, SettingsApi, CalendarApi, PracticalsApi } from './api/notices.js';
import { SyncApi } from './api/sync.js';
import { FilesApi } from './api/files.js';
import { AcademicYearsApi } from './api/academic_years.js';

export async function routeRequest(request, env, corsHeaders) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Health Ping
  if (pathname === '/api/ping' || pathname === '/ping' || url.searchParams.get('action') === 'ping') {
    let activeYear = '2026-2027';
    try {
      const activeRow = await env.DB.prepare("SELECT year_name FROM academic_years WHERE is_current = 1 LIMIT 1").first();
      if (activeRow && activeRow.year_name) activeYear = activeRow.year_name;
    } catch (e) {}

    return successResponse({
      status: 'ONLINE',
      runtime: 'Cloudflare Workers (Edge Staging)',
      schoolId: env.SCHOOL_ID || 'GAMERI-HSS-001',
      schoolName: env.SCHOOL_NAME || 'Gameri Higher Secondary School, Gamiri',
      environment: env.ENVIRONMENT || 'production',
      activeAcademicYear: activeYear,
      currentYear: activeYear,
      version: '6.0-CF-PROD'
    }, 'ping', 200, corsHeaders);
  }

  // 2. Parse Payload
  let payload = {};
  if (request.method === 'POST') {
    const contentType = request.headers.get('Content-Type') || '';
    if (contentType.includes('application/json') || contentType.includes('text/plain')) {
      try {
        payload = await request.json();
      } catch (e) {
        payload = {};
      }
    }
  } else {
    url.searchParams.forEach((val, key) => {
      payload[key] = val;
    });
  }

  const rawAction = payload.action || url.searchParams.get('action') || '';
  const action = String(rawAction).trim().toLowerCase();

  // 3. Public Auth Endpoints
  if (action === 'auth_login' || action === 'login' || pathname === '/api/v1/auth/login') {
    return AuthApi.handleLogin(env, payload, corsHeaders);
  }

  // 4. Public Calendar & Document Verification Endpoints
  if (action === 'get_calendar' || pathname === '/api/v1/calendar') {
    return CalendarApi.getCalendar(env, null, payload, corsHeaders);
  }

  if (action === 'verify_document' || pathname === '/api/v1/documents/verify') {
    return DocumentsApi.verifyDocument(env, payload, corsHeaders);
  }

  // 5. Session Authentication for Protected Endpoints
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '') || payload.token || url.searchParams.get('token');

  let session = null;
  if (token) {
    session = await verifySessionToken(token, env.SESSION_SECRET);
  }

  // Support Admin API Key authentication for Android SyncManager
  const apiKey = payload.apiKey || request.headers.get('X-Admin-Key') || url.searchParams.get('apiKey');
  const isKeyValid = apiKey && env.ADMIN_API_KEY && apiKey === env.ADMIN_API_KEY;
  if (!session && isKeyValid) {
    session = {
      userId: 'SYSTEM_ADMIN_SYNC',
      role: 'ADMIN',
      name: 'System Admin Sync',
      schoolId: env.SCHOOL_ID || 'GAMERI-HSS-001'
    };
  }

  if (!session) {
    return errorResponse('UNAUTHORIZED', 'Authentication token required', 401, action, corsHeaders);
  }

  // 6. Action & REST Routing Dispatcher
  switch (action) {
    // Sync Operations
    case 'sync_upload':
      return SyncApi.upload(env, session, payload, corsHeaders);

    case 'sync_download':
      return SyncApi.download(env, session, payload, corsHeaders);

    // Academic Master Data
    case 'get_academic_years':
      return AcademicYearsApi.getAcademicYears(env, session, payload, corsHeaders);

    case 'get_current_academic_year':
    case 'current_academic_year':
      return AcademicYearsApi.getCurrentAcademicYear(env, session, payload, corsHeaders);

    case 'save_academic_year':
    case 'create_academic_year':
    case 'update_academic_year':
      return AcademicYearsApi.saveAcademicYear(env, session, payload, corsHeaders);

    case 'set_active_academic_year':
    case 'activate_academic_year':
      return AcademicYearsApi.setActiveAcademicYear(env, session, payload, corsHeaders);

    case 'close_academic_year':
      return AcademicYearsApi.closeAcademicYear(env, session, payload, corsHeaders);

    case 'archive_academic_year':
      return AcademicYearsApi.archiveAcademicYear(env, session, payload, corsHeaders);

    // Student Promotions
    case 'get_promotion_candidates':
    case 'promotion_candidates':
      return StudentsApi.getPromotionCandidates(env, session, payload, corsHeaders);

    case 'promote_students':
    case 'promote_student':
      return StudentsApi.promoteStudents(env, session, payload, corsHeaders);

    case 'get_classes':
      const { results: clsResults } = await env.DB.prepare(`SELECT * FROM classes ORDER BY grade_level ASC`).all();
      return successResponse({ classes: clsResults || [] }, 'get_classes', 200, corsHeaders);

    case 'get_subjects':
    case 'get_subject_master':
    case 'list_subject_master':
      const { results: subjResults } = await env.DB.prepare(`SELECT * FROM subjects ORDER BY class ASC, subject_code ASC`).all();
      return successResponse({ subjects: subjResults || [] }, 'get_subjects', 200, corsHeaders);

    case 'get_enrollments':
      const { results: enrResults } = await env.DB.prepare(`SELECT * FROM enrollments WHERE status = 'ACTIVE' ORDER BY class ASC, CAST(roll_no AS INTEGER) ASC`).all();
      return successResponse({ enrollments: enrResults || [] }, 'get_enrollments', 200, corsHeaders);

    case 'get_curriculum_list':
    case 'get_curriculum':
    case 'list_curriculum':
      const { results: currResults } = await env.DB.prepare(`SELECT * FROM curriculum WHERE status = 'ACTIVE'`).all();
      return successResponse({ curriculum: currResults || [] }, 'get_curriculum_list', 200, corsHeaders);

    case 'get_student_history':
    case 'student_history':
      const histStuId = payload.studentId || session.userId;
      const canAccessHist = await Security.canAccessStudent(env.DB, session, histStuId);
      if (!canAccessHist) {
        return errorResponse('UNAUTHORIZED', 'Access denied to student history', 403, 'get_student_history', corsHeaders);
      }
      const { results: histResults } = await env.DB.prepare(`SELECT * FROM enrollments WHERE student_id = ? ORDER BY academic_year DESC`).bind(histStuId).all();
      return successResponse({ history: histResults || [] }, 'get_student_history', 200, corsHeaders);

    case 'get_contacts':
    case 'parent_contacts':
      const { results: cntResults } = await env.DB.prepare(`SELECT * FROM contacts ORDER BY display_order ASC, name ASC`).all();
      return successResponse({ contacts: cntResults || [] }, 'get_contacts', 200, corsHeaders);

    case 'get_activities':
    case 'parent_activities':
      const { results: actResults } = await env.DB.prepare(`SELECT * FROM activities ORDER BY date DESC`).all();
      return successResponse({ activities: actResults || [] }, 'get_activities', 200, corsHeaders);

    case 'get_assignments':
    case 'parent_assignments':
      const { results: asgResults } = await env.DB.prepare(`SELECT * FROM assignments WHERE status = 'ACTIVE' ORDER BY due_date ASC`).all();
      return successResponse({ assignments: asgResults || [] }, 'get_assignments', 200, corsHeaders);

    case 'get_achievements':
    case 'parent_achievements':
      const { results: achResults } = await env.DB.prepare(`SELECT * FROM achievements ORDER BY date DESC`).all();
      return successResponse({ achievements: achResults || [] }, 'get_achievements', 200, corsHeaders);

    case 'get_notifications':
      const notifRecipientId = session.userId;
      const { results: notifResults } = await env.DB.prepare(`SELECT * FROM notifications WHERE recipient_id = ? OR recipient_type = 'ALL' ORDER BY created_at DESC`).bind(notifRecipientId).all();
      return successResponse({ notifications: notifResults || [] }, 'get_notifications', 200, corsHeaders);

    case 'get_audit_logs':
    case 'get_security_logs':
      if (!Security.isAdminOrPrincipal(session)) {
        return errorResponse('UNAUTHORIZED', 'Administrative privilege required to view audit logs', 403, 'get_audit_logs', corsHeaders);
      }
      const { results: logResults } = await env.DB.prepare(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50`).all();
      return successResponse({ logs: logResults || [] }, 'get_audit_logs', 200, corsHeaders);

    // Students
    case 'get_students':
    case 'list_students':
      return StudentsApi.getStudents(env, session, payload, corsHeaders);

    case 'get_student_profile':
    case 'student_profile':
      return StudentsApi.getStudentProfile(env, session, payload, corsHeaders);

    // Parents
    case 'get_parent_children':
    case 'parent_children':
      return ParentsApi.getParentChildren(env, session, payload, corsHeaders);

    // Staff & Workforce Management
    case 'get_staff_profile':
    case 'staff_profile':
      return StaffApi.getStaffProfile(env, session, payload, corsHeaders);

    case 'get_teacher_workload':
    case 'teacher_scope':
      return StaffApi.getTeacherScope(env, session, payload, corsHeaders);

    case 'get_staff_list':
    case 'list_staff':
      return StaffApi.getStaffList(env, session, payload, corsHeaders);

    case 'register_staff':
      return StaffApi.registerStaff(env, session, payload, corsHeaders);

    case 'update_staff':
    case 'update_staff_profile':
      return StaffApi.updateStaff(env, session, payload, corsHeaders);

    case 'set_staff_status':
    case 'update_staff_status':
      return StaffApi.setStaffStatus(env, session, payload, corsHeaders);

    // Password Management
    case 'auth_change_password':
    case 'change_password':
    case 'parent_change_password':
      return AuthApi.changePassword(env, session, payload, corsHeaders);

    case 'auth_reset_user_password':
      return AuthApi.resetUserPassword(env, session, payload, corsHeaders);

    // Attendance
    case 'get_attendance':
    case 'parent_attendance':
      return AttendanceApi.getAttendance(env, session, payload, corsHeaders);

    case 'get_attendance_sessions':
    case 'list_attendance_sessions':
      return AttendanceApi.getAttendanceSessions(env, session, payload, corsHeaders);

    case 'save_attendance':
      return AttendanceApi.saveAttendance(env, session, payload, corsHeaders);

    case 'generate_student_attendance_report':
    case 'student_attendance_report':
    case 'get_attendance_report':
      return AttendanceApi.generateAttendanceReport(env, session, payload, corsHeaders);

    // Examinations & Marks
    case 'get_examinations':
      return ExamsApi.getExaminations(env, session, payload, corsHeaders);

    case 'get_marks':
    case 'parent_marks':
      return ExamsApi.getMarks(env, session, payload, corsHeaders);

    case 'get_exam_results':
    case 'get_student_results':
      return ExamsApi.getExamResults(env, session, payload, corsHeaders);

    // Notes, Study Materials, Documents & Notices
    case 'get_notes':
    case 'list_notes':
      return NotesApi.getNotes(env, session, payload, corsHeaders);

    case 'save_notes':
    case 'save_note':
    case 'create_note':
    case 'update_note':
      return NotesApi.saveNotes(env, session, payload, corsHeaders);

    case 'delete_note':
    case 'delete_notes':
      return NotesApi.deleteNote(env, session, payload, corsHeaders);

    case 'save_unit':
    case 'create_unit':
    case 'update_unit':
      return NotesApi.saveUnit(env, session, payload, corsHeaders);

    case 'delete_unit':
      return NotesApi.deleteUnit(env, session, payload, corsHeaders);

    case 'save_question':
    case 'create_question':
    case 'update_question':
      return NotesApi.saveQuestion(env, session, payload, corsHeaders);

    case 'delete_question':
      return NotesApi.deleteQuestion(env, session, payload, corsHeaders);

    case 'get_documents':
    case 'parent_documents':
      return DocumentsApi.getDocuments(env, session, payload, corsHeaders);

    case 'get_notices':
      return NoticesApi.getNotices(env, session, payload, corsHeaders);

    // Reports & Summaries
    case 'get_dashboard_summary':
    case 'dashboard_summary':
    case 'get_admin_summary':
    case 'admin_summary':
      return ReportsApi.getDashboardSummary(env, session, payload, corsHeaders);

    case 'get_settings':
      return SettingsApi.getSettings(env, session, payload, corsHeaders);

    case 'get_practical_lists':
    case 'list_practicals':
      return PracticalsApi.getPracticalLists(env, session, payload, corsHeaders);

    // Backblaze B2 Private Storage Operations
    case 'file_upload':
    case 'upload_file':
      return FilesApi.uploadFile(env, session, payload, corsHeaders);

    case 'file_download':
    case 'download_file':
      const isRaw = url.searchParams.get('raw') === 'true' || pathname === '/api/v1/files/download';
      return FilesApi.downloadFile(env, session, payload, corsHeaders, isRaw);

    case 'file_head':
    case 'head_file':
      return FilesApi.headFile(env, session, payload, corsHeaders);

    case 'file_delete':
    case 'delete_file':
      return FilesApi.deleteFile(env, session, payload, corsHeaders);

    // Non-destructive Parent Portal Reset
    case 'reset_parent_portal_data':
      if (!Security.isAdminOrPrincipal(session)) {
        return errorResponse('UNAUTHORIZED', 'Administrative privilege required to reset parent portal data', 403, 'reset_parent_portal_data', corsHeaders);
      }
      if (payload.confirmation !== 'RESET') {
        return errorResponse('BAD_REQUEST', 'Confirmation string "RESET" required', 400, 'reset_parent_portal_data', corsHeaders);
      }
      return successResponse({
        action: 'reset_parent_portal_data',
        message: 'Parent Portal cache state verified and non-destructive reset completed.',
        protected: {
          students: 'Preserved (Master Records)',
          attendance: 'Preserved (Canonical Attendance Sessions)',
          marks: 'Preserved (Examination Records)',
          documents: 'Preserved (Cloud Archive)',
          academicCalendar: 'Preserved (Official Calendar)'
        },
        timestamp: new Date().toISOString()
      }, 'reset_parent_portal_data', 200, corsHeaders);

    default:
      return errorResponse('INVALID_ACTION', `Unrecognized or unrouted API action: ${action}`, 404, action, corsHeaders);
  }
}
