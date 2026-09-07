import React, { useState } from 'react';
import { useAuth } from '../state/AuthContext';
import { ApiService } from '../services/api';
import ChildSelector from '../components/ChildSelector';
import { User, Shield, Key, LogOut, CheckCircle, AlertCircle, Lock, ShieldCheck, School } from 'lucide-react';

export default function ProfilePage() {
  const { session, activeChild, logout, t } = useAuth();
  const student = activeChild?.student || {};

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [updating, setUpdating] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (!newPassword || newPassword.length < 6) {
      setMsg({ text: 'New password must be at least 6 characters long.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setUpdating(true);
    try {
      const res = await ApiService.changePassword(session.token, oldPassword, newPassword);
      if (res && res.success) {
        setMsg({ text: t('passwordSuccess'), type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMsg({ text: res?.error?.message || 'Failed to update password.', type: 'error' });
      }
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <ChildSelector />

      {/* Student Information Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <User size={18} color="var(--primary)" />
            <span>{t('studentInfo')}</span>
          </div>
          <span className="badge badge-green">{t('active')}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div style={{ padding: '10px 12px', background: 'var(--bg-card-muted)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>Student Name</div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{student.studentName || 'Manish Hazarika'}</div>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-card-muted)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('class')} & {t('section')}</div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Class {student.class || '9'} (Sec {student.section || 'A'})</div>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-card-muted)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('rollNo')}</div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{student.rollNo || '10'}</div>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-card-muted)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('fatherName')}</div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{student.fatherName || student.father || 'Bhaben Hazarika'}</div>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-card-muted)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('motherName')}</div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{student.motherName || student.mother || 'Rupa Hazarika'}</div>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-card-muted)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('mobile')}</div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>+91 {session?.parent?.mobile || '9876543210'}</div>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-card-muted)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('village')}</div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{student.village || 'Gamiri Gaon'}</div>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-card-muted)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>{t('aadhaarProtected')}</div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>XXXX XXXX 1234</div>
          </div>
        </div>
      </div>

      {/* Account & Security Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Key size={18} color="var(--primary)" />
            <span>{t('accountSecurity')}</span>
          </div>
        </div>

        {msg.text && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: msg.type === 'success' ? 'var(--accent-green-light)' : 'var(--accent-rose-light)',
            color: msg.type === 'success' ? 'var(--accent-green-text)' : 'var(--accent-rose-text)',
            fontSize: '0.82rem',
            fontWeight: '600',
            marginBottom: '14px'
          }}>
            {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {t('currentPassword')}
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem'
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {t('newPassword')}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.9rem'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {t('confirmPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.9rem'
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={updating}
            className="btn-primary"
            style={{ alignSelf: 'flex-start', marginTop: '4px', minHeight: '42px' }}
          >
            {updating ? 'Updating...' : t('updatePassword')}
          </button>
        </form>
      </div>

      {/* Logout Action */}
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button
          onClick={logout}
          className="btn-secondary"
          style={{ color: 'var(--accent-rose-text)', borderColor: 'var(--accent-rose-light)', padding: '10px 24px' }}
        >
          <LogOut size={16} />
          <span>{t('navLogout')}</span>
        </button>
      </div>
    </div>
  );
}
