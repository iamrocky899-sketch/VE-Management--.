import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../state/AuthContext';
import { sendApiRequest, ApiService, openOrDownloadBase64File } from '../../api/client';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  HelpCircle,
  FileText,
  X,
  Save,
  Clock,
  Upload,
  Download,
  Paperclip
} from 'lucide-react';

export default function Notes({ onNavigate }) {
  const { user, isTeacher, isPrincipal } = useAuth();

  // Class Selection
  const availableClasses = useMemo(() => {
    if (isTeacher) {
      return user?.assignedClasses && user.assignedClasses.length > 0 ? user.assignedClasses : ['9', '10'];
    }
    return ['9', '10', '11', '12'];
  }, [isTeacher, user]);

  const [selectedClass, setSelectedClass] = useState(() => availableClasses[0] || '9');

  // Subject Selection
  const availableSubjects = useMemo(() => {
    if (isTeacher) {
      return user?.assignedSubjects && user.assignedSubjects.length > 0
        ? user.assignedSubjects
        : ['IT/ITeS'];
    }
    return ['IT/ITeS', 'Retail', 'General Science', 'Mathematics', 'English', 'Assamese'];
  }, [isTeacher, user]);

  const [selectedSubject, setSelectedSubject] = useState(() => availableSubjects[0] || 'IT/ITeS');

  // Initial Content Categories
  const CATEGORIES = ['Main Book', 'Employability Skill', 'Practical Notes'];
  const [selectedCategory, setSelectedCategory] = useState('Main Book');

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [unitModal, setUnitModal] = useState({ isOpen: false, mode: 'CREATE', unit: null });
  const [questionModal, setQuestionModal] = useState({ isOpen: false, mode: 'CREATE', unitId: null, question: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, id: null, title: '', extra: '' });

  // Form Fields State
  const [unitForm, setUnitForm] = useState({ unitTitle: '', unitNumber: '', description: '' });
  const [questionForm, setQuestionForm] = useState({ questionText: '', answerText: '' });

  // PDF Upload & Download State
  const [uploadingUnitId, setUploadingUnitId] = useState(null);
  const [downloadingKey, setDownloadingKey] = useState(null);
  const [targetUploadUnit, setTargetUploadUnit] = useState(null);
  const fileInputRef = useRef(null);

  // Copied State Tracker { [questionId]: boolean }
  const [copiedMap, setCopiedMap] = useState({});

  // Expanded Units Accordion State { [unitId]: boolean }
  const [expandedUnits, setExpandedUnits] = useState({});

  // Load Notes Data for Class & Subject
  const loadNotesData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await sendApiRequest('get_notes', {
        class: selectedClass,
        subject: selectedSubject
      });
      const notesList = res?.data?.notes || [];
      setNotes(notesList);

      // Auto-expand all units
      const exp = {};
      notesList.forEach((n) => {
        if (Array.isArray(n.units)) {
          n.units.forEach((u) => {
            const uid = u.unitId || u.unit_id;
            if (uid) exp[uid] = true;
          });
        }
      });
      setExpandedUnits(exp);

    } catch (err) {
      setError('Unable to load study materials. Please check your network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotesData();
  }, [selectedClass, selectedSubject]);

  // Current Active Note for Selected Category
  const activeNote = useMemo(() => {
    return (
      notes.find(
        (n) =>
          String(n.class) === String(selectedClass) &&
          String(n.subject) === String(selectedSubject) &&
          (n.title === selectedCategory || (n.category && n.category === selectedCategory))
      ) || null
    );
  }, [notes, selectedClass, selectedSubject, selectedCategory]);

  const activeUnits = useMemo(() => {
    return activeNote?.units || [];
  }, [activeNote]);

  // Filtered Units and Questions based on Search Query
  const displayedUnits = useMemo(() => {
    if (!searchQuery.trim()) return activeUnits;
    const q = searchQuery.toLowerCase().trim();

    return activeUnits
      .map((unit) => {
        const titleMatch = (unit.unitTitle || unit.unit_title || '').toLowerCase().includes(q);
        const descMatch = (unit.description || '').toLowerCase().includes(q);

        const matchingQuestions = (unit.questions || []).filter((qst) => {
          const qMatch = (qst.questionText || qst.question_text || '').toLowerCase().includes(q);
          const aMatch = (qst.answerText || qst.answer_text || '').toLowerCase().includes(q);
          return qMatch || aMatch;
        });

        if (titleMatch || descMatch || matchingQuestions.length > 0) {
          return {
            ...unit,
            questions: matchingQuestions.length > 0 ? matchingQuestions : unit.questions
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [activeUnits, searchQuery]);

  // Toggle Accordion Unit
  const toggleUnit = (unitId) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  // Copy Answer to Clipboard
  const handleCopyAnswer = async (questionId, answerText) => {
    if (!answerText) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(answerText);
      }
      setCopiedMap((prev) => ({ ...prev, [questionId]: true }));
      setTimeout(() => {
        setCopiedMap((prev) => ({ ...prev, [questionId]: false }));
      }, 2000);
    } catch (e) {}
  };

  // -------------------------------------------------------------
  // UNIT ACTIONS
  // -------------------------------------------------------------
  const openCreateUnitModal = () => {
    setUnitForm({ unitTitle: '', unitNumber: String(activeUnits.length + 1), description: '' });
    setUnitModal({ isOpen: true, mode: 'CREATE', unit: null });
  };

  const openEditUnitModal = (unit) => {
    setUnitForm({
      unitTitle: unit.unitTitle || unit.unit_title || '',
      unitNumber: String(unit.unitNumber || unit.unit_number || ''),
      description: unit.description || ''
    });
    setUnitModal({ isOpen: true, mode: 'EDIT', unit });
  };

  const handleSaveUnitModal = async () => {
    if (!unitForm.unitTitle.trim()) {
      setError('Unit title is required.');
      return;
    }

    const isEdit = unitModal.mode === 'EDIT';
    const currentUnits = [...(activeNote?.units || [])];

    if (isEdit) {
      const targetId = unitModal.unit?.unitId || unitModal.unit?.unit_id;
      const idx = currentUnits.findIndex((u) => (u.unitId || u.unit_id) === targetId);
      if (idx !== -1) {
        currentUnits[idx] = {
          ...currentUnits[idx],
          unitTitle: unitForm.unitTitle.trim(),
          unit_title: unitForm.unitTitle.trim(),
          unitNumber: parseInt(unitForm.unitNumber, 10) || idx + 1,
          unit_number: parseInt(unitForm.unitNumber, 10) || idx + 1,
          description: unitForm.description.trim()
        };
      }
    } else {
      const newId = 'UNT_' + Date.now();
      const newUnit = {
        unitId: newId,
        unit_id: newId,
        unitNumber: parseInt(unitForm.unitNumber, 10) || currentUnits.length + 1,
        unit_number: parseInt(unitForm.unitNumber, 10) || currentUnits.length + 1,
        unitTitle: unitForm.unitTitle.trim(),
        unit_title: unitForm.unitTitle.trim(),
        description: unitForm.description.trim(),
        order: currentUnits.length + 1,
        questions: []
      };
      currentUnits.push(newUnit);
      setExpandedUnits((prev) => ({ ...prev, [newId]: true }));
    }

    const payload = {
      noteId: activeNote?.noteId || activeNote?.note_id || `NOT_${selectedClass}_${selectedSubject.replace(/\//g, '_')}_${selectedCategory.replace(/\s+/g, '_')}`,
      title: selectedCategory,
      class: String(selectedClass),
      subject: selectedSubject,
      units: currentUnits
    };

    try {
      const res = await sendApiRequest('save_notes', payload);
      if (res && res.success) {
        setSuccessMsg(isEdit ? 'Unit updated successfully.' : 'Unit created successfully.');
        setUnitModal({ isOpen: false, mode: 'CREATE', unit: null });
        await loadNotesData();
      } else {
        setError(res?.error?.message || 'Failed to save unit.');
      }
    } catch (err) {
      setError('Network error saving unit.');
    }
  };

  const confirmDeleteUnit = (unit) => {
    const qCount = (unit.questions || []).length;
    const unitId = unit.unitId || unit.unit_id;
    const unitTitle = unit.unitTitle || unit.unit_title || 'Untitled Unit';
    setDeleteConfirm({
      isOpen: true,
      type: 'UNIT',
      id: unitId,
      title: unitTitle,
      extra: qCount > 0 ? `Warning: This unit contains ${qCount} question(s). All questions inside this unit will also be deleted.` : ''
    });
  };

  const executeDeleteUnit = async () => {
    const unitId = deleteConfirm.id;
    const remainingUnits = (activeNote?.units || []).filter((u) => (u.unitId || u.unit_id) !== unitId);

    const payload = {
      noteId: activeNote?.noteId || activeNote?.note_id,
      title: selectedCategory,
      class: String(selectedClass),
      subject: selectedSubject,
      units: remainingUnits
    };

    try {
      const res = await sendApiRequest('save_notes', payload);
      if (res && res.success) {
        setSuccessMsg('Unit deleted successfully.');
        setDeleteConfirm({ isOpen: false, type: null, id: null, title: '', extra: '' });
        await loadNotesData();
      } else {
        setError(res?.error?.message || 'Failed to delete unit.');
      }
    } catch (err) {
      setError('Network error deleting unit.');
    }
  };

  // -------------------------------------------------------------
  // PDF STUDY MATERIAL UPLOAD & DOWNLOAD ACTIONS (PRIVATE B2)
  // -------------------------------------------------------------
  const triggerPdfUpload = (unit) => {
    setTargetUploadUnit(unit);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handlePdfFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !targetUploadUnit) return;

    // 1. Validate File Type
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) {
      setError('Invalid file type. Only official PDF documents (.pdf) are allowed.');
      return;
    }

    // 2. Validate File Size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('File is too large. Maximum allowed size for PDF notes is 10MB.');
      return;
    }

    const unitKey = targetUploadUnit.unitId || targetUploadUnit.unit_id;
    setUploadingUnitId(unitKey);
    setError(null);
    setSuccessMsg(null);

    try {
      // 3. Upload to private B2 via Cloudflare Worker
      const uploadRes = await ApiService.uploadFile(user?.token, {
        file,
        category: 'notes',
        subId: unitKey
      });

      if (!uploadRes || !uploadRes.success || !uploadRes.data?.fileKey) {
        throw new Error(uploadRes?.error?.message || 'File upload failed. Please check network connection.');
      }

      const fileKey = uploadRes.data.fileKey;

      // 4. Update Unit Attachment Metadata and Persist to D1
      const currentUnits = [...(activeNote?.units || [])];
      const targetIdx = currentUnits.findIndex((u) => (u.unitId || u.unit_id) === unitKey);
      if (targetIdx !== -1) {
        currentUnits[targetIdx] = {
          ...currentUnits[targetIdx],
          attachmentUrl: fileKey,
          attachment_url: fileKey,
          attachmentName: file.name,
          attachment_name: file.name,
          attachmentSize: file.size,
          attachment_size: file.size
        };

        const payload = {
          noteId: activeNote?.noteId || activeNote?.note_id || `NOT_${selectedClass}_${selectedSubject.replace(/\//g, '_')}_${selectedCategory.replace(/\s+/g, '_')}`,
          title: selectedCategory,
          class: String(selectedClass),
          subject: selectedSubject,
          units: currentUnits
        };

        const saveRes = await sendApiRequest('save_notes', payload);
        if (saveRes && saveRes.success) {
          setSuccessMsg(`PDF "${file.name}" uploaded and attached to ${targetUploadUnit.unitTitle || 'unit'} successfully.`);
          await loadNotesData();
        } else {
          setError(saveRes?.error?.message || 'Failed to link uploaded PDF to unit.');
        }
      }
    } catch (err) {
      setError(err.message || 'Error uploading PDF. Please check your connection.');
    } finally {
      setUploadingUnitId(null);
      setTargetUploadUnit(null);
    }
  };

  const handleDownloadPdf = async (fileKey, fileName) => {
    if (!fileKey) return;
    setDownloadingKey(fileKey);
    setError(null);
    try {
      const res = await ApiService.downloadFile(user?.token, fileKey);
      if (res && res.success && res.data?.fileData) {
        openOrDownloadBase64File(res.data.fileData, res.data.contentType || 'application/pdf', fileName || 'study_notes.pdf');
      } else {
        setError(res?.error?.message || 'Failed to retrieve PDF from storage.');
      }
    } catch (err) {
      setError('Network error retrieving PDF file.');
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleRemovePdf = async (unit) => {
    const unitKey = unit.unitId || unit.unit_id;
    const currentUnits = [...(activeNote?.units || [])];
    const targetIdx = currentUnits.findIndex((u) => (u.unitId || u.unit_id) === unitKey);
    if (targetIdx === -1) return;

    currentUnits[targetIdx] = {
      ...currentUnits[targetIdx],
      attachmentUrl: null,
      attachment_url: null,
      attachmentName: null,
      attachment_name: null,
      attachmentSize: null,
      attachment_size: null
    };

    const payload = {
      noteId: activeNote?.noteId || activeNote?.note_id,
      title: selectedCategory,
      class: String(selectedClass),
      subject: selectedSubject,
      units: currentUnits
    };

    try {
      const res = await sendApiRequest('save_notes', payload);
      if (res && res.success) {
        setSuccessMsg('Attached PDF removed from unit.');
        await loadNotesData();
      } else {
        setError(res?.error?.message || 'Failed to remove attached PDF.');
      }
    } catch (err) {
      setError('Network error removing PDF.');
    }
  };

  // -------------------------------------------------------------
  // QUESTION ACTIONS
  // -------------------------------------------------------------
  const openCreateQuestionModal = (unitId) => {
    setQuestionForm({ questionText: '', answerText: '' });
    setQuestionModal({ isOpen: true, mode: 'CREATE', unitId, question: null });
  };

  const openEditQuestionModal = (unitId, question) => {
    setQuestionForm({
      questionText: question.questionText || question.question_text || '',
      answerText: question.answerText || question.answer_text || ''
    });
    setQuestionModal({ isOpen: true, mode: 'EDIT', unitId, question });
  };

  const handleSaveQuestionModal = async () => {
    if (!questionForm.questionText.trim()) {
      setError('Question text cannot be empty.');
      return;
    }
    if (!questionForm.answerText.trim()) {
      setError('Answer text cannot be empty.');
      return;
    }

    const { unitId, mode, question } = questionModal;
    const currentUnits = JSON.parse(JSON.stringify(activeNote?.units || []));
    const targetUnit = currentUnits.find((u) => (u.unitId || u.unit_id) === unitId);
    if (!targetUnit) {
      setError('Target unit not found. Please refresh and try again.');
      return;
    }

    if (!Array.isArray(targetUnit.questions)) targetUnit.questions = [];

    if (mode === 'EDIT') {
      const targetQId = question.questionId || question.question_id;
      const qIdx = targetUnit.questions.findIndex((q) => (q.questionId || q.question_id) === targetQId);
      if (qIdx !== -1) {
        targetUnit.questions[qIdx] = {
          ...targetUnit.questions[qIdx],
          questionText: questionForm.questionText.trim(),
          question_text: questionForm.questionText.trim(),
          answerText: questionForm.answerText.trim(),
          answer_text: questionForm.answerText.trim()
        };
      }
    } else {
      const newQId = 'QST_' + Date.now();
      targetUnit.questions.push({
        questionId: newQId,
        question_id: newQId,
        questionText: questionForm.questionText.trim(),
        question_text: questionForm.questionText.trim(),
        answerText: questionForm.answerText.trim(),
        answer_text: questionForm.answerText.trim(),
        order: targetUnit.questions.length + 1
      });
    }

    const payload = {
      noteId: activeNote?.noteId || activeNote?.note_id || `NOT_${selectedClass}_${selectedSubject.replace(/\//g, '_')}_${selectedCategory.replace(/\s+/g, '_')}`,
      title: selectedCategory,
      class: String(selectedClass),
      subject: selectedSubject,
      units: currentUnits
    };

    try {
      const res = await sendApiRequest('save_notes', payload);
      if (res && res.success) {
        setSuccessMsg(mode === 'EDIT' ? 'Question updated successfully.' : 'Question added successfully.');
        setQuestionModal({ isOpen: false, mode: 'CREATE', unitId: null, question: null });
        await loadNotesData();
      } else {
        setError(res?.error?.message || 'Failed to save question.');
      }
    } catch (err) {
      setError('Network error saving question.');
    }
  };

  const confirmDeleteQuestion = (unitId, question) => {
    const qId = question.questionId || question.question_id;
    const qText = question.questionText || question.question_text || '';
    setDeleteConfirm({
      isOpen: true,
      type: 'QUESTION',
      id: qId,
      unitId: unitId,
      title: qText.substring(0, 60) + (qText.length > 60 ? '...' : ''),
      extra: 'Are you sure you want to permanently delete this question and answer?'
    });
  };

  const executeDeleteQuestion = async () => {
    const { id: questionId, unitId } = deleteConfirm;
    const currentUnits = JSON.parse(JSON.stringify(activeNote?.units || []));
    const targetUnit = currentUnits.find((u) => (u.unitId || u.unit_id) === unitId);
    if (!targetUnit) return;

    targetUnit.questions = (targetUnit.questions || []).filter((q) => (q.questionId || q.question_id) !== questionId);

    const payload = {
      noteId: activeNote?.noteId || activeNote?.note_id,
      title: selectedCategory,
      class: String(selectedClass),
      subject: selectedSubject,
      units: currentUnits
    };

    try {
      const res = await sendApiRequest('save_notes', payload);
      if (res && res.success) {
        setSuccessMsg('Question deleted successfully.');
        setDeleteConfirm({ isOpen: false, type: null, id: null, title: '', extra: '' });
        await loadNotesData();
      } else {
        setError(res?.error?.message || 'Failed to delete question.');
      }
    } catch (err) {
      setError('Network error deleting question.');
    }
  };

  return (
    <div>
      {/* Hidden File Input for PDF Uploads to Private B2 */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={handlePdfFileSelected}
      />

      {/* 1. Header Toolbar (Class, Subject, Refresh) */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Class Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="notes-class-select" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                Class:
              </label>
              <select
                id="notes-class-select"
                className="filter-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                aria-label="Select Class"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls} {isTeacher ? '(Assigned)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="notes-subject-select" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                Subject:
              </label>
              <select
                id="notes-subject-select"
                className="filter-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                aria-label="Select Subject"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub} {isTeacher ? '(Assigned)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn-refresh"
              style={{ color: 'var(--slate-700)', background: '#ffffff', borderColor: 'var(--slate-200)' }}
              onClick={() => loadNotesData(true)}
              disabled={refreshing}
              aria-label="Refresh notes"
            >
              <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              className="btn-primary"
              style={{ width: 'auto', padding: '0 18px' }}
              onClick={openCreateUnitModal}
            >
              <Plus size={16} />
              <span>Add Unit</span>
            </button>
          </div>
        </div>

        {/* Category Pill Switcher */}
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--slate-100)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div className="category-pill-group">
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-500)', marginRight: '4px' }}>
              Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                <BookOpen size={14} />
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="search-box-container" style={{ minWidth: '240px' }}>
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              className="search-box-input"
              placeholder="Search units, questions, answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search study materials"
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert-banner alert-danger" role="alert" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} className="flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="alert-banner" style={{ background: 'var(--success-50)', border: '1px solid #a7f3d0', color: 'var(--success-700)', marginBottom: '20px' }}>
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* 2. Units & Questions Content View */}
      {loading ? (
        <div className="skeleton skeleton-card" style={{ height: '320px' }} />
      ) : displayedUnits.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '50%', marginBottom: '16px' }}>
            <BookOpen size={40} />
          </div>
          <h3 className="card-title" style={{ fontSize: '1.2rem' }}>
            {searchQuery ? 'No matching study materials found' : 'No study materials yet.'}
          </h3>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginBottom: '24px', maxWidth: '440px', margin: '0 auto 24px auto' }}>
            {searchQuery
              ? 'Try adjusting your search keywords.'
              : `Create structured units, questions, and answers for Class ${selectedClass} ${selectedSubject} (${selectedCategory}).`}
          </p>
          {!searchQuery && (
            <button
              className="btn-primary"
              style={{ width: 'auto', display: 'inline-flex', padding: '0 24px', margin: '0 auto' }}
              onClick={openCreateUnitModal}
            >
              <Plus size={16} />
              <span>Create First Unit</span>
            </button>
          )}
        </div>
      ) : (
        <div>
          {displayedUnits.map((unit) => {
            const unitKey = unit.unitId || unit.unit_id;
            const unitTitle = unit.unitTitle || unit.unit_title || 'Untitled Unit';
            const isExpanded = !!expandedUnits[unitKey];
            const questions = unit.questions || [];

            return (
              <div key={unitKey} className="unit-card">
                {/* Unit Header Bar */}
                <div className="unit-header-bar">
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
                    onClick={() => toggleUnit(unitKey)}
                  >
                    {isExpanded ? <ChevronDown size={20} color="var(--primary-600)" /> : <ChevronRight size={20} color="var(--slate-400)" />}
                    <div>
                      <div className="unit-title-text">
                        {unitTitle}
                      </div>
                      {unit.description && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                          {unit.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="unit-actions-group">
                    <span className="hero-chip" style={{ background: 'var(--slate-100)', color: 'var(--slate-700)', fontSize: '0.75rem' }}>
                      {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
                    </span>

                    <button
                      type="button"
                      className="btn-month-nav"
                      style={{
                        background: (unit.attachmentUrl || unit.attachment_url) ? '#f0fdf4' : '#ffffff',
                        color: (unit.attachmentUrl || unit.attachment_url) ? '#16a34a' : 'var(--primary-600)',
                        borderColor: (unit.attachmentUrl || unit.attachment_url) ? '#bbf7d0' : 'var(--primary-200)'
                      }}
                      onClick={() => triggerPdfUpload(unit)}
                      disabled={uploadingUnitId === unitKey}
                      aria-label={`Attach PDF to ${unitTitle}`}
                      title="Upload and attach official PDF document via private B2"
                    >
                      <Upload size={14} className={uploadingUnitId === unitKey ? 'spinner' : ''} />
                      <span>{uploadingUnitId === unitKey ? 'Uploading...' : (unit.attachmentUrl || unit.attachment_url ? 'Replace PDF' : 'Attach PDF')}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-month-nav"
                      style={{ background: '#ffffff', color: 'var(--primary-600)', borderColor: 'var(--primary-200)' }}
                      onClick={() => openCreateQuestionModal(unitKey)}
                      aria-label={`Add Question to ${unitTitle}`}
                    >
                      <Plus size={14} />
                      <span>Add Question</span>
                    </button>

                    <button
                      type="button"
                      className="btn-month-nav"
                      style={{ background: '#ffffff' }}
                      onClick={() => openEditUnitModal(unit)}
                      aria-label="Edit Unit"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      type="button"
                      className="btn-month-nav"
                      style={{ background: '#ffffff', color: 'var(--danger-600)' }}
                      onClick={() => confirmDeleteUnit(unit)}
                      aria-label="Delete Unit"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Question List Accordion Body */}
                {isExpanded && (
                  <div className="question-list">
                    {/* Attached PDF Document Banner (Private B2 Gateway) */}
                    {(unit.attachmentUrl || unit.attachment_url) && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                          border: '1px solid #bbf7d0',
                          borderRadius: '12px',
                          marginBottom: '16px',
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
                              {unit.attachmentName || unit.attachment_name || `${unitTitle} Material.pdf`}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                              Official Attached PDF Material
                              {(unit.attachmentSize || unit.attachment_size) ? ` • ${Math.round((unit.attachmentSize || unit.attachment_size) / 1024)} KB` : ''}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '0.8125rem', background: '#ffffff', color: '#166534', borderColor: '#86efac' }}
                            onClick={() => handleDownloadPdf(unit.attachmentUrl || unit.attachment_url, unit.attachmentName || unit.attachment_name)}
                            disabled={downloadingKey === (unit.attachmentUrl || unit.attachment_url)}
                          >
                            <Download size={14} className={downloadingKey === (unit.attachmentUrl || unit.attachment_url) ? 'spinner' : ''} />
                            <span>{downloadingKey === (unit.attachmentUrl || unit.attachment_url) ? 'Loading...' : 'Download / View'}</span>
                          </button>

                          <button
                            type="button"
                            className="btn-month-nav"
                            style={{ background: '#ffffff', color: 'var(--danger-600)', borderColor: 'var(--danger-200)' }}
                            onClick={() => handleRemovePdf(unit)}
                            title="Remove Attached PDF"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                    {questions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--slate-400)', fontSize: '0.875rem' }}>
                        No questions added to this unit yet.
                      </div>
                    ) : (
                      questions.map((qst, qIdx) => {
                        const qId = qst.questionId || qst.question_id || `q_${qIdx}`;
                        const qText = qst.questionText || qst.question_text || '';
                        const aText = qst.answerText || qst.answer_text || '';
                        const isCopied = !!copiedMap[qId];

                        return (
                          <div key={qId} className="question-item-card">
                            <div className="question-header-row">
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 }}>
                                <span className="question-badge">Q{qIdx + 1}</span>
                                <div className="question-text">{qText}</div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  className={`copy-answer-btn ${isCopied ? 'copied' : ''}`}
                                  onClick={() => handleCopyAnswer(qId, aText)}
                                  aria-label="Copy answer to clipboard"
                                >
                                  {isCopied ? <Check size={13} /> : <Copy size={13} />}
                                  <span>{isCopied ? 'Copied' : 'Copy Answer'}</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn-month-nav"
                                  style={{ padding: '4px 8px', minHeight: '32px' }}
                                  onClick={() => openEditQuestionModal(unitKey, qst)}
                                  aria-label="Edit Question"
                                >
                                  <Edit2 size={13} />
                                </button>

                                <button
                                  type="button"
                                  className="btn-month-nav"
                                  style={{ padding: '4px 8px', minHeight: '32px', color: 'var(--danger-600)' }}
                                  onClick={() => confirmDeleteQuestion(unitKey, qst)}
                                  aria-label="Delete Question"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Answer Box */}
                            <div className="answer-box">
                              {aText}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MODAL: CREATE / EDIT UNIT */}
      {/* ------------------------------------------------------------- */}
      {unitModal.isOpen && (
        <div className="notes-modal-backdrop" role="dialog" aria-modal="true">
          <div className="notes-modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                {unitModal.mode === 'EDIT' ? 'Edit Unit' : 'Create New Unit'}
              </h3>
              <button className="search-clear-btn" onClick={() => setUnitModal({ isOpen: false, mode: 'CREATE', unit: null })}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  Unit Title <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Unit 1: Introduction to IT & ITeS Industry"
                  value={unitForm.unitTitle}
                  onChange={(e) => setUnitForm({ ...unitForm, unitTitle: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Unit Number
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="1"
                    value={unitForm.unitNumber}
                    onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Brief summary of unit topics"
                    value={unitForm.description}
                    onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn-back-link"
                onClick={() => setUnitModal({ isOpen: false, mode: 'CREATE', unit: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0 22px' }}
                onClick={handleSaveUnitModal}
              >
                <Save size={16} />
                <span>{unitModal.mode === 'EDIT' ? 'Update Unit' : 'Save Unit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: CREATE / EDIT QUESTION */}
      {/* ------------------------------------------------------------- */}
      {questionModal.isOpen && (
        <div className="notes-modal-backdrop" role="dialog" aria-modal="true">
          <div className="notes-modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                {questionModal.mode === 'EDIT' ? 'Edit Question & Answer' : 'Add Question & Answer'}
              </h3>
              <button className="search-clear-btn" onClick={() => setQuestionModal({ isOpen: false, mode: 'CREATE', unitId: null, question: null })}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  Question Text <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <textarea
                  className="notes-textarea"
                  style={{ minHeight: '80px' }}
                  placeholder="Enter the question here..."
                  value={questionForm.questionText}
                  onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  Answer Text <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <textarea
                  className="notes-textarea"
                  style={{ minHeight: '140px' }}
                  placeholder="Enter the detailed answer or study notes here..."
                  value={questionForm.answerText}
                  onChange={(e) => setQuestionForm({ ...questionForm, answerText: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn-back-link"
                onClick={() => setQuestionModal({ isOpen: false, mode: 'CREATE', unitId: null, question: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0 22px' }}
                onClick={handleSaveQuestionModal}
              >
                <Save size={16} />
                <span>{questionModal.mode === 'EDIT' ? 'Update Question' : 'Add Question'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MODAL: DELETE CONFIRMATION */}
      {/* ------------------------------------------------------------- */}
      {deleteConfirm.isOpen && (
        <div className="notes-modal-backdrop" role="dialog" aria-modal="true">
          <div className="notes-modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'inline-flex', padding: '12px', background: 'var(--danger-50)', color: 'var(--danger-600)', borderRadius: '50%', marginBottom: '14px' }}>
              <Trash2 size={28} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '8px' }}>
              Delete {deleteConfirm.type === 'UNIT' ? 'Unit' : 'Question'}?
            </h3>

            <p style={{ color: 'var(--slate-600)', fontSize: '0.875rem', marginBottom: '8px' }}>
              <strong>{deleteConfirm.title}</strong>
            </p>

            {deleteConfirm.extra && (
              <p style={{ color: 'var(--danger-700)', fontSize: '0.8125rem', background: 'var(--danger-50)', padding: '10px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                {deleteConfirm.extra}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn-back-link"
                onClick={() => setDeleteConfirm({ isOpen: false, type: null, id: null, title: '', extra: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', background: 'var(--danger-600)', padding: '0 20px' }}
                onClick={deleteConfirm.type === 'UNIT' ? executeDeleteUnit : executeDeleteQuestion}
              >
                <Trash2 size={16} />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
