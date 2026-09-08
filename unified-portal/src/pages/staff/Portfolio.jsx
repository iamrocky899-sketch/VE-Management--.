import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';
import { sendApiRequest, resolveStudentGroup } from '../../api/client';
import {
  ArrowLeft,
  RefreshCw,
  User,
  CalendarCheck,
  Award,
  BookOpen,
  Briefcase,
  CheckSquare,
  Trophy,
  Phone,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ShieldAlert,
  Users
} from 'lucide-react';

export default function Portfolio({ onNavigate, studentId: propStudentId }) {
  const { user, isTeacher, isPrincipal } = useAuth();

  // Resolve studentId from prop or URL query parameter
  const studentId = useMemo(() => {
    if (propStudentId) return propStudentId;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('studentId');
    } catch (e) {
      return null;
    }
  }, [propStudentId]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Month navigation for attendance timeline
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const fetchPortfolio = async (isManual = false) => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await sendApiRequest('get_student_portfolio', { studentId });
      if (res && res.success && res.data) {
        setData(res.data);
      } else {
        const errCode = res?.error?.code;
        if (errCode === 'UNAUTHORIZED') {
          setError({
            type: 'UNAUTHORIZED',
            message: "You are not authorized to view this student's portfolio. This record is outside your assigned classes."
          });
        } else if (errCode === 'NOT_FOUND') {
          setError({
            type: 'NOT_FOUND',
            message: `Student record not found for ID: ${studentId}`
          });
        } else {
          setError({
            type: 'GENERAL',
            message: res?.error?.message || 'Unable to load student portfolio.'
          });
        }
      }
    } catch (err) {
      setError({
        type: 'NETWORK',
        message: 'Unable to connect to the school server. Please check your internet connection.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [studentId]);

  // Calendar Timeline Calculations
  const timelineDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const records = data?.attendanceSummary?.recentRecords || [];
    const recordMap = {};
    records.forEach((r) => {
      if (r.date) recordMap[r.date] = r.status;
    });

    const days = [];
    // Leading empty days
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, type: 'empty' });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      const isSunday = dayOfWeek === 0;

      let status = recordMap[dateStr] || null;
      let type = 'none';

      if (status === 'PRESENT') type = 'present';
      else if (status === 'ABSENT' || status === 'LEAVE') type = 'absent';
      else if (isSunday) type = 'weekend';

      days.push({
        dayNumber: d,
        dateStr,
        type,
        status
      });
    }

    return days;
  }, [selectedDate, data]);

  const changeMonth = (offset) => {
    setSelectedDate((prev) => {
      const newD = new Date(prev);
      newD.setMonth(newD.getMonth() + offset);
      return newD;
    });
  };

  // If no studentId was provided, prompt to select a student
  if (!studentId) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '50%', marginBottom: '16px' }}>
          <Users size={44} />
        </div>
        <h2 className="card-title" style={{ fontSize: '1.35rem' }}>Select a Student</h2>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Please select a student from your class directory to inspect their complete 360° academic and attendance portfolio.
        </p>
        <button
          className="btn-primary"
          style={{ width: 'auto', display: 'inline-flex', padding: '0 24px', margin: '0 auto' }}
          onClick={() => onNavigate && onNavigate('/students')}
        >
          <ArrowLeft size={16} />
          <span>Browse Students Directory</span>
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-card" style={{ height: '140px' }} />
        <div className="kpi-grid">
          <div className="skeleton skeleton-kpi" />
          <div className="skeleton skeleton-kpi" />
          <div className="skeleton skeleton-kpi" />
          <div className="skeleton skeleton-kpi" />
        </div>
        <div className="dashboard-split-grid">
          <div className="skeleton skeleton-card" style={{ height: '300px' }} />
          <div className="skeleton skeleton-card" style={{ height: '300px' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--danger-50)', color: 'var(--danger-500)', borderRadius: '50%', marginBottom: '16px' }}>
          {error.type === 'UNAUTHORIZED' ? <ShieldAlert size={44} /> : <AlertCircle size={44} />}
        </div>
        <h2 className="card-title" style={{ fontSize: '1.35rem' }}>
          {error.type === 'UNAUTHORIZED' ? 'Access Restricted (403)' : error.type === 'NOT_FOUND' ? 'Student Not Found (404)' : 'Error Loading Portfolio'}
        </h2>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginBottom: '24px' }}>{error.message}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            className="btn-back-link"
            onClick={() => onNavigate && onNavigate('/students')}
          >
            <ArrowLeft size={16} />
            <span>Back to Students</span>
          </button>
          {error.type !== 'UNAUTHORIZED' && error.type !== 'NOT_FOUND' && (
            <button className="btn-primary" style={{ width: 'auto', padding: '0 20px' }} onClick={() => fetchPortfolio(false)}>
              <RefreshCw size={16} />
              <span>Try Again</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const student = data?.student || {};
  const attendance = data?.attendanceSummary || { totalWorkingDays: 0, presentDays: 0, absentDays: 0, percentage: 0, consecutiveAbsenceStreak: 0 };
  const marks = data?.marks || [];
  const assignments = data?.assignments || [];
  const activities = data?.activities || [];
  const achievements = data?.achievements || [];

  const studentName = student.name || student.studentName || 'Student';
  const initials = studentName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  const isActive = (student.status || 'ACTIVE').toUpperCase() === 'ACTIVE';

  // Health Calculation
  const pct = attendance.percentage || 0;
  const streak = attendance.consecutiveAbsenceStreak || 0;
  let healthClass = 'health-good';
  let healthLabel = '🟢 Good Attendance';
  let healthDesc = 'Attendance is regular and healthy.';

  if (pct < 60 || streak >= 5) {
    healthClass = 'health-atrisk';
    healthLabel = '🔴 At Risk';
    healthDesc = streak >= 5 ? `⚠️ Critical Alert: ${streak} consecutive absences recorded.` : `⚠️ Critical low attendance (${pct}%).`;
  } else if (pct < 75 || streak > 2) {
    healthClass = 'health-attention';
    healthLabel = '🟠 Needs Attention';
    healthDesc = streak > 2 ? `Requires monitoring: ${streak} consecutive absences.` : `Attendance (${pct}%) is below the recommended 75% threshold.`;
  }

  return (
    <div>
      {/* 1. Top Navigation Bar */}
      <div className="portfolio-top-nav">
        <button
          className="btn-back-link"
          onClick={() => onNavigate && onNavigate('/students')}
          aria-label="Back to Students list"
        >
          <ArrowLeft size={18} />
          <span>Back to Students Directory</span>
        </button>

        <button
          className="btn-refresh"
          style={{ color: 'var(--slate-700)', background: '#ffffff', borderColor: 'var(--slate-200)' }}
          onClick={() => fetchPortfolio(true)}
          disabled={refreshing}
          aria-label="Refresh student portfolio"
        >
          <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* 2. Portfolio Hero Header */}
      <div className="portfolio-hero-card">
        <div className="portfolio-hero-info">
          <div className="portfolio-large-avatar">{initials}</div>
          <div>
            <h1 className="portfolio-hero-name">{studentName}</h1>
            <div className="portfolio-hero-meta">
              <span>Class {student.class}</span>
              <span>•</span>
              <span>Section {student.section || 'A'}</span>
              <span>•</span>
              <span>Roll: #{student.roll || '--'}</span>
              {student.gender && (
                <>
                  <span>•</span>
                  <span>{student.gender}</span>
                </>
              )}
            </div>

            <div className="portfolio-hero-badges">
              <span className={`status-pill ${isActive ? 'status-pill-active' : 'status-pill-inactive'}`}>
                {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                <span>{isActive ? 'Active Student' : 'Inactive'}</span>
              </span>

              <span className="hero-chip" style={{
                background: 'rgba(255, 255, 255, 0.22)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 700
              }}>
                <Users size={12} />
                <span>Student Group: <strong>{resolveStudentGroup(student)}</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div>
          <span className={`health-status-badge ${healthClass}`}>{healthLabel}</span>
        </div>
      </div>

      {/* 3. Attendance Health Stats Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Attendance Rate</span>
            <div className="kpi-icon-box kpi-icon-blue">
              <CalendarCheck size={20} />
            </div>
          </div>
          <div className="kpi-value">{pct}%</div>
          <div className="kpi-subtext">{healthDesc}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Working Days</span>
            <div className="kpi-icon-box kpi-icon-purple">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value">{attendance.totalWorkingDays}</div>
          <div className="kpi-subtext">Total recorded school sessions</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Days Present</span>
            <div className="kpi-icon-box kpi-icon-green">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="kpi-value">{attendance.presentDays}</div>
          <div className="kpi-subtext">{attendance.absentDays} recorded absences</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Absence Streak</span>
            <div className="kpi-icon-box kpi-icon-red">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="kpi-value">{streak}</div>
          <div className="kpi-subtext">{streak > 0 ? `${streak} consecutive active days absent` : 'No active absence streak'}</div>
        </div>
      </div>

      {/* 4. Two-Column Portfolio Split */}
      <div className="dashboard-split-grid">
        {/* Left Column */}
        <div>
          {/* Monthly Attendance Timeline */}
          <div className="card">
            <div className="timeline-header-nav">
              <h3 className="card-title" style={{ fontSize: '1.05rem', margin: 0 }}>
                Attendance Timeline
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn-month-nav"
                  onClick={() => changeMonth(-1)}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="timeline-month-title">
                  {selectedDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  className="btn-month-nav"
                  onClick={() => changeMonth(1)}
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="timeline-calendar-grid">
              <div className="calendar-day-header">Sun</div>
              <div className="calendar-day-header">Mon</div>
              <div className="calendar-day-header">Tue</div>
              <div className="calendar-day-header">Wed</div>
              <div className="calendar-day-header">Thu</div>
              <div className="calendar-day-header">Fri</div>
              <div className="calendar-day-header">Sat</div>

              {timelineDays.map((d, idx) => {
                if (d.type === 'empty') {
                  return <div key={`empty-${idx}`} className="calendar-day-cell day-empty" />;
                }
                const cellClass =
                  d.type === 'present'
                    ? 'day-present'
                    : d.type === 'absent'
                    ? 'day-absent'
                    : d.type === 'weekend'
                    ? 'day-weekend'
                    : '';

                return (
                  <div key={d.dateStr || idx} className={`calendar-day-cell ${cellClass}`}>
                    <span>{d.dayNumber}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', background: 'var(--success-50)', border: '1px solid #a7f3d0', borderRadius: '3px' }} />
                <span>Present</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', background: 'var(--danger-50)', border: '1px solid #fecaca', borderRadius: '3px' }} />
                <span>Absent</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', background: 'var(--slate-100)', border: '1px solid var(--slate-200)', borderRadius: '3px' }} />
                <span>Weekend / Holiday</span>
              </div>
            </div>
          </div>

          {/* Academic Marks Performance */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="var(--primary-600)" />
              <span>Academic Performance (4 Exams)</span>
            </h3>

            {marks.length > 0 ? (
              <div className="marks-cards-grid">
                {marks.map((m, idx) => {
                  const theory = m.theory != null ? Number(m.theory) : null;
                  const practical = m.practical != null ? Number(m.practical) : null;
                  const total = m.total != null ? Number(m.total) : theory != null && practical != null ? theory + practical : null;
                  const max = m.maxMarks || 50;
                  const pctScore = total != null ? Math.round((total / max) * 100) : 0;

                  return (
                    <div key={m.markId || idx} className="exam-mark-card">
                      <div className="exam-type-header">{m.examType || 'Term Exam'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '8px' }}>
                        Subject: <strong>{m.subject || 'IT/ITeS'}</strong>
                      </div>

                      <div className="exam-score-large">
                        {total != null ? `${total} / ${max}` : 'Marks Pending'}
                      </div>

                      <div className="attendance-progress-track">
                        <div
                          className="attendance-progress-bar"
                          style={{
                            width: `${Math.min(100, pctScore)}%`,
                            background: pctScore >= 60 ? 'linear-gradient(90deg, var(--primary-500), var(--success-500))' : 'var(--warning-500)'
                          }}
                        />
                      </div>

                      <div className="exam-breakdown-row">
                        <span>Theory: {theory != null ? theory : '--'}</span>
                        <span>Practical: {practical != null ? practical : '--'}</span>
                        <span>Score: {pctScore}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state-box">
                <Award size={32} />
                <span>Marks not available</span>
              </div>
            )}
          </div>

          {/* Student Achievements */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} color="#b45309" />
              <span>Student Achievements & Recognitions</span>
            </h3>

            {achievements.length > 0 ? (
              <div className="widget-list">
                {achievements.map((ach, idx) => (
                  <div key={ach.achievementId || idx} className="notice-item">
                    <div className="notice-header">
                      <span className="notice-title">{ach.title}</span>
                      <span className="priority-pill" style={{ background: '#fef3c7', color: '#92400e' }}>
                        {ach.category || 'RECOGNITION'}
                      </span>
                    </div>
                    {ach.description && <p style={{ fontSize: '0.8125rem', color: 'var(--slate-600)', margin: '4px 0' }}>{ach.description}</p>}
                    <div className="notice-meta">
                      <span>{ach.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-box">
                <Trophy size={32} />
                <span>No achievements recorded yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Personal Information */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="var(--primary-600)" />
              <span>Personal & Guardian Information</span>
            </h3>

            <div className="personal-info-grid">
              <div className="info-item-block">
                <div className="info-item-label">Gender</div>
                <div className="info-item-value">{student.gender || 'Not available'}</div>
              </div>

              <div className="info-item-block">
                <div className="info-item-label">Date of Birth</div>
                <div className="info-item-value">{student.dob || 'Not available'}</div>
              </div>

              <div className="info-item-block">
                <div className="info-item-label">Father's Name</div>
                <div className="info-item-value">{student.fatherName || 'Not available'}</div>
              </div>

              <div className="info-item-block">
                <div className="info-item-label">Mother's Name</div>
                <div className="info-item-value">{student.motherName || 'Not available'}</div>
              </div>

              <div className="info-item-block" style={{ gridColumn: 'span 2' }}>
                <div className="info-item-label">Primary Contact</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="info-item-value">{student.mobile || student.parentPhone || 'Not available'}</span>
                  {(student.mobile || student.parentPhone) && (
                    <a
                      href={`tel:${student.mobile || student.parentPhone}`}
                      className="call-parent-btn"
                      aria-label="Call parent or guardian"
                    >
                      <Phone size={16} />
                      <span>Call Parent</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="info-item-block">
                <div className="info-item-label">Village / Town</div>
                <div className="info-item-value">{student.village || student.address || 'Not available'}</div>
              </div>

              <div className="info-item-block">
                <div className="info-item-label">District & PIN</div>
                <div className="info-item-value">
                  {student.district || 'Biswanath'} {student.pin ? `- ${student.pin}` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Class Assignments */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={20} color="var(--primary-600)" />
              <span>Class Assignments & Homework</span>
            </h3>

            {assignments.length > 0 ? (
              <div className="widget-list">
                {assignments.map((asg, idx) => (
                  <div key={asg.assignmentId || idx} className="notice-item">
                    <div className="notice-header">
                      <span className="notice-title">{asg.title}</span>
                      <span className="priority-pill priority-normal">Class {asg.class}</span>
                    </div>
                    <div className="notice-meta">
                      <span>Subject: {asg.subject || 'IT/ITeS'}</span>
                      <span>•</span>
                      <span>Due: {asg.dueDate || 'Open'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-box">
                <CheckSquare size={28} />
                <span>No assignments published for this class</span>
              </div>
            )}
          </div>

          {/* Vocational Activities */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="var(--primary-600)" />
              <span>Vocational Practical Activities</span>
            </h3>

            {activities.length > 0 ? (
              <div className="widget-list">
                {activities.map((act, idx) => (
                  <div key={act.activityId || idx} className="notice-item">
                    <div className="notice-header">
                      <span className="notice-title">{act.title}</span>
                      <span className="priority-pill priority-normal">{act.category || 'PRACTICAL'}</span>
                    </div>
                    {act.description && <p style={{ fontSize: '0.8125rem', color: 'var(--slate-600)', margin: '4px 0' }}>{act.description}</p>}
                    <div className="notice-meta">
                      <span>Date: {act.date}</span>
                      <span>•</span>
                      <span>Class {act.class}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-box">
                <Briefcase size={28} />
                <span>No practical activities recorded</span>
              </div>
            )}
          </div>

          {/* Student Documents */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="var(--slate-600)" />
              <span>Student Documents & Records</span>
            </h3>
            <div className="empty-state-box">
              <FileText size={28} />
              <span>No documents available.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
