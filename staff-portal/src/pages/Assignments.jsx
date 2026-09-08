import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendApiRequest } from '../api/client';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  Clock,
  Calendar,
  CheckSquare,
  AlertTriangle,
  Award,
  Layers
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', css: 'asg-active' },
  { value: 'DRAFT', label: 'Draft', css: 'asg-draft' },
  { value: 'COMPLETED', label: 'Completed', css: 'asg-completed' },
  { value: 'EXPIRED', label: 'Expired', css: 'asg-expired' }
];

export default function Assignments({ onNavigate }) {
  const { user, isTeacher, isPrincipal } = useAuth();

  // Class Selection & Scoping
  const availableClasses = useMemo(() => {
    if (isTeacher) {
      return user?.assignedClasses && user.assignedClasses.length > 0 ? user.assignedClasses : ['9', '10'];
    }
    return ['9', '10', '11', '12'];
  }, [isTeacher, user]);

  const [selectedClass, setSelectedClass] = useState(() => availableClasses[0] || '9');

  // Subject Selection & Scoping
  const availableSubjects = useMemo(() => {
    if (isTeacher) {
      return user?.assignedSubjects && user.assignedSubjects.length > 0
        ? user.assignedSubjects
        : ['IT/ITeS'];
    }
    return ['IT/ITeS', 'Retail', 'General Science', 'Mathematics', 'English', 'Assamese'];
  }, [isTeacher, user]);

  const [selectedSubject, setSelectedSubject] = useState(() => availableSubjects[0] || 'IT/ITeS');

  // Status Filter
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [assignmentModal, setAssignmentModal] = useState({ isOpen: false, mode: 'CREATE', assignment: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, title: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    class: selectedClass,
    section: 'A',
    subject: selectedSubject,
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    maxMarks: '50',
    status: 'ACTIVE',
    description: ''
  });

  // Fetch Assignments
  const loadAssignments = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await sendApiRequest('get_assignments', {
        class: selectedClass,
        subject: selectedSubject
      });
      const list = res?.data?.assignments || [];
      // Sort newest assigned date first
      list.sort((a, b) => new Date(b.assignedDate || 0) - new Date(a.assignedDate || 0));
      setAssignments(list);
    } catch (err) {
      setError('Unable to load assignments. Please check your network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [selectedClass, selectedSubject]);

  // Filtered & Searched Assignments
  const displayedAssignments = useMemo(() => {
    let result = assignments;

    if (selectedStatusFilter !== 'ALL') {
      result = result.filter((a) => (a.status || 'ACTIVE').toUpperCase() === selectedStatusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((a) => {
        const titleMatch = (a.title || '').toLowerCase().includes(q);
        const descMatch = (a.description || '').toLowerCase().includes(q);
        const statusMatch = (a.status || '').toLowerCase().includes(q);
        const clsMatch = String(a.class || '').toLowerCase().includes(q);
        return titleMatch || descMatch || statusMatch || clsMatch;
      });
    }

    return result;
  }, [assignments, selectedStatusFilter, searchQuery]);

  // -------------------------------------------------------------
  // MODAL ACTIONS
  // -------------------------------------------------------------
  const openCreateModal = () => {
    setFormData({
      title: '',
      class: selectedClass,
      section: 'A',
      subject: selectedSubject,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      maxMarks: '50',
      status: 'ACTIVE',
      description: ''
    });
    setAssignmentModal({ isOpen: true, mode: 'CREATE', assignment: null });
  };

  const openEditModal = (asg) => {
    setFormData({
      title: asg.title || '',
      class: String(asg.class || selectedClass),
      section: asg.section || 'A',
      subject: asg.subject || selectedSubject,
      assignedDate: asg.assignedDate || asg.assigned_date || new Date().toISOString().split('T')[0],
      dueDate: asg.dueDate || asg.due_date || '',
      maxMarks: String(asg.maxMarks || asg.max_marks || '50'),
      status: (asg.status || 'ACTIVE').toUpperCase(),
      description: asg.description || ''
    });
    setAssignmentModal({ isOpen: true, mode: 'EDIT', assignment: asg });
  };

  const handleSaveAssignment = async () => {
    if (!formData.title.trim()) {
      setError('Assignment title is required.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      assignmentId: assignmentModal.mode === 'EDIT' ? (assignmentModal.assignment?.assignmentId || assignmentModal.assignment?.assignment_id) : undefined,
      title: formData.title.trim(),
      class: String(formData.class),
      section: formData.section || 'A',
      subject: formData.subject || selectedSubject,
      assignedDate: formData.assignedDate,
      dueDate: formData.dueDate,
      maxMarks: parseInt(formData.maxMarks, 10) || 50,
      status: formData.status,
      description: formData.description.trim()
    };

    try {
      const res = await sendApiRequest('save_assignments', payload);
      if (res && res.success) {
        setSuccessMsg(assignmentModal.mode === 'EDIT' ? 'Assignment updated successfully.' : 'Assignment created successfully.');
        setAssignmentModal({ isOpen: false, mode: 'CREATE', assignment: null });
        await loadAssignments();
      } else {
        setError(res?.error?.message || 'Failed to save assignment.');
      }
    } catch (err) {
      setError('Network error saving assignment.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteAssignment = (asg) => {
    setDeleteConfirm({
      isOpen: true,
      id: asg.assignmentId || asg.assignment_id,
      title: asg.title
    });
  };

  const executeDeleteAssignment = async () => {
    if (deleting || !deleteConfirm.id) return;
    const assignmentId = deleteConfirm.id;
    setDeleting(true);
    setError(null);
    try {
      const res = await sendApiRequest('delete_assignment', { assignmentId });
      if (res && res.success) {
        setSuccessMsg('Assignment deleted successfully.');
        setDeleteConfirm({ isOpen: false, id: null, title: '' });
        setAssignments(prev => prev.filter(a => (a.assignmentId || a.assignment_id) !== assignmentId));
        await loadAssignments();
      } else if (res?.error?.code === 'NOT_FOUND') {
        setSuccessMsg('Assignment was already removed.');
        setDeleteConfirm({ isOpen: false, id: null, title: '' });
        setAssignments(prev => prev.filter(a => (a.assignmentId || a.assignment_id) !== assignmentId));
        await loadAssignments();
      } else {
        setError(res?.error?.message || 'Failed to delete assignment.');
      }
    } catch (err) {
      setError('Network error deleting assignment.');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusCss = (status) => {
    const st = (status || 'ACTIVE').toUpperCase();
    const found = STATUS_OPTIONS.find((s) => s.value === st);
    return found ? found.css : 'asg-active';
  };

  return (
    <div>
      {/* 1. Header Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Class Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="asg-class-select" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                Class:
              </label>
              <select
                id="asg-class-select"
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
              <label htmlFor="asg-subject-select" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                Subject:
              </label>
              <select
                id="asg-subject-select"
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
              onClick={() => loadAssignments(true)}
              disabled={refreshing}
              aria-label="Refresh assignments"
            >
              <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              className="btn-primary"
              style={{ width: 'auto', padding: '0 18px' }}
              onClick={openCreateModal}
            >
              <Plus size={16} />
              <span>Create Assignment</span>
            </button>
          </div>
        </div>

        {/* Status Filters & Search */}
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--slate-100)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div className="category-pill-group">
            <button
              type="button"
              className={`category-pill-btn ${selectedStatusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedStatusFilter('ALL')}
            >
              All Statuses
            </button>
            {STATUS_OPTIONS.map((st) => (
              <button
                key={st.value}
                type="button"
                className={`category-pill-btn ${selectedStatusFilter === st.value ? 'active' : ''}`}
                onClick={() => setSelectedStatusFilter(st.value)}
              >
                <span>{st.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="search-box-container" style={{ minWidth: '240px' }}>
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              className="search-box-input"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search assignments"
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

      {/* 2. Assignments Grid / List View */}
      {loading ? (
        <div className="skeleton skeleton-card" style={{ height: '280px' }} />
      ) : displayedAssignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '50%', marginBottom: '16px' }}>
            <FileText size={40} />
          </div>
          <h3 className="card-title" style={{ fontSize: '1.2rem' }}>
            {searchQuery ? 'No matching assignments found' : 'No assignments created yet.'}
          </h3>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginBottom: '24px', maxWidth: '440px', margin: '0 auto 24px auto' }}>
            {searchQuery
              ? 'Try adjusting your search keywords or status filters.'
              : `Create coursework, projects, or homework tasks for Class ${selectedClass}.`}
          </p>
          {!searchQuery && (
            <button
              className="btn-primary"
              style={{ width: 'auto', display: 'inline-flex', padding: '0 24px', margin: '0 auto' }}
              onClick={openCreateModal}
            >
              <Plus size={16} />
              <span>Create First Assignment</span>
            </button>
          )}
        </div>
      ) : (
        <div className="activity-grid">
          {displayedAssignments.map((asg) => {
            const statusCss = getStatusCss(asg.status);

            return (
              <div key={asg.assignmentId} className="assignment-item-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className={`assignment-status-pill ${statusCss}`}>
                      {asg.status || 'ACTIVE'}
                    </span>

                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      Due: {asg.dueDate || 'No Deadline'}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '8px', lineHeight: 1.4 }}>
                    {asg.title}
                  </h3>

                  {asg.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.5, marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                      {asg.description}
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="hero-chip" style={{ background: 'var(--slate-100)', color: 'var(--slate-700)', fontSize: '0.75rem' }}>
                      Class {asg.class} • Sec {asg.section || 'A'}
                    </span>
                    <span className="hero-chip" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)', fontSize: '0.75rem' }}>
                      {asg.maxMarks || 50} Marks
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn-month-nav"
                      style={{ padding: '4px 8px', minHeight: '32px' }}
                      onClick={() => openEditModal(asg)}
                      aria-label="Edit Assignment"
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      type="button"
                      className="btn-month-nav"
                      style={{ padding: '4px 8px', minHeight: '32px', color: 'var(--danger-600)' }}
                      onClick={() => confirmDeleteAssignment(asg)}
                      aria-label="Delete Assignment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MODAL: CREATE / EDIT ASSIGNMENT */}
      {/* ------------------------------------------------------------- */}
      {assignmentModal.isOpen && (
        <div className="notes-modal-backdrop" role="dialog" aria-modal="true">
          <div className="notes-modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                {assignmentModal.mode === 'EDIT' ? 'Edit Assignment' : 'Create New Assignment'}
              </h3>
              <button className="search-clear-btn" onClick={() => setAssignmentModal({ isOpen: false, mode: 'CREATE', assignment: null })}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  Assignment Title <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Lab Exercise: Motherboard Component Identification"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Assigned Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.assignedDate}
                    onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Class
                  </label>
                  <select
                    className="form-input"
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  >
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        Class {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Subject
                  </label>
                  <select
                    className="form-input"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  >
                    {availableSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Max Marks
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="50"
                    value={formData.maxMarks}
                    onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Status
                  </label>
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  Description / Instructions (Optional)
                </label>
                <textarea
                  className="notes-textarea"
                  style={{ minHeight: '100px' }}
                  placeholder="Task instructions, submission guidelines, or project rubrics..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn-back-link"
                onClick={() => setAssignmentModal({ isOpen: false, mode: 'CREATE', assignment: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0 22px' }}
                onClick={handleSaveAssignment}
                disabled={saving}
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : assignmentModal.mode === 'EDIT' ? 'Update Assignment' : 'Create Assignment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL: DELETE CONFIRMATION */}
      {/* ------------------------------------------------------------- */}
      {deleteConfirm.isOpen && (
        <div className="notes-modal-backdrop" role="dialog" aria-modal="true">
          <div className="notes-modal-content" style={{ maxWidth: '460px' }}>
            <div style={{ display: 'inline-flex', padding: '12px', background: 'var(--danger-50)', color: 'var(--danger-600)', borderRadius: '50%', marginBottom: '14px' }}>
              <Trash2 size={28} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '8px' }}>
              Delete Assignment?
            </h3>

            <p style={{ color: 'var(--slate-600)', fontSize: '0.875rem', marginBottom: '16px' }}>
              Are you sure you want to permanently delete <strong>"{deleteConfirm.title}"</strong>?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-back-link"
                disabled={deleting}
                onClick={() => setDeleteConfirm({ isOpen: false, id: null, title: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={deleting}
                style={{ width: 'auto', background: 'var(--danger-600)', padding: '0 20px', opacity: deleting ? 0.7 : 1, cursor: deleting ? 'not-allowed' : 'pointer' }}
                onClick={executeDeleteAssignment}
              >
                <Trash2 size={16} />
                <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
