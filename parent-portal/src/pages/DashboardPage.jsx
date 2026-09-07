import React from 'react';
import { useAuth } from '../state/AuthContext';
import ChildSelector from '../components/ChildSelector';
import {
  CheckCircle2, Award, Calendar, Bell, Phone, MessageSquare,
  ChevronRight, Sparkles, User, GraduationCap, School, BookOpen, AlertCircle
} from 'lucide-react';

export default function DashboardPage({ setActivePage }) {
  const { session, activeChild, dashboardData, t } = useAuth();

  const student = activeChild?.student || {};
  const attendance = activeChild?.attendanceSummary || activeChild?.attendance || {
    percentage: 0,
    presentDays: 0,
    totalWorkingDays: 0,
    streak: 0
  };
  const latestMarks = activeChild?.marks?.[0] || {
    examName: '1st Unit Test',
    totalScore: 88,
    percentage: 88
  };
  const notices = dashboardData?.notices || [];

  return (
    <div className="animate-fade-in">
      {/* 1. Student Identity & Multi-Child Switcher */}
      <ChildSelector />

      {/* 2. Welcome Student Identity Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
        color: '#fff',
        padding: '18px 20px',
        boxShadow: '0 8px 24px rgba(2, 132, 199, 0.22)',
        border: 'none',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.85, fontWeight: '700' }}>
              {t('session')}
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', margin: '3px 0' }}>
              {student.studentName || 'Student Name'}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', opacity: 0.9 }}>
              <span>{t('class')} {student.class || '9'} ({student.section || 'A'})</span>
              <span>•</span>
              <span>{t('rollNo')}: {student.rollNo || '01'}</span>
              <span>•</span>
              <span>{t('active')}</span>
            </div>
          </div>

          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: '800',
            flexShrink: 0
          }}>
            {student.studentName ? student.studentName.charAt(0) : 'S'}
          </div>
        </div>
      </div>

      {/* 3. Core Summary Metrics Grid */}
      <div className="metrics-grid">
        {/* Attendance Metric */}
        <div
          className="metric-card"
          onClick={() => setActivePage('attendance')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          aria-label="View attendance"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="metric-label">{t('attendanceSummary')}</div>
            <CheckCircle2 size={18} color="var(--accent-green)" />
          </div>
          <div className="metric-value" style={{
            color: (attendance.attendancePercentage !== undefined && attendance.attendancePercentage !== null)
              ? (attendance.attendancePercentage >= 75 ? 'var(--accent-green-text)' : 'var(--accent-amber-text)')
              : 'var(--text-muted)',
            fontSize: (attendance.attendancePercentage === null || attendance.attendancePercentage === undefined) ? '1.05rem' : '1.5rem'
          }}>
            {(attendance.attendancePercentage !== undefined && attendance.attendancePercentage !== null)
              ? `${attendance.attendancePercentage}%`
              : ((attendance.percentage !== undefined && attendance.percentage !== null)
                ? `${attendance.percentage}%`
                : (t('noAttendanceRecorded') || 'No attendance recorded'))}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {attendance.totalSessions !== undefined
              ? `${attendance.presentCount || 0} / ${attendance.totalSessions} sessions`
              : (attendance.totalWorkingDays
                ? `${attendance.presentDays || 0} / ${attendance.totalWorkingDays} sessions`
                : (t('awaitingRecords') || 'Awaiting session records'))}
          </div>
        </div>

        {/* Latest Result Metric */}
        <div
          className="metric-card"
          onClick={() => setActivePage('marks')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          aria-label="View marks"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="metric-label">{t('latestResult')}</div>
            <Award size={18} color="var(--accent-amber)" />
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-amber-text)' }}>
            {latestMarks.percentage !== undefined ? `${latestMarks.percentage}%` : '88%'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {latestMarks.examName || t('unitTest1')}
          </div>
        </div>

        {/* Today's Activity Metric */}
        <div
          className="metric-card"
          onClick={() => setActivePage('activities')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          aria-label="View activities"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="metric-label">{t('todayActivity')}</div>
            <Calendar size={18} color="var(--accent-teal)" />
          </div>
          <div className="metric-value" style={{ fontSize: '1.05rem', color: 'var(--accent-teal-text)', marginTop: '4px' }}>
            Vocational IT
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Computer Lab Practical
          </div>
        </div>

        {/* School Notices Metric */}
        <div
          className="metric-card"
          onClick={() => setActivePage('notices')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          aria-label="View notices"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="metric-label">{t('unreadNotices')}</div>
            <Bell size={18} color="var(--accent-purple)" />
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-purple-text)' }}>
            {notices.length > 0 ? notices.length : 2}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {t('priorityHigh')}
          </div>
        </div>
      </div>

      {/* 4. Quick Action Buttons */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Sparkles size={18} color="var(--primary)" />
            <span>{t('quickActions')}</span>
          </div>
        </div>

        <div className="quick-action-grid">
          <button className="quick-action-btn" onClick={() => setActivePage('attendance')}>
            <div className="quick-action-icon" style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green-text)' }}>
              <CheckCircle2 size={20} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: '700' }}>{t('navAttendance')}</span>
          </button>

          <button className="quick-action-btn" onClick={() => setActivePage('marks')}>
            <div className="quick-action-icon" style={{ background: 'var(--accent-amber-light)', color: 'var(--accent-amber-text)' }}>
              <Award size={20} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: '700' }}>{t('navMarks')}</span>
          </button>

          <button className="quick-action-btn" onClick={() => setActivePage('activities')}>
            <div className="quick-action-icon" style={{ background: 'var(--accent-teal-light)', color: 'var(--accent-teal-text)' }}>
              <Calendar size={20} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: '700' }}>{t('navActivities')}</span>
          </button>

          <button className="quick-action-btn" onClick={() => setActivePage('calendar')}>
            <div className="quick-action-icon" style={{ background: 'var(--accent-purple-light)', color: 'var(--accent-purple-text)' }}>
              <BookOpen size={20} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: '700' }}>{t('navCalendar')}</span>
          </button>
        </div>
      </div>

      {/* 5. Direct Teacher & School Contact Shortcuts */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Phone size={18} color="var(--primary)" />
            <span>{t('callSchool')}</span>
          </div>
          <button
            onClick={() => setActivePage('contact')}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '4px 10px', minHeight: '32px' }}
          >
            {t('navContact')} <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-green-light)',
              color: 'var(--accent-green-text)',
              fontWeight: '700',
              fontSize: '0.84rem',
              minHeight: '44px'
            }}>
              <MessageSquare size={16} />
              <span>{t('whatsappTeacher')}</span>
            </div>
          </a>

          <a
            href="tel:+919876543210"
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)',
              color: 'var(--primary-text)',
              fontWeight: '700',
              fontSize: '0.84rem',
              minHeight: '44px'
            }}>
              <Phone size={16} />
              <span>{t('contactTeacher')}</span>
            </div>
          </a>
        </div>
      </div>

      {/* 6. Recent School Notices Card */}
      <div className="card" style={{ marginBottom: 0 }}>
        <div className="card-header">
          <div className="card-title">
            <Bell size={18} color="var(--accent-rose)" />
            <span>{t('recentNotices')}</span>
          </div>
          <button
            onClick={() => setActivePage('notices')}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '4px 10px', minHeight: '32px' }}
          >
            View All <ChevronRight size={14} />
          </button>
        </div>

        <div style={{
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card-muted)',
          borderLeft: '4px solid var(--accent-rose)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span className="badge badge-rose">{t('priorityHigh')}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>28 Aug 2026</span>
          </div>
          <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Parent-Teacher Academic Review Meeting
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
            Regarding Unit Test performance and practical syllabus updates for Session 2026–27.
          </p>
        </div>
      </div>
    </div>
  );
}
