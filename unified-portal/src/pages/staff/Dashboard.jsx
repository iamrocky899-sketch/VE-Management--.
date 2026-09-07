import React, { useState, useEffect } from 'react';
import { useAuth } from '../../state/AuthContext';
import { sendApiRequest } from '../../api/client';
import {
  Users,
  CalendarCheck,
  Award,
  AlertTriangle,
  RefreshCw,
  Clock,
  Bell,
  Calendar,
  Briefcase,
  CheckSquare,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileText,
  UserCheck,
  School,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function Dashboard({ onNavigate }) {
  const { user, isTeacher, isPrincipal, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await sendApiRequest('get_dashboard_summary');
      if (res && res.success && res.data) {
        setData(res.data.summary || res.data);
      } else {
        setError(res?.error?.message || 'Unable to load your dashboard.');
      }
    } catch (err) {
      setError('Unable to connect to the school server. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format calendar date
  const formatEventDate = (dateStr) => {
    if (!dateStr) return { month: 'DATE', day: '--' };
    const d = new Date(dateStr);
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = d.getDate() || dateStr.split('-')[2] || '--';
    return { month, day };
  };

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
          <div className="skeleton skeleton-card" style={{ height: '280px' }} />
          <div className="skeleton skeleton-card" style={{ height: '280px' }} />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--danger-50)', color: 'var(--danger-500)', borderRadius: '50%', marginBottom: '16px' }}>
          <AlertCircle size={44} />
        </div>
        <h2 className="card-title" style={{ fontSize: '1.35rem' }}>Unable to load your dashboard</h2>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginBottom: '24px' }}>{error}</p>
        <button
          className="btn-primary"
          style={{ width: 'auto', display: 'inline-flex', padding: '0 24px', margin: '0 auto' }}
          onClick={() => fetchDashboardData(false)}
        >
          <RefreshCw size={16} />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  // Derived metrics
  const studentTotal = data?.studentTotals?.total || 0;
  const presentToday = data?.todayAttendance?.present || 0;
  const totalStudentsForAtt = data?.todayAttendance?.totalStudents || studentTotal;
  const absentToday = Math.max(0, totalStudentsForAtt - presentToday);
  const attendancePct = data?.todayAttendance?.percentage || (totalStudentsForAtt > 0 ? Math.round((presentToday / totalStudentsForAtt) * 100) : 0);
  const pendingClasses = data?.todayAttendance?.pendingClasses || [];

  const assignedClasses = data?.assignedClasses || user?.assignedClasses || ['9', '10'];
  const assignedSubjects = data?.assignedSubjects || user?.assignedSubjects || ['IT/ITeS'];

  return (
    <div>
      {/* 1. Header Hero Banner */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-subtitle-badge">
            <Sparkles size={14} />
            <span>{isPrincipal ? 'Principal Oversight' : 'Vocational Teacher'}</span>
          </div>
          <h1 className="hero-title">
            {getGreeting()}, {user?.name || data?.teacherName || 'Staff Member'}!
          </h1>
          <p style={{ color: '#dbeafe', fontSize: '0.875rem' }}>
            {isPrincipal
              ? 'Gameri Higher Secondary School — Daily Academic Status'
              : `Assigned Classes: Class ${assignedClasses.join(', ')} • Subjects: ${assignedSubjects.join(', ')}`}
          </p>

          <div className="hero-chips-container">
            {isTeacher &&
              assignedClasses.map((cls) => (
                <span key={cls} className="hero-chip">
                  Class {cls}
                </span>
              ))}
            {isTeacher &&
              assignedSubjects.map((sub) => (
                <span key={sub} className="hero-chip" style={{ background: 'rgba(255, 255, 255, 0.25)' }}>
                  {sub}
                </span>
              ))}
            {isPrincipal && <span className="hero-chip">School-Wide (Classes 9–12)</span>}
          </div>
        </div>

        <div>
          <button
            className="btn-refresh"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">{isPrincipal ? 'Total Enrollment' : 'My Students'}</span>
            <div className="kpi-icon-box kpi-icon-blue">
              <Users size={20} />
            </div>
          </div>
          <div className="kpi-value">{studentTotal}</div>
          <div className="kpi-subtext">
            {isPrincipal ? 'Across Classes 9, 10, 11, 12' : `Enrolled in Class ${assignedClasses.join(', ')}`}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Present Today</span>
            <div className="kpi-icon-box kpi-icon-green">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="kpi-value">{presentToday}</div>
          <div className="kpi-subtext">{attendancePct}% Daily Attendance</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Absent Today</span>
            <div className="kpi-icon-box kpi-icon-red">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="kpi-value">{absentToday}</div>
          <div className="kpi-subtext">{pendingClasses.length > 0 ? `${pendingClasses.length} class register pending` : 'All registers recorded'}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Attendance Rate</span>
            <div className="kpi-icon-box kpi-icon-amber">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-value">{attendancePct}%</div>
          <div className="kpi-subtext">{totalStudentsForAtt} total students tracked</div>
        </div>

        {isPrincipal && data?.staffSummary && (
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Staff Members</span>
              <div className="kpi-icon-box kpi-icon-purple">
                <UserCheck size={20} />
              </div>
            </div>
            <div className="kpi-value">{data.staffSummary.activeStaff || 0}</div>
            <div className="kpi-subtext">{data.staffSummary.totalStaff || 0} registered staff accounts</div>
          </div>
        )}
      </div>

      {/* 3. Quick Actions */}
      <div className="card quick-actions-card">
        <h3 className="card-title" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--primary-600)" />
          <span>Quick Actions</span>
        </h3>
        <div className="quick-actions-grid">
          <button className="btn-quick-action" onClick={() => onNavigate('/attendance')}>
            <CalendarCheck size={18} color="var(--primary-600)" />
            <span>Mark Attendance</span>
          </button>
          <button className="btn-quick-action" onClick={() => onNavigate('/marks')}>
            <Award size={18} color="var(--primary-600)" />
            <span>Enter Marks</span>
          </button>
          <button className="btn-quick-action" onClick={() => onNavigate('/notes')}>
            <BookOpen size={18} color="var(--primary-600)" />
            <span>Add Lesson Note</span>
          </button>
          <button className="btn-quick-action" onClick={() => onNavigate('/assignments')}>
            <CheckSquare size={18} color="var(--primary-600)" />
            <span>Create Assignment</span>
          </button>
          <button className="btn-quick-action" onClick={() => onNavigate('/activities')}>
            <Briefcase size={18} color="var(--primary-600)" />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* 4. Two-Column Dashboard Split */}
      <div className="dashboard-split-grid">
        {/* Left Column */}
        <div>
          {/* Class Overview */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title" style={{ fontSize: '1.05rem' }}>
                {isPrincipal ? 'School Classes Overview' : 'My Classes Overview'}
              </h3>
              <button
                className="nav-item"
                style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8125rem', color: 'var(--primary-600)' }}
                onClick={() => onNavigate(isPrincipal ? '/classes' : '/students')}
              >
                <span>View Students</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="class-cards-grid">
              {(isPrincipal ? ['9', '10', '11', '12'] : assignedClasses).map((cls) => {
                const count = data?.studentTotals?.byClass?.[cls] || 0;
                const isPending = pendingClasses.includes(String(cls));
                return (
                  <div key={cls} className="class-overview-card">
                    <div className="class-badge-header">
                      <span className="class-pill">Class {cls}</span>
                      <span className="class-student-count">{count} Students</span>
                    </div>
                    <div className="attendance-meter-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        <span>Today's Status</span>
                        <span style={{ fontWeight: 600, color: isPending ? 'var(--warning-700)' : 'var(--success-700)' }}>
                          {isPending ? 'Pending' : 'Recorded'}
                        </span>
                      </div>
                      <div className="attendance-progress-track">
                        <div
                          className="attendance-progress-bar"
                          style={{
                            width: isPending ? '25%' : '90%',
                            background: isPending ? 'var(--warning-500)' : 'linear-gradient(90deg, var(--primary-500), var(--success-500))'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Tasks & Action Alerts */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--warning-500)" />
              <span>Pending Tasks & Alerts</span>
            </h3>

            {pendingClasses.length > 0 ? (
              pendingClasses.map((cls) => (
                <div key={cls} className="pending-task-item">
                  <div className="task-info">
                    <AlertTriangle size={20} color="var(--warning-700)" className="flex-shrink-0" style={{ marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--warning-700)' }}>
                        Class {cls} Attendance Pending
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)' }}>
                        Today's attendance register for Class {cls} has not been recorded yet.
                      </div>
                    </div>
                  </div>
                  <button className="task-btn" onClick={() => onNavigate('/attendance')}>
                    <span>Mark Attendance</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state-box">
                <CheckCircle2 size={32} color="var(--success-500)" />
                <span>All daily attendance and classroom tasks are up to date!</span>
              </div>
            )}
          </div>

          {/* Recent Practical Activities */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title" style={{ fontSize: '1.05rem' }}>Recent Vocational Activities</h3>
              <button
                className="nav-item"
                style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8125rem', color: 'var(--primary-600)' }}
                onClick={() => onNavigate('/activities')}
              >
                <span>View Activities</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {data?.recentActivities && data.recentActivities.length > 0 ? (
              <div className="widget-list">
                {data.recentActivities.map((act, idx) => (
                  <div key={act.activityId || idx} className="notice-item">
                    <div className="notice-header">
                      <span className="notice-title">{act.title}</span>
                      <span className="priority-pill priority-normal">Class {act.class}</span>
                    </div>
                    <div className="notice-meta">
                      <span>{act.category || 'PRACTICAL'}</span>
                      <span>•</span>
                      <span>{act.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-box">
                <Briefcase size={28} />
                <span>No recent activities logged yet</span>
              </div>
            )}
          </div>

          {/* Recent Homework & Assignments */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title" style={{ fontSize: '1.05rem' }}>Recent Class Assignments</h3>
              <button
                className="nav-item"
                style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8125rem', color: 'var(--primary-600)' }}
                onClick={() => onNavigate('/assignments')}
              >
                <span>View Assignments</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {data?.recentAssignments && data.recentAssignments.length > 0 ? (
              <div className="widget-list">
                {data.recentAssignments.map((asg, idx) => (
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
                <span>No recent assignments published</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Recent School Notices */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title" style={{ fontSize: '1.05rem' }}>Recent Notices</h3>
              <button
                className="nav-item"
                style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8125rem', color: 'var(--primary-600)' }}
                onClick={() => onNavigate('/notices')}
              >
                <span>View All</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {data?.recentNotices && data.recentNotices.length > 0 ? (
              <div className="widget-list">
                {data.recentNotices.map((n, idx) => (
                  <div key={n.noticeId || idx} className="notice-item">
                    <div className="notice-header">
                      <span className="notice-title">{n.title}</span>
                      <span className={`priority-pill ${n.priority === 'HIGH' ? 'priority-high' : 'priority-normal'}`}>
                        {n.priority || 'NORMAL'}
                      </span>
                    </div>
                    {n.body && <p style={{ fontSize: '0.8125rem', color: 'var(--slate-600)', margin: '4px 0 6px 0' }}>{n.body}</p>}
                    <div className="notice-meta">
                      <span>{n.date}</span>
                      {n.class && <span>• Target: Class {n.class}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-box">
                <Bell size={28} />
                <span>No recent notices</span>
              </div>
            )}
          </div>

          {/* Upcoming Events / Academic Calendar */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title" style={{ fontSize: '1.05rem' }}>Upcoming Events</h3>
              <button
                className="nav-item"
                style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8125rem', color: 'var(--primary-600)' }}
                onClick={() => onNavigate('/calendar')}
              >
                <span>View Calendar</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {data?.upcomingCalendar && data.upcomingCalendar.length > 0 ? (
              <div className="widget-list">
                {data.upcomingCalendar.map((ev, idx) => {
                  const { month, day } = formatEventDate(ev.date);
                  return (
                    <div key={ev.eventId || idx} className="event-item">
                      <div className="event-date-box">
                        <span className="event-month">{month}</span>
                        <span className="event-day">{day}</span>
                      </div>
                      <div className="event-details">
                        <div className="event-title">{ev.title}</div>
                        <div className="event-cat">{ev.category || 'Academic Event'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state-box">
                <Calendar size={28} />
                <span>No upcoming events</span>
              </div>
            )}
          </div>

          {/* Principal Staff Management Overview Card */}
          {isPrincipal && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 className="card-title" style={{ fontSize: '1.05rem' }}>Staff Administration</h3>
                <button
                  className="nav-item"
                  style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8125rem', color: 'var(--primary-600)' }}
                  onClick={() => onNavigate('/teachers')}
                >
                  <span>Manage Staff</span>
                  <ArrowRight size={14} />
                </button>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', marginBottom: '14px' }}>
                {data?.staffSummary?.activeStaff || 0} active teaching and administrative staff members.
              </p>
              <button
                className="btn-primary"
                style={{ width: '100%', height: '42px', fontSize: '0.875rem' }}
                onClick={() => onNavigate('/teachers')}
              >
                <UserCheck size={16} />
                <span>Open Staff Roster</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
