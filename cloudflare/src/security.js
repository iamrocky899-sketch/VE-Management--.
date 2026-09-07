/**
 * VE MANAGEMENT — Cloudflare Workers RBAC & Scoping Engine
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Enforces server-side multi-role authorization (ADMIN, PRINCIPAL, TEACHER, STUDENT, PARENT)
 * and verifies academic scoping invariants on Cloudflare D1.
 */

export const Security = {
  /**
   * Checks whether a role can access administrative resources.
   */
  isAdminOrPrincipal: function(session) {
    if (!session || !session.role) return false;
    const r = session.role.toUpperCase();
    return r === 'ADMIN' || r === 'PRINCIPAL';
  },

  /**
   * Verifies teacher class authorization.
   */
  canTeacherAccessClass: async function(db, teacherStaffId, targetClass, academicYear) {
    if (!teacherStaffId || !targetClass) return false;
    const year = academicYear || '2026-2027';
    const stmt = db.prepare(
      `SELECT assignment_id FROM staff_assignments 
       WHERE staff_id = ? AND class = ? AND academic_year = ? AND status = 'ACTIVE'`
    );
    const { results } = await stmt.bind(teacherStaffId, String(targetClass), year).all();
    if (results && results.length > 0) return true;

    // Fallback to staff record assigned_classes
    const staffMember = await db.prepare(`SELECT assigned_classes FROM staff WHERE staff_id = ?`).bind(teacherStaffId).first();
    if (staffMember && staffMember.assigned_classes) {
      try {
        const parsed = JSON.parse(staffMember.assigned_classes);
        if (Array.isArray(parsed) && parsed.map(String).includes(String(targetClass))) return true;
      } catch (e) {
        if (String(staffMember.assigned_classes).split(',').map(c => c.trim()).includes(String(targetClass))) return true;
      }
    }
    return false;
  },

  /**
   * Verifies teacher subject authorization.
   */
  canTeacherAccessSubject: async function(db, teacherStaffId, targetClass, subjectName, academicYear) {
    if (!teacherStaffId || !subjectName) return false;
    const year = academicYear || '2026-2027';
    const stmt = db.prepare(
      `SELECT assignment_id FROM staff_assignments 
       WHERE staff_id = ? AND (class = ? OR class = 'ALL') AND (LOWER(subject) = LOWER(?) OR subject = 'ALL') AND academic_year = ? AND status = 'ACTIVE'`
    );
    const { results } = await stmt.bind(teacherStaffId, String(targetClass || 'ALL'), String(subjectName), year).all();
    if (results && results.length > 0) return true;

    // Fallback to staff record assigned_subjects
    const staffMember = await db.prepare(`SELECT assigned_subjects FROM staff WHERE staff_id = ?`).bind(teacherStaffId).first();
    if (staffMember && staffMember.assigned_subjects) {
      try {
        const parsed = JSON.parse(staffMember.assigned_subjects);
        if (Array.isArray(parsed) && (parsed.map(s => s.toLowerCase()).includes(subjectName.toLowerCase()) || parsed.includes('ALL'))) return true;
      } catch (e) {
        if (String(staffMember.assigned_subjects).toLowerCase().includes(subjectName.toLowerCase())) return true;
      }
    }
    return false;
  },

  /**
   * Resolves authorized student IDs for a parent session.
   */
  getAuthorizedStudentIdsForParent: async function(db, parentId) {
    if (!parentId) return [];
    const stmt = db.prepare(
      `SELECT student_id FROM parent_student_links WHERE parent_id = ? AND active = 1`
    );
    const { results } = await stmt.bind(parentId).all();
    return (results || []).map(r => r.student_id);
  },

  /**
   * Checks student record read authorization across all 5 roles.
   */
  canAccessStudent: async function(db, session, studentId) {
    if (!session || !session.role) return false;
    const role = session.role.toUpperCase();

    if (role === 'ADMIN' || role === 'PRINCIPAL') {
      return true;
    }

    if (role === 'STUDENT') {
      return String(session.userId || session.studentId) === String(studentId);
    }

    if (role === 'PARENT') {
      const authorizedIds = await this.getAuthorizedStudentIdsForParent(db, session.userId || session.parentId);
      return authorizedIds.includes(String(studentId));
    }

    if (role === 'TEACHER') {
      // Teachers can access students enrolled in their assigned classes
      const stmt = db.prepare(
        `SELECT e.enrollment_id FROM enrollments e
         JOIN staff_assignments sa ON sa.class = e.class AND sa.academic_year = e.academic_year
         WHERE e.student_id = ? AND sa.staff_id = ? AND sa.status = 'ACTIVE' AND e.status = 'ACTIVE'`
      );
      const { results } = await stmt.bind(studentId, session.userId || session.staffId).all();
      if (results && results.length > 0) return true;

      // Fallback: check if student class is in staff.assigned_classes
      const staffMember = await db.prepare(`SELECT assigned_classes FROM staff WHERE staff_id = ?`).bind(session.userId || session.staffId).first();
      if (staffMember && staffMember.assigned_classes) {
        const student = await db.prepare(`SELECT class FROM students WHERE student_id = ?`).bind(studentId).first();
        if (student) {
          try {
            const parsed = JSON.parse(staffMember.assigned_classes);
            if (Array.isArray(parsed) && parsed.map(String).includes(String(student.class))) return true;
          } catch (e) {
            if (String(staffMember.assigned_classes).split(',').map(c => c.trim()).includes(String(student.class))) return true;
          }
        }
      }
      return false;
    }

    return false;
  },

  /**
   * Authoritative teacher academic scope resolution engine.
   */
  getTeacherAcademicScope: async function(db, staffId, academicYear) {
    const year = academicYear || '2026-2027';
    if (!staffId) {
      return { staffId: '', academicYear: year, classes: [], subjects: [], isClassTeacher: false };
    }

    const stmt = db.prepare(
      `SELECT class, section, subject, component, is_class_teacher FROM staff_assignments 
       WHERE staff_id = ? AND academic_year = ? AND status = 'ACTIVE'`
    );
    const { results } = await stmt.bind(staffId, year).all();

    const classesSet = new Set();
    const subjectsSet = new Set();
    let isClassTeacher = false;

    (results || []).forEach(r => {
      if (r.class) classesSet.add(String(r.class));
      if (r.subject) subjectsSet.add(String(r.subject));
      if (r.is_class_teacher === 1 || r.is_class_teacher === true) isClassTeacher = true;
    });

    // Fallback: if staff_assignments empty, read from staff master profile
    if (classesSet.size === 0) {
      const staffMember = await db.prepare(`SELECT assigned_classes, assigned_subjects FROM staff WHERE staff_id = ?`).bind(staffId).first();
      if (staffMember) {
        try {
          const parsedClasses = JSON.parse(staffMember.assigned_classes || '[]');
          if (Array.isArray(parsedClasses)) parsedClasses.forEach(c => classesSet.add(String(c)));
        } catch (e) {
          String(staffMember.assigned_classes || '').split(',').map(c => c.trim()).filter(Boolean).forEach(c => classesSet.add(c));
        }
        try {
          const parsedSubjs = JSON.parse(staffMember.assigned_subjects || '[]');
          if (Array.isArray(parsedSubjs)) parsedSubjs.forEach(s => subjectsSet.add(String(s)));
        } catch (e) {
          String(staffMember.assigned_subjects || '').split(',').map(s => s.trim()).filter(Boolean).forEach(s => subjectsSet.add(s));
        }
      }
    }

    return {
      staffId: staffId,
      academicYear: year,
      classes: Array.from(classesSet),
      subjects: Array.from(subjectsSet),
      isClassTeacher: isClassTeacher
    };
  }
};
