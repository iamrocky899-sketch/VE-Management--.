/**
 * VE MANAGEMENT — ASSIGNMENTS API HANDLERS
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Implements complete Assignments CRUD:
 * 1. getAssignments: Scoped reading with dual camelCase & snake_case property enrichment.
 * 2. saveAssignments: Multi-record & single-record upsert with teacher class/subject validation.
 * 3. deleteAssignment: Server-side RBAC, strict school isolation, IDOR protection, and audit logging.
 */

import { successResponse, errorResponse } from '../response.js';
import { Security } from '../security.js';

export const AssignmentsApi = {
  /**
   * Retrieves assignments with academic filtering and dual property compatibility.
   */
  async getAssignments(env, session, payload, corsHeaders) {
    const schoolId = session?.schoolId || env.SCHOOL_ID || 'GAMERI-HSS-001';
    const classParam = payload.class ? String(payload.class) : null;
    const subjectParam = payload.subject ? String(payload.subject) : null;
    const statusParam = payload.status ? String(payload.status).toUpperCase() : null;

    let query = `SELECT * FROM assignments WHERE school_id = ?`;
    const params = [schoolId];

    // Role-based restrictions
    if (session?.role === 'STUDENT' || session?.role === 'PARENT') {
      query += ` AND status = 'ACTIVE'`;
    } else if (statusParam && statusParam !== 'ALL') {
      query += ` AND status = ?`;
      params.push(statusParam);
    }

    if (classParam) {
      query += ` AND class = ?`;
      params.push(classParam);
    }

    if (subjectParam) {
      query += ` AND (subject = ? OR subject = 'ALL')`;
      params.push(subjectParam);
    }

    query += ` ORDER BY due_date ASC, created_at DESC`;

    const { results } = await env.DB.prepare(query).bind(...params).all();

    // Enrich rows with dual camelCase & snake_case properties
    const enriched = (results || []).map(row => ({
      ...row,
      assignmentId: row.assignment_id,
      assignment_id: row.assignment_id,
      schoolId: row.school_id,
      school_id: row.school_id,
      title: row.title,
      description: row.description || '',
      class: String(row.class),
      section: row.section || 'A',
      subject: row.subject,
      assignedDate: row.assigned_date,
      assigned_date: row.assigned_date,
      dueDate: row.due_date,
      due_date: row.due_date,
      maxMarks: row.max_marks !== null && row.max_marks !== undefined ? row.max_marks : 50,
      max_marks: row.max_marks !== null && row.max_marks !== undefined ? row.max_marks : 50,
      status: row.status || 'ACTIVE',
      createdAt: row.created_at,
      created_at: row.created_at,
      updatedAt: row.updated_at,
      updated_at: row.updated_at
    }));

    return successResponse({
      assignments: enriched,
      total: enriched.length
    }, 'get_assignments', 200, corsHeaders);
  },

  /**
   * Creates or updates assignments.
   */
  async saveAssignments(env, session, payload, corsHeaders) {
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return errorResponse('UNAUTHORIZED', 'Write permission denied for Assignments', 403, 'save_assignments', corsHeaders);
    }

    const schoolId = session.schoolId || env.SCHOOL_ID || 'GAMERI-HSS-001';
    const items = Array.isArray(payload.assignments)
      ? payload.assignments
      : Array.isArray(payload)
        ? payload
        : [payload];

    if (items.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'No assignments provided to save', 400, 'save_assignments', corsHeaders);
    }

    // Validation & teacher scoping checks
    for (const item of items) {
      const title = String(item.title || '').trim();
      const targetClass = String(item.class || '').trim();
      const targetSubject = String(item.subject || 'IT/ITeS').trim();

      if (!title) {
        return errorResponse('VALIDATION_ERROR', 'Assignment title is required', 400, 'save_assignments', corsHeaders);
      }
      if (!targetClass) {
        return errorResponse('VALIDATION_ERROR', 'Assignment class is required', 400, 'save_assignments', corsHeaders);
      }

      if (session.role === 'TEACHER') {
        const staffId = session.userId;
        const canAccessCls = await Security.canTeacherAccessClass(env.DB, staffId, targetClass);
        if (!canAccessCls) {
          return errorResponse('UNAUTHORIZED', `Teacher cannot create or edit assignments for unassigned class: ${targetClass}`, 403, 'save_assignments', corsHeaders);
        }

        const canAccessSubj = await Security.canTeacherAccessSubject(env.DB, staffId, targetClass, targetSubject);
        if (!canAccessSubj) {
          return errorResponse('UNAUTHORIZED', `Teacher cannot create or edit assignments for unassigned subject: ${targetSubject}`, 403, 'save_assignments', corsHeaders);
        }
      }
    }

    const savedRecords = [];
    let hasActualChanges = false;

    for (const item of items) {
      const assignmentId = String(item.assignmentId || item.assignment_id || item.id || `ASG_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
      const title = String(item.title).trim();
      const description = String(item.description || '').trim();
      const targetClass = String(item.class).trim();
      const section = String(item.section || 'A').trim();
      const subject = String(item.subject || 'IT/ITeS').trim();
      const assignedDate = String(item.assignedDate || item.assigned_date || new Date().toISOString().split('T')[0]).trim();
      const dueDate = String(item.dueDate || item.due_date || assignedDate).trim();
      const maxMarks = parseFloat(item.maxMarks || item.max_marks || 50) || 50;
      let status = String(item.status || 'ACTIVE').toUpperCase();
      if (!['ACTIVE', 'COMPLETED', 'ARCHIVED'].includes(status)) {
        status = 'ACTIVE';
      }

      const runResult = await env.DB.prepare(
        `INSERT INTO assignments (
           assignment_id, school_id, title, description, class, section, subject,
           assigned_date, due_date, max_marks, status, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(assignment_id) DO UPDATE SET
           title = excluded.title,
           description = excluded.description,
           class = excluded.class,
           section = excluded.section,
           subject = excluded.subject,
           assigned_date = excluded.assigned_date,
           due_date = excluded.due_date,
           max_marks = excluded.max_marks,
           status = excluded.status,
           updated_at = datetime('now')
         WHERE assignments.title IS NOT excluded.title
            OR assignments.description IS NOT excluded.description
            OR assignments.class IS NOT excluded.class
            OR assignments.section IS NOT excluded.section
            OR assignments.subject IS NOT excluded.subject
            OR assignments.assigned_date IS NOT excluded.assigned_date
            OR assignments.due_date IS NOT excluded.due_date
            OR assignments.max_marks IS NOT excluded.max_marks
            OR assignments.status IS NOT excluded.status`
      ).bind(
        assignmentId, schoolId, title, description, targetClass, section, subject,
        assignedDate, dueDate, maxMarks, status
      ).run();

      if (runResult?.meta?.changes > 0) {
        hasActualChanges = true;
      }

      savedRecords.push({
        assignmentId,
        assignment_id: assignmentId,
        schoolId,
        school_id: schoolId,
        title,
        description,
        class: targetClass,
        section,
        subject,
        assignedDate,
        assigned_date: assignedDate,
        dueDate,
        due_date: dueDate,
        maxMarks,
        max_marks: maxMarks,
        status
      });
    }

    // Only write audit log if records were actually inserted or modified
    if (hasActualChanges) {
      try {
        const logId = `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await env.DB.prepare(
          `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
           VALUES (?, ?, datetime('now'), 'SAVE_ASSIGNMENTS', ?, ?, ?, 'SUCCESS')`
        ).bind(
          logId,
          schoolId,
          session.role,
          session.userId,
          JSON.stringify({ count: savedRecords.length, assignmentIds: savedRecords.map(r => r.assignmentId) })
        ).run();
      } catch (auditErr) {
        console.error('[Audit] Failed to log assignment save:', auditErr);
      }
    }

    return successResponse({
      records: savedRecords,
      total: savedRecords.length,
      changed: hasActualChanges
    }, 'save_assignments', 200, corsHeaders);
  },

  /**
   * Deletes an assignment with strict server-side authorization and school isolation.
   */
  async deleteAssignment(env, session, payload, corsHeaders) {
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return errorResponse('UNAUTHORIZED', 'Delete permission denied for Assignments', 403, 'delete_assignment', corsHeaders);
    }

    const assignmentId = String(payload.assignmentId || payload.id || payload.assignment_id || '').trim();
    if (!assignmentId) {
      return errorResponse('VALIDATION_ERROR', 'assignmentId is required', 400, 'delete_assignment', corsHeaders);
    }

    const schoolId = session.schoolId || env.SCHOOL_ID || 'GAMERI-HSS-001';

    // 1. Locate the assignment strictly scoped by school_id
    const assignment = await env.DB.prepare(
      `SELECT * FROM assignments WHERE assignment_id = ? AND school_id = ?`
    ).bind(assignmentId, schoolId).first();

    if (!assignment) {
      return errorResponse('NOT_FOUND', 'Assignment not found', 404, 'delete_assignment', corsHeaders);
    }

    // 2. Enforce Teacher permissions & academic scoping
    if (session.role === 'TEACHER') {
      const staffId = session.userId;
      const canAccessCls = await Security.canTeacherAccessClass(env.DB, staffId, assignment.class);
      if (!canAccessCls) {
        return errorResponse('UNAUTHORIZED', `Delete permission denied for unassigned class: ${assignment.class}`, 403, 'delete_assignment', corsHeaders);
      }

      const canAccessSubj = await Security.canTeacherAccessSubject(env.DB, staffId, assignment.class, assignment.subject);
      if (!canAccessSubj) {
        return errorResponse('UNAUTHORIZED', `Delete permission denied for unassigned subject: ${assignment.subject}`, 403, 'delete_assignment', corsHeaders);
      }
    }

    // 3. Perform hard delete on the exact assignment row
    await env.DB.prepare(
      `DELETE FROM assignments WHERE assignment_id = ? AND school_id = ?`
    ).bind(assignmentId, schoolId).run();

    // 4. Record audit log
    try {
      const logId = `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await env.DB.prepare(
        `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
         VALUES (?, ?, datetime('now'), 'DELETE_ASSIGNMENT', ?, ?, ?, 'SUCCESS')`
      ).bind(
        logId,
        schoolId,
        session.role,
        session.userId,
        JSON.stringify({
          assignmentId: assignment.assignment_id,
          title: assignment.title,
          class: assignment.class,
          subject: assignment.subject
        })
      ).run();
    } catch (auditErr) {
      console.error('[Audit] Failed to log assignment deletion:', auditErr);
    }

    return successResponse({
      assignmentId,
      deleted: true,
      message: 'Assignment deleted successfully'
    }, 'delete_assignment', 200, corsHeaders);
  }
};
