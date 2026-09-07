/**
 * VE MANAGEMENT — DATA NORMALIZATION & TRANSFORMATION ENGINE
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Transforms Google Sheets JSON snapshots into standardized D1 relational records.
 * Preserves: Assamese Unicode, exact IDs, Notes hierarchy, Attendance invariants.
 */

const crypto = require('crypto');

/**
 * Normalizes a single student record with Unicode preservation.
 */
function normalizeStudent(raw, schoolId = 'GAMERI-HSS-001') {
  return {
    student_id: String(raw.studentId || raw.id || '').trim(),
    school_id: String(raw.schoolId || schoolId).trim(),
    admission_no: String(raw.admissionNo || '').trim(),
    student_name: String(raw.studentName || raw.fullName || raw.name || '').trim(),
    first_name: raw.firstName ? String(raw.firstName).trim() : null,
    middle_name: raw.middleName ? String(raw.middleName).trim() : null,
    last_name: raw.lastName ? String(raw.lastName).trim() : null,
    roll_no: raw.rollNo ? String(raw.rollNo).trim() : null,
    class: String(raw.class || '9').trim(),
    section: String(raw.section || 'A').trim(),
    gender: String(raw.gender || 'Male').trim(),
    dob: String(raw.dob || '2010-01-01').trim(),
    father_name: raw.fatherName ? String(raw.fatherName).trim() : null,
    mother_name: raw.motherName ? String(raw.motherName).trim() : null,
    mobile: raw.mobile ? String(raw.mobile).trim() : null,
    aadhaar: raw.aadhaar ? String(raw.aadhaar).trim() : null,
    village: raw.village ? String(raw.village).trim() : null,
    address: raw.address ? String(raw.address).trim() : null,
    district: String(raw.district || 'Biswanath').trim(),
    state: String(raw.state || 'Assam').trim(),
    pin_code: String(raw.pinCode || '784172').trim(),
    category: String(raw.category || 'General').trim(),
    blood_group: raw.bloodGroup ? String(raw.bloodGroup).trim() : null,
    stream: String(raw.stream || 'Vocational IT/ITeS').trim(),
    admission_date: raw.admissionDate ? String(raw.admissionDate).trim() : null,
    photo_url: raw.photoUrl ? String(raw.photoUrl).trim() : null,
    status: String(raw.status || 'Active').trim(),
    created_at: raw.createdAt || new Date().toISOString(),
    updated_at: raw.updatedAt || new Date().toISOString()
  };
}

/**
 * Normalizes an attendance session record preserving roster count invariants.
 */
function normalizeAttendanceSession(raw, enrolledRosterCount = 40, schoolId = 'GAMERI-HSS-001') {
  const total = Math.max(
    Number(raw.totalStudents) || 0,
    enrolledRosterCount || 0,
    40
  );
  return {
    session_id: String(raw.sessionId || raw.id || '').trim(),
    school_id: String(raw.schoolId || schoolId).trim(),
    academic_year: String(raw.academicYear || '2026-2027').trim(),
    date: String(raw.date || new Date().toISOString().split('T')[0]).trim(),
    class: String(raw.class || '9').trim(),
    section: String(raw.section || 'A').trim(),
    stream: String(raw.stream || 'Vocational IT/ITeS').trim(),
    subject_id: raw.subjectId ? String(raw.subjectId).trim() : null,
    subject_name: raw.subjectName ? String(raw.subjectName).trim() : 'IT/ITeS',
    component: String(raw.component || 'THEORY').trim(),
    period: String(raw.period || '1').trim(),
    teacher_id: raw.teacherId ? String(raw.teacherId).trim() : null,
    teacher_name: raw.teacherName ? String(raw.teacherName).trim() : null,
    status: String(raw.status || 'SUBMITTED').trim(),
    source: String(raw.source || 'WEB_PORTAL').trim(),
    total_students: total,
    present_count: Number(raw.presentCount) || 0,
    absent_count: Number(raw.absentCount) || 0,
    late_count: Number(raw.lateCount) || 0,
    leave_count: Number(raw.leaveCount) || 0,
    is_locked: raw.isLocked === true || raw.isLocked === 1 || raw.isLocked === 'true' ? 1 : 0,
    locked_by: raw.lockedBy ? String(raw.lockedBy).trim() : null,
    locked_at: raw.lockedAt ? String(raw.lockedAt).trim() : null,
    created_at: raw.createdAt || new Date().toISOString(),
    updated_at: raw.updatedAt || new Date().toISOString()
  };
}

