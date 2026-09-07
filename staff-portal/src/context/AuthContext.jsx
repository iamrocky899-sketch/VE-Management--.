import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredSession, saveSession, clearStoredSession } from '../utils/session';
import { loginStaff, onSessionError } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredSession());
  const [loading, setLoading] = useState(false);
  const [sessionNotice, setSessionNotice] = useState(null);

  // Subscribe to API-level session expiration/revocation events
  useEffect(() => {
    const unsubscribe = onSessionError(({ reason, message }) => {
      setUser(null);
      setSessionNotice({ reason, message });
    });
    return unsubscribe;
  }, []);

  const login = async (identifier, password) => {
    setLoading(true);
    setSessionNotice(null);

    try {
      const res = await loginStaff(identifier, password);

      if (res && res.success && res.data) {
        const staffData = res.data;
        const saved = saveSession(staffData);
        setUser(saved);
        setLoading(false);
        return { success: true, user: saved };
      } else {
        setLoading(false);
        const errCode = res?.error?.code || 'AUTH_FAILED';
        let errMsg = res?.error?.message || 'Incorrect ID or password.';

        if (errCode === 'ACCOUNT_DEACTIVATED') {
          errMsg = 'Your account has been deactivated. Please contact the Administrator.';
        } else if (errCode === 'TOO_MANY_ATTEMPTS') {
          errMsg = 'Too many failed login attempts. Please wait a few minutes before trying again.';
        } else if (errCode === 'NETWORK_ERROR') {
          errMsg = 'Unable to connect to the school server. Please check your internet connection.';
        }

        return {
          success: false,
          error: { code: errCode, message: errMsg }
        };
      }
    } catch (e) {
      setLoading(false);
      return {
        success: false,
        error: { code: 'CLIENT_ERROR', message: 'An unexpected error occurred. Please try again.' }
      };
    }
  };

  const logout = () => {
    clearStoredSession();
    setUser(null);
    setSessionNotice(null);
  };

  const clearNotice = () => setSessionNotice(null);

  const value = {
    user,
    isAuthenticated: !!user && !!user.token,
    isTeacher: user?.role === 'TEACHER',
    isPrincipal: user?.role === 'PRINCIPAL',
    isAdmin: user?.role === 'ADMIN',
    loading,
    sessionNotice,
    clearNotice,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
