import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendApiRequest } from '../api/client';
import {
  Calendar,
  CheckCircle2,
  Plus,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';

export default function AcademicYears({ onNavigate }) {
  const { user, isPrincipal, isAdmin } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [activeYear, setActiveYear] = useState('2026-2027');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // New Year Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newYearForm, setNewYearForm] = useState({
    yearName: '2027-2028',
    startDate: '2027-04-01',
    endDate: '2028-03-31',
    status: 'Upcoming',
    setAsActive: false
  });
  const [newYearLoading, setNewYearLoading] = useState(false);
  const [newYearError, setNewYearError] = useState(null);

  // Activate Confirmation Modal
  const [confirmModalYear, setConfirmModalYear] = useState(null);
  const [activateLoading, setActivateLoading] = useState(false);

  const fetchAcademicYears = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await sendApiRequest('get_academic_years');
      if (res && res.success && res.data) {
        setAcademicYears(res.data.academicYears || []);
        if (res.data.activeYear) {
          setActiveYear(res.data.activeYear);
        }
      } else {
        setError(res?.error?.message || 'Unable to load academic years');
      }
    } catch (err) {
      setError('Connection error. Please check your network.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateYear = async (e) => {
    e.preventDefault();
    setNewYearLoading(true);
    setNewYearError(null);

    const yearName = newYearForm.yearName.trim();
    if (!yearName) {
      setNewYearError('Academic year name is required (e.g. 2027-2028)');
      setNewYearLoading(false);
      return;
    }

    try {
      const res = await sendApiRequest('save_academic_year', {
        yearName: yearName,
        startDate: newYearForm.startDate,
        endDate: newYearForm.endDate,
        status: newYearForm.status,
        isCurrent: newYearForm.setAsActive
      });

      if (res && res.success) {
        if (newYearForm.setAsActive) {
          await sendApiRequest('set_active_academic_year', { yearName: yearName });
        }
        showToast(`Academic year ${yearName} created successfully`);
        setIsNewModalOpen(false);
        fetchAcademicYears(true);
      } else {
        setNewYearError(res?.error?.message || 'Failed to create academic year');
      }
    } catch (err) {
      setNewYearError(err.message || 'Error creating academic year');
    } finally {
      setNewYearLoading(false);
    }
  };

  const handleActivateYear = async (year) => {
    setActivateLoading(true);
    try {
      const res = await sendApiRequest('set_active_academic_year', {
        yearId: year.yearId,
        yearName: year.yearName
      });

      if (res && res.success) {
        showToast(`Active academic session set to ${year.yearName}`);
        setActiveYear(year.yearName);
        setConfirmModalYear(null);
        fetchAcademicYears(true);
      } else {
        showToast(res?.error?.message || 'Failed to update active year');
      }
    } catch (err) {
      showToast('Error activating academic year');
    } finally {
      setActivateLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
            fontSize: '0.9rem',
            fontWeight: 500
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '3px 10px',
                  borderRadius: '6px'
                }}
              >
                INSTITUTIONAL SETTINGS
              </span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
              Academic Year Management
            </h1>
            <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Current Active Academic Session: <strong style={{ textDecoration: 'underline' }}>{activeYear}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-outline"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}
              onClick={() => fetchAcademicYears(true)}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            {(isPrincipal || isAdmin) && (
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#10b981', borderColor: '#10b981' }}
                onClick={() => setIsNewModalOpen(true)}
              >
                <Plus size={16} />
                <span>Add Academic Year</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div
        className="card"
        style={{
          borderLeft: '4px solid #10b981',
          background: '#f0fdf4',
          padding: '16px 20px',
          marginBottom: '20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}
      >
        <ShieldCheck size={22} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#065f46' }}>
            Zero Historical Data Loss Policy
          </h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#047857' }}>
            Switching active academic years preserves all historical attendance logs, examination marks, student profiles, notes, and records. All past sessions remain securely archived and accessible.
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card skeleton" style={{ height: '140px', borderRadius: '16px' }} />
          <div className="card skeleton" style={{ height: '140px', borderRadius: '16px' }} />
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="card" style={{ padding: '30px', textAlign: 'center', borderRadius: '16px' }}>
          <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
          <button type="button" className="btn-primary" onClick={() => fetchAcademicYears(true)}>
            Try Again
          </button>
        </div>
      )}

      {/* Academic Years List */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {academicYears.map((year) => {
            const isCurrent = year.yearName === activeYear || year.isCurrent;
            return (
              <div
                key={year.yearId || year.yearName}
                className="card"
                style={{
                  borderRadius: '16px',
                  padding: '20px',
                  border: isCurrent ? '2px solid #10b981' : '1px solid var(--border-color, #e2e8f0)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isCurrent ? '0 8px 20px -4px rgba(16, 185, 129, 0.2)' : 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={20} color={isCurrent ? '#10b981' : '#64748b'} />
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                        {year.yearName}
                      </h3>
                    </div>
                    {isCurrent ? (
                      <span
                        style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Check size={14} /> ACTIVE SESSION
                      </span>
                    ) : (
                      <span
                        style={{
                          background: '#f1f5f9',
                          color: '#64748b',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {year.status || 'Archived'}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Clock size={14} />
                      <span>Duration: {year.startDate || 'Apr 1'} to {year.endDate || 'Mar 31'}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      ID: {year.yearId}
                    </div>
                  </div>
                </div>

                {!isCurrent && (isPrincipal || isAdmin) && (
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ width: '100%', borderColor: '#1e3a8a', color: '#1e3a8a', marginTop: '12px' }}
                    onClick={() => setConfirmModalYear(year)}
                  >
                    Set as Active Session
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalYear && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '480px', padding: '28px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '12px' }}>
                <AlertTriangle size={24} color="#d97706" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Activate Academic Year?
              </h3>
            </div>

            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '20px' }}>
              Are you sure you want to set <strong>{confirmModalYear.yearName}</strong> as the current active academic year for Gameri Higher Secondary School?
              <br /><br />
              <span style={{ fontSize: '0.85rem', color: '#059669', background: '#ecfdf5', padding: '6px 10px', borderRadius: '8px', display: 'block' }}>
                ✓ Zero data loss: Historical marks, attendance, and students remain intact.
              </span>
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setConfirmModalYear(null)}
                disabled={activateLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#10b981', borderColor: '#10b981' }}
                onClick={() => handleActivateYear(confirmModalYear)}
                disabled={activateLoading}
              >
                {activateLoading ? 'Activating...' : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Academic Year Modal */}
      {isNewModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '520px', padding: '28px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                Create Academic Year
              </h3>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '6px', border: 'none' }}
                onClick={() => setIsNewModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {newYearError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {newYearError}
              </div>
            )}

            <form onSubmit={handleCreateYear}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                  Academic Session Name (e.g. 2027-2028)
                </label>
                <input
                  type="text"
                  required
                  placeholder="2027-2028"
                  value={newYearForm.yearName}
                  onChange={(e) => setNewYearForm({ ...newYearForm, yearName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newYearForm.startDate}
                    onChange={(e) => setNewYearForm({ ...newYearForm, startDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newYearForm.endDate}
                    onChange={(e) => setNewYearForm({ ...newYearForm, endDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={newYearForm.setAsActive}
                    onChange={(e) => setNewYearForm({ ...newYearForm, setAsActive: e.target.checked })}
                  />
                  <span>Set this academic session as currently active immediately</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setIsNewModalOpen(false)}
                  disabled={newYearLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={newYearLoading}
                >
                  {newYearLoading ? 'Creating...' : 'Create Academic Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
