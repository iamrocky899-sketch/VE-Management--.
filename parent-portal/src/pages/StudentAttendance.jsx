import React, { useState, useEffect } from 'react';
import { useAuth } from '../state/AuthContext';
import { ApiService } from '../services/api';
import AttendanceCalendar from '../components/AttendanceCalendar';
import {
  CheckCircle2, AlertTriangle, Calendar as CalendarIcon,
  ShieldCheck, ArrowLeft, RefreshCw, Flame, User, Info, AlertCircle,
  Download, FileText
} from 'lucide-react';
import { getStudentDisplayName } from '../utils/formatters';

export default function StudentAttendance({ setActivePage }) {
  const { user, handleSessionRevocation } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [error, setError] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const loadAttendance = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Parallel execution: fetch Dashboard, Attendance, and Calendar simultaneously
      const [dashRes, attRes, calRes] = await Promise.all([
        ApiService.getStudentDashboard(user?.token, isManual),
        ApiService.getAttendance(user?.token, {}, isManual),
        ApiService.getCalendar(user?.token, isManual)
      ]);

      if (dashRes && dashRes.success && dashRes.data) {
        setSummaryData(dashRes.data.attendanceSummary || null);
      } else if (dashRes?.error?.code === 'SESSION_EXPIRED') {
        handleSessionRevocation('SESSION_EXPIRED');
        return;
      } else if (dashRes?.error?.code === 'ACCOUNT_DEACTIVATED') {
        handleSessionRevocation('ACCOUNT_DEACTIVATED');
        return;
      }

      if (attRes && attRes.success && attRes.data) {
        setAttendanceRecords(attRes.data.attendance || []);
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
      loadAttendance();
    }
  }, [user?.token]);

  const handleDownloadAttendanceReport = async () => {
    setDownloadingReport(true);
    try {
      const res = await ApiService.getStudentAttendanceReport(user?.token);
      if (res && res.success && res.data) {
        const report = res.data;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Attendance Report - ${report.student.studentName}</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #1e293b; }
                  .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
                  .school-name { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
                  .school-sub { font-size: 13px; color: #64748b; }
                  .doc-title { font-size: 16px; font-weight: 700; color: #0284c7; margin-top: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
                  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; }
                  .summary-box { display: flex; justify-content: space-around; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
                  .stat-item { text-align: center; }
                  .stat-num { font-size: 22px; font-weight: 800; color: #065f46; }
                  .stat-lbl { font-size: 12px; color: #047857; text-transform: uppercase; font-weight: 600; }
                  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
                  th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
                  th { background: #f1f5f9; font-weight: 700; color: #334155; }
                  .sign-row { display: flex; justify-content: space-between; margin-top: 60px; padding-top: 16px; }
                  .sign-box { text-align: center; width: 200px; border-top: 1px solid #94a3b8; padding-top: 8px; font-size: 13px; font-weight: 600; color: #475569; }
                  @media print { body { margin: 20px; } button { display: none; } }
                </style>
              </head>
              <body>
                <div class="header">
                  <div class="school-name">${report.school.schoolName}</div>
                  <div class="school-sub">${report.school.address} • Affiliation: ${report.school.affiliation}</div>
                  <div class="doc-title">Official Student Attendance Summary Report</div>
                </div>

                <div class="info-grid">
                  <div><strong>Student Name:</strong> ${report.student.studentName}</div>
                  <div><strong>Student ID / Admission No:</strong> ${report.student.admissionNo}</div>
                  <div><strong>Class & Section:</strong> Class ${report.student.class} - ${report.student.section}</div>
                  <div><strong>Roll Number:</strong> ${report.student.rollNo}</div>
                  <div><strong>Vocational Level:</strong> ${report.student.certificateLevel}</div>
                  <div><strong>Academic Session:</strong> ${report.academicYear}</div>
                </div>

                <div class="summary-box">
                  <div class="stat-item">
                    <div class="stat-num">${report.summary.totalRecords}</div>
                    <div class="stat-lbl">Total Working Days</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-num">${report.summary.presentCount}</div>
                    <div class="stat-lbl">Days Present</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-num">${report.summary.absentCount}</div>
                    <div class="stat-lbl">Days Absent</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-num" style="color: ${report.summary.attendancePercentage !== null && report.summary.attendancePercentage >= 75 ? '#059669' : '#dc2626'}">${report.summary.attendancePercentage !== null && report.summary.attendancePercentage !== undefined ? `${report.summary.attendancePercentage}%` : 'No records'}</div>
                    <div class="stat-lbl">Overall Attendance</div>
                  </div>
                </div>

                <h4>Monthly Breakdown</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Working Days</th>
                      <th>Present</th>
                      <th>Late</th>
                      <th>Absent / Leave</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(report.monthlyBreakdown || []).map(m => `
                      <tr>
                        <td><strong>${m.month}</strong></td>
                        <td>${m.total}</td>
                        <td>${m.present}</td>
                        <td>${m.late}</td>
                        <td>${m.absent + m.leave}</td>
                        <td><strong>${m.percentage}%</strong></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div class="sign-row">
                  <div class="sign-box">Class Teacher</div>
                  <div class="sign-box">Vocational Coordinator</div>
                  <div class="sign-box">Principal / Head of Institution</div>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                  <button onclick="window.print()" style="padding: 10px 24px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer;">Print / Save as PDF</button>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
    } catch (err) {
      alert('Unable to generate attendance report. Please try again.');
    } finally {
      setDownloadingReport(false);
    }
  };

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

  if (error && attendanceRecords.length === 0) {
    return (
      <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '16px' }}>
        <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
          Unable to Load Attendance
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
        <button type="button" className="btn-primary" onClick={() => loadAttendance(true)}>
          <RefreshCw size={15} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const studentName = user?.name || 'Student';
  const studentClass = user?.class || '9';
  const studentSection = user?.section || 'A';
  const studentRoll = user?.rollNo || '1';

  // Overall attendance calculations derived from backend summary or records
  const totalWorkingDays = summaryData?.totalWorkingDays ?? attendanceRecords.length;
  const presentDays = summaryData?.presentDays ?? attendanceRecords.filter(r => (r.status || '').toUpperCase() === 'PRESENT').length;
  const absentDays = summaryData?.absentDays ?? attendanceRecords.filter(r => (r.status || '').toUpperCase() === 'ABSENT' || (r.status || '').toUpperCase() === 'LEAVE').length;
  const percentage = summaryData?.percentage ?? (totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0);
  const consecutiveAbsenceStreak = summaryData?.consecutiveAbsenceStreak ?? 0;

  // Selected Month Summary Calculation
  const selYear = currentDate.getFullYear();
  const selMonth = currentDate.getMonth() + 1;
  const selMonthPrefix = `${selYear}-${String(selMonth).padStart(2, '0')}`;

  const monthRecords = attendanceRecords.filter(r => (r.date || '').startsWith(selMonthPrefix));
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
  const timelineRecords = [...attendanceRecords].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="student-attendance-container animate-fade-in">
      {/* Top Breadcrumb / Action Bar */}
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

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleDownloadAttendanceReport}
            disabled={downloadingReport}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} className={downloadingReport ? 'spinner' : ''} />
            <span>{downloadingReport ? 'Generating...' : 'Download Report'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage('profile')}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
          >
            <User size={15} />
            <span>View Profile</span>
          </button>
          <button
            type="button"
            onClick={() => loadAttendance(true)}
            disabled={refreshing}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
          >
            <RefreshCw size={14} className={refreshing ? 'spinner' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Attendance Summary Header Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '16px',
          boxShadow: '0 8px 20px rgba(2, 132, 199, 0.22)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                ATTENDANCE 2.0
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: attHealth.bg, color: attHealth.color, padding: '2px 8px', borderRadius: '6px' }}>
                {attHealth.label}
              </span>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '2px 0 4px 0' }}>
              {studentName}'s Attendance Record
            </h1>
            <p style={{ fontSize: '0.85rem', opacity: 0.92, margin: 0 }}>
              Class <strong>{studentClass}</strong> • Section <strong>{studentSection}</strong> • Roll No <strong>{studentRoll}</strong> • Official Attendance Record
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1 }}>
              {percentage}%
            </div>
            <div style={{ fontSize: '0.8125rem', opacity: 0.9, marginTop: '2px' }}>
              Overall Attendance
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
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Recorded sessions</div>
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
            {consecutiveAbsenceStreak > 0 ? 'Consecutive days' : 'No current streak'}
          </div>
        </div>
      </div>

      {/* Main Grid: Monthly Calendar & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Calendar (2 Columns) */}
        <div className="lg:col-span-2">
          <AttendanceCalendar
            records={attendanceRecords}
            calendarEvents={calendarEvents}
            studentClass={studentClass}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
          />

          {/* Selected Month Summary Card */}
          <div className="card" style={{ marginTop: '16px', padding: '16px 20px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              Month Breakdown ({currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })})
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.8125rem', color: '#475569' }}>
              <div>Working Days: <strong style={{ color: '#0f172a' }}>{monthTotalWorking}</strong></div>
              <div>Present: <strong style={{ color: '#16a34a' }}>{monthPresent}</strong></div>
              <div>Absent: <strong style={{ color: '#dc2626' }}>{monthAbsent}</strong></div>
              <div>Month Rate: <strong style={{ color: '#0284c7' }}>{monthPercentage}%</strong></div>
            </div>
          </div>
        </div>

        {/* Chronological Timeline (1 Column) */}
        <div>
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={18} color="#0284c7" />
              <span>Attendance Timeline</span>
            </h3>

            {timelineRecords.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <Info size={28} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  No attendance records available.
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
