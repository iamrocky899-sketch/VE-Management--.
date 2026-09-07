import React, { useState, useEffect } from 'react';
import { useAuth } from '../state/AuthContext';
import { ApiService } from '../services/api';
import ChildSelector from '../components/ChildSelector';
import AttendanceCalendar from '../components/AttendanceCalendar';
import { CheckCircle2, AlertTriangle, Calendar, ShieldCheck, Info, RefreshCw } from 'lucide-react';

export default function AttendancePage() {
  const { session, activeChild, t } = useAuth();
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const student = activeChild?.student || {};
  const studentId = student.studentId;

  useEffect(() => {
    async function loadAttendance() {
      if (!session?.token || !studentId) return;
      setLoading(true);
      try {
        const res = await ApiService.getAttendance(session.token, studentId, '2026-08');
        if (res && res.success && res.data) {
          setAttendanceData(res.data);
        }
      } catch (e) {
        console.error("Attendance fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, [session, studentId]);

  const summary = attendanceData?.summary || activeChild?.attendanceSummary || activeChild?.attendance || {};

  const hasPercentage = summary.attendancePercentage !== undefined && summary.attendancePercentage !== null;
  const percentage = hasPercentage
    ? parseFloat(summary.attendancePercentage)
    : (summary.percentage !== undefined && summary.percentage !== null ? parseFloat(summary.percentage) : null);

  const isGood = percentage !== null && percentage >= 75;
  const isRecorded = percentage !== null;

  const records = attendanceData?.records || activeChild?.attendanceSummary?.recentRecords || [];

  return (
    <div className="animate-fade-in">
      <ChildSelector />

      {/* Attendance Summary Header Card */}
      <div className="card" style={{
        background: isRecorded
          ? (isGood ? 'linear-gradient(135deg, #059669, #0d9488)' : 'linear-gradient(135deg, #d97706, #b45309)')
          : 'linear-gradient(135deg, #64748b, #475569)',
        color: '#fff',
        border: 'none',
        padding: '20px',
        boxShadow: isRecorded ? '0 8px 20px rgba(5, 150, 105, 0.22)' : 'none',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9, fontWeight: '700' }}>
              {t('attendanceTitle') || 'Attendance Record'}
            </div>
            <div style={{ fontSize: isRecorded ? '2.2rem' : '1.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)', margin: '2px 0' }}>
              {isRecorded ? `${percentage}%` : 'No attendance recorded'}
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.22)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}>
              {isRecorded ? (isGood ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />) : <Info size={14} />}
              <span>{isRecorded ? (isGood ? (t('healthGood') || 'Good Standing') : (t('healthWarning') || 'Low Attendance Alert')) : 'Awaiting Records'}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.9 }}>
            <div style={{ fontWeight: '700' }}>{student.studentName || 'Student'}</div>
            <div>{t('class') || 'Class'} {student.class || '--'} • {t('section') || 'Sec'} {student.section || 'A'}</div>
          </div>
        </div>
      </div>

      {/* Detailed Attendance Count Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">{t('presentDays') || 'Present Days'}</div>
          <div className="metric-value" style={{ color: 'var(--accent-green-text)' }}>
            {summary.presentDays ?? summary.presentCount ?? (isRecorded ? records.filter(r => r.status === 'PRESENT').length : '--')}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>✅ Active in Class</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">{t('absentDays') || 'Absent Days'}</div>
          <div className="metric-value" style={{ color: 'var(--accent-rose-text)' }}>
            {summary.absentDays ?? summary.absentCount ?? (isRecorded ? records.filter(r => r.status === 'ABSENT').length : '--')}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>❌ Total Absences</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">{t('eligibleDays') || 'Conducted Sessions'}</div>
          <div className="metric-value" style={{ color: 'var(--primary-text)' }}>
            {summary.totalSessions ?? summary.totalWorkingDays ?? (isRecorded ? records.length : '--')}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📅 Official Sessions</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">{t('streak') || 'Streak'}</div>
          <div className="metric-value" style={{ color: (summary.streak > 0) ? 'var(--accent-amber-text)' : 'var(--accent-teal-text)' }}>
            {summary.streak ?? '--'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Consecutive Days</div>
        </div>
      </div>

      {/* Monthly Attendance Calendar */}
      <AttendanceCalendar records={records} studentClass={student.class || '9'} />

      {/* Official Attendance Policy Note */}
      <div className="card" style={{ background: 'var(--bg-card-muted)', marginBottom: 0 }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Info size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
              {t('officialPolicyTitle') || 'Institutional Attendance Policy'}
            </div>
            <div>
              {t('officialPolicyDesc') || 'Minimum 75% attendance is required in each vocational course for term examination eligibility.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
