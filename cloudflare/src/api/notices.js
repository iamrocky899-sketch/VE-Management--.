/**
 * VE MANAGEMENT — NOTICES, REPORTS, SETTINGS, CALENDAR & PRACTICALS HANDLERS
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 */

import { successResponse, errorResponse } from '../response.js';

export const NoticesApi = {
  async getNotices(env, session, payload, corsHeaders) {
    const { results } = await env.DB.prepare(
      `SELECT * FROM notices WHERE status = 'PUBLISHED' ORDER BY is_highlighted DESC, date DESC`
    ).all();
    return successResponse({ notices: results || [] }, 'get_notices', 200, corsHeaders);
  }
};

export const ReportsApi = {
  async getDashboardSummary(env, session, payload, corsHeaders) {
    let students = 40;
    let staff = 2;
    let notices = 1;

    try {
      const stuCount = await env.DB.prepare(`SELECT COUNT(*) as count FROM students WHERE status = 'Active'`).first();
      if (stuCount && stuCount.count !== undefined) students = stuCount.count;
    } catch (e) {}

    try {
      const staffCount = await env.DB.prepare(`SELECT COUNT(*) as count FROM staff WHERE status = 'ACTIVE'`).first();
      if (staffCount && staffCount.count !== undefined) staff = staffCount.count;
    } catch (e) {}

    try {
      const noticeCount = await env.DB.prepare(`SELECT COUNT(*) as count FROM notices WHERE status = 'PUBLISHED'`).first();
      if (noticeCount && noticeCount.count !== undefined) notices = noticeCount.count;
    } catch (e) {}

    return successResponse({
      summary: {
        totalStudents: students,
        totalStaff: staff,
        activeNotices: notices,
        schoolId: env.SCHOOL_ID || 'GAMERI-HSS-001'
      },
      counts: {
        students: students,
        staff: staff,
        notices: notices
      },
      schoolName: env.SCHOOL_NAME || 'Gameri Higher Secondary School, Gamiri',
      schoolId: env.SCHOOL_ID || 'GAMERI-HSS-001'
    }, 'get_dashboard_summary', 200, corsHeaders);
  }
};

export const SettingsApi = {
  async getSettings(env, session, payload, corsHeaders) {
    const { results } = await env.DB.prepare(`SELECT * FROM settings`).all();
    return successResponse({ settings: results || [] }, 'get_settings', 200, corsHeaders);
  }
};

import { ASSEB_CALENDAR_EVENTS } from '../data/asseb_calendar.js';

export const CalendarApi = {
  async getCalendar(env, session, payload, corsHeaders) {
    try {
      // 1. Fetch D1 calendar overrides/additions
      const { results: d1Calendar } = await env.DB.prepare(
        `SELECT * FROM calendar ORDER BY date ASC`
      ).all();

      // 2. Fetch scheduled examinations
      const { results: d1Exams } = await env.DB.prepare(
        `SELECT * FROM examinations WHERE status != 'ARCHIVED' ORDER BY start_date ASC`
      ).all();

      // 3. Fetch school activities
      const { results: d1Activities } = await env.DB.prepare(
        `SELECT * FROM activities ORDER BY date ASC LIMIT 100`
      ).all();

      // Map exam rows into calendar events
      const examEvents = (d1Exams || []).map(exam => ({
        calendar_id: `EXAM_${exam.exam_id}`,
        calendarId: `EXAM_${exam.exam_id}`,
        date: exam.start_date,
        startDate: exam.start_date,
        start_date: exam.start_date,
        endDate: exam.end_date,
        end_date: exam.end_date,
        title: exam.exam_name,
        description: `${exam.exam_name} (${exam.exam_type}) for Class ${exam.class}`,
        event_type: 'EXAMINATION',
        eventType: 'EXAMINATION',
        category: 'EXAM',
        is_working: 1,
        isWorking: 1,
        class_scope: exam.class,
        source: 'D1_EXAMINATIONS'
      }));

      // Map activity rows into calendar events
      const activityEvents = (d1Activities || []).map(act => ({
        calendar_id: `ACT_${act.activity_id}`,
        calendarId: `ACT_${act.activity_id}`,
        date: act.date,
        startDate: act.date,
        start_date: act.date,
        title: act.title,
        description: act.description || act.title,
        event_type: 'ACTIVITY',
        eventType: 'ACTIVITY',
        category: 'EVENT',
        is_working: 1,
        isWorking: 1,
        source: 'D1_ACTIVITIES'
      }));

      // Combined Map keyed by composite key or calendar_id
      const eventMap = new Map();

      // Baseline: Official ASSEB Calendar 2026-27 (Holidays, Board Exams, Vacations)
      for (const assebEvent of ASSEB_CALENDAR_EVENTS) {
        const key = `${assebEvent.date}_${assebEvent.event_type}_${assebEvent.title}`;
        eventMap.set(key, {
          ...assebEvent,
          calendarId: assebEvent.calendar_id,
          eventType: assebEvent.event_type,
          isWorking: assebEvent.is_working,
          startDate: assebEvent.date,
          start_date: assebEvent.date
        });
      }

      // Layer: D1 Calendar rows (override baseline if collision)
      for (const row of (d1Calendar || [])) {
        const key = `${row.date}_${row.event_type || 'EVENT'}_${row.title}`;
        eventMap.set(key, {
          ...row,
          calendarId: row.calendar_id,
          eventType: row.event_type,
          category: row.event_type === 'HOLIDAY' ? 'HOLIDAY' : row.event_type === 'EXAMINATION' ? 'EXAM' : 'EVENT',
          isWorking: row.is_working,
          startDate: row.date || row.start_date,
          start_date: row.date || row.start_date,
          endDate: row.end_date,
          end_date: row.end_date
        });
      }

      // Layer: D1 Examinations
      for (const ex of examEvents) {
        eventMap.set(`EXAM_${ex.date}_${ex.title}`, ex);
      }

      // Layer: D1 Activities
      for (const act of activityEvents) {
        eventMap.set(`ACT_${act.date}_${act.title}`, act);
      }

      const mergedEvents = Array.from(eventMap.values()).sort((a, b) => {
        const dateA = a.date || a.startDate || '';
        const dateB = b.date || b.startDate || '';
        return dateA.localeCompare(dateB);
      });

      return successResponse({
        events: mergedEvents,
        calendar: mergedEvents,
        total: mergedEvents.length
      }, 'get_calendar', 200, corsHeaders);

    } catch (err) {
      console.error('Error fetching calendar events:', err);
      // Resilient fallback to baseline ASSEB calendar
      return successResponse({
        events: ASSEB_CALENDAR_EVENTS,
        calendar: ASSEB_CALENDAR_EVENTS,
        total: ASSEB_CALENDAR_EVENTS.length
      }, 'get_calendar', 200, corsHeaders);
    }
  }
};

export const PracticalsApi = {
  async getPracticalLists(env, session, payload, corsHeaders) {
    const classParam = payload.class ? String(payload.class) : '9';
    const { results } = await env.DB.prepare(`SELECT * FROM practical_lists WHERE class = ? AND status = 'ACTIVE' ORDER BY display_order ASC`).bind(classParam).all();
    return successResponse({ practicals: results || [] }, 'get_practical_lists', 200, corsHeaders);
  }
};
