import React, { useState } from 'react';
import { useAuth } from '../state/AuthContext';
import { Calendar, BookOpen, Clock, ChevronRight, Info, Award } from 'lucide-react';

export default function CalendarPage() {
  const { t } = useAuth();
  const [activeTab, setActiveTab] = useState('holidays');

  const holidays = [
    { date: "14 Apr 2026", title: "Bohag Bihu / Rongali Bihu", type: "HOLIDAY", days: 3 },
    { date: "01 May 2026", title: "May Day (Labour Day)", type: "HOLIDAY", days: 1 },
    { date: "27 May 2026", title: "Buddha Purnima", type: "HOLIDAY", days: 1 },
    { date: "01 Jul 2026", title: "Summer Vacation (01 Jul – 31 Jul)", type: "VACATION", days: 31 },
    { date: "15 Aug 2026", title: "Independence Day", type: "OBSERVATIONAL", days: 1 },
    { date: "26 Aug 2026", title: "Janmashtami", type: "HOLIDAY", days: 1 },
    { date: "05 Sep 2026", title: "Tithi of Srimanta Sankardeva", type: "HOLIDAY", days: 1 },
    { date: "02 Oct 2026", title: "Mahatma Gandhi Birthday", type: "HOLIDAY", days: 1 },
    { date: "19 Oct 2026", title: "Durga Puja & Bijoya Dashami", type: "HOLIDAY", days: 4 },
    { date: "09 Nov 2026", title: "Kali Puja & Diwali", type: "HOLIDAY", days: 2 },
    { date: "24 Nov 2026", title: "Lachit Diwas", type: "HOLIDAY", days: 1 },
    { date: "02 Dec 2026", title: "Asom Diwas (Sukapha Diwas)", type: "HOLIDAY", days: 1 },
    { date: "25 Dec 2026", title: "Christmas Day", type: "HOLIDAY", days: 1 },
    { date: "14 Jan 2027", title: "Magh Bihu / Bhogali Bihu", type: "HOLIDAY", days: 3 },
    { date: "26 Jan 2027", title: "Republic Day", type: "OBSERVATIONAL", days: 1 },
    { date: "11 Feb 2027", title: "Saraswati Puja", type: "OBSERVATIONAL", days: 1 },
    { date: "23 Feb 2027", title: "Ali-Aye-Ligang", type: "HOLIDAY", days: 1 }
  ];

  const exams = [
    { date: "July 2026", title: "1st Unit Test", description: "Theory (40) + Practical (10) for Class IX–XII" },
    { date: "September 2026", title: "Half Yearly Examination", description: "Official ASSEB Mid-Term Comprehensive Evaluation" },
    { date: "November 2026", title: "2nd Unit Test", description: "Curriculum Progression Assessment" },
    { date: "February 2027", title: "Annual / Pre-Board Examination", description: "Final Year-End Board & School Evaluation" }
  ];

  return (
    <div className="animate-fade-in">
      <div className="card" style={{
        background: 'linear-gradient(135deg, #0284c7, #0d9488)',
        color: '#fff',
        border: 'none',
        padding: '20px',
        boxShadow: '0 8px 20px rgba(2, 132, 199, 0.22)',
        marginBottom: '14px'
      }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9, fontWeight: '700' }}>
          {t('session')}
        </div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '3px 0' }}>{t('calendarTitle')}</h1>
        <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>
          {t('totalWorkingDaysYear')}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <button
          className={`btn-secondary ${activeTab === 'holidays' ? 'active' : ''}`}
          onClick={() => setActiveTab('holidays')}
          aria-label="View Holidays & Vacations"
          style={{
            flex: 1,
            justifyContent: 'center',
            background: activeTab === 'holidays' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'holidays' ? '#fff' : 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            minHeight: '40px'
          }}
        >
          {t('holidaysVacations')} ({holidays.length})
        </button>
        <button
          className={`btn-secondary ${activeTab === 'exams' ? 'active' : ''}`}
          onClick={() => setActiveTab('exams')}
          aria-label="View Academic Examinations"
          style={{
            flex: 1,
            justifyContent: 'center',
            background: activeTab === 'exams' ? 'var(--primary)' : 'var(--bg-card)',
            color: activeTab === 'exams' ? '#fff' : 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            minHeight: '40px'
          }}
        >
          {t('academicExams')} ({exams.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'holidays' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {holidays.map((h, i) => (
            <div key={i} className="card" style={{ marginBottom: 0, padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: h.type === 'VACATION' ? 'var(--accent-teal-light)' : 'var(--accent-amber-light)',
                    color: h.type === 'VACATION' ? 'var(--accent-teal-text)' : 'var(--accent-amber-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '1rem',
                    flexShrink: 0
                  }}>
                    {h.type === 'VACATION' ? '🌴' : '🏖️'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{h.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.date}</div>
                  </div>
                </div>

                <span className={`badge ${h.type === 'VACATION' ? 'badge-teal' : 'badge-amber'}`}>
                  {h.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'exams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {exams.map((ex, i) => (
            <div key={i} className="card" style={{ marginBottom: 0, padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--primary-text)' }}>{ex.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{ex.description}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>Target: {ex.date}</div>
                </div>
                <span className="badge badge-purple">Official ASSEB</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
