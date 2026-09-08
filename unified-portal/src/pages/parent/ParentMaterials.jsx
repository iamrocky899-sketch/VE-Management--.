import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';
import { ApiService, openOrDownloadBase64File, resolveStudentGroup } from '../../api/client';
import {
  BookOpen, Briefcase, Search, ArrowLeft, RefreshCw,
  Copy, Check, ChevronDown, ChevronRight, HelpCircle,
  FileText, Layers, AlertCircle, Users, CheckCircle2, Download
} from 'lucide-react';

export default function ParentMaterials({ setActivePage }) {
  const { user, selectedChildId, switchChild, handleSessionRevocation } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [dashboardData, setDashboardData] = useState(null);
  const [allNotesList, setAllNotesList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Main Book');
  const [selectedSubject, setSelectedSubject] = useState('IT/ITeS');
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Track expanded question answers { [questionId]: boolean }
  const [expandedAnswers, setExpandedAnswers] = useState({});
  // Track copied feedback { [questionId]: boolean }
  const [copiedMap, setCopiedMap] = useState({});

  const CATEGORIES = ['Main Book', 'Employability Skill', 'Practical Notes'];

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Fetch Aggregated Parent Dashboard (children metadata)
      const dashRes = await ApiService.getParentDashboard(user?.token);
      if (dashRes && dashRes.success && dashRes.data) {
        setDashboardData(dashRes.data);
      } else if (dashRes?.error?.code === 'SESSION_EXPIRED') {
        handleSessionRevocation('SESSION_EXPIRED');
        return;
      } else if (dashRes?.error?.code === 'ACCOUNT_DEACTIVATED') {
        handleSessionRevocation('ACCOUNT_DEACTIVATED');
        return;
      }

      // 2. Fetch Full Notes Records
      const notesRes = await ApiService.getNotes(user?.token);
      if (notesRes && notesRes.success && notesRes.data) {
        setAllNotesList(notesRes.data.notes || []);
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
      loadData();
    }
  }, [user?.token]);

  const childrenSummaries = dashboardData?.children || [];
  const effectiveChildren = user?.children || [];

  // Resolve active selected child safely
  const activeChildSummary = childrenSummaries.find(
    c => String(c.student?.studentId || c.student?.student_id || c.student?.id) === String(selectedChildId)
  );

  const matchedRawChild = effectiveChildren.find(
    c => String(c.studentId || c.student_id || c.id) === String(selectedChildId)
  ) || effectiveChildren[0];

  const rawSelected = (activeChildSummary && String(activeChildSummary.student?.studentId || activeChildSummary.student?.student_id || activeChildSummary.student?.id) === String(selectedChildId))
    ? activeChildSummary.student
    : (matchedRawChild || {});

  const assignedGroup = resolveStudentGroup(rawSelected);
  const selectedStudent = {
    studentId: rawSelected.studentId || rawSelected.student_id || rawSelected.id || 'STU_0',
    studentName: rawSelected.studentName || rawSelected.name || 'Child',
    class: rawSelected.class || '9',
    section: rawSelected.section || 'N/A',
    rollNo: rawSelected.rollNo || rawSelected.roll_no || rawSelected.roll || '1',
    group: assignedGroup !== 'Group Not Assigned' ? assignedGroup : null,
    displayGroup: assignedGroup
  };

  // Scope notes specifically to the selected child's enrolled class
  const childNotes = useMemo(() => {
    const targetClass = String(selectedStudent.class || '9');
    return allNotesList.filter(n => !n.class || String(n.class) === targetClass);
  }, [allNotesList, selectedStudent.class]);

  // Extract available subjects from child notes
  const availableSubjects = useMemo(() => {
    const subs = new Set(
      childNotes
        .filter(n => !n.category || n.category === selectedCategory)
        .map(n => n.subject)
        .filter(Boolean)
    );
    if (subs.size === 0) return ['IT/ITeS', 'Retail', 'General Science', 'Mathematics', 'English', 'Assamese'];
    return Array.from(subs);
  }, [childNotes, selectedCategory]);

  // Find active note matching selected category and subject
  const activeNote = useMemo(() => {
    return childNotes.find(
      n => (n.category || 'Main Book') === selectedCategory && (n.subject || 'IT/ITeS') === selectedSubject
    ) || childNotes.find(n => (n.category || 'Main Book') === selectedCategory) || childNotes[0];
  }, [childNotes, selectedCategory, selectedSubject]);

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

  const toggleAnswer = (questionId) => {
    setExpandedAnswers(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleCopyAnswer = async (questionId, answerText) => {
    if (!answerText) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(answerText);
      } else {
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

  const [downloadingKey, setDownloadingKey] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  const handleDownloadPdf = async (fileKey, fileName) => {
    if (!fileKey) return;
    setDownloadingKey(fileKey);
    setDownloadError(null);
    try {
      const res = await ApiService.downloadFile(user?.token, fileKey);
      if (res && res.success && res.data?.fileData) {
        openOrDownloadBase64File(res.data.fileData, res.data.contentType || 'application/pdf', fileName || 'unit_material.pdf');
      } else {
        setDownloadError(res?.error?.message || 'Unable to download file. Please check back later.');
      }
    } catch (err) {
      setDownloadError('Network error downloading file.');
    } finally {
      setDownloadingKey(null);
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

  if (error && childNotes.length === 0) {
    return (
      <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '16px' }}>
        <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
          Unable to Load Study Materials
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '16px' }}>{error}</p>
        <button type="button" className="btn-primary" onClick={() => loadData(true)}>
          <RefreshCw size={15} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="parent-materials-container animate-fade-in">
      {/* Top Action Bar */}
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
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
        >
          <RefreshCw size={14} className={refreshing ? 'spinner' : ''} />
          <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Multi-Child Selector */}
      {childrenSummaries.length > 1 && (
        <div className="card child-selector-container" style={{ padding: '14px 16px', borderRadius: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
            <Users size={16} color="#059669" />
            <span>Select Child for Study Materials</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            {childrenSummaries.map((childSummary) => {
              const stu = childSummary.student;
              const isSelected = String(stu.studentId) === String(selectedStudent.studentId);

              return (
                <button
                  key={stu.studentId}
                  type="button"
                  onClick={() => {
                    switchChild(stu.studentId);
                    setSelectedUnitId(null);
                  }}
                  aria-label={`Select ${stu.studentName}`}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: isSelected ? '#047857' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#0f172a',
                    border: isSelected ? '1.5px solid #047857' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{stu.studentName}</div>
                    <div style={{ fontSize: '0.75rem', color: isSelected ? '#d1fae5' : '#64748b', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                      <span>Class {stu.class}-{stu.section || 'N/A'} • Roll {stu.rollNo}</span>
                      <span>•</span>
                      <span>Group: <strong>{stu.displayGroup || stu.group || 'Group Not Assigned'}</strong></span>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 size={16} color="#ffffff" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hero Header Banner */}
      <div
        className="card materials-hero-banner"
        style={{
          background: selectedCategory === 'Main Book'
            ? 'linear-gradient(135deg, #065f46 0%, #10b981 100%)'
            : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          marginBottom: '16px',
          boxShadow: '0 8px 20px rgba(6, 95, 70, 0.22)'
        }}
      >
        <div className="materials-hero-content">
          <div>
            <div className="materials-hero-badges">
              <span className="badge-materials-tag">
                PARENT MATERIALS VIEWER
              </span>
              <span className="badge-student-class">
                {selectedStudent.studentName.toUpperCase()} • CLASS {selectedStudent.class}
              </span>
            </div>
            <h1 className="materials-hero-title">
              {selectedCategory} — {selectedSubject}
            </h1>
            <p className="materials-hero-desc">
              Review structured lesson notes and study questions assigned to Class {selectedStudent.class}
            </p>
          </div>

          <div className="materials-hero-stats">
            <div className="materials-hero-units">
              {totalUnitsCount} Units
            </div>
            <div className="materials-hero-questions">
              {totalQuestionsCount} Questions
            </div>
          </div>
        </div>
      </div>

      {/* Category Switcher Tabs */}
      <div className="card category-selector-tabs" style={{ padding: '8px', borderRadius: '14px', marginBottom: '16px' }}>
        <div className="category-selector-grid">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            const isMainBook = cat === 'Main Book';

            return (
              <button
                key={cat}
                type="button"
                className={`category-btn ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedUnitId(null);
                }}
                style={{
                  background: isSelected ? (isMainBook ? '#047857' : '#0284c7') : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#475569',
                  border: isSelected ? 'none' : '1px solid #e2e8f0',
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
            <span style={{ color: '#047857', fontWeight: 700 }}>{activeUnit.unitTitle || `Unit ${activeUnit.unitNumber || 1}`}</span>
          </>
        )}
      </div>

      {/* Main Grid: Units List & Questions/Answers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Units Navigation (1 Column) */}
        <div>
          <div className="card" style={{ padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
              <Layers size={16} color="#047857" />
              <span>Available Units ({units.length})</span>
            </div>

            {units.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0', textAlign: 'center' }}>
                <BookOpen size={24} color="#94a3b8" style={{ margin: '0 auto 6px auto' }} />
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                  No units available for Class {selectedStudent.class} in this subject.
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
                        background: isSelected ? '#ecfdf5' : '#f8fafc',
                        border: isSelected ? '1.5px solid #047857' : '1px solid #e2e8f0',
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
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isSelected ? '#047857' : '#64748b', textTransform: 'uppercase' }}>
                          UNIT {u.unitNumber || idx + 1}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', margin: '2px 0' }}>
                          {u.unitTitle || u.title || `Unit ${idx + 1}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {qCount} {qCount === 1 ? 'Question' : 'Questions'}
                        </div>
                      </div>
                      <ChevronRight size={16} color={isSelected ? '#047857' : '#94a3b8'} />
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
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                  {activeUnit?.unitNumber ? `UNIT ${activeUnit.unitNumber}` : 'CURRENT UNIT'}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
                  {activeUnit?.unitTitle || activeUnit?.title || 'Unit Questions'}
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', background: '#d1fae5', padding: '3px 8px', borderRadius: '6px' }}>
                {displayedQuestions.length} Questions
              </span>
            </div>

            {/* Attached PDF Resource if available */}
            {activeUnit && (activeUnit.attachmentUrl || activeUnit.attachment_url) && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '8px', background: '#16a34a', color: '#ffffff', borderRadius: '8px', display: 'flex' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#166534' }}>
                      {activeUnit.attachmentName || activeUnit.attachment_name || `${activeUnit.unitTitle || 'Unit'} Material.pdf`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                      Official Attached PDF Document
                      {(activeUnit.attachmentSize || activeUnit.attachment_size) ? ` • ${Math.round((activeUnit.attachmentSize || activeUnit.attachment_size) / 1024)} KB` : ''}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.8125rem', background: '#16a34a', borderColor: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', width: 'auto' }}
                  onClick={() => handleDownloadPdf(activeUnit.attachmentUrl || activeUnit.attachment_url, activeUnit.attachmentName || activeUnit.attachment_name)}
                  disabled={downloadingKey === (activeUnit.attachmentUrl || activeUnit.attachment_url)}
                >
                  <Download size={14} className={downloadingKey === (activeUnit.attachmentUrl || activeUnit.attachment_url) ? 'spinner' : ''} />
                  <span>{downloadingKey === (activeUnit.attachmentUrl || activeUnit.attachment_url) ? 'Loading...' : 'Download / View PDF'}</span>
                </button>
              </div>
            )}

            {downloadError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '0.8125rem', marginBottom: '14px' }}>
                {downloadError}
              </div>
            )}

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
                  const isExpanded = expandedAnswers[qId] !== false;
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
                          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#047857', minWidth: '24px', paddingTop: '1px' }}>
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
