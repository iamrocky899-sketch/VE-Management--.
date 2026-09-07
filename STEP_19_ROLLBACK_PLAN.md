# STEP 19 — D1 DEVELOPMENT ROLLBACK & RESET PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE & VERIFIED**  
**Target Scope:** Development Environment Only (`ve-management-db-dev`)

---

## 1. Safety Isolation & Environment Boundaries

> [!CAUTION]
> **DEVELOPMENT-ONLY ROLLBACK SCOPE:**
> - All rollback mechanisms detailed in this document apply **strictly to development D1 instances** (`ve-management-db-dev`).
> - Production Google Sheets and Apps Script require **zero rollback** because they are never written to during Step 19 development testing.

---

## 2. Development D1 Reset & Clean Slate Procedure

If any inconsistency, failed test, or corrupted record occurs in the development database during testing:

### Option A: Complete Database Re-initialization
```bash
# 1. Drop and re-apply local D1 migrations
npx wrangler d1 migrations apply ve-management-db-dev --local

# 2. Re-execute the clean migration pipeline
node scratch/test_phase19_d1_migration.js
```

### Option B: Programmatic Table Truncation
```sql
-- Development Database Reset Script
PRAGMA foreign_keys = OFF;
DELETE FROM audit_logs;
DELETE FROM sync_metadata;
DELETE FROM notifications;
DELETE FROM contacts;
DELETE FROM achievements;
DELETE FROM assignments;
DELETE FROM activities;
DELETE FROM documents;
DELETE FROM calendar;
DELETE FROM notice_interactions;
DELETE FROM notices;
DELETE FROM exam_results;
DELETE FROM marks;
DELETE FROM exam_schedules;
DELETE FROM examinations;
DELETE FROM attendance;
DELETE FROM attendance_sessions;
DELETE FROM practical_lists;
DELETE FROM note_questions;
DELETE FROM note_units;
DELETE FROM notes;
DELETE FROM curriculum_subjects;
DELETE FROM curriculum;
DELETE FROM enrollments;
DELETE FROM staff_assignments;
DELETE FROM staff;
DELETE FROM parent_student_links;
DELETE FROM parents;
DELETE FROM students;
DELETE FROM subjects;
DELETE FROM classes;
DELETE FROM academic_years;
DELETE FROM settings;
PRAGMA foreign_keys = ON;
```

---

## 3. Post-Rollback Integrity Verification

Following a development database reset:
1. Verify tables are clean.
2. Re-apply schema migration `0001_initial_schema.sql`.
3. Execute `scratch/test_phase19_d1_migration.js` to ensure the baseline is fully restored.
