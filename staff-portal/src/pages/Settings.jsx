import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendApiRequest } from '../api/client';
import {
  School,
  Image,
  BookOpen,
  CalendarCheck,
  Award,
  FileText,
  Bell,
  Shield,
  Database,
  Sliders,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Save,
  Lock
} from 'lucide-react';

export default function Settings() {
  const { isPrincipal, isAdmin, user } = useAuth();
  const canEdit = isPrincipal || isAdmin;

  const [activeTab, setActiveTab] = useState('school');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await sendApiRequest('get_settings', {});
      if (res && res.success && res.data && res.data.settings) {
        const map = {};
        res.data.settings.forEach(s => {
          map[s.key] = s;
        });
        setSettings(map);
      } else {
        setErrorMessage(res?.error?.message || 'Failed to load settings');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error connecting to settings API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { key, domain: 'GENERAL' }),
        value
      }
    }));
  };

  const handleSaveDomain = async (domainKeys) => {
    if (!canEdit) return;
    setSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);

    try {
      const toUpdate = domainKeys.map(k => settings[k]).filter(Boolean);
      const res = await sendApiRequest('bulk_update_settings', { settings: toUpdate });
      if (res && res.success) {
        setSaveMessage('Institutional settings updated successfully');
        setTimeout(() => setSaveMessage(null), 4000);
        fetchSettings();
      } else {
        setErrorMessage(res?.error?.message || 'Update failed');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Save error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'school', label: 'School Profile', icon: School },
    { id: 'branding', label: 'Branding & Headers', icon: Image },
    { id: 'academic', label: 'Academic & Sessions', icon: BookOpen },
    { id: 'attendance', label: 'Attendance Rules', icon: CalendarCheck },
    { id: 'grading', label: 'Grading & Pass Rules', icon: Award },
    { id: 'documents', label: 'Document Numbering', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Backup', icon: Shield },
    { id: 'flags', label: 'Feature Flags', icon: Sliders }
  ];

  if (loading) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem', color: 'var(--primary-600)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading authoritative institutional settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            System Administration & Institutional Settings
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Authoritative configuration for Gameri Higher Secondary School (GAMERI-HSS-001)
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchSettings} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Status Messages */}
      {saveMessage && (
        <div style={{ padding: '1rem', backgroundColor: '#ECFDF5', border: '1px solid #10B981', borderRadius: '8px', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} /> {saveMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} /> {errorMessage}
        </div>
      )}

      {/* Tabs Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Sidebar Tabs */}
        <div className="card" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? 'var(--primary-50, #EEF2FF)' : 'transparent',
                  color: isActive ? 'var(--primary-700, #4338CA)' : 'var(--text-secondary)',
                  fontWeight: isActive ? '600' : '400',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                <Icon size={18} />
                <span style={{ fontSize: '0.9rem' }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="card" style={{ padding: '1.75rem' }}>
          {/* TAB 1: SCHOOL PROFILE */}
          {activeTab === 'school' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>🏫 School Profile & Identity</h3>
                {canEdit && (
                  <button className="btn btn-primary" onClick={() => handleSaveDomain(['SCHOOL_NAME', 'SCHOOL_SHORT_NAME', 'SCHOOL_CODE', 'SCHOOL_ADDRESS', 'SCHOOL_DISTRICT', 'SCHOOL_STATE', 'SCHOOL_PINCODE', 'SCHOOL_PHONE', 'SCHOOL_EMAIL', 'SCHOOL_WEBSITE'])} disabled={saving}>
                    <Save size={16} /> Save Profile
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Official School Name</label>
                  <input className="input" value={settings['SCHOOL_NAME']?.value || ''} onChange={e => handleChange('SCHOOL_NAME', e.target.value)} disabled={!canEdit} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Short School Name</label>
                  <input className="input" value={settings['SCHOOL_SHORT_NAME']?.value || ''} onChange={e => handleChange('SCHOOL_SHORT_NAME', e.target.value)} disabled={!canEdit} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>School Tenancy ID (Immutable)</label>
                  <input className="input" value={settings['SCHOOL_ID']?.value || 'GAMERI-HSS-001'} disabled style={{ backgroundColor: '#F3F4F6' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>State School Code</label>
                  <input className="input" value={settings['SCHOOL_CODE']?.value || ''} onChange={e => handleChange('SCHOOL_CODE', e.target.value)} disabled={!canEdit} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Physical Campus Address</label>
                  <input className="input" value={settings['SCHOOL_ADDRESS']?.value || ''} onChange={e => handleChange('SCHOOL_ADDRESS', e.target.value)} disabled={!canEdit} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>District</label>
                  <input className="input" value={settings['SCHOOL_DISTRICT']?.value || ''} onChange={e => handleChange('SCHOOL_DISTRICT', e.target.value)} disabled={!canEdit} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Postal PIN Code</label>
                  <input className="input" value={settings['SCHOOL_PINCODE']?.value || ''} onChange={e => handleChange('SCHOOL_PINCODE', e.target.value)} disabled={!canEdit} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BRANDING */}
          {activeTab === 'branding' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>🎨 School Branding, Logo & Official Signatures</h3>
                {canEdit && (
                  <button className="btn btn-primary" onClick={() => handleSaveDomain(['LOGO_URL', 'SEAL_URL', 'PRINCIPAL_SIGNATURE_URL', 'TEACHER_SIGNATURE_URL', 'DOCUMENT_HEADER', 'DOCUMENT_FOOTER'])} disabled={saving}>
                    <Save size={16} /> Save Branding & Signatures
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Official Document Header Text</label>
                  <input className="input" value={settings['DOCUMENT_HEADER']?.value || ''} onChange={e => handleChange('DOCUMENT_HEADER', e.target.value)} disabled={!canEdit} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Official Document Footer Text</label>
                  <input className="input" value={settings['DOCUMENT_FOOTER']?.value || ''} onChange={e => handleChange('DOCUMENT_FOOTER', e.target.value)} disabled={!canEdit} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  {/* School Logo */}
                  <div style={{ padding: '1rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.5rem', color: '#1E293B' }}>School Logo / Crest</div>
                    {settings['LOGO_URL']?.value && settings['LOGO_URL']?.value !== 'DEVELOPMENT_PLACEHOLDER' ? (
                      <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={settings['LOGO_URL'].value} alt="School Logo" style={{ height: '50px', maxWidth: '120px', objectFit: 'contain' }} />
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Active Crest Uploaded</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#B45309', marginBottom: '0.5rem' }}>Using default SVG Crest</div>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      disabled={!canEdit}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => handleChange('LOGO_URL', evt.target.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ fontSize: '0.8rem' }}
                    />
                  </div>

                  {/* Institutional Seal */}
                  <div style={{ padding: '1rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.5rem', color: '#1E293B' }}>Official Institutional Seal</div>
                    {settings['SEAL_URL']?.value && settings['SEAL_URL']?.value !== 'DEVELOPMENT_PLACEHOLDER' ? (
                      <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={settings['SEAL_URL'].value} alt="Seal" style={{ height: '50px', maxWidth: '120px', objectFit: 'contain' }} />
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Active Seal Uploaded</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#B45309', marginBottom: '0.5rem' }}>Using default Seal</div>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      disabled={!canEdit}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => handleChange('SEAL_URL', evt.target.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ fontSize: '0.8rem' }}
                    />
                  </div>

                  {/* Principal Signature */}
                  <div style={{ padding: '1rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.5rem', color: '#1E293B' }}>Principal Official Signature</div>
                    {settings['PRINCIPAL_SIGNATURE_URL']?.value && settings['PRINCIPAL_SIGNATURE_URL']?.value !== 'DEVELOPMENT_PLACEHOLDER' ? (
                      <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={settings['PRINCIPAL_SIGNATURE_URL'].value} alt="Principal Signature" style={{ height: '40px', maxWidth: '120px', objectFit: 'contain' }} />
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Active Signature</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#B45309', marginBottom: '0.5rem' }}>Signature placeholder active</div>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      disabled={!canEdit}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => handleChange('PRINCIPAL_SIGNATURE_URL', evt.target.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ fontSize: '0.8rem' }}
                    />
                  </div>

                  {/* Teacher Signature */}
                  <div style={{ padding: '1rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.5rem', color: '#1E293B' }}>Teacher Official Signature</div>
                    {settings['TEACHER_SIGNATURE_URL']?.value && settings['TEACHER_SIGNATURE_URL']?.value !== 'DEVELOPMENT_PLACEHOLDER' ? (
                      <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={settings['TEACHER_SIGNATURE_URL'].value} alt="Teacher Signature" style={{ height: '40px', maxWidth: '120px', objectFit: 'contain' }} />
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Active Signature</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#B45309', marginBottom: '0.5rem' }}>Signature placeholder active</div>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      disabled={!canEdit}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => handleChange('TEACHER_SIGNATURE_URL', evt.target.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACADEMIC */}
          {activeTab === 'academic' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>📚 Academic Session Defaults</h3>
                {canEdit && (
                  <button className="btn btn-primary" onClick={() => handleSaveDomain(['ACADEMIC_YEAR', 'DEFAULT_CLASS', 'DEFAULT_SECTION', 'YEAR_FORMAT'])} disabled={saving}>
                    <Save size={16} /> Save Academic Defaults
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Active Academic Year</label>
                  <input className="input" value={settings['ACADEMIC_YEAR']?.value || '2026-2027'} disabled style={{ backgroundColor: '#F3F4F6' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Managed via Academic Years directory</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Display Pattern</label>
                  <input className="input" value={settings['YEAR_FORMAT']?.value || 'YYYY-YYYY'} onChange={e => handleChange('YEAR_FORMAT', e.target.value)} disabled={!canEdit} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>📊 Attendance Policy</h3>
                {canEdit && (
                  <button className="btn btn-primary" onClick={() => handleSaveDomain(['ATTENDANCE_ALERT_THRESHOLD', 'LATE_COUNTS_AS_PRESENT', 'LEAVE_REQUIRES_REASON'])} disabled={saving}>
                    <Save size={16} /> Save Attendance Policy
                  </button>
                )}
              </div>

              <div style={{ padding: '1rem', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '6px', marginBottom: '1.5rem' }}>
                <strong style={{ color: '#92400E' }}>Policy Status: </strong>
                <span style={{ color: '#B45309', fontWeight: '600' }}>CONFIGURED — NOT LIVE (REQUIRES INSTITUTIONAL APPROVAL)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Low Attendance Alert Threshold (%)</label>
                  <input className="input" type="number" value={settings['ATTENDANCE_ALERT_THRESHOLD']?.value || '75'} onChange={e => handleChange('ATTENDANCE_ALERT_THRESHOLD', e.target.value)} disabled={!canEdit} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Calculation Semantics</label>
                  <input className="input" value="(Present + Late) / Total × 100" disabled style={{ backgroundColor: '#F3F4F6' }} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GRADING */}
          {activeTab === 'grading' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>🎓 Grading & Pass/Fail Policy</h3>
                {canEdit && (
                  <button className="btn btn-primary" onClick={() => handleSaveDomain(['PASS_SUBJECT_MINIMUM', 'OVERALL_PASS_RULE'])} disabled={saving}>
                    <Save size={16} /> Save Pass Rules
                  </button>
                )}
              </div>

              <div style={{ padding: '1rem', background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '6px', marginBottom: '1.5rem' }}>
                <strong style={{ color: '#92400E' }}>Grading Policy Status: </strong>
                <span style={{ color: '#B45309', fontWeight: '600' }}>CONFIGURED — NOT LIVE (REQUIRES INSTITUTIONAL APPROVAL)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Minimum Subject Pass Percentage (%)</label>
                  <input className="input" type="number" value={settings['PASS_SUBJECT_MINIMUM']?.value || '30'} onChange={e => handleChange('PASS_SUBJECT_MINIMUM', e.target.value)} disabled={!canEdit} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Overall Evaluation Criterion</label>
                  <input className="input" value={settings['OVERALL_PASS_RULE']?.value || 'ALL_SUBJECTS_PASS'} disabled style={{ backgroundColor: '#F3F4F6' }} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>📄 Document Numbering & Signatories</h3>
                {canEdit && (
                  <button className="btn btn-primary" onClick={() => handleSaveDomain(['DOCUMENT_NUMBER_PREFIX', 'DOCUMENT_NUMBER_FORMAT', 'SEQUENCE_PADDING', 'DEFAULT_SIGNATORY_TITLE', 'DEFAULT_SIGNATORY_NAME'])} disabled={saving}>
                    <Save size={16} /> Save Document Config
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Document Number Prefix</label>
                  <input className="input" value={settings['DOCUMENT_NUMBER_PREFIX']?.value || 'GHSS'} onChange={e => handleChange('DOCUMENT_NUMBER_PREFIX', e.target.value)} disabled={!canEdit} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Sequence Zero-Padding</label>
                  <input className="input" type="number" value={settings['SEQUENCE_PADDING']?.value || '4'} onChange={e => handleChange('SEQUENCE_PADDING', e.target.value)} disabled={!canEdit} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Default Signatory Title</label>
                  <input className="input" value={settings['DEFAULT_SIGNATORY_TITLE']?.value || 'Principal'} onChange={e => handleChange('DEFAULT_SIGNATORY_TITLE', e.target.value)} disabled={!canEdit} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Default Signatory Name</label>
                  <input className="input" value={settings['DEFAULT_SIGNATORY_NAME']?.value || 'Dr. B. K. Sarmah'} onChange={e => handleChange('DEFAULT_SIGNATORY_NAME', e.target.value)} disabled={!canEdit} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>📣 Notification Channels</h3>
                {canEdit && (
                  <button className="btn btn-primary" onClick={() => handleSaveDomain(['IN_APP_NOTIFICATIONS_ENABLED', 'ANDROID_NOTIFICATIONS_ENABLED', 'WHATSAPP_NOTIFICATIONS_ENABLED', 'NOTICE_NOTIFICATIONS_ENABLED', 'EXAM_REMINDERS_ENABLED'])} disabled={saving}>
                    <Save size={16} /> Save Notifications
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings['IN_APP_NOTIFICATIONS_ENABLED']?.value === 'true'} onChange={e => handleChange('IN_APP_NOTIFICATIONS_ENABLED', String(e.target.checked))} disabled={!canEdit} />
                  <span>In-App Notification Feed Active</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings['ANDROID_NOTIFICATIONS_ENABLED']?.value === 'true'} onChange={e => handleChange('ANDROID_NOTIFICATIONS_ENABLED', String(e.target.checked))} disabled={!canEdit} />
                  <span>Android App Push Notifications Active</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings['WHATSAPP_NOTIFICATIONS_ENABLED']?.value === 'true'} onChange={e => handleChange('WHATSAPP_NOTIFICATIONS_ENABLED', String(e.target.checked))} disabled={!canEdit} />
                  <span>WhatsApp Notifications Active (Requires Institutional Gateway Setup)</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 8: SECURITY */}
          {activeTab === 'security' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>🔐 Security & Disaster Recovery</h3>
                {isAdmin && (
                  <button className="btn btn-primary" onClick={() => handleSaveDomain(['SESSION_TIMEOUT_DAYS', 'MAX_LOGIN_ATTEMPTS', 'LOCKOUT_WINDOW_MINUTES', 'AUDIT_RETENTION_DAYS'])} disabled={saving}>
                    <Save size={16} /> Save Security Defaults
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Session Token Lifetime (Days)</label>
                  <input className="input" type="number" value={settings['SESSION_TIMEOUT_DAYS']?.value || '30'} onChange={e => handleChange('SESSION_TIMEOUT_DAYS', e.target.value)} disabled={!isAdmin} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Max Failed Login Attempts</label>
                  <input className="input" type="number" value={settings['MAX_LOGIN_ATTEMPTS']?.value || '5'} onChange={e => handleChange('MAX_LOGIN_ATTEMPTS', e.target.value)} disabled={!isAdmin} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Recovery Point Objective (RPO)</label>
                  <input className="input" value="24 Hours (Daily Snapshot)" disabled style={{ backgroundColor: '#F3F4F6' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Recovery Time Objective (RTO)</label>
                  <input className="input" value="2 Hours" disabled style={{ backgroundColor: '#F3F4F6' }} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: FEATURE FLAGS */}
          {activeTab === 'flags' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>⚙️ Modular Feature Flags</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Curriculum-Aware Attendance 2.0</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Attendance marking with face recognition & offline sync</div>
                  </div>
                  <span style={{ color: '#059669', fontWeight: '600', fontSize: '0.85rem' }}>ACTIVE</span>
                </div>
                <div style={{ padding: '0.75rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Examination & Marks Engine 2.0</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Theory/Practical marks, grading scale & results</div>
                  </div>
                  <span style={{ color: '#059669', fontWeight: '600', fontSize: '0.85rem' }}>ACTIVE</span>
                </div>
                <div style={{ padding: '0.75rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Official Academic Documents 2.0</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Marksheets, certificates & QR verification</div>
                  </div>
                  <span style={{ color: '#059669', fontWeight: '600', fontSize: '0.85rem' }}>ACTIVE</span>
                </div>
                <div style={{ padding: '0.75rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Notices & Communication 2.0</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lifecycle circulars, ASSEB calendar & timetables</div>
                  </div>
                  <span style={{ color: '#059669', fontWeight: '600', fontSize: '0.85rem' }}>ACTIVE</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
