/**
 * VE MANAGEMENT STAFF PORTAL — Safe Session Storage Utility
 * Key: itd3_staff_portal_session
 * Ensures sensitive cryptographic keys, passwords, and hashes are NEVER stored.
 */

export const SESSION_STORAGE_KEY = 'itd3_staff_portal_session';

/**
 * Retrieves the current authenticated session from localStorage.
 * Returns null if missing or malformed.
 */
export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || !session.token || !session.userId || !session.role) {
      clearStoredSession();
      return null;
    }
    return session;
  } catch (e) {
    console.error('[Session] Error parsing stored session:', e);
    clearStoredSession();
    return null;
  }
}

/**
 * Saves a sanitized authenticated session object into localStorage.
 */
export function saveSession(authData) {
  if (!authData || !authData.token) return;

  const safeSession = {
    token: authData.token,
    userId: authData.userId || authData.staffId,
    staffId: authData.staffId || authData.userId,
    name: authData.name || authData.staffName || 'Staff Member',
    role: String(authData.role || 'TEACHER').toUpperCase(),
    mobile: authData.mobile || '',
    email: authData.email || '',
    assignedClasses: Array.isArray(authData.assignedClasses) ? authData.assignedClasses : ['9', '10'],
    assignedSubjects: Array.isArray(authData.assignedSubjects) ? authData.assignedSubjects : ['IT/ITeS'],
    schoolId: authData.schoolId || 'GAMERI-HSS-001',
    passwordMode: authData.passwordMode || 'COMMON',
    expiresAt: authData.expiresAt || null,
    savedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeSession));
  } catch (e) {
    console.error('[Session] Error saving session to storage:', e);
  }

  return safeSession;
}

/**
 * Clears the session from localStorage upon logout or session revocation.
 */
export function clearStoredSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('[Session] Error removing session:', e);
  }
}
