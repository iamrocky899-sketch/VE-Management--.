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
  HelpCircle,
  Sparkles,
  X,
  Shield
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const { login, loading, error, setError } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const cleanId = identifier.trim();
    const cleanPwd = password.trim();

    if (!cleanId) {
      setError('Please enter your registered mobile number.');
      triggerShake();
      return;
    }

    if (!cleanPwd) {
      setError('Please enter your password.');
      triggerShake();
      return;
    }

    const res = await login(cleanId, cleanPwd);
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
    <div className="neon-login-root">
      {/* Dynamic Ambient Neon Background Blobs & Floating Particles */}
      <div className="neon-ambient-glow-layer" aria-hidden="true">
        <div className="neon-glow-blob blob-cyan" />
        <div className="neon-glow-blob blob-blue" />
        <div className="neon-glow-blob blob-purple" />
        <div className="neon-glow-blob blob-emerald" />

        {/* Lightweight Floating Particle Orbs */}
        <div className="neon-particle p1" />
        <div className="neon-particle p2" />
        <div className="neon-particle p3" />
        <div className="neon-particle p4" />
        <div className="neon-particle p5" />
        <div className="neon-particle p6" />
        <div className="neon-grid-mesh" />
      </div>

      <div className={`neon-login-container animate-fade-in ${shake ? 'card-shake' : ''}`}>
        {/* Institutional Futuristic Header */}
        <header className="neon-brand-header">
          <div className="neon-crest-container">
            <div className="neon-crest-glow" aria-hidden="true" />
            <div className="neon-crest-box">
              <GraduationCap size={32} className="neon-crest-icon" />
            </div>
          </div>

          <div className="neon-brand-titles">
            <div className="neon-brand-pill">
              <Sparkles size={11} className="text-cyan-400" />
              <span>VE MANAGEMENT &bull; GAMERI-HSS-001</span>
            </div>
            <h1 className="neon-portal-title">PARENT PORTAL</h1>
            <p className="neon-portal-subtitle">Gameri Higher Secondary School &bull; Assam</p>
          </div>

          <div className="neon-welcome-wrap">
            <h2 className="neon-welcome-heading">Welcome Back!</h2>
            <p className="neon-welcome-sub">Sign in to access your children's academic information</p>
          </div>
        </header>

        {/* Central Organic Neon Glass Panel */}
        <main className="neon-glass-card">
          <div className="neon-card-border-glow" aria-hidden="true" />

          <div className="neon-card-inner">
            <div className="neon-card-header-badge">
              <span className="neon-badge-title">LOGIN</span>
              <span className="neon-badge-sub">Please sign in to continue</span>
            </div>

            {/* Error State Banner */}
            {error && (
              <div 
                className="neon-alert-banner animate-fade-in" 
                role="alert" 
                aria-live="assertive"
              >
                <AlertCircle size={18} className="neon-alert-icon" />
                <div className="neon-alert-content">
                  <div className="neon-alert-heading">Unable to Sign In</div>
                  <div className="neon-alert-text">{error}</div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="neon-form" noValidate>
              {/* Mobile Number Field */}
              <div className="neon-field-group">
                <label htmlFor="login-mobile" className="neon-label">
                  <span>Mobile Number</span>
                  <span className="neon-label-hint">10-Digit Mobile</span>
                </label>
                <div className="neon-input-wrap">
                  <span className="neon-input-icon" aria-hidden="true">
                    <Phone size={18} />
                  </span>
                  <input
                    id="login-mobile"
                    type="tel"
                    inputMode="numeric"
                    className="neon-input"
                    placeholder="Enter your registered mobile number"
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
              <div className="neon-field-group">
                <div className="neon-label-row">
                  <label htmlFor="login-password" className="neon-label">
                    <span>Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="neon-inline-link"
                    tabIndex={0}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="neon-input-wrap">
                  <span className="neon-input-icon" aria-hidden="true">
                    <Lock size={18} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="neon-input neon-password-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                    required
                    aria-required="true"
                  />
                  <button
                    type="button"
                    className="neon-pw-toggle"
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

              {/* Sign In Button */}
              <button
                type="submit"
                className="neon-submit-btn"
                disabled={loading}
                aria-busy={loading}
              >
                <div className="neon-btn-glow" aria-hidden="true" />
                <div className="neon-btn-content">
                  {loading ? (
                    <>
                      <Loader2 size={19} className="neon-spinner" aria-hidden="true" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={18} className="neon-btn-arrow" aria-hidden="true" />
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>
        </main>

        {/* Security & Trust Area */}
        <section className="neon-trust-strip" aria-label="Security and Trust Information">
          <div className="neon-trust-card">
            <div className="neon-trust-icon-box lock-box">
              <ShieldCheck size={15} />
            </div>
            <div className="neon-trust-text-group">
              <div className="neon-trust-title">Secure &amp; Safe</div>
              <div className="neon-trust-desc">Your data is protected</div>
            </div>
          </div>

          <div className="neon-trust-card">
            <div className="neon-trust-icon-box school-box">
              <GraduationCap size={15} />
            </div>
            <div className="neon-trust-text-group">
              <div className="neon-trust-title">Official Portal</div>
              <div className="neon-trust-desc">Powered by VE Management</div>
            </div>
          </div>
        </section>

        {/* Subtle Footer */}
        <footer className="neon-footer">
          <p className="neon-copy">&copy; 2026 VE Management System. All rights reserved.</p>
          <div className="neon-footer-badge">
            <Shield size={12} className="text-emerald-400" />
            <span>Trusted by Parents</span>
          </div>
        </footer>
      </div>

      {/* Forgot Password Assistance Modal */}
      {showForgotModal && (
        <div className="neon-modal-backdrop" onClick={() => setShowForgotModal(false)} role="dialog" aria-modal="true">
          <div className="neon-modal-box animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="neon-modal-close" 
              onClick={() => setShowForgotModal(false)}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <div className="neon-modal-icon-header">
              <div className="neon-modal-icon-circle blue-circle">
                <HelpCircle size={24} />
              </div>
              <h3 className="neon-modal-title">Password Assistance</h3>
            </div>
            <div className="neon-modal-body">
              <p>
                For parent accounts, the default school common password is:
              </p>
              <div className="neon-code-box">
                <span>12345</span>
              </div>
              <p style={{ marginTop: '12px', fontSize: '0.84rem', color: '#94a3b8' }}>
                If you customized your password and cannot recall it, please contact your child's Class Teacher or the School Administration to have your password reset to common.
              </p>
            </div>
            <button
              type="button"
              className="neon-modal-btn"
              onClick={() => setShowForgotModal(false)}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
