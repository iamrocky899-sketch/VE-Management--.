# FINAL API CONTRACT MATRIX — VE MANAGEMENT UNIFIED SYSTEM

## 1. Gateway & Endpoint Specification
- **CANONICAL BASE URL:** `https://ve-management-api.iamrocky899.workers.dev`
- **DATABASE ENGINE:** Cloudflare D1 (`ve-management-db`)
- **SCHOOL ID:** `GAMERI-HSS-001`
- **SCHOOL NAME:** Gameri Higher Secondary School, Gamiri

---

## 2. API Contract & Implementation Matrix

| Action Name | HTTP Route / Payload | RBAC / Auth Level | D1 Tables Involved | Response Schema | Frontend Consumer & Status |
|---|---|---|---|---|---|
| `ping` | POST/GET `/ping` | Public | None | `{ status: 'ONLINE', version: '6.0-CF-PROD' }` | App health checks & preflight (**ACTIVE**) |
| `auth_login` | POST `{ role, identifier, password }` | Public | `users`, `students`, `parents`, `staff` | `{ success: true, data: { token, userId, role, name, schoolId } }` | `LoginPage.jsx` / `ApiService.loginUnified` (**ACTIVE**) |
| `get_parent_children` | POST `{ token }` | PARENT | `parents`, `parent_student_links`, `students` | `{ success: true, data: { children: [...] } }` | `ParentDashboard.jsx`, `ChildSelector.jsx`, `ParentProfile.jsx` (**ACTIVE**) |
| `get_student_profile` | POST `{ token, studentId }` | STUDENT / PARENT / STAFF | `students`, `enrollments` | `{ success: true, data: { student: {...} } }` | `StudentDashboard.jsx`, `StudentProfile.jsx` (**ACTIVE**) |
| `get_staff_profile` | POST `{ token }` | STAFF (TEACHER / PRINCIPAL / ADMIN) | `staff` | `{ success: true, data: { staff: {...} } }` | `StaffDashboard.jsx`, `UserMenu.jsx` (**ACTIVE**) |
| `get_attendance` | POST `{ token, class?, section?, date?, studentId? }` | Role Scoped | `attendance`, `students` | `{ success: true, data: { attendance: [...] } }` | `ParentAttendance.jsx`, `StudentAttendance.jsx`, `Attendance.jsx` (**ACTIVE**) |
| `save_attendance` | POST `{ token, class, section, date, attendance: [...] }` | TEACHER / ADMIN | `attendance`, `attendance_sessions`, `students` | `{ success: true, data: { sessionId, totalStudents, presentCount, absentCount } }` | `Attendance.jsx` (Staff Portal) (**ACTIVE**) |
| `get_marks` | POST `{ token, studentId?, class?, examType? }` | Role Scoped | `marks`, `examinations` | `{ success: true, data: { marks: [...] } }` | `ParentMarks.jsx`, `StudentMarks.jsx`, `Marks.jsx` (**ACTIVE**) |
| `get_notes` | POST `{ token, class?, subject? }` | ALL AUTHENTICATED | `notes` | `{ success: true, data: { notes: [...] } }` | `ParentMaterials.jsx`, `StudentMaterials.jsx`, `Notes.jsx` (**ACTIVE**) |
| `get_activities` | POST `{ token }` | ALL AUTHENTICATED | `activities` | `{ success: true, data: { activities: [...] } }` | `ParentActivities.jsx`, `StudentActivities.jsx`, `Activities.jsx` (**ACTIVE**) |
| `get_assignments` | POST `{ token }` | ALL AUTHENTICATED | `assignments` | `{ success: true, data: { assignments: [...] } }` | `ParentAssignments.jsx`, `StudentAssignments.jsx`, `Assignments.jsx` (**ACTIVE**) |
| `get_notices` | POST `{ token }` | ALL AUTHENTICATED | `notices` | `{ success: true, data: { notices: [...] } }` | `ParentNotices.jsx`, `StudentNotices.jsx`, `Notices.jsx` (**ACTIVE**) |
| `get_calendar` | POST/GET `/api/v1/calendar` | Public / All | `calendar_events` | `{ success: true, data: { calendar: [...] } }` | `ParentCalendar.jsx`, `StudentCalendar.jsx`, `Calendar.jsx` (**ACTIVE**) |
| `get_classes` | POST `{ token }` | ALL AUTHENTICATED | `classes` | `{ success: true, data: { classes: [...] } }` | Staff class management (**ACTIVE**) |
| `get_subjects` | POST `{ token }` | ALL AUTHENTICATED | `subjects` | `{ success: true, data: { subjects: [...] } }` | Staff subject management (**ACTIVE**) |
| `get_academic_years` | POST `{ token }` | PRINCIPAL / ADMIN | `academic_years` | `{ success: true, data: { academicYears: [...] } }` | Admin academic year settings (**ACTIVE**) |
| `get_staff_list` | POST `{ token }` | PRINCIPAL / ADMIN | `staff` | `{ success: true, data: { staff: [...] } }` | Teachers & staff directory (**ACTIVE**) |
| `get_documents` | POST `{ token, studentId? }` | ALL AUTHENTICATED | `documents` | `{ success: true, data: { documents: [...] } }` | Academic documents & marksheets (**ACTIVE**) |
| `get_dashboard_summary` | POST `{ token }` | STAFF | `students`, `attendance`, `staff` | `{ success: true, data: { summary: {...} } }` | `StaffDashboard.jsx` (**ACTIVE**) |
| `auth_change_password` | POST `{ token, oldPassword, newPassword }` | ALL AUTHENTICATED | `users`, `staff` | `{ success: true, message: 'Password updated' }` | `ChangePasswordModal.jsx` (**ACTIVE**) |

---

## 3. Client-Side Orchestrated Syntheses

To prevent 404s and keep the backend modular, the following higher-level models are synthesized client-side in `unified-portal/src/api/client.js`:

1. **`getParentDashboard(token)`**:
   - Fetches `get_parent_children`
   - Fetches child-scoped `get_attendance`, `get_marks`, `get_assignments`, `get_activities`
   - Fetches global `get_notices`, `get_calendar`
   - Computes real attendance summary from conduct records
   - Returns `{ parent, children: [...], upcomingCalendar, notices }`

2. **`getStudentDashboard(token)`**:
   - Fetches `get_student_profile`
   - Fetches `get_attendance`, `get_marks`, `get_assignments`, `get_activities`, `get_notices`, `get_calendar`
   - Computes real attendance summary from conduct records
   - Returns `{ student, attendanceSummary, marks, assignments, activities, notices, upcomingCalendar }`

3. **`getParentProfile(token)`**:
   - Fetches `get_parent_children` + session info
   - Returns `{ parent, children: [...] }`

4. **`getParentContacts(token, childId)` & `getStudentContacts(token)`**:
   - Safely resolves school and faculty contact directory.
