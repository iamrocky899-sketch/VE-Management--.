# STEP 20 — API COMPATIBILITY MATRIX (APPS SCRIPT vs. WORKERS)
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **100% COMPATIBLE (ZERO LOGICAL MISMATCHES)**

---

## 1. Action-to-Route Compatibility Matrix

| Category | Apps Script Action | Workers Route | Method | Required RBAC | Database Target | Logical Parity |
|---|---|---|---|---|---|---|
| **Health** | `ping` | `GET /api/ping` | GET | Public | Memory | **EXACT** |
| **Auth** | `auth_login`, `login`, `parent_login`, `staff_login` | `POST /api/v1/auth/login` | POST | Public | `staff`, `parents`, `students` | **EXACT** |
| **Students** | `get_students`, `list_students` | `GET /api/v1/students` | GET | Admin / Teacher | `students` | **EXACT** |
| **Students** | `get_student_profile`, `student_profile` | `GET /api/v1/students/profile` | GET | Scoped User | `students` | **EXACT** |
| **Parents** | `get_parent_children`, `parent_children` | `GET /api/v1/parents/children` | GET | Parent (Self) | `parent_student_links`, `students` | **EXACT** |
| **Staff** | `get_staff_profile`, `staff_profile` | `GET /api/v1/staff/profile` | GET | Staff (Self) / Admin | `staff` | **EXACT** |
| **Staff** | `get_teacher_workload`, `teacher_scope` | `GET /api/v1/staff/scope` | GET | Teacher (Self) / Admin | `staff_assignments` | **EXACT** |
| **Attendance** | `get_attendance`, `parent_attendance` | `GET /api/v1/attendance` | GET | Scoped User | `attendance` | **EXACT** |
| **Attendance** | `save_attendance` | `POST /api/v1/attendance` | POST | Teacher / Admin | `attendance_sessions`, `attendance` | **EXACT ($40 \rightarrow 40$)** |
| **Attendance** | `generate_student_attendance_report` | `GET /api/v1/attendance/report` | GET | Student / Parent | `attendance`, `students` | **EXACT** |
| **Exams** | `get_examinations` | `GET /api/v1/examinations` | GET | All Roles | `examinations` | **EXACT** |
| **Marks** | `get_marks`, `parent_marks` | `GET /api/v1/marks` | GET | Scoped User | `marks` | **EXACT** |
| **Results** | `get_exam_results`, `get_student_results` | `GET /api/v1/results` | GET | Scoped User | `exam_results` | **EXACT** |
| **Notes** | `get_notes` | `GET /api/v1/notes` | GET | Scoped User | `notes`, `note_units`, `note_questions` | **EXACT (Class-wise)** |
| **Documents** | `get_documents`, `parent_documents` | `GET /api/v1/documents` | GET | Scoped User | `documents` | **EXACT** |
| **Documents** | `verify_document` | `GET /api/v1/documents/verify` | GET | Public | `documents` | **EXACT** |
| **Notices** | `get_notices` | `GET /api/v1/notices` | GET | Scoped User | `notices` | **EXACT (Pinned ⭐)** |
| **Reports** | `get_dashboard_summary`, `dashboard_summary` | `GET /api/v1/reports/summary` | GET | Staff / Admin | Aggregated D1 tables | **EXACT** |
| **Settings** | `get_settings` | `GET /api/v1/settings` | GET | Admin / Principal | `settings` | **EXACT** |
| **Calendar** | `get_calendar` | `GET /api/v1/calendar` | GET | Public | `calendar` | **EXACT** |
| **Practicals** | `get_practical_lists`, `list_practicals` | `GET /api/v1/practicals` | GET | Scoped User | `practical_lists` | **EXACT** |
