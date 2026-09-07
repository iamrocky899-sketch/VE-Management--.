-- ============================================================
-- VE MANAGEMENT — CLOUDFLARE D1 INITIAL RELATIONAL SCHEMA
-- School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
-- Migration: 0001_initial_schema.sql
-- ============================================================

-- 1. Institutional Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    value TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'GENERAL',
    description TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_settings_school ON settings(school_id);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- 2. Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
    year_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    year_name TEXT NOT NULL UNIQUE,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'UPCOMING', 'ARCHIVED', 'CLOSED')),
    is_current INTEGER NOT NULL DEFAULT 0 CHECK(is_current IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_academic_years_school ON academic_years(school_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_current ON academic_years(is_current);

-- 3. Classes Master
CREATE TABLE IF NOT EXISTS classes (
    class_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    class_name TEXT NOT NULL,
    grade_level INTEGER NOT NULL CHECK(grade_level BETWEEN 1 AND 12),
    sections TEXT NOT NULL DEFAULT '["A"]',
    stream TEXT NOT NULL DEFAULT 'Vocational IT/ITeS',
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
    display_order INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(school_id, class_name)
);
CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);

-- 4. Subjects Master
CREATE TABLE IF NOT EXISTS subjects (
    subject_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    class TEXT NOT NULL,
    stream TEXT NOT NULL DEFAULT 'General',
    trade TEXT NOT NULL DEFAULT 'IT/ITeS',
    has_theory INTEGER NOT NULL DEFAULT 1 CHECK(has_theory IN (0, 1)),
    has_practical INTEGER NOT NULL DEFAULT 1 CHECK(has_practical IN (0, 1)),
    theory_max_marks REAL NOT NULL DEFAULT 50.0,
    practical_max_marks REAL NOT NULL DEFAULT 50.0,
    max_marks REAL NOT NULL DEFAULT 100.0,
    is_mandatory INTEGER NOT NULL DEFAULT 1 CHECK(is_mandatory IN (0, 1)),
    display_order INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(school_id, subject_code, class)
);
CREATE INDEX IF NOT EXISTS idx_subjects_class ON subjects(school_id, class);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(subject_code);

-- 5. Students Master Table
CREATE TABLE IF NOT EXISTS students (
    student_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    admission_no TEXT NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    first_name TEXT,
    middle_name TEXT,
    last_name TEXT,
    roll_no TEXT,
    class TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'A',
    gender TEXT NOT NULL CHECK(gender IN ('Male', 'Female', 'Other')),
    dob TEXT NOT NULL,
    father_name TEXT,
    mother_name TEXT,
    mobile TEXT,
    aadhaar TEXT,
    village TEXT,
    address TEXT,
    district TEXT DEFAULT 'Biswanath',
    state TEXT DEFAULT 'Assam',
    pin_code TEXT DEFAULT '784172',
    category TEXT DEFAULT 'General',
    blood_group TEXT,
    stream TEXT DEFAULT 'Vocational IT/ITeS',
    admission_date TEXT,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Transferred', 'Graduated', 'Suspended')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_students_class_sec ON students(school_id, class, section);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_mobile ON students(mobile);
CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_no);

-- 6. Parents Master Table
CREATE TABLE IF NOT EXISTS parents (
    parent_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    mobile TEXT NOT NULL UNIQUE,
    parent_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    is_custom_password INTEGER NOT NULL DEFAULT 0 CHECK(is_custom_password IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_parents_mobile ON parents(mobile);
CREATE INDEX IF NOT EXISTS idx_parents_status ON parents(status);

-- 7. Parent-Student Links
CREATE TABLE IF NOT EXISTS parent_student_links (
    link_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    parent_id TEXT NOT NULL REFERENCES parents(parent_id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    relationship TEXT NOT NULL DEFAULT 'Guardian' CHECK(relationship IN ('Father', 'Mother', 'Guardian', 'Relative')),
    active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(parent_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_parent_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_student ON parent_student_links(student_id);

-- 8. Staff Workforce Master
CREATE TABLE IF NOT EXISTS staff (
    staff_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    employee_id TEXT UNIQUE,
    staff_name TEXT NOT NULL,
    first_name TEXT,
    middle_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'PRINCIPAL', 'TEACHER', 'STAFF')),
    gender TEXT,
    dob TEXT,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT,
    address TEXT,
    village TEXT,
    district TEXT DEFAULT 'Biswanath',
    state TEXT DEFAULT 'Assam',
    pin_code TEXT DEFAULT '784172',
    designation TEXT NOT NULL,
    department TEXT DEFAULT 'Vocational Education',
    employment_type TEXT DEFAULT 'Permanent',
    joining_date TEXT,
    qualification TEXT,
    specialization TEXT,
    stream TEXT,
    assigned_classes TEXT DEFAULT '["9","10"]',
    assigned_subjects TEXT DEFAULT '["IT/ITeS"]',
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    is_custom_password INTEGER NOT NULL DEFAULT 0 CHECK(is_custom_password IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_staff_mobile ON staff(mobile);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);

-- 9. Staff Academic Assignments
CREATE TABLE IF NOT EXISTS staff_assignments (
    assignment_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    staff_id TEXT NOT NULL REFERENCES staff(staff_id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'A',
    subject TEXT NOT NULL,
    component TEXT NOT NULL DEFAULT 'BOTH' CHECK(component IN ('THEORY', 'PRACTICAL', 'BOTH')),
    assignment_type TEXT NOT NULL DEFAULT 'SUBJECT_TEACHER' CHECK(assignment_type IN ('SUBJECT_TEACHER', 'CLASS_TEACHER', 'COORDINATOR', 'LAB_INCHARGE')),
    is_class_teacher INTEGER NOT NULL DEFAULT 0 CHECK(is_class_teacher IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
    start_date TEXT,
    end_date TEXT,
    remarks TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_staff_asg_staff ON staff_assignments(staff_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_staff_asg_class ON staff_assignments(class, section);

-- 10. Student Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'A',
    roll_no TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'PROMOTED', 'DETAINED', 'TRANSFERRED', 'COMPLETED')),
    promotion_decision TEXT,
    remarks TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(student_id, academic_year)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_year_class ON enrollments(academic_year, class, section);

-- 11. Attendance Sessions (Session Header & Summary)
CREATE TABLE IF NOT EXISTS attendance_sessions (
    session_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    academic_year TEXT NOT NULL,
    date TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'A',
    stream TEXT DEFAULT 'Vocational IT/ITeS',
    subject_id TEXT,
    subject_name TEXT,
    component TEXT DEFAULT 'THEORY' CHECK(component IN ('THEORY', 'PRACTICAL')),
    period TEXT DEFAULT '1',
    teacher_id TEXT REFERENCES staff(staff_id),
    teacher_name TEXT,
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK(status IN ('DRAFT', 'SUBMITTED', 'LOCKED', 'REVISED')),
    source TEXT DEFAULT 'WEB_PORTAL' CHECK(source IN ('WEB_PORTAL', 'FACE_RECOGNITION', 'ANDROID_OFFLINE_SYNC', 'MANUAL_IMPORT')),
    total_students INTEGER NOT NULL DEFAULT 0,
    present_count INTEGER NOT NULL DEFAULT 0,
    absent_count INTEGER NOT NULL DEFAULT 0,
    late_count INTEGER NOT NULL DEFAULT 0,
    leave_count INTEGER NOT NULL DEFAULT 0,
    is_locked INTEGER NOT NULL DEFAULT 0 CHECK(is_locked IN (0, 1)),
    locked_by TEXT,
    locked_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(school_id, academic_year, date, class, section, subject_name, component, period)
);
CREATE INDEX IF NOT EXISTS idx_att_sessions_date ON attendance_sessions(date, class, section);
CREATE INDEX IF NOT EXISTS idx_att_sessions_year ON attendance_sessions(academic_year);

-- 12. Attendance Records (Student Daily/Period Level)
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    session_id TEXT REFERENCES attendance_sessions(session_id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'A',
    subject TEXT,
    component TEXT DEFAULT 'THEORY',
    period TEXT DEFAULT '1',
    teacher_id TEXT,
    status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'EXCUSED')),
    source TEXT DEFAULT 'MANUAL',
    reason TEXT,
    corrected_by TEXT,
    corrected_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(student_id, date, subject, component, period)
);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class, section, date);

-- 13. Curriculum & Syllabus Master
CREATE TABLE IF NOT EXISTS curriculum (
    curriculum_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    academic_year TEXT NOT NULL,
    class TEXT NOT NULL,
    section_scope TEXT DEFAULT 'ALL',
    stream TEXT DEFAULT 'Vocational',
    trade TEXT DEFAULT 'IT/ITeS',
    curriculum_name TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DRAFT', 'ARCHIVED')),
    effective_from TEXT,
    effective_to TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(school_id, academic_year, class, stream, trade, version)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_class ON curriculum(academic_year, class);

-- 14. Curriculum Subject Inclusions
CREATE TABLE IF NOT EXISTS curriculum_subjects (
    curriculum_subject_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    curriculum_id TEXT NOT NULL REFERENCES curriculum(curriculum_id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(subject_id) ON DELETE RESTRICT,
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    component TEXT DEFAULT 'BOTH',
    is_mandatory INTEGER NOT NULL DEFAULT 1 CHECK(is_mandatory IN (0, 1)),
    is_optional INTEGER NOT NULL DEFAULT 0 CHECK(is_optional IN (0, 1)),
    has_theory INTEGER NOT NULL DEFAULT 1 CHECK(has_theory IN (0, 1)),
    has_practical INTEGER NOT NULL DEFAULT 1 CHECK(has_practical IN (0, 1)),
    theory_max_marks REAL NOT NULL DEFAULT 50.0,
    practical_max_marks REAL NOT NULL DEFAULT 50.0,
    total_max_marks REAL NOT NULL DEFAULT 100.0,
    display_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_curriculum_subj_curr ON curriculum_subjects(curriculum_id);

-- 15. Class-Wise Study Notes Master
CREATE TABLE IF NOT EXISTS notes (
    note_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    title TEXT NOT NULL,
    class TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_id TEXT REFERENCES staff(staff_id),
    teacher_name TEXT,
    attachment_url TEXT,       -- Reference to R2 object key or URL
    attachment_name TEXT,
    attachment_size INTEGER,
    attachment_mime TEXT DEFAULT 'application/pdf',
    visibility TEXT NOT NULL DEFAULT 'PUBLIC' CHECK(visibility IN ('PUBLIC', 'STUDENTS', 'STAFF_ONLY')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notes_class_subject ON notes(school_id, class, subject);

-- 16. Study Note Units
CREATE TABLE IF NOT EXISTS note_units (
    unit_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    note_id TEXT NOT NULL REFERENCES notes(note_id) ON DELETE CASCADE,
    unit_number INTEGER NOT NULL,
    unit_title TEXT NOT NULL,
    description TEXT,
    content_url TEXT,
    attachment_url TEXT,       -- Reference to R2 object key
    attachment_name TEXT,
    attachment_size INTEGER,
    display_order INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(note_id, unit_number)
);
CREATE INDEX IF NOT EXISTS idx_note_units_note ON note_units(note_id);

-- 17. Study Note Questions & Answers
CREATE TABLE IF NOT EXISTS note_questions (
    question_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    unit_id TEXT NOT NULL REFERENCES note_units(unit_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    marks REAL NOT NULL DEFAULT 1.0,
    type TEXT NOT NULL DEFAULT 'SHORT_ANSWER' CHECK(type IN ('SHORT_ANSWER', 'LONG_ANSWER', 'OBJECTIVE', 'PRACTICAL_EXERCISE')),
    display_order INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_note_questions_unit ON note_questions(unit_id);

-- 18. Practical Experiment Lists (Requirement #8)
CREATE TABLE IF NOT EXISTS practical_lists (
    practical_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    class TEXT NOT NULL,
    section_scope TEXT DEFAULT 'ALL',
    stream TEXT DEFAULT 'Vocational IT/ITeS',
    trade TEXT DEFAULT 'IT/ITeS',
    subject_id TEXT,
    subject_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_practical_lists_class ON practical_lists(school_id, class);

-- 19. Examinations Master
CREATE TABLE IF NOT EXISTS examinations (
    exam_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    academic_year TEXT NOT NULL,
    class TEXT NOT NULL,
    section_scope TEXT DEFAULT 'ALL',
    stream TEXT DEFAULT 'Vocational IT/ITeS',
    trade TEXT DEFAULT 'IT/ITeS',
    exam_name TEXT NOT NULL,
    exam_type TEXT NOT NULL DEFAULT 'UNIT_TEST' CHECK(exam_type IN ('UNIT_TEST', 'HALF_YEARLY', 'ANNUAL', 'PRACTICAL_VIVA', 'BOARD_MOCK')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK(status IN ('DRAFT', 'SCHEDULED', 'ACTIVE', 'LOCKED', 'PUBLISHED', 'ARCHIVED')),
    is_locked INTEGER NOT NULL DEFAULT 0 CHECK(is_locked IN (0, 1)),
    locked_by TEXT,
    locked_at TEXT,
    published_at TEXT,
    archived_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(school_id, academic_year, class, exam_name)
);
CREATE INDEX IF NOT EXISTS idx_examinations_year_class ON examinations(academic_year, class);

-- 20. Examination Timetable Schedules
CREATE TABLE IF NOT EXISTS exam_schedules (
    schedule_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    exam_id TEXT NOT NULL REFERENCES examinations(exam_id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'ALL',
    subject_id TEXT NOT NULL,
    subject_code TEXT,
    subject_name TEXT NOT NULL,
    component TEXT NOT NULL DEFAULT 'THEORY' CHECK(component IN ('THEORY', 'PRACTICAL')),
    exam_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    venue TEXT DEFAULT 'Main Examination Hall',
    instructions TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam ON exam_schedules(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_date ON exam_schedules(exam_date);

-- 21. Student Examination Marks
CREATE TABLE IF NOT EXISTS marks (
    mark_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'A',
    exam TEXT NOT NULL,
    subject TEXT NOT NULL,
    component TEXT NOT NULL DEFAULT 'THEORY' CHECK(component IN ('THEORY', 'PRACTICAL')),
    theory REAL DEFAULT 0.0,
    practical REAL DEFAULT 0.0,
    total REAL DEFAULT 0.0,
    max_marks REAL NOT NULL DEFAULT 100.0,
    status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK(status IN ('SUBMITTED', 'CORRECTED', 'VERIFIED')),
    reason TEXT,
    corrected_by TEXT,
    corrected_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(student_id, academic_year, exam, subject, component)
);
CREATE INDEX IF NOT EXISTS idx_marks_student_exam ON marks(student_id, exam);
CREATE INDEX IF NOT EXISTS idx_marks_class_exam ON marks(class, section, exam);

-- 22. Computed & Published Exam Results
CREATE TABLE IF NOT EXISTS exam_results (
    result_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'A',
    stream TEXT DEFAULT 'Vocational IT/ITeS',
    exam_id TEXT REFERENCES examinations(exam_id),
    exam_name TEXT NOT NULL,
    total_marks REAL NOT NULL,
    max_marks REAL NOT NULL,
    percentage REAL NOT NULL,
    grade TEXT NOT NULL,
    result_status TEXT NOT NULL CHECK(result_status IN ('PASSED', 'FAILED', 'NEEDS_IMPROVEMENT', 'PROMOTED', 'WITHHELD')),
    evaluated_subjects_count INTEGER NOT NULL,
    passed_subjects_count INTEGER NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0,
    revision_reason TEXT,
    revised_by TEXT,
    revised_at TEXT,
    published_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(student_id, academic_year, exam_name, revision)
);
CREATE INDEX IF NOT EXISTS idx_exam_results_student ON exam_results(student_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_exam_results_class ON exam_results(class, section, exam_name);

-- 23. School Institutional Notices
CREATE TABLE IF NOT EXISTS notices (
    notice_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    title TEXT NOT NULL,
    summary TEXT,
    body TEXT NOT NULL,
    date TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK(priority IN ('LOW', 'NORMAL', 'IMPORTANT', 'URGENT')),
    is_highlighted INTEGER NOT NULL DEFAULT 0 CHECK(is_highlighted IN (0, 1)),
    visibility TEXT NOT NULL DEFAULT 'ALL' CHECK(visibility IN ('ALL', 'STUDENTS', 'PARENTS', 'STAFF', 'PUBLIC', 'CLASS')),
    notice_type TEXT NOT NULL DEFAULT 'GENERAL' CHECK(notice_type IN ('GENERAL', 'ACADEMIC', 'EXAM', 'HOLIDAY', 'EMERGENCY', 'FEE')),
    audience_type TEXT NOT NULL DEFAULT 'ALL',
    class TEXT DEFAULT 'All',
    section TEXT DEFAULT 'All',
    stream TEXT DEFAULT 'All',
    student_scope TEXT,
    staff_scope TEXT,
    status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK(status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    publish_at TEXT,
    expiry_at TEXT,
    published_by TEXT,
    created_by TEXT,
    is_acknowledgement_required INTEGER NOT NULL DEFAULT 0 CHECK(is_acknowledgement_required IN (0, 1)),
    attachment_url TEXT,       -- Reference to R2 object key
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notices_school_status ON notices(school_id, status);
CREATE INDEX IF NOT EXISTS idx_notices_date ON notices(date DESC);
CREATE INDEX IF NOT EXISTS idx_notices_highlighted ON notices(is_highlighted DESC, date DESC);

-- 24. Notice Read & Acknowledgement Interactions
CREATE TABLE IF NOT EXISTS notice_interactions (
    interaction_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    notice_id TEXT NOT NULL REFERENCES notices(notice_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0, 1)),
    read_at TEXT,
    is_acknowledged INTEGER NOT NULL DEFAULT 0 CHECK(is_acknowledged IN (0, 1)),
    acknowledged_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(notice_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_notice_interactions_user ON notice_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notice_interactions_notice ON notice_interactions(notice_id);

-- 25. Academic Calendar Events
CREATE TABLE IF NOT EXISTS calendar (
    calendar_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    academic_session TEXT DEFAULT '2026-2027',
    date TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK(event_type IN ('HOLIDAY', 'EXAMINATION', 'ACTIVITY', 'VACATION', 'WORKING_DAY', 'CNH')),
    class_scope TEXT DEFAULT 'ALL',
    section_scope TEXT DEFAULT 'ALL',
    stream_scope TEXT DEFAULT 'ALL',
    exam_id TEXT REFERENCES examinations(exam_id),
    schedule_id TEXT,
    official_status TEXT DEFAULT 'ASSEB_OFFICIAL',
    is_working INTEGER NOT NULL DEFAULT 1 CHECK(is_working IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    source TEXT DEFAULT 'ASSEB_CALENDAR_2026_27',
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON calendar(date);
CREATE INDEX IF NOT EXISTS idx_calendar_year ON calendar(academic_year);

-- 26. Official Academic Documents
CREATE TABLE IF NOT EXISTS documents (
    document_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    class TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK(document_type IN ('MARKSHEET', 'REPORT_CARD', 'COMPLETION_CERTIFICATE', 'BONAFIDE_CERTIFICATE', 'STUDY_CERTIFICATE', 'TRANSFER_CERTIFICATE', 'CHARACTER_CERTIFICATE', 'MIGRATION_CERTIFICATE', 'MERIT_CERTIFICATE', 'ACHIEVEMENT_CERTIFICATE', 'PARTICIPATION_CERTIFICATE', 'ADMIT_CARD', 'CUSTOM_CERTIFICATE')),
    document_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ISSUED' CHECK(status IN ('DRAFT', 'REVIEW', 'APPROVED', 'ISSUED', 'REVISED', 'CANCELLED')),
    issue_date TEXT NOT NULL,
    issued_by TEXT NOT NULL,
    approved_by TEXT,
    verification_id TEXT NOT NULL UNIQUE,
    version INTEGER NOT NULL DEFAULT 1,
    revision_of TEXT REFERENCES documents(document_id),
    file_reference TEXT,       -- Reference to R2 object key for generated PDF
    url TEXT,
    category TEXT DEFAULT 'ACADEMIC',
    description TEXT,
    metadata TEXT,             -- JSON string of dynamic metadata
    visibility TEXT NOT NULL DEFAULT 'STUDENTS' CHECK(visibility IN ('PUBLIC', 'STUDENTS', 'STAFF_ONLY')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_documents_student ON documents(student_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_documents_verification ON documents(verification_id);
CREATE INDEX IF NOT EXISTS idx_documents_number ON documents(document_number);

-- 27. Classroom & Vocational Activities
CREATE TABLE IF NOT EXISTS activities (
    activity_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'VOCATIONAL' CHECK(category IN ('VOCATIONAL', 'SPORTS', 'CULTURAL', 'COMMUNITY', 'EXHIBITION', 'LAB_WORK')),
    class TEXT DEFAULT 'All',
    section TEXT DEFAULT 'All',
    visibility TEXT NOT NULL DEFAULT 'PUBLIC',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date DESC);

-- 28. Student Homework & Lab Assignments
CREATE TABLE IF NOT EXISTS assignments (
    assignment_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    title TEXT NOT NULL,
    description TEXT,
    class TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'A',
    subject TEXT NOT NULL,
    assigned_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    max_marks REAL NOT NULL DEFAULT 10.0,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class, section);

-- 29. Student Achievements & Honors
CREATE TABLE IF NOT EXISTS achievements (
    achievement_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    student_id TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'ACADEMIC',
    award TEXT,
    visibility TEXT NOT NULL DEFAULT 'PUBLIC',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_achievements_student ON achievements(student_id);

-- 30. Institutional Directory Contacts
CREATE TABLE IF NOT EXISTS contacts (
    contact_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    category TEXT NOT NULL CHECK(category IN ('STAFF', 'ADMINISTRATION', 'EMERGENCY', 'HELPLINE')),
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    whatsapp TEXT,
    address TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_contacts_category ON contacts(category);

-- 31. Notification Queue & Alerts
CREATE TABLE IF NOT EXISTS notifications (
    notification_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    recipient_type TEXT NOT NULL CHECK(recipient_type IN ('PARENT', 'STUDENT', 'TEACHER', 'STAFF', 'ADMIN')),
    recipient_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'GENERAL' CHECK(type IN ('GENERAL', 'ATTENDANCE_ALERT', 'EXAM_RESULT', 'NOTICE', 'EMERGENCY')),
    read_status INTEGER NOT NULL DEFAULT 0 CHECK(read_status IN (0, 1)),
    sent_at TEXT NOT NULL DEFAULT (datetime('now')),
    read_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, read_status);

-- 32. Offline Client Sync Tracking
CREATE TABLE IF NOT EXISTS sync_metadata (
    sync_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    client_sync_timestamp TEXT NOT NULL,
    batch_size INTEGER NOT NULL DEFAULT 0,
    entity_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PROCESSED' CHECK(status IN ('PENDING', 'PROCESSED', 'FAILED', 'PARTIAL')),
    processed_at TEXT NOT NULL DEFAULT (datetime('now')),
    client_version TEXT DEFAULT 'Android_5.7',
    errors TEXT
);
CREATE INDEX IF NOT EXISTS idx_sync_meta_time ON sync_metadata(client_sync_timestamp);

-- 33. Immutable Security & Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    action TEXT NOT NULL,
    actor_type TEXT NOT NULL CHECK(actor_type IN ('ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT', 'SYSTEM')),
    actor_id TEXT NOT NULL,
    details TEXT,              -- Sanitized JSON string (no secrets or password hashes)
    status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK(status IN ('SUCCESS', 'DENIED', 'ERROR', 'FAILED')),
    ip_address TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, actor_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
