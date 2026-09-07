import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';
import { sendApiRequest } from '../../api/client';
import {
  Calendar,
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
  Briefcase,
  Layers,
  Award,
  BookOpen,
  MapPin,
  Users,
  Box,
  FileText
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'WEEKLY_PROGRESS', label: 'Weekly Progress', icon: BookOpen, css: 'cat-weekly-progress' },
  { value: 'PRACTICAL_WORK', label: 'Practical Work', icon: Briefcase, css: 'cat-practical-work' },
  { value: 'GUEST_LECTURE', label: 'Guest Lecture', icon: Users, css: 'cat-guest-lecture' },
  { value: 'PROJECT', label: 'Vocational Project', icon: Award, css: 'cat-project' }
];

export default function Activities({ onNavigate }) {
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

  // Category Filter
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [activityModal, setActivityModal] = useState({ isOpen: false, mode: 'CREATE', activity: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, title: '' });
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'WEEKLY_PROGRESS',
    class: selectedClass,
    section: 'A',
    subject: selectedSubject,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Fetch Activities
  const loadActivities = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await sendApiRequest('get_activities', {
        class: selectedClass,
        subject: selectedSubject
      });
      const list = res?.data?.activities || [];
      // Sort newest date first
      list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setActivities(list);
    } catch (err) {
      setError('Unable to load activities. Please check your network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [selectedClass, selectedSubject]);

  // Filtered & Searched Activities
  const displayedActivities = useMemo(() => {
    let result = activities;

    if (selectedCategoryFilter !== 'ALL') {
      result = result.filter((a) => (a.category || '').toUpperCase() === selectedCategoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((a) => {
        const titleMatch = (a.title || '').toLowerCase().includes(q);
        const descMatch = (a.description || '').toLowerCase().includes(q);
        const catMatch = (a.category || '').toLowerCase().includes(q);
        const clsMatch = String(a.class || '').toLowerCase().includes(q);
        return titleMatch || descMatch || catMatch || clsMatch;
      });
    }

    return result;
  }, [activities, selectedCategoryFilter, searchQuery]);

  // -------------------------------------------------------------
  // MODAL ACTIONS
  // -------------------------------------------------------------
  const openCreateModal = () => {
    setFormData({
      title: '',
      category: 'WEEKLY_PROGRESS',
      class: selectedClass,
      section: 'A',
      subject: selectedSubject,
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setActivityModal({ isOpen: true, mode: 'CREATE', activity: null });
  };

  const openEditModal = (act) => {
    setFormData({
      title: act.title || '',
      category: (act.category || 'WEEKLY_PROGRESS').toUpperCase(),
      class: String(act.class || selectedClass),
      section: act.section || 'A',
      subject: act.subject || selectedSubject,
      date: act.date || new Date().toISOString().split('T')[0],
      description: act.description || ''
    });
    setActivityModal({ isOpen: true, mode: 'EDIT', activity: act });
  };

  const handleSaveActivity = async () => {
    if (!formData.title.trim()) {
      setError('Activity title is required.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      activityId: activityModal.mode === 'EDIT' ? activityModal.activity.activityId : undefined,
      title: formData.title.trim(),
      category: formData.category,
      class: String(formData.class),
      section: formData.section || 'A',
      subject: formData.subject || selectedSubject,
      date: formData.date,
      description: formData.description.trim()
    };

    try {
      const res = await sendApiRequest('save_activities', payload);
      if (res && res.success) {
        setSuccessMsg(activityModal.mode === 'EDIT' ? 'Activity updated successfully.' : 'Activity recorded successfully.');
        setActivityModal({ isOpen: false, mode: 'CREATE', activity: null });
        await loadActivities();
      } else {
        setError(res?.error?.message || 'Failed to save activity.');
      }
    } catch (err) {
      setError('Network error saving activity.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteActivity = (act) => {
    setDeleteConfirm({
      isOpen: true,
      id: act.activityId,
      title: act.title
    });
  };

  const executeDeleteActivity = async () => {
    const activityId = deleteConfirm.id;
    try {
      const res = await sendApiRequest('delete_activity', { activityId });
      if (res && res.success) {
        setSuccessMsg('Activity deleted successfully.');
        setDeleteConfirm({ isOpen: false, id: null, title: '' });
        await loadActivities();
      } else {
        setError(res?.error?.message || 'Failed to delete activity.');
      }
    } catch (err) {
      setError('Network error deleting activity.');
    }
  };

  const getCategoryMeta = (catVal) => {
    const found = CATEGORY_OPTIONS.find((c) => c.value === (catVal || '').toUpperCase());
    return found || { label: catVal || 'Activity', icon: Briefcase, css: 'cat-weekly-progress' };
  };

  return (
    <div>
      {/* 1. Header Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Class Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="act-class-select" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                Class:
              </label>
              <select
                id="act-class-select"
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
              <label htmlFor="act-subject-select" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                Subject:
              </label>
              <select
                id="act-subject-select"
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
              onClick={() => loadActivities(true)}
              disabled={refreshing}
              aria-label="Refresh activities"
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
              <span>Add Activity</span>
            </button>
          </div>
        </div>

        {/* Category Filters & Search */}
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--slate-100)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div className="category-pill-group">
            <button
              type="button"
              className={`category-pill-btn ${selectedCategoryFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedCategoryFilter('ALL')}
            >
              All Types
            </button>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`category-pill-btn ${selectedCategoryFilter === cat.value ? 'active' : ''}`}
                onClick={() => setSelectedCategoryFilter(cat.value)}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="search-box-container" style={{ minWidth: '240px' }}>
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              className="search-box-input"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search activities"
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

      {/* 2. Activities Grid / List View */}
      {loading ? (
        <div className="skeleton skeleton-card" style={{ height: '280px' }} />
      ) : displayedActivities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '50%', marginBottom: '16px' }}>
            <Briefcase size={40} />
          </div>
          <h3 className="card-title" style={{ fontSize: '1.2rem' }}>
            {searchQuery ? 'No matching activities found' : 'No activities recorded yet.'}
          </h3>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginBottom: '24px', maxWidth: '440px', margin: '0 auto 24px auto' }}>
            {searchQuery
              ? 'Try adjusting your search keywords or category filters.'
              : `Record practical lab work, weekly progress, raw materials, or guest lectures for Class ${selectedClass}.`}
          </p>
          {!searchQuery && (
            <button
              className="btn-primary"
              style={{ width: 'auto', display: 'inline-flex', padding: '0 24px', margin: '0 auto' }}
              onClick={openCreateModal}
            >
              <Plus size={16} />
              <span>Record First Activity</span>
            </button>
          )}
        </div>
      ) : (
        <div className="activity-grid">
          {displayedActivities.map((act) => {
            const meta = getCategoryMeta(act.category);
            const Icon = meta.icon;

            return (
              <div key={act.activityId} className="activity-item-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className={`category-badge-pill ${meta.css}`}>
                      <Icon size={12} />
                      <span>{meta.label}</span>
                    </span>

                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      {act.date || 'Recent'}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '8px', lineHeight: 1.4 }}>
                    {act.title}
                  </h3>

                  {act.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.5, marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                      {act.description}
                    </p>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="hero-chip" style={{ background: 'var(--slate-100)', color: 'var(--slate-700)', fontSize: '0.75rem' }}>
                    Class {act.class} • Sec {act.section || 'A'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn-month-nav"
                      style={{ padding: '4px 8px', minHeight: '32px' }}
                      onClick={() => openEditModal(act)}
                      aria-label="Edit Activity"
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      type="button"
                      className="btn-month-nav"
                      style={{ padding: '4px 8px', minHeight: '32px', color: 'var(--danger-600)' }}
                      onClick={() => confirmDeleteActivity(act)}
                      aria-label="Delete Activity"
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
      {/* 3. MODAL: CREATE / EDIT ACTIVITY */}
      {/* ------------------------------------------------------------- */}
      {activityModal.isOpen && (
        <div className="notes-modal-backdrop" role="dialog" aria-modal="true">
          <div className="notes-modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                {activityModal.mode === 'EDIT' ? 'Edit Activity' : 'Record New Activity'}
              </h3>
              <button className="search-clear-btn" onClick={() => setActivityModal({ isOpen: false, mode: 'CREATE', activity: null })}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  Activity Title <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Demonstration of Computer Hardware Assemblies"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Category Type
                  </label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Activity Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  Description / Remarks (Optional)
                </label>
                <textarea
                  className="notes-textarea"
                  style={{ minHeight: '100px' }}
                  placeholder="Details of topic covered, guest speaker, or materials consumed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn-back-link"
                onClick={() => setActivityModal({ isOpen: false, mode: 'CREATE', activity: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0 22px' }}
                onClick={handleSaveActivity}
                disabled={saving}
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : activityModal.mode === 'EDIT' ? 'Update Activity' : 'Save Activity'}</span>
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
              Delete Activity?
            </h3>

            <p style={{ color: 'var(--slate-600)', fontSize: '0.875rem', marginBottom: '16px' }}>
              Are you sure you want to permanently delete <strong>"{deleteConfirm.title}"</strong>?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-back-link"
                onClick={() => setDeleteConfirm({ isOpen: false, id: null, title: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', background: 'var(--danger-600)', padding: '0 20px' }}
                onClick={executeDeleteActivity}
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
