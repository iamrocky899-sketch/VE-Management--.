import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../state/AuthContext';
import { ApiService } from '../services/api';
import {
  Bell, Search, ArrowLeft, RefreshCw, X, AlertCircle,
  AlertTriangle, Info, Calendar, ChevronRight, Megaphone, Users
} from 'lucide-react';

const PRIORITY_CONFIG = {
  URGENT: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2', icon: '🔴' },
  IMPORTANT: { label: 'Important', color: '#d97706', bg: '#fffbeb', icon: '📌' },
  NORMAL: { label: 'General', color: '#0284c7', bg: '#eff6ff', icon: '📋' }
};

const PRIORITY_FILTERS = [
  { key: 'ALL', label: 'All Notices' },
  { key: 'URGENT', label: 'Urgent' },
  { key: 'IMPORTANT', label: 'Important' },
  { key: 'NORMAL', label: 'General' }
];

export default function ParentNotices({ setActivePage }) {
  const { user, selectedChildId, switchChild, handleSessionRevocation } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [allNoticesList, setAllNoticesList] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotice, setSelectedNotice] = useState(null);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Fetch Parent Dashboard for children metadata
      const dashRes = await ApiService.getParentDashboard(user?.token);
      if (dashRes && dashRes.success && dashRes.data) {
        setDashboardData(dashRes.data);
      } else if (dashRes?.error?.code === 'SESSION_EXPIRED') {
        handleSessionRevocation('SESSION_EXPIRED');
        return;
      } else if (dashRes?.error?.code === 'ACCOUNT_DEACTIVATED') {
        handleSessionRevocation('ACCOUNT_DEACTIVATED');
        return;
      }

      // 2. Fetch All Notices (server-filtered for PARENT visibility)
      const ntcRes = await ApiService.getNotices(user?.token);
      if (ntcRes && ntcRes.success && ntcRes.data) {
        const notices = ntcRes.data.notices || [];
        notices.sort((a, b) => {
          const priOrder = { URGENT: 0, IMPORTANT: 1, NORMAL: 2 };
          const priA = priOrder[(a.priority || 'NORMAL').toUpperCase()] ?? 2;
          const priB = priOrder[(b.priority || 'NORMAL').toUpperCase()] ?? 2;
          if (priA !== priB) return priA - priB;
          return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
        });
        setAllNoticesList(notices);
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
      loadData();
    }
  }, [user?.token]);

  const childrenSummaries = dashboardData?.children || [];

  // Resolve active selected child safely
  let activeChildSummary = childrenSummaries.find(
    c => String(c.student?.studentId) === String(selectedChildId)
  );
  if (!activeChildSummary && childrenSummaries.length > 0) {
    activeChildSummary = childrenSummaries[0];
  }

  const selectedStudent = activeChildSummary?.student || {
    studentName: 'Child',
    class: '9',
    section: 'A',
    rollNo: '1',
    studentId: 'STU_0'
  };

  // When switching child, clear notice detail
  const handleChildSwitch = (childId) => {
    switchChild(childId);
    setSelectedNotice(null);
    setSearchQuery('');
    setSelectedPriority('ALL');
  };

  // Filter notices for selected child's class
  const childNotices = useMemo(() => {
    const targetClass = String(selectedStudent.class || '9');
    return allNoticesList.filter(n => !n.class || n.class === 'All' || String(n.class) === targetClass);
  }, [allNoticesList, selectedStudent.class]);

  // Apply priority filter and search
  const filteredNotices = useMemo(() => {
    return childNotices.filter(n => {
      const priMatch = selectedPriority === 'ALL' || (n.priority || 'NORMAL').toUpperCase() === selectedPriority;
      const q = searchQuery.toLowerCase().trim();
      const textMatch = !q ||
        (n.title || '').toLowerCase().includes(q) ||
        (n.body || '').toLowerCase().includes(q) ||
        (n.priority || '').toLowerCase().includes(q);
      return priMatch && textMatch;
    });
  }, [childNotices, selectedPriority, searchQuery]);

  const getPriorityConfig = (priority) => {
    return PRIORITY_CONFIG[(priority || 'NORMAL').toUpperCase()] || PRIORITY_CONFIG.NORMAL;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card skeleton" style={{ height: '110px', marginBottom: '16px', borderRadius: '16px' }} />
        <div className="card skeleton" style={{ height: '60px', marginBottom: '12px', borderRadius: '12px' }} />
        <div className="card skeleton" style={{ height: '48px', marginBottom: '12px', borderRadius: '12px' }} />
        {[1, 2, 3].map(i => (
          <div key={i} className="card skeleton" style={{ height: '120px', marginBottom: '12px', borderRadius: '14px' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #e11d48, #be123c)',
        color: '#fff',
        border: 'none',
        padding: '20px',
        boxShadow: '0 8px 20px rgba(225, 29, 72, 0.22)',
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
            onClick={() => loadData(true)}
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
            aria-label="Refresh notices"
          >
            <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={22} />
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Notices & Circulars</h1>
            <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: '2px 0 0 0' }}>
              {selectedStudent.studentName} • Class {selectedStudent.class} • {childNotices.length} notice{childNotices.length !== 1 ? 's' : ''}
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
            onClick={() => loadData(true)}
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
            aria-label="Retry loading notices"
          >
            Retry
          </button>
        </div>
      )}

      {/* Multi-Child Selector */}
      {childrenSummaries.length > 1 && (
        <div className="card" style={{ padding: '12px 16px', marginBottom: '12px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Users size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Select Child
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {childrenSummaries.map(cs => {
              const child = cs.student || {};
              const isActive = String(child.studentId) === String(selectedChildId) ||
                (!selectedChildId && cs === activeChildSummary);
              return (
                <button
                  key={child.studentId}
                  type="button"
                  onClick={() => handleChildSwitch(child.studentId)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: isActive ? '2px solid #1e3a8a' : '1px solid #e2e8f0',
                    background: isActive ? '#1e3a8a' : '#fff',
                    color: isActive ? '#fff' : '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  aria-label={`Select ${child.studentName || 'Child'} (Class ${child.class || '?'})`}
                  aria-pressed={isActive}
                >
                  {child.studentName || 'Child'} — Class {child.class || '?'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '12px' }}>
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search notices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              fontSize: '0.88rem',
              outline: 'none',
              background: '#f8fafc',
              minHeight: '44px',
              boxSizing: 'border-box'
            }}
            aria-label="Search notices by title or content"
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PRIORITY_FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setSelectedPriority(f.key)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: selectedPriority === f.key ? '2px solid #1e3a8a' : '1px solid #e2e8f0',
                background: selectedPriority === f.key ? '#1e3a8a' : '#fff',
                color: selectedPriority === f.key ? '#fff' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              aria-label={`Filter by ${f.label}`}
              aria-pressed={selectedPriority === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notice Cards */}
      {filteredNotices.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Bell size={36} color="#94a3b8" style={{ margin: '0 auto 10px auto', display: 'block' }} />
          <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
            {searchQuery || selectedPriority !== 'ALL' ? 'No matching notices found.' : 'No notices available.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotices.map((notice) => {
            const priCfg = getPriorityConfig(notice.priority);

            return (
              <button
                key={notice.noticeId || notice.id}
                type="button"
                className="card"
                onClick={() => setSelectedNotice(notice)}
                style={{
                  marginBottom: 0,
                  padding: '16px',
                  cursor: 'pointer',
                  borderLeft: `4px solid ${priCfg.color}`,
                  textAlign: 'left',
                  width: '100%',
                  border: '1px solid #e2e8f0',
                  borderLeftWidth: '4px',
                  borderLeftColor: priCfg.color,
                  background: '#fff'
                }}
                aria-label={`View notice: ${notice.title}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    background: priCfg.bg,
                    color: priCfg.color
                  }}>
                    <span aria-hidden="true">{priCfg.icon}</span> {priCfg.label}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> {formatDate(notice.date)}
                  </span>
                </div>

                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px', color: '#1e293b', lineHeight: 1.4 }}>
                  {notice.title}
                </h3>

                <p style={{
                  fontSize: '0.84rem',
                  color: '#64748b',
                  lineHeight: 1.6,
                  marginBottom: '8px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  whiteSpace: 'pre-wrap'
                }}>
                  {notice.body}
                </p>

                {notice.class && notice.class !== 'All' && (
                  <span style={{
                    fontSize: '0.7rem',
                    color: '#64748b',
                    background: '#f1f5f9',
                    padding: '2px 8px',
                    borderRadius: '8px'
                  }}>
                    Class {notice.class}{notice.section ? ` (${notice.section})` : ''}
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <ChevronRight size={16} color="#94a3b8" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Notice Detail Modal */}
      {selectedNotice && (
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
          onClick={() => setSelectedNotice(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notice-detail-title"
        >
          <div
            className="card"
            style={{
              maxWidth: '560px',
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
              onClick={() => setSelectedNotice(null)}
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

            {(() => {
              const priCfg = getPriorityConfig(selectedNotice.priority);
              return (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: '14px',
                      background: priCfg.bg,
                      color: priCfg.color,
                      marginBottom: '10px'
                    }}>
                      <span aria-hidden="true">{priCfg.icon}</span> {priCfg.label} Notice
                    </span>
                  </div>

                  <h2 id="notice-detail-title" style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#1e293b',
                    marginBottom: '12px',
                    lineHeight: 1.4
                  }}>
                    {selectedNotice.title}
                  </h2>

                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '16px',
                    fontSize: '0.8rem',
                    color: '#64748b'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} /> {formatDate(selectedNotice.date)}
                    </span>
                    {selectedNotice.class && selectedNotice.class !== 'All' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Megaphone size={14} /> Class {selectedNotice.class}{selectedNotice.section ? ` (${selectedNotice.section})` : ''}
                      </span>
                    )}
                    {(!selectedNotice.class || selectedNotice.class === 'All') && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Megaphone size={14} /> School-wide
                      </span>
                    )}
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#334155',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                      margin: 0
                    }}>
                      {selectedNotice.body}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedNotice(null)}
                      style={{
                        flex: 1,
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
                      Back to Notices
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedNotice(null); setActivePage('dashboard'); }}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: '#1e3a8a',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#fff',
                        cursor: 'pointer',
                        minHeight: '44px'
                      }}
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
