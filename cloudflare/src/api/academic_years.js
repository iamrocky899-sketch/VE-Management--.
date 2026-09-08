/**
 * VE MANAGEMENT — ACADEMIC YEARS API HANDLERS
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Implements authoritative academic session lifecycle (ACTIVE, UPCOMING, CLOSED, ARCHIVED)
 * with strict RBAC, read-before-write idempotency, and zero data loss guarantee.
 */

import { successResponse, errorResponse } from '../response.js';
import { Security } from '../security.js';

export function formatAcademicYearRecord(y) {
  if (!y || typeof y !== 'object') return y;
  const yearId = y.year_id || y.yearId || '';
  const yearName = y.year_name || y.yearName || '';
  const startDate = y.start_date || y.startDate || '';
  const endDate = y.end_date || y.endDate || '';
  const status = (y.status || 'UPCOMING').toUpperCase();
  const isCurrent = (y.is_current === 1 || y.isCurrent === true || y.is_current === true) ? 1 : 0;
  const schoolId = y.school_id || y.schoolId || 'GAMERI-HSS-001';

  return {
    ...y,
    yearId,
    year_id: yearId,
    yearName,
    year_name: yearName,
    code: yearName,
    title: y.title || `Academic Session ${yearName}`,
    startDate,
    start_date: startDate,
    endDate,
    end_date: endDate,
    status,
    isCurrent: isCurrent === 1,
    is_current: isCurrent,
    is_active: isCurrent,
    schoolId,
    school_id: schoolId
  };
}

