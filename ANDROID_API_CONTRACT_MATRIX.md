# ANDROID & CLOUDFLARE WORKER API CONTRACT MATRIX

**Institutional Entity**: Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Canonical Endpoint**: `https://ve-management-api.iamrocky899.workers.dev`  
**Database**: Cloudflare D1 (`ve-management-db`)  
**Runtime Backend**: 100% Cloudflare Workers (Google Apps Script = 0, Google Sheets = 0)

---

## 1. Complete API Contract Matrix

| Android Action | Worker Action | HTTP Status | Authentication | RBAC Enforcement | D1 Tables Accessed | Response Envelope | Offline Support | Contract Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ping` / `/api/ping` | `ping` | `200 OK` | Public | None | None | `{ success: true, data: { status: 'ONLINE', runtime: 'Cloudflare Workers (Edge Staging)', schoolId: 'GAMERI-HSS-001' } }` | Cached ping | **PASS** |
| `auth_login` / `login` | `auth_login` | `200 OK` / `401 Unauthorized` | Public | Validates user & role credentials | `students`, `parents`, `staff` | `{ success: true, data: { token, user, role, schoolId } }` | Stored session token | **PASS** |
| `sync_upload` | `sync_upload` | `200 OK` / `401 / 403` | Bearer Token / Admin API Key | Staff, Teacher, Admin | `students`, `attendance_sessions`, `attendance`, `marks`, `teacher_notes`, `activities`, `notices` | `{ success: true, message: 'Sync upload processed successfully', processed: {...} }` | **Full Persistent Queue** (`SyncQueue`) with exponential backoff retry | **PASS** |
| `sync_download` | `sync_download` | `200 OK` / `401 / 403` | Bearer Token / Admin API Key | Staff, Teacher, Admin | `students`, `attendance_sessions`, `attendance`, `marks`, `teacher_notes`, `activities`, `notices` | `{ success: true, data: { students, attendance, marks, notes, activities, notices, lastSyncTimestamp } }` | **Incremental Delta Sync** (`since` ISO timestamp) | **PASS** |
| `get_calendar` | `get_calendar` | `200 OK` | Public / Session | All Roles | `calendar` | `{ success: true, data: { events: [...] } }` | Pre-bundled `asseb_calendar_2026_27.js` fallback | **PASS** |
| `verify_document` | `verify_document` | `200 OK` / `404 Not Found` | Public | None | `official_documents` | `{ success: true, data: { document: {...} } }` | Online only | **PASS** |
| `get_academic_years` | `get_academic_years` | `200 OK` | Bearer Token | Authenticated | `academic_years` | `{ success: true, data: { academicYears: [...] } }` | Local Cache | **PASS** |
| `get_classes` | `get_classes` | `200 OK` | Bearer Token | Authenticated | `classes` | `{ success: true, data: { classes: [...] } }` | Local Cache | **PASS** |
| `get_subjects` | `get_subjects` | `200 OK` | Bearer Token | Authenticated | `subjects` | `{ success: true, data: { subjects: [...] } }` | Local Cache | **PASS** |
| `get_enrollments` | `get_enrollments` | `200 OK` | Bearer Token | Staff, Teacher, Admin | `enrollments` | `{ success: true, data: { enrollments: [...] } }` | Local Cache | **PASS** |
| `get_curriculum_list` | `get_curriculum_list` | `200 OK` | Bearer Token | Authenticated | `curriculum` | `{ success: true, data: { curriculum: [...] } }` | Local Cache | **PASS** |
| `get_student_history` | `get_student_history` | `200 OK` | Bearer Token | Student, Parent, Staff | `enrollments` | `{ success: true, data: { history: [...] } }` | Local Cache | **PASS** |
| `get_contacts` | `get_contacts` | `200 OK` | Bearer Token | Authenticated | `contacts` | `{ success: true, data: { contacts: [...] } }` | Local Cache | **PASS** |
| `get_activities` | `get_activities` | `200 OK` | Bearer Token | Authenticated | `activities` | `{ success: true, data: { activities: [...] } }` | Local Cache / SyncQueue | **PASS** |
| `get_assignments` | `get_assignments` | `200 OK` | Bearer Token | Authenticated | `assignments` | `{ success: true, data: { assignments: [...] } }` | Local Cache | **PASS** |
| `get_achievements` | `get_achievements` | `200 OK` | Bearer Token | Authenticated | `achievements` | `{ success: true, data: { achievements: [...] } }` | Local Cache | **PASS** |
| `get_notifications` | `get_notifications` | `200 OK` | Bearer Token | Authenticated (scoped by recipient) | `notifications` | `{ success: true, data: { notifications: [...] } }` | Local Cache | **PASS** |
| `get_audit_logs` | `get_audit_logs` | `200 OK` / `403 Forbidden` | Bearer Token | Admin Only | `audit_logs` | `{ success: true, data: { logs: [...] } }` | Online only | **PASS** |
| `get_students` | `get_students` | `200 OK` | Bearer Token | Staff, Teacher, Admin | `students`, `enrollments` | `{ success: true, data: { students: [...] } }` | Local Cache / SyncQueue | **PASS** |
| `get_student_profile` | `get_student_profile` | `200 OK` | Bearer Token | Student (self), Parent (child), Staff | `students`, `enrollments` | `{ success: true, data: { student: {...} } }` | Local Cache | **PASS** |
| `get_parent_children` | `get_parent_children` | `200 OK` | Bearer Token | Parent, Staff, Admin | `parent_student_links`, `students` | `{ success: true, data: { children: [...] } }` | Local Cache | **PASS** |
| `get_staff_profile` | `get_staff_profile` | `200 OK` | Bearer Token | Staff (self), Admin | `staff` | `{ success: true, data: { staff: {...} } }` | Local Cache | **PASS** |
| `get_teacher_workload` | `get_teacher_workload` | `200 OK` | Bearer Token | Teacher, Staff, Admin | `staff_assignments` | `{ success: true, data: { assignments: [...] } }` | Local Cache | **PASS** |
| `get_staff_list` | `get_staff_list` | `200 OK` / `403 Forbidden` | Bearer Token | Staff, Admin | `staff` | `{ success: true, data: { staff: [...] } }` | Local Cache | **PASS** |
| `register_staff` | `register_staff` | `200 OK` / `403 Forbidden` | Bearer Token | Admin, Principal Only | `staff` | `{ success: true, data: { staffId: '...' } }` | Online only | **PASS** |
| `update_staff` | `update_staff` | `200 OK` / `403 Forbidden` | Bearer Token | Staff (self), Admin | `staff` | `{ success: true, data: { updated: true } }` | Online only | **PASS** |
| `set_staff_status` | `set_staff_status` | `200 OK` / `403 Forbidden` | Bearer Token | Admin, Principal Only | `staff` | `{ success: true, data: { status: '...' } }` | Online only | **PASS** |
| `auth_change_password`| `auth_change_password`| `200 OK` / `400 / 401` | Bearer Token | Self (all roles) | `students`, `parents`, `staff` | `{ success: true, message: 'Password updated successfully' }` | Online only | **PASS** |
| `auth_reset_user_password`| `auth_reset_user_password`| `200 OK` / `403` | Bearer Token | Admin, Principal Only | `students`, `parents`, `staff` | `{ success: true, message: 'Password reset successfully' }` | Online only | **PASS** |
| `get_attendance` | `get_attendance` | `200 OK` | Bearer Token | Student (self), Parent (child), Staff | `attendance`, `attendance_sessions` | `{ success: true, data: { records: [...] } }` | Local Cache / SyncQueue | **PASS** |
| `save_attendance` | `save_attendance` | `200 OK` / `403 Forbidden` | Bearer Token | Teacher, Staff, Admin | `attendance_sessions`, `attendance` | `{ success: true, message: 'Attendance saved successfully', count: N }` | Queued in `SyncQueue` if offline | **PASS** |
| `generate_student_attendance_report` | `generate_student_attendance_report` | `200 OK` | Bearer Token | Student (self), Parent (child), Staff | `attendance`, `attendance_sessions` | `{ success: true, data: { summary: { totalSessions, attendedSessions, percentage, status } } }` | Canonical formula computation | **PASS** |
| `get_examinations` | `get_examinations` | `200 OK` | Bearer Token | Authenticated | `examinations` | `{ success: true, data: { examinations: [...] } }` | Local Cache | **PASS** |
| `get_marks` | `get_marks` | `200 OK` | Bearer Token | Student (self), Parent (child), Staff | `marks`, `examinations` | `{ success: true, data: { marks: [...] } }` | Local Cache / SyncQueue | **PASS** |
| `get_exam_results` | `get_exam_results` | `200 OK` | Bearer Token | Student (self), Parent (child), Staff | `exam_results` | `{ success: true, data: { results: [...] } }` | Local Cache | **PASS** |
| `get_notes` | `get_notes` | `200 OK` | Bearer Token | Authenticated | `teacher_notes` | `{ success: true, data: { notes: [...] } }` | Local Cache / SyncQueue | **PASS** |
| `get_documents` | `get_documents` | `200 OK` | Bearer Token | Student (self), Parent (child), Staff | `official_documents` | `{ success: true, data: { documents: [...] } }` | Local Cache | **PASS** |
| `get_notices` | `get_notices` | `200 OK` | Bearer Token | Authenticated | `notices` | `{ success: true, data: { notices: [...] } }` | Local Cache / SyncQueue | **PASS** |
| `get_dashboard_summary`| `get_dashboard_summary`| `200 OK` / `403` | Bearer Token | Staff, Admin | `students`, `attendance_sessions`, `marks`, `staff` | `{ success: true, data: { totalStudents, todayAttendanceRate, pendingNotes, staffActive } }` | Local Cache | **PASS** |
| `get_settings` | `get_settings` | `200 OK` / `403` | Bearer Token | Staff, Admin | `settings` | `{ success: true, data: { settings: {...} } }` | Local Cache | **PASS** |
| `get_practical_lists` | `get_practical_lists` | `200 OK` | Bearer Token | Authenticated | `curriculum` | `{ success: true, data: { practicals: [...] } }` | Local Cache | **PASS** |
| `reset_parent_portal_data`| `reset_parent_portal_data`| `200 OK` / `403` | Bearer Token | Admin, Principal Only | None (read-only audit validation) | `{ success: true, message: 'Parent Portal cache state verified', protected: {...} }` | Non-destructive validation | **PASS** |

---

## 2. API Contract Verification Findings

1. **Zero Mismatches Found**: All 42 production actions invoked by Android or Web clients map directly to registered handler routes in `cloudflare/src/router.js`.
2. **Canonical Response Contract**: Every endpoint strictly adheres to the `{ success: true, data: {...} }` or `{ success: false, error: { code, message } }` envelope.
3. **RBAC Verification**:
   - Unauthorized calls return `401 Unauthorized` (`UNAUTHORIZED`).
   - Role violations (e.g. Student accessing `register_staff` or Parent accessing `get_audit_logs`) return `403 Forbidden` (`FORBIDDEN`).
4. **Offline Resilience**:
   - Android `SyncManager` captures mutating operations (`Students`, `Attendance`, `Marks`, `TeacherNotes`, `Activities`, `Notices`) in an offline persistent `SyncQueue` with automatic exponential backoff retry.
   - Read operations utilize client-side memory and localStorage caching.
