import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiService } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_SESSION_KEY = 'itd3_portal_session';
const STORAGE_SELECTED_CHILD = 'itd3_portal_selected_child_id';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SESSION_KEY) || sessionStorage.getItem(STORAGE_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState(() => {
    return localStorage.getItem(STORAGE_SELECTED_CHILD) || null;
  });

  // Session restoration on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SESSION_KEY) || sessionStorage.getItem(STORAGE_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.token) {
          // Check expiration
          if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
            logout();
          } else {
            setUser(parsed);
            if (parsed.children && parsed.children.length > 0 && !selectedChildId) {
              setSelectedChildId(parsed.children[0].studentId);
            }
          }
        }
      }
    } catch (e) {
      console.error("[AuthContext] Session restoration error:", e);
    } finally {
      setIsCheckingSession(false);
    }
  }, []);

  // Login handler
  const login = async (identifier, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.login(identifier, password);

      if (res && res.success && res.data) {
        const userData = res.data;
        const role = (userData.role || '').toUpperCase();

        // If staff logs in here, direct them to the Staff Portal
        if (['TEACHER', 'PRINCIPAL', 'ADMIN'].includes(role)) {
          const staffMsg = 'Staff accounts should use the Staff Portal. Please access the Staff Portal to log in.';
          setError(staffMsg);
          setLoading(false);
          return { success: false, error: staffMsg, isStaff: true };
        }

        const safeSession = {
          token: userData.token,
          userId: userData.userId || userData.studentId || userData.parentId,
          role: role,
          name: userData.name || userData.studentName || userData.parentName || 'User',
          studentId: userData.studentId || null,
          parentId: userData.parentId || null,
          class: userData.class || null,
          section: userData.section || null,
          rollNo: userData.rollNo || null,
          mobile: userData.mobile || null,
          children: userData.children || [],
          expiresAt: userData.expiresAt,
          passwordMode: userData.passwordMode || 'COMMON',
          isCustomPassword: userData.isCustomPassword || false,
          status: userData.status || 'Active'
        };

        setUser(safeSession);
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(safeSession));

        if (safeSession.children.length > 0) {
          const firstChildId = safeSession.children[0].studentId;
          setSelectedChildId(firstChildId);
          localStorage.setItem(STORAGE_SELECTED_CHILD, firstChildId);
        }

        setLoading(false);
        return { success: true, role: role };
      } else {
        let errMsg = 'Invalid login credentials.';
        const errCode = res?.error?.code;

        if (errCode === 'ACCOUNT_DEACTIVATED') {
          errMsg = 'Your account is inactive. Please contact the school.';
        } else if (errCode === 'TOO_MANY_ATTEMPTS') {
          errMsg = 'Too many failed login attempts. Please try again in 15 minutes.';
        } else if (errCode === 'INVALID_CREDENTIALS' || errCode === 'AUTH_FAILED') {
          errMsg = 'Invalid login details. Please check your ID / mobile and password.';
        } else if (errCode === 'NETWORK_ERROR') {
          errMsg = 'Unable to connect. Please check your internet connection.';
        } else if (res?.error?.message) {
          errMsg = res.error.message;
        }

        setError(errMsg);
        setLoading(false);
        return { success: false, error: errMsg };
      }
    } catch (err) {
      const msg = 'Unable to connect to school server. Please try again.';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  // Logout handler
  const logout = () => {
    ApiService.clearCache();
    setUser(null);
    setSelectedChildId(null);
    setError(null);
    localStorage.removeItem(STORAGE_SESSION_KEY);
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
    localStorage.removeItem(STORAGE_SELECTED_CHILD);
  };

  // Change Password
  const changePassword = async (oldPassword, newPassword) => {
    if (!user?.token) return { success: false, error: 'Authentication required' };
    setLoading(true);
    try {
      const res = await ApiService.changePassword(user.token, oldPassword, newPassword);
      if (res && res.success) {
        const updated = { ...user, isCustomPassword: true, passwordMode: 'CUSTOM' };
        setUser(updated);
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updated));
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, error: res?.error?.message || 'Failed to change password' };
      }
    } catch (e) {
      setLoading(false);
      return { success: false, error: e.message };
    }
  };

  // Real-time Session Revocation / Account Deactivation
  const handleSessionRevocation = (reason = 'SESSION_EXPIRED') => {
    logout();
    if (reason === 'ACCOUNT_DEACTIVATED') {
      setError('Your account has been deactivated. Please contact the administrator.');
    } else {
      setError('Your session has expired. Please sign in again.');
    }
  };

  // Switch Active Child for Multi-Child Parents
  const switchChild = (childId) => {
    setSelectedChildId(childId);
    localStorage.setItem(STORAGE_SELECTED_CHILD, childId);
  };

  const updateChildren = (childrenList) => {
    if (!user) return;
    const updated = { ...user, children: childrenList };
    setUser(updated);
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updated));
  };

  const value = {
    user,
    children: user?.children || [],
    isAuthenticated: Boolean(user && user.token),
    isStudent: user?.role === 'STUDENT',
    isParent: user?.role === 'PARENT',
    isCheckingSession,
    loading,
    error,
    selectedChildId,
    login,
    logout,
    changePassword,
    switchChild,
    updateChildren,
    handleSessionRevocation,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
