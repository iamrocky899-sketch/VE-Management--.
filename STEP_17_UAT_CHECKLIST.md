# STEP 17 — USER ACCEPTANCE TESTING (UAT) SCENARIOS & RESULTS
**Institutional Entity:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Evaluation Scope:** 75 Comprehensive Real-World UAT Scenarios Across All 5 Roles  
**Status:** 75 / 75 PASSED  

---

## 1. Administrator UAT Scenarios (20 Scenarios)

| ID | Role | Precondition | Action | Expected Result | Actual Result | Status | Evidence / Notes |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **UAT-ADM-01** | `ADMIN` | Logged in as Admin | Search student by name `Rohan` | Returns matching student profile `E2E_STU_01` | Filtered list displayed accurately | `PASS` | `Students.jsx` / `AdminApi.getStudents` |
| **UAT-ADM-02** | `ADMIN` | Student profile selected | Open Student 360 view | Displays personal, enrollment, attendance, and parent data | Complete 360 profile loaded | `PASS` | `Portfolio.jsx` |
| **UAT-ADM-03** | `ADMIN` | Student 360 open | View linked parent relationship | Displays Father `Mr. Saikia` (`PAR_9876543210`) | Verified link loaded from `ParentStudentLinks` | `PASS` | `ParentStudentLinks` query |
| **UAT-ADM-04** | `ADMIN` | Student profile open | Update phone number | Phone updated and audited in `AuditLogs` | Updated successfully; audit record added | `PASS` | `AdminApi.updateStudentProfile` |
| **UAT-ADM-05** | `ADMIN` | Student admitted | Admit new student with duplicate admission number | System denies duplicate with error code | Duplicate rejected with `DUPLICATE_ADMISSION` | `PASS` | `AdminApi.checkDuplicateStudent` |
| **UAT-ADM-06** | `ADMIN` | Student master | Link new parent to student | Link created with normalized phone | Link recorded in `ParentStudentLinks` | `PASS` | `AdminApi.linkParentStudent` |
| **UAT-ADM-07** | `ADMIN` | Parent linked | Unlink parent from student | Link status set to `INACTIVE` | Relationship unlinked immediately | `PASS` | `AdminApi.unlinkParentStudent` |
| **UAT-ADM-08** | `ADMIN` | CSV file prepared | Preview CSV import | Displays preview table with row count & validation errors | Valid preview grid rendered | `PASS` | `AdminApi.importStudentsCsv` preview |
| **UAT-ADM-09** | `ADMIN` | Valid preview | Confirm CSV import | Students admitted and enrollments created in batch | Batch upsert completed safely | `PASS` | `AdminApi.importStudentsCsv` commit |
| **UAT-ADM-10** | `ADMIN` | Student list active | Export students to CSV | CSV exported with sanitized formulas (`=`, `+`, `-`, `@`) | Downloaded CSV contains `'=cmd` protection | `PASS` | `ReportApi.exportReportData` |
| **UAT-ADM-11** | `ADMIN` | Academic structure | View active academic year | Displays `2026-2027` as active session | Active session loaded from `AcademicYears` | `PASS` | `AcademicYears.jsx` |
| **UAT-ADM-12** | `ADMIN` | Class 10 selected | View curriculum subjects | Shows `IT/ITeS` (50 Th + 50 Pr = 100 Total) | Curriculum structure verified | `PASS` | `CurriculumSubjects` query |
| **UAT-ADM-13** | `ADMIN` | Staff directory | Assign teacher to Class 10 IT/ITeS | Assignment recorded in `StaffAssignments` | `StaffAssignments` updated atomically | `PASS` | `AdminApi.saveStaffAssignment` |
| **UAT-ADM-14** | `ADMIN` | Class 10 students | Assign sequential roll numbers | Roll numbers 1, 2 assigned without collision | Roll numbers scoped to class/section | `PASS` | `AdminApi.assignRollNumbers` |
| **UAT-ADM-15** | `ADMIN` | End of term | Execute student promotion | Student promoted; previous year enrollment preserved | Historical enrollment archived | `PASS` | `AdminApi.promoteStudents` |
| **UAT-ADM-16** | `ADMIN` | Exam management | Create new examination | Exam created in `DRAFT` state | Exam recorded in `Examinations` | `PASS` | `ExaminationApi.saveExaminations` |
| **UAT-ADM-17** | `ADMIN` | Official documents | Issue official Marksheet | Serial number formatted as `GHSS/2026/MS/001` | Number generated and document issued | `PASS` | `DocumentApi.issueDocument` |
| **UAT-ADM-18** | `ADMIN` | Notice management | Publish school-wide circular | Circular published with `visibility: ALL` | Notice delivered to all feeds | `PASS` | `CommunicationApi.saveNotices` |
| **UAT-ADM-19** | `ADMIN` | Settings dashboard | Update document footer text | Setting persisted and audited | `SettingsApi.updateSetting` successful | `PASS` | `Settings.jsx` |
| **UAT-ADM-20** | `ADMIN` | Backup & recovery | Create full 23-table snapshot | Full snapshot generated with checksum `CHK_...` | Backup created with metadata | `PASS` | `BackupApi.createFullBackup` |

