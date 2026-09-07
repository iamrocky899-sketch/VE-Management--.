import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';
import { sendApiRequest } from '../../api/client';
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Users,
  Save,
  Clock,
  ArrowRight,
  TrendingUp,
  X,
  Lock,
  Unlock,
  Eye,
  Check,
  ShieldCheck,
  Send
} from 'lucide-react';

export default function Marks({ onNavigate }) {
  const { user, isTeacher, isPrincipal, isAdmin } = useAuth();

  // Academic Year State
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2026-2027');

  // Class Options
  const availableClasses = useMemo(() => {
    if (isTeacher) {
      return user?.assignedClasses && user.assignedClasses.length > 0 ? user.assignedClasses : ['9', '10'];
    }
    return ['9', '10', '11', '12'];
  }, [isTeacher, user]);

  const [selectedClass, setSelectedClass] = useState(() => availableClasses[0] || '9');

  // Subject Options
  const availableSubjects = useMemo(() => {
    if (isTeacher) {
      return user?.assignedSubjects && user.assignedSubjects.length > 0
        ? user.assignedSubjects
        : ['IT/ITeS'];
    }
    return ['IT/ITeS', 'Employability Skills', 'General Science', 'Mathematics', 'English', 'Assamese'];
  }, [isTeacher, user]);

  const [selectedSubject, setSelectedSubject] = useState(() => availableSubjects[0] || 'IT/ITeS');

  // 4 Established Institutional Exams
  const EXAMS = [
    '1st Unit Test',
    'Half Yearly Examination',
    '2nd Unit Test',
    'Annual Examination'
  ];

  const [selectedExam, setSelectedExam] = useState(EXAMS[0]);
  const [examinationsList, setExaminationsList] = useState([]);

  // Exam Maximum Marks
  const maxTheory = selectedSubject === 'Employability Skills' ? 50 : 50;
  const maxPractical = selectedSubject === 'Employability Skills' ? 0 : 50;
  const maxTotal = selectedSubject === 'Employability Skills' ? 50 : 100;

  const [students, setStudents] = useState([]);
  const [existingMarks, setExistingMarks] = useState([]);
  const [marksMap, setMarksMap] = useState({}); // { [studentId]: { theory: '', practical: '' } }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('roll_asc');

  // Result Review & Publish Modal State (Admin / Principal)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [calculatedResults, setCalculatedResults] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  // Active Examination Meta
  const currentExamMeta = useMemo(() => {
    const found = examinationsList.find(
      (e) =>
        String(e.class) === String(selectedClass) &&
        (e.examName === selectedExam ||
          e.examName?.toLowerCase() === selectedExam.toLowerCase() ||
          e.examName?.includes(selectedExam))
    );
    return found || { status: 'OPEN', examName: selectedExam };
  }, [examinationsList, selectedClass, selectedExam]);

  const isExamLocked = currentExamMeta.status === 'LOCKED';
  const isExamPublished = currentExamMeta.status === 'PUBLISHED';
  const isTeacherReadOnly = isTeacher && (isExamLocked || isExamPublished);

  // Fetch Academic Years, Examinations, Students and Marks
  const loadMarksData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Parallel fetch of initial academic configuration
      const [stuRes, marksRes, examsRes, yearsRes] = await Promise.all([
        sendApiRequest('get_students', { class: selectedClass }),
        sendApiRequest('get_marks', {
          class: selectedClass,
          exam: selectedExam,
          subject: selectedSubject,
          academicYear: selectedYear
        }),
        sendApiRequest('get_examinations', { class: selectedClass, academicYear: selectedYear }),
        sendApiRequest('get_academic_years')
      ]);

      const stuList = stuRes?.data?.students || [];
      setStudents(stuList);

      const marksList = marksRes?.data?.marks || [];
      setExistingMarks(marksList);

      if (examsRes?.data?.examinations) {
        setExaminationsList(examsRes.data.examinations);
      }

      if (yearsRes?.data?.academicYears) {
        setAcademicYears(yearsRes.data.academicYears);
        if (yearsRes.data.activeYear && !selectedYear) {
          setSelectedYear(yearsRes.data.activeYear);
        }
      }

      // Build Marks Map
      const map = {};
      stuList.forEach((s) => {
        const found = marksList.find(
          (m) =>
            String(m.studentId) === String(s.studentId) &&
            (m.exam === selectedExam ||
              String(m.exam || '').toLowerCase().includes(selectedExam.toLowerCase().replace(' examination', '')))
        );
        map[s.studentId] = {
          theory: found && found.theory != null ? String(found.theory) : '',
          practical: found && found.practical != null ? String(found.practical) : ''
        };
      });
      setMarksMap(map);
    } catch (err) {
      setError('Unable to load marks register. Please check your network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMarksData();
  }, [selectedClass, selectedSubject, selectedExam, selectedYear]);

  // Update Theory / Practical for a Student
  const handleMarkChange = (studentId, field, val) => {
    if (isTeacherReadOnly) return;
    if (val !== '' && !/^\d+$/.test(val)) return;

    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: val
      }
    }));
  };

  // Filtered & Sorted Students
  const displayedStudents = useMemo(() => {
    let list = [...students];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => {
        const name = (s.name || s.studentName || '').toLowerCase();
        const roll = String(s.roll || '').toLowerCase();
        return name.includes(q) || roll.includes(q);
      });
    }

    list.sort((a, b) => {
      if (sortBy === 'roll_asc') {
        return (parseInt(a.roll, 10) || 0) - (parseInt(b.roll, 10) || 0);
      } else if (sortBy === 'roll_desc') {
        return (parseInt(b.roll, 10) || 0) - (parseInt(a.roll, 10) || 0);
      } else if (sortBy === 'name_asc') {
        return (a.name || a.studentName || '').localeCompare(b.name || b.studentName || '');
      } else if (sortBy === 'name_desc') {
        return (b.name || b.studentName || '').localeCompare(a.name || a.studentName || '');
      }
      return 0;
    });

    return list;
  }, [students, searchQuery, sortBy]);

  // Summary Metrics
  const summary = useMemo(() => {
    const total = students.length;
    let completed = 0;
    let totalScoreSum = 0;
    let scoredStudents = 0;

    students.forEach((s) => {
      const entry = marksMap[s.studentId] || { theory: '', practical: '' };
      const hasTheory = entry.theory !== '';
      const hasPractical = entry.practical !== '';

      if (hasTheory || hasPractical) {
        completed++;
        const tNum = parseInt(entry.theory, 10) || 0;
        const pNum = parseInt(entry.practical, 10) || 0;
        totalScoreSum += tNum + pNum;
        scoredStudents++;
      }
    });

    const pending = total - completed;
    const average = scoredStudents > 0 ? (totalScoreSum / scoredStudents).toFixed(1) : '0.0';

    return { total, completed, pending, average };
  }, [students, marksMap]);

  // Save Marks Mutation
  const handleSaveMarks = async () => {
    if (saving || isTeacherReadOnly) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const records = [];
    for (const s of students) {
      const entry = marksMap[s.studentId] || { theory: '', practical: '' };
      if (entry.theory === '' && entry.practical === '') continue;

      const theoryNum = entry.theory !== '' ? parseInt(entry.theory, 10) : 0;
      const practicalNum = entry.practical !== '' ? parseInt(entry.practical, 10) : 0;

      if (theoryNum < 0 || practicalNum < 0) {
        setError(`Marks cannot be negative for ${s.name || s.studentId}`);
        setSaving(false);
        return;
      }

      if (theoryNum > maxTheory) {
        setError(`Theory marks for ${s.name || s.studentId} exceed maximum (${maxTheory})`);
        setSaving(false);
        return;
      }

      if (practicalNum > maxPractical) {
        setError(`Practical marks for ${s.name || s.studentId} exceed maximum (${maxPractical})`);
        setSaving(false);
        return;
      }

      records.push({
        studentId: s.studentId,
        academicYear: selectedYear,
        class: String(selectedClass),
        section: s.section || 'A',
        subject: selectedSubject,
        exam: selectedExam,
        theory: theoryNum,
        practical: practicalNum,
        total: theoryNum + practicalNum,
        maxMarks: maxTotal,
        maxTheory: maxTheory,
        maxPractical: maxPractical
      });
    }

    if (records.length === 0) {
      setError('Please enter marks for at least one student before saving.');
      setSaving(false);
      return;
    }

    try {
      const res = await sendApiRequest('save_marks', {
        academicYear: selectedYear,
        class: String(selectedClass),
        subject: selectedSubject,
        exam: selectedExam,
        marks: records
      });

      if (res && res.success) {
        setSuccessMsg(
          `Marks saved successfully for Class ${selectedClass} - ${selectedSubject} (${records.length} records).`
        );
        await loadMarksData();
      } else {
        setError(res?.error?.message || 'Failed to save marks. Please check your input.');
      }
    } catch (err) {
      setError('Marks could not be saved. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  // Lifecycle Status Toggle (Admin/Principal)
  const handleToggleExamStatus = async (newStatus) => {
    try {
      const res = await sendApiRequest('set_examination_status', {
        class: selectedClass,
        examName: selectedExam,
        academicYear: selectedYear,
        status: newStatus
      });

      if (res && res.success) {
        setSuccessMsg(`Examination marked as ${newStatus}`);
        await loadMarksData(true);
      } else {
        setError(res?.error?.message || 'Failed to update exam status');
      }
    } catch (err) {
      setError('Network error updating exam status');
    }
  };

  // Open Review Results Modal (Admin / Principal)
  const handleOpenReviewModal = async () => {
    setIsReviewModalOpen(true);
    setReviewLoading(true);
    setReviewError(null);

    try {
      // Calculate latest results
      const res = await sendApiRequest('calculate_exam_results', {
        class: selectedClass,
        examName: selectedExam,
        academicYear: selectedYear
      });

      if (res && res.success && res.data) {
        // Fetch enriched result view
        const getRes = await sendApiRequest('get_exam_results', {
          class: selectedClass,
          examName: selectedExam,
          academicYear: selectedYear
        });
        setCalculatedResults(getRes?.data?.results || res.data.results || []);
      } else {
        setReviewError(res?.error?.message || 'Unable to calculate results');
      }
    } catch (err) {
      setReviewError('Connection error calculating results');
    } finally {
      setReviewLoading(false);
    }
  };

  // Publish Results (Admin / Principal)
  const handlePublishResults = async () => {
    setPublishLoading(true);
    try {
      const res = await sendApiRequest('publish_exam_results', {
        class: selectedClass,
        examName: selectedExam,
        academicYear: selectedYear
      });

      if (res && res.success) {
        setSuccessMsg(`Published ${res.data.publishedCount} official results for Class ${selectedClass} (${selectedExam})`);
        setIsReviewModalOpen(false);
        await loadMarksData(true);
      } else {
        setReviewError(res?.error?.message || 'Failed to publish results');
      }
    } catch (err) {
      setReviewError('Network error while publishing results');
    } finally {
      setPublishLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* 1. Header Toolbar (Session, Class, Subject, Exam) */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Academic Year Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                Session:
              </label>
              <select
                className="filter-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {academicYears.map((y) => (
                  <option key={y.yearId || y.yearName} value={y.yearName}>
                    {y.yearName} {y.isCurrent ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                Class:
              </label>
              <select
                className="filter-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls} {isTeacher ? '(Assigned)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                Subject:
              </label>
              <select
                className="filter-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                Exam:
              </label>
              <select
                className="filter-select"
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
              >
                {EXAMS.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exam Lifecycle & Admin Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                background: isExamPublished ? '#dbeafe' : (isExamLocked ? '#fef3c7' : '#dcfce7'),
                color: isExamPublished ? '#1d4ed8' : (isExamLocked ? '#b45309' : '#15803d'),
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {isExamPublished ? <ShieldCheck size={14} /> : (isExamLocked ? <Lock size={14} /> : <Check size={14} />)}
              {currentExamMeta.status || 'OPEN'}
            </span>

            {(isPrincipal || isAdmin) && (
              <>
                {!isExamLocked && !isExamPublished && (
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                    onClick={() => handleToggleExamStatus('LOCKED')}
                    title="Lock examination against further teacher modifications"
                  >
                    <Lock size={14} />
                    <span>Lock</span>
                  </button>
                )}
                {isExamLocked && (
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                    onClick={() => handleToggleExamStatus('OPEN')}
                    title="Re-open examination for modifications"
                  >
                    <Unlock size={14} />
                    <span>Unlock</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#059669', borderColor: '#059669' }}
                  onClick={handleOpenReviewModal}
                >
                  <TrendingUp size={14} />
                  <span>Review & Publish</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lock / Readonly Notice for Teachers */}
      {isTeacherReadOnly && (
        <div
          className="card"
          style={{
            background: isExamPublished ? '#eff6ff' : '#fffbeb',
            borderLeft: `4px solid ${isExamPublished ? '#3b82f6' : '#f59e0b'}`,
            padding: '14px 18px',
            marginBottom: '16px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <Lock size={20} color={isExamPublished ? '#1d4ed8' : '#b45309'} />
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: isExamPublished ? '#1e3a8a' : '#92400e' }}>
              {isExamPublished ? 'Examination Results Published' : 'Examination Marks Locked'}
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: isExamPublished ? '#1d4ed8' : '#b45309' }}>
              {isExamPublished
                ? 'Official results have been published and are visible to parents. Modifications can only be performed by the Principal / Administrator.'
                : 'Marks entry has been locked by administration. Contact the Principal if corrections are required.'}
            </p>
          </div>
        </div>
      )}

      {/* Success / Error Messages */}
      {successMsg && (
        <div
          className="card"
          style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', marginBottom: '16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div
          className="card"
          style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', marginBottom: '16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Metrics & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" style={{ marginBottom: '16px' }}>
        <div className="card" style={{ padding: '16px', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Enrolled</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>{summary.total}</div>
        </div>
        <div className="card" style={{ padding: '16px', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Marks Entered</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{summary.completed}</div>
        </div>
        <div className="card" style={{ padding: '16px', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Pending</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: summary.pending > 0 ? '#f59e0b' : '#64748b' }}>{summary.pending}</div>
        </div>
        <div className="card" style={{ padding: '16px', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Class Average</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6' }}>{summary.average} / {maxTotal}</div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="card" style={{ padding: '16px 20px', borderRadius: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '240px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search student by name or roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-outline"
            onClick={() => loadMarksData(true)}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          {!isTeacherReadOnly && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveMarks}
              disabled={saving}
            >
              <Save size={15} />
              <span>{saving ? 'Saving...' : 'Save Marks'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="card skeleton" style={{ height: '320px', borderRadius: '16px' }} />
      )}

      {/* 3. Student Marks Table */}
      {!loading && displayedStudents.length > 0 && (
        <div className="students-table-wrapper card" style={{ borderRadius: '16px', padding: 0, overflow: 'hidden' }}>
          <table className="students-table">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ width: '80px' }}>Roll</th>
                <th>Student Name</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Theory ({maxTheory}M)</th>
                {maxPractical > 0 && <th style={{ width: '140px', textAlign: 'center' }}>Practical ({maxPractical}M)</th>}
                <th style={{ width: '120px', textAlign: 'center' }}>Total ({maxTotal}M)</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.map((s) => {
                const entry = marksMap[s.studentId] || { theory: '', practical: '' };
                const tNum = entry.theory !== '' ? parseInt(entry.theory, 10) : null;
                const pNum = entry.practical !== '' ? parseInt(entry.practical, 10) : null;
                const total = (tNum !== null ? tNum : 0) + (pNum !== null ? pNum : 0);
                const hasScore = tNum !== null || pNum !== null;

                const isTheoryError = tNum !== null && (tNum < 0 || tNum > maxTheory);
                const isPracticalError = pNum !== null && (pNum < 0 || pNum > maxPractical);

                return (
                  <tr key={s.studentId}>
                    <td>
                      <span className="roll-badge">{s.roll ? `#${s.roll}` : '--'}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{s.name || s.studentName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {s.studentId}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="text"
                        disabled={isTeacherReadOnly}
                        value={entry.theory}
                        onChange={(e) => handleMarkChange(s.studentId, 'theory', e.target.value)}
                        placeholder="0"
                        style={{
                          width: '70px',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: `1px solid ${isTheoryError ? '#dc2626' : '#cbd5e1'}`,
                          textAlign: 'center',
                          fontWeight: 700,
                          background: isTeacherReadOnly ? '#f1f5f9' : (isTheoryError ? '#fee2e2' : '#ffffff')
                        }}
                      />
                    </td>
                    {maxPractical > 0 && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="text"
                          disabled={isTeacherReadOnly}
                          value={entry.practical}
                          onChange={(e) => handleMarkChange(s.studentId, 'practical', e.target.value)}
                          placeholder="0"
                          style={{
                            width: '70px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${isPracticalError ? '#dc2626' : '#cbd5e1'}`,
                            textAlign: 'center',
                            fontWeight: 700,
                            background: isTeacherReadOnly ? '#f1f5f9' : (isPracticalError ? '#fee2e2' : '#ffffff')
                          }}
                        />
                      </td>
                    )}
                    <td style={{ textAlign: 'center', fontWeight: 800, color: hasScore ? '#1e3a8a' : '#94a3b8' }}>
                      {hasScore ? `${total}` : '--'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          background: hasScore ? '#dcfce7' : '#f1f5f9',
                          color: hasScore ? '#15803d' : '#94a3b8',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        {hasScore ? 'Entered' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Review & Publish Modal */}
      {isReviewModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '780px', padding: '28px', borderRadius: '20px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
                  Official Result Review & Publishing
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Class {selectedClass} • {selectedExam} ({selectedYear})
                </p>
              </div>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '6px', border: 'none' }}
                onClick={() => setIsReviewModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {reviewError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {reviewError}
              </div>
            )}

            {reviewLoading ? (
              <div className="card skeleton" style={{ height: '240px', borderRadius: '12px' }} />
            ) : (
              <div>
                <div style={{ maxHeight: '360px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '10px 14px' }}>Roll</th>
                        <th style={{ padding: '10px 14px' }}>Student</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center' }}>Total Score</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center' }}>Percentage</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center' }}>Grade</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatedResults.map((r) => (
                        <tr key={r.resultId || r.studentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>#{r.rollNo || '--'}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.studentName}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>
                            {r.totalMarks} / {r.maxMarks}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#1e3a8a' }}>
                            {r.percentage}%
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span
                              style={{
                                background: r.grade === 'A+' || r.grade === 'A' ? '#dcfce7' : (r.grade === 'B+' || r.grade === 'B' ? '#dbeafe' : '#fef3c7'),
                                color: r.grade === 'A+' || r.grade === 'A' ? '#15803d' : (r.grade === 'B+' || r.grade === 'B' ? '#1d4ed8' : '#b45309'),
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 800,
                                fontSize: '0.8rem'
                              }}
                            >
                              {r.grade}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{ background: r.resultStatus === 'PUBLISHED' ? '#dbeafe' : '#f1f5f9', color: r.resultStatus === 'PUBLISHED' ? '#1d4ed8' : '#64748b', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {r.resultStatus || 'CALCULATED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Publishing makes official gradebooks accessible on the Parent Portal.
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => setIsReviewModalOpen(false)}
                      disabled={publishLoading}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ background: '#10b981', borderColor: '#10b981' }}
                      onClick={handlePublishResults}
                      disabled={publishLoading}
                    >
                      <Send size={15} />
                      <span>{publishLoading ? 'Publishing...' : 'Publish Official Results'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