export const AcademicYearsApi = {
  /**
   * Fetches all academic years sorted with current session first, then chronologically.
   */
  async getAcademicYears(env, session, payload, corsHeaders) {
    const { results } = await env.DB.prepare(
      `SELECT * FROM academic_years ORDER BY is_current DESC, start_date DESC`
    ).all();

    const formatted = (results || []).map(formatAcademicYearRecord);
    const active = formatted.find(y => y.isCurrent)?.yearName || (formatted[0]?.yearName || '2026-2027');

    return successResponse({
      academicYears: formatted,
      activeYear: active,
      currentYear: active,
      total: formatted.length
    }, 'get_academic_years', 200, corsHeaders);
  },

  /**
   * Authoritative single-session resolver.
   */
  async getCurrentAcademicYear(env, session, payload, corsHeaders) {
    let active = await env.DB.prepare(
      `SELECT * FROM academic_years WHERE is_current = 1 LIMIT 1`
    ).first();

    if (!active) {
      active = await env.DB.prepare(
        `SELECT * FROM academic_years WHERE status = 'ACTIVE' ORDER BY start_date DESC LIMIT 1`
      ).first();
    }

    if (!active) {
      return successResponse({
        academicYear: {
          yearId: 'AY_2026_2027',
          yearName: '2026-2027',
          startDate: '2026-04-01',
          endDate: '2027-03-31',
          status: 'ACTIVE',
          isCurrent: true
        }
      }, 'get_current_academic_year', 200, corsHeaders);
    }

    return successResponse({
      academicYear: formatAcademicYearRecord(active)
    }, 'get_current_academic_year', 200, corsHeaders);
  },

  /**
   * Creates or updates an academic year.
   */
  async saveAcademicYear(env, session, payload, corsHeaders) {
    if (!Security.isAdminOrPrincipal(session)) {
      return errorResponse('UNAUTHORIZED', 'Administrative privilege required to manage academic sessions', 403, 'save_academic_year', corsHeaders);
    }

    const schoolId = payload.schoolId || session.schoolId || env.SCHOOL_ID || 'GAMERI-HSS-001';
    const ayObj = payload.academicYear || payload.academic_year || {};
    const rawYearName = String(payload.yearName || payload.year_name || payload.code || ayObj.yearName || ayObj.year_name || ayObj.code || '').trim();
    const startDate = String(payload.startDate || payload.start_date || ayObj.startDate || ayObj.start_date || '').trim();
    const endDate = String(payload.endDate || payload.end_date || ayObj.endDate || ayObj.end_date || '').trim();
    let status = String(payload.status || ayObj.status || 'UPCOMING').toUpperCase();
    if (status === 'PLANNED') status = 'UPCOMING';
    const setAsActive = payload.setAsActive === true || payload.isCurrent === true || payload.is_current === 1 || ayObj.setAsActive === true;

    // Validate year format: "YYYY-YYYY"
    if (!/^\d{4}-\d{4}$/.test(rawYearName)) {
      return errorResponse('INVALID_FORMAT', 'Academic year format must be YYYY-YYYY (e.g. 2027-2028)', 400, 'save_academic_year', corsHeaders);
    }

    // Validate dates
    if (!startDate || !endDate) {
      return errorResponse('INVALID_DATES', 'Start date and end date are required', 400, 'save_academic_year', corsHeaders);
    }
    if (startDate >= endDate) {
      return errorResponse('INVALID_DATES', 'Start date must precede end date', 400, 'save_academic_year', corsHeaders);
    }

    const validStatuses = ['ACTIVE', 'UPCOMING', 'ARCHIVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      status = 'UPCOMING';
    }

    // Read-before-write check
    const existing = await env.DB.prepare(
      `SELECT * FROM academic_years WHERE year_name = ?`
    ).bind(rawYearName).first();

    const yearId = existing ? existing.year_id : `AY_${rawYearName.replace(/[^a-zA-Z0-9]/g, '_')}`;

    if (existing) {
      // Check if anything changed
      const isDatesSame = existing.start_date === startDate && existing.end_date === endDate;
      const isStatusSame = existing.status === status;
      const isCurrentSame = (existing.is_current === 1) === setAsActive;

      if (isDatesSame && isStatusSame && (!setAsActive || isCurrentSame)) {
        return successResponse({
          academicYear: formatAcademicYearRecord(existing),
          message: 'Academic year record is already up to date (0 writes)',
          idempotent: true
        }, 'save_academic_year', 200, corsHeaders);
      }
    }

    const statements = [];

    if (setAsActive) {
      // Unset any current year
      statements.push(
        env.DB.prepare(`UPDATE academic_years SET is_current = 0, updated_at = datetime('now') WHERE is_current = 1`)
      );
      status = 'ACTIVE';
    }

    const isCurrentVal = setAsActive ? 1 : (existing ? existing.is_current : 0);

    if (existing) {
      statements.push(
        env.DB.prepare(
          `UPDATE academic_years SET start_date = ?, end_date = ?, status = ?, is_current = ?, updated_at = datetime('now') WHERE year_id = ?`
        ).bind(startDate, endDate, status, isCurrentVal, yearId)
      );
    } else {
      statements.push(
        env.DB.prepare(
          `INSERT INTO academic_years (year_id, school_id, year_name, start_date, end_date, status, is_current, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
        ).bind(yearId, schoolId, rawYearName, startDate, endDate, status, isCurrentVal)
      );
    }

    if (setAsActive) {
      statements.push(
        env.DB.prepare(
          `INSERT INTO settings (key, school_id, value, category, description, updated_at)
           VALUES ('ACADEMIC_YEAR', ?, ?, 'ACADEMIC', 'Canonical Active Academic Session', datetime('now'))
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
        ).bind(schoolId, rawYearName)
      );
    }

    // 1 audit write for administrative tracking
    statements.push(
      env.DB.prepare(
        `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
         VALUES (?, ?, datetime('now'), ?, ?, ?, ?, 'SUCCESS')`
      ).bind(
        `LOG_AY_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        schoolId,
        existing ? 'UPDATE_ACADEMIC_YEAR' : 'CREATE_ACADEMIC_YEAR',
        session.role,
        session.userId || session.staffId || 'SYSTEM',
        JSON.stringify({ yearName: rawYearName, status, setAsActive })
      )
    );

    await env.DB.batch(statements);

    return successResponse({
      academicYear: formatAcademicYearRecord({
        year_id: yearId,
        year_name: rawYearName,
        start_date: startDate,
        end_date: endDate,
        status,
        is_current: isCurrentVal
      }),
      message: `Academic year ${rawYearName} saved successfully`
    }, 'save_academic_year', 200, corsHeaders);
  },

  /**
   * Activates a specific academic year atomically.
   */
  async setActiveAcademicYear(env, session, payload, corsHeaders) {
    if (!Security.isAdminOrPrincipal(session)) {
      return errorResponse('UNAUTHORIZED', 'Administrative privilege required to set active academic session', 403, 'set_active_academic_year', corsHeaders);
    }

    const schoolId = payload.schoolId || session.schoolId || env.SCHOOL_ID || 'GAMERI-HSS-001';
    const targetKey = String(payload.yearName || payload.yearId || payload.academicYear || payload.code || payload.academic_year || '').trim();

    if (!targetKey) {
      return errorResponse('BAD_REQUEST', 'yearName or yearId required', 400, 'set_active_academic_year', corsHeaders);
    }

    const targetYear = await env.DB.prepare(
      `SELECT * FROM academic_years WHERE year_name = ? OR year_id = ?`
    ).bind(targetKey, targetKey).first();

    if (!targetYear) {
      return errorResponse('NOT_FOUND', `Academic year "${targetKey}" not found`, 404, 'set_active_academic_year', corsHeaders);
    }

    if (targetYear.status === 'CLOSED' || targetYear.status === 'ARCHIVED') {
      return errorResponse('INVALID_STATE', `Cannot activate a ${targetYear.status.toLowerCase()} academic year. Please reopen or edit its status first.`, 400, 'set_active_academic_year', corsHeaders);
    }

    // Idempotency: if already active
    if (targetYear.is_current === 1 && targetYear.status === 'ACTIVE') {
      return successResponse({
        activeYear: targetYear.year_name,
        activeAcademicYear: targetYear.year_name,
        message: `Academic year ${targetYear.year_name} is already active (0 writes)`,
        idempotent: true
      }, 'set_active_academic_year', 200, corsHeaders);
    }

    // Atomic session switch
    const batch = [
      // 1. Deactivate & close previously active sessions
      env.DB.prepare(`UPDATE academic_years SET is_current = 0, status = 'CLOSED', updated_at = datetime('now') WHERE is_current = 1`),
      // 2. Activate target
      env.DB.prepare(`UPDATE academic_years SET is_current = 1, status = 'ACTIVE', updated_at = datetime('now') WHERE year_id = ?`).bind(targetYear.year_id),
      // 3. Update settings table
      env.DB.prepare(
        `INSERT INTO settings (key, school_id, value, category, description, updated_at)
         VALUES ('ACADEMIC_YEAR', ?, ?, 'ACADEMIC', 'Canonical Active Academic Session', datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
      ).bind(schoolId, targetYear.year_name),
      // 4. 1 single audit log record
      env.DB.prepare(
        `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
         VALUES (?, ?, datetime('now'), 'SET_ACTIVE_ACADEMIC_YEAR', ?, ?, ?, 'SUCCESS')`
      ).bind(
        `LOG_AY_ACT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        schoolId,
        session.role,
        session.userId || session.staffId || 'SYSTEM',
        JSON.stringify({ yearName: targetYear.year_name, yearId: targetYear.year_id })
      )
    ];

    await env.DB.batch(batch);

    return successResponse({
      activeYear: targetYear.year_name,
      activeAcademicYear: targetYear.year_name,
      academicYear: formatAcademicYearRecord({ ...targetYear, is_current: 1, status: 'ACTIVE' }),
      message: `Active academic session successfully set to ${targetYear.year_name}. Historical records remain intact.`
    }, 'set_active_academic_year', 200, corsHeaders);
  },

  /**
   * Closes an academic year (Zero data loss).
   */
  async closeAcademicYear(env, session, payload, corsHeaders) {
    if (!Security.isAdminOrPrincipal(session)) {
      return errorResponse('UNAUTHORIZED', 'Administrative privilege required to close academic session', 403, 'close_academic_year', corsHeaders);
    }

    const schoolId = payload.schoolId || session.schoolId || env.SCHOOL_ID || 'GAMERI-HSS-001';
    const targetKey = String(payload.yearName || payload.yearId || payload.academicYear || payload.code || payload.academic_year || '').trim();

    const targetYear = await env.DB.prepare(
      `SELECT * FROM academic_years WHERE year_name = ? OR year_id = ?`
    ).bind(targetKey, targetKey).first();

    if (!targetYear) {
      return errorResponse('NOT_FOUND', `Academic year "${targetKey}" not found`, 404, 'close_academic_year', corsHeaders);
    }

    if (targetYear.is_current === 1) {
      return errorResponse('CONFLICT', `Cannot close the currently active academic year (${targetYear.year_name}). Please activate the new academic year first before closing this session.`, 409, 'close_academic_year', corsHeaders);
    }

    if (targetYear.status === 'CLOSED') {
      return successResponse({
        academicYear: formatAcademicYearRecord(targetYear),
        message: `Academic year ${targetYear.year_name} is already closed (0 writes)`,
        idempotent: true
      }, 'close_academic_year', 200, corsHeaders);
    }

    const batch = [
      env.DB.prepare(`UPDATE academic_years SET status = 'CLOSED', is_current = 0, updated_at = datetime('now') WHERE year_id = ?`).bind(targetYear.year_id),
      env.DB.prepare(
        `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
         VALUES (?, ?, datetime('now'), 'CLOSE_ACADEMIC_YEAR', ?, ?, ?, 'SUCCESS')`
      ).bind(
        `LOG_AY_CLS_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        schoolId,
        session.role,
        session.userId || session.staffId || 'SYSTEM',
        JSON.stringify({ yearName: targetYear.year_name, yearId: targetYear.year_id })
      )
    ];

    await env.DB.batch(batch);

    return successResponse({
      academicYear: formatAcademicYearRecord({ ...targetYear, status: 'CLOSED', is_current: 0 }),
      message: `Academic year ${targetYear.year_name} closed successfully. All historical student, attendance, and exam records remain preserved.`
    }, 'close_academic_year', 200, corsHeaders);
  },

  /**
   * Archives an older academic year (Zero data loss).
   */
  async archiveAcademicYear(env, session, payload, corsHeaders) {
    if (!Security.isAdminOrPrincipal(session)) {
      return errorResponse('UNAUTHORIZED', 'Administrative privilege required to archive academic session', 403, 'archive_academic_year', corsHeaders);
    }

    const schoolId = payload.schoolId || session.schoolId || env.SCHOOL_ID || 'GAMERI-HSS-001';
    const targetKey = String(payload.yearName || payload.yearId || payload.academicYear || payload.code || payload.academic_year || '').trim();

    const targetYear = await env.DB.prepare(
      `SELECT * FROM academic_years WHERE year_name = ? OR year_id = ?`
    ).bind(targetKey, targetKey).first();

    if (!targetYear) {
      return errorResponse('NOT_FOUND', `Academic year "${targetKey}" not found`, 404, 'archive_academic_year', corsHeaders);
    }

    if (targetYear.is_current === 1) {
      return errorResponse('CONFLICT', `Cannot archive the currently active academic year (${targetYear.year_name}).`, 409, 'archive_academic_year', corsHeaders);
    }

    if (targetYear.status === 'ARCHIVED') {
      return successResponse({
        academicYear: formatAcademicYearRecord(targetYear),
        message: `Academic year ${targetYear.year_name} is already archived (0 writes)`,
        idempotent: true
      }, 'archive_academic_year', 200, corsHeaders);
    }

    const batch = [
      env.DB.prepare(`UPDATE academic_years SET status = 'ARCHIVED', is_current = 0, updated_at = datetime('now') WHERE year_id = ?`).bind(targetYear.year_id),
      env.DB.prepare(
        `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
         VALUES (?, ?, datetime('now'), 'ARCHIVE_ACADEMIC_YEAR', ?, ?, ?, 'SUCCESS')`
      ).bind(
        `LOG_AY_ARC_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        schoolId,
        session.role,
        session.userId || session.staffId || 'SYSTEM',
        JSON.stringify({ yearName: targetYear.year_name, yearId: targetYear.year_id })
      )
    ];

    await env.DB.batch(batch);

    return successResponse({
      academicYear: formatAcademicYearRecord({ ...targetYear, status: 'ARCHIVED', is_current: 0 }),
      message: `Academic year ${targetYear.year_name} archived successfully. Historical records remain fully accessible.`
    }, 'archive_academic_year', 200, corsHeaders);
  }
};
