import React from 'react';
import { useAuth } from '../state/AuthContext';
import { Phone, MessageSquare, Mail, MapPin, School, User, AlertTriangle } from 'lucide-react';

export default function ContactPage() {
  const { dashboardData, activeChild, t } = useAuth();
  const teacher = activeChild?.classTeacher || dashboardData?.schoolContacts?.teachers?.[0] || {
    teacherName: "Class In-Charge",
    mobile: "9876543210",
    whatsapp: "9876543210",
    email: "teacher.it@ghss.ac.in"
  };

  const school = dashboardData?.schoolContacts?.school || {
    schoolName: "Gameri Higher Secondary School",
    principalName: "Sanjiv Gogoi",
    address: "Gamiri, P.O. Gamiri, Biswanath District, Assam – 784172",
    mobile: "9876543210",
    email: "principal.gameri@ghss.ac.in"
  };

  return (
    <div className="animate-fade-in">
      <div className="card" style={{
        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
        color: '#fff',
        border: 'none',
        padding: '20px',
        boxShadow: '0 8px 20px rgba(2, 132, 199, 0.22)',
        marginBottom: '14px'
      }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9, fontWeight: '700' }}>
          {t('schoolName')}
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '3px 0' }}>{t('contactsTitle')}</h1>
        <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>
          {t('contactsSubtitle')}
        </p>
      </div>

      {/* Class Teacher Section */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <User size={18} color="var(--primary)" />
            <span>{t('classTeacher')}</span>
          </div>
          <span className="badge badge-blue">Class In-Charge</span>
        </div>

        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
          Available for academic discussions, attendance clarifications, and student progress queries during school hours (09:00 AM – 03:30 PM).
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
          <a
            href={`https://wa.me/91${teacher.whatsapp || teacher.mobile || '9876543210'}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-green-light)',
              color: 'var(--accent-green-text)',
              fontWeight: '700',
              fontSize: '0.84rem',
              minHeight: '44px'
            }}>
              <MessageSquare size={16} />
              <span>{t('whatsappTeacher')}</span>
            </div>
          </a>

          <a
            href={`tel:+91${teacher.mobile || '9876543210'}`}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)',
              color: 'var(--primary-text)',
              fontWeight: '700',
              fontSize: '0.84rem',
              minHeight: '44px'
            }}>
              <Phone size={16} />
              <span>{t('callTeacher')}</span>
            </div>
          </a>
        </div>
      </div>

      {/* Principal Section */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <School size={18} color="var(--primary)" />
            <span>{t('principalOffice')}</span>
          </div>
          <span className="badge badge-purple">Head of Institution</span>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
            {school.principalName || t('principalName')}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Principal, {t('schoolName')}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
          <a
            href={`tel:+91${school.mobile || '9876543210'}`}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card-muted)',
              color: 'var(--text-primary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              border: '1px solid var(--border-color)',
              minHeight: '44px'
            }}>
              <Phone size={16} />
              <span>{t('callPrincipal')}</span>
            </div>
          </a>

          <a
            href={`mailto:${school.email || 'principal.gameri@ghss.ac.in'}`}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card-muted)',
              color: 'var(--text-primary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              border: '1px solid var(--border-color)',
              minHeight: '44px'
            }}>
              <Mail size={16} />
              <span>{t('emailPrincipal')}</span>
            </div>
          </a>
        </div>
      </div>

      {/* School Campus & Location */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <MapPin size={18} color="var(--primary)" />
            <span>{t('schoolCampus')}</span>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>
          <strong>{t('schoolName')}</strong><br />
          {school.address || "Gamiri, P.O. Gamiri, Biswanath District, Assam – 784172"}<br />
          Office Hours: Monday – Saturday (09:00 AM to 04:00 PM)
        </div>

        <div>
          <a
            href="https://maps.google.com/?q=Gameri+Higher+Secondary+School+Gamiri+Assam"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <button className="btn-secondary" style={{ fontSize: '0.82rem' }}>
              <MapPin size={14} /> {t('openInMaps')}
            </button>
          </a>
        </div>
      </div>

      {/* Emergency Helpline */}
      <div className="card" style={{ background: 'var(--accent-rose-light)', borderColor: '#fecdd3', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={24} color="var(--accent-rose-text)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--accent-rose-text)' }}>
              {t('emergencyHelpline')}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-rose-text)', marginTop: '2px' }}>
              {t('emergencyDesc')} <strong>+91 98765 43210</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
