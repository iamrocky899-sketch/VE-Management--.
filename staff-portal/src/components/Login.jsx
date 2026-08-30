import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  School,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function Login() {
  const { login, loading, sessionNotice, clearNotice } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!identifier.trim() || !password.trim()) {
      setError('Please enter both your identifier and password.');
      triggerShake();
      return;
    }

    setError(null);
    clearNotice();

    const res = await login(identifier, password);
    if (!res.success) {
      setError(res.error?.message || 'Incorrect ID or password.');
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="login-wrapper">
      {/* Ambient background glow accents */}
      <div className="login-bg-decor login-bg-1" aria-hidden="true" />
      <div className="login-bg-decor login-bg-2" aria-hidden="true" />
      <div className="login-bg-decor login-bg-3" aria-hidden="true" />

      <main className={`login-card ${shake ? 'card-shake' : ''}`}>
        {/* Institutional Branding Header */}
        <header className="login-header">
          <div className="school-badge-container">
            <div className="school-badge">
              <GraduationCap size={36} strokeWidth={2.2} />
            </div>
            <div className="school-badge-glow" aria-hidden="true" />
          </div>

          <div className="school-identity">
            <span className="school-code-pill">
              <ShieldCheck size={12} className="text-primary-600" />
              <span>CODE: GAMERI-HSS-001</span>
            </span>
            <h1 className="login-title">Gameri Higher Secondary School</h1>
            <p className="login-subtitle">Staff Portal &bull; Gamiri, Assam</p>
            <p className="school-tagline">Vocational &amp; Academic Management System</p>
          </div>
        </header>

        {/* Welcome Section */}
        <div className="login-form-heading">
          <h2 className="form-section-title">Sign In to Staff Portal</h2>
          <p className="form-section-subtitle">
            Enter your registered Mobile, Staff ID, or Email to continue
          </p>
        </div>

        {/* Session Expiration / Deactivation Notice */}
        {sessionNotice && (
          <div 
            className={`alert-banner ${sessionNotice.reason === 'ACCOUNT_DEACTIVATED' ? 'alert-danger' : 'alert-warning'} animate-fade-in`}
            role="alert"
            aria-live="assertive"
          >
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <div className="alert-content">
              <strong>Notice: </strong>
              <span>{sessionNotice.message}</span>
            </div>
          </div>
        )}

        {/* Validation / Authentication Error */}
        {error && (
          <div 
            className="alert-banner alert-danger animate-fade-in" 
            role="alert" 
            aria-live="assertive"
          >
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div className="alert-content">
              <strong>Authentication Error: </strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="staff-identifier">
              Mobile, Staff ID, or Email
            </label>
            <div className="input-container">
              <span className="input-icon" aria-hidden="true">
                <User size={19} />
              </span>
              <input
                id="staff-identifier"
                type="text"
                className="form-input"
                placeholder="e.g. 9435123456 or STF_001"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                autoComplete="username"
                autoFocus
                required
                aria-required="true"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="staff-password">
                Password
              </label>
            </div>
            <div className="input-container">
              <span className="input-icon" aria-hidden="true">
                <Lock size={19} />
              </span>
              <input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input password-input"
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                required
                aria-required="true"
              />
              <button
                type="button"
                className="toggle-pw-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
                tabIndex={0}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary login-btn" 
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>Authenticating Staff...</span>
              </>
            ) : (
              <>
                <span>Sign In to Staff Portal</span>
                <ArrowRight size={18} className="btn-icon" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {/* Security Badges & Footer Meta */}
        <footer className="login-footer">
          <div className="login-trust-badges">
            <span className="trust-badge">
              <ShieldCheck size={14} className="trust-icon" />
              <span>Official Institutional Portal</span>
            </span>
            <span className="trust-badge-dot">&bull;</span>
            <span className="trust-badge">
              <School size={14} className="trust-icon" />
              <span>VE Management</span>
            </span>
          </div>

          <div className="login-support-card">
            <HelpCircle size={14} className="flex-shrink-0 text-slate-400" />
            <p>
              For credential recovery or staff onboarding support, contact the school administrative office.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
