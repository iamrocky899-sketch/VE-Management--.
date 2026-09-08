/**
 * VE MANAGEMENT — ACTIVITIES API HANDLERS
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Implements full CRUD with strict Free-tier D1 write optimization:
 * Conditional UPSERT ensures zero D1 row writes on unchanged data.
 */

import { successResponse, errorResponse } from '../response.js';
import { Security } from '../security.js';

const VALID_CATEGORIES = ['VOCATIONAL', 'SPORTS', 'CULTURAL', 'COMMUNITY', 'EXHIBITION', 'LAB_WORK'];

export const ActivitiesApi = {
  /**
   * Creates or updates activities with conditional change detection.
   */
  async saveActivities(env, session, payload, corsHeaders) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return errorResponse('UNAUTHORIZED', 'Write permission denied for Activities', 403, 'save_activities', corsHeaders);
    }

    const schoolId = session.schoolId || env.SCHOOL_ID || 'GAMERI-HSS-001';
    const items = Array.isArray(payload.activities)
      ? payload.activities
      : Array.isArray(payload)
        ? payload
        : [payload];

    if (items.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'No activities provided to save', 400, 'save_activities', corsHeaders);
    }

    // Validation checks
    for (const item of items) {
      const title = String(item.title || '').trim();
      if (!title) {
        return errorResponse('VALIDATION_ERROR', 'Activity title is required', 400, 'save_activities', corsHeaders);
      }
      if (session.role === 'TEACHER' && item.class && item.class !== 'All') {
        const canAccessCls = await Security.canTeacherAccessClass(env.DB, session.userId, String(item.class));
        if (!canAccessCls) {
          return errorResponse('UNAUTHORIZED', `Teacher cannot save activities for unassigned class: ${item.class}`, 403, 'save_activities', corsHeaders);
        }
      }
    }

    const savedRecords = [];
    let hasActualChanges = false;

    for (const item of items) {
      const activityId = String(item.activityId || item.activity_id || item.id || `ACT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
      const title = String(item.title).trim();
      const description = String(item.description || '').trim();
      const dateStr = String(item.date || new Date().toISOString().split('T')[0]).trim();
      let rawCat = String(item.category || 'VOCATIONAL').toUpperCase().trim();
      const category = VALID_CATEGORIES.includes(rawCat) ? rawCat : 'VOCATIONAL';
      const targetClass = String(item.class || 'All').trim();
      const section = String(item.section || 'All').trim();
      const visibility = String(item.visibility || 'PUBLIC').trim();

      const runResult = await env.DB.prepare(
        `INSERT INTO activities (
           activity_id, school_id, title, description, date, category, class, section, visibility, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(activity_id) DO UPDATE SET
           title = excluded.title,
           description = excluded.description,
           date = excluded.date,
           category = excluded.category,
           class = excluded.class,
           section = excluded.section,
           visibility = excluded.visibility,
           updated_at = datetime('now')
         WHERE activities.title IS NOT excluded.title
            OR activities.description IS NOT excluded.description
            OR activities.date IS NOT excluded.date
            OR activities.category IS NOT excluded.category
            OR activities.class IS NOT excluded.class
            OR activities.section IS NOT excluded.section
            OR activities.visibility IS NOT excluded.visibility`
      ).bind(
        activityId, schoolId, title, description, dateStr, category, targetClass, section, visibility
      ).run();

      if (runResult?.meta?.changes > 0) {
        hasActualChanges = true;
      }

      savedRecords.push({
        activityId,
        activity_id: activityId,
        schoolId,
        title,
        description,
        date: dateStr,
        category,
        class: targetClass,
        section,
        visibility
      });
    }

    // Only write audit log if records were actually inserted or modified
    if (hasActualChanges) {
      try {
        const logId = `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await env.DB.prepare(
          `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
           VALUES (?, ?, datetime('now'), 'SAVE_ACTIVITIES', ?, ?, ?, 'SUCCESS')`
        ).bind(
          logId,
          schoolId,
          session.role,
          session.userId,
          JSON.stringify({ count: savedRecords.length, activityIds: savedRecords.map(r => r.activityId) })
        ).run();
      } catch (auditErr) {
        console.error('[Audit] Failed to log activities save:', auditErr);
      }
    }

    return successResponse({
      activities: savedRecords,
      total: savedRecords.length,
      changed: hasActualChanges
    }, 'save_activities', 200, corsHeaders);
  },

  /**
   * Deletes an activity record with IDOR protection.
   */
  async deleteActivity(env, session, payload, corsHeaders) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return errorResponse('UNAUTHORIZED', 'Delete permission denied for Activities', 403, 'delete_activity', corsHeaders);
    }

    const activityId = payload.activityId || payload.id;
    if (!activityId) {
      return errorResponse('VALIDATION_ERROR', 'activityId is required', 400, 'delete_activity', corsHeaders);
    }

    const schoolId = session.schoolId || env.SCHOOL_ID || 'GAMERI-HSS-001';
    const existing = await env.DB.prepare(
      `SELECT * FROM activities WHERE activity_id = ? AND school_id = ?`
    ).bind(activityId, schoolId).first();

    if (!existing) {
      return errorResponse('NOT_FOUND', 'Activity not found', 404, 'delete_activity', corsHeaders);
    }

    if (session.role === 'TEACHER' && existing.class && existing.class !== 'All') {
      const canAccessCls = await Security.canTeacherAccessClass(env.DB, session.userId, String(existing.class));
      if (!canAccessCls) {
        return errorResponse('UNAUTHORIZED', `Delete permission denied for unassigned class: ${existing.class}`, 403, 'delete_activity', corsHeaders);
      }
    }

    await env.DB.prepare(
      `DELETE FROM activities WHERE activity_id = ? AND school_id = ?`
    ).bind(activityId, schoolId).run();

    try {
      const logId = `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await env.DB.prepare(
        `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
         VALUES (?, ?, datetime('now'), 'DELETE_ACTIVITY', ?, ?, ?, 'SUCCESS')`
      ).bind(
        logId,
        schoolId,
        session.role,
        session.userId,
        JSON.stringify({ activityId, title: existing.title, class: existing.class })
      ).run();
    } catch (auditErr) {
      console.error('[Audit] Failed to log activity deletion:', auditErr);
    }

    return successResponse({
      activityId,
      deleted: true,
      message: 'Activity deleted successfully'
    }, 'delete_activity', 200, corsHeaders);
  }
};
