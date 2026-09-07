import React, { useState, useEffect } from 'react';
import { useAuth } from '../../state/AuthContext';
import { ApiService } from '../../api/client';
import {
  Users, CheckCircle2, Award, BookOpen, Calendar,
  Bell, FileText, Activity, User, Phone, ArrowRight,
  AlertCircle, RefreshCw, ShieldCheck, Flame, MessageCircle, School
} from 'lucide-react';

export default function ParentDashboard({ setActivePage }) {
  const { user, selectedChildId, switchChild, updateChildren, handleSessionRevocation } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await ApiService.getParentDashboard(user?.token);

      if (res && res.success && res.data) {
        setDashboardData(res.data);
        if (res.data.children && res.data.children.length > 0) {
          const rawChildren = res.data.children.map(c => c.student);
          updateChildren(rawChildren);
          if (!selectedChildId) {
            switchChild(rawChildren[0].studentId);
          }
        }
      } else {
        const errCode = res?.error?.code;
        if (errCode === 'SESSION_EXPIRED') {
          handleSessionRevocation('SESSION_EXPIRED');
          return;
        } else if (errCode === 'ACCOUNT_DEACTIVATED') {
          handleSessionRevocation('ACCOUNT_DEACTIVATED');
          return;
        }
        setError(res?.error?.message || 'Unable to load parent dashboard.');
      }
    } catch (e) {
      setError('Network connection error. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchDashboard();
    }
  }, [user?.token]);

  if (loading) {
    return (
      <div className="dashboard-skeleton-wrap animate-fade-in">
        <div className="card skeleton" style={{ height: '140px', marginBottom: '20px', borderRadius: '20px' }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: '20px' }}>
          <div className="card skeleton" style={{ height: '130px', borderRadius: '16px' }} />
          <div className="card skeleton" style={{ height: '130px', borderRadius: '16px' }} />
          <div className="card skeleton" style={{ height: '130px', borderRadius: '16px' }} />
          <div className="card skeleton" style={{ height: '130px', borderRadius: '16px' }} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card skeleton" style={{ height: '260px', borderRadius: '16px' }} />
          <div className="card skeleton" style={{ height: '260px', borderRadius: '16px' }} />
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="dashboard-error-state card animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '20px' }}>
        <AlertCircle size={44} color="#dc2626" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
          Unable to Load Parent Dashboard
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px', maxWidth: '400px', margin: '0 auto 16px auto' }}>
          {error}
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={() => fetchDashboard(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const parent = dashboardData?.parent || {
    parentName: user?.name || 'Parent',
    mobile: user?.mobile || 'N/A'
  };

  const childrenSummaries = dashboardData?.children || [];
  const upcomingCalendar = dashboardData?.upcomingCalendar || [];

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

  const marksList = activeChildSummary?.marks || [];
  const assignmentsList = activeChildSummary?.recentAssignments || [];
  const activitiesList = activeChildSummary?.recentActivities || [];
  const noticesList = activeChildSummary?.recentNotices || [];

  // Compute marks average for child
  const evaluatedMarks = marksList.filter(m => m.total !== undefined && m.total !== null);
  const avgMarks = evaluatedMarks.length > 0
    ? Math.round(evaluatedMarks.reduce((acc, m) => acc + Number(m.total || 0), 0) / evaluatedMarks.length)
    : 0;

  // Attendance health badge
  const getAttendanceHealth = (pct) => {
    if (pct >= 75) return { label: 'Good Standing', color: '#16a34a', bg: '#dcfce7' };
    if (pct >= 60) return { label: 'Needs Attention', color: '#d97706', bg: '#fef3c7' };
    return { label: 'At Risk', color: '#dc2626', bg: '#fee2e2' };
  };

  const attHealth = getAttendanceHealth(attSummary.percentage);

  return (
    <div className="parent-dashboard-container animate-fade-in">
      {/* Parent Hero Banner */}
      <div
        className="card parent-hero-banner"
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
          color: '#ffffff',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '16px',
          boxShadow: '0 10px 25px -5px rgba(6, 95, 70, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.3rem',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              {parent.parentName ? parent.parentName.charAt(0) : 'P'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  PARENT PORTAL
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    background: '#047857',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  {childrenSummaries.length} {childrenSummaries.length === 1 ? 'CHILD LINKED' : 'CHILDREN LINKED'}
                </span>
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '2px 0 4px 0', lineHeight: 1.2 }}>
                Welcome, {parent.parentName}!
              </h1>
              <p style={{ fontSize: '0.85rem', opacity: 0.92, margin: 0 }}>
                Viewing academic and attendance progress for your registered child(ren).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="btn-secondary"
            aria-label="Refresh dashboard data"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '8px 12px',
              fontSize: '0.8125rem'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spinner' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Child Selector / Identity Card */}
      <div style={{ marginBottom: '20px' }}>
        {childrenSummaries.length === 0 ? (
          <div className="card" style={{ padding: '20px', textAlign: 'center', borderRadius: '16px' }}>
            <AlertCircle size={32} color="#d97706" style={{ margin: '0 auto 8px auto' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>No Children Linked</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
              Please contact the school office to register your children under mobile {parent.mobile}.
            </p>
          </div>
        ) : childrenSummaries.length === 1 ? (
          /* Single Child Prominent Card */
          <div
            className="card"
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: '#dcfce7',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem'
                }}
              >
                {selectedStudent.studentName ? selectedStudent.studentName.charAt(0) : 'S'}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                  {selectedStudent.studentName}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  <span>Class <strong>{selectedStudent.class}</strong> ({selectedStudent.section || 'N/A'})</span>
                  <span>•</span>
                  <span>Roll No <strong>{selectedStudent.rollNo}</strong></span>
                  <span>•</span>
                  <span>Group: <strong>{selectedStudent.group || 'Group Not Assigned'}</strong></span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '4px 10px', borderRadius: '8px' }}>
                Active Student
              </span>
            </div>
          </div>
        ) : (
          /* Multi-Child Switcher Grid */
          <div className="card" style={{ padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                <Users size={16} color="#059669" />
                <span>My Children ({childrenSummaries.length})</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Click to switch child view
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {childrenSummaries.map((childSummary) => {
                const isSelected = String(childSummary.student?.studentId) === String(selectedStudent.studentId);
                const stu = childSummary.student;

                return (
                  <button
                    key={stu.studentId}
                    type="button"
                    onClick={() => switchChild(stu.studentId)}
                    aria-label={`Select ${stu.studentName}`}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: isSelected ? '#047857' : '#f8fafc',
                      color: isSelected ? '#ffffff' : '#0f172a',
                      border: isSelected ? '1.5px solid #047857' : '1px solid #e2e8f0',
                      boxShadow: isSelected ? '0 4px 12px rgba(4, 120, 87, 0.25)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                        {stu.studentName}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: isSelected ? '#d1fae5' : '#64748b', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                        <span>Class {stu.class}-{stu.section || 'N/A'} • Roll {stu.rollNo}</span>
                        <span>•</span>
                        <span>Group: {stu.group || 'Group Not Assigned'}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={18} color="#ffffff" className="flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Child KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: '20px' }}>
        {/* Attendance Card */}
        <div
          className="card"
          style={{ padding: '18px', borderRadius: '16px', cursor: 'pointer', transition: 'transform 0.15s ease' }}
          onClick={() => setActivePage('attendance')}
          role="button"
          tabIndex={0}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: 700, fontSize: '0.875rem' }}>
              <CheckCircle2 size={18} />
              <span>Attendance</span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: attHealth.color, background: attHealth.bg, padding: '2px 6px', borderRadius: '6px' }}>
              {attHealth.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
              {attSummary.totalWorkingDays > 0 ? `${attSummary.percentage}%` : 'N/A'}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              ({attSummary.presentDays}/{attSummary.totalWorkingDays || 0} Days)
            </span>
          </div>
          {attSummary.consecutiveAbsenceStreak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>
              <Flame size={13} />
              <span>{attSummary.consecutiveAbsenceStreak} consecutive days absent</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
            <span>View Attendance Register</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Academic Marks Card */}
        <div
          className="card"
          style={{ padding: '18px', borderRadius: '16px', cursor: 'pointer', transition: 'transform 0.15s ease' }}
          onClick={() => setActivePage('marks')}
          role="button"
          tabIndex={0}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: 700, fontSize: '0.875rem' }}>
              <Award size={18} />
              <span>Academic Marks</span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6d28d9', background: '#f3e8ff', padding: '2px 6px', borderRadius: '6px' }}>
              Gradebook
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
              {avgMarks > 0 ? `${avgMarks}%` : 'N/A'}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              ({evaluatedMarks.length} Exams Recorded)
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Official Evaluation Marks
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>
            <span>View Marks Report</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Active Assignments Card */}
        <div
          className="card"
          style={{ padding: '18px', borderRadius: '16px', cursor: 'pointer', transition: 'transform 0.15s ease' }}
          onClick={() => setActivePage('assignments')}
          role="button"
          tabIndex={0}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 700, fontSize: '0.875rem' }}>
              <FileText size={18} />
              <span>Assignments</span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#047857', background: '#d1fae5', padding: '2px 6px', borderRadius: '6px' }}>
              Homework
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
              {assignmentsList.length}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Assigned Tasks
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {assignmentsList.length > 0 ? assignmentsList[0].title : 'All submissions monitored'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
            <span>View Assignments</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Activities Card */}
        <div
          className="card"
          style={{ padding: '18px', borderRadius: '16px', cursor: 'pointer', transition: 'transform 0.15s ease' }}
          onClick={() => setActivePage('activities')}
          role="button"
          tabIndex={0}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', fontWeight: 700, fontSize: '0.875rem' }}>
              <Activity size={18} />
              <span>Activities</span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: '6px' }}>
              Class {selectedStudent.class}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
              {activitiesList.length}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Vocational Sessions
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Practical Skills Training
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
            <span>View Activities</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Left Column (Notices & Study Materials) / Right Column (Calendar & Contacts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Study Materials Shortcut Banner */}
          <div
            className="card"
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: '#16a34a',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BookOpen size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#14532d', margin: 0 }}>
                  Teacher Study Materials for Class {selectedStudent.class}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#166534', margin: '2px 0 0 0' }}>
                  Review <strong>Main Book</strong> & <strong>Employability Skill</strong> lesson notes
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setActivePage('notes')}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
            >
              <span>View Materials</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Child-Scoped Notices */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
                <Bell size={18} color="#2563eb" />
                <span>School & Class {selectedStudent.class} Notices</span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActivePage('notices')}
                style={{ fontSize: '0.78rem', padding: '4px 8px' }}
              >
                View All
              </button>
            </div>

            {noticesList.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <Bell size={28} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                  No notices published for this class.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {noticesList.slice(0, 3).map((notice) => (
                  <div
                    key={notice.noticeId}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: notice.priority === 'URGENT' ? '#fee2e2' : notice.priority === 'HIGH' ? '#fef3c7' : '#eff6ff',
                            color: notice.priority === 'URGENT' ? '#dc2626' : notice.priority === 'HIGH' ? '#d97706' : '#2563eb'
                          }}
                        >
                          {notice.priority || 'NORMAL'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {notice.date || notice.createdAt?.split('T')[0] || 'Recent'}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                        {notice.title}
                      </div>
                    </div>
                    <ArrowRight size={14} color="#94a3b8" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Upcoming Academic Calendar Events */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
                <Calendar size={18} color="#d97706" />
                <span>Academic Calendar</span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActivePage('calendar')}
                style={{ fontSize: '0.78rem', padding: '4px 8px' }}
              >
                Calendar
              </button>
            </div>

            {upcomingCalendar.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <Calendar size={28} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                  No upcoming calendar events.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {upcomingCalendar.slice(0, 4).map((evt, idx) => (
                  <div
                    key={evt.calendarId || idx}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div
                      style={{
                        padding: '6px 8px',
                        background: '#ffffff',
                        borderRadius: '8px',
                        textAlign: 'center',
                        minWidth: '52px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>
                        {evt.date ? new Date(evt.date).toLocaleString('default', { month: 'short' }) : 'EVENT'}
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                        {evt.date ? new Date(evt.date).getDate() : '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#1e293b' }}>
                        {evt.title || evt.description || 'Academic Event'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#78350f' }}>
                        {evt.isWorking ? 'Working Day Event' : 'Official Holiday'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teacher & Principal Contact Preview */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <School size={16} color="#0284c7" />
              <span>School Contacts</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Class Teacher Preview */}
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Class {selectedStudent.class} Teacher
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', margin: '2px 0 6px 0' }}>
                  Vocational IT/ITeS Faculty
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setActivePage('contact')}
                    style={{ padding: '4px 8px', fontSize: '0.75rem', flex: 1 }}
                  >
                    <MessageCircle size={13} color="#16a34a" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setActivePage('contact')}
                    style={{ padding: '4px 8px', fontSize: '0.75rem', flex: 1 }}
                  >
                    <Phone size={13} color="#0284c7" />
                    <span>Call School</span>
                  </button>
                </div>
              </div>

              {/* Principal Office Preview */}
              <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Principal's Office
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', margin: '2px 0 6px 0' }}>
                  Gameri Higher Secondary School
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActivePage('contact')}
                  style={{ width: '100%', padding: '4px 8px', fontSize: '0.75rem' }}
                >
                  <School size={13} color="#0f172a" />
                  <span>Office Directory</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
