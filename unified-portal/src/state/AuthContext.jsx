import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredSession, saveSession, clearStoredSession, SELECTED_CHILD_KEY } from '../utils/session';
import { ApiService, onSessionError } from '../api/client';
import { trackLogout } from '../services/analytics';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredSession());
  const [loading, setLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionNotice, setSessionNotice] = useState(null);
  const [error, setError] = useState(null);

  // Active child for multi-child parent
  const [selectedChildId, setSelectedChildId] = useState(() => {
    return localStorage.getItem(SELECTED_CHILD_KEY) || null;
  });

  // Handle session error broadcasts
  useEffect(() => {
    const unsubscribe = onSessionError(({ reason, message }) => {
      setUser(null);
      setSelectedChildId(null);
      setSessionNotice({ reason, message });
    });
    return unsubscribe;
  }, []);

  // Validate or initialize session on mount
  useEffect(() => {
    const stored = getStoredSession();
    if (stored) {
      setUser(stored);
      if (stored.role === 'PARENT' && stored.children && stored.children.length > 0) {
        const savedChildId = localStorage.getItem(SELECTED_CHILD_KEY);
        const validChild = stored.children.find(c => (c.student_id || c.studentId) === savedChildId);
        if (validChild) {
          setSelectedChildId(savedChildId);
        } else {
          const firstId = stored.children[0].student_id || stored.children[0].studentId;
          setSelectedChildId(firstId);
          localStorage.setItem(SELECTED_CHILD_KEY, firstId);
        }
      }
    }
    setIsCheckingSession(false);
  }, []);

  // Unified Login
  const login = async (identifier, password) => {
    setLoading(true);
    setError(null);
    setSessionNotice(null);

    try {
      const res = await ApiService.loginUnified(identifier, password);

      if (res && res.success && res.data) {
        const saved = saveSession(res.data);
        setUser(saved);

        if (saved.role === 'PARENT' && saved.children && saved.children.length > 0) {
          const firstChildId = saved.children[0].student_id || saved.children[0].studentId;
          setSelectedChildId(firstChildId);
          localStorage.setItem(SELECTED_CHILD_KEY, firstChildId);
        } else {
          setSelectedChildId(null);
          localStorage.removeItem(SELECTED_CHILD_KEY);
        }

        setLoading(false);
        return { success: true, user: saved, role: saved.role };
      } else {
        setLoading(false);
        const errMsg = res?.error?.message || 'Invalid login credentials.';
        setError(errMsg);
        return { success: false, error: res?.error || { message: errMsg } };
      }
    } catch (e) {
      setLoading(false);
      const msg = 'Unable to connect to school server. Please try again.';
      setError(msg);
      return { success: false, error: { message: msg } };
    }
  };

  // Switch Active Child (Parent Role)
  const switchChild = (childId) => {
    setSelectedChildId(childId);
    localStorage.setItem(SELECTED_CHILD_KEY, childId);
    ApiService.clearCache(); // Invalidate cache so other child's data is never displayed
  };

  // Logout
  const logout = () => {
    trackLogout();
    ApiService.clearCache();
    clearStoredSession();
    setUser(null);
    setSelectedChildId(null);
    setError(null);
    setSessionNotice(null);
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
        saveSession(updated);
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

  const handleSessionRevocation = (reason = 'SESSION_EXPIRED') => {
    logout();
    if (reason === 'ACCOUNT_DEACTIVATED') {
      setError('Your account has been deactivated. Please contact the administrator.');
    } else {
      setError('Your session has expired. Please sign in again.');
    }
  };

  const updateChildren = (childrenList) => {
    if (!user) return;
    const updated = { ...user, children: childrenList };
    setUser(updated);
    saveSession(updated);
  };

  // Roles convenience flags
  const role = user?.role ? user.role.toUpperCase() : null;
  const isStudent = role === 'STUDENT';
  const isParent = role === 'PARENT';
  const isTeacher = role === 'TEACHER';
  const isPrincipal = role === 'PRINCIPAL';
  const isAdmin = role === 'ADMIN';
  const isStaff = ['TEACHER', 'PRINCIPAL', 'ADMIN', 'STAFF'].includes(role);

  // Active child object if parent
  const activeChild = isParent && user?.children
    ? user.children.find(c => (c.student_id || c.studentId) === selectedChildId) || user.children[0] || null
    : null;

  // Translation mock/fallback helper
  const t = (key) => {
    const translations = {
      'myChildren': 'My Children',
      'selectChild': 'Select Child',
      'active': 'Active',
      'class': 'Class',
      'rollNo': 'Roll No',
      'section': 'Section'
    };
    return translations[key] || key;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: Boolean(user && user.token),
        isCheckingSession,
        loading,
        error,
        setError,
        sessionNotice,
        clearNotice: () => setSessionNotice(null),
        login,
        logout,
        isStudent,
        isParent,
        isTeacher,
        isPrincipal,
        isAdmin,
        isStaff,
        selectedChildId,
        switchChild,
        updateChildren,
        handleSessionRevocation,
        changePassword,
        activeChild,
        children: user?.children || [],
        t
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
