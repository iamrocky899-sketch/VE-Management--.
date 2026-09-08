import React, { useState, useEffect } from 'react';
import { useAuth } from '../../state/AuthContext';
import { ApiService, resolveStudentGroup } from '../../api/client';
import {
  Users, User, Phone, Mail, MapPin, Calendar,
  ShieldCheck, KeyRound, LogOut, RefreshCw, AlertCircle,
  Sparkles, CheckCircle2, BookOpen, Award, Bell, Activity,
  ArrowRight, School, MessageCircle, HeartHandshake, Shield, ExternalLink
} from 'lucide-react';

export default function ParentProfile({ setActivePage, setIsChangePasswordOpen }) {
  const { user, logout, switchChild, updateChildren, handleSessionRevocation } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  const fetchProfile = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Parent profile strictly resolves own session token and linked children
      const res = await ApiService.getParentProfile(user?.token);

      if (res && res.success && res.data) {
        setProfileData(res.data);
        if (res.data.children && res.data.children.length > 0) {
          updateChildren(res.data.children);
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
        setError(res?.error?.message || 'Unable to load parent profile details.');
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
      fetchProfile();
    }
  }, [user?.token]);

  // Generate clean initials avatar (safe photo fallback)
  const getInitials = (name) => {
    if (!name) return 'PR';
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Safe phone cleaning for contact links
  const cleanPhone = (phoneStr) => {
    if (!phoneStr) return '';
    return String(phoneStr).replace(/\D/g, '');
  };

  if (loading) {
    return (
      <div className="profile-skeleton-wrap animate-fade-in" role="status" aria-label="Loading parent profile">
        {/* Hero Card Skeleton */}
        <div className="card skeleton" style={{ height: '170px', marginBottom: '20px', borderRadius: '20px' }} />

        {/* Info Grid Skeleton */}
        <div className="card skeleton" style={{ height: '160px', marginBottom: '20px', borderRadius: '16px' }} />

        {/* Children Cards Skeleton */}
        <div className="card skeleton" style={{ height: '240px', marginBottom: '20px', borderRadius: '16px' }} />

        {/* Quick Links Skeleton */}
        <div className="card skeleton" style={{ height: '140px', borderRadius: '16px' }} />
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="card animate-fade-in" role="alert" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '20px' }}>
        <AlertCircle size={44} color="var(--accent-rose)" style={{ margin: '0 auto 16px auto' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Unable to Load Parent Profile
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px auto' }}>
          {error}
        </p>
        <button
          type="button"
          onClick={() => fetchProfile(true)}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
        >
          <RefreshCw size={16} />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const parent = profileData?.parent || {};
  const children = profileData?.children || [];

  const rawPhone = parent.mobile || user?.identifier || '';
  const cleanedPhone = cleanPhone(rawPhone);

  const handleChildNavigate = (childId, targetPage = 'dashboard') => {
    switchChild(childId);
    setActivePage(targetPage);
  };

  return (
    <div className="parent-profile-view animate-fade-in">
      {/* 1. Header & Hero Profile Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 60%, #0ea5e9 100%)',
          color: '#ffffff',
          padding: '24px 20px',
          borderRadius: '20px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        {/* Safe Avatar (Initials based) */}
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.22)',
            border: '3px solid rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.9rem',
            fontWeight: 900,
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
            flexShrink: 0,
            margin: '0 auto 16px auto'
          }}
        >
          {getInitials(parent.parentName)}
        </div>

        {/* Parent Name and Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', maxWidth: '100%' }}>
          <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.55rem)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0, wordBreak: 'break-word', textAlign: 'center' }}>
            {parent.parentName || 'Parent / Guardian'}
          </h1>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(255, 255, 255, 0.22)',
              color: '#ffffff',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 700,
              backdropFilter: 'blur(4px)'
            }}
          >
            <CheckCircle2 size={12} />
            <span>{parent.status || 'Active'}</span>
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.92)', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', textAlign: 'center' }}>
          <School size={14} />
          <span>Gameri Higher Secondary School, Gamiri • Parent Portal</span>
        </p>

        {/* Meta pills centered */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '16px', maxWidth: '100%' }}>
          <span style={{ background: 'rgba(255, 255, 255, 0.18)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
            Mobile: +91 {rawPhone || 'N/A'}
          </span>
          <span style={{ background: 'rgba(255, 255, 255, 0.18)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
            {children.length} Enrolled {children.length === 1 ? 'Child' : 'Children'}
          </span>
        </div>

        {/* Controls centered */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => fetchProfile(true)}
            disabled={refreshing}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
            title="Refresh profile details"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Parent Contact & Account Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: '20px' }}>
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <User size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Parent & Contact Information
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Parent Name
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {parent.parentName || 'Parent / Guardian'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Registered Mobile Number
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {rawPhone ? `+91 ${rawPhone}` : 'Not Provided'}
              </div>
              {cleanedPhone && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <a
                    href={`tel:${cleanedPhone}`}
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '4px 8px', minHeight: '32px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Phone size={12} />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/91${cleanedPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '4px 8px', minHeight: '32px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', borderColor: '#bbf7d0' }}
                  >
                    <MessageCircle size={12} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <School size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Portal Authorization
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Access Role
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)' }}>
                PARENT / GUARDIAN
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Account Status
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-green-text)' }}>
                {parent.status || 'Active'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Institution
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Gameri HSS, Gamiri
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                School Code
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                GAMERI-HSS-001
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. My Children Section (Strictly Authorized via ParentStudentLinks) */}
      <div className="card" style={{ padding: '20px 22px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              My Children ({children.length})
            </h2>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Authorized Student Links
          </span>
        </div>

        {children.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
            <p style={{ fontSize: '0.9rem', margin: 0 }}>
              No linked children found for this parent account. Please contact the school administration.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {children.map((child, index) => {
              const childInitials = getInitials(child.studentName);
              return (
                <div
                  key={child.studentId || index}
                  style={{
                    padding: '16px 18px',
                    background: 'var(--bg-card-muted)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          flexShrink: 0
                        }}
                      >
                        {childInitials}
                      </div>

                      <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {child.studentName || 'Student'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px', alignItems: 'center' }}>
                          <span>Class {child.class || '9'} (Sec {child.section || 'N/A'})</span>
                          <span>•</span>
                          <span>Roll No: {child.rollNo || 'N/A'}</span>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: (child.group && child.group !== 'Group Not Assigned') ? '#eff6ff' : '#f8fafc', color: (child.group && child.group !== 'Group Not Assigned') ? '#1d4ed8' : '#64748b', border: (child.group && child.group !== 'Group Not Assigned') ? '1px solid #bfdbfe' : '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.76rem' }}>
                            <Users size={12} />
                            <span>Student Group: <strong>{resolveStudentGroup(child)}</strong></span>
                          </span>
                          <span>•</span>
                          <span>ID: {child.studentId}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChildNavigate(child.studentId, 'dashboard')}
                      className="btn-primary"
                      style={{ fontSize: '0.82rem', padding: '6px 14px', minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>View Dashboard</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  {/* Child Academic Shortcuts */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
                    <button
                      type="button"
                      onClick={() => handleChildNavigate(child.studentId, 'attendance')}
                      className="btn-secondary"
                      style={{ padding: '6px 8px', minHeight: '38px', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <CheckCircle2 size={13} color="var(--primary)" />
                      <span>Attendance</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChildNavigate(child.studentId, 'marks')}
                      className="btn-secondary"
                      style={{ padding: '6px 8px', minHeight: '38px', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Award size={13} color="var(--accent-amber)" />
                      <span>Marks</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChildNavigate(child.studentId, 'materials')}
                      className="btn-secondary"
                      style={{ padding: '6px 8px', minHeight: '38px', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <BookOpen size={13} color="var(--accent-teal)" />
                      <span>Materials</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChildNavigate(child.studentId, 'assignments')}
                      className="btn-secondary"
                      style={{ padding: '6px 8px', minHeight: '38px', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <BookOpen size={13} color="var(--accent-purple)" />
                      <span>Assignments</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChildNavigate(child.studentId, 'activities')}
                      className="btn-secondary"
                      style={{ padding: '6px 8px', minHeight: '38px', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Activity size={13} color="var(--accent-green)" />
                      <span>Activities</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChildNavigate(child.studentId, 'notices')}
                      className="btn-secondary"
                      style={{ padding: '6px 8px', minHeight: '38px', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Bell size={13} color="var(--accent-rose)" />
                      <span>Notices</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChildNavigate(child.studentId, 'calendar')}
                      className="btn-secondary"
                      style={{ padding: '6px 8px', minHeight: '38px', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Calendar size={13} color="var(--primary)" />
                      <span>Calendar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Quick Portal Links Card */}
      <div className="card" style={{ padding: '20px 22px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Sparkles size={18} color="var(--primary)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Parent Portal Shortcuts
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setActivePage('dashboard')}
            className="btn-secondary"
            style={{ padding: '10px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', borderRadius: '12px' }}
          >
            <School size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('attendance')}
            className="btn-secondary"
            style={{ padding: '10px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', borderRadius: '12px' }}
          >
            <CheckCircle2 size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Attendance</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('marks')}
            className="btn-secondary"
            style={{ padding: '10px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', borderRadius: '12px' }}
          >
            <Award size={16} color="var(--accent-amber)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Report Card</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('notices')}
            className="btn-secondary"
            style={{ padding: '10px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', borderRadius: '12px' }}
          >
            <Bell size={16} color="var(--accent-rose)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Notices</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('calendar')}
            className="btn-secondary"
            style={{ padding: '10px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', borderRadius: '12px' }}
          >
            <Calendar size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('contacts')}
            className="btn-secondary"
            style={{ padding: '10px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', borderRadius: '12px' }}
          >
            <Phone size={16} color="var(--accent-teal)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>School Contacts</span>
          </button>
        </div>
      </div>

      {/* 5. Account Security & Controls Card */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <ShieldCheck size={18} color="var(--primary)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Account Security & Controls
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Parent Account Credentials
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Update your account password securely at any time.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.84rem' }}
            >
              <KeyRound size={14} />
              <span>Change Password</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.84rem', color: 'var(--accent-rose-text)', borderColor: 'var(--accent-rose-light)' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