---

## 2. Principal UAT Scenarios (10 Scenarios)

| ID | Role | Precondition | Action | Expected Result | Actual Result | Status | Evidence / Notes |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **UAT-PRN-01** | `PRINCIPAL` | Logged in as Principal | View executive dashboard | Displays school-wide KPIs (Students, Staff, Exams, Attendance) | Overview KPI cards rendered accurately | `PASS` | `Dashboard.jsx` / `ReportApi` |
| **UAT-PRN-02** | `PRINCIPAL` | Dashboard open | View daily attendance summary | Displays today's attendance breakdown across classes | Daily summary metrics accurate | `PASS` | `ReportApi.getDailyAttendanceRegister` |
| **UAT-PRN-03** | `PRINCIPAL` | Exam ready | Publish calculated examination results | Exam status updated to `PUBLISHED` | Parents and students can now view | `PASS` | `ExaminationApi.saveExaminations` |
| **UAT-PRN-04** | `PRINCIPAL` | Marks reviewed | Execute Head of Institution mark correction | Mark updated with reason and audit trail logged | `AuditLogs` entry created with reason | `PASS` | `ExaminationApi.correctMark` |
| **UAT-PRN-05** | `PRINCIPAL` | Draft document | Approve draft academic certificate | Document transitioned to `APPROVED` state | Status updated in `OfficialDocuments` | `PASS` | `DocumentApi.approveDocument` |
| **UAT-PRN-06** | `PRINCIPAL` | Notice composer | Issue urgent administrative notice | High priority notice broadcast to school portal | Notice displayed with alert badge | `PASS` | `AdminNotice.jsx` |
| **UAT-PRN-07** | `PRINCIPAL` | Academic calendar | Add institutional holiday | Holiday published on school calendar | Event visible with non-working day flag | `PASS` | `Calendar.jsx` |
| **UAT-PRN-08** | `PRINCIPAL` | Reports hub | Generate low-attendance report (<75%) | Lists students with attendance deficit | Report generated with contact numbers | `PASS` | `ReportApi.getLowAttendanceReport` |
| **UAT-PRN-09** | `PRINCIPAL` | Reports hub | View teacher workload analysis | Displays theory/practical periods per faculty | Faculty distribution rendered | `PASS` | `ReportApi.getTeacherWorkloadReport` |
| **UAT-PRN-10** | `PRINCIPAL` | Security attempt | Attempt to modify admin root password | Action denied (Admin only) | Denied with `UNAUTHORIZED` code | `PASS` | `SettingsApi.updateSetting` RBAC check |

---

## 3. Teacher UAT Scenarios (20 Scenarios)

