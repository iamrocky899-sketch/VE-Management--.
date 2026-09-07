import React from 'react';
import { useAuth } from '../state/AuthContext';
import ChildSelector from '../components/ChildSelector';
import { Calendar, Laptop, Sparkles, BookOpen, Clock, CheckCircle2, User } from 'lucide-react';

export default function ActivitiesPage() {
  const { activeChild, t } = useAuth();
  const student = activeChild?.student || {};

  const activities = [
    {
      id: 'ACT_1',
      title: 'Vocational IT Practical — Web Document Formatting',
      date: '28 Aug 2026',
      time: '09:30 AM',
      category: t('computerLab'),
      class: student.class || '9',
      group: t('today'),
      description: 'Hands-on practical session on HTML table formatting, layout structures, and style sheets in the computer laboratory.',
      status: t('completed')
    },
    {
      id: 'ACT_2',
      title: 'Vocational Workshop on Digital Workplace Skills',
      date: '02 Sep 2026',
      time: '11:00 AM',
      category: t('workshop'),
      class: student.class || '9',
      group: t('upcoming'),
      description: 'Interactive demonstration on workplace communication, data entry, and digital productivity tools.',
      status: t('upcoming')
    },
    {
      id: 'ACT_3',
      title: 'Guest Lecture by IT Industry Professional',
      date: '10 Sep 2026',
      time: '01:30 PM',
      category: t('guestLecture'),
      class: student.class || '9',
      group: t('upcoming'),
      description: 'Career opportunities and practical vocational avenues in Information Technology & Services across Assam.',
      status: t('upcoming')
    },
    {
      id: 'ACT_4',
      title: 'Hardware & Networking Diagnostic Lab',
      date: '18 Aug 2026',
      time: '10:00 AM',
      category: t('computerLab'),
      class: student.class || '9',
      group: t('earlier'),
      description: 'Identification of computer peripherals, cable crimping, and basic hardware troubleshooting.',
      status: t('completed')
    }
  ];

  return (
    <div className="animate-fade-in">
      <ChildSelector />

      <div className="card" style={{
        background: 'linear-gradient(135deg, #0d9488, #0f766e)',
        color: '#fff',
        border: 'none',
        padding: '20px',
        boxShadow: '0 8px 20px rgba(13, 148, 136, 0.22)',
        marginBottom: '14px'
      }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9, fontWeight: '700' }}>
          {t('session')}
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '3px 0' }}>{t('activitiesTitle')}</h1>
        <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>
          {t('activitiesSubtitle')} • {t('class')} {student.class}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activities.map((act) => (
          <div key={act.id} className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-teal">{act.category}</span>
                <span className="badge badge-gray">{t('class')} {act.class}</span>
              </div>
              <span className={`badge ${act.status === t('completed') ? 'badge-green' : 'badge-amber'}`}>
                {act.status}
              </span>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
              {act.title}
            </h3>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
              {act.description}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '10px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} color="var(--primary)" /> {act.date}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} color="var(--primary)" /> {act.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
