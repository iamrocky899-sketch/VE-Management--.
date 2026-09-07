/**
 * VE MANAGEMENT — Server-Side Zero-Trust Authorization & Security Engine
 * School: Gameri Higher Secondary School, Gamiri
 * Enforces role boundaries across ADMIN, PRINCIPAL, TEACHER, STUDENT, and PARENT.
 */

const Security = {

  /**
   * Validates that the request matches the authorized School ID.
   */
  validateSchoolId: function(schoolId) {
    if (!schoolId) return false;
    return String(schoolId).trim() === DEFAULT_SCHOOL_ID;
  },

  /**
   * Enforces that the session has one of the required roles.
   */
  enforceRole: function(session, allowedRoles) {
    if (!session || !session.role) return false;
    if (!Array.isArray(allowedRoles)) allowedRoles = [allowedRoles];
    return allowedRoles.includes(session.role);
  },

  /**
   * Verifies that the account belonging to the session is currently Active in the database.
   * Real-time session revocation for deactivated accounts.
   */
  isAccountActive: function(session) {
    if (!session) return false;
    const role = session.role;
    const userId = session.userId;

    if (userId === 'ADMIN_API_KEY') return true;

    if (['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(role)) {
      const staff = Database.findByPk('Staff', userId);
      if (!staff) return false;
      return (staff.status || 'Active') === 'Active';
    }

    if (role === 'PARENT') {
      const parent = Database.findByPk('Parents', userId);
      if (!parent) return false;
      return (parent.status || 'Active') === 'Active';
    }

    if (role === 'STUDENT') {
      const student = Database.findByPk('Students', userId);
      if (!student) return false;
      return (student.status || 'Active') === 'Active';
    }

    return true;
  },

  /**
   * Retrieves all authorized student IDs for a given parentId from ParentStudentLinks.
   */
  getAuthorizedStudentIdsForParent: function(parentId, schoolId) {
    if (!parentId) return [];
    schoolId = schoolId || DEFAULT_SCHOOL_ID;

    const studentIdSet = new Set();

    // 1. Authoritative links in ParentStudentLinks
    const relations = Database.findBy('ParentStudentLinks', function(rel) {
      const isSchool = !rel.schoolId || rel.schoolId === schoolId;
      const isActive = rel.active === true || rel.active === 'true' || rel.active === 'Active' || rel.active === 1 ||
        (rel.status && (rel.status === 'Active' || rel.status === 'ACTIVE')) ||
        (rel.isVerified === true && (!rel.status || rel.status === 'Active'));
      const matchParent = String(rel.parentId || rel.parentUserId || '') === String(parentId);
      return matchParent && isSchool && isActive;
    });

    relations.forEach(function(r) {
      if (r.studentId) studentIdSet.add(String(r.studentId));
    });

    // 2. Direct mobile fallback (Students.mobile == Parents.mobile)
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
   * Retrieves student details for all authorized children of a parent.
   */
  getAuthorizedChildren: function(parentId, schoolId) {
    const studentIds = this.getAuthorizedStudentIdsForParent(parentId, schoolId);
    if (studentIds.length === 0) return [];

    const allStudents = Database.readAll('Students');
    return allStudents.filter(function(s) {
      const sid = s.studentId || s.id;
      return studentIds.includes(String(sid));
    });
  },

  /**
   * Centralized Teacher Academic Scope Resolution Engine.
   * Resolves authoritative classes, sections, subjects (with Theory/Practical components),
   * and Class Teacher responsibilities for a staff member in a given academic year.
   */
  getTeacherAcademicScope: function(staffId, schoolId, academicYear) {
    if (!staffId) {
      return {
        staffId: '',
        academicYear: academicYear || '2026-2027',
        classes: [],
        sectionsByClass: {},
        subjectsByClass: {},
        assignedSubjects: [],
        classTeacherRoles: [],
        isClassTeacher: () => false,
        canManageSubject: () => false
      };
    }

    schoolId = schoolId || DEFAULT_SCHOOL_ID;
    if (!academicYear) {
      const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
      academicYear = activeSetting ? String(activeSetting.value).trim() : '2026-2027';
    }

    // 1. Read authoritative assignments from StaffAssignments table
    const allAssignments = Database.readAll('StaffAssignments') || [];
    const activeStaffAssignments = allAssignments.filter(function(a) {
      const matchStaff = String(a.staffId) === String(staffId);
      const matchSchool = !a.schoolId || a.schoolId === schoolId;
      const matchYear = !a.academicYear || a.academicYear === academicYear;
      const isActive = !a.status || a.status === 'ACTIVE' || a.status === 'Active';
      return matchStaff && matchSchool && matchYear && isActive;
    });

    const classesSet = new Set();
    const sectionsByClass = {};
    const subjectsByClass = {};
    const allAssignedSubjectsSet = new Set();
    const classTeacherRoles = [];

    if (activeStaffAssignments.length > 0) {
      activeStaffAssignments.forEach(function(a) {
        const cls = String(a.class || '').trim();
        const sec = String(a.section || 'All').trim();
        const subj = String(a.subject || 'All').trim();
        const comp = String(a.component || 'BOTH').toUpperCase().trim();
        const type = String(a.assignmentType || 'SUBJECT_TEACHER').toUpperCase().trim();

        if (cls) {
          classesSet.add(cls);

          if (!sectionsByClass[cls]) sectionsByClass[cls] = new Set();
          if (sec && sec !== 'All') sectionsByClass[cls].add(sec);

          if (!subjectsByClass[cls]) subjectsByClass[cls] = [];
          subjectsByClass[cls].push({
            subject: subj,
            component: comp,
            assignmentType: type,
            section: sec
          });
        }

        if (subj && subj !== 'All') allAssignedSubjectsSet.add(subj);

        if (type === 'CLASS_TEACHER' && cls) {
          classTeacherRoles.push({
            class: cls,
            section: sec,
            academicYear: a.academicYear || academicYear
          });
        }
      });
    } else {
      // 2. Backward-compatible fallback to legacy Staff.assignedClasses & Staff.assignedSubjects
      const staff = Database.findByPk('Staff', staffId);
      if (staff) {
        if (staff.assignedClasses) {
          try {
            const parsed = JSON.parse(staff.assignedClasses);
            const arr = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
            arr.forEach(c => classesSet.add(c.trim()));
          } catch (e) {
            String(staff.assignedClasses).split(',').forEach(c => classesSet.add(c.trim()));
          }
        }
        if (staff.assignedSubjects) {
          try {
            const parsed = JSON.parse(staff.assignedSubjects);
            const arr = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
            arr.forEach(s => allAssignedSubjectsSet.add(s.trim()));
          } catch (e) {
            String(staff.assignedSubjects).split(',').forEach(s => allAssignedSubjectsSet.add(s.trim()));
          }
        }
      }
    }

    const classes = Array.from(classesSet);
    const assignedSubjects = Array.from(allAssignedSubjectsSet);
    const normalizedSections = {};
    for (const c in sectionsByClass) {
      normalizedSections[c] = Array.from(sectionsByClass[c]);
    }

    return {
      staffId: String(staffId),
      academicYear: academicYear,
      classes: classes,
      sectionsByClass: normalizedSections,
      subjectsByClass: subjectsByClass,
      assignedSubjects: assignedSubjects,
      classTeacherRoles: classTeacherRoles,
      isClassTeacher: function(targetClass, targetSection) {
        if (!targetClass) return classTeacherRoles.length > 0;
        return classTeacherRoles.some(function(r) {
          const matchCls = String(r.class) === String(targetClass);
          const matchSec = !targetSection || !r.section || r.section === 'All' || String(r.section) === String(targetSection);
          return matchCls && matchSec;
        });
      },
      canManageSubject: function(targetClass, targetSection, targetSubject, component) {
        if (!targetSubject) return true;
        const normSubject = String(targetSubject).toLowerCase().trim();

        // If specific assignments exist for this class
        if (targetClass && subjectsByClass[String(targetClass)]) {
          return subjectsByClass[String(targetClass)].some(function(asg) {
            if (asg.component === 'NONE') return false;
            const asgSubj = String(asg.subject || '').toLowerCase().trim();
            if (asgSubj === 'all' && asg.assignmentType === 'CLASS_TEACHER') return false;
            const matchSubj = asgSubj === 'all' || asgSubj === normSubject || normSubject.includes(asgSubj) || asgSubj.includes(normSubject);
            const matchSec = !targetSection || !asg.section || asg.section === 'All' || String(asg.section) === String(targetSection);
            const matchComp = !component || asg.component === 'BOTH' || String(asg.component).toUpperCase() === String(component).toUpperCase();
            return matchSubj && matchSec && matchComp;
          });
        }

        // Global fallback across assigned subjects
        if (assignedSubjects.length === 0) return true;
        return assignedSubjects.some(function(s) {
          const norm = String(s).toLowerCase().trim();
          return norm === normSubject || normSubject.includes(norm) || norm.includes(normSubject);
        });
      }
    };
  },

  /**
   * Retrieves the assigned classes for a teacher using centralized scope.
   */
  getTeacherAssignedClasses: function(staffId, schoolId, academicYear) {
    if (!staffId) return [];
    const scope = this.getTeacherAcademicScope(staffId, schoolId, academicYear);
    return scope.classes;
  },

  /**
   * Retrieves the assigned subjects for a teacher using centralized scope.
   */
  getTeacherAssignedSubjects: function(staffId, schoolId, academicYear) {
    if (!staffId) return [];
    const scope = this.getTeacherAcademicScope(staffId, schoolId, academicYear);
    return scope.assignedSubjects;
  },

  /**
   * Evaluates if a teacher is authorized to manage a specific academic subject/component.
   */
  canTeacherManageSubject: function(session, subject, classLevel, section, component) {
    if (!session || session.role !== 'TEACHER') return true;
    if (!subject) return true;
    const scope = this.getTeacherAcademicScope(session.userId, session.schoolId);
    if (scope.classes.length === 0 && scope.assignedSubjects.length === 0) return true; // Default allow all if totally unassigned
    return scope.canManageSubject(classLevel, section, subject, component);
  },

  /**
   * Evaluates if a session user is authorized to manage a specific class grade level (e.g. "9", "10").
   */
  canAccessClass: function(session, classLevel) {
    if (!session) return false;
    const role = session.role;
    if (role === 'ADMIN' || role === 'PRINCIPAL') return true;
    if (role === 'TEACHER') {
      if (!classLevel) return false;
      const assigned = this.getTeacherAssignedClasses(session.userId, session.schoolId);
      if (assigned.length === 0) return true; // Default allow if none specified
      return assigned.includes(String(classLevel));
    }
    return false;
  },

  /**
   * Evaluates if a session user is authorized to view or mutate a specific student.
   */
  canAccessStudent: function(session, studentId, studentClass, studentSection) {
    if (!session) return false;
    const role = session.role;
    const userId = session.userId;
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;

    if (role === 'ADMIN' || role === 'PRINCIPAL') {
      return true;
    }

    if (role === 'PARENT') {
      const authorizedIds = this.getAuthorizedStudentIdsForParent(userId, schoolId);
      return authorizedIds.includes(String(studentId));
    }

    if (role === 'STUDENT') {
      return String(userId) === String(studentId);
    }

    if (role === 'TEACHER') {
      const scope = this.getTeacherAcademicScope(userId, schoolId);
      if (scope.classes.length === 0) return true; // Default general access if unassigned

      // Lookup student record to verify student's actual class
      if (studentId) {
        const student = Database.findByPk('Students', studentId);
        if (student) {
          const actualClass = String(student.class || '');
          if (!scope.classes.includes(actualClass)) return false;
          if (studentClass && String(studentClass) !== actualClass) return false;
          const allowedSections = scope.sectionsByClass[actualClass];
          if (allowedSections && allowedSections.length > 0 && student.section && !allowedSections.includes(String(student.section))) {
            return false;
          }
          return true;
        }
      }

      if (studentClass && scope.classes.includes(String(studentClass))) {
        const allowedSections = scope.sectionsByClass[String(studentClass)];
        if (!allowedSections || allowedSections.length === 0 || !studentSection || allowedSections.includes(String(studentSection))) {
          return true;
        }
      }

      return false;
    }

    return false;
  },

  /**
   * Filters a student list according to the caller's authorized scope.
   */
  filterStudentsForSession: function(session, students) {
    if (!session || !students) return [];
    const role = session.role;
    const userId = session.userId;
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;

    if (role === 'ADMIN' || role === 'PRINCIPAL') {
      return students;
    }

    if (role === 'PARENT') {
      const authorizedIds = this.getAuthorizedStudentIdsForParent(userId, schoolId);
      return students.filter(s => authorizedIds.includes(String(s.studentId)));
    }

    if (role === 'STUDENT') {
      return students.filter(s => String(s.studentId) === String(userId));
    }

    if (role === 'TEACHER') {
      const scope = this.getTeacherAcademicScope(userId, schoolId);
      if (scope.classes.length === 0) return students;
      return students.filter(function(s) {
        if (!scope.classes.includes(String(s.class))) return false;
        const allowedSections = scope.sectionsByClass[String(s.class)];
        if (allowedSections && allowedSections.length > 0 && s.section && !allowedSections.includes(String(s.section))) {
          return false;
        }
        return true;
      });
    }

    return [];
  },

  /**
   * Filters attendance records according to caller's authorized scope.
   */
  filterAttendanceForSession: function(session, attendanceList) {
    if (!session || !attendanceList) return [];
    const role = session.role;
    const userId = session.userId;
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;

    if (role === 'ADMIN' || role === 'PRINCIPAL') {
      return attendanceList;
    }

    if (role === 'PARENT') {
      const authorizedIds = this.getAuthorizedStudentIdsForParent(userId, schoolId);
      return attendanceList.filter(a => authorizedIds.includes(String(a.studentId)));
    }

    if (role === 'STUDENT') {
      return attendanceList.filter(a => String(a.studentId) === String(userId));
    }

    if (role === 'TEACHER') {
      const scope = this.getTeacherAcademicScope(userId, schoolId);
      if (scope.classes.length === 0) return attendanceList;
      return attendanceList.filter(function(a) {
        if (a.class && !scope.classes.includes(String(a.class))) return false;
        if (a.class && a.section) {
          const allowedSecs = scope.sectionsByClass[String(a.class)];
          if (allowedSecs && allowedSecs.length > 0 && !allowedSecs.includes(String(a.section))) return false;
        }
        return true;
      });
    }

    return [];
  },

  /**
   * Filters marks records according to caller's authorized scope.
   * Parents and students only receive marks from PUBLISHED examinations.
   */
  filterMarksForSession: function(session, marksList) {
    if (!session || !marksList) return [];
    const role = session.role;
    const userId = session.userId;
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;

    if (role === 'ADMIN' || role === 'PRINCIPAL') {
      return marksList;
    }

    if (role === 'PARENT' || role === 'STUDENT') {
      const exams = Database.readAll('Examinations') || [];
      const unpublishedExamNames = new Set(
        exams
          .filter(e => e.status && e.status !== 'PUBLISHED')
          .map(e => String(e.examName || e.exam || '').toLowerCase().trim())
      );

      // Filter out unpublished examination marks
      const publishedMarks = marksList.filter(m => {
        const mExam = String(m.exam || m.examName || '').toLowerCase().trim();
        return !unpublishedExamNames.has(mExam);
      });

      if (role === 'PARENT') {
        const authorizedIds = this.getAuthorizedStudentIdsForParent(userId, schoolId);
        return publishedMarks.filter(m => authorizedIds.includes(String(m.studentId)));
      }

      if (role === 'STUDENT') {
        return publishedMarks.filter(m => String(m.studentId) === String(userId));
      }
    }

    if (role === 'TEACHER') {
      const scope = this.getTeacherAcademicScope(userId, schoolId);
      if (scope.classes.length === 0) return marksList;
      const students = this.filterStudentsForSession(session, Database.readAll('Students'));
      const studentIdSet = new Set(students.map(s => String(s.studentId)));
      return marksList.filter(function(m) {
        if (!studentIdSet.has(String(m.studentId))) return false;
        if (m.class && !scope.classes.includes(String(m.class))) return false;
        return true;
      });
    }

    return [];
  },

  /**
   * Validates whether a user can modify marks for a given examination and class.
   * Teachers cannot modify marks if the examination is LOCKED or PUBLISHED.
   */
  canModifyExamMarks: function(session, examName, className) {
    if (!session || !session.role) return { allowed: false, reason: 'UNAUTHORIZED' };
    if (session.role === 'ADMIN' || session.role === 'PRINCIPAL') {
      return { allowed: true };
    }

    if (session.role === 'TEACHER') {
      if (className && !this.canAccessClass(session, className)) {
        return { allowed: false, reason: 'UNAUTHORIZED_CLASS', message: `Teacher is not authorized for Class ${className}` };
      }

      if (examName) {
        const exams = Database.readAll('Examinations') || [];
        const normName = String(examName).toLowerCase().trim();
        const foundExam = exams.find(e => {
          const eName = String(e.examName || e.exam || '').toLowerCase().trim();
          const matchClass = !className || !e.class || String(e.class) === String(className);
          return (eName === normName || normName.includes(eName) || eName.includes(normName)) && matchClass;
        });

        if (foundExam && (foundExam.status === 'LOCKED' || foundExam.status === 'PUBLISHED')) {
          return {
            allowed: false,
            reason: 'EXAMINATION_LOCKED',
            message: `Examination "${foundExam.examName || examName}" is ${foundExam.status}. Only Admin or Principal can make corrections.`
          };
        }
      }

      return { allowed: true };
    }

    return { allowed: false, reason: 'UNAUTHORIZED' };
  },

  /**
   * Filters notes according to caller's role, class, and visibility.
   */
  filterNotesForSession: function(session, notesList) {
    if (!session || !notesList) return [];
    const role = session.role;

    if (role === 'ADMIN' || role === 'PRINCIPAL') {
      return notesList;
    }

    if (role === 'TEACHER') {
      const assignedClasses = this.getTeacherAssignedClasses(session.userId, session.schoolId);
      if (assignedClasses.length === 0) return notesList;
      return notesList.filter(n => !n.class || assignedClasses.includes(String(n.class)));
    }

    if (role === 'STUDENT') {
      const student = Database.findByPk('Students', session.userId);
      const studentClass = student ? String(student.class) : '';
      return notesList.filter(n => n.visibility !== 'STAFF_ONLY' && (!n.class || String(n.class) === studentClass));
    }

    if (role === 'PARENT') {
      const children = this.getAuthorizedChildren(session.userId, session.schoolId);
      const childClasses = new Set(children.map(c => String(c.class)));
      return notesList.filter(n => n.visibility !== 'STAFF_ONLY' && (!n.class || childClasses.has(String(n.class))));
    }

    return notesList.filter(n => (n.visibility || 'PUBLIC') === 'PUBLIC');
  },

  /**
   * Filters activities according to caller's role, class, and visibility.
   */
  filterActivitiesForSession: function(session, activitiesList) {
    if (!session || !activitiesList) return [];
    const role = session.role;

    if (role === 'ADMIN' || role === 'PRINCIPAL') {
      return activitiesList;
    }

    if (role === 'TEACHER') {
      const assignedClasses = this.getTeacherAssignedClasses(session.userId, session.schoolId);
      if (assignedClasses.length === 0) return activitiesList;
      return activitiesList.filter(a => !a.class || assignedClasses.includes(String(a.class)));
    }

    if (role === 'STUDENT') {
      const student = Database.findByPk('Students', session.userId);
      const studentClass = student ? String(student.class) : '';
      return activitiesList.filter(a => a.visibility !== 'STAFF_ONLY' && (!a.class || String(a.class) === studentClass));
    }

    if (role === 'PARENT') {
      const children = this.getAuthorizedChildren(session.userId, session.schoolId);
      const childClasses = new Set(children.map(c => String(c.class)));
      return activitiesList.filter(a => a.visibility !== 'STAFF_ONLY' && (!a.class || childClasses.has(String(a.class))));
    }

    return activitiesList.filter(a => (a.visibility || 'PUBLIC') === 'PUBLIC');
  },

  /**
   * Filters assignments according to caller's role, class, and status.
   */
  filterAssignmentsForSession: function(session, assignmentsList) {
    if (!session || !assignmentsList) return [];
    const role = session.role;

    if (role === 'ADMIN' || role === 'PRINCIPAL') {
      return assignmentsList;
    }

    if (role === 'TEACHER') {
      const assignedClasses = this.getTeacherAssignedClasses(session.userId, session.schoolId);
      if (assignedClasses.length === 0) return assignmentsList;
      return assignmentsList.filter(a => !a.class || assignedClasses.includes(String(a.class)));
    }

    if (role === 'STUDENT') {
      const student = Database.findByPk('Students', session.userId);
      const studentClass = student ? String(student.class) : '';
      return assignmentsList.filter(a => a.status !== 'DRAFT' && (!a.class || String(a.class) === studentClass));
    }

    if (role === 'PARENT') {
      const children = this.getAuthorizedChildren(session.userId, session.schoolId);
      const childClasses = new Set(children.map(c => String(c.class)));
      return assignmentsList.filter(a => a.status !== 'DRAFT' && (!a.class || childClasses.has(String(a.class))));
    }

    return assignmentsList.filter(a => a.status !== 'DRAFT');
  },

  /**
   * Filters notices according to caller's audience, class scope, and publication status.
   */
  filterNoticesForSession: function(session, noticesList) {
    if (!session || !noticesList) return [];
    const role = session.role;
    const nowIso = new Date().toISOString();

    if (role === 'ADMIN' || role === 'PRINCIPAL') {
      return noticesList;
    }

    if (role === 'TEACHER') {
      const scope = this.getTeacherAcademicScope(session.userId, session.schoolId);
      return noticesList.filter(n => {
        // Teachers see published notices or their own drafts
        if (n.status === 'ARCHIVED') return false;
        if (n.createdBy === session.userId) return true;
        if (n.status && n.status !== 'PUBLISHED') return false;
        if (n.publishAt && n.publishAt > nowIso) return false;

        const aud = String(n.audienceType || n.visibility || 'ALL').toUpperCase();
        if (['ALL', 'STAFF', 'TEACHERS', 'PUBLIC'].includes(aud)) return true;
        if (n.class && (n.class === 'All' || scope.classes.includes(String(n.class)))) return true;
        return false;
      });
    }

    if (role === 'PARENT') {
      const authorizedIds = this.getAuthorizedStudentIdsForParent(session.userId, session.schoolId);
      const allStudents = Database.readAll('Students');
      const children = allStudents.filter(s => authorizedIds.includes(String(s.studentId)));
      const childClasses = new Set(children.map(c => String(c.class)));
      const childSections = new Set(children.map(c => `${c.class}-${c.section || 'A'}`));

      return noticesList.filter(n => {
        if (n.status && n.status !== 'PUBLISHED') return false;
        if (n.publishAt && n.publishAt > nowIso) return false;

        // Specific Student Scope Check
        if (n.studentScope && !authorizedIds.includes(String(n.studentScope))) {
          return false;
        }

        const visOk = ['ALL', 'PARENTS', 'PUBLIC', 'CLASS', 'STUDENTS'].includes(String(n.visibility || n.audienceType || 'ALL').toUpperCase());
        const classOk = !n.class || n.class === 'All' || childClasses.has(String(n.class));
        const secOk = !n.section || n.section === 'All' || children.some(c => String(c.class) === String(n.class) && String(c.section || 'A').toUpperCase() === String(n.section).toUpperCase());

        return (visOk && classOk && secOk) || (n.studentScope && authorizedIds.includes(String(n.studentScope)));
      });
    }

    if (role === 'STUDENT') {
      const student = Database.findByPk('Students', session.userId);
      const studentClass = student ? String(student.class) : '';
      const studentSec = student ? String(student.section || 'A').toUpperCase() : '';

      return noticesList.filter(n => {
        if (n.status && n.status !== 'PUBLISHED') return false;
        if (n.publishAt && n.publishAt > nowIso) return false;

        // Specific Student Scope Check
        if (n.studentScope && String(n.studentScope) !== String(session.userId)) {
          return false;
        }

        const visOk = ['ALL', 'STUDENTS', 'PUBLIC', 'CLASS'].includes(String(n.visibility || n.audienceType || 'ALL').toUpperCase());
        const classOk = !n.class || n.class === 'All' || String(n.class) === studentClass;
        const secOk = !n.section || n.section === 'All' || String(n.section).toUpperCase() === studentSec;

        return (visOk && classOk && secOk) || (n.studentScope && String(n.studentScope) === String(session.userId));
      });
    }

    return noticesList.filter(n => (n.visibility || 'ALL') === 'ALL' && (!n.status || n.status === 'PUBLISHED'));
  },

  /**
   * Filters academic documents according to caller's authorized scope and publication lifecycle.
   * Parents and students can only view official ISSUED documents.
   */
  filterDocumentsForSession: function(session, documentsList) {
    if (!session || !documentsList) return [];
    const role = session.role;
    const userId = session.userId;
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;

    if (role === 'ADMIN' || role === 'PRINCIPAL') {
      return documentsList;
    }

    if (role === 'TEACHER') {
      const assignedClasses = this.getTeacherAssignedClasses(userId, schoolId);
      if (assignedClasses.length === 0) return [];
      return documentsList.filter(d => d.class && assignedClasses.includes(String(d.class)));
    }

    if (role === 'PARENT') {
      const authorizedIds = this.getAuthorizedStudentIdsForParent(userId, schoolId);
      return documentsList.filter(d =>
        authorizedIds.includes(String(d.studentId)) &&
        (d.status === 'ISSUED' || d.status === 'REVISED' || !d.status)
      );
    }

    if (role === 'STUDENT') {
      return documentsList.filter(d =>
        String(d.studentId) === String(userId) &&
        (d.status === 'ISSUED' || d.status === 'REVISED' || !d.status)
      );
    }

    return documentsList.filter(d => (d.visibility || 'PUBLIC') === 'PUBLIC' && d.status === 'ISSUED');
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Security };
}
