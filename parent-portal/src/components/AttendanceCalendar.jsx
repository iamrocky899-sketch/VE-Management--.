import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Calendar as CalendarIcon, Info, X, Clock, AlertTriangle,
  Sun, Moon, Award, Flag
} from 'lucide-react';

export default function AttendanceCalendar({
  records = [],
  calendarEvents = [],
  studentClass = '9',
  onMonthChange,
  currentDate = new Date(),
  setCurrentDate
}) {
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0];

  // Attendance lookup map { "YYYY-MM-DD": record }
  const attendanceMap = new Map();
  records.forEach(r => {
    if (r.date) {
      attendanceMap.set(r.date, r);
    }
  });

  // Calendar events lookup map
  const eventsMap = new Map();
  calendarEvents.forEach(e => {
    if (e.date) {
      eventsMap.set(e.date, e);
    }
  });

  const prevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    if (setCurrentDate) setCurrentDate(newDate);
    if (onMonthChange) onMonthChange(newDate);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    if (setCurrentDate) setCurrentDate(newDate);
    if (onMonthChange) onMonthChange(newDate);
    setSelectedDay(null);
  };

  const goToToday = () => {
    const now = new Date();
    if (setCurrentDate) setCurrentDate(now);
    if (onMonthChange) onMonthChange(now);
    setSelectedDay(null);
  };

  // Evaluate Attendance 2.0 authoritative day status
  const evaluateDay = (dayNum) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dateObj = new Date(year, month, dayNum);
    const dayOfWeek = dateObj.getDay(); // 0=Sun, 6=Sat
    const isFuture = dStr > todayStr;
    const isToday = dStr === todayStr;

    const event = eventsMap.get(dStr);
    const attRecord = attendanceMap.get(dStr);

    // 1. Check Class Not Held event
    if (event && (event.type === 'CLASS_NOT_HELD' || event.status === 'CLASS_NOT_HELD' || (event.title || '').toLowerCase().includes('class not held'))) {
      return {
        dateStr: dStr,
        dayNum,
        dayOfWeek,
        dateObj,
        status: 'CLASS_NOT_HELD',
        label: 'Not Held',
        badgeColor: '#64748b',
        badgeBg: '#f1f5f9',
        icon: 'info',
        description: event.title || 'Class Not Held',
        isWorking: false,
        attRecord,
        isFuture,
        isToday
      };
    }

    // 2. Check Official Holiday
    if (event && (event.type === 'HOLIDAY' || event.category === 'HOLIDAY' || (event.title || '').toLowerCase().includes('holiday'))) {
      return {
        dateStr: dStr,
        dayNum,
        dayOfWeek,
        dateObj,
        status: 'HOLIDAY',
        label: 'Holiday',
        badgeColor: '#d97706',
        badgeBg: '#fef3c7',
        icon: 'holiday',
        description: event.title || 'Official Holiday',
        isWorking: false,
        attRecord,
        isFuture,
        isToday
      };
    }

    // 3. Sunday Rule: All classes off
    if (dayOfWeek === 0) {
      return {
        dateStr: dStr,
        dayNum,
        dayOfWeek,
        dateObj,
        status: 'SUNDAY',
        label: 'Sunday',
        badgeColor: '#94a3b8',
        badgeBg: '#f8fafc',
        icon: 'weekend',
        description: 'Sunday Weekly Off',
        isWorking: false,
        attRecord,
        isFuture,
        isToday
      };
    }

    // 4. Saturday Rule for Class 9/10
    if (dayOfWeek === 6) {
      const isJunior = String(studentClass) === '9' || String(studentClass) === '10';
      if (isJunior) {
        return {
          dateStr: dStr,
          dayNum,
          dayOfWeek,
          dateObj,
          status: 'SATURDAY_OFF',
          label: 'Sat Off',
          badgeColor: '#94a3b8',
          badgeBg: '#f8fafc',
          icon: 'weekend',
          description: 'Saturday Off (Classes IX-X Policy)',
          isWorking: false,
          attRecord,
          isFuture,
          isToday
        };
      }
    }

    // 5. Future Working Day
    if (isFuture) {
      return {
        dateStr: dStr,
        dayNum,
        dayOfWeek,
        dateObj,
        status: 'FUTURE',
        label: 'Future',
        badgeColor: '#94a3b8',
        badgeBg: '#f8fafc',
        icon: 'clock',
        description: 'Upcoming School Day',
        isWorking: true,
        attRecord: null,
        isFuture: true,
        isToday
      };
    }

    // 6. Recorded Attendance (Present / Absent)
    if (attRecord) {
      const isPres = (attRecord.status || '').toUpperCase() === 'PRESENT';
      const isAbs = (attRecord.status || '').toUpperCase() === 'ABSENT' || (attRecord.status || '').toUpperCase() === 'LEAVE';

      if (isPres) {
        return {
          dateStr: dStr,
          dayNum,
          dayOfWeek,
          dateObj,
          status: 'PRESENT',
          label: 'Present',
          badgeColor: '#16a34a',
          badgeBg: '#dcfce7',
          icon: 'present',
          description: 'Attended Class & Marked Present',
          isWorking: true,
          attRecord,
          isFuture: false,
          isToday
        };
      }

      if (isAbs) {
        return {
          dateStr: dStr,
          dayNum,
          dayOfWeek,
          dateObj,
          status: 'ABSENT',
          label: 'Absent',
          badgeColor: '#dc2626',
          badgeBg: '#fee2e2',
          icon: 'absent',
          description: 'Marked Absent',
          isWorking: true,
          attRecord,
          isFuture: false,
          isToday
        };
      }
    }

    // 7. No Record (Past working day with pending register)
    return {
      dateStr: dStr,
      dayNum,
      dayOfWeek,
      dateObj,
      status: 'NO_RECORD',
      label: 'No Record',
      badgeColor: '#64748b',
      badgeBg: '#f1f5f9',
      icon: 'info',
      description: 'Attendance not recorded',
      isWorking: true,
      attRecord: null,
      isFuture: false,
      isToday
    };
  };

  const cells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ empty: true, id: `empty-${i}` });
  }
  for (let d = 1; d <= totalDaysInMonth; d++) {
    cells.push({ empty: false, ...evaluateDay(d), id: `day-${d}` });
  }

  // Helper icon renderer
  const renderCellIcon = (type) => {
    switch (type) {
      case 'present':
        return <CheckCircle2 size={13} color="#16a34a" />;
      case 'absent':
        return <XCircle size={13} color="#dc2626" />;
      case 'holiday':
        return <Flag size={13} color="#d97706" />;
      case 'info':
        return <Info size={13} color="#64748b" />;
      default:
        return null;
    }
  };

  return (
    <div className="card" style={{ padding: '20px', borderRadius: '16px', overflow: 'hidden' }}>
      {/* Calendar Header with Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {monthNames[month]} {year}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Attendance 2.0 Calendar Timeline
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={prevMonth}
            aria-label="Previous Month"
            style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={goToToday}
            style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700 }}
          >
            Today
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={nextMonth}
            aria-label="Next Month"
            style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday Labels Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '6px' }}>
        {weekdayNames.map((wd, i) => (
          <div
            key={wd}
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: i === 0 ? '#ef4444' : i === 6 ? '#0284c7' : '#64748b',
              padding: '6px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar 7-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {cells.map((cell) => {
          if (cell.empty) {
            return <div key={cell.id} style={{ minHeight: '52px', opacity: 0 }} />;
          }

          const isSelected = selectedDay && selectedDay.dateStr === cell.dateStr;

          return (
            <button
              key={cell.id}
              type="button"
              onClick={() => setSelectedDay(cell)}
              aria-label={`${cell.dateStr}: ${cell.label}`}
              style={{
                minHeight: '52px',
                padding: '6px 4px',
                borderRadius: '10px',
                background: isSelected ? '#0284c7' : cell.badgeBg,
                color: isSelected ? '#ffffff' : cell.badgeColor,
                border: isSelected ? '1.5px solid #0284c7' : cell.isToday ? '1.5px solid #0284c7' : '1px solid rgba(0,0,0,0.04)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: 800, lineHeight: 1 }}>
                {cell.dayNum}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                {!isSelected && renderCellIcon(cell.icon)}
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: isSelected ? '#ffffff' : cell.badgeColor }}>
                  {cell.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Attendance Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid #f1f5f9',
          fontSize: '0.72rem',
          color: '#64748b'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={13} color="#16a34a" />
          <span>Present</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <XCircle size={13} color="#dc2626" />
          <span>Absent</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Flag size={13} color="#d97706" />
          <span>Holiday</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Info size={13} color="#64748b" />
          <span>Not Held / Sunday</span>
        </div>
      </div>

      {/* Selected Day Details Modal */}
      {selectedDay && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="day-modal-title">
          <div className="modal-content card" style={{ maxWidth: '380px', width: '100%', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="modal-close-btn"
              aria-label="Close details"
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: selectedDay.badgeBg, color: selectedDay.badgeColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarIcon size={22} />
              </div>
              <div>
                <h3 id="day-modal-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {selectedDay.dateStr}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {weekdayNames[selectedDay.dayOfWeek]}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '14px', borderRadius: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Day Classification:</span>
                <strong style={{ color: selectedDay.isWorking ? '#0f172a' : '#d97706' }}>
                  {selectedDay.isWorking ? 'Working Day' : 'Non-Working Day'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Attendance Status:</span>
                <strong style={{ color: selectedDay.badgeColor }}>
                  {selectedDay.label}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Details:</span>
                <span style={{ fontWeight: 600, color: '#334155', textAlign: 'right' }}>
                  {selectedDay.description}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSelectedDay(null)}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
