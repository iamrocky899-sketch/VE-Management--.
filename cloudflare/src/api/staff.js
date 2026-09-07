/**
 * VE MANAGEMENT — STAFF & WORKFORCE API HANDLERS
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 */

import { successResponse, errorResponse } from '../response.js';
import { Security } from '../security.js';
import { hashPassword, generateSalt } from '../auth.js';

export const StaffApi = {
  async getStaffProfile(env, session, payload, corsHeaders) {
    const staffId = payload.staffId || session.userId;
    const staff = await env.DB.prepare(`SELECT * FROM staff WHERE staff_id = ?`).bind(staffId).first();
    if (!staff) {
      return errorResponse('NOT_FOUND', 'Staff record not found', 404, 'get_staff_profile', corsHeaders);
    }
    return successResponse({ staff: staff }, 'get_staff_profile', 200, corsHeaders);
  },

  async getTeacherScope(env, session, payload, corsHeaders) {
    const staffId = payload.staffId || session.userId;
    const scope = await Security.getTeacherAcademicScope(env.DB, staffId, payload.academicYear || '2026-2027');
    return successResponse({ scope: scope }, 'get_teacher_workload', 200, corsHeaders);
  },

  /**
   * Retrieves complete staff list with role, contact, and assignment metadata (Admin/Principal only).
   */
  async getStaffList(env, session, payload, corsHeaders) {
    if (!Security.isAdminOrPrincipal(session)) {
      return errorResponse('UNAUTHORIZED', 'Administrative privilege required to view staff list', 403, 'get_staff_list', corsHeaders);
    }

    const { results } = await env.DB.prepare(
      `SELECT staff_id, school_id, employee_id, staff_name, first_name, middle_name, last_name,
              role, gender, dob, mobile, email, address, village, district, state, pin_code,
              designation, department, employment_type, joining_date, qualification, specialization,
              stream, assigned_classes, assigned_subjects, is_custom_password, status, created_at, updated_at
       FROM staff ORDER BY staff_name ASC`
    ).all();

    const academicYear = payload.academicYear || '2026-2027';
    const staffList = (results || []).map(s => {
      let assignedClasses = [];
      let assignedSubjects = [];
      try { assignedClasses = JSON.parse(s.assigned_classes || '[]'); } catch (e) { assignedClasses = String(s.assigned_classes || '').split(',').map(c => c.trim()).filter(Boolean); }
      try { assignedSubjects = JSON.parse(s.assigned_subjects || '[]'); } catch (e) { assignedSubjects = String(s.assigned_subjects || '').split(',').map(sub => sub.trim()).filter(Boolean); }

      return {
        staffId: s.staff_id,
        schoolId: s.school_id,
        employeeId: s.employee_id || s.staff_id,
        name: s.staff_name,
        staffName: s.staff_name,
        firstName: s.first_name || '',
        middleName: s.middle_name || '',
        lastName: s.last_name || '',
        role: s.role,
        gender: s.gender || 'Not Specified',
        dob: s.dob || '',
        mobile: s.mobile || '',
        email: s.email || '',
        address: s.address || '',
        village: s.village || '',
        district: s.district || 'Biswanath',
        state: s.state || 'Assam',
        pinCode: s.pin_code || '784172',
        designation: s.designation,
        department: s.department || 'Vocational Education',
        employmentType: s.employment_type || 'Permanent',
        joiningDate: s.joining_date || '',
        qualification: s.qualification || 'Post Graduate / B.Ed',
        specialization: s.specialization || 'Information Technology',
        stream: s.stream || 'IT/ITeS',
        assignedClasses: assignedClasses,
        assignedSubjects: assignedSubjects,
        status: s.status,
        active: s.status === 'ACTIVE',
        passwordMode: s.is_custom_password === 1 ? 'CUSTOM' : 'COMMON',
        createdAt: s.created_at,
        updatedAt: s.updated_at
      };
    });

    return successResponse({
      staff: staffList,
      total: staffList.length,
      academicYear: academicYear
    }, 'get_staff_list', 200, corsHeaders);
  },

  /**
   * Registers a new staff member with encrypted credentials and audit logging.
   */
  async registerStaff(env, session, payload, corsHeaders) {
    if (!Security.isAdminOrPrincipal(session)) {
      return errorResponse('UNAUTHORIZED', 'Administrative privilege required to register staff', 403, 'register_staff', corsHeaders);
    }

    const staffData = payload.staffData || payload;
    const mobile = String(staffData.mobile || '').replace(/\D/g, '').slice(-10);
    const staffName = String(staffData.staffName || staffData.name || '').trim();
    const role = String(staffData.role || 'TEACHER').toUpperCase().trim();

    if (!staffName) {
      return errorResponse('VALIDATION_ERROR', 'Staff name is required', 400, 'register_staff', corsHeaders);
    }
    if (!mobile || mobile.length !== 10) {
      return errorResponse('INVALID_MOBILE', 'Valid 10-digit mobile number required', 400, 'register_staff', corsHeaders);
    }

    const schoolId = staffData.schoolId || session.schoolId || env.SCHOOL_ID || 'GAMERI-HSS-001';
    const staffId = staffData.staffId || `STF_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const employeeId = staffData.employeeId || `EMP_${mobile.slice(-4)}_${Math.random().toString(36).substring(2, 4).toUpperCase()}`;

    // Duplicate mobile check
    const existing = await env.DB.prepare(`SELECT staff_id FROM staff WHERE mobile = ?`).bind(mobile).first();
    if (existing) {
      return errorResponse('DUPLICATE_STAFF', `Staff with mobile ${mobile} already exists`, 409, 'register_staff', corsHeaders);
    }

    const rawPassword = String(staffData.password || '12345').trim();
    const salt = generateSalt();
    const passHash = await hashPassword(rawPassword, salt);
    const isCustom = rawPassword !== '12345' ? 1 : 0;

    const assignedClasses = JSON.stringify(staffData.assignedClasses || ['9', '10']);
    const assignedSubjects = JSON.stringify(staffData.assignedSubjects || ['IT/ITeS']);

    await env.DB.prepare(
      `INSERT INTO staff (
        staff_id, school_id, employee_id, staff_name, first_name, middle_name, last_name,
        role, gender, dob, mobile, email, address, village, district, state, pin_code,
        designation, department, employment_type, joining_date, qualification, specialization,
        stream, assigned_classes, assigned_subjects, password_hash, salt, is_custom_password,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      staffId, schoolId, employeeId, staffName,
      staffData.firstName || '', staffData.middleName || '', staffData.lastName || '',
      role, staffData.gender || 'Not Specified', staffData.dob || '',
      mobile, staffData.email || '', staffData.address || '', staffData.village || '',
      staffData.district || 'Biswanath', staffData.state || 'Assam', staffData.pinCode || '784172',
      staffData.designation || (role === 'PRINCIPAL' ? 'Principal' : (role === 'ADMIN' ? 'Administrator' : 'Vocational Teacher')),
      staffData.department || 'Vocational Education', staffData.employmentType || 'Permanent',
      staffData.joiningDate || new Date().toISOString().split('T')[0],
      staffData.qualification || 'Post Graduate / B.Ed', staffData.specialization || 'Information Technology',
      staffData.stream || 'IT/ITeS', assignedClasses, assignedSubjects,
      passHash, salt, isCustom, staffData.status || 'ACTIVE'
    ).run();

    // Audit log
    await env.DB.prepare(
      `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
       VALUES (?, ?, datetime('now'), 'REGISTER_STAFF', ?, ?, ?, 'SUCCESS')`
    ).bind(
      `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      schoolId, session.role, session.userId,
      JSON.stringify({ staffId, staffName, role, mobile })
    ).run();

    return successResponse({
      staffId: staffId,
      employeeId: employeeId,
      staffName: staffName,
      role: role,
      mobile: mobile,
      status: staffData.status || 'ACTIVE',
      message: 'Staff account registered successfully'
    }, 'register_staff', 201, corsHeaders);
  },

  /**
   * Updates existing staff record with audit logging.
   */
  async updateStaff(env, session, payload, corsHeaders) {
    if (!Security.isAdminOrPrincipal(session)) {
      return errorResponse('UNAUTHORIZED', 'Administrative privilege required to update staff', 403, 'update_staff', corsHeaders);
    }

    const staffData = payload.staffData || payload;
    const staffId = String(staffData.staffId || staffData.userId || '').trim();
    if (!staffId) {
      return errorResponse('BAD_REQUEST', 'staffId is required', 400, 'update_staff', corsHeaders);
    }

    const existing = await env.DB.prepare(`SELECT * FROM staff WHERE staff_id = ?`).bind(staffId).first();
    if (!existing) {
      return errorResponse('NOT_FOUND', 'Staff record not found', 404, 'update_staff', corsHeaders);
    }

    // Check mobile conflict if changed
    let mobile = existing.mobile;
    if (staffData.mobile) {
      const cleanMobile = String(staffData.mobile).replace(/\D/g, '').slice(-10);
      if (cleanMobile && cleanMobile !== existing.mobile) {
        const dup = await env.DB.prepare(`SELECT staff_id FROM staff WHERE mobile = ? AND staff_id != ?`).bind(cleanMobile, staffId).first();
        if (dup) {
          return errorResponse('DUPLICATE_STAFF', `Mobile ${cleanMobile} already registered to another staff member`, 409, 'update_staff', corsHeaders);
        }
        mobile = cleanMobile;
      }
    }

    const staffName = staffData.staffName || staffData.name || existing.staff_name;
    const role = staffData.role ? String(staffData.role).toUpperCase() : existing.role;
    const designation = staffData.designation || existing.designation;
    const email = staffData.email !== undefined ? staffData.email : existing.email;
    const assignedClasses = staffData.assignedClasses ? (typeof staffData.assignedClasses === 'object' ? JSON.stringify(staffData.assignedClasses) : String(staffData.assignedClasses)) : existing.assigned_classes;
    const assignedSubjects = staffData.assignedSubjects ? (typeof staffData.assignedSubjects === 'object' ? JSON.stringify(staffData.assignedSubjects) : String(staffData.assignedSubjects)) : existing.assigned_subjects;
    const status = staffData.status || existing.status;

    await env.DB.prepare(
      `UPDATE staff SET
        staff_name = ?, role = ?, mobile = ?, email = ?, designation = ?,
        assigned_classes = ?, assigned_subjects = ?, status = ?, updated_at = datetime('now')
       WHERE staff_id = ?`
    ).bind(staffName, role, mobile, email, designation, assignedClasses, assignedSubjects, status, staffId).run();

    // Audit log
    await env.DB.prepare(
      `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
       VALUES (?, ?, datetime('now'), 'UPDATE_STAFF', ?, ?, ?, 'SUCCESS')`
    ).bind(
      `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      existing.school_id, session.role, session.userId,
      JSON.stringify({ staffId, staffName, role, status })
    ).run();

    return successResponse({
      staffId: staffId,
      staffName: staffName,
      role: role,
      status: status,
      message: 'Staff profile updated successfully'
    }, 'update_staff', 200, corsHeaders);
  },

  /**
   * Activates, deactivates, or suspends a staff member account.
   */
  async setStaffStatus(env, session, payload, corsHeaders) {
    if (!Security.isAdminOrPrincipal(session)) {
      return errorResponse('UNAUTHORIZED', 'Administrative privilege required to alter staff status', 403, 'set_staff_status', corsHeaders);
    }

    const staffId = String(payload.staffId || payload.userId || '').trim();
    const newStatus = String(payload.status || 'ACTIVE').toUpperCase().trim();
    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(newStatus)) {
      return errorResponse('INVALID_STATUS', 'Status must be ACTIVE, INACTIVE, or SUSPENDED', 400, 'set_staff_status', corsHeaders);
    }

    const staff = await env.DB.prepare(`SELECT * FROM staff WHERE staff_id = ?`).bind(staffId).first();
    if (!staff) {
      return errorResponse('NOT_FOUND', 'Staff record not found', 404, 'set_staff_status', corsHeaders);
    }

    const prevStatus = staff.status;
    await env.DB.prepare(
      `UPDATE staff SET status = ?, updated_at = datetime('now') WHERE staff_id = ?`
    ).bind(newStatus, staffId).run();

    // Audit log
    await env.DB.prepare(
      `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
       VALUES (?, ?, datetime('now'), 'SET_STAFF_STATUS', ?, ?, ?, 'SUCCESS')`
    ).bind(
      `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      staff.school_id, session.role, session.userId,
      JSON.stringify({ staffId, prevStatus, newStatus, reason: payload.reason || '' })
    ).run();

    return successResponse({
      staffId: staffId,
      previousStatus: prevStatus,
      status: newStatus,
      active: newStatus === 'ACTIVE',
      message: `Staff status updated from ${prevStatus} to ${newStatus}`
    }, 'set_staff_status', 200, corsHeaders);
  }
};
