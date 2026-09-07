import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';
import { sendApiRequest } from '../../api/client';
import { evaluateCalendarDate, CALENDAR_CATEGORIES } from '../../utils/calendarSystem';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Clock,
  BookOpen,
  Award,
  CheckCircle,
  AlertTriangle,
  Users,
  Info,
  X
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar({ onNavigate }) {
  const { user, isTeacher, isPrincipal } = useAuth();

  // Class Selection & Scoping
  const availableClasses = useMemo(() => {
    if (isTeacher) {
      return user?.assignedClasses && user.assignedClasses.length > 0 ? user.assignedClasses : ['9', '10'];
    }
    return ['9', '10', '11', '12'];
  }, [isTeacher, user]);

  const [selectedClass, setSelectedClass] = useState(() => availableClasses[0] || '9');

  // Month and Year state
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Selected Day for Detail Modal
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  // Fetch Calendar Events, Attendance & Notices
  const loadCalendarData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Fetch Calendar Events
      const calRes = await sendApiRequest('get_calendar');
      setCalendarEvents(calRes?.data?.events || []);

      // 2. Fetch Attendance for Class
      const attRes = await sendApiRequest('get_attendance', { class: selectedClass });
      setAttendanceRecords(attRes?.data?.attendance || []);

      // 3. Fetch Notices for Class
      const ntcRes = await sendApiRequest('get_notices', { class: selectedClass });
      setNotices(ntcRes?.data?.notices || []);
    } catch (err) {
      setError('Unable to load calendar events. Please check your network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [selectedClass]);


  // Navigate Months
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate Month Matrix (7 columns)
  const monthDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        evaluation: evaluateCalendarDate(dateStr, selectedClass, calendarEvents, attendanceRecords)
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const yearStr = currentYear;
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(dayNum).padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dStr}`;

      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: true,
        evaluation: evaluateCalendarDate(dateStr, selectedClass, calendarEvents, attendanceRecords)
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remaining = 42 - days.length;
    if (remaining > 0 && remaining < 7) {
      for (let dayNum = 1; dayNum <= remaining; dayNum++) {
        const nextDate = new Date(currentYear, currentMonth + 1, dayNum);
        const dateStr = nextDate.toISOString().split('T')[0];
        days.push({
          dayNum,
          dateStr,
          isCurrentMonth: false,
          evaluation: evaluateCalendarDate(dateStr, selectedClass, calendarEvents, attendanceRecords)
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, selectedClass, calendarEvents, attendanceRecords]);

  // Upcoming Academic Events list
  const upcomingEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const events = [...calendarEvents].filter((e) => (e.date || e.startDate || '') >= todayStr);
    events.sort((a, b) => new Date(a.date || a.startDate || 0) - new Date(b.date || b.startDate || 0));
    return events.slice(0, 5);
  }, [calendarEvents]);

  return (
    <div>
      {/* 1. Header Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Class Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="cal-class-select" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                Class Rules:
              </label>
              <select
                id="cal-class-select"
                className="filter-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                aria-label="Select Class Policy"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls} {isTeacher ? '(Assigned)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn-refresh"
              style={{ color: 'var(--slate-700)', background: '#ffffff', borderColor: 'var(--slate-200)' }}
              onClick={() => loadCalendarData(true)}
              disabled={refreshing}
              aria-label="Refresh calendar"
            >
              <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert-banner alert-danger" role="alert" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} className="flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* 2. Main Calendar Container */}
      <div className="calendar-container">
        {/* Monthly Calendar View */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn-month-nav"
                onClick={prevMonth}
                aria-label="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                className="btn-month-nav"
                style={{ padding: '0 14px', fontSize: '0.8125rem' }}
                onClick={goToToday}
              >
                Today
              </button>

              <button
                type="button"
                className="btn-month-nav"
                onClick={nextMonth}
                aria-label="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* 7-Day Weekday Headers */}
          <div className="calendar-month-grid" style={{ marginTop: '0', borderBottom: '1px solid var(--slate-100)', paddingBottom: '8px' }}>
            {WEEKDAY_NAMES.map((w) => (
              <div key={w} className="calendar-day-header">
                {w}
              </div>
            ))}
          </div>

          {/* Monthly Days Grid */}
          {loading ? (
            <div className="skeleton skeleton-card" style={{ height: '380px', marginTop: '14px' }} />
          ) : (
            <div className="calendar-month-grid">
              {monthDays.map((day, idx) => {
                const evalData = day.evaluation;
                const isSelected = selectedDayDetail?.dateStr === day.dateStr;
                const todayStr = new Date().toISOString().split('T')[0];
                const isToday = day.dateStr === todayStr;

                let cellClass = `calendar-day-cell cal-cell-${evalData.category}`;
                if (!day.isCurrentMonth) cellClass += ' is-other-month';
                if (isSelected) cellClass += ' active-day';
                if (isToday) cellClass += ' is-today';

                // Category badge indicator
                let badgeEl = null;
                if (evalData.category === 'sunday') {
                  badgeEl = <span className="cal-cell-badge badge-sunday">Sun</span>;
                } else if (evalData.category === 'saturday-off') {
                  badgeEl = <span className="cal-cell-badge badge-sat">Sat</span>;
                } else if (evalData.category === 'holiday') {
                  badgeEl = <span className="cal-cell-badge badge-holiday" title="Holiday">🔴</span>;
                } else if (evalData.category === 'exam') {
                  badgeEl = <span className="cal-cell-badge badge-exam" title="Examination">🟣</span>;
                } else if (evalData.category === 'event') {
                  badgeEl = <span className="cal-cell-badge badge-event" title="School Event">🔵</span>;
                }

                const multiIndicator = evalData.eventCount > 1 ? (
                  <span className="cal-multi-indicator" title={`${evalData.eventCount} events on this date`}>
                    +{evalData.eventCount - 1}
                  </span>
                ) : null;

                return (
                  <div
                    key={idx}
                    className={cellClass}
                    onClick={() => setSelectedDayDetail({ ...day, evalData })}
                    role="button"
                    tabIndex={0}
                    aria-label={`${day.dateStr}: ${evalData.title}`}
                  >
                    <div className="cal-cell-header">
                      <span className="calendar-day-num">{day.dayNum}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {multiIndicator}
                        {badgeEl}
                      </div>
                    </div>

                    <div className="cal-cell-title" title={evalData.title}>
                      {evalData.allEvents && evalData.allEvents.length > 0 ? (
                        evalData.allEvents[0].title
                      ) : evalData.status === 'RECORDED' ? (
                        <span style={{ color: 'var(--success-700)', fontWeight: 600 }}>✓ Recorded</span>
                      ) : evalData.status === 'WORKING_DAY' ? (
                        <span style={{ color: 'var(--slate-500)' }}>Working</span>
                      ) : evalData.status === 'CLASS_NOT_HELD' ? (
                        <span style={{ color: 'var(--warning-700)', fontWeight: 600 }}>Not Held</span>
                      ) : evalData.category === 'sunday' ? (
                        <span style={{ color: '#e11d48', fontWeight: 600 }}>Sunday</span>
                      ) : evalData.category === 'saturday-off' ? (
                        <span style={{ color: '#64748b' }}>Weekend</span>
                      ) : (
                        evalData.subtitle || ''
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Calendar Status Legend */}
          <div className="calendar-legend-container">
            <div className="legend-item">
              <span className="legend-pill pill-working">🟢 Working Day</span>
            </div>
            <div className="legend-item">
              <span className="legend-pill pill-holiday">🔴 Holiday</span>
            </div>
            <div className="legend-item">
              <span className="legend-pill pill-exam">🟣 Exam</span>
            </div>
            <div className="legend-item">
              <span className="legend-pill pill-event">🔵 Event</span>
            </div>
            <div className="legend-item">
              <span className="legend-pill pill-sunday">⚪ Sunday / Weekend</span>
            </div>
          </div>
        </div>

        {/* 3. Day Detail & Upcoming Events Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Day Detail Card */}
          {selectedDayDetail ? (
            <div className="card" style={{
              padding: '20px',
              borderLeft: `4px solid ${
                selectedDayDetail.evalData.category === 'holiday' ? '#dc2626' :
                selectedDayDetail.evalData.category === 'exam' ? '#7c3aed' :
                selectedDayDetail.evalData.category === 'event' ? '#0284c7' :
                selectedDayDetail.evalData.category === 'sunday' ? '#e11d48' :
                'var(--primary-500)'
              }`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="hero-chip" style={{
                  background: selectedDayDetail.evalData.category === 'holiday' ? '#fee2e2' :
                              selectedDayDetail.evalData.category === 'exam' ? '#f3e8ff' :
                              selectedDayDetail.evalData.category === 'event' ? '#e0f2fe' :
                              selectedDayDetail.evalData.category === 'sunday' ? '#ffe4e6' :
                              'var(--primary-50)',
                  color: selectedDayDetail.evalData.category === 'holiday' ? '#991b1b' :
                         selectedDayDetail.evalData.category === 'exam' ? '#6b21a8' :
                         selectedDayDetail.evalData.category === 'event' ? '#075985' :
                         selectedDayDetail.evalData.category === 'sunday' ? '#9f1239' :
                         'var(--primary-700)',
                  fontWeight: 700
                }}>
                  {selectedDayDetail.dateStr}
                </span>
                <button className="search-clear-btn" onClick={() => setSelectedDayDetail(null)} aria-label="Close details">
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {selectedDayDetail.evalData.category === 'holiday' ? '🔴' :
                   selectedDayDetail.evalData.category === 'exam' ? '🟣' :
                   selectedDayDetail.evalData.category === 'event' ? '🔵' :
                   selectedDayDetail.evalData.category === 'sunday' ? '⚪' : '🟢'}
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                  {selectedDayDetail.evalData.title}
                </h3>
              </div>

              {/* Multiple Events on Date */}
              {selectedDayDetail.evalData.allEvents && selectedDayDetail.evalData.allEvents.length > 0 && (
                <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedDayDetail.evalData.allEvents.map((evt, eIdx) => (
                    <div
                      key={evt.id || eIdx}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'var(--slate-50)',
                        border: '1px solid var(--slate-200)',
                        fontSize: '0.8125rem'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--slate-800)' }}>
                        {evt.title}
                      </div>
                      {evt.description && (
                        <div style={{ color: 'var(--slate-600)', marginTop: '2px', fontSize: '0.75rem' }}>
                          {evt.description}
                        </div>
                      )}
                      <div style={{ color: 'var(--slate-400)', fontSize: '0.7rem', marginTop: '2px' }}>
                        Category: {evt.type || evt.category || 'ACADEMIC'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
                <p style={{ margin: '4px 0' }}>
                  <strong>Status:</strong>{' '}
                  <span style={{
                    color: selectedDayDetail.evalData.isWorking ? 'var(--success-700)' : 'var(--danger-700)',
                    fontWeight: 600
                  }}>
                    {selectedDayDetail.evalData.isWorking ? 'Working Day' : 'Non-Working Day'}
                  </span>
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Class Rule:</strong> Class {selectedClass}
                </p>
                {selectedDayDetail.evalData.present !== undefined && (
                  <p style={{ margin: '4px 0', color: 'var(--success-700)', fontWeight: 600 }}>
                    Recorded: {selectedDayDetail.evalData.present} Present, {selectedDayDetail.evalData.absent} Absent
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '20px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.875rem' }}>
              <Info size={28} style={{ margin: '0 auto 8px auto', color: 'var(--primary-400)' }} />
              Click any calendar day to inspect Attendance 2.0 day status and event details.
            </div>
          )}

          {/* Upcoming Academic Events */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={16} color="var(--primary-600)" />
              <span>Upcoming Events</span>
            </h3>

            {upcomingEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--slate-400)', fontSize: '0.8125rem' }}>
                No upcoming events scheduled.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {upcomingEvents.map((evt, eIdx) => (
                  <div
                    key={evt.eventId || eIdx}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--slate-50)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--slate-200)',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                      {evt.title}
                    </div>
                    <div style={{ color: 'var(--slate-500)', fontSize: '0.75rem', marginTop: '2px' }}>
                      {evt.date || evt.startDate || 'Upcoming'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
