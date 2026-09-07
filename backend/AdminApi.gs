/**
 * VE MANAGEMENT — Admin & System Management API Handlers
 * School: Gameri Higher Secondary School, Gamiri
 * Requires ADMIN or PRINCIPAL role.
 */

const AdminApi = {

  /**
   * Helper to generate a controlled, unique institutional Employee ID.
   * Format: GHSS-STAFF-0001 (prefix configurable via Settings 'STAFF_ID_PREFIX').
   */
  generateEmployeeId: function(schoolId) {
    schoolId = schoolId || DEFAULT_SCHOOL_ID;
    const prefixSetting = Database.findByPk('Settings', 'STAFF_ID_PREFIX');
    const prefix = prefixSetting ? String(prefixSetting.value).trim() : 'GHSS-STAFF-';

    const allStaff = Database.readAll('Staff') || [];
    let maxSeq = 0;

    allStaff.forEach(function(s) {
      const empId = String(s.employeeId || s.staffId || '').trim();
      if (empId.startsWith(prefix)) {
        const numPart = parseInt(empId.replace(prefix, '').replace(/\D/g, ''), 10);
        if (!isNaN(numPart) && numPart > maxSeq) maxSeq = numPart;
      } else {
        const anyNum = parseInt(empId.replace(/\D/g, ''), 10);
        if (!isNaN(anyNum) && anyNum > maxSeq && anyNum < 100000) maxSeq = anyNum;
      }
    });

    const nextSeq = maxSeq + 1;
    const padNum = String(nextSeq).padStart(4, '0');
    return `${prefix}${padNum}`;
  },

  /**
   * Lists all staff accounts with advanced filtering, search, and resolved active assignments.
   * Strips password hashes and salts, returning clean safe profile objects.
   */
  getStaffList: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can view staff list' } };
    }

    payload = payload || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const allStaff = Database.readAll('Staff') || [];
    const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const academicYear = String(payload.academicYear || (activeSetting ? activeSetting.value : '2026-2027')).trim();
    const allAssignments = Database.readAll('StaffAssignments') || [];

    const searchQuery = String(payload.search || payload.searchQuery || '').toLowerCase().trim();
    const filterRole = String(payload.role || 'ALL').toUpperCase().trim();
    const filterStatus = String(payload.status || 'ALL').toUpperCase().trim();
    const filterDept = String(payload.department || 'ALL').trim();
    const filterDesig = String(payload.designation || 'ALL').trim();

    const filtered = allStaff.filter(s => !s.schoolId || s.schoolId === schoolId);

    const safeStaffList = filtered.map(function(s) {
      let assignedClasses = [];
      let assignedSubjects = [];
      try {
        assignedClasses = s.assignedClasses ? JSON.parse(s.assignedClasses) : [];
      } catch (e) { assignedClasses = String(s.assignedClasses || '').split(',').map(c => c.trim()).filter(Boolean); }

      try {
        assignedSubjects = s.assignedSubjects ? JSON.parse(s.assignedSubjects) : [];
      } catch (e) { assignedSubjects = String(s.assignedSubjects || '').split(',').map(sub => sub.trim()).filter(Boolean); }

      // Get active StaffAssignments for this teacher in the requested academic year
      const teacherAssignments = allAssignments.filter(function(a) {
        return String(a.staffId) === String(s.staffId) &&
               (!a.academicYear || a.academicYear === academicYear) &&
               (!a.status || a.status === 'ACTIVE' || a.status === 'Active');
      });

      if (teacherAssignments.length > 0) {
        assignedClasses = Array.from(new Set(teacherAssignments.map(a => String(a.class)).filter(Boolean)));
        assignedSubjects = Array.from(new Set(teacherAssignments.map(a => String(a.subject)).filter(Boolean)));
      }

      const isCustom = s.isCustomPassword === true || s.isCustomPassword === 'true';
      const status = s.status || 'ACTIVE';
      const isActive = status === 'ACTIVE' || status === 'Active';

      return {
        staffId: s.staffId,
        schoolId: s.schoolId || schoolId,
        employeeId: s.employeeId || s.staffId,
        name: s.staffName || '',
        staffName: s.staffName || '',
        firstName: s.firstName || '',
        middleName: s.middleName || '',
        lastName: s.lastName || '',
        role: s.role || 'TEACHER',
        gender: s.gender || 'Not Specified',
        dob: s.dob || '',
        mobile: s.mobile || '',
        email: s.email || '',
        address: s.address || '',
        village: s.village || '',
        district: s.district || 'Biswanath',
        state: s.state || 'Assam',
        pinCode: s.pinCode || '784176',
        designation: s.designation || (s.role === 'PRINCIPAL' ? 'Principal' : (s.role === 'ADMIN' ? 'Administrator' : 'Vocational Teacher')),
        department: s.department || 'Vocational Education',
        employmentType: s.employmentType || 'Permanent',
        joiningDate: s.joiningDate || '',
        qualification: s.qualification || 'Post Graduate / B.Ed',
        specialization: s.specialization || 'Information Technology',
        stream: s.stream || 'IT/ITeS',
        assignedClasses: assignedClasses,
        assignedSubjects: assignedSubjects,
        assignmentsCount: teacherAssignments.length,
        status: status,
        active: isActive,
        passwordMode: isCustom ? 'CUSTOM' : 'COMMON',
        createdAt: s.createdAt || '',
        updatedAt: s.updatedAt || ''
      };
    });

    // Apply Filters & Search
    let resultList = safeStaffList;

    if (searchQuery) {
      resultList = resultList.filter(s => {
        const nameMatch = s.staffName.toLowerCase().includes(searchQuery);
        const empMatch = String(s.employeeId || '').toLowerCase().includes(searchQuery);
        const staffIdMatch = String(s.staffId || '').toLowerCase().includes(searchQuery);
        const mobileMatch = String(s.mobile || '').includes(searchQuery);
        const emailMatch = String(s.email || '').toLowerCase().includes(searchQuery);
        const desigMatch = String(s.designation || '').toLowerCase().includes(searchQuery);
        const deptMatch = String(s.department || '').toLowerCase().includes(searchQuery);
        return nameMatch || empMatch || staffIdMatch || mobileMatch || emailMatch || desigMatch || deptMatch;
      });
    }

    if (filterRole !== 'ALL') {
      resultList = resultList.filter(s => s.role === filterRole);
    }

    if (filterStatus !== 'ALL') {
      resultList = resultList.filter(s => String(s.status).toUpperCase() === filterStatus);
    }

    if (filterDept !== 'ALL') {
      resultList = resultList.filter(s => s.department === filterDept);
    }

    if (filterDesig !== 'ALL') {
      resultList = resultList.filter(s => s.designation === filterDesig);
    }

    return {
      success: true,
      data: {
        staff: resultList,
        total: resultList.length,
        academicYear: academicYear
      }
    };
  },

  /**
   * Retrieves a single staff member profile by ID.
   */
  getStaffById: function(session, payload) {
    return this.getStaffProfile(session, payload);
  },

  /**
   * Aggregated 360° Staff Master Profile.
   * Aggregates Staff details, Employment, Qualifications, Active & Historical Assignments,
   * Academic Workload load, Account & Role linkage, and Audit Logs.
   */
  getStaffProfile: function(session, payload) {
    payload = payload || {};
    const targetId = String(payload.staffId || payload.userId || session.userId || '').trim();
    if (!targetId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'staffId is required' } };
    }

    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL']) && session.userId !== targetId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to view this staff profile' } };
    }

    const staff = Database.findByPk('Staff', targetId);
    if (!staff) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Staff member not found' } };
    }

    const schoolId = staff.schoolId || session.schoolId || DEFAULT_SCHOOL_ID;
    const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const activeYear = String(payload.academicYear || (activeSetting ? activeSetting.value : '2026-2027')).trim();

    // 1. Assignments (Active & History)
    const allAssignments = Database.readAll('StaffAssignments') || [];
    const staffAssignments = allAssignments.filter(a => String(a.staffId) === targetId);

    const currentAssignments = staffAssignments.filter(a =>
      (!a.academicYear || a.academicYear === activeYear) &&
      (!a.status || a.status === 'ACTIVE' || a.status === 'Active')
    );

    const assignmentHistory = [...staffAssignments].sort((a, b) =>
      String(b.academicYear || '').localeCompare(String(a.academicYear || ''))
    );

    // 2. Academic Assignment Load (Workload)
    const activeClasses = Array.from(new Set(currentAssignments.map(a => String(a.class)).filter(Boolean)));
    const activeSections = Array.from(new Set(currentAssignments.map(a => `${a.class}-${a.section}`).filter(Boolean)));
    const activeSubjects = Array.from(new Set(currentAssignments.map(a => String(a.subject)).filter(Boolean)));
    const theoryCount = currentAssignments.filter(a => a.component === 'THEORY' || a.component === 'BOTH').length;
    const practicalCount = currentAssignments.filter(a => a.component === 'PRACTICAL' || a.component === 'BOTH').length;
    const classTeacherDuties = currentAssignments.filter(a => a.assignmentType === 'CLASS_TEACHER');

    const workloadSummary = {
      academicYear: activeYear,
      totalAssignments: currentAssignments.length,
      assignedClasses: activeClasses,
      assignedSectionsCount: activeSections.length,
      assignedSubjects: activeSubjects,
      theoryComponents: theoryCount,
      practicalComponents: practicalCount,
      classTeacherAssignments: classTeacherDuties.map(d => ({ class: d.class, section: d.section })),
      isClassTeacher: classTeacherDuties.length > 0
    };

    // 3. Account Linkage & Security Info
    const isCustom = staff.isCustomPassword === true || staff.isCustomPassword === 'true';
    const accountInfo = {
      role: staff.role || 'TEACHER',
      passwordMode: isCustom ? 'CUSTOM' : 'COMMON',
      isCustomPassword: isCustom,
      status: staff.status || 'ACTIVE',
      active: (staff.status || 'ACTIVE') === 'ACTIVE' || (staff.status || 'Active') === 'Active',
      createdAt: staff.createdAt || '',
      updatedAt: staff.updatedAt || ''
    };

    // 4. Audit Logs (Admin & Principal only)
    let auditLogs = [];
    if (['ADMIN', 'PRINCIPAL'].includes(session.role)) {
      const allAudit = Database.readAll('Audit') || [];
      auditLogs = allAudit.filter(l => {
        const detailsStr = typeof l.details === 'object' ? JSON.stringify(l.details) : String(l.details || '');
        return detailsStr.includes(targetId) || l.actorId === targetId;
      }).slice(-20).reverse();
    }

    const sanitizedStaff = {
      staffId: staff.staffId,
      schoolId: schoolId,
      employeeId: staff.employeeId || staff.staffId,
      name: staff.staffName || '',
      staffName: staff.staffName || '',
      firstName: staff.firstName || '',
      middleName: staff.middleName || '',
      lastName: staff.lastName || '',
      role: staff.role || 'TEACHER',
      gender: staff.gender || 'Not Specified',
      dob: staff.dob || '',
      mobile: staff.mobile || '',
      email: staff.email || '',
      address: staff.address || '',
      village: staff.village || '',
      district: staff.district || 'Biswanath',
      state: staff.state || 'Assam',
      pinCode: staff.pinCode || '784176',
      designation: staff.designation || (staff.role === 'PRINCIPAL' ? 'Principal' : (staff.role === 'ADMIN' ? 'Administrator' : 'Vocational Teacher')),
      department: staff.department || 'Vocational Education',
      employmentType: staff.employmentType || 'Permanent',
      joiningDate: staff.joiningDate || '',
      qualification: staff.qualification || 'Post Graduate / B.Ed',
      specialization: staff.specialization || 'Information Technology',
      stream: staff.stream || 'IT/ITeS',
      status: staff.status || 'ACTIVE',
      active: accountInfo.active
    };

    return {
      success: true,
      data: {
        staff: sanitizedStaff,
        currentAssignments: currentAssignments,
        assignmentHistory: assignmentHistory,
        workload: workloadSummary,
        account: accountInfo,
        auditLogs: auditLogs
      }
    };
  },

  /**
   * Registers a new Staff member with complete master data and unique Employee ID.
   */
  registerStaff: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can register staff' } };
    }

    payload = (payload && payload.staffData) ? payload.staffData : (payload || {});
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const staffId = payload.staffId || Auth.generateId('STF');

    const mobile = String(payload.mobile || '').replace(/\D/g, '');
    if (!mobile || mobile.length < 10) {
      return { success: false, error: { code: 'INVALID_MOBILE', message: 'Valid 10-digit mobile number is required' } };
    }
    const cleanMobile = mobile.slice(-10);
    const role = (payload.role || 'TEACHER').toUpperCase();
    const staffName = String(payload.staffName || payload.name || '').trim();

    if (!staffName) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Staff name is required' } };
    }

    // Generate or validate unique Employee ID
    let employeeId = String(payload.employeeId || '').trim();
    if (!employeeId) {
      employeeId = this.generateEmployeeId(schoolId);
    }

    // Check duplicate staff accounts (mobile, staffId, employeeId)
    const existingStaff = Database.readAll('Staff') || [];
    const duplicateMobile = existingStaff.find(s =>
      (!s.schoolId || s.schoolId === schoolId) &&
      String(s.mobile || '').replace(/\D/g, '').slice(-10) === cleanMobile &&
      s.staffId !== staffId
    );
    if (duplicateMobile) {
      return { success: false, error: { code: 'DUPLICATE_STAFF', message: `A staff member with mobile ${cleanMobile} already exists (${duplicateMobile.staffName})` } };
    }

    const duplicateEmpId = existingStaff.find(s =>
      (!s.schoolId || s.schoolId === schoolId) &&
      s.employeeId && String(s.employeeId).toUpperCase() === employeeId.toUpperCase() &&
      s.staffId !== staffId
    );
    if (duplicateEmpId) {
      return { success: false, error: { code: 'DUPLICATE_EMPLOYEE_ID', message: `Employee ID "${employeeId}" is already assigned to ${duplicateEmpId.staffName}` } };
    }

    const commonPassword = Auth.getCommonSchoolPassword(schoolId);
    const salt = Auth.generateSalt(16);
    const passwordHash = Auth.hashPassword(payload.password || payload.customPassword || commonPassword, salt);

    let assignedClasses = payload.assignedClasses || ['9', '10'];
    let assignedSubjects = payload.assignedSubjects || ['IT/ITeS'];

    const staffRecord = {
      staffId: staffId,
      schoolId: schoolId,
      employeeId: employeeId,
      staffName: staffName,
      firstName: payload.firstName || '',
      middleName: payload.middleName || '',
      lastName: payload.lastName || '',
      role: role,
      gender: payload.gender || 'Not Specified',
      dob: payload.dob || '',
      mobile: cleanMobile,
      email: payload.email || '',
      address: payload.address || '',
      village: payload.village || '',
      district: payload.district || 'Biswanath',
      state: payload.state || 'Assam',
      pinCode: payload.pinCode || '784176',
      designation: payload.designation || (role === 'PRINCIPAL' ? 'Principal' : (role === 'ADMIN' ? 'Administrator' : 'Vocational Teacher')),
      department: payload.department || 'Vocational Education',
      employmentType: payload.employmentType || 'Permanent',
      joiningDate: payload.joiningDate || nowStr.split('T')[0],
      qualification: payload.qualification || 'Post Graduate / B.Ed',
      specialization: payload.specialization || 'Information Technology',
      stream: payload.stream || 'IT/ITeS',
      assignedClasses: typeof assignedClasses === 'object' ? JSON.stringify(assignedClasses) : String(assignedClasses),
      assignedSubjects: typeof assignedSubjects === 'object' ? JSON.stringify(assignedSubjects) : String(assignedSubjects),
      passwordHash: passwordHash,
      salt: salt,
      isCustomPassword: !!(payload.password || payload.customPassword),
      status: payload.status || 'ACTIVE',
      createdAt: payload.createdAt || nowStr,
      updatedAt: nowStr
    };

    Database.upsertBatch('Staff', [staffRecord]);

    // If initial structured assignments were provided, create StaffAssignments records
    const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const academicYear = String(payload.academicYear || (activeSetting ? activeSetting.value : '2026-2027')).trim();

    if (Array.isArray(payload.assignments) && payload.assignments.length > 0) {
      const assignmentRecords = payload.assignments.map((asg, idx) => ({
        assignmentId: asg.assignmentId || `SASG_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${staffId}_${asg.class}_${asg.section || 'A'}_${(asg.subject || 'IT').replace(/[^a-zA-Z0-9]/g, '_')}_${idx}`,
        schoolId: schoolId,
        staffId: staffId,
        academicYear: asg.academicYear || academicYear,
        class: String(asg.class || '9'),
        section: String(asg.section || 'A'),
        subject: String(asg.subject || 'IT/ITeS'),
        component: String(asg.component || 'BOTH').toUpperCase(),
        assignmentType: String(asg.assignmentType || 'SUBJECT_TEACHER').toUpperCase(),
        status: 'ACTIVE',
        startDate: asg.startDate || nowStr.split('T')[0],
        endDate: asg.endDate || '',
        remarks: asg.remarks || 'Initial registration assignment',
        createdAt: nowStr,
        updatedAt: nowStr
      }));
      Database.upsertBatch('StaffAssignments', assignmentRecords);
    }

    Audit.log('REGISTER_STAFF', session.role, session.userId, {
      staffId: staffId,
      employeeId: employeeId,
      name: staffRecord.staffName,
      role: staffRecord.role,
      designation: staffRecord.designation,
      department: staffRecord.department
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      data: {
        staffId: staffId,
        employeeId: employeeId,
        staffName: staffRecord.staffName,
        role: staffRecord.role,
        designation: staffRecord.designation,
        department: staffRecord.department,
        mobile: staffRecord.mobile,
        email: staffRecord.email,
        assignedClasses: Array.isArray(assignedClasses) ? assignedClasses : [assignedClasses],
        assignedSubjects: Array.isArray(assignedSubjects) ? assignedSubjects : [assignedSubjects],
        status: staffRecord.status,
        active: staffRecord.status === 'ACTIVE' || staffRecord.status === 'Active',
        isCustomPassword: staffRecord.isCustomPassword,
        passwordMode: staffRecord.isCustomPassword ? 'CUSTOM' : 'COMMON',
        message: `Staff account registered successfully with ID ${employeeId}`
      }
    };
  },

  /**
   * Updates an existing Staff member's master profile, roles, employment, or academic data.
   */
  updateStaff: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can update staff accounts' } };
    }

    payload = (payload && payload.staffData) ? payload.staffData : (payload || {});
    const staffId = String(payload.staffId || payload.userId || '').trim();
    if (!staffId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'staffId is required' } };
    }

    const staff = Database.findByPk('Staff', staffId);
    if (!staff) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Staff member not found' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    // Validate mobile uniqueness if changing
    if (payload.mobile !== undefined) {
      const cleanMob = String(payload.mobile).replace(/\D/g, '').slice(-10);
      if (cleanMob && cleanMob.length === 10) {
        const allStaff = Database.readAll('Staff') || [];
        const duplicate = allStaff.find(s =>
          (!s.schoolId || s.schoolId === schoolId) &&
          String(s.mobile || '').replace(/\D/g, '').slice(-10) === cleanMob &&
          s.staffId !== staffId
        );
        if (duplicate) {
          return { success: false, error: { code: 'DUPLICATE_STAFF', message: `Mobile ${cleanMob} is already registered to ${duplicate.staffName}` } };
        }
        staff.mobile = cleanMob;
      }
    }

    if (payload.staffName !== undefined || payload.name !== undefined) {
      staff.staffName = payload.staffName || payload.name || staff.staffName;
    }
    if (payload.firstName !== undefined) staff.firstName = payload.firstName;
    if (payload.middleName !== undefined) staff.middleName = payload.middleName;
    if (payload.lastName !== undefined) staff.lastName = payload.lastName;
    if (payload.gender !== undefined) staff.gender = payload.gender;
    if (payload.dob !== undefined) staff.dob = payload.dob;
    if (payload.role !== undefined) staff.role = String(payload.role).toUpperCase();
    if (payload.email !== undefined) staff.email = payload.email;
    if (payload.address !== undefined) staff.address = payload.address;
    if (payload.village !== undefined) staff.village = payload.village;
    if (payload.district !== undefined) staff.district = payload.district;
    if (payload.state !== undefined) staff.state = payload.state;
    if (payload.pinCode !== undefined) staff.pinCode = payload.pinCode;
    if (payload.designation !== undefined) staff.designation = payload.designation;
    if (payload.department !== undefined) staff.department = payload.department;
    if (payload.employmentType !== undefined) staff.employmentType = payload.employmentType;
    if (payload.joiningDate !== undefined) staff.joiningDate = payload.joiningDate;
    if (payload.qualification !== undefined) staff.qualification = payload.qualification;
    if (payload.specialization !== undefined) staff.specialization = payload.specialization;
    if (payload.stream !== undefined) staff.stream = payload.stream;
    if (payload.employeeId !== undefined && payload.employeeId) staff.employeeId = payload.employeeId;

    if (payload.assignedClasses !== undefined) {
      staff.assignedClasses = typeof payload.assignedClasses === 'object' ? JSON.stringify(payload.assignedClasses) : String(payload.assignedClasses);
    }
    if (payload.assignedSubjects !== undefined) {
      staff.assignedSubjects = typeof payload.assignedSubjects === 'object' ? JSON.stringify(payload.assignedSubjects) : String(payload.assignedSubjects);
    }
    if (payload.status !== undefined) {
      staff.status = payload.status;
    }

    staff.updatedAt = nowStr;
    Database.upsertBatch('Staff', [staff]);

    Audit.log('UPDATE_STAFF', session.role, session.userId, {
      staffId: staffId,
      name: staff.staffName,
      role: staff.role,
      designation: staff.designation
    }, 'SUCCESS', '', schoolId);

    let parsedClasses = [];
    let parsedSubjects = [];
    try { parsedClasses = JSON.parse(staff.assignedClasses); } catch (e) { parsedClasses = [staff.assignedClasses]; }
    try { parsedSubjects = JSON.parse(staff.assignedSubjects); } catch (e) { parsedSubjects = [staff.assignedSubjects]; }

    return {
      success: true,
      message: 'Staff profile updated successfully',
      data: {
        staffId: staff.staffId,
        employeeId: staff.employeeId || staff.staffId,
        staffName: staff.staffName,
        role: staff.role,
        designation: staff.designation,
        department: staff.department,
        mobile: staff.mobile,
        email: staff.email,
        assignedClasses: parsedClasses,
        assignedSubjects: parsedSubjects,
        status: staff.status,
        active: (staff.status || 'ACTIVE') === 'ACTIVE' || (staff.status || 'Active') === 'Active',
        passwordMode: (staff.isCustomPassword === true || staff.isCustomPassword === 'true') ? 'CUSTOM' : 'COMMON'
      }
    };
  },

  /**
   * Controlled Staff status transitions.
   * Supported: ACTIVE, INACTIVE, ON_LEAVE, TRANSFERRED, RETIRED, LEFT_SERVICE.
   * Inactive/left staff cannot receive new assignments; historical records are permanently preserved.
   */
  setStaffStatus: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can modify staff status' } };
    }

    const staffId = String(payload.staffId || payload.userId || '').trim();
    let newStatus = String(payload.status || (payload.active === false ? 'INACTIVE' : 'ACTIVE')).toUpperCase().trim();

    if (!staffId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'staffId is required' } };
    }

    const validStatuses = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TRANSFERRED', 'RETIRED', 'LEFT_SERVICE'];
    if (!validStatuses.includes(newStatus)) {
      newStatus = newStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
    }

    const staff = Database.findByPk('Staff', staffId);
    if (!staff) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Staff member not found' } };
    }

    const previousStatus = staff.status || 'ACTIVE';
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    staff.status = newStatus;
    staff.updatedAt = nowStr;
    Database.upsertBatch('Staff', [staff]);

    Audit.log('SET_STAFF_STATUS', session.role, session.userId, {
      staffId: staffId,
      name: staff.staffName,
      previousStatus: previousStatus,
      newStatus: newStatus,
      reason: payload.reason || ''
    }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: `Staff status updated from ${previousStatus} to ${newStatus}`,
      data: {
        staffId: staffId,
        previousStatus: previousStatus,
        status: newStatus,
        active: newStatus === 'ACTIVE'
      }
    };
  },

  /**
   * Retrieves Academic Staff Assignments with flexible filtering.
   */
  getStaffAssignments: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL', 'TEACHER'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to view staff assignments' } };
    }

    payload = payload || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const academicYear = String(payload.academicYear || (activeSetting ? activeSetting.value : '2026-2027')).trim();

    const allAssignments = Database.readAll('StaffAssignments') || [];
    const allStaff = Database.readAll('Staff') || [];
    const staffMap = new Map();
    allStaff.forEach(s => staffMap.set(String(s.staffId), s));

    let filtered = allAssignments.filter(a => !a.schoolId || a.schoolId === schoolId);

    if (session.role === 'TEACHER' && !payload.allStaff) {
      filtered = filtered.filter(a => String(a.staffId) === String(session.userId));
    } else if (payload.staffId) {
      filtered = filtered.filter(a => String(a.staffId) === String(payload.staffId));
    }

    if (payload.academicYear && payload.academicYear !== 'ALL') {
      filtered = filtered.filter(a => String(a.academicYear) === String(payload.academicYear));
    }
    if (payload.class && payload.class !== 'ALL') {
      filtered = filtered.filter(a => String(a.class) === String(payload.class));
    }
    if (payload.section && payload.section !== 'ALL') {
      filtered = filtered.filter(a => String(a.section) === String(payload.section));
    }
    if (payload.subject && payload.subject !== 'ALL') {
      filtered = filtered.filter(a => String(a.subject).toLowerCase().includes(String(payload.subject).toLowerCase()));
    }
    if (payload.assignmentType && payload.assignmentType !== 'ALL') {
      filtered = filtered.filter(a => String(a.assignmentType) === String(payload.assignmentType));
    }
    if (payload.status && payload.status !== 'ALL') {
      filtered = filtered.filter(a => String(a.status).toUpperCase() === String(payload.status).toUpperCase());
    }

    const enriched = filtered.map(function(asg) {
      const s = staffMap.get(String(asg.staffId)) || {};
      return {
        assignmentId: asg.assignmentId,
        schoolId: asg.schoolId || schoolId,
        staffId: asg.staffId,
        staffName: s.staffName || asg.staffName || 'Staff Member',
        employeeId: s.employeeId || s.staffId || '',
        designation: s.designation || 'Teacher',
        department: s.department || 'Vocational Education',
        academicYear: asg.academicYear,
        class: asg.class,
        section: asg.section || 'All',
        subject: asg.subject || 'All',
        component: asg.component || 'BOTH',
        assignmentType: asg.assignmentType || 'SUBJECT_TEACHER',
        status: asg.status || 'ACTIVE',
        active: (asg.status || 'ACTIVE') === 'ACTIVE',
        startDate: asg.startDate || '',
        endDate: asg.endDate || '',
        remarks: asg.remarks || '',
        createdAt: asg.createdAt || '',
        updatedAt: asg.updatedAt || ''
      };
    });

    return {
      success: true,
      data: {
        assignments: enriched,
        total: enriched.length,
        academicYear: academicYear
      }
    };
  },

  /**
   * Saves or updates an Academic Staff Assignment with validation and conflict detection.
   */
  saveStaffAssignment: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can assign staff' } };
    }

    payload = payload || {};
    const staffId = String(payload.staffId || '').trim();
    const targetClass = String(payload.class || '').trim();
    const targetSection = String(payload.section || 'A').trim();
    const targetSubject = String(payload.subject || 'IT/ITeS').trim();
    const component = String(payload.component || 'BOTH').toUpperCase().trim();
    const assignmentType = String(payload.assignmentType || 'SUBJECT_TEACHER').toUpperCase().trim();
    const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const academicYear = String(payload.academicYear || (activeSetting ? activeSetting.value : '2026-2027')).trim();
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    if (!staffId || !targetClass || !targetSubject) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'staffId, class, and subject are required' } };
    }

    // 1. Validate Staff exists and is ACTIVE
    const staff = Database.findByPk('Staff', staffId);
    if (!staff) {
      return { success: false, error: { code: 'NOT_FOUND', message: `Staff member not found: ${staffId}` } };
    }
    const staffStatus = (staff.status || 'ACTIVE').toUpperCase();
    if (staffStatus === 'INACTIVE' || staffStatus === 'RETIRED' || staffStatus === 'LEFT_SERVICE') {
      return { success: false, error: { code: 'INACTIVE_STAFF', message: `Cannot create assignment for ${staff.staffName} because staff status is ${staffStatus}` } };
    }

    // 2. Conflict Detection: Class Teacher duplicate prevention
    const allAssignments = Database.readAll('StaffAssignments') || [];
    if (assignmentType === 'CLASS_TEACHER') {
      const existingClassTeacher = allAssignments.find(function(a) {
        return a.academicYear === academicYear &&
               String(a.class) === targetClass &&
               String(a.section || 'A') === targetSection &&
               a.assignmentType === 'CLASS_TEACHER' &&
               (a.status || 'ACTIVE') === 'ACTIVE' &&
               String(a.staffId) !== staffId &&
               a.assignmentId !== payload.assignmentId;
      });

      if (existingClassTeacher && payload.confirmOverwrite !== true) {
        const ctStaff = Database.findByPk('Staff', existingClassTeacher.staffId);
        const ctName = ctStaff ? ctStaff.staffName : existingClassTeacher.staffId;
        return {
          success: false,
          error: {
            code: 'CLASS_TEACHER_CONFLICT',
            message: `Class ${targetClass} Section ${targetSection} already has Class Teacher: ${ctName} for Academic Year ${academicYear}. Confirmation required to overwrite.`,
            existingTeacher: { staffId: existingClassTeacher.staffId, name: ctName }
          }
        };
      }
    }

    const assignmentId = payload.assignmentId || `SASG_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${staffId}_${targetClass}_${targetSection}_${targetSubject.replace(/[^a-zA-Z0-9]/g, '_')}_${component}`;

    const assignmentRecord = {
      assignmentId: assignmentId,
      schoolId: schoolId,
      staffId: staffId,
      academicYear: academicYear,
      class: targetClass,
      section: targetSection,
      subject: targetSubject,
      component: component,
      assignmentType: assignmentType,
      status: payload.status || 'ACTIVE',
      startDate: payload.startDate || nowStr.split('T')[0],
      endDate: payload.endDate || '',
      remarks: payload.remarks || '',
      createdAt: payload.createdAt || nowStr,
      updatedAt: nowStr
    };

    Database.upsertBatch('StaffAssignments', [assignmentRecord]);

    // Synchronize summary assignedClasses and assignedSubjects on Staff record
    const teacherActiveAssignments = (Database.readAll('StaffAssignments') || []).filter(a =>
      String(a.staffId) === staffId && (a.status || 'ACTIVE') === 'ACTIVE'
    );
    const uniqueClasses = Array.from(new Set(teacherActiveAssignments.map(a => String(a.class)).filter(Boolean)));
    const uniqueSubjects = Array.from(new Set(teacherActiveAssignments.map(a => String(a.subject)).filter(Boolean)));

    if (uniqueClasses.length > 0) staff.assignedClasses = JSON.stringify(uniqueClasses);
    if (uniqueSubjects.length > 0) staff.assignedSubjects = JSON.stringify(uniqueSubjects);
    staff.updatedAt = nowStr;
    Database.upsertBatch('Staff', [staff]);

    Audit.log('SAVE_STAFF_ASSIGNMENT', session.role, session.userId, {
      assignmentId: assignmentId,
      staffId: staffId,
      staffName: staff.staffName,
      academicYear: academicYear,
      class: targetClass,
      section: targetSection,
      subject: targetSubject,
      component: component,
      assignmentType: assignmentType
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Assigned ${staff.staffName} to Class ${targetClass}-${targetSection} (${targetSubject} - ${component})`,
      data: {
        assignment: assignmentRecord,
        staffName: staff.staffName
      }
    };
  },

  /**
   * Soft-deactivates an Academic Staff Assignment preserving full audit and historical integrity.
   */
  deactivateStaffAssignment: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can deactivate assignments' } };
    }

    const assignmentId = String(payload.assignmentId || '').trim();
    if (!assignmentId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'assignmentId is required' } };
    }

    const assignment = Database.findByPk('StaffAssignments', assignmentId);
    if (!assignment) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Staff assignment record not found' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    assignment.status = 'INACTIVE';
    assignment.endDate = payload.endDate || nowStr.split('T')[0];
    assignment.updatedAt = nowStr;

    Database.upsertBatch('StaffAssignments', [assignment]);

    Audit.log('DEACTIVATE_STAFF_ASSIGNMENT', session.role, session.userId, {
      assignmentId: assignmentId,
      staffId: assignment.staffId,
      class: assignment.class,
      subject: assignment.subject
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: 'Staff assignment successfully deactivated',
      data: { assignmentId: assignmentId, status: 'INACTIVE' }
    };
  },

  /**
   * Bulk Academic Assignment Wizard with 2-phase preview & commit.
   */
  bulkAssignStaff: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can perform bulk assignments' } };
    }

    payload = payload || {};
    const staffId = String(payload.staffId || '').trim();
    const classSections = Array.isArray(payload.classSections) ? payload.classSections : [];
    const targetSubject = String(payload.subject || 'IT/ITeS').trim();
    const component = String(payload.component || 'BOTH').toUpperCase().trim();
    const assignmentType = String(payload.assignmentType || 'SUBJECT_TEACHER').toUpperCase().trim();
    const isPreview = payload.preview !== false;
    const confirm = payload.confirm === true;

    if (!staffId || classSections.length === 0 || !targetSubject) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'staffId, target class-sections list, and subject are required' } };
    }

    const staff = Database.findByPk('Staff', staffId);
    if (!staff) {
      return { success: false, error: { code: 'NOT_FOUND', message: `Staff member not found: ${staffId}` } };
    }
    const staffStatus = (staff.status || 'ACTIVE').toUpperCase();
    if (staffStatus === 'INACTIVE' || staffStatus === 'RETIRED' || staffStatus === 'LEFT_SERVICE') {
      return { success: false, error: { code: 'INACTIVE_STAFF', message: `Cannot create assignments because staff status is ${staffStatus}` } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const academicYear = String(payload.academicYear || (activeSetting ? activeSetting.value : '2026-2027')).trim();
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    const allAssignments = Database.readAll('StaffAssignments') || [];
    const plannedRecords = [];
    const conflictWarnings = [];

    for (let i = 0; i < classSections.length; i++) {
      const cs = classSections[i];
      const cls = String(cs.class || cs.className || '').trim();
      const sec = String(cs.section || 'A').trim();

      if (!cls) continue;

      // Conflict check for class teacher
      if (assignmentType === 'CLASS_TEACHER') {
        const existingCT = allAssignments.find(a =>
          a.academicYear === academicYear &&
          String(a.class) === cls &&
          String(a.section || 'A') === sec &&
          a.assignmentType === 'CLASS_TEACHER' &&
          (a.status || 'ACTIVE') === 'ACTIVE' &&
          String(a.staffId) !== staffId
        );
        if (existingCT) {
          const ctStaff = Database.findByPk('Staff', existingCT.staffId);
          conflictWarnings.push({
            class: cls,
            section: sec,
            conflictType: 'EXISTING_CLASS_TEACHER',
            message: `Class ${cls}-${sec} already has Class Teacher: ${ctStaff ? ctStaff.staffName : existingCT.staffId}`
          });
        }
      }

      const asgId = `SASG_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${staffId}_${cls}_${sec}_${targetSubject.replace(/[^a-zA-Z0-9]/g, '_')}_${component}`;
      plannedRecords.push({
        assignmentId: asgId,
        schoolId: schoolId,
        staffId: staffId,
        academicYear: academicYear,
        class: cls,
        section: sec,
        subject: targetSubject,
        component: component,
        assignmentType: assignmentType,
        status: 'ACTIVE',
        startDate: nowStr.split('T')[0],
        endDate: '',
        remarks: 'Bulk assignment batch',
        createdAt: nowStr,
        updatedAt: nowStr
      });
    }

    if (!isPreview && confirm && plannedRecords.length > 0) {
      Database.upsertBatch('StaffAssignments', plannedRecords);

      // Sync summary classes & subjects on Staff
      const teacherAssignments = (Database.readAll('StaffAssignments') || []).filter(a =>
        String(a.staffId) === staffId && (a.status || 'ACTIVE') === 'ACTIVE'
      );
      const uniqueClasses = Array.from(new Set(teacherAssignments.map(a => String(a.class)).filter(Boolean)));
      const uniqueSubjects = Array.from(new Set(teacherAssignments.map(a => String(a.subject)).filter(Boolean)));
      staff.assignedClasses = JSON.stringify(uniqueClasses);
      staff.assignedSubjects = JSON.stringify(uniqueSubjects);
      staff.updatedAt = nowStr;
      Database.upsertBatch('Staff', [staff]);

      Audit.log('BULK_ASSIGN_STAFF', session.role, session.userId, {
        staffId: staffId,
        teacherName: staff.staffName,
        assignedCount: plannedRecords.length,
        academicYear: academicYear,
        subject: targetSubject
      }, 'SUCCESS', '', schoolId);
    }

    return {
      success: true,
      message: isPreview ? `Preview generated for ${plannedRecords.length} assignments` : `Successfully created ${plannedRecords.length} assignments for ${staff.staffName}`,
      data: {
        isPreview: isPreview,
        staffId: staffId,
        staffName: staff.staffName,
        totalItems: plannedRecords.length,
        plannedAssignments: plannedRecords,
        conflictWarnings: conflictWarnings
      }
    };
  },

  /**
   * Computes authoritative Academic Assignment Load (Workload) across faculty.
   */
  getTeacherWorkload: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL', 'TEACHER'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to view workload summary' } };
    }

    payload = payload || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const academicYear = String(payload.academicYear || (activeSetting ? activeSetting.value : '2026-2027')).trim();

    const allStaff = Database.readAll('Staff') || [];
    const allAssignments = Database.readAll('StaffAssignments') || [];

    let targetStaffList = allStaff.filter(s => !s.schoolId || s.schoolId === schoolId);
    if (session.role === 'TEACHER' && !payload.allStaff) {
      targetStaffList = targetStaffList.filter(s => String(s.staffId) === String(session.userId));
    } else if (payload.staffId) {
      targetStaffList = targetStaffList.filter(s => String(s.staffId) === String(payload.staffId));
    }

    const workloads = targetStaffList.map(function(staff) {
      const activeAssignments = allAssignments.filter(a =>
        String(a.staffId) === String(staff.staffId) &&
        (!a.academicYear || a.academicYear === academicYear) &&
        (!a.status || a.status === 'ACTIVE' || a.status === 'Active')
      );

      const classes = Array.from(new Set(activeAssignments.map(a => String(a.class)).filter(Boolean)));
      const classSections = Array.from(new Set(activeAssignments.map(a => `${a.class}-${a.section || 'A'}`).filter(Boolean)));
      const subjects = Array.from(new Set(activeAssignments.map(a => String(a.subject)).filter(Boolean)));
      const theoryCount = activeAssignments.filter(a => a.component === 'THEORY' || a.component === 'BOTH').length;
      const practicalCount = activeAssignments.filter(a => a.component === 'PRACTICAL' || a.component === 'BOTH').length;
      const classTeacherRoles = activeAssignments.filter(a => a.assignmentType === 'CLASS_TEACHER').map(a => `${a.class}-${a.section || 'A'}`);

      return {
        staffId: staff.staffId,
        employeeId: staff.employeeId || staff.staffId,
        staffName: staff.staffName,
        role: staff.role || 'TEACHER',
        designation: staff.designation || 'Teacher',
        department: staff.department || 'Vocational Education',
        status: staff.status || 'ACTIVE',
        active: (staff.status || 'ACTIVE') === 'ACTIVE',
        academicYear: academicYear,
        totalAssignmentsCount: activeAssignments.length,
        classes: classes,
        sectionsCount: classSections.length,
        subjects: subjects,
        theoryAssignmentsCount: theoryCount,
        practicalAssignmentsCount: practicalCount,
        classTeacherRoles: classTeacherRoles,
        isClassTeacher: classTeacherRoles.length > 0,
        assignments: activeAssignments
      };
    });

    return {
      success: true,
      data: {
        academicYear: academicYear,
        totalTeachers: workloads.length,
        workloads: workloads
      }
    };
  },

  /**
   * Controlled CSV Staff Importer with Preview, Duplicate Detection & Validation Report.
   */
  importStaffCsv: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can import staff' } };
    }

    payload = payload || {};
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const isPreview = payload.preview !== false;
    const confirm = payload.confirm === true;

    if (rows.length === 0) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'No staff rows provided in CSV' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const commonPassword = Auth.getCommonSchoolPassword(schoolId);

    const allExisting = Database.readAll('Staff') || [];
    const existingMobMap = new Set(allExisting.map(s => String(s.mobile || '').replace(/\D/g, '').slice(-10)).filter(Boolean));
    const existingEmpIdMap = new Set(allExisting.map(s => String(s.employeeId || '').toUpperCase().trim()).filter(Boolean));

    const validRows = [];
    const invalidRows = [];
    const duplicateRows = [];
    const seenInCsvMob = new Set();
    const seenInCsvEmpId = new Set();

    let seqCounter = 0;

    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      const rowNum = idx + 1;
      const name = String(r.staffName || r.name || '').trim();
      const mobile = String(r.mobile || '').replace(/\D/g, '').slice(-10);
      const role = String(r.role || 'TEACHER').toUpperCase().trim();
      let empId = String(r.employeeId || '').trim();
      const email = String(r.email || '').trim();
      const designation = String(r.designation || (role === 'PRINCIPAL' ? 'Principal' : 'Vocational Teacher')).trim();
      const department = String(r.department || 'Vocational Education').trim();

      if (!name) {
        invalidRows.push({ rowNumber: rowNum, data: r, error: 'Staff name is missing' });
        continue;
      }
      if (!mobile || mobile.length !== 10) {
        invalidRows.push({ rowNumber: rowNum, data: r, error: `Invalid mobile number: "${r.mobile}" (Expected 10 digits)` });
        continue;
      }

      if (!empId) {
        seqCounter++;
        empId = `GHSS-STAFF-${String(1000 + allExisting.length + seqCounter).padStart(4, '0')}`;
      }

      const empIdKey = empId.toUpperCase();

      if (existingMobMap.has(mobile) || seenInCsvMob.has(mobile)) {
        duplicateRows.push({ rowNumber: rowNum, data: r, warning: `Duplicate mobile number "${mobile}"` });
        continue;
      } else if (existingEmpIdMap.has(empIdKey) || seenInCsvEmpId.has(empIdKey)) {
        duplicateRows.push({ rowNumber: rowNum, data: r, warning: `Duplicate Employee ID "${empId}"` });
        continue;
      }

      seenInCsvMob.add(mobile);
      seenInCsvEmpId.add(empIdKey);

      const staffId = String(r.staffId || '').trim() || (`STF_${Date.now().toString().slice(-5)}_${idx}`);
      const salt = Auth.generateSalt(16);
      const passwordHash = Auth.hashPassword(r.password || commonPassword, salt);

      let assignedClasses = ['9', '10'];
      if (r.assignedClasses) {
        try { assignedClasses = JSON.parse(r.assignedClasses); } catch (e) { assignedClasses = String(r.assignedClasses).split(',').map(c => c.trim()); }
      }

      validRows.push({
        staffId: staffId,
        schoolId: schoolId,
        employeeId: empId,
        staffName: name,
        firstName: r.firstName || '',
        middleName: r.middleName || '',
        lastName: r.lastName || '',
        role: role,
        gender: r.gender || 'Not Specified',
        dob: r.dob || '',
        mobile: mobile,
        email: email,
        address: r.address || '',
        village: r.village || '',
        district: r.district || 'Biswanath',
        state: r.state || 'Assam',
        pinCode: r.pinCode || '784176',
        designation: designation,
        department: department,
        employmentType: r.employmentType || 'Permanent',
        joiningDate: r.joiningDate || nowStr.split('T')[0],
        qualification: r.qualification || 'Post Graduate',
        specialization: r.specialization || 'IT',
        stream: r.stream || 'IT/ITeS',
        assignedClasses: JSON.stringify(assignedClasses),
        assignedSubjects: JSON.stringify([r.assignedSubjects || 'IT/ITeS']),
        passwordHash: passwordHash,
        salt: salt,
        isCustomPassword: !!r.password,
        status: 'ACTIVE',
        createdAt: nowStr,
        updatedAt: nowStr
      });
    }

    if (!isPreview && confirm && validRows.length > 0) {
      Database.upsertBatch('Staff', validRows);

      Audit.log('IMPORT_STAFF_CSV', session.role, session.userId, {
        importedCount: validRows.length,
        duplicateCount: duplicateRows.length,
        invalidCount: invalidRows.length
      }, 'SUCCESS', '', schoolId);
    }

    return {
      success: true,
      message: isPreview ? `CSV validation complete: ${validRows.length} valid, ${invalidRows.length} errors, ${duplicateRows.length} duplicate warnings` : `Successfully imported ${validRows.length} staff members`,
      data: {
        isPreview: isPreview,
        summary: {
          totalRows: rows.length,
          validCount: validRows.length,
          invalidCount: invalidRows.length,
          duplicateWarningCount: duplicateRows.length
        },
        validRows: validRows,
        invalidRows: invalidRows,
        duplicateRows: duplicateRows
      }
    };
  },

  /**
   * Exports sanitized staff directory as clean structured dataset for CSV generation.
   * Strictly omits passwords, password hashes, salts, and session secrets.
   */
  exportStaffCsv: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can export staff data' } };
    }

    const res = this.getStaffList(session, payload);
    if (!res.success) return res;

    const cleanRows = res.data.staff.map(s => ({
      staffId: s.staffId,
      employeeId: s.employeeId || s.staffId,
      staffName: s.staffName || '',
      role: s.role || 'TEACHER',
      designation: s.designation || '',
      department: s.department || '',
      gender: s.gender || '',
      dob: s.dob || '',
      mobile: s.mobile || '',
      email: s.email || '',
      qualification: s.qualification || '',
      specialization: s.specialization || '',
      stream: s.stream || '',
      employmentType: s.employmentType || '',
      joiningDate: s.joiningDate || '',
      assignedClasses: Array.isArray(s.assignedClasses) ? s.assignedClasses.join(', ') : String(s.assignedClasses || ''),
      assignedSubjects: Array.isArray(s.assignedSubjects) ? s.assignedSubjects.join(', ') : String(s.assignedSubjects || ''),
      status: s.status || 'ACTIVE'
    }));

    Audit.log('EXPORT_STAFF_CSV', session.role, session.userId, {
      exportedCount: cleanRows.length,
      filters: payload
    }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      data: {
        staff: cleanRows,
        total: cleanRows.length
      }
    };
  },

  /**
   * Links a Staff member's profile to their user authentication account.
   */
  linkStaffAccount: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can link staff accounts' } };
    }

    payload = payload || {};
    const staffId = String(payload.staffId || '').trim();
    if (!staffId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'staffId is required' } };
    }

    const staff = Database.findByPk('Staff', staffId);
    if (!staff) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Staff member not found' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    if (payload.role) staff.role = String(payload.role).toUpperCase();
    if (payload.password) {
      const salt = Auth.generateSalt(16);
      staff.passwordHash = Auth.hashPassword(payload.password, salt);
      staff.salt = salt;
      staff.isCustomPassword = true;
    }
    staff.updatedAt = nowStr;
    Database.upsertBatch('Staff', [staff]);

    Audit.log('LINK_STAFF_ACCOUNT', session.role, session.userId, {
      staffId: staffId,
      name: staff.staffName,
      role: staff.role
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Staff account linked successfully for ${staff.staffName}`,
      data: {
        staffId: staff.staffId,
        staffName: staff.staffName,
        role: staff.role,
        isCustomPassword: staff.isCustomPassword
      }
    };
  },

  /**
   * Registers a Parent account and links children.
   */
  registerParent: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL', 'TEACHER'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to register parent' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const mobile = String(payload.mobile || '').replace(/\D/g, '').slice(-10);
    if (!mobile || mobile.length !== 10) {
      return { success: false, error: { code: 'INVALID_MOBILE', message: 'A valid 10-digit mobile number is required' } };
    }

    const parentId = payload.parentId || `PAR_${mobile}`;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const commonPassword = Auth.getCommonSchoolPassword(schoolId);
    const salt = Auth.generateSalt(16);
    const passwordHash = Auth.hashPassword(payload.password || commonPassword, salt);

    const parentRecord = {
      parentId: parentId,
      schoolId: schoolId,
      mobile: mobile,
      parentName: payload.parentName || 'Parent',
      passwordHash: passwordHash,
      salt: salt,
      isCustomPassword: !!payload.password,
      status: payload.status || 'Active',
      createdAt: payload.createdAt || nowStr,
      updatedAt: nowStr
    };

    Database.upsertBatch('Parents', [parentRecord]);

    // Link children if provided
    if (Array.isArray(payload.studentIds)) {
      const linkRecords = payload.studentIds.map(function(sid) {
        return {
          linkId: `LNK_${parentId}_${sid}`,
          schoolId: schoolId,
          parentId: parentId,
          studentId: sid,
          relationship: payload.relationship || 'Parent',
          active: true,
          createdAt: nowStr,
          updatedAt: nowStr
        };
      });
      Database.upsertBatch('ParentStudentLinks', linkRecords);
    }

    Audit.log('REGISTER_PARENT', session.role, session.userId, { parentId: parentId, mobile: mobile }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      data: {
        parentId: parentId,
        message: 'Parent account registered and linked successfully'
      }
    };
  },

  /**
   * Links a student to a parent account.
   */
  linkParentStudent: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL', 'TEACHER'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to link parent-student' } };
    }

    const parentId = payload.parentId;
    const studentId = payload.studentId;
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    if (!parentId || !studentId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'parentId and studentId are required' } };
    }

    const linkRecord = {
      linkId: `LNK_${parentId}_${studentId}`,
      schoolId: schoolId,
      parentId: parentId,
      studentId: studentId,
      relationship: payload.relationship || 'Parent',
      active: true,
      createdAt: nowStr,
      updatedAt: nowStr
    };

    Database.upsertBatch('ParentStudentLinks', [linkRecord]);
    Audit.log('LINK_PARENT_STUDENT', session.role, session.userId, { parentId: parentId, studentId: studentId }, 'SUCCESS', '', schoolId);

    return { success: true, message: 'Student linked to parent successfully' };
  },

  /**
   * Auto-provisions Parent accounts and ParentStudentLinks from a student list.
   */
  provisionParentsFromStudents: function(students, actorRole, actorId, schoolId) {
    schoolId = schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const commonPassword = Auth.getCommonSchoolPassword(schoolId);

    const existingParents = Database.readAll('Parents');
    const existingParentMap = new Map(existingParents.map(p => [String(p.mobile).replace(/\D/g, '').slice(-10), p]));

    const newParents = [];
    const newLinks = [];

    students.forEach(function(s) {
      const mob = String(s.mobile || '').replace(/\D/g, '').slice(-10);
      if (mob.length !== 10) return;

      const sid = s.studentId || s.id;
      if (!sid) return;

      let parentId = `PAR_${mob}`;
      let pName = s.fatherName || s.motherName || 'Parent';

      if (!existingParentMap.has(mob)) {
        const salt = Auth.generateSalt(16);
        const parentRecord = {
          parentId: parentId,
          schoolId: schoolId,
          mobile: mob,
          parentName: pName,
          passwordHash: Auth.hashPassword(commonPassword, salt),
          salt: salt,
          isCustomPassword: false,
          status: 'Active',
          createdAt: nowStr,
          updatedAt: nowStr
        };
        newParents.push(parentRecord);
        existingParentMap.set(mob, parentRecord);
      }

      newLinks.push({
        linkId: `LNK_${parentId}_${sid}`,
        schoolId: schoolId,
        parentId: parentId,
        studentId: sid,
        relationship: s.fatherName ? 'Father' : (s.motherName ? 'Mother' : 'Guardian'),
        active: true,
        createdAt: nowStr,
        updatedAt: nowStr
      });
    });

    if (newParents.length > 0) Database.upsertBatch('Parents', newParents);
    if (newLinks.length > 0) Database.upsertBatch('ParentStudentLinks', newLinks);

    Audit.log('AUTO_PROVISION_PARENTS', actorRole || 'ADMIN', actorId || 'SYSTEM', { newParents: newParents.length, newLinks: newLinks.length }, 'SUCCESS', '', schoolId);

    return {
      parentsCreated: newParents.length,
      linksCreated: newLinks.length
    };
  },

  /**
   * Resets all parent or staff accounts to the common school password.
   */
  resetAllPasswordsToCommon: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can reset all passwords' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const targetRole = (payload.targetRole || 'PARENT').toUpperCase();
    const commonPassword = Auth.getCommonSchoolPassword(schoolId);
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    let resetCount = 0;

    if (targetRole === 'PARENT' || targetRole === 'ALL') {
      const parents = Database.readAll('Parents');
      const updatedParents = parents.map(function(p) {
        const salt = Auth.generateSalt(16);
        p.passwordHash = Auth.hashPassword(commonPassword, salt);
        p.salt = salt;
        p.isCustomPassword = false;
        p.updatedAt = nowStr;
        return p;
      });
      if (updatedParents.length > 0) {
        Database.upsertBatch('Parents', updatedParents);
        resetCount += updatedParents.length;
      }
    }

    if (targetRole === 'STAFF' || targetRole === 'ALL') {
      const staffList = Database.readAll('Staff');
      const updatedStaff = staffList.map(function(s) {
        const salt = Auth.generateSalt(16);
        s.passwordHash = Auth.hashPassword(commonPassword, salt);
        s.salt = salt;
        s.isCustomPassword = false;
        s.updatedAt = nowStr;
        return s;
      });
      if (updatedStaff.length > 0) {
        Database.upsertBatch('Staff', updatedStaff);
        resetCount += updatedStaff.length;
      }
    }

    Audit.log('RESET_ALL_PASSWORDS', session.role, session.userId, { targetRole: targetRole, resetCount: resetCount }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Reset ${resetCount} accounts to common school password (${commonPassword})`
    };
  },

  /**
   * Retrieves high-level administrative summary & health statistics.
   */
  getAdminSummary: function(session, payload) {
    if (!session || (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL']) && session.role !== 'ADMIN' && session.role !== 'PRINCIPAL')) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized access to Admin summary' } };
    }

    const schoolId = (session && session.schoolId) || (payload && payload.schoolId) || DEFAULT_SCHOOL_ID;
    const students = Database.readAll('Students');
    const parents = Database.readAll('Parents');
    const staff = Database.readAll('Staff');
    const attendance = Database.readAll('Attendance');
    const marks = Database.readAll('Marks');
    const notes = Database.readAll('Notes');
    const syncs = Database.readAll('SyncMetadata');

    return {
      success: true,
      data: {
        schoolId: schoolId,
        schoolName: DEFAULT_SCHOOL_NAME,
        counts: {
          students: students.length,
          parents: parents.length,
          staff: staff.length,
          attendanceRecords: attendance.length,
          marksRecords: marks.length,
          notesCount: notes.length,
          totalSyncBatches: syncs.length
        },
        serverTime: Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'")
      }
    };
  },

  /**
   * Safe selective reset of Parent Portal cloud data.
   * Strictly preserves Students master directory and system configurations.
   */
  resetParentPortalData: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only System Admin can perform cloud data reset' } };
    }

    const confirmation = payload.confirmation;
    if (confirmation !== 'RESET') {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Confirmation string "RESET" required' } };
    }

    const categories = payload.categories || [];
    if (!Array.isArray(categories) || categories.length === 0) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'No categories selected for reset' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    const categoryToSheet = {
      'parents': 'Parents',
      'parent_students': 'ParentStudentLinks',
      'attendance': 'Attendance',
      'marks': 'Marks',
      'activities': 'Activities',
      'notices': 'Notices',
      'documents': 'Documents',
      'achievements': 'Achievements'
    };

    const countsBefore = {};
    const countsAfter = {};
    const summary = {};
    const processedCategories = [];

    categories.forEach(cat => {
      const sheetName = categoryToSheet[cat];
      if (sheetName) {
        const rows = Database.readAll(sheetName);
        countsBefore[cat] = rows.length;

        // Filter by schoolId if applicable, or clear entire sheet for global tables
        // For simplicity and matching SITE_DATA_RESET.md intent, we clear the sheets
        Database.clearSheet(sheetName);

        countsAfter[cat] = 0;
        summary[cat] = `${countsBefore[cat]} records cleared`;
        processedCategories.push(cat);
      }
    });

    // Handle virtual category derived_notifications
    if (categories.includes('derived_notifications')) {
      summary['derived_notifications'] = "Ephemeral notification cache cleared";
      processedCategories.push('derived_notifications');
    }

    Audit.log('SITE_DATA_RESET', session.role, session.userId, {
      categories: processedCategories,
      countsBefore: countsBefore,
      countsAfter: countsAfter
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      action: 'reset_parent_portal_data',
      message: 'Parent Portal cloud data reset successfully.',
      data: {
        success: true,
        categories: processedCategories,
        countsBefore: countsBefore,
        countsAfter: countsAfter,
        summary: summary,
        protected: {
          students: 'Preserved (Master Records)',
          academicCalendar: 'Preserved (Official ASSEB 254 Working Days)',
          androidLocalData: 'Preserved (Offline-First Device Storage)',
          faceRecognition: 'Preserved (Local Biometric Descriptors)',
          googleDriveBackup: 'Preserved (Cloud Archive)',
          adminCredentials: 'Preserved (ADMIN_API_KEY & SERVER_SECRET)'
        },
        timestamp: nowStr
      }
    };
  },

  /**
   * Sets the active Academic Year for the school.
   * Atomically updates Settings.ACADEMIC_YEAR and AcademicYears.isCurrent.
   * Strictly preserves all historical records.
   */
  setActiveAcademicYear: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can change active academic year' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const yearId = String(payload.yearId || payload.yearName || payload.academicYear || '').trim();
    if (!yearId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'yearId or academicYear is required' } };
    }

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    let allYears = Database.readAll('AcademicYears');

    if (allYears.length === 0) {
      allYears = [
        {
          yearId: 'AY_2026_2027',
          schoolId: schoolId,
          yearName: '2026-2027',
          startDate: '2026-04-01',
          endDate: '2027-03-31',
          status: 'Active',
          isCurrent: true,
          createdAt: nowStr,
          updatedAt: nowStr
        },
        {
          yearId: 'AY_2025_2026',
          schoolId: schoolId,
          yearName: '2025-2026',
          startDate: '2025-04-01',
          endDate: '2026-03-31',
          status: 'Completed',
          isCurrent: false,
          createdAt: nowStr,
          updatedAt: nowStr
        }
      ];
    }

    let targetYear = allYears.find(y => y.yearId === yearId || y.yearName === yearId);
    if (!targetYear) {
      const yName = payload.yearName || yearId;
      targetYear = {
        yearId: `AY_${yName.replace(/[^a-zA-Z0-9]/g, '_')}`,
        schoolId: schoolId,
        yearName: yName,
        startDate: payload.startDate || `${yName.substring(0, 4)}-04-01`,
        endDate: payload.endDate || `${parseInt(yName.substring(0, 4), 10) + 1}-03-31`,
        status: 'Active',
        isCurrent: true,
        createdAt: nowStr,
        updatedAt: nowStr
      };
      allYears.push(targetYear);
    }

    allYears.forEach(y => {
      const isTarget = (y.yearId === targetYear.yearId || y.yearName === targetYear.yearName);
      y.isCurrent = isTarget;
      if (isTarget) {
        y.status = 'Active';
      } else if (y.status === 'Active') {
        y.status = 'Completed';
      }
      y.updatedAt = nowStr;
    });

    Database.upsertBatch('AcademicYears', allYears);

    const settingRecord = {
      key: 'ACADEMIC_YEAR',
      schoolId: schoolId,
      value: targetYear.yearName,
      category: 'GENERAL',
      description: 'Current Active Academic Session',
      updatedAt: nowStr
    };
    Database.upsertBatch('Settings', [settingRecord]);

    Audit.log('SET_ACTIVE_ACADEMIC_YEAR', session.role, session.userId, {
      yearId: targetYear.yearId,
      yearName: targetYear.yearName
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Active Academic Year updated to ${targetYear.yearName}`,
      data: {
        activeYear: targetYear.yearName,
        yearId: targetYear.yearId,
        academicYears: allYears
      }
    };
  },

  /**
   * Assigns or updates roll numbers for students in a specific academic year and class.
   * Detects and rejects duplicate roll numbers within the same class/section/year.
   */
  assignRollNumbers: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL', 'TEACHER'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to assign roll numbers' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const targetClass = String(payload.class || '').trim();
    const targetSection = String(payload.section || '').trim();
    const currentActiveSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const academicYear = String(payload.academicYear || (currentActiveSetting ? currentActiveSetting.value : '2026-2027')).trim();
    const assignments = payload.assignments || [];

    if (!targetClass) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Class is required' } };
    }

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Assignments array is required' } };
    }

    if (session.role === 'TEACHER' && !Security.canAccessClass(session, targetClass)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: `Teacher not authorized to assign roll numbers for class ${targetClass}` } };
    }

    // 1. Check for duplicates within input assignments
    const rollSet = new Set();
    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i];
      const rollStr = String(a.rollNo || '').trim();
      if (!rollStr) continue;
      if (rollSet.has(rollStr)) {
        return {
          success: false,
          error: {
            code: 'DUPLICATE_ROLL_NUMBER',
            message: `Duplicate roll number "${rollStr}" detected within assignment list`
          }
        };
      }
      rollSet.add(rollStr);
    }

    // 2. Check for duplicates against existing enrolled students in the same class/section/year
    const existingEnrollments = Database.readAll('Enrollments').filter(e => {
      const matchSchool = !e.schoolId || e.schoolId === schoolId;
      const matchYear = !e.academicYear || e.academicYear === academicYear;
      const matchClass = String(e.class) === targetClass;
      const matchSec = !targetSection || !e.section || String(e.section) === targetSection;
      return matchSchool && matchYear && matchClass && matchSec;
    });

    const assignedStudentIds = new Set(assignments.map(a => String(a.studentId)));
    for (let i = 0; i < existingEnrollments.length; i++) {
      const e = existingEnrollments[i];
      if (!assignedStudentIds.has(String(e.studentId))) {
        const existingRoll = String(e.rollNo || '').trim();
        if (existingRoll && rollSet.has(existingRoll)) {
          return {
            success: false,
            error: {
              code: 'DUPLICATE_ROLL_NUMBER',
              message: `Roll number "${existingRoll}" is already assigned to student ${e.studentId} in Class ${targetClass} (${academicYear})`
            }
          };
        }
      }
    }

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const isCurrentActiveYear = !currentActiveSetting || currentActiveSetting.value === academicYear;

    const updatedEnrollments = [];
    const updatedStudents = [];

    assignments.forEach(a => {
      const sid = String(a.studentId);
      const newRoll = String(a.rollNo || '').trim();
      const enrollmentId = `ENR_${sid}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}`;

      let enr = Database.findByPk('Enrollments', enrollmentId);
      if (!enr) {
        enr = {
          enrollmentId: enrollmentId,
          schoolId: schoolId,
          studentId: sid,
          academicYear: academicYear,
          class: targetClass,
          section: targetSection || 'A',
          rollNo: newRoll,
          status: 'ACTIVE',
          promotionDecision: 'PENDING',
          remarks: 'Assigned via roll number manager',
          createdAt: nowStr,
          updatedAt: nowStr
        };
      } else {
        enr.rollNo = newRoll;
        enr.updatedAt = nowStr;
      }
      updatedEnrollments.push(enr);

      if (isCurrentActiveYear) {
        const student = Database.findByPk('Students', sid);
        if (student) {
          student.rollNo = newRoll;
          student.updatedAt = nowStr;
          updatedStudents.push(student);
        }
      }
    });

    if (updatedEnrollments.length > 0) Database.upsertBatch('Enrollments', updatedEnrollments);
    if (updatedStudents.length > 0) Database.upsertBatch('Students', updatedStudents);

    Audit.log('ASSIGN_ROLL_NUMBERS', session.role, session.userId, {
      class: targetClass,
      section: targetSection,
      academicYear: academicYear,
      count: assignments.length
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Successfully assigned ${assignments.length} roll numbers for Class ${targetClass}`,
      data: {
        assignedCount: assignments.length,
        class: targetClass,
        academicYear: academicYear
      }
    };
  },

  /**
   * Promotes or retains a batch of students from a source academic year/class to a target year/class.
   * Creates new target Enrollment records without deleting or modifying historical academic logs.
   */
  promoteStudents: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can execute student promotions' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const sourceYear = String(payload.sourceAcademicYear || payload.sourceYear || '').trim();
    const targetYear = String(payload.targetAcademicYear || payload.targetYear || '').trim();
    const promotions = payload.promotions || [];

    if (!sourceYear || !targetYear) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'sourceAcademicYear and targetAcademicYear are required' } };
    }

    if (!Array.isArray(promotions) || promotions.length === 0) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'Promotions list cannot be empty' } };
    }

    const currentActiveSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const isTargetCurrentYear = currentActiveSetting && currentActiveSetting.value === targetYear;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    const newEnrollments = [];
    const sourceEnrollments = [];
    const updatedStudents = [];

    const targetRollsByClass = new Map();

    for (let i = 0; i < promotions.length; i++) {
      const p = promotions[i];
      const sid = String(p.studentId);
      const decision = String(p.decision || 'PROMOTED').toUpperCase();
      const srcCls = String(p.sourceClass || '9');
      let tgtCls = String(p.targetClass || (srcCls === '9' ? '10' : (srcCls === '10' ? '11' : (srcCls === '11' ? '12' : 'COMPLETED'))));
      const tgtSec = String(p.targetSection || p.section || 'A');
      const newRoll = String(p.newRollNo || '').trim();

      if (decision === 'COMPLETED' || srcCls === '12') {
        tgtCls = 'COMPLETED';
      } else if (decision === 'NOT_PROMOTED' || decision === 'RETAINED') {
        tgtCls = srcCls;
      }

      if (newRoll && tgtCls !== 'COMPLETED') {
        const classKey = `${tgtCls}_${tgtSec}`;
        if (!targetRollsByClass.has(classKey)) {
          targetRollsByClass.set(classKey, new Set());
        }
        const set = targetRollsByClass.get(classKey);
        if (set.has(newRoll)) {
          return {
            success: false,
            error: {
              code: 'DUPLICATE_ROLL_NUMBER',
              message: `Duplicate roll number "${newRoll}" assigned in target Class ${tgtCls} (${targetYear})`
            }
          };
        }
        set.add(newRoll);
      }

      // 1. Update source year enrollment
      const srcEnrId = `ENR_${sid}_${sourceYear.replace(/[^a-zA-Z0-9]/g, '_')}`;
      let srcEnr = Database.findByPk('Enrollments', srcEnrId);
      if (!srcEnr) {
        srcEnr = {
          enrollmentId: srcEnrId,
          schoolId: schoolId,
          studentId: sid,
          academicYear: sourceYear,
          class: srcCls,
          section: 'A',
          rollNo: '',
          status: decision === 'PROMOTED' ? 'PROMOTED' : (decision === 'COMPLETED' ? 'COMPLETED' : 'RETAINED'),
          promotionDecision: decision,
          remarks: p.remarks || '',
          createdAt: nowStr,
          updatedAt: nowStr
        };
      } else {
        srcEnr.promotionDecision = decision;
        srcEnr.status = decision === 'PROMOTED' ? 'PROMOTED' : (decision === 'COMPLETED' ? 'COMPLETED' : 'RETAINED');
        srcEnr.updatedAt = nowStr;
      }
      sourceEnrollments.push(srcEnr);

      // 2. Create target year enrollment
      if (decision !== 'TRANSFERRED' && decision !== 'WITHDRAWN') {
        const tgtEnrId = `ENR_${sid}_${targetYear.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const tgtStatus = tgtCls === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE';
        const tgtEnr = {
          enrollmentId: tgtEnrId,
          schoolId: schoolId,
          studentId: sid,
          academicYear: targetYear,
          class: tgtCls,
          section: tgtSec,
          rollNo: newRoll,
          status: tgtStatus,
          promotionDecision: 'PENDING',
          remarks: p.remarks || `Promoted from Class ${srcCls} (${sourceYear})`,
          createdAt: nowStr,
          updatedAt: nowStr
        };
        newEnrollments.push(tgtEnr);
      }

      // 3. Update master Students record if target year is the active year
      if (isTargetCurrentYear) {
        const student = Database.findByPk('Students', sid);
        if (student) {
          if (tgtCls === 'COMPLETED') {
            student.status = 'Completed';
          } else {
            student.class = tgtCls;
            student.section = tgtSec;
            if (newRoll) student.rollNo = newRoll;
            student.status = 'Active';
          }
          student.updatedAt = nowStr;
          updatedStudents.push(student);
        }
      }
    }

    if (sourceEnrollments.length > 0) Database.upsertBatch('Enrollments', sourceEnrollments);
    if (newEnrollments.length > 0) Database.upsertBatch('Enrollments', newEnrollments);
    if (updatedStudents.length > 0) Database.upsertBatch('Students', updatedStudents);

    Audit.log('STUDENT_PROMOTION', session.role, session.userId, {
      sourceYear: sourceYear,
      targetYear: targetYear,
      count: promotions.length
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Successfully processed ${promotions.length} promotions from ${sourceYear} to ${targetYear}`,
      data: {
        processedCount: promotions.length,
        sourceYear: sourceYear,
        targetYear: targetYear
      }
    };
  },

  /**
   * Updates examination lifecycle status (DRAFT, OPEN, LOCKED, PUBLISHED, ARCHIVED).
   * Strictly enforces Admin / Principal permissions.
   */
  setExaminationStatus: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can change examination status' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const examId = String(payload.examId || '').trim();
    const examName = String(payload.examName || payload.exam || '').trim();
    const targetClass = String(payload.class || '').trim();
    const newStatus = String(payload.status || 'OPEN').toUpperCase().trim();
    const validStatuses = ['DRAFT', 'OPEN', 'LOCKED', 'PUBLISHED', 'ARCHIVED'];

    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: { code: 'BAD_REQUEST', message: `Invalid status "${newStatus}". Must be one of: ${validStatuses.join(', ')}` } };
    }

    let allExams = Database.readAll('Examinations');
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    let targetExam = allExams.find(e => (examId && e.examId === examId) || (!examId && e.examName === examName && (!targetClass || String(e.class) === targetClass)));

    if (!targetExam && (examId || examName)) {
      const eName = examName || examId;
      targetExam = {
        examId: examId || `EXAM_${(targetClass || 'ALL')}_${eName.replace(/[^a-zA-Z0-9]/g, '_')}`,
        schoolId: schoolId,
        academicYear: payload.academicYear || '2026-2027',
        class: targetClass || '9',
        examName: eName,
        examType: payload.examType || 'UNIT_1',
        startDate: payload.startDate || '',
        endDate: payload.endDate || '',
        status: newStatus,
        createdAt: nowStr,
        updatedAt: nowStr
      };
      allExams.push(targetExam);
    } else if (targetExam) {
      targetExam.status = newStatus;
      targetExam.updatedAt = nowStr;
    } else {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'examId or examName required' } };
    }

    Database.upsertBatch('Examinations', [targetExam]);

    // If PUBLISHED, update corresponding ExamResults
    if (newStatus === 'PUBLISHED') {
      const results = Database.readAll('ExamResults');
      const updatedResults = [];
      results.forEach(r => {
        const matchExam = r.examId === targetExam.examId || r.examName === targetExam.examName;
        const matchClass = !targetClass || String(r.class) === targetClass;
        if (matchExam && matchClass) {
          r.resultStatus = 'PUBLISHED';
          r.publishedAt = nowStr;
          r.updatedAt = nowStr;
          updatedResults.push(r);
        }
      });
      if (updatedResults.length > 0) {
        Database.upsertBatch('ExamResults', updatedResults);
      }
    }

    Audit.log('SET_EXAMINATION_STATUS', session.role, session.userId, {
      examId: targetExam.examId,
      examName: targetExam.examName,
      status: newStatus,
      class: targetExam.class
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Examination "${targetExam.examName}" status updated to ${newStatus}`,
      data: { examination: targetExam }
    };
  },

  /**
   * Calculates and publishes official examination results.
   * Authoritatively updates resultStatus to PUBLISHED.
   */
  publishExamResults: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can publish examination results' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const academicYear = payload.academicYear || '2026-2027';
    const targetClass = String(payload.class || '9').trim();
    const examName = String(payload.examName || payload.exam || '1st Unit Test').trim();
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    const calcRes = AcademicApi.calculateExamResults(session, {
      academicYear: academicYear,
      class: targetClass,
      examName: examName
    });

    if (!calcRes.success) {
      return calcRes;
    }

    let allExams = Database.readAll('Examinations');
    let exam = allExams.find(e => e.examName === examName && String(e.class) === targetClass);
    if (!exam) {
      exam = {
        examId: `EXAM_${targetClass}_${examName.replace(/[^a-zA-Z0-9]/g, '_')}`,
        schoolId: schoolId,
        academicYear: academicYear,
        class: targetClass,
        examName: examName,
        examType: 'UNIT_1',
        status: 'PUBLISHED',
        createdAt: nowStr,
        updatedAt: nowStr
      };
    } else {
      exam.status = 'PUBLISHED';
      exam.updatedAt = nowStr;
    }
    Database.upsertBatch('Examinations', [exam]);

    const results = Database.readAll('ExamResults');
    const publishedList = [];
    results.forEach(r => {
      if (r.academicYear === academicYear && String(r.class) === targetClass && (r.examName === examName || r.examId === exam.examId)) {
        r.resultStatus = 'PUBLISHED';
        r.publishedAt = nowStr;
        r.updatedAt = nowStr;
        publishedList.push(r);
      }
    });

    if (publishedList.length > 0) {
      Database.upsertBatch('ExamResults', publishedList);
    }

    Audit.log('PUBLISH_EXAM_RESULTS', session.role, session.userId, {
      academicYear: academicYear,
      class: targetClass,
      examName: examName,
      publishedCount: publishedList.length
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Successfully published ${publishedList.length} results for Class ${targetClass} (${examName})`,
      data: {
        publishedCount: publishedList.length,
        academicYear: academicYear,
        class: targetClass,
        examName: examName,
        status: 'PUBLISHED',
        publishedAt: nowStr
      }
    };
  },

  // ==========================================
  // STUDENT MANAGEMENT & ACADEMIC OPERATIONS
  // ==========================================

  /**
   * Safe duplicate student detector.
   * Checks studentId, admissionNo, mobile, and (name + dob).
   */
  checkDuplicateStudent: function(session, payload) {
    const allStudents = Database.readAll('Students');
    const duplicates = [];
    const targetSid = String(payload.studentId || '').trim();
    const targetAdm = String(payload.admissionNo || '').trim().toLowerCase();
    const targetName = String(payload.studentName || payload.name || '').trim().toLowerCase();
    const targetDob = String(payload.dob || '').trim();
    const targetMobile = String(payload.mobile || '').replace(/[^0-9]/g, '');

    for (let i = 0; i < allStudents.length; i++) {
      const s = allStudents[i];
      const sSid = String(s.studentId || '').trim();
      if (targetSid && sSid === targetSid) {
        duplicates.push({ reason: 'MATCHING_STUDENT_ID', field: 'studentId', existingStudent: AcademicApi.sanitizeStudent(s) });
        continue;
      }
      const sAdm = String(s.admissionNo || '').trim().toLowerCase();
      if (targetAdm && sAdm && sAdm === targetAdm && (!targetSid || sSid !== targetSid)) {
        duplicates.push({ reason: 'MATCHING_ADMISSION_NO', field: 'admissionNo', existingStudent: AcademicApi.sanitizeStudent(s) });
        continue;
      }
      const sName = String(s.studentName || '').trim().toLowerCase();
      const sDob = String(s.dob || '').trim();
      if (targetName && targetDob && sName === targetName && sDob === targetDob && (!targetSid || sSid !== targetSid)) {
        duplicates.push({ reason: 'MATCHING_NAME_AND_DOB', field: 'name_dob', existingStudent: AcademicApi.sanitizeStudent(s) });
        continue;
      }
      const sMobile = String(s.mobile || '').replace(/[^0-9]/g, '');
      if (targetMobile && targetMobile.length >= 10 && sMobile === targetMobile && (!targetSid || sSid !== targetSid)) {
        duplicates.push({ reason: 'MATCHING_MOBILE', field: 'mobile', existingStudent: AcademicApi.sanitizeStudent(s) });
      }
    }

    return {
      success: true,
      data: {
        isDuplicate: duplicates.length > 0,
        duplicates: duplicates,
        matchCount: duplicates.length
      }
    };
  },

  /**
   * Formal Student Admission / Registration.
   * Validates DOB, class, year, checks duplicates, inserts Students & initial active Enrollment.
   */
  admitStudent: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can register or admit students' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const studentName = String(payload.studentName || payload.name || '').trim();
    const rawClass = String(payload.class || '9').trim();
    const section = String(payload.section || 'A').trim().toUpperCase();
    const currentSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const academicYear = String(payload.academicYear || (currentSetting ? currentSetting.value : '2026-2027')).trim();
    const dob = String(payload.dob || '').trim();
    const admissionNo = String(payload.admissionNo || '').trim();
    const admissionDate = String(payload.admissionDate || nowStr.split('T')[0]).trim();
    const gender = String(payload.gender || 'Male').trim();
    const category = String(payload.category || 'General').trim();
    const bloodGroup = String(payload.bloodGroup || '').trim();
    const mobile = String(payload.mobile || '').trim();
    const stream = String(payload.stream || 'Information Technology (IT/ITeS)').trim();

    if (!studentName) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Student Name is required' } };
    }
    if (!dob) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Date of Birth is required' } };
    }
    const dobDate = new Date(dob);
    const today = new Date();
    if (isNaN(dobDate.getTime()) || dobDate >= today) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid Date of Birth: Must be a valid date in the past' } };
    }
    const age = today.getFullYear() - dobDate.getFullYear();
    if (age < 5 || age > 30) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: `Invalid student age (${age} years): Must be between 5 and 30 years` } };
    }
    if (!['9', '10', '11', '12'].includes(rawClass)) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: `Invalid Class: ${rawClass}. Expected 9, 10, 11, or 12` } };
    }

    // Duplicate Check (unless forceCreate is confirmed)
    if (payload.forceCreate !== true) {
      const dupCheck = this.checkDuplicateStudent(session, {
        studentName: studentName,
        dob: dob,
        admissionNo: admissionNo,
        mobile: mobile
      });
      if (dupCheck.data.isDuplicate) {
        return {
          success: false,
          error: {
            code: 'POSSIBLE_DUPLICATE_STUDENT',
            message: `Found ${dupCheck.data.matchCount} possible duplicate student record(s)`,
            duplicates: dupCheck.data.duplicates
          }
        };
      }
    }

    const studentId = String(payload.studentId || '').trim() || (`STU_${rawClass}_${Date.now().toString().slice(-6)}`);
    const rollNo = String(payload.rollNo || payload.roll || '').trim();

    const studentRecord = {
      studentId: studentId,
      schoolId: schoolId,
      admissionNo: admissionNo || `ADM-${academicYear.slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`,
      studentName: studentName,
      rollNo: rollNo,
      class: rawClass,
      section: section,
      gender: gender,
      dob: dob,
      fatherName: String(payload.fatherName || '').trim(),
      motherName: String(payload.motherName || '').trim(),
      mobile: mobile,
      aadhaar: String(payload.aadhaar || '').trim(),
      village: String(payload.village || '').trim(),
      address: String(payload.address || '').trim(),
      district: String(payload.district || 'Biswanath').trim(),
      state: String(payload.state || 'Assam').trim(),
      pinCode: String(payload.pinCode || '784176').trim(),
      category: category,
      bloodGroup: bloodGroup,
      stream: stream,
      admissionDate: admissionDate,
      status: 'ACTIVE',
      createdAt: nowStr,
      updatedAt: nowStr
    };

    Database.upsertBatch('Students', [studentRecord]);

    // Create Initial Active Enrollment Record
    const enrId = `ENR_${studentId}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const enrollmentRecord = {
      enrollmentId: enrId,
      schoolId: schoolId,
      studentId: studentId,
      academicYear: academicYear,
      class: rawClass,
      section: section,
      rollNo: rollNo,
      status: 'ACTIVE',
      promotionDecision: 'ACTIVE',
      remarks: payload.remarks || 'New Admission',
      createdAt: nowStr,
      updatedAt: nowStr
    };
    Database.upsertBatch('Enrollments', [enrollmentRecord]);

    // Parent/Guardian Linking
    if (payload.parentMobile && (payload.fatherName || payload.motherName || payload.parentName)) {
      const pName = String(payload.parentName || payload.fatherName || payload.motherName).trim();
      const pMobile = String(payload.parentMobile || mobile).replace(/[^0-9]/g, '');
      if (pMobile.length >= 10) {
        this.linkParentStudent(session, {
          studentId: studentId,
          parentName: pName,
          parentMobile: pMobile,
          relationship: payload.relationship || (payload.fatherName ? 'Father' : (payload.motherName ? 'Mother' : 'Guardian'))
        });
      }
    }

    Audit.log('ADMIT_STUDENT', session.role, session.userId, {
      studentId: studentId,
      admissionNo: studentRecord.admissionNo,
      studentName: studentName,
      class: rawClass,
      academicYear: academicYear
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Successfully registered student ${studentName} (${studentRecord.admissionNo})`,
      data: {
        student: AcademicApi.sanitizeStudent(studentRecord),
        enrollment: enrollmentRecord
      }
    };
  },

  /**
   * Updates an existing student's profile information.
   * Protects immutable studentId, validates unique admissionNo, and logs audit record.
   */
  updateStudentProfile: function(session, payload) {
    const studentId = String(payload.studentId || payload.id || '').trim();
    if (!studentId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'studentId is required' } };
    }

    let student = Database.findByPk('Students', studentId);
    if (!student) {
      return { success: false, error: { code: 'NOT_FOUND', message: `Student not found: ${studentId}` } };
    }

    // Role check: Admin, Principal, or Teacher assigned to student's class
    if (!Security.canAccessStudent(session, studentId, student.class)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to update this student record' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    // Unique Admission Number check
    if (payload.admissionNo && String(payload.admissionNo).trim() !== String(student.admissionNo || '').trim()) {
      const newAdm = String(payload.admissionNo).trim().toLowerCase();
      const allStudents = Database.readAll('Students');
      const conflict = allStudents.find(s => String(s.studentId) !== studentId && String(s.admissionNo || '').trim().toLowerCase() === newAdm);
      if (conflict) {
        return { success: false, error: { code: 'DUPLICATE_ADMISSION_NO', message: `Admission number "${payload.admissionNo}" is already in use by student ${conflict.studentName}` } };
      }
      student.admissionNo = String(payload.admissionNo).trim();
    }

    // Update mutable fields
    if (payload.studentName) student.studentName = String(payload.studentName).trim();
    if (payload.dob) {
      const d = new Date(payload.dob);
      if (isNaN(d.getTime()) || d >= new Date()) {
        return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid Date of Birth' } };
      }
      student.dob = String(payload.dob).trim();
    }
    if (payload.gender) student.gender = String(payload.gender).trim();
    if (payload.category) student.category = String(payload.category).trim();
    if (payload.bloodGroup !== undefined) student.bloodGroup = String(payload.bloodGroup).trim();
    if (payload.fatherName !== undefined) student.fatherName = String(payload.fatherName).trim();
    if (payload.motherName !== undefined) student.motherName = String(payload.motherName).trim();
    if (payload.mobile !== undefined) student.mobile = String(payload.mobile).trim();
    if (payload.aadhaar !== undefined) student.aadhaar = String(payload.aadhaar).trim();
    if (payload.village !== undefined) student.village = String(payload.village).trim();
    if (payload.address !== undefined) student.address = String(payload.address).trim();
    if (payload.district !== undefined) student.district = String(payload.district).trim();
    if (payload.state !== undefined) student.state = String(payload.state).trim();
    if (payload.pinCode !== undefined) student.pinCode = String(payload.pinCode).trim();
    if (payload.stream !== undefined) student.stream = String(payload.stream).trim();
    if (payload.admissionDate !== undefined) student.admissionDate = String(payload.admissionDate).trim();
    student.updatedAt = nowStr;

    Database.upsertBatch('Students', [student]);

    Audit.log('UPDATE_STUDENT_PROFILE', session.role, session.userId, {
      studentId: studentId,
      studentName: student.studentName,
      updatedFields: Object.keys(payload).filter(k => k !== 'studentId')
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Updated student profile for ${student.studentName}`,
      data: { student: AcademicApi.sanitizeStudent(student) }
    };
  },

  /**
   * Updates a student's administrative status (ACTIVE, INACTIVE, TRANSFERRED, COMPLETED, LEFT_SCHOOL).
   * Automatically updates active enrollment while preserving historical records.
   */
  updateStudentStatus: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can change student status' } };
    }

    const studentId = String(payload.studentId || payload.id || '').trim();
    const newStatus = String(payload.status || '').trim().toUpperCase();
    const validStatuses = ['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'COMPLETED', 'LEFT_SCHOOL'];

    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: `Invalid status: ${newStatus}. Expected one of: ${validStatuses.join(', ')}` } };
    }

    let student = Database.findByPk('Students', studentId);
    if (!student) {
      return { success: false, error: { code: 'NOT_FOUND', message: `Student not found: ${studentId}` } };
    }

    const previousStatus = student.status;
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    student.status = newStatus;
    student.updatedAt = nowStr;
    Database.upsertBatch('Students', [student]);

    // Update current active enrollment if present
    const currentSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const activeYear = currentSetting ? currentSetting.value : '2026-2027';
    const enrollments = Database.readAll('Enrollments').filter(e => String(e.studentId) === studentId);
    enrollments.forEach(e => {
      if (e.academicYear === activeYear || e.status === 'ACTIVE' || e.isCurrent) {
        e.status = newStatus;
        e.promotionDecision = newStatus;
        e.remarks = payload.remarks || `Status changed from ${previousStatus} to ${newStatus}`;
        e.updatedAt = nowStr;
      }
    });
    if (enrollments.length > 0) {
      Database.upsertBatch('Enrollments', enrollments);
    }

    Audit.log('UPDATE_STUDENT_STATUS', session.role, session.userId, {
      studentId: studentId,
      previousStatus: previousStatus,
      newStatus: newStatus,
      reason: payload.reason || ''
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Updated status of ${student.studentName} to ${newStatus}`,
      data: {
        studentId: studentId,
        previousStatus: previousStatus,
        status: newStatus
      }
    };
  },

  /**
   * Aggregated 360° Student Master Profile.
   * Aggregates Student details, Parents, Active Enrollment, Academic History,
   * Attendance metrics, Exam Results, Issued Documents, and Audit Logs.
   */
  getStudentProfile: function(session, payload) {
    const studentId = String(payload.studentId || payload.id || '').trim();
    if (!studentId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'studentId is required' } };
    }

    const student = Database.findByPk('Students', studentId);
    if (!student) {
      return { success: false, error: { code: 'NOT_FOUND', message: `Student not found: ${studentId}` } };
    }

    // Role-based security check
    if (!Security.canAccessStudent(session, studentId, student.class)) {
      Audit.log('UNAUTHORIZED_STUDENT_PROFILE_ACCESS', session.role, session.userId, { studentId: studentId }, 'DENIED', '', session.schoolId);
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to requested student profile' } };
    }

    const sanitizedStudent = AcademicApi.sanitizeStudent(student);
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;

    // 1. Linked Parents
    const links = Database.readAll('ParentStudentLinks').filter(l => String(l.studentId) === studentId && (l.active === true || l.active === 'true' || l.status === 'ACTIVE'));
    const allParents = Database.readAll('Parents');
    const parentMap = new Map();
    allParents.forEach(p => parentMap.set(String(p.parentId), p));

    const linkedParents = links.map(l => {
      const p = parentMap.get(String(l.parentId)) || {};
      return {
        linkId: l.linkId,
        parentId: l.parentId,
        parentName: p.parentName || student.fatherName || student.motherName || 'Parent',
        mobile: p.mobile || student.mobile || '',
        relationship: l.relationship || 'Guardian',
        active: true
      };
    });

    // 2. Active Enrollment & Chronological History
    const allEnrollments = Database.readAll('Enrollments').filter(e => String(e.studentId) === studentId);
    const currentSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const activeYear = currentSetting ? currentSetting.value : '2026-2027';

    let currentEnrollment = allEnrollments.find(e => e.academicYear === activeYear) ||
      allEnrollments.find(e => e.status === 'ACTIVE') ||
      {
        enrollmentId: `ENR_${studentId}_${activeYear.replace(/[^a-zA-Z0-9]/g, '_')}`,
        schoolId: schoolId,
        studentId: studentId,
        academicYear: activeYear,
        class: student.class || '9',
        section: student.section || 'A',
        rollNo: student.rollNo || '',
        status: student.status || 'ACTIVE'
      };

    const allMarks = Database.readAll('Marks').filter(m => String(m.studentId) === studentId);
    const allAttendance = Database.readAll('Attendance').filter(a => String(a.studentId) === studentId);

    let history = allEnrollments.map(e => {
      const yrMarks = allMarks.filter(m => m.academicYear === e.academicYear || (!m.academicYear && e.status === 'ACTIVE'));
      const yrAtt = allAttendance.filter(a => a.academicYear === e.academicYear || (!a.academicYear && e.status === 'ACTIVE'));
      const presentCount = yrAtt.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;
      const totalAtt = yrAtt.length;
      const attPct = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 100;

      return {
        academicYear: e.academicYear,
        class: e.class,
        section: e.section,
        rollNo: e.rollNo,
        status: e.status,
        promotionDecision: e.promotionDecision || 'PROMOTED',
        attendancePercentage: attPct,
        totalRecordedDays: totalAtt,
        marksCount: yrMarks.length,
        remarks: e.remarks || ''
      };
    });

    if (history.length === 0) {
      const presentCount = allAttendance.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;
      const totalAtt = allAttendance.length;
      const attPct = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 100;
      history = [{
        academicYear: activeYear,
        class: student.class || '9',
        section: student.section || 'A',
        rollNo: student.rollNo || '',
        status: student.status || 'ACTIVE',
        promotionDecision: 'ACTIVE',
        attendancePercentage: attPct,
        totalRecordedDays: totalAtt,
        marksCount: allMarks.length,
        remarks: 'Current Active Enrollment'
      }];
    }

    history.sort((a, b) => String(a.academicYear).localeCompare(String(b.academicYear)));

    // 3. Attendance Summary
    const totalWorkingDays = allAttendance.length;
    const presentDays = allAttendance.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;
    const absentDays = allAttendance.filter(a => (a.status || '').toUpperCase() === 'ABSENT' || (a.status || '').toUpperCase() === 'LEAVE').length;
    const attendancePercentage = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;

    // 4. Examination Results
    const allResults = Database.readAll('ExamResults').filter(r => String(r.studentId) === studentId);

    // 5. Academic Documents
    let allDocs = Database.readAll('Documents').filter(d => String(d.studentId) === studentId);
    if (session.role === 'PARENT' || session.role === 'STUDENT') {
      allDocs = allDocs.filter(d => d.status === 'ISSUED' || d.status === 'REVISED');
    }

    // 6. Audit Logs (Admin / Principal only)
    let studentAuditLogs = [];
    if (['ADMIN', 'PRINCIPAL'].includes(session.role)) {
      const allAudit = Database.readAll('Audit');
      studentAuditLogs = allAudit.filter(l => {
        const detailsStr = typeof l.details === 'object' ? JSON.stringify(l.details) : String(l.details || '');
        return detailsStr.includes(studentId) || l.actorId === studentId;
      }).slice(-20);
    }

    return {
      success: true,
      data: {
        student: sanitizedStudent,
        parents: linkedParents,
        currentEnrollment: currentEnrollment,
        academicHistory: history,
        attendanceSummary: {
          totalWorkingDays: totalWorkingDays,
          presentDays: presentDays,
          absentDays: absentDays,
          percentage: attendancePercentage,
          recentRecords: allAttendance.slice(-15)
        },
        examinationResults: allResults,
        documents: allDocs,
        auditLogs: studentAuditLogs
      }
    };
  },

  /**
   * Links a parent account to a student by mobile number.
   * Auto-creates Parent record if it doesn't already exist.
   */
  linkParentStudent: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can manage parent-student links' } };
    }

    const studentId = String(payload.studentId || '').trim();
    const parentMobile = String(payload.parentMobile || payload.mobile || '').replace(/[^0-9]/g, '');
    const parentName = String(payload.parentName || payload.name || 'Parent').trim();
    const relationship = String(payload.relationship || 'Guardian').trim();

    if (!studentId || parentMobile.length < 10) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'studentId and a valid 10-digit mobile number are required' } };
    }

    const student = Database.findByPk('Students', studentId);
    if (!student) {
      return { success: false, error: { code: 'NOT_FOUND', message: `Student not found: ${studentId}` } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    // Find or create parent
    const allParents = Database.readAll('Parents');
    let parent = allParents.find(p => String(p.mobile).replace(/[^0-9]/g, '') === parentMobile);
    if (!parent) {
      parent = {
        parentId: `PAR_${parentMobile}`,
        schoolId: schoolId,
        mobile: parentMobile,
        parentName: parentName,
        passwordHash: '',
        salt: '',
        isCustomPassword: false,
        status: 'Active',
        createdAt: nowStr,
        updatedAt: nowStr
      };
      Database.upsertBatch('Parents', [parent]);
    }

    // Upsert link
    const linkId = `PSL_${parent.parentId}_${studentId}`;
    const linkRecord = {
      linkId: linkId,
      schoolId: schoolId,
      parentId: parent.parentId,
      studentId: studentId,
      relationship: relationship,
      active: true,
      status: 'ACTIVE',
      createdAt: nowStr,
      updatedAt: nowStr
    };
    Database.upsertBatch('ParentStudentLinks', [linkRecord]);

    Audit.log('LINK_PARENT_STUDENT', session.role, session.userId, {
      studentId: studentId,
      parentId: parent.parentId,
      parentMobile: parentMobile,
      relationship: relationship
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Linked parent ${parentName} (${parentMobile}) to student ${student.studentName}`,
      data: { link: linkRecord, parent: parent }
    };
  },

  /**
   * Deactivates a parent-student link.
   */
  unlinkParentStudent: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can unlink parents' } };
    }

    const linkId = String(payload.linkId || '').trim();
    const studentId = String(payload.studentId || '').trim();
    const parentId = String(payload.parentId || '').trim();

    let link = null;
    if (linkId) {
      link = Database.findByPk('ParentStudentLinks', linkId);
    } else if (studentId && parentId) {
      const allLinks = Database.readAll('ParentStudentLinks');
      link = allLinks.find(l => String(l.studentId) === studentId && String(l.parentId) === parentId);
    }

    if (!link) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Parent-student link not found' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    link.active = false;
    link.status = 'INACTIVE';
    link.updatedAt = nowStr;

    Database.upsertBatch('ParentStudentLinks', [link]);

    Audit.log('UNLINK_PARENT_STUDENT', session.role, session.userId, {
      linkId: link.linkId,
      studentId: link.studentId,
      parentId: link.parentId
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: 'Parent-student link successfully removed',
      data: { linkId: link.linkId }
    };
  },

  /**
   * Administrative bulk operations on student records.
   * Supports two-phase preview and execution for bulk class, section, status, and roll assignments.
   */
  bulkUpdateStudents: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can perform bulk student updates' } };
    }

    const action = String(payload.action || '').trim().toUpperCase();
    const studentIds = Array.isArray(payload.studentIds) ? payload.studentIds : [];
    const isPreview = payload.preview === true;

    if (studentIds.length === 0) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'studentIds list cannot be empty' } };
    }

    const allStudents = Database.readAll('Students');
    const targetStudents = allStudents.filter(s => studentIds.includes(String(s.studentId)));

    if (targetStudents.length === 0) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'No matching students found' } };
    }

    const previewList = [];
    const updatedStudents = [];
    const updatedEnrollments = [];
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const currentSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const activeYear = currentSetting ? currentSetting.value : '2026-2027';

    for (let i = 0; i < targetStudents.length; i++) {
      const s = { ...targetStudents[i] };
      const original = { class: s.class, section: s.section, rollNo: s.rollNo, status: s.status };

      if (action === 'ASSIGN_CLASS') {
        const tgtCls = String(payload.targetClass || s.class);
        const tgtSec = String(payload.targetSection || s.section || 'A');
        s.class = tgtCls;
        s.section = tgtSec;
      } else if (action === 'ASSIGN_SECTION') {
        s.section = String(payload.targetSection || 'A');
      } else if (action === 'UPDATE_STATUS') {
        s.status = String(payload.targetStatus || 'ACTIVE').toUpperCase();
      } else if (action === 'ASSIGN_ROLL') {
        const startRoll = parseInt(payload.startRoll || '1', 10);
        s.rollNo = String(startRoll + i);
      }

      s.updatedAt = nowStr;
      previewList.push({
        studentId: s.studentId,
        studentName: s.studentName,
        before: original,
        after: { class: s.class, section: s.section, rollNo: s.rollNo, status: s.status }
      });

      if (!isPreview) {
        updatedStudents.push(s);
        const enrId = `ENR_${s.studentId}_${activeYear.replace(/[^a-zA-Z0-9]/g, '_')}`;
        let enr = Database.findByPk('Enrollments', enrId);
        if (enr) {
          enr.class = s.class;
          enr.section = s.section;
          enr.rollNo = s.rollNo;
          enr.status = s.status;
          enr.updatedAt = nowStr;
          updatedEnrollments.push(enr);
        }
      }
    }

    if (!isPreview) {
      Database.upsertBatch('Students', updatedStudents);
      if (updatedEnrollments.length > 0) Database.upsertBatch('Enrollments', updatedEnrollments);
      Audit.log('BULK_UPDATE_STUDENTS', session.role, session.userId, {
        action: action,
        count: updatedStudents.length,
        studentIds: studentIds
      }, 'SUCCESS', '', schoolId);
    }

    return {
      success: true,
      message: isPreview ? `Preview generated for ${previewList.length} students` : `Successfully updated ${updatedStudents.length} students`,
      data: {
        isPreview: isPreview,
        action: action,
        affectedCount: previewList.length,
        changes: previewList
      }
    };
  },

  /**
   * Controlled CSV Student Importer with Preview & Validation Report.
   */
  importStudentsCsv: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can import students' } };
    }

    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const isPreview = payload.preview !== false;
    const confirm = payload.confirm === true;

    if (rows.length === 0) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'No student rows provided in CSV' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const currentSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const academicYear = String(payload.academicYear || (currentSetting ? currentSetting.value : '2026-2027')).trim();

    const allExisting = Database.readAll('Students');
    const existingAdmMap = new Set(allExisting.map(s => String(s.admissionNo || '').toLowerCase().trim()).filter(Boolean));
    const existingNameDobMap = new Set(allExisting.map(s => `${String(s.studentName || '').toLowerCase().trim()}_${String(s.dob || '').trim()}`));

    const validRows = [];
    const invalidRows = [];
    const duplicateRows = [];

    const seenInCsvAdm = new Set();
    const seenInCsvNameDob = new Set();

    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      const rowNum = idx + 1;
      const name = String(r.studentName || r.name || '').trim();
      const cls = String(r.class || '9').trim();
      const sec = String(r.section || 'A').trim().toUpperCase();
      const dob = String(r.dob || '').trim();
      const roll = String(r.rollNo || r.roll || '').trim();
      const adm = String(r.admissionNo || `ADM-${academicYear.slice(0, 4)}-${1000 + idx}`).trim();
      const mobile = String(r.mobile || '').replace(/[^0-9]/g, '');

      if (!name) {
        invalidRows.push({ rowNumber: rowNum, data: r, error: 'Student name is missing' });
        continue;
      }
      if (!['9', '10', '11', '12'].includes(cls)) {
        invalidRows.push({ rowNumber: rowNum, data: r, error: `Invalid class "${cls}" (Expected 9, 10, 11, or 12)` });
        continue;
      }
      if (dob) {
        const d = new Date(dob);
        if (isNaN(d.getTime()) || d >= new Date()) {
          invalidRows.push({ rowNumber: rowNum, data: r, error: `Invalid Date of Birth: "${dob}"` });
          continue;
        }
      }

      // Duplicate detection
      const nameDobKey = `${name.toLowerCase()}_${dob}`;
      const admKey = adm.toLowerCase();

      if (existingAdmMap.has(admKey) || seenInCsvAdm.has(admKey)) {
        duplicateRows.push({ rowNumber: rowNum, data: r, warning: `Duplicate Admission Number "${adm}"` });
      } else if (existingNameDobMap.has(nameDobKey) || seenInCsvNameDob.has(nameDobKey)) {
        duplicateRows.push({ rowNumber: rowNum, data: r, warning: `Matching Name and DOB already exists: "${name}" (${dob})` });
      }

      seenInCsvAdm.add(admKey);
      seenInCsvNameDob.add(nameDobKey);

      const sid = String(r.studentId || '').trim() || (`STU_${cls}_${Date.now().toString().slice(-5)}_${idx}`);
      validRows.push({
        studentId: sid,
        schoolId: schoolId,
        admissionNo: adm,
        studentName: name,
        rollNo: roll,
        class: cls,
        section: sec,
        gender: r.gender || 'Male',
        dob: dob,
        fatherName: r.fatherName || '',
        motherName: r.motherName || '',
        mobile: mobile,
        village: r.village || '',
        address: r.address || '',
        district: r.district || 'Biswanath',
        state: r.state || 'Assam',
        pinCode: r.pinCode || '784176',
        category: r.category || 'General',
        bloodGroup: r.bloodGroup || '',
        stream: r.stream || 'Information Technology (IT/ITeS)',
        admissionDate: r.admissionDate || nowStr.split('T')[0],
        status: 'ACTIVE',
        createdAt: nowStr,
        updatedAt: nowStr
      });
    }

    if (!isPreview && confirm && validRows.length > 0) {
      Database.upsertBatch('Students', validRows);
      const enrRecords = validRows.map(s => ({
        enrollmentId: `ENR_${s.studentId}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}`,
        schoolId: schoolId,
        studentId: s.studentId,
        academicYear: academicYear,
        class: s.class,
        section: s.section,
        rollNo: s.rollNo,
        status: 'ACTIVE',
        promotionDecision: 'ACTIVE',
        remarks: 'Imported via CSV',
        createdAt: nowStr,
        updatedAt: nowStr
      }));
      Database.upsertBatch('Enrollments', enrRecords);

      Audit.log('IMPORT_STUDENTS_CSV', session.role, session.userId, {
        importedCount: validRows.length,
        academicYear: academicYear
      }, 'SUCCESS', '', schoolId);
    }

    return {
      success: true,
      message: isPreview ? `CSV validation complete: ${validRows.length} valid, ${invalidRows.length} errors, ${duplicateRows.length} warnings` : `Successfully imported ${validRows.length} students`,
      data: {
        isPreview: isPreview,
        summary: {
          totalRows: rows.length,
          validCount: validRows.length,
          invalidCount: invalidRows.length,
          duplicateWarningCount: duplicateRows.length
        },
        validRows: validRows,
        invalidRows: invalidRows,
        duplicateRows: duplicateRows
      }
    };
  },

  /**
   * Exports student directory as clean structured dataset for CSV generation.
   * Respects RBAC and strips internal security fields.
   */
  exportStudentsCsv: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL', 'TEACHER'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to export students' } };
    }

    const res = AcademicApi.getStudents(session, payload);
    if (!res.success) return res;

    const cleanRows = res.data.students.map(s => ({
      studentId: s.studentId,
      admissionNo: s.admissionNo || '',
      studentName: s.studentName || '',
      class: s.class || '',
      section: s.section || '',
      rollNo: s.rollNo || '',
      gender: s.gender || '',
      dob: s.dob || '',
      fatherName: s.fatherName || '',
      motherName: s.motherName || '',
      mobile: s.mobile || '',
      village: s.village || '',
      district: s.district || '',
      category: s.category || '',
      bloodGroup: s.bloodGroup || '',
      stream: s.stream || '',
      admissionDate: s.admissionDate || '',
      status: s.status || 'ACTIVE'
    }));

    Audit.log('EXPORT_STUDENTS_CSV', session.role, session.userId, {
      exportedCount: cleanRows.length,
      filters: payload
    }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      data: {
        students: cleanRows,
        total: cleanRows.length
      }
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdminApi };
}
