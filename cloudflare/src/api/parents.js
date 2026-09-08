/**
 * VE MANAGEMENT — PARENTS API HANDLERS
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 */

import { successResponse, errorResponse } from '../response.js';
import { Security } from '../security.js';
import { formatStudentRecord } from './students.js';

export const ParentsApi = {
  async getParentChildren(env, session, payload, corsHeaders) {
    // H5: Always use session userId for parent role to prevent unauthorized access
    let parentId;
    if (Security.isAdminOrPrincipal(session)) {
      parentId = payload.parentId || session.userId;
    } else {
      parentId = session.userId;
    }
    const stmt = env.DB.prepare(
      `SELECT s.*, psl.relationship FROM students s
       JOIN parent_student_links psl ON s.student_id = psl.student_id
       WHERE psl.parent_id = ? AND psl.active = 1 AND s.status IN ('Active', 'Graduated', 'Completed')`
    );
    const { results } = await stmt.bind(parentId).all();
    const formattedChildren = (results || []).map(s => {
      const formatted = formatStudentRecord(s);
      return {
        ...formatted,
        relationship: s.relationship || 'Parent'
      };
    });
    return successResponse({ children: formattedChildren }, 'get_parent_children', 200, corsHeaders);
  }
};

