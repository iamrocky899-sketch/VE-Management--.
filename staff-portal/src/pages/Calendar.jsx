import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendApiRequest } from '../api/client';
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

  // Attendance 2.0 Calendar Day Status Evaluator
  const getDayEvaluation = (dateStr) => {
    const parts = dateStr.split('-');
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

    // 1. Check Events / Holidays / Class Not Held
    const event = calendarEvents.find((e) => e.date === dateStr || (e.startDate && e.startDate <= dateStr && e.endDate >= dateStr));
    if (event && (event.type === 'CLASS_NOT_HELD' || event.status === 'CLASS_NOT_HELD' || (event.title || '').toLowerCase().includes('class not held'))) {
      return {
        status: 'CLASS_NOT_HELD',
        title: event.title || 'Class Not Held',
        isWorking: false,
        cssDot: 'dot-cnh',
        event
      };
    }

    if (event && (event.type === 'HOLIDAY' || event.category === 'HOLIDAY' || (event.title || '').toLowerCase().includes('holiday'))) {
      return {
        status: 'HOLIDAY',
        title: event.title || 'Official Holiday',
        isWorking: false,
        cssDot: 'dot-holiday',
        event
      };
    }

    // 2. Sunday Rule: All classes 9-12 are OFF
    if (dayOfWeek === 0) {
      return {
        status: 'SUNDAY',
        title: 'Sunday (Weekend Off)',
        isWorking: false,
        cssDot: 'dot-weekend'
      };
    }

    // 3. Saturday Rule: Class 9-10 OFF, Class 11-12 Working
    if (dayOfWeek === 6) {
      if (selectedClass === '9' || selectedClass === '10') {
        return {
          status: 'SATURDAY_OFF',
          title: 'Saturday Off (Class IX-X)',
          isWorking: false,
          cssDot: 'dot-weekend'
        };
      }
    }

    // 4. Check Attendance for this Date
    const dayAttendance = attendanceRecords.filter((a) => a.date === dateStr && String(a.class) === String(selectedClass));
    if (dayAttendance.length > 0) {
      const present = dayAttendance.filter((a) => a.status === 'PRESENT').length;
      const absent = dayAttendance.length - present;
      return {
        status: 'RECORDED',
        title: `Attendance Recorded (${present} Present, ${absent} Absent)`,
        isWorking: true,
        isRecorded: true,
        present,
        absent,
        cssDot: 'dot-recorded',
        event
      };
    }

    // 5. Default Working Day
    return {
      status: 'WORKING_DAY',
      title: 'Working Day (Attendance Pending)',
      isWorking: true,
      isRecorded: false,
      cssDot: 'dot-pending',
      event
    };
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
        evaluation: getDayEvaluation(dateStr)
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
        evaluation: getDayEvaluation(dateStr)
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
          evaluation: getDayEvaluation(dateStr)
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

                let cellClass = 'calendar-day-cell';
                if (!day.isCurrentMonth) cellClass += ' is-other-month';
                if (isSelected) cellClass += ' active-day';
                if (evalData.status === 'SUNDAY' || evalData.status === 'SATURDAY_OFF') cellClass += ' is-weekend';
                if (evalData.status === 'HOLIDAY') cellClass += ' is-holiday';
                if (evalData.status === 'CLASS_NOT_HELD') cellClass += ' is-cnh';

                return (
                  <div
                    key={idx}
                    className={cellClass}
                    onClick={() => setSelectedDayDetail({ ...day, evalData })}
                    role="button"
                    tabIndex={0}
                    aria-label={`${day.dateStr}: ${evalData.title}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="calendar-day-num">{day.dayNum}</span>
                      <span className={`calendar-status-dot ${evalData.cssDot}`} />
                    </div>

                    <div style={{ fontSize: '0.6875rem', color: 'var(--slate-500)', lineHeight: 1.2, marginTop: '4px' }}>
                      {evalData.event?.title ? (
                        <span style={{ color: 'var(--primary-700)', fontWeight: 700 }}>
                          {evalData.event.title.substring(0, 16)}
                        </span>
                      ) : evalData.status === 'RECORDED' ? (
                        <span style={{ color: 'var(--success-700)', fontWeight: 600 }}>✓ Recorded</span>
                      ) : evalData.status === 'WORKING_DAY' ? (
                        <span style={{ color: 'var(--warning-700)' }}>Pending</span>
                      ) : evalData.status === 'CLASS_NOT_HELD' ? (
                        <span style={{ color: 'var(--warning-700)', fontWeight: 600 }}>Class Not Held</span>
                      ) : (
                        <span>{evalData.status === 'SUNDAY' ? 'Sun' : evalData.status === 'SATURDAY_OFF' ? 'Sat Off' : 'Holiday'}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Calendar Status Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--slate-100)', fontSize: '0.75rem', color: 'var(--slate-600)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="calendar-status-dot dot-recorded" />
              <span>Attendance Recorded</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="calendar-status-dot dot-pending" />
              <span>Attendance Pending</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="calendar-status-dot dot-holiday" />
              <span>Holiday</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="calendar-status-dot dot-cnh" />
              <span>Class Not Held</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="calendar-status-dot dot-weekend" />
              <span>Weekend / Saturday Off</span>
            </div>
          </div>
        </div>

        {/* 3. Day Detail & Upcoming Events Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Day Detail Card */}
          {selectedDayDetail ? (
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--primary-500)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="hero-chip" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}>
                  {selectedDayDetail.dateStr}
                </span>
                <button className="search-clear-btn" onClick={() => setSelectedDayDetail(null)}>
                  <X size={16} />
                </button>
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '8px' }}>
                {selectedDayDetail.evalData.title}
              </h3>

              <div style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.5, marginTop: '8px' }}>
                <p>
                  <strong>Class Policy:</strong> Class {selectedClass}
                </p>
                <p>
                  <strong>Working Status:</strong> {selectedDayDetail.evalData.isWorking ? 'Working Day' : 'Non-Working Day'}
                </p>
                {selectedDayDetail.evalData.present !== undefined && (
                  <p style={{ color: 'var(--success-700)', fontWeight: 600 }}>
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
