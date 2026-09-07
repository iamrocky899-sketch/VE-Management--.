/**
 * VE MANAGEMENT — OFFICIAL DOCUMENTS API HANDLERS
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 */

import { successResponse, errorResponse } from '../response.js';
import { Security } from '../security.js';

export const DocumentsApi = {
  async getDocuments(env, session, payload, corsHeaders) {
    const studentIdParam = payload.studentId ? String(payload.studentId) : (session.role === 'STUDENT' ? session.userId : null);

    let query = `SELECT d.*, s.student_name, s.roll_no FROM documents d
                 JOIN students s ON d.student_id = s.student_id WHERE 1=1`;
    const params = [];

    if (studentIdParam) {
      const canAccess = await Security.canAccessStudent(env.DB, session, studentIdParam);
      if (!canAccess) {
        return errorResponse('UNAUTHORIZED', 'Access denied to student documents', 403, 'get_documents', corsHeaders);
      }
      query += ` AND d.student_id = ?`;
      params.push(studentIdParam);
    }

    query += ` ORDER BY d.issue_date DESC`;
    const { results } = await env.DB.prepare(query).bind(...params).all();
    return successResponse({ documents: results || [] }, 'get_documents', 200, corsHeaders);
  },

  async verifyDocument(env, payload, corsHeaders) {
    const verificationId = payload.verificationId;
    if (!verificationId) {
      return errorResponse('BAD_REQUEST', 'Missing verificationId parameter', 400, 'verify_document', corsHeaders);
    }

    const doc = await env.DB.prepare(
      `SELECT d.document_id, d.document_number, d.document_type, d.title, d.status, d.issue_date, d.issued_by, d.verification_id, s.student_name, s.class, s.admission_no
       FROM documents d JOIN students s ON d.student_id = s.student_id
       WHERE d.verification_id = ? AND d.status = 'ISSUED'`
    ).bind(verificationId).first();

    if (!doc) {
      return errorResponse('NOT_FOUND', 'Official document not found or unverified', 404, 'verify_document', corsHeaders);
    }

    return successResponse({ document: doc, verified: true }, 'verify_document', 200, corsHeaders);
  }
};