| ID | Role | Precondition | Action | Expected Result | Actual Result | Status | Evidence / Notes |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **UAT-TCH-01** | `TEACHER` | Logged in as `TCH_101` | View teacher dashboard | Shows assigned classes (Class 10) & subjects (IT/ITeS) | Filtered dashboard loaded | `PASS` | `Security.getTeacherAcademicScope` |
| **UAT-TCH-02** | `TEACHER` | Dashboard open | Access assigned Class 10 | Class 10 roster loaded successfully | Class roster visible | `PASS` | `Attendance.jsx` |
| **UAT-TCH-03** | `TEACHER` | Teacher session | Attempt to access unassigned Class 9 | Access denied (Teacher scope enforcement) | Denied with `UNAUTHORIZED_CLASS` | `PASS` | `Security.canAccessClass` |
| **UAT-TCH-04** | `TEACHER` | Class 10 roster open | Mark all students Present | All students set to `PRESENT` | Single-click bulk mark functional | `PASS` | `Attendance.jsx` |
| **UAT-TCH-05** | `TEACHER` | Attendance sheet | Mark individual student Absent | Student status set to `ABSENT` | Toggle status updated | `PASS` | `Attendance.jsx` |
| **UAT-TCH-06** | `TEACHER` | Attendance sheet | Mark student Leave without reason | System prompts for mandatory reason | Rejection alert shown | `PASS` | `AttendanceApi.saveAttendance` |
| **UAT-TCH-07** | `TEACHER` | Attendance sheet | Mark student Leave with valid reason | Record accepted and saved | Leave reason captured | `PASS` | `AttendanceApi.saveAttendance` |
| **UAT-TCH-08** | `TEACHER` | Session complete | Submit and lock attendance session | Session status set to `LOCKED` | `AttendanceSessions` locked | `PASS` | `AttendanceApi.saveAttendance` |
| **UAT-TCH-09** | `TEACHER` | Session locked | Attempt casual modification | Modification blocked by server | Denied with `SESSION_LOCKED` | `PASS` | `AttendanceApi.saveAttendance` |
| **UAT-TCH-10** | `TEACHER` | Exam open | Open marks entry for Class 10 IT/ITeS | Roster loaded with theory & practical columns | Marks entry sheet rendered | `PASS` | `Marks.jsx` |
| **UAT-TCH-11** | `TEACHER` | Marks sheet | Enter valid marks (45 Theory, 45 Practical) | Marks saved; total calculated as 90 | Saved successfully in `Marks` table | `PASS` | `ExaminationApi.saveMarks` |
| **UAT-TCH-12** | `TEACHER` | Marks sheet | Enter negative mark (-5) | System rejects invalid mark | Rejection with `INVALID_MARKS` | `PASS` | `ExaminationApi.saveMarks` |
| **UAT-TCH-13** | `TEACHER` | Marks sheet | Enter mark exceeding max (>50) | System rejects mark overflow | Rejection with `INVALID_MARKS` | `PASS` | `ExaminationApi.saveMarks` |
| **UAT-TCH-14** | `TEACHER` | Marks sheet | Leave student mark unentered | Recorded as missing (`-`), not zero | Missing representation verified | `PASS` | `ExaminationApi.formatMarkValue` |
| **UAT-TCH-15** | `TEACHER` | Notes module | View Notes hierarchy | Organized as `Class -> Subject -> Unit -> Q&A` | Text-based Q&A structure verified | `PASS` | `Notes.jsx` |
| **UAT-TCH-16** | `TEACHER` | Notes module | Add Q&A set to Class 10 IT/ITeS | Note saved under assigned subject | Note created successfully | `PASS` | `AcademicApi.saveNotes` |
| **UAT-TCH-17** | `TEACHER` | Notes module | Attempt to add note to Class 9 | Action denied (Teacher scope enforcement) | Rejection with `UNAUTHORIZED` | `PASS` | `Security.canTeacherManageSubject`|
| **UAT-TCH-18** | `TEACHER` | Calendar view | View school timetable & events | Displays Class 10 exam schedule & holidays | Calendar merged view rendered | `PASS` | `Calendar.jsx` |
| **UAT-TCH-19** | `TEACHER` | Notices feed | View institutional circulars | Shows school-wide and teacher-scoped circulars | Targeted notices loaded | `PASS` | `Notices.jsx` |
| **UAT-TCH-20** | `TEACHER` | Mobile viewport | Access attendance via mobile web | Responsive layout without horizontal overflow | Mobile layout responsive | `PASS` | Staff Portal responsive QA |

---

## 4. Parent UAT Scenarios (15 Scenarios)

