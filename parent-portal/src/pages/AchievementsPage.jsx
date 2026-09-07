import React from 'react';
import { useAuth } from '../state/AuthContext';
import ChildSelector from '../components/ChildSelector';
import { Award, Trophy, Star, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';

export default function AchievementsPage() {
  const { activeChild, t } = useAuth();
  const student = activeChild?.student || {};

  const achievements = [
    {
      id: 'ACH_1',
      title: 'First Place in Inter-School IT Skills Exhibition',
      date: '15 Aug 2026',
      category: 'Vocational Excellence',
      awardedBy: 'District Education Office, Biswanath',
      description: 'Demonstrated outstanding software documentation and website structuring skills representing Gameri Higher Secondary School.'
    },
    {
      id: 'ACH_2',
      title: '100% Attendance Award (1st Quarter)',
      date: '31 Jul 2026',
      category: 'Attendance Regularity',
      awardedBy: 'Principal Sanjiv Gogoi',
      description: 'Recognized for zero unexcused absences during the opening academic quarter of Session 2026–27.'
    }
  ];

  return (
    <div className="animate-fade-in">
      <ChildSelector />

      <div className="card" style={{
        background: 'linear-gradient(135deg, #d97706, #b45309)',
        color: '#fff',
        border: 'none',
        padding: '20px',
        boxShadow: '0 8px 20px rgba(217, 119, 6, 0.22)',
        marginBottom: '14px'
      }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9, fontWeight: '700' }}>
          {t('schoolName')}
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '3px 0' }}>{t('achievementsTitle')}</h1>
        <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>
          Honors, Awards & Student Accolades • {student.studentName}
        </p>
      </div>

      {achievements.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {achievements.map((ach) => (
            <div key={ach.id} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="badge badge-amber">{ach.category}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ach.date}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Trophy size={18} color="var(--accent-amber)" />
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {ach.title}
                </h3>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>
                {ach.description}
              </p>

              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '8px'
              }}>
                Awarded by: <strong>{ach.awardedBy}</strong>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Trophy size={28} />
          </div>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {t('noAchievementsRecorded')}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto' }}>
            Official awards and certificates will appear here when recorded by the school.
          </p>
        </div>
      )}
    </div>
  );
}
