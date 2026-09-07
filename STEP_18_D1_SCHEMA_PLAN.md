# STEP 18 — CLOUDFLARE D1 RELATIONAL SCHEMA & INDEX PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **READY FOR MIGRATION**

---

## 1. Complete Database Inventory (Google Sheets $\rightarrow$ Cloudflare D1)

| # | Current Sheet Table | D1 SQL Table | Primary Key | Foreign Key References | Migration Notes |
|---|---|---|---|---|---|
| 1 | `Settings` | `settings` | `key` | None | Permanent institutional config |
| 2 | `AcademicYears` | `academic_years` | `year_id` | None | Unique `year_name`, active year flag |
| 3 | `Classes` | `classes` | `class_id` | None | Grade levels 1–12, sections JSON |
| 4 | `Subjects` | `subjects` | `subject_id` | None | Theory/Practical max marks |
| 5 | `Students` | `students` | `student_id` | None | Unique admission number, photo URL |
| 6 | `Parents` | `parents` | `parent_id` | None | Mobile phone normalization |
| 7 | `ParentStudentLinks` | `parent_student_links` | `link_id` | `parents`, `students` | Multi-child linking & isolation |
| 8 | `Staff` | `staff` | `staff_id` | None | Role, designation, credentials |
| 9 | `StaffAssignments` | `staff_assignments` | `assignment_id` | `staff` | Class teacher & subject roles |
| 10 | `Enrollments` | `enrollments` | `enrollment_id` | `students` | Historical roll number & year |
| 11 | `AttendanceSessions` | `attendance_sessions` | `session_id` | `staff` | Preserves total roster count |
| 12 | `Attendance` | `attendance` | `attendance_id` | `students`, `attendance_sessions` | Individual present/absent records |
| 13 | `Curriculum` | `curriculum` | `curriculum_id` | None | Academic year syllabus version |
| 14 | `CurriculumSubjects` | `curriculum_subjects` | `curriculum_subject_id` | `curriculum`, `subjects` | Subject weightage & rules |
| 15 | `Notes` | `notes` | `note_id` | `staff` | Class-wise notes + R2 PDF key |
| 16 | `NoteUnits` | `note_units` | `unit_id` | `notes` | Unit numbering & unit PDF key |
| 17 | `NoteQuestions` | `note_questions` | `question_id` | `note_units` | Question and answer pairs |
| 18 | `PracticalLists` | `practical_lists` | `practical_id` | None | Class-isolated experiments |
| 19 | `Examinations` | `examinations` | `exam_id` | None | Exam lifecycle & locking |
| 20 | `ExamSchedules` | `exam_schedules` | `schedule_id` | `examinations` | Timetables & exam venues |
| 21 | `Marks` | `marks` | `mark_id` | `students` | Theory & practical marks |
| 22 | `ExamResults` | `exam_results` | `result_id` | `students`, `examinations` | Calculated percentage & grade |
| 23 | `Notices` | `notices` | `notice_id` | None | Priority pinning (`is_highlighted`) |
| 24 | `NoticeInteractions` | `notice_interactions` | `interaction_id` | `notices` | Read tracking & acknowledgements |
| 25 | `Calendar` | `calendar` | `calendar_id` | `examinations` | ASSEB working days & events |
| 26 | `Documents` | `documents` | `document_id` | `students` | Marksheets, certificates, QR |
| 27 | `Activities` | `activities` | `activity_id` | None | Vocational lab activities |
| 28 | `Assignments` | `assignments` | `assignment_id` | None | Homework & project deadlines |
| 29 | `Achievements` | `achievements` | `achievement_id` | `students` | Honors & distinctions |
| 30 | `Contacts` | `contacts` | `contact_id` | None | School directory |
| 31 | `Notifications` | `notifications` | `notification_id` | None | Multi-role dispatch queue |
| 32 | `SyncMetadata` | `sync_metadata` | `sync_id` | None | Offline sync tracking |
| 33 | `Audit` | `audit_logs` | `log_id` | None | Tamper-evident audit trail |

---

## 2. Strategic Index Design

```sql
-- Query Optimization Indexes
CREATE INDEX idx_students_class_sec ON students(school_id, class, section);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_marks_student_exam ON marks(student_id, exam);
CREATE INDEX idx_exam_results_student ON exam_results(student_id, academic_year);
CREATE INDEX idx_notes_class_subject ON notes(school_id, class, subject);
CREATE INDEX idx_notices_highlighted ON notices(is_highlighted DESC, date DESC);
CREATE INDEX idx_documents_verification ON documents(verification_id);
CREATE INDEX idx_audit_logs_time ON audit_logs(timestamp DESC);
```

**Index Justification:**
- `idx_students_class_sec`: Accelerates class roster loading for attendance and marks entry.
- `idx_attendance_student_date`: Optimizes student attendance percentage calculations.
- `idx_notes_class_subject`: Powers class-wise note browsing without scanning full table.
- `idx_notices_highlighted`: Ensures highlighted notices appear instantly at the top of notice boards.
- `idx_documents_verification`: Enables millisecond QR-code document validation.
