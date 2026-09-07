import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';
import { ApiService } from '../../api/client';
import { evaluateCalendarDate, CALENDAR_CATEGORIES } from '../../utils/calendarSystem';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  ArrowLeft, RefreshCw, X, AlertCircle, Info,
  BookOpen, Award, Sun, Umbrella, Clock
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_TYPE_CONFIG = {
  HOLIDAY: { label: 'Holiday', color: '#dc2626', bg: '#fef2f2', icon: '🏖️' },
  CLASS_NOT_HELD: { label: 'Class Not Held', color: '#ea580c', bg: '#fff7ed', icon: '🚫' },
  EXAM: { label: 'Examination', color: '#7c3aed', bg: '#f5f3ff', icon: '📝' },
  EVENT: { label: 'School Event', color: '#0284c7', bg: '#eff6ff', icon: '🎓' },
  VACATION: { label: 'Vacation', color: '#0d9488', bg: '#f0fdfa', icon: '🌴' },
  OBSERVATIONAL: { label: 'Observance', color: '#d97706', bg: '#fffbeb', icon: '🏛️' }
};

export default function StudentCalendar({ setActivePage }) {
  const { user, handleSessionRevocation } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const studentClass = user?.class || '9';

  const loadCalendar = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const calRes = await ApiService.getCalendar(user?.token);
      if (calRes && calRes.success && calRes.data) {
        setCalendarEvents(calRes.data.calendar || calRes.data.events || []);
      } else if (calRes?.error?.code === 'SESSION_EXPIRED') {
        handleSessionRevocation('SESSION_EXPIRED');
        return;
      } else if (calRes?.error?.code === 'ACCOUNT_DEACTIVATED') {
        handleSessionRevocation('ACCOUNT_DEACTIVATED');
        return;
      } else {
        setError(calRes?.error?.message || 'Unable to load calendar.');
      }
    } catch (err) {
      setError('Network connection error. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      loadCalendar();
    }
  }, [user?.token]);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDayDetail(null);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDayDetail(null);
  };
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDayDetail(null);
  };

  // Day-status evaluator (Attendance 2.0 compatible)
  const getDayEvaluation = (dateStr) => {
    const parts = dateStr.split('-');
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const dayOfWeek = dateObj.getDay();

    // 1. Check Calendar Events: Holiday / Class Not Held
    const event = calendarEvents.find(e =>
      e.date === dateStr || (e.startDate && e.startDate <= dateStr && e.endDate >= dateStr)
    );

    if (event && (event.officialStatus === 'HOLIDAY' || event.type === 'HOLIDAY' || event.category === 'HOLIDAY' ||
      (event.title || '').toLowerCase().includes('holiday'))) {
      return {
        status: 'HOLIDAY',
        title: event.title || 'Official Holiday',
        description: event.description || '',
        isWorking: String(event.isWorking) === 'true' ? true : false,
        event
      };
    }

    if (event && (event.officialStatus === 'CLASS_NOT_HELD' || event.type === 'CLASS_NOT_HELD' || event.status === 'CLASS_NOT_HELD' ||
      (event.title || '').toLowerCase().includes('class not held'))) {
      return {
        status: 'CLASS_NOT_HELD',
        title: event.title || 'Class Not Held',
        description: event.description || '',
        isWorking: false,
        event
      };
    }

    // Exam or Event
    if (event && (event.officialStatus === 'EXAM' || event.type === 'EXAM' || (event.title || '').toLowerCase().includes('exam'))) {
      return {
        status: 'EXAM',
        title: event.title || 'Examination',
        description: event.description || '',
        isWorking: true,
        event
      };
    }

    if (event && (event.officialStatus === 'EVENT' || event.type === 'EVENT' || event.type === 'OBSERVATIONAL' || event.type === 'VACATION')) {
      return {
        status: event.type || 'EVENT',
        title: event.title || 'School Event',
        description: event.description || '',
        isWorking: String(event.isWorking) === 'true' ? true : event.type === 'VACATION' ? false : true,
        event
      };
    }

    // Generic event with title
    if (event && event.title) {
      return {
        status: 'EVENT',
        title: event.title,
        description: event.description || '',
        isWorking: String(event.isWorking) !== 'false',
        event
      };
    }

    // 2. Sunday: All classes off
    if (dayOfWeek === 0) {
      return {
        status: 'SUNDAY',
        title: 'Sunday (Weekend Off)',
        isWorking: false
      };
    }

    // 3. Saturday Rule: Class 9-10 OFF, Class 11-12 Working
    if (dayOfWeek === 6) {
      if (studentClass === '9' || studentClass === '10') {
        return {
          status: 'SATURDAY_OFF',
          title: 'Saturday Off (Class IX–X)',
          isWorking: false
        };
      }
      return {
        status: 'SATURDAY_WORKING',
        title: 'Saturday (Working Day)',
        isWorking: true
      };
    }

    // 4. Default Working Day
    return {
      status: 'WORKING_DAY',
      title: 'Working Day',
      isWorking: true
    };
  };

  // Month grid
  const monthDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({ dayNum, dateStr, isCurrentMonth: false, evaluation: evaluateCalendarDate(dateStr, studentClass, calendarEvents, []) });
    }

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(dayNum).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dStr}`;
      days.push({ dayNum, dateStr, isCurrentMonth: true, evaluation: evaluateCalendarDate(dateStr, studentClass, calendarEvents, []) });
    }

    const remaining = 42 - days.length;
    if (remaining > 0 && remaining < 7) {
      for (let dayNum = 1; dayNum <= remaining; dayNum++) {
        const nextDate = new Date(currentYear, currentMonth + 1, dayNum);
        const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        days.push({ dayNum, dateStr, isCurrentMonth: false, evaluation: evaluateCalendarDate(dateStr, studentClass, calendarEvents, []) });
      }
    }

    return days;
  }, [currentYear, currentMonth, calendarEvents, studentClass]);

  // Upcoming events list
  const upcomingEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const events = [...calendarEvents].filter(e => (e.date || e.startDate || '') >= todayStr);
    events.sort((a, b) => new Date(a.date || a.startDate || 0) - new Date(b.date || b.startDate || 0));
    return events.slice(0, 6);
  }, [calendarEvents]);

  // Month summary
  const monthSummary = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let workingDays = 0;
    let holidays = 0;
    let events = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dStr}`;
      const ev = evaluateCalendarDate(dateStr, studentClass, calendarEvents, []);
      if (ev.isWorking) workingDays++;
      else holidays++;
      if (ev.allEvents && ev.allEvents.length > 0) events += ev.allEvents.length;
    }

    return { workingDays, holidays, events };
  }, [currentYear, currentMonth, calendarEvents, studentClass]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'HOLIDAY': return '#dc2626';
      case 'CLASS_NOT_HELD': return '#ea580c';
      case 'EXAM': return '#7c3aed';
      case 'EVENT': case 'OBSERVATIONAL': return '#0284c7';
      case 'VACATION': return '#0d9488';
      case 'SUNDAY': case 'SATURDAY_OFF': return '#94a3b8';
      case 'SATURDAY_WORKING': return '#059669';
      case 'WORKING_DAY': return '#059669';
      default: return '#475569';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'HOLIDAY': return 'Holiday';
      case 'CLASS_NOT_HELD': return 'Class Not Held';
      case 'EXAM': return 'Examination';
      case 'EVENT': return 'Event';
      case 'OBSERVATIONAL': return 'Observance';
      case 'VACATION': return 'Vacation';
      case 'SUNDAY': return 'Sunday';
      case 'SATURDAY_OFF': return 'Saturday Off';
      case 'SATURDAY_WORKING': return 'Working Saturday';
      case 'WORKING_DAY': return 'Working Day';
      default: return status;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Loading skeleton
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card skeleton" style={{ height: '110px', marginBottom: '16px', borderRadius: '16px' }} />
        <div className="card skeleton" style={{ height: '300px', marginBottom: '16px', borderRadius: '14px' }} />
        <div className="card skeleton" style={{ height: '180px', borderRadius: '14px' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #0284c7, #0d9488)',
        color: '#fff',
        border: 'none',
        padding: '20px',
        boxShadow: '0 8px 20px rgba(2, 132, 199, 0.22)',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={() => setActivePage('dashboard')}
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              padding: '8px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              minHeight: '44px',
              minWidth: '44px'
            }}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => loadCalendar(true)}
            disabled={refreshing}
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              padding: '8px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              minHeight: '44px',
              minWidth: '44px'
            }}
            aria-label="Refresh calendar"
          >
            <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CalendarIcon size={22} />
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Academic Calendar</h1>
            <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: '2px 0 0 0' }}>
              Class {studentClass} • Session 2026–27
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="card" style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '14px 16px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }} role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: '0.88rem' }}>{error}</span>
          <button
            type="button"
            onClick={() => loadCalendar(true)}
            style={{
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              minHeight: '44px'
            }}
            aria-label="Retry loading calendar"
          >
            Retry
          </button>
        </div>
      )}

      {/* Month Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
        <div className="card" style={{ padding: '12px', textAlign: 'center', marginBottom: 0 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{monthSummary.workingDays}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Working Days</div>
        </div>
        <div className="card" style={{ padding: '12px', textAlign: 'center', marginBottom: 0 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>{monthSummary.holidays}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Holidays/Off</div>
        </div>
        <div className="card" style={{ padding: '12px', textAlign: 'center', marginBottom: 0 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed' }}>{monthSummary.events}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Events</div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card" style={{ padding: '20px', marginBottom: '14px' }}>
        {/* Month Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={prevMonth}
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '44px',
                minWidth: '44px'
              }}
              aria-label="Previous month"
            >
              <ChevronLeft size={18} color="#475569" />
            </button>

            <button
              type="button"
              onClick={goToToday}
              style={{
                background: '#1e3a8a',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 14px',
                color: '#fff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: '44px'
              }}
              aria-label="Go to today"
            >
              Today
            </button>

            <button
              type="button"
              onClick={nextMonth}
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '44px',
                minWidth: '44px'
              }}
              aria-label="Next month"
            >
              <ChevronRight size={18} color="#475569" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          marginBottom: '4px'
        }}>
          {WEEKDAY_NAMES.map(day => (
            <div key={day} style={{
              textAlign: 'center',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: day === 'Sun' ? '#dc2626' : '#64748b',
              padding: '6px 0'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="calendar-month-grid">
          {monthDays.map((day, idx) => {
            const evalData = day.evaluation;
            const isToday = day.dateStr === todayStr;
            const isSelected = selectedDayDetail?.dateStr === day.dateStr;

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
                onClick={() => day.isCurrentMonth && setSelectedDayDetail(day)}
                role="button"
                tabIndex={day.isCurrentMonth ? 0 : -1}
                aria-label={day.isCurrentMonth ? `${day.dateStr}: ${evalData.title}` : ''}
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
                  ) : evalData.category === 'sunday' ? (
                    <span style={{ color: '#e11d48', fontWeight: 600 }}>Sunday</span>
                  ) : evalData.category === 'saturday-off' ? (
                    <span style={{ color: '#64748b' }}>Weekend</span>
                  ) : (
                    <span style={{ color: 'var(--slate-500)' }}>Working</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
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

      {/* Upcoming Events */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={18} color="#d97706" />
          Upcoming Academic Events
        </h3>

        {upcomingEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <CalendarIcon size={28} color="#94a3b8" style={{ margin: '0 auto 8px auto', display: 'block' }} />
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No upcoming academic events this month.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingEvents.map((evt, idx) => {
              const typeCfg = EVENT_TYPE_CONFIG[evt.officialStatus] || EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.EVENT || { label: 'Event', color: '#475569', bg: '#f1f5f9', icon: '📅' };

              return (
                <div
                  key={evt.calendarId || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: typeCfg.bg,
                    border: `1px solid ${typeCfg.color}22`
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }} aria-hidden="true">{typeCfg.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{evt.title}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {formatDate(evt.date)} • <span style={{ color: typeCfg.color, fontWeight: 600 }}>{typeCfg.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day Detail Modal */}
      {selectedDayDetail && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setSelectedDayDetail(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-detail-title"
        >
          <div
            className="card"
            style={{
              maxWidth: '440px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'auto',
              padding: '24px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedDayDetail(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '10px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '44px',
                minWidth: '44px'
              }}
              aria-label="Close modal"
            >
              <X size={18} color="#475569" />
            </button>

            <h2 id="day-detail-title" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
              {formatDate(selectedDayDetail.dateStr)}
            </h2>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: '14px',
              background: selectedDayDetail.evaluation.category === 'holiday' ? '#fee2e2' :
                          selectedDayDetail.evaluation.category === 'exam' ? '#f3e8ff' :
                          selectedDayDetail.evaluation.category === 'event' ? '#e0f2fe' :
                          selectedDayDetail.evaluation.category === 'sunday' ? '#ffe4e6' :
                          '#ecfdf5',
              color: selectedDayDetail.evaluation.category === 'holiday' ? '#991b1b' :
                     selectedDayDetail.evaluation.category === 'exam' ? '#6b21a8' :
                     selectedDayDetail.evaluation.category === 'event' ? '#075985' :
                     selectedDayDetail.evaluation.category === 'sunday' ? '#9f1239' :
                     '#065f46',
              marginBottom: '16px'
            }}>
              <span aria-hidden="true">
                {selectedDayDetail.evaluation.category === 'holiday' ? '🔴' :
                 selectedDayDetail.evaluation.category === 'exam' ? '🟣' :
                 selectedDayDetail.evaluation.category === 'event' ? '🔵' :
                 selectedDayDetail.evaluation.category === 'sunday' ? '⚪' : '🟢'}
              </span>
              {selectedDayDetail.evaluation.category === 'holiday' ? 'Official Holiday' :
               selectedDayDetail.evaluation.category === 'exam' ? 'Examination' :
               selectedDayDetail.evaluation.category === 'event' ? 'School Event' :
               selectedDayDetail.evaluation.category === 'sunday' ? 'Sunday (Off)' :
               selectedDayDetail.evaluation.category === 'saturday-off' ? 'Saturday Off' :
               'Working Day'}
              {selectedDayDetail.evaluation.isWorking ? ' • Working' : ' • Non-working'}
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '16px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                {selectedDayDetail.evaluation.title}
              </h3>
              {selectedDayDetail.evaluation.description && (
                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '0 0 10px 0' }}>
                  {selectedDayDetail.evaluation.description}
                </p>
              )}

              {/* All Events on this date if multiple */}
              {selectedDayDetail.evaluation.allEvents && selectedDayDetail.evaluation.allEvents.length > 1 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    All Events on this Date ({selectedDayDetail.evaluation.allEvents.length}):
                  </div>
                  {selectedDayDetail.evaluation.allEvents.map((evt, eIdx) => (
                    <div key={eIdx} style={{ fontSize: '0.8rem', color: '#334155', padding: '4px 0', borderBottom: eIdx < selectedDayDetail.evaluation.allEvents.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                      <strong>• {evt.title}</strong>
                      {evt.description && <span style={{ color: '#64748b' }}> — {evt.description}</span>}
                    </div>
                  ))}
                </div>
              )}

              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '8px', margin: '8px 0 0 0' }}>
                Class Rule: Class {studentClass}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDayDetail(null)}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              Back to Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
