import React, { useState } from 'react';
import { useAuth } from '../state/AuthContext';
import { Bell, Calendar, AlertCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function NoticesPage() {
  const { dashboardData, t } = useAuth();
  const [expandedId, setExpandedId] = useState('NTC_1');

  const notices = dashboardData?.notices?.length > 0 ? dashboardData.notices : [
    {
      id: 'NTC_1',
      title: 'Parent-Teacher Academic Review Meeting (Session 2026–27)',
      body: 'All parents and guardians of Class IX to XII are cordially invited to attend the academic review meeting on 30th August 2026 at 10:30 AM in the School Auditorium. Agenda: 1st Unit Test analysis, vocational practical progress, and attendance regularity.',
      date: '28 Aug 2026',
      priority: 'HIGH',
      author: 'Principal Sanjiv Gogoi'
    },
    {
      id: 'NTC_2',
      title: 'Half Yearly Examination Schedule & Guidelines Announcement',
      body: 'The ASSEB Half Yearly Examinations for all classes will commence in September 2026. Practical examinations for Vocational IT/ITeS will be conducted in advance in the school computer lab according to individual batch schedules.',
      date: '25 Aug 2026',
      priority: 'NORMAL',
      author: 'Academic In-Charge'
    },
    {
      id: 'NTC_3',
      title: 'Independence Day Observance & Flag Hoisting Ceremony',
      body: 'Gameri Higher Secondary School celebrated the 80th Independence Day with patriotic fervor, cultural programs, and student awards.',
      date: '15 Aug 2026',
      priority: 'NORMAL',
      author: 'School Management Committee'
    }
  ];

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="animate-fade-in">
      <div className="card" style={{
        background: 'linear-gradient(135deg, #e11d48, #be123c)',
        color: '#fff',
        border: 'none',
        padding: '20px',
        boxShadow: '0 8px 20px rgba(225, 29, 72, 0.22)',
        marginBottom: '14px'
      }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9, fontWeight: '700' }}>
          {t('schoolName')}
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '3px 0' }}>{t('noticesTitle')}</h1>
        <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>
          Official Announcements & School Circulars
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notices.map((ntc) => {
          const isExpanded = expandedId === ntc.id;
          const isHighPriority = ntc.priority === 'HIGH';

          return (
            <div
              key={ntc.id}
              className="card"
              style={{
                marginBottom: 0,
                borderLeft: isHighPriority ? '4px solid var(--accent-rose)' : '4px solid var(--primary)',
                cursor: 'pointer'
              }}
              onClick={() => toggleExpand(ntc.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className={`badge ${isHighPriority ? 'badge-rose' : 'badge-blue'}`}>
                  {isHighPriority ? t('priorityHigh') : t('priorityNormal')}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {ntc.date}
                </span>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
                {ntc.title}
              </h3>

              <p style={{
                fontSize: '0.84rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '10px',
                display: isExpanded ? 'block' : '-webkit-box',
                WebkitLineClamp: isExpanded ? 'none' : '2',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {ntc.body}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '8px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                <span>{t('issuedBy')}: <strong>{ntc.author || 'School Administration'}</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: '700' }}>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
