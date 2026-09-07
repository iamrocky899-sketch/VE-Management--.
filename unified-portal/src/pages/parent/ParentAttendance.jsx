import React, { useState, useEffect } from 'react';
import { useAuth } from '../../state/AuthContext';
import { ApiService } from '../../api/client';
import AttendanceCalendar from '../../components/AttendanceCalendar';
import {
  CheckCircle2, AlertTriangle, Calendar as CalendarIcon,
  ShieldCheck, ArrowLeft, RefreshCw, Flame, User, Info, AlertCircle, Users
} from 'lucide-react';

export default function ParentAttendance({ setActivePage }) {
  const { user, selectedChildId, switchChild, handleSessionRevocation } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [dashboardData, setDashboardData] = useState(null);
  const [fullAttendance, setFullAttendance] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Parallel execution: fetch Dashboard, Attendance, and Calendar simultaneously
      const [dashRes, attRes, calRes] = await Promise.all([
        ApiService.getParentDashboard(user?.token, isManual),
        ApiService.getAttendance(user?.token, { studentId: selectedChildId }, isManual),
        ApiService.getCalendar(user?.token, isManual)
      ]);

      if (dashRes && dashRes.success && dashRes.data) {
        setDashboardData(dashRes.data);
      } else if (dashRes?.error?.code === 'SESSION_EXPIRED') {
        handleSessionRevocation('SESSION_EXPIRED');
        return;
      } else if (dashRes?.error?.code === 'ACCOUNT_DEACTIVATED') {
        handleSessionRevocation('ACCOUNT_DEACTIVATED');
        return;
      }

      if (attRes && attRes.success && attRes.data) {
        setFullAttendance(attRes.data.attendance || []);
      }

      if (calRes && calRes.success && calRes.data) {
        setCalendarEvents(calRes.data.calendar || calRes.data.events || []);
      }
    } catch (err) {
      setError('Unable to load attendance records. Please check your network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      loadData();
    }
  }, [user?.token, selectedChildId]);

  if (loading) {
    return (
      <div className="attendance-skeleton-wrap animate-fade-in">
        <div className="card skeleton" style={{ height: '140px', marginBottom: '16px', borderRadius: '16px' }} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" style={{ marginBottom: '16px' }}>
          <div className="card skeleton" style={{ height: '100px', borderRadius: '14px' }} />
          <div className="card skeleton" style={{ height: '100px', borderRadius: '14px' }} />
          <div className="card skeleton" style={{ height: '100px', borderRadius: '14px' }} />
          <div className="card skeleton" style={{ height: '100px', borderRadius: '14px' }} />
        </div>
        <div className="card skeleton" style={{ height: '360px', borderRadius: '16px' }} />
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '16px' }}>
        <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
          Unable to Load Attendance
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
        <button type="button" className="btn-primary" onClick={() => loadData(true)}>
          <RefreshCw size={15} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const childrenSummaries = dashboardData?.children || [];

  // Resolve active selected child summary safely
  let activeChildSummary = childrenSummaries.find(
    c => String(c.student?.studentId) === String(selectedChildId)
  );

  if (!activeChildSummary && childrenSummaries.length > 0) {
    activeChildSummary = childrenSummaries[0];
  }

  const selectedStudent = activeChildSummary?.student || {
    studentName: 'Child',
    class: '9',
    section: 'N/A',
    rollNo: '1',
    group: null,
    studentId: 'STU_0'
  };

  const attSummary = activeChildSummary?.attendanceSummary || {
    totalWorkingDays: 0,
    presentDays: 0,
    absentDays: 0,
    percentage: 0,
    consecutiveAbsenceStreak: 0
  };

  // Filter full attendance records specifically for the active selected child
  const targetStudentId = String(selectedStudent.studentId || selectedStudent.student_id || selectedChildId || '');
  const childAttendanceRecords = fullAttendance.filter(
    r => String(r.studentId || r.student_id) === targetStudentId
  );

  // Fallback to summary records if full records are empty
  const summaryRecords = activeChildSummary?.attendanceSummary?.records || activeChildSummary?.attendanceSummary?.recentRecords || [];
  const finalAttendanceRecords = childAttendanceRecords.length > 0
    ? childAttendanceRecords
    : summaryRecords;

  const totalWorkingDays = (attSummary.totalWorkingDays !== undefined && attSummary.totalWorkingDays !== null && attSummary.totalWorkingDays > 0)
    ? attSummary.totalWorkingDays
    : finalAttendanceRecords.length;

  const presentDays = (attSummary.presentDays !== undefined && attSummary.presentDays !== null)
    ? attSummary.presentDays
    : finalAttendanceRecords.filter(r => (r.status || '').toUpperCase() === 'PRESENT').length;

  const absentDays = (attSummary.absentDays !== undefined && attSummary.absentDays !== null)
    ? attSummary.absentDays
    : finalAttendanceRecords.filter(r => (r.status || '').toUpperCase() === 'ABSENT' || (r.status || '').toUpperCase() === 'LEAVE').length;

  const percentage = (attSummary.percentage !== null && attSummary.percentage !== undefined)
    ? attSummary.percentage
    : (totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : null);

  const consecutiveAbsenceStreak = attSummary.consecutiveAbsenceStreak || 0;

  // Selected Month Summary Calculation
  const selYear = currentDate.getFullYear();
  const selMonth = currentDate.getMonth() + 1;
  const selMonthPrefix = `${selYear}-${String(selMonth).padStart(2, '0')}`;

  const monthRecords = finalAttendanceRecords.filter(r => (r.date || '').startsWith(selMonthPrefix));
  const monthTotalWorking = monthRecords.length;
  const monthPresent = monthRecords.filter(r => (r.status || '').toUpperCase() === 'PRESENT').length;
  const monthAbsent = monthRecords.filter(r => (r.status || '').toUpperCase() === 'ABSENT' || (r.status || '').toUpperCase() === 'LEAVE').length;
  const monthPercentage = monthTotalWorking > 0 ? Math.round((monthPresent / monthTotalWorking) * 100) : 0;

  // Attendance health standing badge
  const getAttendanceHealth = (pct) => {
    if (pct >= 75) return { label: 'Good Standing', color: '#16a34a', bg: '#dcfce7' };
    if (pct >= 60) return { label: 'Needs Attention', color: '#d97706', bg: '#fef3c7' };
    return { label: 'At Risk (<60%)', color: '#dc2626', bg: '#fee2e2' };
  };

  const attHealth = getAttendanceHealth(percentage);

  // Chronological timeline (recent-first)
  const timelineRecords = [...finalAttendanceRecords].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="parent-attendance-container animate-fade-in">
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setActivePage('dashboard')}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
        >
          <ArrowLeft size={15} />
          <span>Back to Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
        >
          <RefreshCw size={14} className={refreshing ? 'spinner' : ''} />
          <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Multi-Child Selector / Summary */}
      {childrenSummaries.length > 1 && (
        <div className="card" style={{ padding: '14px 16px', borderRadius: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
            <Users size={16} color="#059669" />
            <span>Select Child</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            {childrenSummaries.map((childSummary) => {
              const stu = childSummary.student;
              const isSelected = String(stu.studentId) === String(selectedStudent.studentId);

              return (
                <button
                  key={stu.studentId}
                  type="button"
                  onClick={() => switchChild(stu.studentId)}
                  aria-label={`Select ${stu.studentName}`}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: isSelected ? '#047857' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#0f172a',
                    border: isSelected ? '1.5px solid #047857' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{stu.studentName}</div>
                    <div style={{ fontSize: '0.75rem', color: isSelected ? '#d1fae5' : '#64748b', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                      <span>Class {stu.class}-{stu.section || 'N/A'} • Roll {stu.rollNo}</span>
                      <span>•</span>
                      <span>Group: {stu.group || 'Group Not Assigned'}</span>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 size={16} color="#ffffff" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Attendance Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
          color: '#ffffff',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '16px',
          boxShadow: '0 8px 20px rgba(6, 95, 70, 0.22)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                PARENT MONITORING
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: attHealth.bg, color: attHealth.color, padding: '2px 8px', borderRadius: '6px' }}>
                {attHealth.label}
              </span>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '2px 0 4px 0' }}>
              {selectedStudent.studentName}'s Attendance
            </h1>
            <div style={{ fontSize: '0.85rem', opacity: 0.92, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <span>Class <strong>{selectedStudent.class}</strong></span>
              <span>•</span>
              <span>Section <strong>{selectedStudent.section || 'N/A'}</strong></span>
              <span>•</span>
              <span>Roll No <strong>{selectedStudent.rollNo}</strong></span>
              <span>•</span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 8px', borderRadius: '6px', fontWeight: 600 }}>
                Group: <strong>{selectedStudent.group || 'Group Not Assigned'}</strong>
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1 }}>
              {totalWorkingDays > 0 && percentage !== null && percentage !== undefined ? `${percentage}%` : 'N/A'}
            </div>
            <div style={{ fontSize: '0.8125rem', opacity: 0.9, marginTop: '2px' }}>
              Attendance Rate
            </div>
          </div>
        </div>
      </div>

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px', borderRadius: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Working Days
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
            {totalWorkingDays}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Recorded classes</div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
            Days Present
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', margin: '2px 0' }}>
            {presentDays}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>Classes attended</div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
            Days Absent
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', margin: '2px 0' }}>
            {absentDays}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#dc2626' }}>Classes missed</div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>
            Absence Streak
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: consecutiveAbsenceStreak > 0 ? '#dc2626' : '#16a34a', margin: '2px 0' }}>
            {consecutiveAbsenceStreak}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {consecutiveAbsenceStreak > 0 ? 'Consecutive days' : 'No active streak'}
          </div>
        </div>
      </div>

      {/* Main Grid: Monthly Calendar & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Calendar (2 Columns) */}
        <div className="lg:col-span-2">
          <AttendanceCalendar
            records={finalAttendanceRecords}
            calendarEvents={calendarEvents}
            studentClass={selectedStudent.class}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
          />

          {/* Selected Month Summary Card */}
          <div className="card" style={{ marginTop: '16px', padding: '16px 20px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              Month Summary for {selectedStudent.studentName} ({currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })})
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8125rem', color: '#475569' }}>
              <div>Working Days: <strong style={{ color: '#0f172a' }}>{monthTotalWorking}</strong></div>
              <div>Present: <strong style={{ color: '#16a34a' }}>{monthPresent}</strong></div>
              <div>Absent: <strong style={{ color: '#dc2626' }}>{monthAbsent}</strong></div>
              <div>Month Rate: <strong style={{ color: '#047857' }}>{monthPercentage}%</strong></div>
            </div>
          </div>
        </div>

        {/* Chronological Timeline (1 Column) */}
        <div>
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={18} color="#059669" />
              <span>Attendance Timeline</span>
            </h3>

            {timelineRecords.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <Info size={28} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  No attendance records available for {selectedStudent.studentName}.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                {timelineRecords.slice(0, 20).map((rec, i) => {
                  const isPres = (rec.status || '').toUpperCase() === 'PRESENT';
                  const isAbs = (rec.status || '').toUpperCase() === 'ABSENT' || (rec.status || '').toUpperCase() === 'LEAVE';

                  return (
                    <div
                      key={rec.attendanceId || `${rec.date}-${i}`}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8125rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isPres ? (
                          <CheckCircle2 size={16} color="#16a34a" />
                        ) : isAbs ? (
                          <AlertTriangle size={16} color="#dc2626" />
                        ) : (
                          <Info size={16} color="#64748b" />
                        )}
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                          {rec.date}
                        </span>
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          color: isPres ? '#16a34a' : isAbs ? '#dc2626' : '#64748b',
                          background: isPres ? '#dcfce7' : isAbs ? '#fee2e2' : '#f1f5f9',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {rec.status || 'RECORDED'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
