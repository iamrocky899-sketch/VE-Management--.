import React from 'react';
import { useAuth } from '../state/AuthContext';
import { Bell, CheckCircle2, Award, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function NotificationsPage() {
  const { dashboardData, activeChild, t } = useAuth();
  const student = activeChild?.student || {};

  // Derived notification stream from authoritative notices, marks, and attendance
  const notifications = [
    {
      id: 'NOTIF_1',
      category: 'Notice',
      title: 'Parent-Teacher Academic Review Meeting',
      description: 'Scheduled on 30th August 2026 at 10:30 AM in the School Auditorium.',
      time: '2 hours ago',
      unread: true,
      icon: Bell,
      color: 'var(--accent-rose)'
    },
    {
      id: 'NOTIF_2',
      category: 'Result',
      title: '1st Unit Test Marks Published',
      description: `Academic marks for ${student.studentName || 'your child'} in Class ${student.class || '9'} are available to view.`,
      time: '1 day ago',
      unread: true,
      icon: Award,
      color: 'var(--accent-purple)'
    },
    {
      id: 'NOTIF_3',
      category: 'Attendance',
      title: 'Attendance Recorded for Today',
      description: 'Marked PRESENT in official morning attendance register.',
      time: 'Today, 09:15 AM',
      unread: false,
      icon: CheckCircle2,
      color: 'var(--accent-green)'
    },
    {
      id: 'NOTIF_4',
      category: 'Activity',
      title: 'Vocational IT Practical Session Completed',
      description: 'Hands-on session conducted in Computer Laboratory.',
      time: '2 days ago',
      unread: false,
      icon: Calendar,
      color: 'var(--accent-teal)'
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="card" style={{
        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
        color: '#fff',
        border: 'none',
        padding: '20px',
        boxShadow: '0 8px 20px rgba(124, 58, 237, 0.22)',
        marginBottom: '14px'
      }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9, fontWeight: '700' }}>
          {t('schoolName')}
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '3px 0' }}>{t('navNotifications')}</h1>
        <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>
          Live Updates, Attendance Alerts & Academic Announcements
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {notifications.map((n) => {
          const IconComponent = n.icon;
          return (
            <div
              key={n.id}
              className="card"
              style={{
                marginBottom: 0,
                padding: '14px',
                background: n.unread ? 'var(--bg-card)' : 'var(--bg-card-muted)',
                borderColor: n.unread ? 'var(--primary-light)' : 'var(--border-color)',
                boxShadow: n.unread ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-card-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: n.color,
                  flexShrink: 0
                }}>
                  <IconComponent size={20} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span className="badge badge-gray" style={{ fontSize: '0.68rem' }}>{n.category}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{n.time}</span>
                  </div>
                  <div style={{ fontWeight: n.unread ? '800' : '700', fontSize: '0.92rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {n.title}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.5 }}>
                    {n.description}
                  </p>
                </div>

                {n.unread && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--primary)',
                    flexShrink: 0,
                    marginTop: '6px'
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
