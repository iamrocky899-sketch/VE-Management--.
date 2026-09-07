/**
 * VE MANAGEMENT — Parent API Handlers (Read-Only Authorized Portal)
 * School: Gameri Higher Secondary School, Gamiri
 * Strictly enforces that parents can ONLY access their authorized children.
 */

const ParentApi = {

  /**
   * Parent Login endpoint.
   * Returns session token and list of authorized children.
   */
  login: function(payload) {
    const loginRes = Auth.loginParent(payload.mobile, payload.password);
    if (!loginRes.success) {
      Audit.log('PARENT_LOGIN_FAIL', 'PARENT', payload.mobile, { error: loginRes.error }, 'FAILED');
      return { success: false, error: { code: 'INVALID_CREDENTIALS', message: loginRes.error } };
    }

    const parentData = loginRes.data;
    const children = Authorization.getAuthorizedChildren(parentData.parentId);

    Audit.log('PARENT_LOGIN_SUCCESS', 'PARENT', parentData.parentId, { childrenCount: children.length }, 'SUCCESS');

    return {
      success: true,
      data: {
        parent: {
          parentId: parentData.parentId,
          parentName: parentData.parentName,
          mobile: parentData.mobile
        },
        token: parentData.token,
        expiresAt: parentData.expiresAt,
        children: children.map(function(c) {
          return {
            studentId: c.studentId,
            studentName: c.studentName,
            rollNo: c.rollNo,
            class: c.class,
            section: c.section,
            status: c.status
          };
        })
      }
    };
  },

  /**
   * Aggregated Parent Dashboard.
   * Efficient single round-trip returning child portfolio summary, attendance, marks, activities, and notices.
   */
  getDashboard: function(session) {
    const children = Authorization.getAuthorizedChildren(session.parentId);
    if (children.length === 0) {
      return {
        success: true,
        data: {
          parent: { parentId: session.parentId, mobile: session.mobile },
          children: [],
          schoolContacts: Database.readAll('SchoolContacts')[0] || null,
          notices: []
        }
      };
    }

    const allAttendance = Database.readAll('Attendance');
    const allMarks = Database.readAll('Marks');
    const allActivities = Database.readAll('Activities');
    const allNotices = Database.readAll('Notices');
    const allTeachers = Database.readAll('TeacherContacts');
    const schoolContact = Database.readAll('SchoolContacts')[0] || {
      schoolName: 'Gameri Higher Secondary School, Gamiri',
      principalName: 'Sanjiv Gogoi',
      address: 'Gamiri, Biswanath, Assam'
    };

    const childrenData = children.map(function(child) {
      const sid = String(child.studentId);
      const childClass = String(child.class);
      const childSection = String(child.section || 'A');

      // Attendance Summary
      const childAtt = allAttendance.filter(function(a) { return String(a.studentId) === sid; });
      const presentCount = childAtt.filter(function(a) { return a.status === 'PRESENT'; }).length;
      const absentCount = childAtt.filter(function(a) { return a.status === 'ABSENT'; }).length;
      const totalRecorded = childAtt.length;
      const pct = totalRecorded > 0 ? ((presentCount / totalRecorded) * 100).toFixed(1) : '100.0';

      // Marks Breakdown
      const childMarks = allMarks.filter(function(m) { return String(m.studentId) === sid; });

      // Class-specific Activities
      const activities = allActivities.filter(function(act) {
        const matchClass = act.class === 'All' || String(act.class) === childClass;
        const matchSec = act.section === 'All' || String(act.section) === childSection;
        const isPublic = (act.visibility || 'PUBLIC') === 'PUBLIC';
        return matchClass && matchSec && isPublic;
      }).sort(function(a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 5);

      // Class Teacher
      const teacher = allTeachers.find(function(t) {
        return String(t.class) === childClass && (t.section === 'All' || String(t.section) === childSection);
      }) || null;

      return {
        student: {
          studentId: child.studentId,
          studentName: child.studentName,
          rollNo: child.rollNo,
          class: child.class,
          section: child.section,
          gender: child.gender,
          dob: child.dob,
          fatherName: child.fatherName,
          motherName: child.motherName,
          village: child.village,
          status: child.status
        },
        attendanceSummary: {
          presentDays: presentCount,
          absentDays: absentCount,
          totalRecordedDays: totalRecorded,
          attendancePercentage: pct,
          recentRecords: childAtt.slice(-10)
        },
        marks: childMarks,
        recentActivities: activities,
        classTeacher: teacher ? {
          teacherName: teacher.teacherName,
          class: teacher.class,
          section: teacher.section,
          mobile: teacher.mobile,
          whatsapp: teacher.whatsapp,
          email: teacher.email
        } : null
      };
    });

    // Global and relevant Notices
    const relevantNotices = allNotices.filter(function(n) {
      return (n.visibility || 'PUBLIC') === 'PUBLIC';
    }).sort(function(a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 10);

    return {
      success: true,
      data: {
        parent: { parentId: session.parentId, mobile: session.mobile },
        children: childrenData,
        schoolContacts: schoolContact,
        notices: relevantNotices
      }
    };
  },

  /**
   * Detailed Attendance for an authorized student.
   * REJECTS unauthorized student IDs with 403.
   */
  getAttendance: function(session, payload) {
    const studentId = payload.studentId;
    if (!studentId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId is required' } };
    }

    if (!Authorization.isAuthorized(session.parentId, studentId)) {
      Audit.log('UNAUTHORIZED_ACCESS_ATTEMPT', 'PARENT', session.parentId, { targetStudentId: studentId, endpoint: 'parent_attendance' }, 'DENIED');
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied: You are not authorized to view this student\'s attendance.' } };
    }

    const allAtt = Database.readAll('Attendance');
    const studentAtt = allAtt.filter(function(a) { return String(a.studentId) === String(studentId); });

    const monthFilter = payload.month; // e.g. "2026-08"
    const filtered = monthFilter ? studentAtt.filter(function(a) { return String(a.date).startsWith(monthFilter); }) : studentAtt;

    return {
      success: true,
      data: {
        studentId: studentId,
        records: filtered,
        total: filtered.length
      }
    };
  },

  /**
   * Detailed Marks for an authorized student.
   * REJECTS unauthorized student IDs with 403.
   */
  getMarks: function(session, payload) {
    const studentId = payload.studentId;
    if (!studentId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId is required' } };
    }

    if (!Authorization.isAuthorized(session.parentId, studentId)) {
      Audit.log('UNAUTHORIZED_ACCESS_ATTEMPT', 'PARENT', session.parentId, { targetStudentId: studentId, endpoint: 'parent_marks' }, 'DENIED');
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied: You are not authorized to view this student\'s marks.' } };
    }

    const allMarks = Database.readAll('Marks');
    const studentMarks = allMarks.filter(function(m) { return String(m.studentId) === String(studentId); });

    return {
      success: true,
      data: {
        studentId: studentId,
        marks: studentMarks
      }
    };
  },

  /**
   * Change Parent Password.
   */
  changePassword: function(session, payload) {
    const oldPassword = payload.oldPassword;
    const newPassword = payload.newPassword;

    if (!oldPassword || !newPassword) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Old and new passwords are required' } };
    }

    if (newPassword.length < 6) {
      return { success: false, error: { code: 'WEAK_PASSWORD', message: 'New password must be at least 6 characters long' } };
    }

    const parent = Database.findByPk('Parents', session.parentId);
    if (!parent) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Parent record not found' } };
    }

    const oldHash = Auth.hashPassword(oldPassword, parent.salt);
    if (oldHash !== parent.passwordHash) {
      return { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' } };
    }

    const newSalt = Auth.generateSalt(16);
    const newHash = Auth.hashPassword(newPassword, newSalt);

    parent.passwordHash = newHash;
    parent.salt = newSalt;
    parent.updatedAt = new Date().toISOString();

    Database.upsertBatch('Parents', [parent]);
    Audit.log('PASSWORD_CHANGE', 'PARENT', session.parentId, 'Password successfully changed', 'SUCCESS');

    return { success: true, message: 'Password changed successfully' };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ParentApi };
}
