# STEP 18 — APPS SCRIPT TO CLOUDFLARE WORKERS API MIGRATION PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **READY FOR MIGRATION**

---

## 1. Action-to-Route Mapping & Compatibility Architecture

To prevent disruption to existing web portals and Android clients during parallel dual-run, Cloudflare Workers implement a **Unified Two-Tier Router**:
1. **Tier 1 (Legacy Compatibility Layer):** Accepts standard `POST /api` and `POST /exec` with `{ action: '...' }` payloads, returning identical response envelopes `{ success: true, data: ..., error: ... }`.
2. **Tier 2 (RESTful v1 API Layer):** Clean REST endpoints (`/api/v1/auth/login`, `/api/v1/attendance`, `/api/v1/notes`, etc.).

---

## 2. API Endpoint Mapping Matrix

| Category | Apps Script Action (`Code.gs`) | Workers RESTful Route | Method | Required RBAC | Database Target |
|---|---|---|---|---|---|
| **Health** | `ping` | `GET /api/v1/ping` | GET | Public | Memory / Settings |
| **Auth** | `auth_login`, `login`, `parent_login`, `staff_login` | `POST /api/v1/auth/login` | POST | Public | `staff`, `parents`, `students` |
| **Auth** | `auth_change_password` | `POST /api/v1/auth/change-password` | POST | Active User | `staff`, `parents`, `students` |
| **Students** | `get_students` | `GET /api/v1/students` | GET | Admin / Teacher | `students`, `enrollments` |
| **Students** | `admit_student` | `POST /api/v1/students` | POST | Admin | `students`, `enrollments` |
| **Students** | `upload_student_photo` | `POST /api/v1/students/:id/photo` | POST | Student (Self) / Admin | `students`, R2 Storage |
| **Attendance** | `get_attendance`, `parent_attendance` | `GET /api/v1/attendance` | GET | All Roles (Scoped) | `attendance`, `attendance_sessions` |
| **Attendance** | `save_attendance` | `POST /api/v1/attendance` | POST | Teacher / Admin | `attendance`, `attendance_sessions` |
| **Attendance** | `sync_offline_attendance` | `POST /api/v1/attendance/sync` | POST | Teacher / Admin | `attendance`, `attendance_sessions` |
| **Attendance** | `generate_student_attendance_report` | `GET /api/v1/attendance/report` | GET | Student / Parent (Self) | `attendance`, `students` |
| **Notes** | `get_notes` | `GET /api/v1/notes` | GET | All Roles (Scoped) | `notes`, `note_units`, `note_questions` |
| **Notes** | `save_notes` | `POST /api/v1/notes` | POST | Teacher / Admin | `notes`, `note_units`, R2 Storage |
| **Practicals** | `get_practical_lists` | `GET /api/v1/practicals` | GET | All Roles (Scoped) | `practical_lists` |
| **Practicals** | `save_practical_item` | `POST /api/v1/practicals` | POST | Teacher / Admin | `practical_lists` |
| **Examinations** | `get_examinations` | `GET /api/v1/examinations` | GET | All Roles | `examinations`, `exam_schedules` |
| **Marks** | `get_marks`, `parent_marks` | `GET /api/v1/marks` | GET | All Roles (Scoped) | `marks` |
| **Marks** | `save_marks` | `POST /api/v1/marks` | POST | Teacher / Admin | `marks` |
| **Results** | `get_exam_results` | `GET /api/v1/results` | GET | All Roles (Scoped) | `exam_results` |
| **Documents** | `get_documents`, `parent_documents` | `GET /api/v1/documents` | GET | All Roles (Scoped) | `documents` |
| **Documents** | `get_marksheet_data` | `GET /api/v1/documents/marksheet` | GET | All Roles (Scoped) | `documents`, `marks`, `settings` |
| **Documents** | `verify_document` | `GET /api/v1/documents/verify` | GET | Public | `documents` |
| **Notices** | `get_notices` | `GET /api/v1/notices` | GET | All Roles (Scoped) | `notices`, `notice_interactions` |
| **Notices** | `save_notices` | `POST /api/v1/notices` | POST | Admin / Principal / Teacher | `notices` |
| **Calendar** | `get_calendar` | `GET /api/v1/calendar` | GET | Public | `calendar` |
| **Settings** | `get_settings` | `GET /api/v1/settings` | GET | Admin / Principal | `settings` |
| **Settings** | `upload_school_branding` | `POST /api/v1/settings/branding` | POST | Admin / Principal | `settings`, R2 Storage |
| **Backup** | `create_full_backup` | `POST /api/v1/backup/create` | POST | Admin | Multi-table snapshot |

---

## 3. Error Handling Contract

All Worker responses strictly follow the existing error protocol:
```json
{
  "success": false,
  "action": "save_attendance",
  "data": null,
  "error": {
    "code": "UNAUTHORIZED_CLASS",
    "message": "Teacher is not assigned to Class 12."
  },
  "timestamp": "2026-09-02T12:00:00.000Z"
}
```
