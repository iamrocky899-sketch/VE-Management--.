# VE Management — Local to Cloud Data Mapping

**School:** Gameri Higher Secondary School, Gamiri  
**Version:** 5.7 (`versionCode = 6`, `versionName = "5.7"`)  
**Backend:** Google Apps Script + Google Sheets  

---

## Complete Local Partition → Cloud Schema Mapping

| Local Key (localStorage) | Entity Description | Cloud Google Sheet | Primary Key (PK) | Sync Direction | Transformation & Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`itd3_s`** | Students Master List | `Students` | `studentId` | `BIDIRECTIONAL` | Preserves existing `id` (`S17180001` or `STU_...`). Never uses row index. |
| **`itd3_s`** (Contact details) | Parent Identity | `Parents` | `parentId` | `ADMIN CONTROLLED` | Deduplicated by 10-digit mobile (`PAR_<mobile>`). SHA-256 password hash + salt. |
| **`itd3_s`** (Linkage) | Parent-Child Authorization | `ParentStudents` | `relId` | `ADMIN CONTROLLED` | Composite `REL_<parentId>_<studentId>`. Authorizes parents to view children. |
| **`itd3_a`** | Daily Attendance Records | `Attendance` | `attendanceId` | `BIDIRECTIONAL` | `ATT_<studentId>_<YYYY-MM-DD>`. Maps present/absent state idempotently. |
| **`itd3_m`** | Student Academic Marks | `Marks` | `markId` | `BIDIRECTIONAL` | `MRK_<studentId>_<examIdx>_IT`. 4 exams: 1st Unit Test, Half Yearly, 2nd Unit Test, Final Exam. |
| **`itd3_notes`** | Teacher Student Notes | `TeacherNotes` | `noteId` | `BIDIRECTIONAL` | `NOTE_<studentId>_<timestamp>`. Author, note text, visibility (`INTERNAL`). |
| **`itd3_timetable`** | Class Schedule Slots | `Timetable` | `timetableId` | `BIDIRECTIONAL` | `TT_<id>`. Day, time, class, section, tolerance, reminderEnabled. |
| **`itd3_sd`** | School Contact Information | `SchoolContacts` | `schoolName` | `ADMIN CONTROLLED` | Principal name (Sanjiv Gogoi), mobile, email, address. |
| **`itd3_tp`** | Teacher Profile Directory | `TeacherContacts` | `teacherId` | `ADMIN CONTROLLED` | Teacher name, class, section, phone, WhatsApp URL. |
| **`itd3_day_status`** | Daily School Overrides | `Settings` / `AuditLog` | `key` | `LOCAL → CLOUD` | Teacher daily class status override notes (`CLASS_NOT_HELD`). |
| **`itd3_cnh`** | Class Not Held Overrides | `Settings` / `AuditLog` | `key` | `LOCAL → CLOUD` | Class-specific not-held overrides with reasons. |
| **`itd3_alerts`** | Consecutive Absence Alerts | `AuditLog` | `logId` | `LOCAL → CLOUD` | Durable alert records, qualified absence dates, streak count. |
| **`itd3_alert_exclusions`**| Alert Exclusions | `AuditLog` / `Settings` | `key` | `LOCAL → CLOUD` | Long-term sickness/leave exclusions per student. |
| **`itd3_audit`** | Local Audit Trail | `AuditLog` | `logId` | `LOCAL → CLOUD` | Action, entity, old/new value, studentName, timestamp. Sanitized. |
| **`itd3_wp`** | Weekly Vocational Progress | `Activities` | `activityId` | `LOCAL → CLOUD` | Class vocational curriculum progress records. |
| **`itd3_rm`** | Raw Materials Register | `Activities` | `activityId` | `LOCAL → CLOUD` | Vocational training material consumption records. |
| **`itd3_gle`** / **`itd3_gl`**| Guest Lectures | `Activities` | `activityId` | `LOCAL → CLOUD` | Vocational guest speaker records and dates. |
| **`itd3_fv`** | Field Visits | `Activities` | `activityId` | `LOCAL → CLOUD` | Vocational industry visit records. |
| **`itd3_wa`** | WhatsApp Group Links | `TeacherContacts` | `teacherId` | `ADMIN CONTROLLED` | Class-wise WhatsApp community links. |
| **`itd3_cg`** | Class Student Leaders | `Students` / `Settings` | `key` | `BIDIRECTIONAL` | Class presidents and student committee roles. |
| **`itd3_f`** | Face Recognition Embeddings | *(Local Only)* | N/A | `LOCAL ONLY` | Sensitive 128-d biometric embeddings remain on device. Never uploaded to Sheets. |
| **`itd3_pi`** | Local User Profile Picture | *(Local Only)* | N/A | `LOCAL ONLY` | Base64 avatar stays in local device storage. |
| **`itd3_holidays`** | Cached Calendar Holidays | `AcademicCalendar` | `date` | `CLOUD → LOCAL` | Official ASSEB 2026–27 Academic Calendar dataset. |
| **`itd3_alert_threshold`** | Absence Alert Threshold | `Settings` | `key` | `BIDIRECTIONAL` | Global threshold (default: 2 consecutive absences). |
| **`itd3_alert_template`** | WhatsApp Message Template | `Settings` | `key` | `BIDIRECTIONAL` | Customizable notification message format. |
| **`itd3_reminder_settings`**| Native Alarm Tolerances | `Settings` | `key` | `BIDIRECTIONAL` | Default reminder tolerance (10 mins) and enabled flag. |
| **`itd3_reminder_notified`**| Ephemeral Alarm State | *(Local Device Only)*| N/A | `LOCAL ONLY` | Runtime AlarmManager firing logs. Not uploaded. |

---

## Summary of Data Classifications

- **Cloud Authoritative Sheets (17):** `Students`, `Parents`, `ParentStudents`, `Attendance`, `Marks`, `Activities`, `Notices`, `AcademicCalendar`, `Timetable`, `SchoolContacts`, `TeacherContacts`, `Documents`, `Achievements`, `Settings`, `AuditLog`, `TeacherNotes`, `SyncQueue`.
- **Local-Only Device Data:** Face biometric embeddings (`itd3_f`), profile image (`itd3_pi`), AlarmManager notification runtime logs (`itd3_reminder_notified`).
