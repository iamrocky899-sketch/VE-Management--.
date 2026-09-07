/**
 * VE MANAGEMENT — STUDENTS API HANDLERS
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 */

import { successResponse, errorResponse } from '../response.js';
import { Security } from '../security.js';
import { normalizeClass, normalizeSection } from '../academic.js';

export function formatStudentRecord(s) {
  if (!s || typeof s !== 'object') return s;
  const studentId = s.student_id || s.studentId || s.id || '';
  const name = s.student_name || s.studentName || s.name || '';
  const admissionNo = s.admission_no || s.admissionNo || '';
  const className = String(s.class || s.className || '');
  const section = s.section || 'A';
  const rollNo = s.roll_no !== undefined && s.roll_no !== null ? String(s.roll_no) : (s.rollNo !== undefined && s.rollNo !== null ? String(s.rollNo) : '');
  const fatherName = s.father_name || s.fatherName || '';
  const motherName = s.mother_name || s.motherName || '';
  const parentName = s.parentName || fatherName || motherName || 'Parent';
  const mobile = s.mobile || s.parentMobile || '';
  const parentMobile = s.parentMobile || s.mobile || '';
  const status = s.status || 'Active';

  return {
    ...s,
    // Canonical normalized model
    studentId,
    student_id: studentId,
    name,
    studentName: name,
    student_name: name,
    admissionNo,
    admission_no: admissionNo,
    className,
    class: className,
    section,
    rollNo,
    roll_no: rollNo,
    roll: rollNo,
    fatherName,
    father_name: fatherName,
    motherName,
    mother_name: motherName,
    parentName,
    parentMobile,
    mobile,
    status
  };
}

export const StudentsApi = {
  async getStudents(env, session, payload, corsHeaders) {
    const rawClass = payload.class ? String(payload.class) : null;
    const rawSection = payload.section ? String(payload.section) : null;

    const classParam = rawClass ? normalizeClass(rawClass) : null;
    const sectionParam = rawSection ? normalizeSection(classParam, rawSection) : null;

    let query = `SELECT * FROM students WHERE status = 'Active'`;
    const params = [];

    if (classParam) {
      query += ` AND class = ?`;
      params.push(classParam);
    }
    if (sectionParam && sectionParam !== 'ALL') {
      query += ` AND section = ?`;
      params.push(sectionParam);
    }
    query += ` ORDER BY CAST(roll_no AS INTEGER) ASC, student_name ASC`;

    const { results } = await env.DB.prepare(query).bind(...params).all();
    const normalizedStudents = (results || []).map(formatStudentRecord);
    return successResponse({ students: normalizedStudents }, 'get_students', 200, corsHeaders);
  },

  async getStudentProfile(env, session, payload, corsHeaders) {
    const studentId = payload.studentId || session.userId;
    const canAccess = await Security.canAccessStudent(env.DB, session, studentId);
    if (!canAccess) {
      return errorResponse('UNAUTHORIZED', 'Access denied to student record', 403, 'get_student_profile', corsHeaders);
    }

    const student = await env.DB.prepare(`SELECT * FROM students WHERE student_id = ?`).bind(studentId).first();
    if (!student) {
      return errorResponse('NOT_FOUND', 'Student record not found', 404, 'get_student_profile', corsHeaders);
    }

    return successResponse({ student: formatStudentRecord(student) }, 'get_student_profile', 200, corsHeaders);
  }
};

