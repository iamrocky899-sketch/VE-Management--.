import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';
import { ApiService } from '../../api/client';
import {
  Award, BookOpen, BarChart3, ArrowLeft, RefreshCw,
  Printer, CheckCircle2, AlertCircle, AlertTriangle,
  TrendingUp, TrendingDown, School, ShieldCheck, User, Info
} from 'lucide-react';

export default function StudentMarks({ setActivePage }) {
  const { user, handleSessionRevocation } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [marksList, setMarksList] = useState([]);
  const [selectedExam, setSelectedExam] = useState('1st Unit Test');
  const [showReportCardModal, setShowReportCardModal] = useState(false);

  // 4 Standard Institutional Exams
  const EXAMS = [
    '1st Unit Test',
    'Half Yearly Examination',
    '2nd Unit Test',
    'Annual Examination'
  ];

  const loadMarks = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Fetch Marks using authenticated session token
      const res = await ApiService.getMarks(user?.token);

      if (res && res.success && res.data) {
        setMarksList(res.data.marks || []);
      } else {
        const errCode = res?.error?.code;
        if (errCode === 'SESSION_EXPIRED') {
          handleSessionRevocation('SESSION_EXPIRED');
          return;
        } else if (errCode === 'ACCOUNT_DEACTIVATED') {
          handleSessionRevocation('ACCOUNT_DEACTIVATED');
          return;
        }
        setError(res?.error?.message || 'Unable to load academic marks.');
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
      loadMarks();
    }
  }, [user?.token]);

  const studentName = user?.name || 'Student';
  const studentClass = user?.class || '9';
  const studentSection = user?.section || 'N/A';
  const studentRoll = user?.rollNo || '1';
  const studentGroup = user?.group || 'Group Not Assigned';

  // Filter marks for selected exam (handling slight naming variations like 'Half Yearly' vs 'Half Yearly Examination')
  const currentExamMarks = useMemo(() => {
    return marksList.filter(m => {
      const examName = (m.exam || '').toLowerCase();
      const selName = selectedExam.toLowerCase();
      return examName === selName ||
        (selName.includes('half yearly') && examName.includes('half yearly')) ||
        (selName.includes('annual') && (examName.includes('annual') || examName.includes('final')));
    });
  }, [marksList, selectedExam]);

  // Evaluated marks calculation
  const evaluatedSubjects = currentExamMarks.filter(m => m.total !== undefined && m.total !== null);
  const totalScore = evaluatedSubjects.reduce((acc, m) => acc + Number(m.total || 0), 0);
  const maxPossibleScore = evaluatedSubjects.reduce((acc, m) => acc + Number(m.maxMarks || 100), 0);

  const averageScore = evaluatedSubjects.length > 0
    ? (totalScore / evaluatedSubjects.length).toFixed(1)
    : null;

  const percentage = (maxPossibleScore > 0 && evaluatedSubjects.length > 0)
    ? ((totalScore / maxPossibleScore) * 100).toFixed(1)
    : null;

  // Highest and lowest scoring subjects
  const sortedByScore = [...evaluatedSubjects].sort((a, b) => Number(b.total) - Number(a.total));
  const highestSubject = sortedByScore.length > 0 ? sortedByScore[0] : null;
  const lowestSubject = sortedByScore.length > 1 ? sortedByScore[sortedByScore.length - 1] : null;

  // Exam Comparison Analytics (calculating average across all 4 exams)
  const examComparison = useMemo(() => {
    return EXAMS.map(ex => {
      const exMarks = marksList.filter(m => {
        const examName = (m.exam || '').toLowerCase();
        const selName = ex.toLowerCase();
        return examName === selName ||
          (selName.includes('half yearly') && examName.includes('half yearly')) ||
          (selName.includes('annual') && (examName.includes('annual') || examName.includes('final')));
      });
      const evaluated = exMarks.filter(m => m.total !== undefined && m.total !== null);
      const avg = evaluated.length > 0
        ? Math.round(evaluated.reduce((acc, m) => acc + Number(m.total || 0), 0) / evaluated.length)
        : null;
      return { exam: ex, count: evaluated.length, avg };
    });
  }, [marksList]);

  // Handle Printing
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="marks-skeleton-wrap animate-fade-in">
        <div className="card skeleton" style={{ height: '140px', marginBottom: '16px', borderRadius: '16px' }} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" style={{ marginBottom: '16px' }}>
          <div className="card skeleton" style={{ height: '100px', borderRadius: '14px' }} />
          <div className="card skeleton" style={{ height: '100px', borderRadius: '14px' }} />
          <div className="card skeleton" style={{ height: '100px', borderRadius: '14px' }} />
          <div className="card skeleton" style={{ height: '100px', borderRadius: '14px' }} />
        </div>
        <div className="card skeleton" style={{ height: '300px', borderRadius: '16px' }} />
      </div>
    );
  }

  if (error && marksList.length === 0) {
    return (
      <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '16px' }}>
        <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
          Unable to Load Scorecard
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
        <button type="button" className="btn-primary" onClick={() => loadMarks(true)}>
          <RefreshCw size={15} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="student-marks-container animate-fade-in">
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setActivePage('dashboard')}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
        >
          <ArrowLeft size={15} />
          <span>Back to Dashboard</span>
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-secondary btn-print"
            style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
          >
            <Printer size={15} />
            <span>Print Report Card</span>
          </button>
          <button
            type="button"
            onClick={() => loadMarks(true)}
            disabled={refreshing}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
          >
            <RefreshCw size={14} className={refreshing ? 'spinner' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Hero Header Banner */}
      <div
        className="card marks-hero-banner"
        style={{
          background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)',
          color: '#ffffff',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '16px',
          boxShadow: '0 8px 20px rgba(109, 40, 217, 0.22)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                ACADEMIC PERFORMANCE
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: '#22c55e', color: '#ffffff', padding: '2px 8px', borderRadius: '6px' }}>
                OFFICIAL GRADEBOOK
              </span>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '2px 0 4px 0' }}>
              {studentName}'s Scorecard
            </h1>
            <div style={{ fontSize: '0.85rem', opacity: 0.92, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <span>Class <strong>{studentClass}</strong></span>
              <span>•</span>
              <span>Section <strong>{studentSection}</strong></span>
              <span>•</span>
              <span>Roll No <strong>{studentRoll}</strong></span>
              <span>•</span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 8px', borderRadius: '6px', fontWeight: 600 }}>
                Group: <strong>{studentGroup}</strong>
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1 }}>
              {percentage ? `${percentage}%` : 'N/A'}
            </div>
            <div style={{ fontSize: '0.8125rem', opacity: 0.9, marginTop: '2px' }}>
              {selectedExam} Average
            </div>
          </div>
        </div>
      </div>

      {/* Exam Selector Tabs */}
      <div className="card exam-selector-tabs no-print" style={{ padding: '10px 12px', borderRadius: '14px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {EXAMS.map(exam => {
            const isSelected = selectedExam === exam;
            return (
              <button
                key={exam}
                type="button"
                onClick={() => setSelectedExam(exam)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: isSelected ? '#6d28d9' : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#475569',
                  border: isSelected ? '1px solid #6d28d9' : '1px solid #e2e8f0',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {exam}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary KPI Counters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px', borderRadius: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Subjects Evaluated
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
            {evaluatedSubjects.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>For {selectedExam}</div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase' }}>
            Total Marks
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6d28d9', margin: '2px 0' }}>
            {totalScore}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Out of {maxPossibleScore} Max</div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
            Highest Subject
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a', margin: '4px 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {highestSubject ? `${highestSubject.total}/100` : '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {highestSubject ? highestSubject.subject : 'No records'}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderRadius: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>
            Lowest Subject
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d97706', margin: '4px 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lowestSubject ? `${lowestSubject.total}/100` : '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#d97706', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lowestSubject ? lowestSubject.subject : 'No records'}
          </div>
        </div>
      </div>

      {/* Main Grid: Subject Marks Table & Exam Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Marks Table (2 Columns) */}
        <div className="lg:col-span-2">
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="#6d28d9" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {selectedExam} Results
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6d28d9', background: '#f3e8ff', padding: '2px 8px', borderRadius: '6px' }}>
                Theory + Practical = Total
              </span>
            </div>

            {currentExamMarks.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px 0', textAlign: 'center' }}>
                <Award size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  No marks have been recorded yet
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '4px' }}>
                  Marks for {selectedExam} will appear once evaluations are published by teachers.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                      <th style={{ padding: '10px 12px', fontWeight: 700 }}>Subject</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center' }}>Theory (50)</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center' }}>Practical (50)</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center' }}>Total (100)</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentExamMarks.map((m, idx) => {
                      const isEvaluated = m.total !== undefined && m.total !== null;
                      return (
                        <tr key={m.markId || `${m.subject}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>
                            {m.subject || 'Subject'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>
                            {m.theory !== undefined && m.theory !== null ? m.theory : '—'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>
                            {m.practical !== undefined && m.practical !== null ? m.practical : '—'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800, color: isEvaluated ? '#0f172a' : '#94a3b8' }}>
                            {isEvaluated ? m.total : '—'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: isEvaluated ? '#dcfce7' : '#f1f5f9',
                                color: isEvaluated ? '#15803d' : '#64748b'
                              }}
                            >
                              {isEvaluated ? 'Evaluated' : 'Not Evaluated'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Exam Comparison & Performance Trend (1 Column) */}
        <div>
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <BarChart3 size={18} color="#6d28d9" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Exam Comparison
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {examComparison.map(ec => (
                <div
                  key={ec.exam}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: selectedExam === ec.exam ? '#f5f3ff' : '#f8fafc',
                    border: selectedExam === ec.exam ? '1.5px solid #6d28d9' : '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                      {ec.exam}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {ec.count > 0 ? `${ec.count} subjects recorded` : 'Pending evaluation'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: ec.avg ? '#6d28d9' : '#94a3b8' }}>
                      {ec.avg ? `${ec.avg}%` : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Official Printable Report Card View */}
      <div className="report-card-print-container card" style={{ marginTop: '24px', padding: '24px', borderRadius: '16px' }}>
        <div className="report-card-header" style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
            <School size={22} color="#0f172a" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Gameri Higher Secondary School, Gamiri
            </h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '2px 0 6px 0' }}>
            Permanent School ID: <strong>GAMERI-HSS-001</strong> • Vocational & Academic Evaluation Report Card
          </p>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#6d28d9' }}>
            {selectedExam.toUpperCase()} (SESSION 2026-27)
          </div>
        </div>

        {/* Student Bio Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.85rem' }}>
          <div>Student Name: <strong>{studentName}</strong></div>
          <div>Class: <strong>{studentClass}</strong> ({studentSection})</div>
          <div>Roll Number: <strong>{studentRoll}</strong></div>
          <div>Vocational Stream: <strong>IT/ITeS</strong></div>
        </div>

        {/* Subject Results Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '16px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>Subject</th>
              <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Theory (50)</th>
              <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Practical (50)</th>
              <th style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Total (100)</th>
            </tr>
          </thead>
          <tbody>
            {currentExamMarks.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#64748b', border: '1px solid #cbd5e1' }}>
                  No marks have been recorded yet for this exam.
                </td>
              </tr>
            ) : (
              currentExamMarks.map((m, idx) => (
                <tr key={m.markId || idx}>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 600 }}>{m.subject}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{m.theory ?? '—'}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{m.practical ?? '—'}</td>
                  <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700 }}>{m.total ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Summary Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1.5px solid #e2e8f0', paddingTop: '12px', fontSize: '0.85rem' }}>
          <div>Total Score: <strong>{totalScore} / {maxPossibleScore}</strong></div>
          <div>Average / Percentage: <strong>{percentage ? `${percentage}%` : 'N/A'}</strong></div>
          <div>Report Generated: <strong>{new Date().toLocaleDateString()}</strong></div>
        </div>
      </div>
    </div>
  );
}
