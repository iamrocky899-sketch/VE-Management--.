/**
 * VE MANAGEMENT — UNIFIED COLORFUL ACADEMIC CALENDAR SYSTEM
 * Provides canonical evaluation, priority resolution, and styling tokens for:
 * 🟢 Working Day | 🔴 Holiday | 🟣 Exam | 🔵 Event | ⚪ Sunday / Weekend
 */

export const CALENDAR_CATEGORIES = {
  HOLIDAY: {
    id: 'HOLIDAY',
    label: 'Holiday',
    icon: '🔴',
    color: '#dc2626',
    border: '#fca5a5',
    bg: '#fef2f2',
    dateColor: '#dc2626',
    priority: 1
  },
  EXAM: {
    id: 'EXAM',
    label: 'Exam',
    icon: '🟣',
    color: '#7c3aed',
    border: '#d8b4fe',
    bg: '#faf5ff',
    dateColor: '#7c3aed',
    priority: 2
  },
  EVENT: {
    id: 'EVENT',
    label: 'Event',
    icon: '🔵',
    color: '#0284c7',
    border: '#bae6fd',
    bg: '#f0f9ff',
    dateColor: '#0284c7',
    priority: 3
  },
  CNH: {
    id: 'CNH',
    label: 'Class Not Held',
    icon: '⚠️',
    color: '#d97706',
    border: '#fde68a',
    bg: '#fffbeb',
    dateColor: '#b45309',
    priority: 4
  },
  WORKING_DAY: {
    id: 'WORKING_DAY',
    label: 'Working Day',
    icon: '🟢',
    color: '#059669',
    border: '#e2e8f0',
    bg: '#ffffff',
    dateColor: '#1e293b',
    priority: 5
  },
  SUNDAY: {
    id: 'SUNDAY',
    label: 'Sunday',
    icon: '⚪',
    color: '#e11d48',
    border: '#fecdd3',
    bg: '#fff1f2',
    dateColor: '#e11d48',
    priority: 6
  },
  SATURDAY_OFF: {
    id: 'SATURDAY_OFF',
    label: 'Saturday Off',
    icon: '⚪',
    color: '#64748b',
    border: '#e2e8f0',
    bg: '#f8fafc',
    dateColor: '#64748b',
    priority: 7
  }
};

/**
 * Evaluates a given date against calendar events, class policies, and attendance records.
 * Priority: Holiday -> Exam -> Event -> Working Day -> Sunday/Weekend.
 */
