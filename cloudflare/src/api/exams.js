/**
 * VE MANAGEMENT — EXAMINATIONS, MARKS & RESULTS API HANDLERS
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 */

import { successResponse, errorResponse } from '../response.js';
import { Security } from '../security.js';

export const ExamsApi = {
  async getExaminations(env, session, payload, corsHeaders) {
    const classParam = payload.class ? String(payload.class) : null;
    let query = `SELECT * FROM examinations WHERE status != 'DRAFT'`;
    const params = [];
    if (classParam) {
      query += ` AND (class = ? OR class = 'ALL')`;
      params.push(classParam);
    }
    query += ` ORDER BY start_date DESC`;
    const { results } = await env.DB.prepare(query).bind(...params).all();
    return successResponse({ examinations: results || [] }, 'get_examinations', 200, corsHeaders);
  },

  async getMarks(env, session, payload, corsHeaders) {
    const classParam = payload.class ? String(payload.class) : null;
    const examParam = payload.exam ? String(payload.exam) : null;
    const studentIdParam = payload.studentId ? String(payload.studentId) : null;

    let query = `SELECT m.*, s.student_name, s.roll_no FROM marks m
                 JOIN students s ON m.student_id = s.student_id WHERE 1=1`;
    const params = [];

    if (classParam) {
      query += ` AND m.class = ?`;
      params.push(classParam);
    }
    if (examParam) {
      query += ` AND m.exam = ?`;
      params.push(examParam);
    }
    if (studentIdParam) {
      const canAccess = await Security.canAccessStudent(env.DB, session, studentIdParam);
      if (!canAccess) {
        return errorResponse('UNAUTHORIZED', 'Access denied to student marks', 403, 'get_marks', corsHeaders);
      }
      query += ` AND m.student_id = ?`;
      params.push(studentIdParam);
    }

    const { results } = await env.DB.prepare(query).bind(...params).all();
    return successResponse({ marks: results || [] }, 'get_marks', 200, corsHeaders);
  },

  async getExamResults(env, session, payload, corsHeaders) {
    const classParam = payload.class ? String(payload.class) : null;
    const studentIdParam = payload.studentId ? String(payload.studentId) : null;

    let query = `SELECT r.*, s.student_name, s.roll_no FROM exam_results r
                 JOIN students s ON r.student_id = s.student_id WHERE 1=1`;
    const params = [];

    if (classParam) {
      query += ` AND r.class = ?`;
      params.push(classParam);
    }
    if (studentIdParam) {
      const canAccess = await Security.canAccessStudent(env.DB, session, studentIdParam);
      if (!canAccess) {
        return errorResponse('UNAUTHORIZED', 'Access denied to exam results', 403, 'get_exam_results', corsHeaders);
      }
      query += ` AND r.student_id = ?`;
      params.push(studentIdParam);
    }

    const { results } = await env.DB.prepare(query).bind(...params).all();
    return successResponse({ results: results || [] }, 'get_exam_results', 200, corsHeaders);
  }
};