| ID | Role | Precondition | Action | Expected Result | Actual Result | Status | Evidence / Notes |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **UAT-PAR-01** | `PARENT` | Registered mobile | Log in with mobile & password | Authenticates and returns linked children | Session established with `PAR_...` | `PASS` | `ParentLogin.jsx` |
| **UAT-PAR-02** | `PARENT` | Multi-child parent | View Child Selector dropdown | Displays Child A (`Rohan`, Cl 10) & Child B (`Ananya`, Cl 9) | Both children listed | `PASS` | `ChildSelector.jsx` |
| **UAT-PAR-03** | `PARENT` | Child A selected | View attendance register | Displays Child A's attendance records only | Child A attendance loaded | `PASS` | `ParentAttendance.jsx` |
| **UAT-PAR-04** | `PARENT` | Child A selected | Switch to Child B | Dashboard updates immediately with Child B's data | Child B records rendered | `PASS` | `ChildSelector.jsx` state switch |
| **UAT-PAR-05** | `PARENT` | Child B active | Refresh browser page | Session and Child B selection persist | Active child persisted in state | `PASS` | Local storage & session state |
| **UAT-PAR-06** | `PARENT` | Child A selected | View examination results | Displays `PUBLISHED` results only | Published results rendered | `PASS` | `ParentMarks.jsx` |
| **UAT-PAR-07** | `PARENT` | Child A selected | View unpublished exam result | Unpublished exam is hidden | Zero data leakage of draft results | `PASS` | `ExaminationApi.getExamResults` |
| **UAT-PAR-08** | `PARENT` | Child A selected | View official issued documents | Displays issued Marksheet with download link | Official document visible | `PASS` | `ParentDocuments.jsx` |
| **UAT-PAR-09** | `PARENT` | Child A selected | View school notices | Shows school-wide and Class 10 targeted notices | Targeted notices loaded | `PASS` | `ParentNotices.jsx` |
| **UAT-PAR-10** | `PARENT` | Child A selected | Notice with Class 9 scope | Class 9 notice hidden when Child A is selected | Cross-class isolation verified | `PASS` | `CommunicationApi.getNotices` |
| **UAT-PAR-11** | `PARENT` | Direct API attempt | Request records for unlinked Child C | Request denied (Privacy boundary enforcement) | Denied with `UNAUTHORIZED_STUDENT` | `PASS` | `Security.canAccessStudent` |
| **UAT-PAR-12** | `PARENT` | School calendar | View holiday & exam dates | Displays school calendar with child's exam dates | Unified calendar rendered | `PASS` | `ParentCalendar.jsx` |
| **UAT-PAR-13** | `PARENT` | Study materials | Access subject notes for Child A | Displays Class 10 Q&A notes | Class 10 notes loaded | `PASS` | `ParentMaterials.jsx` |
| **UAT-PAR-14** | `PARENT` | Mobile viewport | Navigate parent portal on mobile | Responsive cards, touch-friendly tabs | Zero layout clipping | `PASS` | Parent Portal responsive QA |
| **UAT-PAR-15** | `PARENT` | Session active | Click Logout | Session token destroyed; redirected to login | Logged out cleanly | `PASS` | `Navbar.jsx` / `AuthContext` |

---

## 5. Student UAT Scenarios (10 Scenarios)

| ID | Role | Precondition | Action | Expected Result | Actual Result | Status | Evidence / Notes |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **UAT-STU-01** | `STUDENT` | Student account | Log in with Student ID / Mobile | Authenticates and loads student dashboard | Session created with `STU_...` | `PASS` | `StudentLogin.jsx` |
| **UAT-STU-02** | `STUDENT` | Student dashboard | View personal attendance percentage | Displays overall attendance % and present days | Attendance KPI card rendered | `PASS` | `StudentDashboard.jsx` |
| **UAT-STU-03** | `STUDENT` | Student portal | View published examination marks | Displays subject marks and grade (`A+`) | Published marks displayed | `PASS` | `StudentMarks.jsx` |
| **UAT-STU-04** | `STUDENT` | Direct API attempt | Attempt to view another student's marks | Request denied (Self-authorization only) | Denied with `UNAUTHORIZED_STUDENT` | `PASS` | `Security.canAccessStudent` |
| **UAT-STU-05** | `STUDENT` | Documents view | View issued Marksheet & Admit Card | Displays issued documents with verification QR | Documents loaded safely | `PASS` | `StudentDocuments.jsx` |
| **UAT-STU-06** | `STUDENT` | Notices view | View school circulars & acknowledgements | Displays Class 10 notices with Acknowledge button | Notice feed loaded | `PASS` | `StudentNotices.jsx` |
| **UAT-STU-07** | `STUDENT` | Notice open | Click Acknowledge on circular | Interaction recorded in `NoticeInteractions` | Acknowledged state updated | `PASS` | `CommunicationApi.acknowledgeNotice`|
| **UAT-STU-08** | `STUDENT` | Study materials | View class Q&A notes | Displays text-based Q&A for enrolled subjects | Study materials readable | `PASS` | `StudentMaterials.jsx` |
| **UAT-STU-09** | `STUDENT` | Calendar view | Check upcoming examination timetable | Displays exam dates, venues, and timings | Timetable schedule rendered | `PASS` | `StudentCalendar.jsx` |
| **UAT-STU-10** | `STUDENT` | Profile view | View student identity card & details | Displays profile with roll no, class, section | Profile rendered safely | `PASS` | `StudentProfile.jsx` |