export function evaluateCalendarDate(dateStr, selectedClass = '9', calendarEvents = [], attendanceRecords = []) {
  const parts = dateStr.split('-');
  const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
  const classStr = String(selectedClass || '9').replace(/^Class\s+/i, '');

  // 1. Gather all events matching this date
  const matchingEvents = (calendarEvents || []).filter(e => {
    if (!e) return false;
    const eventDate = e.date || e.startDate || e.start_date || '';
    const eventEndDate = e.endDate || e.end_date || eventDate;
    if (eventDate === dateStr) return true;
    if (eventDate && eventEndDate && eventDate <= dateStr && eventEndDate >= dateStr) return true;
    return false;
  });

  // Categorize events
  const holidays = matchingEvents.filter(e => {
    const t = (e.eventType || e.event_type || e.type || e.category || '').toUpperCase();
    const title = (e.title || '').trim().toLowerCase();
    // Pure Sunday or weekly holiday entries resolve to the SUNDAY category, not an official holiday
    if (title === 'sunday' || title === 'weekly holiday') {
      return false;
    }
    return t === 'HOLIDAY' || t === 'VACATION' || title.includes('holiday') || title.includes('vacation') || title.includes('tithi') || title.includes('puja') || title.includes('diwas') || title.includes('jayanti');
  });

  const exams = matchingEvents.filter(e => {
    const t = (e.eventType || e.event_type || e.type || e.category || '').toUpperCase();
    const title = (e.title || '').toLowerCase();
    return t === 'EXAM' || t === 'EXAMINATION' || title.includes('examination') || title.includes('exam') || title.includes('test');
  });

  const cnhEvents = matchingEvents.filter(e => {
    const t = (e.eventType || e.event_type || e.type || e.category || '').toUpperCase();
    const title = (e.title || '').toLowerCase();
    return t === 'CLASS_NOT_HELD' || t === 'CNH' || title.includes('class not held');
  });

  const activities = matchingEvents.filter(e => {
    const title = (e.title || '').trim().toLowerCase();
    if (title === 'sunday' || title === 'weekly holiday') {
      return false;
    }
    return !holidays.includes(e) && !exams.includes(e) && !cnhEvents.includes(e);
  });

  // Check attendance for this date & class
  const dayAttendance = (attendanceRecords || []).filter(
    a => a && a.date === dateStr && String(a.class || a.className || '').replace(/^Class\s+/i, '') === classStr
  );
  const presentCount = dayAttendance.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;
  const absentCount = dayAttendance.length - presentCount;
  const hasAttendance = dayAttendance.length > 0;

  // -------------------------------------------------------------
  // RESOLVE PRIORITY: Holiday -> Exam -> Event -> Working -> Sunday/Sat
  // -------------------------------------------------------------

  // A. HOLIDAY
  if (holidays.length > 0) {
    const primary = holidays[0];
    const title = primary.title || 'Official Holiday';
    const description = primary.description || 'ASSEB Official Holiday';
    return {
      dateStr,
      dayOfWeek,
      category: 'holiday',
      status: 'HOLIDAY',
      primaryTitle: title,
      title,
      primaryDescription: description,
      description,
      primaryEvent: primary,
      event: primary,
      allEvents: matchingEvents,
      hasMultiple: matchingEvents.length > 1,
      extraCount: Math.max(0, matchingEvents.length - 1),
      eventCount: matchingEvents.length,
      isWorking: false,
      isRecorded: hasAttendance,
      presentCount,
      absentCount,
      cellClass: 'cal-cell-holiday',
      badgeIcon: '🔴',
      badgeLabel: primary.title ? primary.title.substring(0, 16) : 'Holiday',
      config: CALENDAR_CATEGORIES.HOLIDAY
    };
  }

  // B. EXAM
  if (exams.length > 0) {
    const primary = exams[0];
    const title = primary.title || 'Scheduled Examination';
    const description = primary.description || 'Academic Examination';
    return {
      dateStr,
      dayOfWeek,
      category: 'exam',
      status: 'EXAM',
      primaryTitle: title,
      title,
      primaryDescription: description,
      description,
      primaryEvent: primary,
      event: primary,
      allEvents: matchingEvents,
      hasMultiple: matchingEvents.length > 1,
      extraCount: Math.max(0, matchingEvents.length - 1),
      eventCount: matchingEvents.length,
      isWorking: true,
      isRecorded: hasAttendance,
      presentCount,
      absentCount,
      cellClass: 'cal-cell-exam',
      badgeIcon: '🟣',
      badgeLabel: primary.title ? primary.title.substring(0, 16) : 'Exam',
      config: CALENDAR_CATEGORIES.EXAM
    };
  }

  // C. CLASS NOT HELD
  if (cnhEvents.length > 0) {
    const primary = cnhEvents[0];
    const title = primary.title || 'Class Not Held';
    const description = primary.description || 'Classes suspended for academic/administrative reasons';
    return {
      dateStr,
      dayOfWeek,
      category: 'cnh',
      status: 'CLASS_NOT_HELD',
      primaryTitle: title,
      title,
      primaryDescription: description,
      description,
      primaryEvent: primary,
      event: primary,
      allEvents: matchingEvents,
      hasMultiple: matchingEvents.length > 1,
      extraCount: Math.max(0, matchingEvents.length - 1),
      eventCount: matchingEvents.length,
      isWorking: false,
      isRecorded: hasAttendance,
      presentCount,
      absentCount,
      cellClass: 'cal-cell-cnh',
      badgeIcon: '⚠️',
      badgeLabel: 'Class Not Held',
      config: CALENDAR_CATEGORIES.CNH
    };
  }

  // D. EVENT / ACTIVITY
  if (activities.length > 0) {
    const primary = activities[0];
    const title = primary.title || 'School Event';
    const description = primary.description || 'Official School Activity / Observation';
    return {
      dateStr,
      dayOfWeek,
      category: 'event',
      status: 'EVENT',
      primaryTitle: title,
      title,
      primaryDescription: description,
      description,
      primaryEvent: primary,
      event: primary,
      allEvents: matchingEvents,
      hasMultiple: matchingEvents.length > 1,
      extraCount: Math.max(0, matchingEvents.length - 1),
      eventCount: matchingEvents.length,
      isWorking: true,
      isRecorded: hasAttendance,
      presentCount,
      absentCount,
      cellClass: 'cal-cell-event',
      badgeIcon: '🔵',
      badgeLabel: primary.title ? primary.title.substring(0, 16) : 'Event',
      config: CALENDAR_CATEGORIES.EVENT
    };
  }

  // E. SUNDAY (Weekend Off for all classes)
  if (dayOfWeek === 0) {
    const title = 'Sunday (Weekly Off)';
    const description = 'Standard weekly holiday for Gameri Higher Secondary School';
    return {
      dateStr,
      dayOfWeek,
      category: 'sunday',
      status: 'SUNDAY',
      primaryTitle: title,
      title,
      primaryDescription: description,
      description,
      primaryEvent: null,
      event: null,
      allEvents: [],
      hasMultiple: false,
      extraCount: 0,
      eventCount: 0,
      isWorking: false,
      isRecorded: hasAttendance,
      presentCount,
      absentCount,
      cellClass: 'cal-cell-sunday',
      badgeIcon: '⚪',
      badgeLabel: 'Sunday',
      config: CALENDAR_CATEGORIES.SUNDAY
    };
  }

  // F. SATURDAY (Classes 9-10 OFF, Classes 11-12 WORKING)
  if (dayOfWeek === 6) {
    if (classStr === '9' || classStr === '10') {
      const title = 'Saturday Off (Class IX–X)';
      const description = 'ASSEB policy: Vocational secondary classes IX–X observe Saturday off';
      return {
        dateStr,
        dayOfWeek,
        category: 'saturday-off',
        status: 'SATURDAY_OFF',
        primaryTitle: title,
        title,
        primaryDescription: description,
        description,
        primaryEvent: null,
        event: null,
        allEvents: [],
        hasMultiple: false,
        extraCount: 0,
        eventCount: 0,
        isWorking: false,
        isRecorded: hasAttendance,
        presentCount,
        absentCount,
        cellClass: 'cal-cell-saturday-off',
        badgeIcon: '⚪',
        badgeLabel: 'Sat Off',
        config: CALENDAR_CATEGORIES.SATURDAY_OFF
      };
    }
  }

  // G. WORKING DAY
  const title = hasAttendance
    ? `Attendance Recorded (${presentCount} Present, ${absentCount} Absent)`
    : 'Official Working Day';
  const description = hasAttendance
    ? `Attendance logged for Class ${classStr}`
    : 'Scheduled instructional working session';
  return {
    dateStr,
    dayOfWeek,
    category: 'working',
    status: hasAttendance ? 'RECORDED' : 'WORKING_DAY',
    primaryTitle: title,
    title,
    primaryDescription: description,
    description,
    primaryEvent: null,
    event: null,
    allEvents: [],
    hasMultiple: false,
    extraCount: 0,
    eventCount: 0,
    isWorking: true,
    isRecorded: hasAttendance,
    presentCount,
    absentCount,
    cellClass: hasAttendance ? 'cal-cell-working is-recorded' : 'cal-cell-working',
    badgeIcon: '🟢',
    badgeLabel: hasAttendance ? '✓ Recorded' : 'Working Day',
    config: CALENDAR_CATEGORIES.WORKING_DAY
  };
}
