import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../state/AuthContext';
import { ApiService } from '../services/api';
import {
  FileText, Calendar, Clock, Tag, Search, ArrowLeft, RefreshCw,
  X, Info, AlertCircle, Sparkles, CheckCircle2, AlertTriangle
} from 'lucide-react';

export default function StudentAssignments({ setActivePage }) {
  const { user, handleSessionRevocation } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [assignmentsList, setAssignmentsList] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const STATUS_TABS = [
    { key: 'ALL', label: 'All Assignments' },
    { key: 'ACTIVE', label: 'Active / Due' },
    { key: 'CLOSED', label: 'Completed / Closed' }
  ];

  const studentClass = user?.class || '9';

  const loadAssignments = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await ApiService.getAssignments(user?.token);

      if (res && res.success && res.data) {
        setAssignmentsList(res.data.assignments || []);
      } else {
        const errCode = res?.error?.code;
        if (errCode === 'SESSION_EXPIRED') {
          handleSessionRevocation('SESSION_EXPIRED');
          return;
        } else if (errCode === 'ACCOUNT_DEACTIVATED') {
          handleSessionRevocation('ACCOUNT_DEACTIVATED');
          return;
        }
        setError(res?.error?.message || 'Unable to load assignments.');
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
      loadAssignments();
    }
  }, [user?.token]);

  // Extract available subjects
  const availableSubjects = useMemo(() => {
    const subs = new Set(assignmentsList.map(a => a.subject).filter(Boolean));
    return ['ALL', ...Array.from(subs)];
  }, [assignmentsList]);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    return assignmentsList.filter(a => {
      const stat = (a.status || 'ACTIVE').toUpperCase();
      let statusMatch = true;
      if (selectedStatus === 'ACTIVE') {
        statusMatch = stat !== 'CLOSED' && stat !== 'ARCHIVED';
      } else if (selectedStatus === 'CLOSED') {
        statusMatch = stat === 'CLOSED' || stat === 'ARCHIVED';
      }

      const subMatch = selectedSubject === 'ALL' || (a.subject || 'IT/ITeS') === selectedSubject;
      const q = searchQuery.toLowerCase().trim();
      const textMatch = !q ||
        (a.title || '').toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q) ||
        (a.subject || '').toLowerCase().includes(q);

      return statusMatch && subMatch && textMatch;
    });
  }, [assignmentsList, selectedStatus, selectedSubject, searchQuery]);

  const getStatusBadge = (status) => {
    const s = (status || 'ACTIVE').toUpperCase();
    if (s === 'CLOSED' || s === 'COMPLETED') {
      return { color: '#64748b', bg: '#f1f5f9', label: 'Closed' };
    }
    return { color: '#0284c7', bg: '#eff6ff', label: 'Active' };
  };

  if (loading) {
    return (
      <div className="assignments-skeleton-wrap animate-fade-in">
        <div className="card skeleton" style={{ height: '120px', marginBottom: '16px', borderRadius: '16px' }} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: '16px' }}>
          <div className="card skeleton" style={{ height: '140px', borderRadius: '14px' }} />
          <div className="card skeleton" style={{ height: '140px', borderRadius: '14px' }} />
          <div className="card skeleton" style={{ height: '140px', borderRadius: '14px' }} />
        </div>
      </div>
    );
  }

  if (error && assignmentsList.length === 0) {
    return (
      <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '16px' }}>
        <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
          Unable to Load Assignments
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
        <button type="button" className="btn-primary" onClick={() => loadAssignments(true)}>
          <RefreshCw size={15} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="student-assignments-container animate-fade-in">
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
          onClick={() => loadAssignments(true)}
          disabled={refreshing}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
        >
          <RefreshCw size={14} className={refreshing ? 'spinner' : ''} />
          <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Hero Header Banner */}
      <div
        className="card assignments-hero-banner"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: '#ffffff',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '16px',
          boxShadow: '0 8px 20px rgba(30, 58, 138, 0.22)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                HOMEWORK & PROJECTS
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: '#ffffff', color: '#1e3a8a', padding: '2px 8px', borderRadius: '6px' }}>
                CLASS {studentClass}
              </span>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '2px 0 4px 0' }}>
              Class Tasks & Subject Assignments
            </h1>
            <p style={{ fontSize: '0.85rem', opacity: 0.92, margin: 0 }}>
              Assigned tasks, submission due dates, and learning projects for Class {studentClass}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 }}>
              {filteredAssignments.length}
            </div>
            <div style={{ fontSize: '0.8125rem', opacity: 0.9, marginTop: '2px' }}>
              Assignments Available
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="card" style={{ padding: '14px 16px', borderRadius: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Status Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {STATUS_TABS.map(t => {
              const isSelected = selectedStatus === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSelectedStatus(t.key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: isSelected ? '#1e3a8a' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#475569',
                    border: isSelected ? 'none' : '1px solid #e2e8f0',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Search and Subject Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            {availableSubjects.length > 2 && (
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
                {availableSubjects.map(sub => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubject(sub)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: selectedSubject === sub ? '#0f172a' : '#f1f5f9',
                      color: selectedSubject === sub ? '#ffffff' : '#475569',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 34px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8125rem'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Assignments Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="card empty-state" style={{ padding: '36px 0', textAlign: 'center', borderRadius: '16px' }}>
          <FileText size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            {searchQuery ? 'No matching assignments found' : 'No assignments currently assigned'}
          </h4>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '4px' }}>
            {searchQuery ? 'Try searching with different terms.' : 'Teacher will post assignments and homework here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssignments.map((asg) => {
            const badge = getStatusBadge(asg.status);

            return (
              <div
                key={asg.assignmentId}
                className="card"
                onClick={() => setSelectedAssignment(asg)}
                role="button"
                tabIndex={0}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                    {asg.dueDate && (
                      <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={12} /> Due {asg.dueDate}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '2px 0 6px 0', lineHeight: 1.3 }}>
                    {asg.title}
                  </h3>

                  <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {asg.description || 'No detailed instructions provided.'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>Subject: <strong>{asg.subject || 'IT/ITeS'}</strong></span>
                  <span style={{ color: '#1e3a8a', fontWeight: 700 }}>View Details →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignment Details Modal */}
      {selectedAssignment && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="asg-modal-title">
          <div className="modal-content card" style={{ maxWidth: '480px', width: '100%', position: 'relative', borderRadius: '16px', padding: '24px' }}>
            <button
              type="button"
              onClick={() => setSelectedAssignment(null)}
              className="modal-close-btn"
              aria-label="Close modal"
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: getStatusBadge(selectedAssignment.status).bg,
                  color: getStatusBadge(selectedAssignment.status).color
                }}
              >
                {getStatusBadge(selectedAssignment.status).label}
              </span>
              {selectedAssignment.dueDate && (
                <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
                  Due: {selectedAssignment.dueDate}
                </span>
              )}
            </div>

            <h2 id="asg-modal-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 12px 0' }}>
              {selectedAssignment.title}
            </h2>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', fontSize: '0.8125rem', marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div>Class: <strong>{selectedAssignment.class || studentClass} ({selectedAssignment.section || 'A'})</strong></div>
              <div>Subject: <strong>{selectedAssignment.subject || 'IT/ITeS'}</strong></div>
              <div>Assigned: <strong>{selectedAssignment.assignedDate || selectedAssignment.createdAt || 'Recent'}</strong></div>
              {selectedAssignment.maxScore && (
                <div>Max Marks: <strong>{selectedAssignment.maxScore}</strong></div>
              )}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Instructions & Details
              </div>
              <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {selectedAssignment.description || 'No detailed instructions logged.'}
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSelectedAssignment(null)}
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
