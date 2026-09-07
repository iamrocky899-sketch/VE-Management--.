import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';
import { ApiService } from '../../api/client';
import {
  Phone, Mail, MessageCircle, User, School, Search,
  Filter, RefreshCw, AlertCircle, Sparkles, CheckCircle2,
  GraduationCap, Award, MapPin, Building2, ShieldCheck,
  ChevronRight, Users
} from 'lucide-react';

export default function ParentContacts({ setActivePage }) {
  const { user, selectedChildId, switchChild, handleSessionRevocation } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [contactsData, setContactsData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  const fetchContacts = async (targetChildId = selectedChildId, isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Scoped parent contacts request passing selected authorized child
      const res = await ApiService.getParentContacts(user?.token, targetChildId);

      if (res && res.success && res.data) {
        setContactsData(res.data);
      } else {
        const errCode = res?.error?.code;
        if (errCode === 'SESSION_EXPIRED') {
          handleSessionRevocation('SESSION_EXPIRED');
          return;
        } else if (errCode === 'ACCOUNT_DEACTIVATED') {
          handleSessionRevocation('ACCOUNT_DEACTIVATED');
          return;
        }
        setError(res?.error?.message || 'Unable to load school and teacher contacts.');
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
      fetchContacts(selectedChildId);
    }
  }, [user?.token, selectedChildId]);

  const handleSelectChild = (childId) => {
    if (childId === selectedChildId) return;
    setContactsData(null); // Clear previous child state to ensure zero cross-child mixing
    switchChild(childId);
    fetchContacts(childId);
  };

  // Safe phone cleaning for URL actions
  const cleanPhone = (phoneStr) => {
    if (!phoneStr) return '';
    return String(phoneStr).replace(/\D/g, '');
  };

  // Safe initials avatar generator
  const getInitials = (name) => {
    if (!name) return 'PC';
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const selectedChild = contactsData?.selectedChild || null;
  const children = contactsData?.children || [];
  const teachers = contactsData?.teachers || [];
  const principal = contactsData?.principal || null;
  const schoolContacts = contactsData?.schoolContacts || [];

  // Filtered and searched contacts
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchSearch =
        !searchQuery ||
        (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.designation && t.designation.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [teachers, searchQuery]);

  const filteredSchool = useMemo(() => {
    return schoolContacts.filter(s => {
      const matchSearch =
        !searchQuery ||
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.designation && s.designation.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [schoolContacts, searchQuery]);

  const matchesPrincipal = useMemo(() => {
    if (!principal) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (principal.name && principal.name.toLowerCase().includes(q)) ||
      (principal.designation && principal.designation.toLowerCase().includes(q)) ||
      (principal.role && principal.role.toLowerCase().includes(q))
    );
  }, [principal, searchQuery]);

  if (loading) {
    return (
      <div className="contacts-skeleton-wrap animate-fade-in" role="status" aria-label="Loading contacts">
        {/* Header Skeleton */}
        <div className="card skeleton" style={{ height: '140px', marginBottom: '20px', borderRadius: '20px' }} />

        {/* Child Selector Skeleton */}
        <div className="card skeleton" style={{ height: '60px', marginBottom: '20px', borderRadius: '16px' }} />

        {/* Contact Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card skeleton" style={{ height: '220px', borderRadius: '16px' }} />
          <div className="card skeleton" style={{ height: '220px', borderRadius: '16px' }} />
          <div className="card skeleton" style={{ height: '220px', borderRadius: '16px' }} />
        </div>
      </div>
    );
  }

  if (error && !contactsData) {
    return (
      <div className="card animate-fade-in" role="alert" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '20px' }}>
        <AlertCircle size={44} color="var(--accent-rose)" style={{ margin: '0 auto 16px auto' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Unable to Load Contacts
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px auto' }}>
          {error}
        </p>
        <button
          type="button"
          onClick={() => fetchContacts(selectedChildId, true)}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
        >
          <RefreshCw size={16} />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const showPrincipal = (activeFilter === 'ALL' || activeFilter === 'PRINCIPAL') && matchesPrincipal;
  const showTeachers = (activeFilter === 'ALL' || activeFilter === 'TEACHERS') && filteredTeachers.length > 0;
  const showSchool = (activeFilter === 'ALL' || activeFilter === 'SCHOOL') && filteredSchool.length > 0;

  const totalResults = (showPrincipal ? 1 : 0) + (showTeachers ? filteredTeachers.length : 0) + (showSchool ? filteredSchool.length : 0);

  return (
    <div className="parent-contacts-view animate-fade-in">
      {/* 1. Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #059669 60%, #10b981 100%)',
          color: '#ffffff',
          padding: '24px 28px',
          borderRadius: '20px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <School size={22} color="#ffffff" />
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                Teacher & School Directory
              </h1>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.92)', margin: 0 }}>
              Gameri Higher Secondary School • Parent Portal
              {selectedChild && ` • Viewing Contacts for ${selectedChild.studentName} (Class ${selectedChild.class || '9'})`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchContacts(selectedChildId, true)}
            disabled={refreshing}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
            title="Refresh directory"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Multi-Child Selector (if parent has multiple children) */}
      {children.length > 1 && (
        <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Users size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Select Child to View Assigned Teachers:
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {children.map(child => {
              const isSelected = String(child.studentId) === String(selectedChild?.studentId);
              return (
                <button
                  key={child.studentId}
                  type="button"
                  onClick={() => handleSelectChild(child.studentId)}
                  className={isSelected ? 'btn-primary' : 'btn-secondary'}
                  style={{
                    padding: '8px 16px',
                    minHeight: '40px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <User size={14} />
                  <span>{child.studentName} (Class {child.class || '9'})</span>
                  {isSelected && <CheckCircle2 size={14} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by teacher name, subject, or designation..."
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem',
                outline: 'none',
                background: 'var(--bg-card-subtle)'
              }}
              aria-label="Search contacts"
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={activeFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.78rem', padding: '6px 14px', minHeight: '36px', borderRadius: '20px' }}
            >
              All Contacts
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('TEACHERS')}
              className={activeFilter === 'TEACHERS' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.78rem', padding: '6px 14px', minHeight: '36px', borderRadius: '20px' }}
            >
              Teachers ({teachers.length})
            </button>

            {principal && (
              <button
                type="button"
                onClick={() => setActiveFilter('PRINCIPAL')}
                className={activeFilter === 'PRINCIPAL' ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: '0.78rem', padding: '6px 14px', minHeight: '36px', borderRadius: '20px' }}
              >
                Principal
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveFilter('SCHOOL')}
              className={activeFilter === 'SCHOOL' ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.78rem', padding: '6px 14px', minHeight: '36px', borderRadius: '20px' }}
            >
              School Office ({schoolContacts.length})
            </button>
          </div>
        </div>
      </div>

      {/* 4. Empty Results State */}
      {totalResults === 0 && (
        <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '20px', marginBottom: '20px' }}>
          <AlertCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            No Matching Contacts Found
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            {searchQuery ? `No contacts match "${searchQuery}". Try a different keyword.` : 'No contacts are currently assigned for this class.'}
          </p>
        </div>
      )}

      {/* 5. Principal / Head of Institution Section */}
      {showPrincipal && principal && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Award size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Head of Institution
            </h2>
          </div>

          <div
            className="card"
            style={{
              padding: '20px 22px',
              border: '2px solid var(--primary-light)',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
              borderRadius: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    fontWeight: 900,
                    flexShrink: 0
                  }}
                >
                  {getInitials(principal.name)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {principal.name}
                    </h3>
                    <span
                      style={{
                        background: 'var(--accent-green-light)',
                        color: 'var(--accent-green-text)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}
                    >
                      {principal.designation || 'Principal'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    Gameri Higher Secondary School, Gamiri
                  </p>
                </div>
              </div>

              {/* Communication Actions */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {principal.mobile && (
                  <>
                    <a
                      href={`tel:${cleanPhone(principal.mobile)}`}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '8px 14px', minHeight: '40px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      aria-label={`Call Principal ${principal.name}`}
                    >
                      <Phone size={14} color="var(--primary)" />
                      <span>Call</span>
                    </a>

                    <a
                      href={`https://wa.me/91${cleanPhone(principal.mobile)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '8px 14px', minHeight: '40px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#16a34a', borderColor: '#bbf7d0' }}
                      aria-label={`WhatsApp Principal ${principal.name}`}
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp</span>
                    </a>
                  </>
                )}

                {principal.email && (
                  <a
                    href={`mailto:${principal.email}`}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '8px 14px', minHeight: '40px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    aria-label={`Email Principal ${principal.name}`}
                  >
                    <Mail size={14} color="var(--accent-purple)" />
                    <span>Email</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Class & Subject Teachers Section */}
      {showTeachers && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <GraduationCap size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Teachers for {selectedChild?.studentName || 'Student'} ({filteredTeachers.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((teacher, index) => {
              const teacherInitials = getInitials(teacher.name);
              const cleanedPhone = cleanPhone(teacher.mobile);

              return (
                <div
                  key={teacher.staffId || index}
                  className="card"
                  style={{
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    borderRadius: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
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
                      {teacherInitials}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                        {teacher.name}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        {teacher.designation || 'Subject Teacher'}
                      </div>

                      {teacher.subject && (
                        <span
                          style={{
                            display: 'inline-block',
                            background: 'var(--primary-light)',
                            color: 'var(--primary-text)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}
                        >
                          {teacher.subject}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Communication Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: cleanedPhone && teacher.email ? '1fr 1fr 1fr' : (cleanedPhone ? '1fr 1fr' : '1fr'), gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                    {cleanedPhone && (
                      <a
                        href={`tel:${cleanedPhone}`}
                        className="btn-secondary"
                        style={{ fontSize: '0.74rem', padding: '6px 8px', minHeight: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        aria-label={`Call ${teacher.name}`}
                      >
                        <Phone size={12} color="var(--primary)" />
                        <span>Call</span>
                      </a>
                    )}

                    {cleanedPhone && (
                      <a
                        href={`https://wa.me/91${cleanedPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ fontSize: '0.74rem', padding: '6px 8px', minHeight: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#16a34a', borderColor: '#bbf7d0' }}
                        aria-label={`WhatsApp ${teacher.name}`}
                      >
                        <MessageCircle size={12} />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {teacher.email && (
                      <a
                        href={`mailto:${teacher.email}`}
                        className="btn-secondary"
                        style={{ fontSize: '0.74rem', padding: '6px 8px', minHeight: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        aria-label={`Email ${teacher.name}`}
                      >
                        <Mail size={12} color="var(--accent-purple)" />
                        <span>Email</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. School Office & Administration Section */}
      {showSchool && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Building2 size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              School Administration & Office
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSchool.map((contact, index) => {
              const cleanedPhone = cleanPhone(contact.mobile);

              return (
                <div
                  key={contact.contactId || index}
                  className="card"
                  style={{ padding: '18px 20px', borderRadius: '16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                        {contact.name}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {contact.designation || contact.category}
                      </div>
                    </div>

                    <span
                      style={{
                        background: 'var(--bg-card-muted)',
                        color: 'var(--text-muted)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}
                    >
                      {contact.category || 'Office'}
                    </span>
                  </div>

                  {contact.address && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                      <MapPin size={13} color="var(--primary)" />
                      <span>{contact.address}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                    {cleanedPhone && (
                      <a
                        href={`tel:${cleanedPhone}`}
                        className="btn-secondary"
                        style={{ fontSize: '0.76rem', padding: '6px 12px', minHeight: '36px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        aria-label={`Call ${contact.name}`}
                      >
                        <Phone size={12} color="var(--primary)" />
                        <span>Call Office</span>
                      </a>
                    )}

                    {cleanedPhone && (
                      <a
                        href={`https://wa.me/91${cleanedPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ fontSize: '0.76rem', padding: '6px 12px', minHeight: '36px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', borderColor: '#bbf7d0' }}
                        aria-label={`WhatsApp ${contact.name}`}
                      >
                        <MessageCircle size={12} />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="btn-secondary"
                        style={{ fontSize: '0.76rem', padding: '6px 12px', minHeight: '36px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        aria-label={`Email ${contact.name}`}
                      >
                        <Mail size={12} color="var(--accent-purple)" />
                        <span>Email</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
