/**
 * VE MANAGEMENT — Server-Side Parent-Child Authorization Engine
 * School: Gameri Higher Secondary School, Gamiri
 * Strictly enforces that parents can ONLY access their own registered children.
 */

const Authorization = {

  /**
   * Retrieves all authorized student IDs for a given parentId.
   */
  getAuthorizedStudentIds: function(parentId) {
    if (!parentId) return [];
    const studentIdSet = new Set();

    // 1. Authoritative links in ParentStudentLinks
    const relations = Database.findBy('ParentStudentLinks', function(rel) {
      const isActive = rel.active === true || rel.active === 'true' || rel.active === 'Active' || rel.active === 1;
      return String(rel.parentId) === String(parentId) && isActive;
    });

    relations.forEach(function(r) {
      if (r.studentId) studentIdSet.add(String(r.studentId));
    });

    // 2. Direct mobile fallback where Student.mobile == Parent.mobile
    let pMob = '';
    if (String(parentId).startsWith('PAR_')) {
      pMob = String(parentId).replace(/^PAR_/, '').replace(/\D/g, '').slice(-10);
    }
    if (!pMob || pMob.length !== 10) {
      const parent = Database.findByPk('Parents', parentId);
      if (parent && parent.mobile) {
        pMob = String(parent.mobile).replace(/\D/g, '').slice(-10);
      }
    }

    if (pMob && pMob.length === 10) {
      const matchingStudents = Database.findBy('Students', function(s) {
        const sMob = String(s.mobile || '').replace(/\D/g, '').slice(-10);
        return sMob === pMob;
      });
      matchingStudents.forEach(function(s) {
        const sid = s.studentId || s.id;
        if (sid) studentIdSet.add(String(sid));
      });
    }

    return Array.from(studentIdSet);
  },

  /**
   * Verifies whether a parent is authorized to access a specific studentId.
   * Returns true if authorized, false otherwise.
   */
  isAuthorized: function(parentId, studentId) {
    if (!parentId || !studentId) return false;
    const authorizedIds = this.getAuthorizedStudentIds(parentId);
    return authorizedIds.includes(String(studentId));
  },

  /**
   * Retrieves student details for all authorized children of a parent.
   */
  getAuthorizedChildren: function(parentId) {
    const studentIds = this.getAuthorizedStudentIds(parentId);
    if (studentIds.length === 0) return [];

    const allStudents = Database.readAll('Students');
    return allStudents.filter(function(s) {
      const sid = s.studentId || s.id;
      return studentIds.includes(String(sid));
    });
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Authorization };
}
