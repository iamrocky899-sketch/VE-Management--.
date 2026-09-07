import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';
import { sendApiRequest } from '../../api/client';
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  Calendar,
  Share2,
  AlertTriangle,
  FileText
} from 'lucide-react';

const PRIORITY_OPTIONS = [
  { value: 'NORMAL', label: 'Normal', css: 'pri-normal' },
  { value: 'IMPORTANT', label: 'Important', css: 'pri-important' },
  { value: 'URGENT', label: 'Urgent', css: 'pri-urgent' }
];

export default function Notices({ onNavigate }) {
  const { user, isTeacher, isPrincipal } = useAuth();

  // Class Selection & Scoping
  const availableClasses = useMemo(() => {
    if (isTeacher) {
      return user?.assignedClasses && user.assignedClasses.length > 0 ? user.assignedClasses : ['9', '10'];
    }
    return ['All', '9', '10', '11', '12'];
  }, [isTeacher, user]);

  const [selectedClass, setSelectedClass] = useState(() => (isTeacher ? availableClasses[0] || '9' : 'All'));
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('ALL');

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [noticeModal, setNoticeModal] = useState({ isOpen: false, mode: 'CREATE', notice: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, title: '' });
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    priority: 'NORMAL',
    isHighlighted: false,
    class: isTeacher ? availableClasses[0] || '9' : '',
    section: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch Notices
  const loadNotices = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const query = {};
      if (selectedClass !== 'All') {
        query.class = selectedClass;
      }
      const res = await sendApiRequest('get_notices', query);
      const list = res?.data?.notices || [];
      // Sort newest date first
      list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setNotices(list);
    } catch (err) {
      setError('Unable to load notices. Please check your network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [selectedClass]);

  // Filtered & Searched Notices
  const displayedNotices = useMemo(() => {
    let result = notices;

    if (selectedPriorityFilter !== 'ALL') {
      result = result.filter((n) => (n.priority || 'NORMAL').toUpperCase() === selectedPriorityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((n) => {
        const titleMatch = (n.title || '').toLowerCase().includes(q);
        const bodyMatch = (n.body || '').toLowerCase().includes(q);
        const priMatch = (n.priority || '').toLowerCase().includes(q);
        const clsMatch = String(n.class || '').toLowerCase().includes(q);
        return titleMatch || bodyMatch || priMatch || clsMatch;
      });
    }

    return result;
  }, [notices, selectedPriorityFilter, searchQuery]);

  // -------------------------------------------------------------
  // MODAL ACTIONS
  // -------------------------------------------------------------
  const openCreateModal = () => {
    setFormData({
      title: '',
      body: '',
      priority: 'NORMAL',
      isHighlighted: false,
      class: isTeacher ? availableClasses[0] || '9' : '',
      section: '',
      date: new Date().toISOString().split('T')[0]
    });
    setNoticeModal({ isOpen: true, mode: 'CREATE', notice: null });
  };

  const openEditModal = (ntc) => {
    setFormData({
      title: ntc.title || '',
      body: ntc.body || '',
      priority: (ntc.priority || 'NORMAL').toUpperCase(),
      isHighlighted: ntc.isHighlighted === true || ntc.isHighlighted === 'true' || ntc.highlighted === true,
      class: ntc.class || '',
      section: ntc.section || '',
      date: ntc.date || new Date().toISOString().split('T')[0]
    });
    setNoticeModal({ isOpen: true, mode: 'EDIT', notice: ntc });
  };

  const handleSaveNotice = async () => {
    if (!formData.title.trim()) {
      setError('Notice title is required.');
      return;
    }
    if (!formData.body.trim()) {
      setError('Notice body content cannot be empty.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      noticeId: noticeModal.mode === 'EDIT' ? noticeModal.notice.noticeId : undefined,
      title: formData.title.trim(),
      body: formData.body.trim(),
      priority: formData.priority,
      isHighlighted: formData.isHighlighted,
      class: formData.class || '',
      section: formData.section || '',
      date: formData.date
    };

    try {
      const res = await sendApiRequest('save_notices', payload);
      if (res && res.success) {
        setSuccessMsg(noticeModal.mode === 'EDIT' ? 'Notice updated successfully.' : 'Notice published successfully.');
        setNoticeModal({ isOpen: false, mode: 'CREATE', notice: null });
        await loadNotices();
      } else {
        setError(res?.error?.message || 'Failed to publish notice.');
      }
    } catch (err) {
      setError('Network error saving notice.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteNotice = (ntc) => {
    setDeleteConfirm({
      isOpen: true,
      id: ntc.noticeId,
      title: ntc.title
    });
  };

  const executeDeleteNotice = async () => {
    const noticeId = deleteConfirm.id;
    try {
      const res = await sendApiRequest('delete_notice', { noticeId });
      if (res && res.success) {
        setSuccessMsg('Notice deleted successfully.');
        setDeleteConfirm({ isOpen: false, id: null, title: '' });
        await loadNotices();
      } else {
        setError(res?.error?.message || 'Failed to delete notice.');
      }
    } catch (err) {
      setError('Network error deleting notice.');
    }
  };

  const getPriorityCss = (pri) => {
    const p = (pri || 'NORMAL').toUpperCase();
    const found = PRIORITY_OPTIONS.find((o) => o.value === p);
    return found ? found.css : 'pri-normal';
  };

  // Safe WhatsApp Link Share (without exposing unauthorized parent phone numbers)
  const handleShareWhatsApp = (ntc) => {
    const text = encodeURIComponent(`*${ntc.title}*\n\n${ntc.body}\n\n- Gameri Higher Secondary School`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div>
      {/* 1. Header Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Class Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="ntc-class-select" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                Target Class:
              </label>
              <select
                id="ntc-class-select"
                className="filter-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                aria-label="Select Target Class"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls === 'All' ? 'All Classes (School-Wide)' : `Class ${cls} ${isTeacher ? '(Assigned)' : ''}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn-refresh"
              style={{ color: 'var(--slate-700)', background: '#ffffff', borderColor: 'var(--slate-200)' }}
              onClick={() => loadNotices(true)}
              disabled={refreshing}
              aria-label="Refresh notices"
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
              <span>Publish Notice</span>
            </button>
          </div>
        </div>

        {/* Priority Filters & Search */}
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--slate-100)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div className="category-pill-group">
            <button
              type="button"
              className={`category-pill-btn ${selectedPriorityFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedPriorityFilter('ALL')}
            >
              All Priorities
            </button>
            {PRIORITY_OPTIONS.map((pri) => (
              <button
                key={pri.value}
                type="button"
                className={`category-pill-btn ${selectedPriorityFilter === pri.value ? 'active' : ''}`}
                onClick={() => setSelectedPriorityFilter(pri.value)}
              >
                <span>{pri.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="search-box-container" style={{ minWidth: '240px' }}>
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              className="search-box-input"
              placeholder="Search circulars & notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search notices"
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

      {/* 2. Notices List / Grid View */}
      {loading ? (
        <div className="skeleton skeleton-card" style={{ height: '280px' }} />
      ) : displayedNotices.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '50%', marginBottom: '16px' }}>
            <Bell size={40} />
          </div>
          <h3 className="card-title" style={{ fontSize: '1.2rem' }}>
            {searchQuery ? 'No matching notices found' : 'No notices found.'}
          </h3>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', marginBottom: '24px', maxWidth: '440px', margin: '0 auto 24px auto' }}>
            {searchQuery
              ? 'Try adjusting your search keywords or priority filter.'
              : 'School announcements, circulars, and class notices will appear here.'}
          </p>
          {!searchQuery && (
            <button
              className="btn-primary"
              style={{ width: 'auto', display: 'inline-flex', padding: '0 24px', margin: '0 auto' }}
              onClick={openCreateModal}
            >
              <Plus size={16} />
              <span>Create First Notice</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayedNotices.map((ntc) => {
            const priCss = getPriorityCss(ntc.priority);

            return (
              <div key={ntc.noticeId} className="notice-item-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {(ntc.isHighlighted === true || ntc.isHighlighted === 'true' || ntc.highlighted === true) && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', background: '#fef3c7', color: '#b45309', fontWeight: 800, fontSize: '0.72rem', border: '1px solid #fde68a' }}>
                          ⭐ Highlighted
                        </span>
                      )}
                      <span className={`notice-priority-pill ${priCss}`}>
                        {ntc.priority || 'NORMAL'}
                      </span>
                      <span className="hero-chip" style={{ background: 'var(--slate-100)', color: 'var(--slate-700)', fontSize: '0.75rem' }}>
                        {ntc.class ? `Class ${ntc.class}` : 'School-Wide'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      {ntc.date || 'Recent'}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '8px' }}>
                    {ntc.title}
                  </h3>

                  <p style={{ fontSize: '0.9rem', color: 'var(--slate-700)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                    {ntc.body}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="copy-answer-btn"
                    onClick={() => handleShareWhatsApp(ntc)}
                    aria-label="Share notice via WhatsApp"
                  >
                    <Share2 size={13} />
                    <span>Share WhatsApp</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn-month-nav"
                      style={{ padding: '4px 8px', minHeight: '32px' }}
                      onClick={() => openEditModal(ntc)}
                      aria-label="Edit Notice"
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      type="button"
                      className="btn-month-nav"
                      style={{ padding: '4px 8px', minHeight: '32px', color: 'var(--danger-600)' }}
                      onClick={() => confirmDeleteNotice(ntc)}
                      aria-label="Delete Notice"
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
      {/* 3. MODAL: CREATE / EDIT NOTICE */}
      {/* ------------------------------------------------------------- */}
      {noticeModal.isOpen && (
        <div className="notes-modal-backdrop" role="dialog" aria-modal="true">
          <div className="notes-modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                {noticeModal.mode === 'EDIT' ? 'Edit Notice' : 'Publish New Notice'}
              </h3>
              <button className="search-clear-btn" onClick={() => setNoticeModal({ isOpen: false, mode: 'CREATE', notice: null })}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  Notice Title <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Schedule for 1st Unit Test 2026-2027"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Priority Level
                  </label>
                  <select
                    className="form-input"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                    Publish Date
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  Target Class
                </label>
                <select
                  className="form-input"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                >
                  {isPrincipal && <option value="">All Classes (School-Wide)</option>}
                  {availableClasses.filter((c) => c !== 'All').map((cls) => (
                    <option key={cls} value={cls}>
                      Class {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                  Notice Content / Circular Details <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <textarea
                  className="notes-textarea"
                  style={{ minHeight: '120px' }}
                  placeholder="Enter full notice text, guidelines, or announcements here..."
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--slate-50)', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
                <input
                  type="checkbox"
                  id="notice-highlight-check"
                  checked={formData.isHighlighted}
                  onChange={(e) => setFormData({ ...formData, isHighlighted: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="notice-highlight-check" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-800)', cursor: 'pointer' }}>
                  ⭐ Highlight this Notice (Pin to top with prominent indicator)
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn-back-link"
                onClick={() => setNoticeModal({ isOpen: false, mode: 'CREATE', notice: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0 22px' }}
                onClick={handleSaveNotice}
                disabled={saving}
              >
                <Save size={16} />
                <span>{saving ? 'Publishing...' : noticeModal.mode === 'EDIT' ? 'Update Notice' : 'Publish Notice'}</span>
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
              Delete Notice?
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
                onClick={executeDeleteNotice}
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
