# STEP 23 — PRODUCTION D1 DATABASE PROVISIONING & SCHEMA PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE SPECIFICATION**

---

## 1. Database Provisioning Procedure

```bash
# 1. Create Production D1 Database instance
npx wrangler d1 create ve-management-db-prod

# 2. Apply validated 33-table schema
npx wrangler d1 migrations apply ve-management-db-prod --env production
```

---

## 2. 33-Table Relational Schema Structure

- **Settings & Academic Master:** `settings`, `academic_years`, `classes`, `subjects`, `curriculum`, `curriculum_subjects`.
- **User & Roster Master:** `students`, `parents`, `parent_student_links`, `staff`, `staff_assignments`, `enrollments`.
- **Academic Transactions:** `attendance_sessions`, `attendance`, `examinations`, `exam_schedules`, `marks`, `exam_results`.
- **Learning & Resources:** `notes`, `note_units`, `note_questions`, `practical_lists`, `documents`, `notices`, `notice_interactions`, `calendar`.
- **Institutional Records:** `activities`, `assignments`, `achievements`, `contacts`, `notifications`, `sync_metadata`, `audit_logs`.

---

## 3. High-Performance Indexing Strategy
- `idx_students_class_sec` (`class`, `section`)
- `idx_attendance_session` (`session_id`)
- `idx_marks_student_exam` (`student_id`, `exam`)
- `idx_exam_results_student` (`student_id`, `academic_year`)
- `idx_notes_class_subject` (`class`, `subject`)
- `idx_notices_highlighted` (`is_highlighted`, `status`)
- `idx_documents_verification` (`verification_id`)
