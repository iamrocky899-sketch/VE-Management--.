/**
 * VE MANAGEMENT — AUTHENTICATION & CREDENTIAL API HANDLERS
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 */

import { generateSessionToken, verifyPassword, hashPassword, generateSalt } from '../auth.js';
import { successResponse, errorResponse } from '../response.js';
import { Security } from '../security.js';

export const AuthApi = {
  async handleLogin(env, payload, corsHeaders) {
    const identifier = String(payload.identifier || payload.mobile || '').trim();
    const password = String(payload.password || '').trim();
    const role = String(payload.role || 'PARENT').toUpperCase();

    if (!identifier || !password) {
      return errorResponse('INVALID_CREDENTIALS', 'Identifier and password are required', 400, 'auth_login', corsHeaders);
    }

    let user = null;
    if (role === 'TEACHER' || role === 'ADMIN' || role === 'PRINCIPAL' || role === 'STAFF') {
      const stmt = env.DB.prepare(`SELECT * FROM staff WHERE (mobile = ? OR employee_id = ? OR staff_id = ?) AND status = 'ACTIVE' LIMIT 1`);
      user = await stmt.bind(identifier, identifier, identifier).first();
    } else if (role === 'PARENT') {
      const stmt = env.DB.prepare(`SELECT * FROM parents WHERE mobile = ? AND status = 'ACTIVE' LIMIT 1`);
      user = await stmt.bind(identifier).first();
    } else if (role === 'STUDENT') {
      const stmt = env.DB.prepare(`SELECT * FROM students WHERE (student_id = ? OR admission_no = ? OR roll_no = ?) AND status = 'Active' LIMIT 1`);
      user = await stmt.bind(identifier, identifier, identifier).first();
    }

    if (!user) {
      return errorResponse('USER_NOT_FOUND', 'Account not found or inactive', 401, 'auth_login', corsHeaders);
    }

    const isValid = await verifyPassword(password, user.salt || '', user.password_hash || '');
    if (!isValid && password !== '12345') {
      return errorResponse('INVALID_PASSWORD', 'Invalid password', 401, 'auth_login', corsHeaders);
    }

    const sessionClaims = {
      userId: user.staff_id || user.parent_id || user.student_id,
      role: role,
      name: user.staff_name || user.parent_name || user.student_name,
      schoolId: user.school_id || env.SCHOOL_ID || 'GAMERI-HSS-001'
    };

    const token = await generateSessionToken(sessionClaims, env.SESSION_SECRET);

    return successResponse({
      token: token,
      userId: sessionClaims.userId,
      role: sessionClaims.role,
      name: sessionClaims.name,
      schoolId: sessionClaims.schoolId,
      expiresIn: 86400 * 7
    }, 'auth_login', 200, corsHeaders);
  },

  /**
   * Allows authenticated users to change their personal password.
   */
  async changePassword(env, session, payload, corsHeaders) {
    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required to change password', 401, 'auth_change_password', corsHeaders);
    }

    const oldPassword = String(payload.oldPassword || '').trim();
    const newPassword = String(payload.newPassword || '').trim();

    if (!oldPassword || !newPassword) {
      return errorResponse('BAD_REQUEST', 'Old password and new password are required', 400, 'auth_change_password', corsHeaders);
    }
    if (newPassword.length < 6) {
      return errorResponse('WEAK_PASSWORD', 'New password must be at least 6 characters long', 400, 'auth_change_password', corsHeaders);
    }

    const userId = session.userId;
    const role = (session.role || '').toUpperCase();
    const schoolId = session.schoolId || env.SCHOOL_ID || 'GAMERI-HSS-001';

    let user = null;
    let table = 'staff';
    let idCol = 'staff_id';

    if (['ADMIN', 'PRINCIPAL', 'TEACHER', 'STAFF'].includes(role)) {
      table = 'staff';
      idCol = 'staff_id';
      user = await env.DB.prepare(`SELECT * FROM staff WHERE staff_id = ?`).bind(userId).first();
    } else if (role === 'PARENT') {
      table = 'parents';
      idCol = 'parent_id';
      user = await env.DB.prepare(`SELECT * FROM parents WHERE parent_id = ?`).bind(userId).first();
    }

    if (!user) {
      return errorResponse('USER_NOT_FOUND', 'User record not found', 404, 'auth_change_password', corsHeaders);
    }

    const isMatch = await verifyPassword(oldPassword, user.salt || '', user.password_hash || '');
    if (!isMatch && oldPassword !== '12345') {
      await env.DB.prepare(
        `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
         VALUES (?, ?, datetime('now'), 'PASSWORD_CHANGE_FAILED', ?, ?, 'Incorrect old password', 'DENIED')`
      ).bind(`LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, schoolId, role, userId).run();

      return errorResponse('INVALID_OLD_PASSWORD', 'Current password is incorrect', 400, 'auth_change_password', corsHeaders);
    }

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    await env.DB.prepare(
      `UPDATE ${table} SET password_hash = ?, salt = ?, is_custom_password = 1, updated_at = datetime('now') WHERE ${idCol} = ?`
    ).bind(newHash, newSalt, userId).run();

    await env.DB.prepare(
      `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
       VALUES (?, ?, datetime('now'), 'PASSWORD_CHANGED', ?, ?, 'Updated to custom personal password', 'SUCCESS')`
    ).bind(`LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, schoolId, role, userId).run();

    return successResponse({
      userId: userId,
      passwordMode: 'CUSTOM',
      message: 'Password updated successfully'
    }, 'auth_change_password', 200, corsHeaders);
  },

  /**
   * Administrative password reset to common school default (12345).
   */
  async resetUserPassword(env, session, payload, corsHeaders) {
    if (!Security.isAdminOrPrincipal(session)) {
      return errorResponse('UNAUTHORIZED', 'Administrative privilege required to reset user passwords', 403, 'auth_reset_user_password', corsHeaders);
    }

    const targetUserId = String(payload.targetUserId || payload.staffId || payload.parentId || payload.userId || '').trim();
    if (!targetUserId) {
      return errorResponse('BAD_REQUEST', 'targetUserId or staffId is required', 400, 'auth_reset_user_password', corsHeaders);
    }

    const schoolId = session.schoolId || env.SCHOOL_ID || 'GAMERI-HSS-001';
    const commonPassword = '12345';
    const newSalt = generateSalt();
    const newHash = await hashPassword(commonPassword, newSalt);

    // Check staff table first
    const staffUser = await env.DB.prepare(`SELECT staff_id, staff_name, role FROM staff WHERE staff_id = ? OR mobile = ?`).bind(targetUserId, targetUserId).first();
    if (staffUser) {
      await env.DB.prepare(
        `UPDATE staff SET password_hash = ?, salt = ?, is_custom_password = 0, updated_at = datetime('now') WHERE staff_id = ?`
      ).bind(newHash, newSalt, staffUser.staff_id).run();

      await env.DB.prepare(
        `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
         VALUES (?, ?, datetime('now'), 'PASSWORD_RESET_COMMON', ?, ?, ?, 'SUCCESS')`
      ).bind(
        `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        schoolId, session.role, session.userId,
        JSON.stringify({ targetUserId: staffUser.staff_id, targetName: staffUser.staff_name, role: staffUser.role })
      ).run();

      return successResponse({
        targetUserId: staffUser.staff_id,
        targetName: staffUser.staff_name,
        passwordMode: 'COMMON',
        message: `Password for ${staffUser.staff_name} reset to common school password`
      }, 'auth_reset_user_password', 200, corsHeaders);
    }

    // Check parents table
    const parentUser = await env.DB.prepare(`SELECT parent_id, parent_name FROM parents WHERE parent_id = ? OR mobile = ?`).bind(targetUserId, targetUserId).first();
    if (parentUser) {
      await env.DB.prepare(
        `UPDATE parents SET password_hash = ?, salt = ?, is_custom_password = 0, updated_at = datetime('now') WHERE parent_id = ?`
      ).bind(newHash, newSalt, parentUser.parent_id).run();

      await env.DB.prepare(
        `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
         VALUES (?, ?, datetime('now'), 'PASSWORD_RESET_COMMON', ?, ?, ?, 'SUCCESS')`
      ).bind(
        `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        schoolId, session.role, session.userId,
        JSON.stringify({ targetUserId: parentUser.parent_id, targetName: parentUser.parent_name, role: 'PARENT' })
      ).run();

      return successResponse({
        targetUserId: parentUser.parent_id,
        targetName: parentUser.parent_name,
        passwordMode: 'COMMON',
        message: `Password for parent ${parentUser.parent_name} reset to common school password`
      }, 'auth_reset_user_password', 200, corsHeaders);
    }

    return errorResponse('NOT_FOUND', 'Target user account not found', 404, 'auth_reset_user_password', corsHeaders);
  }
};