/**
 * Normalizes class-wise notes preserving Class -> Subject -> Unit -> Q&A structure.
 */
function normalizeNote(raw, schoolId = 'GAMERI-HSS-001') {
  return {
    note_id: String(raw.noteId || raw.id || '').trim(),
    school_id: String(raw.schoolId || schoolId).trim(),
    title: String(raw.title || 'Study Material').trim(),
    class: String(raw.class || '9').trim(),
    subject: String(raw.subject || 'IT/ITeS').trim(),
    teacher_id: raw.teacherId ? String(raw.teacherId).trim() : null,
    teacher_name: raw.teacherName ? String(raw.teacherName).trim() : null,
    attachment_url: raw.attachmentUrl ? String(raw.attachmentUrl).trim() : null,
    attachment_name: raw.attachmentName ? String(raw.attachmentName).trim() : null,
    attachment_size: Number(raw.attachmentSize) || null,
    attachment_mime: String(raw.attachmentMime || 'application/pdf').trim(),
    visibility: String(raw.visibility || 'PUBLIC').trim(),
    created_at: raw.createdAt || new Date().toISOString(),
    updated_at: raw.updatedAt || new Date().toISOString()
  };
}

/**
 * Normalizes official issued academic document.
 */
function normalizeDocument(raw, schoolId = 'GAMERI-HSS-001') {
  return {
    document_id: String(raw.documentId || raw.id || '').trim(),
    school_id: String(raw.schoolId || schoolId).trim(),
    student_id: String(raw.studentId || '').trim(),
    academic_year: String(raw.academicYear || '2026-2027').trim(),
    class: String(raw.class || '9').trim(),
    document_type: String(raw.documentType || 'MARKSHEET').trim(),
    document_number: String(raw.documentNumber || '').trim(),
    title: String(raw.title || 'Official Academic Document').trim(),
    status: String(raw.status || 'ISSUED').trim(),
    issue_date: String(raw.issueDate || new Date().toISOString().split('T')[0]).trim(),
    issued_by: String(raw.issuedBy || 'Principal, GHSS Gamiri').trim(),
    approved_by: raw.approvedBy ? String(raw.approvedBy).trim() : null,
    verification_id: String(raw.verificationId || '').trim(),
    version: Number(raw.version) || 1,
    revision_of: raw.revisionOf ? String(raw.revisionOf).trim() : null,
    file_reference: raw.fileReference ? String(raw.fileReference).trim() : null,
    url: raw.url ? String(raw.url).trim() : null,
    category: String(raw.category || 'ACADEMIC').trim(),
    description: raw.description ? String(raw.description).trim() : null,
    metadata: typeof raw.metadata === 'object' ? JSON.stringify(raw.metadata) : (raw.metadata || '{}'),
    visibility: String(raw.visibility || 'STUDENTS').trim(),
    created_at: raw.createdAt || new Date().toISOString(),
    updated_at: raw.updatedAt || new Date().toISOString()
  };
}

/**
 * Validates relational integrity & foreign keys across normalized datasets.
 */
