import React, { useState } from 'react';
import { useAuth } from '../state/AuthContext';
import { 
  GraduationCap, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  X,
  School,
  Building2,
  Users,
  CheckCircle2
} from 'lucide-react';
import { trackLoginSuccess, trackLoginFailure } from '../services/analytics';

export default function LoginPage({ onLoginSuccess }) {
  const { login, loading, error, setError, sessionNotice, clearNotice } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const cleanId = identifier.trim();
    const cleanPwd = password.trim();

    if (!cleanId) {
      setError('Please enter your registered mobile number or ID.');
      trackLoginFailure('missing_credentials');
      triggerShake();
      return;
    }

    if (!cleanPwd) {
      setError('Please enter your password.');
      trackLoginFailure('missing_credentials');
      triggerShake();
      return;
    }

    const res = await login(cleanId, cleanPwd);
    if (res && res.success) {
      trackLoginSuccess(res.role);
      if (onLoginSuccess) {
        onLoginSuccess(res.role);
      }
    } else {
      const errMsg = (res?.error?.message || '').toLowerCase();
      const reason = errMsg.includes('connect') || errMsg.includes('server')
        ? 'network_error'
        : 'invalid_credentials';
      trackLoginFailure(reason);
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="neon-login-root">
      {/* Dynamic Ambient Background Elements */}
      <div className="neon-ambient-glow-layer" aria-hidden="true">
        <div className="neon-glow-blob blob-cyan" />
        <div className="neon-glow-blob blob-blue" />
        <div className="neon-glow-blob blob-purple" />
        <div className="neon-glow-blob blob-emerald" />
        <div className="neon-grid-mesh" />
      </div>

      <div className={`neon-login-container animate-fade-in ${shake ? 'card-shake' : ''}`}>
        {/* Brand Header */}
        <header className="neon-brand-header">
          <div className="neon-crest-container">
            <div className="neon-crest-glow" aria-hidden="true" />
            <div className="neon-crest-box">
              <GraduationCap size={36} className="neon-crest-icon" />
            </div>
          </div>

          <div className="neon-brand-titles">
            <div className="neon-brand-pill">
              <Sparkles size={11} className="text-cyan-400" />
              <span>VE MANAGEMENT &bull; GAMERI-HSS-001</span>
            </div>
            <h1 className="neon-portal-title" style={{ letterSpacing: '0.5px' }}>VE MANAGEMENT</h1>
            <p className="neon-portal-subtitle">Gameri Higher Secondary School, Gamiri</p>
          </div>

          <div className="neon-welcome-wrap">
            <h2 className="neon-welcome-heading">Unified Portal Sign In</h2>
            <p className="neon-welcome-sub">
              Enter your registered credentials. Your dashboard is automatically loaded.
            </p>
          </div>
        </header>

        {/* Session Expiration / Deactivation Alert */}
        {sessionNotice && (
          <div 
            className={`neon-alert ${sessionNotice.reason === 'ACCOUNT_DEACTIVATED' ? 'alert-danger' : 'alert-warning'} animate-fade-in`}
            role="alert"
            style={{ marginBottom: '16px' }}
          >
            <AlertCircle size={18} className="flex-shrink-0" />
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '0.85rem' }}>
                {sessionNotice.reason === 'ACCOUNT_DEACTIVATED' ? 'Account Deactivated' : 'Session Expired'}
              </strong>
              <span style={{ fontSize: '0.78rem' }}>{sessionNotice.message}</span>
            </div>
            <button 
              type="button" 
              onClick={clearNotice} 
              className="alert-dismiss-btn"
              aria-label="Dismiss notice"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="neon-alert alert-danger animate-fade-in" role="alert" style={{ marginBottom: '16px' }}>
            <AlertCircle size={18} className="flex-shrink-0 text-rose-400" />
            <span style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>{error}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="neon-form-glass">
          <form onSubmit={handleSubmit} className="neon-form" noValidate>
            {/* Mobile Number / ID */}
            <div className="neon-field-group">
              <label htmlFor="login-mobile" className="neon-label">
                <span>Mobile Number</span>
                <span className="neon-label-hint">Registered Mobile or ID</span>
              </label>
              <div className="neon-input-wrap">
                <span className="neon-input-icon" aria-hidden="true">
                  <Phone size={18} />
                </span>
                <input
                  id="login-mobile"
                  type="text"
                  className="neon-input"
                  placeholder="Enter your mobile number"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="neon-field-group">
              <div className="neon-label-row">
                <label htmlFor="login-password" className="neon-label">
                  <span>Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="neon-inline-link"
                  tabIndex={0}
                >
                  Need Help?
                </button>
              </div>
              <div className="neon-input-wrap">
                <span className="neon-input-icon" aria-hidden="true">
                  <Lock size={18} />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="neon-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="neon-eye-btn"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-login-submit"
              disabled={loading}
              className="neon-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Authenticating Role...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} className="btn-arrow" />
                </>
              )}
            </button>
          </form>

          {/* Quick Guidance Footer */}
          <footer className="neon-form-footer" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.75rem' }}>
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Official Institutional Gateway &bull; Server-Verified Access</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setShowHelpModal(false)}>
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={20} className="text-cyan-400" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Sign In Assistance</h3>
              </div>
              <button type="button" onClick={() => setShowHelpModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 12px' }}>
                <strong>How Unified Sign In works:</strong>
              </p>
              <ul style={{ paddingLeft: '20px', margin: '0 0 16px' }}>
                <li style={{ marginBottom: '6px' }}>
                  <strong>Teachers & Staff:</strong> Enter your 10-digit registered mobile or Staff ID.
                </li>
                <li style={{ marginBottom: '6px' }}>
                  <strong>Parents:</strong> Enter your 10-digit mobile number. If you have multiple children enrolled, you will be able to switch between them.
                </li>
                <li>
                  <strong>Students:</strong> Enter your registered mobile number or Student ID.
                </li>
              </ul>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                For password resets or login issues, please contact the school office.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
