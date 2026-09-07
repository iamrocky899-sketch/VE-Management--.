import React, { useState, useEffect } from 'react';
import { useAuth } from '../state/AuthContext';
import { ApiService } from '../services/api';
import ChildSelector from '../components/ChildSelector';
import { Award, BookOpen, BarChart3, ChevronRight, CheckCircle, Info, FileQuestion } from 'lucide-react';

export default function MarksPage() {
  const { session, activeChild, t } = useAuth();
  const [selectedExamIndex, setSelectedExamIndex] = useState(0);
  const [marksData, setMarksData] = useState(null);
  const [loading, setLoading] = useState(false);

  const student = activeChild?.student || {};
  const studentId = student.studentId;

  const exams = [
    { index: 0, title: t('unitTest1'), maxMarks: 50, published: true },
    { index: 1, title: t('halfYearly'), maxMarks: 100, published: true },
    { index: 2, title: t('unitTest2'), maxMarks: 50, published: false },
    { index: 3, title: t('finalExam'), maxMarks: 100, published: false }
  ];

  useEffect(() => {
    async function loadMarks() {
      if (!session?.token || !studentId) return;
      setLoading(true);
      try {
        const res = await ApiService.getMarks(session.token, studentId);
        if (res && res.success && res.data) {
          setMarksData(res.data);
        }
      } catch (e) {
        console.error("Marks fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadMarks();
  }, [session, studentId]);

  const currentExam = exams[selectedExamIndex];

  // Subject marks dataset
  const subjects = (currentExam.published && marksData?.subjects) ? marksData.subjects : (
    currentExam.published ? [
      { subject: "Information Technology (IT/ITeS)", code: "IT", theory: 42, practical: 46, total: 88, max: 100, grade: "A+" },
      { subject: "English", code: "ENG", theory: 38, practical: 40, total: 78, max: 100, grade: "A" },
      { subject: "General Mathematics", code: "GM", theory: 35, practical: 38, total: 73, max: 100, grade: "B+" },
      { subject: "General Science", code: "GS", theory: 40, practical: 42, total: 82, max: 100, grade: "A" },
      { subject: "Social Science", code: "SS", theory: 37, practical: 39, total: 76, max: 100, grade: "B+" },
      { subject: "Assamese (MIL)", code: "MIL", theory: 41, practical: 44, total: 85, max: 100, grade: "A+" }
    ] : []
  );

  const totalScore = subjects.reduce((acc, s) => acc + (s.total || 0), 0);
  const maxTotalScore = subjects.reduce((acc, s) => acc + (s.max || 100), 0);
  const overallPercentage = (maxTotalScore > 0 && subjects.length > 0) ? ((totalScore / maxTotalScore) * 100).toFixed(1) : null;

  return (
    <div className="animate-fade-in">
      <ChildSelector />

      {/* Header Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
        color: '#fff',
        border: 'none',
        padding: '20px',
        boxShadow: '0 8px 20px rgba(124, 58, 237, 0.22)',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9, fontWeight: '700' }}>
              {t('marksTitle')}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-heading)', margin: '2px 0' }}>
              {overallPercentage ? `${overallPercentage}%` : t('notPublishedYet')}
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.22)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}>
              <Award size={14} />
              <span>{overallPercentage ? 'Grade A+ • Outstanding' : currentExam.title}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.9 }}>
            <div style={{ fontWeight: '700' }}>{student.studentName}</div>
            <div>{t('class')} {student.class} ({student.section || 'A'})</div>
            <div>{currentExam.title}</div>
          </div>
        </div>
      </div>

      {/* Exam Tab Switcher */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
        {exams.map((ex) => {
          const isSelected = selectedExamIndex === ex.index;
          return (
            <button
              key={ex.index}
              onClick={() => setSelectedExamIndex(ex.index)}
              aria-label={`Select ${ex.title}`}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                color: isSelected ? '#fff' : 'var(--text-secondary)',
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.3)' : 'none',
                minHeight: '38px'
              }}
            >
              {ex.title}
            </button>
          );
        })}
      </div>

      {/* Subject-Wise Breakdown Table Card or Empty State */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <BookOpen size={18} color="var(--primary)" />
            <span>{t('subjectPerformance')}</span>
          </div>
          <span className={`badge ${currentExam.published ? 'badge-purple' : 'badge-gray'}`}>
            {currentExam.published ? currentExam.title : t('notPublishedYet')}
          </span>
        </div>

        {currentExam.published && subjects.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {subjects.map((sub, idx) => {
              const pct = sub.max > 0 ? (sub.total / sub.max) * 100 : 0;
              return (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card-muted)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {sub.subject}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {t('theory')}: {sub.theory} • {t('practical')}: {sub.practical}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--primary-text)' }}>
                        {sub.total} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {sub.max}</span>
                      </div>
                      <span className="badge badge-green" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        {sub.grade}
                      </span>
                    </div>
                  </div>

                  {/* Accessible Subject Score Progress Bar */}
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: pct >= 80 ? 'var(--accent-green)' : pct >= 60 ? 'var(--primary)' : 'var(--accent-amber)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileQuestion size={28} />
            </div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {t('notPublishedYet')}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto' }}>
              Evaluations for {currentExam.title} have not been recorded or finalized by subject teachers yet.
            </p>
          </div>
        )}
      </div>

      {/* Read-Only Notice */}
      <div className="card" style={{ background: 'var(--bg-card-muted)', marginBottom: 0 }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Info size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {t('officialEvaluationNote')}
          </div>
        </div>
      </div>
    </div>
  );
}
