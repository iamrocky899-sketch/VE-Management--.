import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';
import { sendApiRequest } from '../../api/client';
import {
  School,
  BookOpen,
  Users,
  Award,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  FileText,
  ArrowRight,
  Sparkles,
  Plus,
  Layers,
  Search,
  Filter,
  Copy,
  Archive,
  Check,
  X,
  Edit,
  Eye,
  Calendar,
  ChevronRight,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  BookMarked,
  Sliders,
  CheckSquare,
  Square
} from 'lucide-react';

export default function Classes({ onNavigate }) {
  const { user, isPrincipal, isAdmin, isTeacher } = useAuth();
  const isSuperAdmin = isAdmin || isPrincipal;

  // Active Tab: 'curriculum', 'subjects', 'classes', 'history'
  const [activeTab, setActiveTab] = useState('curriculum');

  // Master Data States
  const [curriculaList, setCurriculaList] = useState([]);
  const [subjectMasterList, setSubjectMasterList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [academicYears, setAcademicYears] = useState(['2026-2027', '2025-2026']);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026-2027');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters for Curriculum Tab
  const [currClassFilter, setCurrClassFilter] = useState('ALL');
  const [currStatusFilter, setCurrStatusFilter] = useState('ALL');
  const [currStreamFilter, setCurrStreamFilter] = useState('ALL');

  // Filters for Subjects Tab
  const [subjSearchQuery, setSubjSearchQuery] = useState('');
  const [subjClassFilter, setSubjClassFilter] = useState('ALL');
  const [subjStatusFilter, setSubjStatusFilter] = useState('ALL');

  // Modal 1: 360° Curriculum Details Drawer
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);
  const [curriculumProfileData, setCurriculumProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Modal 2: Curriculum Builder Wizard
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderStep, setBuilderStep] = useState(1);
  const [builderForm, setBuilderForm] = useState({
    academicYear: '2026-2027',
    class: '10',
    sectionScope: 'ALL',
    stream: 'Vocational IT/ITeS',
    trade: 'IT/ITeS',
    curriculumName: 'Class 10 IT/ITeS Curriculum (2026-2027)',
    status: 'DRAFT',
    subjects: []
  });
  const [builderError, setBuilderError] = useState(null);
  const [builderLoading, setBuilderLoading] = useState(false);

  // Modal 3: Add / Edit Subject Master
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    subjectId: '',
    subjectCode: 'IT-402',
    subjectName: 'Information Technology / ITeS',
    class: '10',
    stream: 'Vocational',
    trade: 'IT/ITeS',
    component: 'BOTH',
    theoryMaxMarks: 70,
    practicalMaxMarks: 30,
    maxMarks: 100,
    isMandatory: true,
    displayOrder: 1,
    description: '',
    status: 'Active'
  });
  const [subjectModalLoading, setSubjectModalLoading] = useState(false);
  const [subjectModalError, setSubjectModalError] = useState(null);

  // Modal 4: Duplicate Curriculum to New Academic Year
  const [duplicateModalSource, setDuplicateModalSource] = useState(null);
  const [targetDuplicateYear, setTargetDuplicateYear] = useState('2027-2028');
  const [duplicateLoading, setDuplicateLoading] = useState(false);

  // Modal 5: Edit Class & Section Modal
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classForm, setClassForm] = useState(null);
  const [classLoading, setClassLoading] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch all core academic data
  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Curricula List
      const currRes = await sendApiRequest('get_curriculum_list', { academicYear: selectedAcademicYear, allClasses: true });
      if (currRes && currRes.success && currRes.data) {
        setCurriculaList(currRes.data.curricula || []);
      }

      // 2. Subject Master
      const subjRes = await sendApiRequest('get_subject_master');
      if (subjRes && subjRes.success && subjRes.data) {
        setSubjectMasterList(subjRes.data.subjects || []);
      }

      // 3. Classes
      const clsRes = await sendApiRequest('get_classes');
      if (clsRes && clsRes.success && clsRes.data) {
        setClassesList(clsRes.data.classes || []);
      }

      // 4. Academic Years
      const yrsRes = await sendApiRequest('get_academic_years');
      if (yrsRes && yrsRes.success && yrsRes.data && yrsRes.data.academicYears) {
        const yrs = yrsRes.data.academicYears.map(y => y.yearName || y.yearId).filter(Boolean);
        if (yrs.length > 0) setAcademicYears(yrs);
      }
    } catch (err) {
      setError('Unable to load curriculum and academic structure from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedAcademicYear]);

  // Filtered Curricula
  const filteredCurricula = useMemo(() => {
    let list = [...curriculaList];
    if (currClassFilter !== 'ALL') {
      list = list.filter(c => String(c.class) === currClassFilter);
    }
    if (currStatusFilter !== 'ALL') {
      list = list.filter(c => String(c.status).toUpperCase() === currStatusFilter);
    }
    if (currStreamFilter !== 'ALL') {
      list = list.filter(c => String(c.stream || '').toLowerCase().includes(currStreamFilter.toLowerCase()));
    }
    return list;
  }, [curriculaList, currClassFilter, currStatusFilter, currStreamFilter]);

  // Filtered Subjects Master
  const filteredSubjects = useMemo(() => {
    let list = [...subjectMasterList];
    if (subjSearchQuery.trim()) {
      const q = subjSearchQuery.toLowerCase().trim();
      list = list.filter(s =>
        (s.subjectName || '').toLowerCase().includes(q) ||
        (s.subjectCode || '').toLowerCase().includes(q) ||
        (s.stream || '').toLowerCase().includes(q)
      );
    }
    if (subjClassFilter !== 'ALL') {
      list = list.filter(s => String(s.class) === subjClassFilter);
    }
    if (subjStatusFilter !== 'ALL') {
      list = list.filter(s => (s.status || 'Active').toUpperCase() === subjStatusFilter.toUpperCase());
    }
    return list;
  }, [subjectMasterList, subjSearchQuery, subjClassFilter, subjStatusFilter]);

  // 360° Curriculum Profile Drawer
  const handleOpenCurriculumProfile = async (currId) => {
    setSelectedCurriculumId(currId);
    setProfileLoading(true);
    setCurriculumProfileData(null);

    try {
      const res = await sendApiRequest('get_curriculum_profile', { curriculumId: currId });
      if (res && res.success && res.data) {
        setCurriculumProfileData(res.data);
      } else {
        showToast(res?.error?.message || 'Failed to load curriculum details.');
      }
    } catch (e) {
      showToast('Error connecting to school server.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Publish Curriculum
  const handlePublishCurriculum = (curr) => {
    setConfirmModal({
      title: 'Publish Curriculum',
      message: `Are you sure you want to publish "${curr.curriculumName}"? Any previously published curriculum for Class ${curr.class} (${curr.academicYear}) will be safely archived.`,
      confirmText: 'Publish Curriculum',
      isDanger: false,
      onConfirm: async () => {
        try {
          const res = await sendApiRequest('publish_curriculum', { curriculumId: curr.curriculumId });
          if (res && res.success) {
            showToast('Curriculum published successfully.');
            fetchData();
          } else {
            showToast(res?.error?.message || 'Failed to publish curriculum.');
          }
        } catch (e) {
          showToast('Server communication error.');
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  // Archive Curriculum
  const handleArchiveCurriculum = (curr) => {
    setConfirmModal({
      title: 'Archive Curriculum',
      message: `Archive "${curr.curriculumName}"? Historical academic records and past marksheets will remain intact.`,
      confirmText: 'Archive',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await sendApiRequest('archive_curriculum', { curriculumId: curr.curriculumId });
          if (res && res.success) {
            showToast('Curriculum archived successfully.');
            fetchData();
          } else {
            showToast(res?.error?.message || 'Failed to archive curriculum.');
          }
        } catch (e) {
          showToast('Server communication error.');
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  // Duplicate to Year Submit
  const handleDuplicateSubmit = async () => {
    if (!duplicateModalSource) return;
    setDuplicateLoading(true);
    try {
      const res = await sendApiRequest('duplicate_curriculum_to_year', {
        sourceCurriculumId: duplicateModalSource.curriculumId,
        targetAcademicYear: targetDuplicateYear
      });
      if (res && res.success) {
        showToast(res.message || 'Curriculum duplicated successfully.');
        setDuplicateModalSource(null);
        fetchData();
      } else {
        showToast(res?.error?.message || 'Failed to duplicate curriculum.');
      }
    } catch (e) {
      showToast('Server error during duplication.');
    } finally {
      setDuplicateLoading(false);
    }
  };

  // Subject Master Create/Edit Submit
  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    setSubjectModalError(null);
    setSubjectModalLoading(true);

    try {
      const payload = {
        ...subjectForm,
        hasTheory: subjectForm.component === 'THEORY' || subjectForm.component === 'BOTH',
        hasPractical: subjectForm.component === 'PRACTICAL' || subjectForm.component === 'BOTH',
        theoryMaxMarks: subjectForm.component === 'PRACTICAL' ? 0 : parseInt(subjectForm.theoryMaxMarks, 10),
        practicalMaxMarks: subjectForm.component === 'THEORY' ? 0 : parseInt(subjectForm.practicalMaxMarks, 10),
        maxMarks: parseInt(subjectForm.maxMarks, 10)
      };

      const res = await sendApiRequest('save_subject_master', payload);
      if (res && res.success) {
        showToast('Subject saved successfully.');
        setIsSubjectModalOpen(false);
        fetchData();
      } else {
        setSubjectModalError(res?.error?.message || 'Failed to save subject.');
      }
    } catch (err) {
      setSubjectModalError('Server communication error.');
    } finally {
      setSubjectModalLoading(false);
    }
  };

  // Toggle Subject Status
  const handleToggleSubjectStatus = async (subject) => {
    const nextStatus = (subject.status || 'Active').toLowerCase() === 'active' ? 'Inactive' : 'Active';
    try {
      const res = await sendApiRequest('set_subject_status', { subjectId: subject.subjectId, status: nextStatus });
      if (res && res.success) {
        showToast(`Subject marked as ${nextStatus}`);
        fetchData();
      } else {
        showToast(res?.error?.message || 'Failed to update subject status.');
      }
    } catch (e) {
      showToast('Server error.');
    }
  };

  // Curriculum Builder Handlers
  const handleOpenBuilder = (existingCurr = null) => {
    setBuilderError(null);
    setBuilderStep(1);

    if (existingCurr) {
      setBuilderForm({
        curriculumId: existingCurr.curriculumId,
        academicYear: existingCurr.academicYear,
        class: String(existingCurr.class),
        sectionScope: existingCurr.sectionScope || 'ALL',
        stream: existingCurr.stream || 'Vocational IT/ITeS',
        trade: existingCurr.trade || 'IT/ITeS',
        curriculumName: existingCurr.curriculumName,
        status: existingCurr.status || 'DRAFT',
        subjects: existingCurr.subjects || []
      });
    } else {
      // Default prepopulate subjects for Class 10
      const defaultSubs = subjectMasterList.filter(s => String(s.class) === '10').map((s, idx) => ({
        subjectId: s.subjectId,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        component: (s.hasTheory && s.hasPractical) ? 'BOTH' : (s.hasPractical ? 'PRACTICAL' : 'THEORY'),
        theoryMaxMarks: s.theoryMaxMarks || (s.hasTheory ? 70 : 0),
        practicalMaxMarks: s.practicalMaxMarks || (s.hasPractical ? 30 : 0),
        totalMaxMarks: s.maxMarks || 100,
        isMandatory: s.isMandatory !== false,
        isOptional: s.isMandatory === false,
        displayOrder: idx + 1
      }));

      setBuilderForm({
        academicYear: selectedAcademicYear,
        class: '10',
        sectionScope: 'ALL',
        stream: 'Vocational IT/ITeS',
        trade: 'IT/ITeS',
        curriculumName: `Class 10 IT/ITeS Curriculum (${selectedAcademicYear})`,
        status: 'DRAFT',
        subjects: defaultSubs.length > 0 ? defaultSubs : [
          { subjectCode: 'IT-402', subjectName: 'Information Technology / ITeS', component: 'BOTH', theoryMaxMarks: 70, practicalMaxMarks: 30, totalMaxMarks: 100, isMandatory: true, isOptional: false, displayOrder: 1 },
          { subjectCode: 'ES-101', subjectName: 'Employability Skills', component: 'THEORY', theoryMaxMarks: 50, practicalMaxMarks: 0, totalMaxMarks: 50, isMandatory: true, isOptional: false, displayOrder: 2 }
        ]
      });
    }

    setIsBuilderOpen(true);
  };

  const handleSaveBuilder = async (publishImmediately = false) => {
    setBuilderError(null);
    setBuilderLoading(true);

    try {
      const payload = {
        ...builderForm,
        status: publishImmediately ? 'PUBLISHED' : builderForm.status || 'DRAFT'
      };

      const res = await sendApiRequest('save_curriculum', payload);
      if (res && res.success) {
        showToast(res.message || 'Curriculum saved successfully.');
        setIsBuilderOpen(false);
        fetchData();
      } else {
        setBuilderError(res?.error?.message || 'Failed to save curriculum.');
      }
    } catch (err) {
      setBuilderError('Server communication error.');
    } finally {
      setBuilderLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: 'var(--primary)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER & SUMMARY BAR */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 6px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <School size={28} style={{ color: 'var(--primary)' }} />
              <span>Curriculum & Academic Structure</span>
            </h1>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', margin: 0 }}>
              Gameri Higher Secondary School — Authoritative Academic Hierarchy, Curriculum Versions & Subject Master Catalog.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Academic Session Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card-bg)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>SESSION:</span>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
              >
                {academicYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fetchData(true)}
              className="btn-secondary"
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
            >
              <RefreshCw size={15} className={refreshing ? 'spin-anim' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {isSuperAdmin && (
              <>
                <button
                  onClick={() => {
                    setSubjectForm({
                      subjectId: '',
                      subjectCode: 'IT-402',
                      subjectName: '',
                      class: '10',
                      stream: 'Vocational',
                      trade: 'IT/ITeS',
                      component: 'BOTH',
                      theoryMaxMarks: 70,
                      practicalMaxMarks: 30,
                      maxMarks: 100,
                      isMandatory: true,
                      displayOrder: 1,
                      description: '',
                      status: 'Active'
                    });
                    setSubjectModalError(null);
                    setIsSubjectModalOpen(true);
                  }}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                >
                  <Plus size={16} />
                  <span>Add Subject</span>
                </button>

                <button
                  onClick={() => handleOpenBuilder()}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px' }}
                >
                  <Layers size={16} />
                  <span>Create Curriculum</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* METRICS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Curricula</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                {curriculaList.filter(c => (c.status || 'PUBLISHED').toUpperCase() === 'PUBLISHED').length}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Master Subjects</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>{subjectMasterList.length}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <School size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic Classes</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>{classesList.length || 4}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Vocational Stream</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>IT / ITeS</div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          onClick={() => setActiveTab('curriculum')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: activeTab === 'curriculum' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            color: activeTab === 'curriculum' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Layers size={16} />
          <span>Curriculum ({curriculaList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: activeTab === 'subjects' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            color: activeTab === 'subjects' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <BookOpen size={16} />
          <span>Subject Master ({subjectMasterList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: activeTab === 'classes' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            color: activeTab === 'classes' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <School size={16} />
          <span>Class Structure ({classesList.length || 4})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: activeTab === 'history' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Clock size={16} />
          <span>Curriculum History</span>
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '14px 18px', borderRadius: '12px', color: '#991b1b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: CURRICULUM MANAGEMENT */}
      {activeTab === 'curriculum' && (
        <div>
          {/* CURRICULUM FILTERS */}
          <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'center' }}>
              <div>
                <select className="input-field" value={currClassFilter} onChange={(e) => setCurrClassFilter(e.target.value)} style={{ height: '40px' }}>
                  <option value="ALL">All Classes</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>

              <div>
                <select className="input-field" value={currStatusFilter} onChange={(e) => setCurrStatusFilter(e.target.value)} style={{ height: '40px' }}>
                  <option value="ALL">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div>
                <select className="input-field" value={currStreamFilter} onChange={(e) => setCurrStreamFilter(e.target.value)} style={{ height: '40px' }}>
                  <option value="ALL">All Streams</option>
                  <option value="Vocational">Vocational IT/ITeS</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>
          </div>

          {/* CURRICULA TABLE */}
          {loading ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="spin-anim" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--primary)' }} />
              <div>Loading curriculum records...</div>
            </div>
          ) : filteredCurricula.length === 0 ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Layers size={36} style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.5 }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>No curriculum definitions found</div>
              <div style={{ fontSize: '0.85rem' }}>Create a curriculum using the "Create Curriculum" button.</div>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '14px 16px' }}>Curriculum Name & Class</th>
                      <th style={{ padding: '14px 16px' }}>Academic Year & Ver</th>
                      <th style={{ padding: '14px 16px' }}>Stream / Trade</th>
                      <th style={{ padding: '14px 16px' }}>Subjects & Components</th>
                      <th style={{ padding: '14px 16px' }}>Total Max Marks</th>
                      <th style={{ padding: '14px 16px' }}>Status</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCurricula.map((c) => {
                      const isPub = (c.status || 'PUBLISHED').toUpperCase() === 'PUBLISHED';
                      const isDraft = (c.status || '').toUpperCase() === 'DRAFT';

                      return (
                        <tr key={c.curriculumId} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                              {c.curriculumName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                              Class {c.class} (Scope: {c.sectionScope || 'ALL'})
                            </div>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.academicYear}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Version {c.version || 1}</div>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.stream}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trade: {c.trade}</div>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                                {c.subjectCount} Subjects
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                ({c.theorySubjectsCount} Th / {c.practicalSubjectsCount} Pr)
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--slate-900)' }}>{c.totalMaxMarks}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>Marks</span>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: isPub ? '#ecfdf5' : (isDraft ? '#fef3c7' : '#f1f5f9'),
                                color: isPub ? '#065f46' : (isDraft ? '#92400e' : '#64748b')
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPub ? '#10b981' : (isDraft ? '#f59e0b' : '#94a3b8') }}></span>
                              {c.status || 'DRAFT'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenCurriculumProfile(c.curriculumId)}
                                className="btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px' }}
                                title="View Curriculum Details"
                              >
                                <Eye size={14} />
                                <span style={{ marginLeft: '4px' }}>Inspect</span>
                              </button>

                              {isSuperAdmin && (
                                <>
                                  {isDraft && (
                                    <button
                                      onClick={() => handlePublishCurriculum(c)}
                                      className="btn-primary"
                                      style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', background: '#10b981' }}
                                      title="Publish this version"
                                    >
                                      <Check size={14} />
                                      <span style={{ marginLeft: '4px' }}>Publish</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setDuplicateModalSource(c);
                                      setTargetDuplicateYear(c.academicYear === '2026-2027' ? '2027-2028' : '2026-2027');
                                    }}
                                    className="btn-secondary"
                                    style={{ padding: '6px 8px', fontSize: '0.75rem', borderRadius: '8px' }}
                                    title="Duplicate to new academic year"
                                  >
                                    <Copy size={14} />
                                  </button>

                                  {isPub && (
                                    <button
                                      onClick={() => handleArchiveCurriculum(c)}
                                      className="btn-secondary"
                                      style={{ padding: '6px 8px', fontSize: '0.75rem', borderRadius: '8px', color: '#dc2626' }}
                                      title="Archive"
                                    >
                                      <Archive size={14} />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBJECT MASTER */}
      {activeTab === 'subjects' && (
        <div>
          {/* SEARCH & FILTERS */}
          <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', gridColumn: 'span 2' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search subjects by name, code, or stream..."
                  value={subjSearchQuery}
                  onChange={(e) => setSubjSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px', height: '40px' }}
                />
              </div>

              <div>
                <select className="input-field" value={subjClassFilter} onChange={(e) => setSubjClassFilter(e.target.value)} style={{ height: '40px' }}>
                  <option value="ALL">All Classes</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>

              <div>
                <select className="input-field" value={subjStatusFilter} onChange={(e) => setSubjStatusFilter(e.target.value)} style={{ height: '40px' }}>
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* SUBJECTS TABLE */}
          {filteredSubjects.length === 0 ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookOpen size={36} style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.5 }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>No subjects found</div>
              <div style={{ fontSize: '0.85rem' }}>Create subjects using the "Add Subject" button.</div>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '14px 16px' }}>Subject Code & Name</th>
                      <th style={{ padding: '14px 16px' }}>Class</th>
                      <th style={{ padding: '14px 16px' }}>Stream / Trade</th>
                      <th style={{ padding: '14px 16px' }}>Component Breakdown</th>
                      <th style={{ padding: '14px 16px' }}>Type</th>
                      <th style={{ padding: '14px 16px' }}>Status</th>
                      {isSuperAdmin && <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubjects.map((s) => {
                      const isActive = (s.status || 'Active').toLowerCase() === 'active';
                      const hasTh = s.hasTheory !== false;
                      const hasPr = s.hasPractical === true;

                      return (
                        <tr key={s.subjectId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                              {s.subjectName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              Code: {s.subjectCode}
                            </div>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                              Class {s.class}
                            </span>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.stream || 'Vocational'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.trade || 'IT/ITeS'}</div>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              {hasTh && (
                                <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                                  Th: {s.theoryMaxMarks || 70}
                                </span>
                              )}
                              {hasPr && (
                                <span style={{ background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                                  Pr: {s.practicalMaxMarks || 30}
                                </span>
                              )}
                              <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--slate-900)', marginLeft: '2px' }}>
                                = {s.maxMarks || 100} Total
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: s.isMandatory !== false ? '#eff6ff' : '#fef3c7',
                                color: s.isMandatory !== false ? '#1d4ed8' : '#b45309'
                              }}
                            >
                              {s.isMandatory !== false ? 'Mandatory' : 'Optional'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: isActive ? '#ecfdf5' : '#fef2f2',
                                color: isActive ? '#065f46' : '#991b1b'
                              }}
                            >
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {isSuperAdmin && (
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  onClick={() => {
                                    setSubjectForm({
                                      ...s,
                                      component: (s.hasTheory && s.hasPractical) ? 'BOTH' : (s.hasPractical ? 'PRACTICAL' : 'THEORY')
                                    });
                                    setSubjectModalError(null);
                                    setIsSubjectModalOpen(true);
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '6px 8px', fontSize: '0.75rem', borderRadius: '8px' }}
                                  title="Edit Subject"
                                >
                                  <Edit size={14} />
                                </button>

                                <button
                                  onClick={() => handleToggleSubjectStatus(s)}
                                  className="btn-secondary"
                                  style={{ padding: '6px 8px', fontSize: '0.75rem', borderRadius: '8px', color: isActive ? '#dc2626' : '#10b981' }}
                                  title={isActive ? 'Deactivate' : 'Activate'}
                                >
                                  {isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLASS & SECTION STRUCTURE */}
      {activeTab === 'classes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {classesList.map((cls) => {
            let sections = ['A'];
            try {
              sections = Array.isArray(cls.sections) ? cls.sections : JSON.parse(cls.sections);
            } catch (e) {
              sections = String(cls.sections || 'A').split(',').map(s => s.trim());
            }

            const classSubjects = subjectMasterList.filter(s => String(s.class) === String(cls.gradeLevel));

            return (
              <div key={cls.classId} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 4px 0' }}>
                        {cls.className || `Class ${cls.gradeLevel}`}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Grade Level: {cls.gradeLevel} • Stream: {cls.stream || 'Vocational IT/ITeS'}
                      </div>
                    </div>

                    <span
                      style={{
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: 'var(--primary)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 800
                      }}
                    >
                      Class {cls.gradeLevel}
                    </span>
                  </div>

                  {/* SECTIONS */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Configured Sections ({sections.length})
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {sections.map(sec => (
                        <span key={sec} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                          Section {sec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* SUBJECTS SUMMARY */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Associated Subjects ({classSubjects.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {classSubjects.slice(0, 3).map(s => (
                        <div key={s.subjectId} style={{ fontSize: '0.78rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>• {s.subjectName}</span>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{s.maxMarks}m</span>
                        </div>
                      ))}
                      {classSubjects.length > 3 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                          +{classSubjects.length - 3} more subjects
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setCurrClassFilter(String(cls.gradeLevel));
                      setActiveTab('curriculum');
                    }}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
                  >
                    View Curriculum
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: CURRICULUM HISTORY */}
      {activeTab === 'history' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 16px 0' }}>
            Multi-Year Curriculum Evolution & Timeline
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {curriculaList.map(curr => (
              <div key={curr.curriculumId} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--slate-900)' }}>
                      {curr.curriculumName}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                      v{curr.version || 1}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: curr.status === 'PUBLISHED' ? '#ecfdf5' : '#f1f5f9', color: curr.status === 'PUBLISHED' ? '#047857' : '#64748b' }}>
                      {curr.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Academic Session: {curr.academicYear} • Class {curr.class} • Stream: {curr.stream} • {curr.subjectCount} Subjects ({curr.totalMaxMarks} Total Marks)
                  </div>
                </div>

                <button
                  onClick={() => handleOpenCurriculumProfile(curr.curriculumId)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
                >
                  Inspect Snapshot
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: 360° CURRICULUM DETAILS DRAWER */}
      {selectedCurriculumId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            {profileLoading || !curriculumProfileData ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={28} className="spin-anim" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--primary)' }} />
                <div>Loading curriculum details...</div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 4px 0' }}>
                      {curriculumProfileData.curriculum?.curriculumName}
                    </h2>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Academic Session: <strong>{curriculumProfileData.curriculum?.academicYear}</strong> • Class: <strong>{curriculumProfileData.curriculum?.class}</strong> • Stream: <strong>{curriculumProfileData.curriculum?.stream}</strong>
                    </div>
                  </div>

                  <button onClick={() => setSelectedCurriculumId(null)} className="btn-secondary" style={{ padding: '6px', borderRadius: '8px' }}>
                    <X size={18} />
                  </button>
                </div>

                {/* SUBJECTS LIST */}
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 10px 0' }}>
                  Mapped Curriculum Subjects ({curriculumProfileData.subjects?.length || 0})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {curriculumProfileData.subjects?.map(s => (
                    <div key={s.curriculumSubjectId} style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '0.88rem' }}>
                          {s.displayOrder}. {s.subjectName} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace' }}>({s.subjectCode})</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Component: <strong>{s.component}</strong> • Theory: {s.theoryMaxMarks}m • Practical: {s.practicalMaxMarks}m
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: 'var(--slate-900)', fontSize: '0.9rem' }}>
                          {s.totalMaxMarks} Marks
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: s.isMandatory !== false ? '#eff6ff' : '#fef3c7', color: s.isMandatory !== false ? '#1d4ed8' : '#b45309' }}>
                          {s.isMandatory !== false ? 'Mandatory' : 'Optional'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ACTIVE TEACHER ASSIGNMENTS */}
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 10px 0' }}>
                  Active Faculty Assignments ({curriculumProfileData.teacherAssignments?.length || 0})
                </h3>

                {curriculumProfileData.teacherAssignments?.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', background: '#f8fafc', borderRadius: '10px' }}>
                    No teacher assignments mapped for this curriculum context yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {curriculumProfileData.teacherAssignments.map(a => (
                      <div key={a.assignmentId} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <strong>{a.staffName}</strong> • {a.subject} (Section {a.section})
                        </div>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{a.assignmentType}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: GUIDED CURRICULUM BUILDER WIZARD */}
      {isBuilderOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                Curriculum Builder Wizard (Step {builderStep} of 3)
              </h3>
              <button onClick={() => setIsBuilderOpen(false)} className="btn-secondary" style={{ padding: '6px', borderRadius: '8px' }}>
                <X size={18} />
              </button>
            </div>

            {builderError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} />
                <span>{builderError}</span>
              </div>
            )}

            {/* STEP 1: CONTEXT */}
            {builderStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="input-label">Academic Session *</label>
                    <select
                      className="input-field"
                      value={builderForm.academicYear}
                      onChange={(e) => setBuilderForm({ ...builderForm, academicYear: e.target.value })}
                    >
                      {academicYears.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="input-label">Target Class *</label>
                    <select
                      className="input-field"
                      value={builderForm.class}
                      onChange={(e) => setBuilderForm({ ...builderForm, class: e.target.value })}
                    >
                      <option value="9">Class 9</option>
                      <option value="10">Class 10</option>
                      <option value="11">Class 11</option>
                      <option value="12">Class 12</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="input-label">Stream *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={builderForm.stream}
                      onChange={(e) => setBuilderForm({ ...builderForm, stream: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="input-label">Section Scope</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. ALL or A,B"
                      value={builderForm.sectionScope}
                      onChange={(e) => setBuilderForm({ ...builderForm, sectionScope: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Curriculum Title</label>
                  <input
                    type="text"
                    className="input-field"
                    value={builderForm.curriculumName}
                    onChange={(e) => setBuilderForm({ ...builderForm, curriculumName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button onClick={() => setBuilderStep(2)} className="btn-primary" style={{ padding: '8px 16px' }}>
                    Next: Manage Subjects →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: MAPPED SUBJECTS CONFIGURATION */}
            {builderStep === 2 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="input-label" style={{ margin: 0 }}>Configure Curriculum Subjects</label>
                  <button
                    type="button"
                    onClick={() => {
                      setBuilderForm({
                        ...builderForm,
                        subjects: [
                          ...builderForm.subjects,
                          {
                            subjectCode: `SUB-${builderForm.subjects.length + 1}`,
                            subjectName: 'New Subject',
                            component: 'THEORY',
                            theoryMaxMarks: 100,
                            practicalMaxMarks: 0,
                            totalMaxMarks: 100,
                            isMandatory: true,
                            isOptional: false,
                            displayOrder: builderForm.subjects.length + 1
                          }
                        ]
                      });
                    }}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  >
                    + Add Subject Row
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '45vh', overflowY: 'auto' }}>
                  {builderForm.subjects.map((sub, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Code"
                          value={sub.subjectCode}
                          onChange={(e) => {
                            const newSubs = [...builderForm.subjects];
                            newSubs[idx].subjectCode = e.target.value;
                            setBuilderForm({ ...builderForm, subjects: newSubs });
                          }}
                        />
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Subject Name"
                          value={sub.subjectName}
                          onChange={(e) => {
                            const newSubs = [...builderForm.subjects];
                            newSubs[idx].subjectName = e.target.value;
                            setBuilderForm({ ...builderForm, subjects: newSubs });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newSubs = builderForm.subjects.filter((_, i) => i !== idx);
                            setBuilderForm({ ...builderForm, subjects: newSubs });
                          }}
                          className="btn-secondary"
                          style={{ color: '#dc2626', padding: '6px 8px' }}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Component</span>
                          <select
                            className="input-field"
                            value={sub.component}
                            onChange={(e) => {
                              const newSubs = [...builderForm.subjects];
                              const comp = e.target.value;
                              newSubs[idx].component = comp;
                              if (comp === 'THEORY') { newSubs[idx].theoryMaxMarks = 100; newSubs[idx].practicalMaxMarks = 0; }
                              else if (comp === 'PRACTICAL') { newSubs[idx].theoryMaxMarks = 0; newSubs[idx].practicalMaxMarks = 100; }
                              else { newSubs[idx].theoryMaxMarks = 70; newSubs[idx].practicalMaxMarks = 30; }
                              newSubs[idx].totalMaxMarks = newSubs[idx].theoryMaxMarks + newSubs[idx].practicalMaxMarks;
                              setBuilderForm({ ...builderForm, subjects: newSubs });
                            }}
                          >
                            <option value="THEORY">Theory Only</option>
                            <option value="PRACTICAL">Practical Only</option>
                            <option value="BOTH">Theory & Practical</option>
                          </select>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Theory Max</span>
                          <input
                            type="number"
                            className="input-field"
                            value={sub.theoryMaxMarks}
                            disabled={sub.component === 'PRACTICAL'}
                            onChange={(e) => {
                              const newSubs = [...builderForm.subjects];
                              newSubs[idx].theoryMaxMarks = parseInt(e.target.value, 10) || 0;
                              newSubs[idx].totalMaxMarks = newSubs[idx].theoryMaxMarks + (newSubs[idx].practicalMaxMarks || 0);
                              setBuilderForm({ ...builderForm, subjects: newSubs });
                            }}
                          />
                        </div>

                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Practical Max</span>
                          <input
                            type="number"
                            className="input-field"
                            value={sub.practicalMaxMarks}
                            disabled={sub.component === 'THEORY'}
                            onChange={(e) => {
                              const newSubs = [...builderForm.subjects];
                              newSubs[idx].practicalMaxMarks = parseInt(e.target.value, 10) || 0;
                              newSubs[idx].totalMaxMarks = (newSubs[idx].theoryMaxMarks || 0) + newSubs[idx].practicalMaxMarks;
                              setBuilderForm({ ...builderForm, subjects: newSubs });
                            }}
                          />
                        </div>

                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Max</span>
                          <input
                            type="number"
                            className="input-field"
                            disabled
                            value={sub.totalMaxMarks}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                  <button onClick={() => setBuilderStep(1)} className="btn-secondary">
                    ← Back
                  </button>
                  <button onClick={() => setBuilderStep(3)} className="btn-primary">
                    Review & Validate →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW & PUBLISH */}
            {builderStep === 3 && (
              <div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 8px 0' }}>{builderForm.curriculumName}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    • Academic Session: {builderForm.academicYear}<br />
                    • Class: {builderForm.class} • Scope: {builderForm.sectionScope}<br />
                    • Stream: {builderForm.stream} • Trade: {builderForm.trade}<br />
                    • Total Subjects: {builderForm.subjects.length} (Total Marks: {builderForm.subjects.reduce((sum, s) => sum + (s.totalMaxMarks || 0), 0)})
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                  <button onClick={() => setBuilderStep(2)} className="btn-secondary" disabled={builderLoading}>
                    ← Back
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleSaveBuilder(false)} className="btn-secondary" disabled={builderLoading}>
                      Save as Draft
                    </button>
                    <button onClick={() => handleSaveBuilder(true)} className="btn-primary" disabled={builderLoading} style={{ background: '#10b981' }}>
                      Publish Curriculum
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: SUBJECT MASTER MODAL */}
      {isSubjectModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                {subjectForm.subjectId ? 'Edit Master Subject' : 'Add Subject to Master Catalog'}
              </h3>
              <button onClick={() => setIsSubjectModalOpen(false)} className="btn-secondary" style={{ padding: '6px', borderRadius: '8px' }}>
                <X size={18} />
              </button>
            </div>

            {subjectModalError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem', marginBottom: '14px' }}>
                {subjectModalError}
              </div>
            )}

            <form onSubmit={handleSubjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label className="input-label">Subject Code *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={subjectForm.subjectCode}
                    onChange={(e) => setSubjectForm({ ...subjectForm, subjectCode: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">Subject Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={subjectForm.subjectName}
                    onChange={(e) => setSubjectForm({ ...subjectForm, subjectName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">Class *</label>
                  <select
                    className="input-field"
                    value={subjectForm.class}
                    onChange={(e) => setSubjectForm({ ...subjectForm, class: e.target.value })}
                  >
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                    <option value="11">Class 11</option>
                    <option value="12">Class 12</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Stream</label>
                  <input
                    type="text"
                    className="input-field"
                    value={subjectForm.stream}
                    onChange={(e) => setSubjectForm({ ...subjectForm, stream: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">Component</label>
                  <select
                    className="input-field"
                    value={subjectForm.component}
                    onChange={(e) => {
                      const comp = e.target.value;
                      let th = subjectForm.theoryMaxMarks;
                      let pr = subjectForm.practicalMaxMarks;
                      if (comp === 'THEORY') { th = 100; pr = 0; }
                      else if (comp === 'PRACTICAL') { th = 0; pr = 100; }
                      else { th = 70; pr = 30; }
                      setSubjectForm({
                        ...subjectForm,
                        component: comp,
                        theoryMaxMarks: th,
                        practicalMaxMarks: pr,
                        maxMarks: th + pr
                      });
                    }}
                  >
                    <option value="BOTH">Both (Theory & Practical)</option>
                    <option value="THEORY">Theory Only</option>
                    <option value="PRACTICAL">Practical Only</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Total Max Marks</label>
                  <input
                    type="number"
                    className="input-field"
                    value={subjectForm.maxMarks}
                    onChange={(e) => setSubjectForm({ ...subjectForm, maxMarks: parseInt(e.target.value, 10) || 100 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="btn-secondary" disabled={subjectModalLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={subjectModalLoading}>
                  {subjectModalLoading ? 'Saving...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DUPLICATE CURRICULUM */}
      {duplicateModalSource && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '460px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 8px 0' }}>
              Duplicate Curriculum to New Session
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Clone "{duplicateModalSource.curriculumName}" and its mapped subjects to a target academic year as a new draft version.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label className="input-label">Target Academic Session *</label>
              <input
                type="text"
                className="input-field"
                value={targetDuplicateYear}
                onChange={(e) => setTargetDuplicateYear(e.target.value)}
                placeholder="e.g. 2027-2028"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setDuplicateModalSource(null)} className="btn-secondary" disabled={duplicateLoading}>
                Cancel
              </button>
              <button onClick={handleDuplicateSubmit} className="btn-primary" disabled={duplicateLoading}>
                {duplicateLoading ? 'Duplicating...' : 'Duplicate Curriculum'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CONFIRM ACTION */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 8px 0' }}>
              {confirmModal.title}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginBottom: '20px', lineHeight: 1.5 }}>
              {confirmModal.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setConfirmModal(null)}>
                Cancel
              </button>
              <button
                className={confirmModal.isDanger ? 'btn-danger' : 'btn-primary'}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