function validateRelationalIntegrity(dataset) {
  const exceptions = [];

  const studentIds = new Set((dataset.students || []).map(s => s.student_id));
  const parentIds = new Set((dataset.parents || []).map(p => p.parent_id));
  const staffIds = new Set((dataset.staff || []).map(st => st.staff_id));
  const examIds = new Set((dataset.examinations || []).map(e => e.exam_id));
  const noteIds = new Set((dataset.notes || []).map(n => n.note_id));
  const unitIds = new Set((dataset.note_units || []).map(u => u.unit_id));
  const noticeIds = new Set((dataset.notices || []).map(nt => nt.notice_id));
  const sessionIds = new Set((dataset.attendance_sessions || []).map(as => as.session_id));

  // Check orphan enrollments
  (dataset.enrollments || []).forEach(e => {
    if (!studentIds.has(e.student_id)) {
      exceptions.push({ table: 'enrollments', id: e.enrollment_id, field: 'student_id', value: e.student_id, error: 'ORPHAN_STUDENT' });
    }
  });

  // Check orphan parent links
  (dataset.parent_student_links || []).forEach(l => {
    if (!parentIds.has(l.parent_id)) {
      exceptions.push({ table: 'parent_student_links', id: l.link_id, field: 'parent_id', value: l.parent_id, error: 'ORPHAN_PARENT' });
    }
    if (!studentIds.has(l.student_id)) {
      exceptions.push({ table: 'parent_student_links', id: l.link_id, field: 'student_id', value: l.student_id, error: 'ORPHAN_STUDENT' });
    }
  });

  // Check orphan staff assignments
  (dataset.staff_assignments || []).forEach(sa => {
    if (!staffIds.has(sa.staff_id)) {
      exceptions.push({ table: 'staff_assignments', id: sa.assignment_id, field: 'staff_id', value: sa.staff_id, error: 'ORPHAN_STAFF' });
    }
  });

  // Check orphan attendance
  (dataset.attendance || []).forEach(att => {
    if (!studentIds.has(att.student_id)) {
      exceptions.push({ table: 'attendance', id: att.attendance_id, field: 'student_id', value: att.student_id, error: 'ORPHAN_STUDENT' });
    }
    if (att.session_id && !sessionIds.has(att.session_id)) {
      exceptions.push({ table: 'attendance', id: att.attendance_id, field: 'session_id', value: att.session_id, error: 'ORPHAN_SESSION' });
    }
  });

  // Check orphan marks & results
  (dataset.marks || []).forEach(m => {
    if (!studentIds.has(m.student_id)) {
      exceptions.push({ table: 'marks', id: m.mark_id, field: 'student_id', value: m.student_id, error: 'ORPHAN_STUDENT' });
    }
  });

  (dataset.exam_results || []).forEach(er => {
    if (!studentIds.has(er.student_id)) {
      exceptions.push({ table: 'exam_results', id: er.result_id, field: 'student_id', value: er.student_id, error: 'ORPHAN_STUDENT' });
    }
  });

  // Check orphan documents
  (dataset.documents || []).forEach(doc => {
    if (!studentIds.has(doc.student_id)) {
      exceptions.push({ table: 'documents', id: doc.document_id, field: 'student_id', value: doc.student_id, error: 'ORPHAN_STUDENT' });
    }
  });

  // Check note units & questions
  (dataset.note_units || []).forEach(nu => {
    if (!noteIds.has(nu.note_id)) {
      exceptions.push({ table: 'note_units', id: nu.unit_id, field: 'note_id', value: nu.note_id, error: 'ORPHAN_NOTE' });
    }
  });

  (dataset.note_questions || []).forEach(nq => {
    if (!unitIds.has(nq.unit_id)) {
      exceptions.push({ table: 'note_questions', id: nq.question_id, field: 'unit_id', value: nq.unit_id, error: 'ORPHAN_UNIT' });
    }
  });

  return {
    valid: exceptions.length === 0,
    exceptionCount: exceptions.length,
    exceptions: exceptions
  };
}

/**
 * Computes deterministic SHA-256 canonical hash of a table dataset.
 */
function computeCanonicalChecksum(records, primaryKeyField) {
  if (!records || !Array.isArray(records) || records.length === 0) {
    return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // empty sha256
  }

  // Sort deterministically by primary key
  const sorted = [...records].sort((a, b) => {
    const valA = String(a[primaryKeyField] || '');
    const valB = String(b[primaryKeyField] || '');
    return valA.localeCompare(valB);
  });

  // Canonical JSON serialization
  const canonicalString = JSON.stringify(sorted);
  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

module.exports = {
  normalizeStudent,
  normalizeAttendanceSession,
  normalizeNote,
  normalizeDocument,
  validateRelationalIntegrity,
  computeCanonicalChecksum
};
