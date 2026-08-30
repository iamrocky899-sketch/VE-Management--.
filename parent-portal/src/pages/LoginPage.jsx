import React, { useState } from 'react';
import { useAuth } from '../state/AuthContext';
import { 
  GraduationCap, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  School,
  ArrowRight,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const { login, loading, error, setError } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!identifier.trim()) {
      setError('Please enter your Student ID, Roll No, or Mobile number.');
      triggerShake();
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      triggerShake();
      return;
    }

    const res = await login(identifier, password);
    if (res && res.success) {
      if (onLoginSuccess) {
        onLoginSuccess(res.role);
      }
    } else {
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="login-container">
      {/* Ambient background decorative orbs */}
      <div className="login-backdrop-shapes" aria-hidden="true">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className={`login-card-wrapper animate-slide-up ${shake ? 'card-shake' : ''}`}>
        {/* School Crest & Institutional Header */}
        <header className="login-header">
          <div className="school-crest-badge-container">
            <div className="school-crest-badge">
              <GraduationCap size={38} strokeWidth={2.2} className="text-primary-600" />
            </div>
            <div className="school-crest-glow" aria-hidden="true" />
          </div>

          <div className="school-meta">
            <span className="school-code-tag">
              <ShieldCheck size={12} className="inline mr-1" />
              UDISE / CODE: GAMERI-HSS-001
            </span>
            <h1 className="school-name">Gameri Higher Secondary School</h1>
            <p className="portal-subheading">Student &amp; Parent Portal &bull; Gamiri, Assam</p>
          </div>
        </header>

        {/* Login Glassmorphism Card */}
        <main className="login-card glass-card">
          <div className="login-card-title-area">
            <h2 className="login-card-title">Sign In to Portal</h2>
            <p className="login-card-instruction">
              Access attendance, academic reports, notices, and student progress
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div 
              className="alert-banner alert-danger animate-fade-in" 
              role="alert" 
              aria-live="assertive"
            >
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div className="alert-text">
                <strong>Sign In Notice: </strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Identifier Field */}
            <div className="form-group">
              <label htmlFor="login-identifier" className="form-label">
                Student ID / Roll No / Mobile
              </label>
              <div className="input-group">
                <span className="input-icon" aria-hidden="true">
                  <User size={19} />
                </span>
                <input
                  id="login-identifier"
                  type="text"
                  className="form-input"
                  placeholder="e.g. STU_101 or 9876543210"
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

            {/* Password Field */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="login-password" className="form-label">
                  Password
                </label>
              </div>
              <div className="input-group">
                <span className="input-icon" aria-hidden="true">
                  <Lock size={19} />
                </span>
                <input
                  id="login-password"
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
                  className="password-toggle-btn"
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

            {/* Submit Button */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner" aria-hidden="true" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight size={18} className="btn-arrow" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badges */}
          <div className="login-footer-security">
            <div className="security-item">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Official School System</span>
            </div>
            <div className="security-dot" aria-hidden="true">&bull;</div>
            <div className="security-item">
              <School size={14} className="text-sky-600" />
              <span>Vocational Education</span>
            </div>
          </div>
        </main>

        {/* Support Note */}
        <footer className="login-help-note">
          <HelpCircle size={15} className="flex-shrink-0 text-slate-400" />
          <p>
            Need help signing in or forgot credentials? Please contact your Class Teacher or School Office.
          </p>
        </footer>
      </div>
    </div>
  );
}
