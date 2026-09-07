/**
 * VE MANAGEMENT — ATTENDANCE API HANDLERS
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * CRITICAL INVARIANT: Marking attendance never shrinks enrolled class roster count.
 * Maintains full canonical class and section normalization parity with D1.
 */

import { successResponse, errorResponse } from '../response.js';
import { Security } from '../security.js';
import { normalizeClass, normalizeSection } from '../academic.js';

export const AttendanceApi = {
  async getAttendance(env, session, payload, corsHeaders) {
    const rawClass = payload.class ? String(payload.class) : null;
    const rawSection = payload.section ? String(payload.section) : null;
    const classParam = rawClass ? normalizeClass(rawClass) : null;
    const sectionParam = rawSection ? normalizeSection(classParam, rawSection) : null;
    const dateParam = payload.date ? String(payload.date) : null;
    const studentIdParam = payload.studentId ? String(payload.studentId) : null;

    let query = `SELECT a.*, s.student_name, s.roll_no FROM attendance a
                 JOIN students s ON a.student_id = s.student_id WHERE 1=1`;
    const params = [];

    if (classParam) {
      query += ` AND a.class = ?`;
      params.push(classParam);
    }
    if (sectionParam && sectionParam !== 'ALL') {
      query += ` AND (a.section = ? OR a.section = 'ALL')`;
      params.push(sectionParam);
    }
    if (dateParam) {
      query += ` AND a.date = ?`;
      params.push(dateParam);
    }
    if (studentIdParam) {
      const canAccess = await Security.canAccessStudent(env.DB, session, studentIdParam);
      if (!canAccess) {
        return errorResponse('UNAUTHORIZED', 'Access denied to student attendance', 403, 'get_attendance', corsHeaders);
      }
      query += ` AND a.student_id = ?`;
      params.push(studentIdParam);
    }

    query += ` ORDER BY a.date DESC, CAST(s.roll_no AS INTEGER) ASC`;

    const { results } = await env.DB.prepare(query).bind(...params).all();
    return successResponse({ attendance: results || [] }, 'get_attendance', 200, corsHeaders);
  },

  async getAttendanceSessions(env, session, payload, corsHeaders) {
    const rawClass = payload.class ? String(payload.class) : null;
    const rawSection = payload.section ? String(payload.section) : null;
    const classParam = rawClass ? normalizeClass(rawClass) : null;
    const sectionParam = rawSection ? normalizeSection(classParam, rawSection) : null;
    const dateParam = payload.date ? String(payload.date) : null;
    const academicYear = payload.academicYear || null;

    let query = `SELECT * FROM attendance_sessions WHERE 1=1`;
    const params = [];

    if (classParam) {
      query += ` AND class = ?`;
      params.push(classParam);
    }
    if (sectionParam && sectionParam !== 'ALL') {
      query += ` AND (section = ? OR section = 'ALL')`;
      params.push(sectionParam);
    }
    if (dateParam) {
      query += ` AND date = ?`;
      params.push(dateParam);
    }
    if (academicYear) {
      query += ` AND academic_year = ?`;
      params.push(academicYear);
    }

    query += ` ORDER BY date DESC`;
    const { results } = await env.DB.prepare(query).bind(...params).all();
    return successResponse({ sessions: results || [] }, 'get_attendance_sessions', 200, corsHeaders);
  },

  async saveAttendance(env, session, payload, corsHeaders) {
    const rawClass = payload.class ? String(payload.class) : '9';
    const rawSection = payload.section ? String(payload.section) : 'ALL';
    const classParam = normalizeClass(rawClass);
    const sectionParam = normalizeSection(classParam, rawSection);
    const dateParam = String(payload.date || new Date().toISOString().split('T')[0]);
    const academicYear = payload.academicYear || '2026-2027';
    const subjectParam = payload.subject || 'IT/ITeS';
    const componentParam = payload.component || 'THEORY';
    const periodParam = payload.period || '1';
    const records = Array.isArray(payload.attendance) ? payload.attendance : [];

    // Query full active roster count
    let rosterCount = 40;
    try {
      let countQuery = `SELECT COUNT(*) as roster_count FROM students WHERE class = ? AND status = 'Active'`;
      const countParams = [classParam];
      if (sectionParam && sectionParam !== 'ALL') {
        countQuery += ` AND section = ?`;
        countParams.push(sectionParam);
      }
      const countRes = await env.DB.prepare(countQuery).bind(...countParams).first();
      const raw = countRes?.roster_count ?? countRes?.['COUNT(*)'] ?? countRes?.['count'];
      if (typeof raw === 'number' && !isNaN(raw) && raw > 0) {
        rosterCount = raw;
      }
    } catch (e) {
      rosterCount = 40;
    }

    const presentCount = records.filter(r => String(r.status).toUpperCase() === 'PRESENT').length;
    const absentCount = records.filter(r => String(r.status).toUpperCase() === 'ABSENT').length;
    const totalStudents = Math.max(rosterCount, records.length, 1);

    const sessionId = `ATT_SES_${dateParam}_${classParam}_${sectionParam}`;
    await env.DB.prepare(
      `INSERT INTO attendance_sessions (
        session_id, school_id, academic_year, date, class, section, total_students, present_count, absent_count, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
      ON CONFLICT(session_id) DO UPDATE SET
        total_students = MAX(excluded.total_students, attendance_sessions.total_students),
        present_count = excluded.present_count,
        absent_count = excluded.absent_count,
        updated_at = datetime('now')`
    ).bind(
      sessionId, env.SCHOOL_ID || 'GAMERI-HSS-001', academicYear,
      dateParam, classParam, sectionParam, totalStudents, presentCount, absentCount
    ).run();

    // Insert/update individual attendance records
    for (const r of records) {
      const stuId = r.studentId || r.student_id;
      if (!stuId) continue;
      const stuStatus = String(r.status || 'PRESENT').toUpperCase();
      const attId = `ATT_${dateParam}_${stuId}_${periodParam}`;
      await env.DB.prepare(
        `INSERT INTO attendance (
          attendance_id, school_id, student_id, academic_year, session_id, date,
          class, section, subject, component, period, teacher_id, status, source, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PORTAL', datetime('now'))
        ON CONFLICT(attendance_id) DO UPDATE SET
          status = excluded.status,
          updated_at = datetime('now')`
      ).bind(
        attId, env.SCHOOL_ID || 'GAMERI-HSS-001', stuId, academicYear,
        sessionId, dateParam, classParam, sectionParam, subjectParam, componentParam, periodParam,
        session?.userId || null, stuStatus
      ).run();
    }

    return successResponse({
      sessionId: sessionId,
      totalStudents: totalStudents,
      presentCount: presentCount,
      absentCount: absentCount,
      recordsProcessed: records.length
    }, 'save_attendance', 200, corsHeaders);
  },

  async generateAttendanceReport(env, session, payload, corsHeaders) {
    let studentId = payload.studentId;
    if (!studentId && payload.class) {
      const s = await env.DB.prepare(`SELECT student_id FROM students WHERE class = ? AND status = 'Active' LIMIT 1`).bind(String(payload.class)).first();
      studentId = s?.student_id;
    }
    if (!studentId) {
      studentId = session.userId;
    }

    const canAccess = await Security.canAccessStudent(env.DB, session, studentId);
    if (!canAccess) {
      return errorResponse('UNAUTHORIZED', 'Access denied to attendance report', 403, 'generate_student_attendance_report', corsHeaders);
    }

    const student = await env.DB.prepare(`SELECT * FROM students WHERE student_id = ?`).bind(studentId).first();
    if (!student) {
      return errorResponse('NOT_FOUND', 'Student not found', 404, 'generate_student_attendance_report', corsHeaders);
    }

    const { results: attRecords } = await env.DB.prepare(`SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC`).bind(studentId).all();
    const records = attRecords || [];
    const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;

    // Denominator based on actual conducted attendance sessions for student's class and section
    const studentClass = normalizeClass(student.class);
    const studentSection = student.section ? normalizeSection(studentClass, student.section) : '';

    let sessionRes;
    if (studentSection && studentSection !== 'N/A' && studentSection !== 'ALL') {
      sessionRes = await env.DB.prepare(
        `SELECT COUNT(*) as session_count FROM attendance_sessions
         WHERE class = ? AND (section = ? OR section = 'ALL')`
      ).bind(studentClass, studentSection).first();
    } else {
      sessionRes = await env.DB.prepare(
        `SELECT COUNT(*) as session_count FROM attendance_sessions
         WHERE class = ?`
      ).bind(studentClass).first();
    }

    const conductedSessions = Number(sessionRes?.session_count || 0);

    let attendancePercentage = null;
    let absentCount = 0;
    if (conductedSessions > 0) {
      attendancePercentage = Math.min(100.0, parseFloat(((presentCount / conductedSessions) * 100).toFixed(1)));
      absentCount = Math.max(0, conductedSessions - presentCount);
    }

    return successResponse({
      studentId: studentId,
      studentName: student.student_name || 'Student',
      class: student.class,
      section: student.section,
      totalSessions: conductedSessions,
      presentCount: presentCount,
      absentCount: absentCount,
      attendancePercentage: attendancePercentage,
      reportGeneratedAt: new Date().toISOString()
    }, 'generate_student_attendance_report', 200, corsHeaders);
  }
};
