# STEP 18 — GOOGLE SHEETS TO CLOUDFLARE D1 DATA MIGRATION PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **READY FOR MIGRATION**

---

## 1. Safe Multi-Stage ETL Pipeline

> [!CAUTION]
> **NO DIRECT OVERWRITE RULE:**
> Data from Google Sheets is never imported into Cloudflare D1 without passing schema normalization, primary key uniqueness validation, foreign key relational integrity checks, and audit logging.

```
[ Google Sheets Backup Export ]
               │
               ▼
[ Schema & Datatype Normalization ] ──► (Date ISO strings, Booleans -> 0/1, Nulls)
               │
               ▼
[ Relational Integrity Validation ] ──► (Verify Students exist for Attendance/Marks)
               │
               ▼
[ D1 Staging Import (Batch SQL) ]  ──► (Atomic transaction per table)
               │
               ▼
[ Verification & Checksum Audit ]  ──► (Row counts, sum hashes, duplicate detection)
```

---

## 2. Dependency-Safe Table Migration Order

To respect SQLite foreign key constraints, tables are migrated in exact topological dependency order:

1. `settings` (Institutional profile & constants)
2. `academic_years` (Session definitions)
3. `classes` (Grade levels & sections)
4. `subjects` (Master subject codes & components)
5. `students` (Student master records)
6. `parents` (Parent master records)
7. `parent_student_links` (Parent-child relationships)
8. `staff` (Staff & teacher records)
9. `staff_assignments` (Teacher class/subject mappings)
10. `enrollments` (Student session roll numbers)
11. `curriculum` (Syllabus headers)
12. `curriculum_subjects` (Syllabus subject inclusions)
13. `notes` (Class-wise note headers)
14. `note_units` (Note units)
15. `note_questions` (Note Q&As)
16. `practical_lists` (Practical experiment lists)
17. `attendance_sessions` (Session headers preserving roster totals)
18. `attendance` (Individual student attendance records)
19. `examinations` (Exam schedules & headers)
20. `exam_schedules` (Exam timetables)
21. `marks` (Student theory & practical marks)
22. `exam_results` (Calculated percentages & grades)
23. `notices` (School communications & highlighted notices)
24. `notice_interactions` (Read tracking)
25. `calendar` (Official ASSEB calendar events)
26. `documents` (Issued marksheets & certificates)
27. `activities` (Vocational activities)
28. `assignments` (Homework & projects)
29. `achievements` (Student honors)
30. `contacts` (School directory)
31. `notifications` (Notification logs)
32. `sync_metadata` (Offline sync metadata)
33. `audit_logs` (System audit records)

---

## 3. Data Integrity & Validation Heuristics

Every migration batch must satisfy:
- **Primary Key Uniqueness:** Zero duplicate IDs across all tables.
- **Foreign Key Validity:** 100% of referenced parent, student, staff, and session IDs must exist in parent tables.
- **Attendance Roster Stability:** Sum of `present_count` + `absent_count` + `late_count` + `leave_count` $\le$ `total_students`, and `total_students` $\ge 40$ for Class 9A.
- **Zero Historical Record Deletion:** All historical documents, marks, and sessions must be preserved immutably.
