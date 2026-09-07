import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../state/AuthContext';
import { ApiService } from '../services/api';
import {
  BookOpen, Briefcase, Search, ArrowLeft, RefreshCw,
  Copy, Check, ChevronDown, ChevronRight, HelpCircle,
  FileText, Layers, AlertCircle, Sparkles, BookMarked
} from 'lucide-react';

export default function StudentMaterials({ setActivePage }) {
  const { user, handleSessionRevocation } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [notesList, setNotesList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Main Book');
  const [selectedSubject, setSelectedSubject] = useState('IT/ITeS');
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Track expanded question answers { [questionId]: boolean }
  const [expandedAnswers, setExpandedAnswers] = useState({});
  // Track copied feedback { [questionId]: boolean }
  const [copiedMap, setCopiedMap] = useState({});

  const CATEGORIES = ['Main Book', 'Employability Skill'];

  const studentClass = user?.class || '9';
  const studentName = user?.name || 'Student';

  const loadMaterials = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Fetch notes scoped strictly to student session
      const res = await ApiService.getNotes(user?.token);

      if (res && res.success && res.data) {
        const notes = res.data.notes || [];
        setNotesList(notes);

        // Auto-select first available subject if current not present
        const availableSubs = [...new Set(notes.map(n => n.subject).filter(Boolean))];
        if (availableSubs.length > 0 && !availableSubs.includes(selectedSubject)) {
          setSelectedSubject(availableSubs[0]);
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
        setError(res?.error?.message || 'Unable to load study materials.');
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
      loadMaterials();
    }
  }, [user?.token]);

  // Extract available subjects from fetched notes for this category
  const availableSubjects = useMemo(() => {
    const subs = new Set(
      notesList
        .filter(n => !n.category || n.category === selectedCategory)
        .map(n => n.subject)
        .filter(Boolean)
    );
    if (subs.size === 0) return ['IT/ITeS', 'Retail', 'General Science', 'Mathematics', 'English', 'Assamese'];
    return Array.from(subs);
  }, [notesList, selectedCategory]);

  // Find active note matching selected category and subject
  const activeNote = useMemo(() => {
    return notesList.find(
      n => (n.category || 'Main Book') === selectedCategory && (n.subject || 'IT/ITeS') === selectedSubject
    ) || notesList.find(n => (n.category || 'Main Book') === selectedCategory) || notesList[0];
  }, [notesList, selectedCategory, selectedSubject]);

  // Extract units from active note
  const units = useMemo(() => {
    return activeNote?.units || [];
  }, [activeNote]);

  // Resolve active selected unit
  const activeUnit = useMemo(() => {
    if (selectedUnitId) {
      return units.find(u => String(u.unitId) === String(selectedUnitId)) || units[0];
    }
    return units[0] || null;
  }, [units, selectedUnitId]);

  // Filter questions by search query if present
  const displayedQuestions = useMemo(() => {
    if (!activeUnit) return [];
    const qList = activeUnit.questions || [];
    if (!searchQuery.trim()) return qList;

    const q = searchQuery.toLowerCase().trim();
    return qList.filter(item => {
      const qText = (item.questionText || item.question || '').toLowerCase();
      const aText = (item.answerText || item.answer || '').toLowerCase();
      return qText.includes(q) || aText.includes(q);
    });
  }, [activeUnit, searchQuery]);

  // Total summary counts
  const totalUnitsCount = units.length;
  const totalQuestionsCount = units.reduce((acc, u) => acc + (u.questions?.length || 0), 0);

  // Toggle answer expansion
  const toggleAnswer = (questionId) => {
    setExpandedAnswers(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Copy answer to clipboard safely
  const handleCopyAnswer = async (questionId, answerText) => {
    if (!answerText) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(answerText);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = answerText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedMap(prev => ({ ...prev, [questionId]: true }));
      setTimeout(() => {
        setCopiedMap(prev => ({ ...prev, [questionId]: false }));
      }, 2000);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="materials-skeleton-wrap animate-fade-in">
        <div className="card skeleton" style={{ height: '120px', marginBottom: '16px', borderRadius: '16px' }} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: '16px' }}>
          <div className="card skeleton" style={{ height: '80px', borderRadius: '14px' }} />
          <div className="card skeleton" style={{ height: '80px', borderRadius: '14px' }} />
          <div className="card skeleton" style={{ height: '80px', borderRadius: '14px' }} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card skeleton" style={{ height: '320px', borderRadius: '16px' }} />
          <div className="lg:col-span-2 card skeleton" style={{ height: '320px', borderRadius: '16px' }} />
        </div>
      </div>
    );
  }

  if (error && notesList.length === 0) {
    return (
      <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '16px' }}>
        <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
          Unable to Load Study Materials
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
        <button type="button" className="btn-primary" onClick={() => loadMaterials(true)}>
          <RefreshCw size={15} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="student-materials-container animate-fade-in">
      {/* Top Action Bar & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setActivePage('dashboard')}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
        >
          <ArrowLeft size={15} />
          <span>Back to Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => loadMaterials(true)}
          disabled={refreshing}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
        >
          <RefreshCw size={14} className={refreshing ? 'spinner' : ''} />
          <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Hero Header Banner */}
      <div
        className="card materials-hero-banner"
        style={{
          background: selectedCategory === 'Main Book'
            ? 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)'
            : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '16px',
          boxShadow: '0 8px 20px rgba(22, 163, 74, 0.22)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                TEACHER STUDY MATERIALS
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: '#ffffff', color: '#15803d', padding: '2px 8px', borderRadius: '6px' }}>
                CLASS {studentClass}
              </span>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '2px 0 4px 0' }}>
              {selectedCategory} — {selectedSubject}
            </h1>
            <p style={{ fontSize: '0.85rem', opacity: 0.92, margin: 0 }}>
              Structured Learning Units and Question & Answer Bank for Class {studentClass}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
              {totalUnitsCount} Units
            </div>
            <div style={{ fontSize: '0.8125rem', opacity: 0.9, marginTop: '2px' }}>
              {totalQuestionsCount} Questions Available
            </div>
          </div>
        </div>
      </div>

      {/* Category Switcher Tabs */}
      <div className="card category-selector-tabs" style={{ padding: '8px', borderRadius: '14px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            const isMainBook = cat === 'Main Book';

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedUnitId(null);
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: isSelected ? (isMainBook ? '#16a34a' : '#0284c7') : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#475569',
                  border: isSelected ? 'none' : '1px solid #e2e8f0',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                {isMainBook ? <BookOpen size={18} /> : <Briefcase size={18} />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject Selector & Search Bar */}
      <div className="card" style={{ padding: '14px 16px', borderRadius: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Subject Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {availableSubjects.map(sub => {
              const isSelected = selectedSubject === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    setSelectedSubject(sub);
                    setSelectedUnitId(null);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: isSelected ? '#0f172a' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#475569',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {sub}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search questions or answers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8125rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Breadcrumbs Navigation */}
      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>Study Materials</span>
        <span>→</span>
        <strong style={{ color: '#0f172a' }}>{selectedCategory}</strong>
        <span>→</span>
        <strong style={{ color: '#0f172a' }}>{selectedSubject}</strong>
        {activeUnit && (
          <>
            <span>→</span>
            <span style={{ color: '#16a34a', fontWeight: 700 }}>{activeUnit.unitTitle || `Unit ${activeUnit.unitNumber || 1}`}</span>
          </>
        )}
      </div>

      {/* Main Grid: Left Sidebar (Units List) & Right Content (Questions & Answers) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Units Navigation (1 Column) */}
        <div>
          <div className="card" style={{ padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
              <Layers size={16} color="#16a34a" />
              <span>Available Units ({units.length})</span>
            </div>

            {units.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0', textAlign: 'center' }}>
                <BookOpen size={24} color="#94a3b8" style={{ margin: '0 auto 6px auto' }} />
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                  No units available for this subject yet.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {units.map((u, idx) => {
                  const isSelected = activeUnit && String(activeUnit.unitId) === String(u.unitId);
                  const qCount = u.questions?.length || 0;

                  return (
                    <button
                      key={u.unitId || idx}
                      type="button"
                      onClick={() => setSelectedUnitId(u.unitId)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: isSelected ? '#f0fdf4' : '#f8fafc',
                        border: isSelected ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                        color: '#0f172a',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isSelected ? '#16a34a' : '#64748b', textTransform: 'uppercase' }}>
                          UNIT {u.unitNumber || idx + 1}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', margin: '2px 0' }}>
                          {u.unitTitle || u.title || `Unit ${idx + 1}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {qCount} {qCount === 1 ? 'Question' : 'Questions'}
                        </div>
                      </div>
                      <ChevronRight size={16} color={isSelected ? '#16a34a' : '#94a3b8'} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Questions & Answers List (2 Columns) */}
        <div className="lg:col-span-2">
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                  {activeUnit?.unitNumber ? `UNIT ${activeUnit.unitNumber}` : 'CURRENT UNIT'}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
                  {activeUnit?.unitTitle || activeUnit?.title || 'Unit Questions'}
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px' }}>
                {displayedQuestions.length} Questions
              </span>
            </div>

            {displayedQuestions.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px 0', textAlign: 'center' }}>
                <HelpCircle size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  {searchQuery ? 'No matching study materials found' : 'No questions available in this unit yet'}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '4px' }}>
                  {searchQuery ? 'Try searching with different keywords.' : 'Teacher will add questions and answers soon.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {displayedQuestions.map((qItem, idx) => {
                  const qId = qItem.questionId || `q-${idx}`;
                  const isExpanded = expandedAnswers[qId] !== false; // expanded by default or toggled
                  const isCopied = copiedMap[qId];
                  const qText = qItem.questionText || qItem.question || 'Question';
                  const aText = qItem.answerText || qItem.answer || 'Answer not provided yet.';

                  return (
                    <div
                      key={qId}
                      style={{
                        borderRadius: '14px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      {/* Question Card Header */}
                      <div
                        onClick={() => toggleAnswer(qId)}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        style={{
                          padding: '14px 16px',
                          background: '#f8fafc',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#16a34a', minWidth: '24px', paddingTop: '1px' }}>
                            Q{idx + 1}.
                          </span>
                          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
                            {qText}
                          </span>
                        </div>
                        <button
                          type="button"
                          aria-label={isExpanded ? 'Collapse answer' : 'Expand answer'}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', paddingTop: '2px' }}
                        >
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      </div>

                      {/* Answer Reveal Body */}
                      {isExpanded && (
                        <div style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', background: '#ffffff' }}>
                          <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
                            {aText}
                          </div>

                          {/* Action Bar (Copy Answer) */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f8fafc', paddingTop: '8px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyAnswer(qId, aText);
                              }}
                              className="btn-secondary"
                              aria-label="Copy Answer text"
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: isCopied ? '#dcfce7' : '#f8fafc',
                                color: isCopied ? '#15803d' : '#475569',
                                borderColor: isCopied ? '#86efac' : '#e2e8f0'
                              }}
                            >
                              {isCopied ? <Check size={13} color="#15803d" /> : <Copy size={13} />}
                              <span>{isCopied ? 'Copied ✓' : 'Copy Answer'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
