/**
 * VE MANAGEMENT UNIFIED PORTAL — Safe Multi-Role Session Storage Utility
 * Key: ve_mgmt_unified_session
 * Ensures sensitive cryptographic keys, passwords, and hashes are NEVER stored.
 */

export const SESSION_STORAGE_KEY = 've_mgmt_unified_session';
export const SELECTED_CHILD_KEY = 've_mgmt_selected_child_id';

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
 * Saves a sanitized authenticated multi-role session object into localStorage.
 */
export function saveSession(authData) {
  if (!authData || !authData.token) return null;

  const role = String(authData.role || 'STUDENT').toUpperCase();

  const safeSession = {
    token: authData.token,
    userId: authData.userId || authData.staffId || authData.parentId || authData.studentId,
    name: authData.name || authData.staffName || authData.parentName || authData.studentName || 'User',
    role: role,
    mobile: authData.mobile || '',
    email: authData.email || '',
    schoolId: authData.schoolId || 'GAMERI-HSS-001',
    // Role-specific metadata
    staffId: authData.staffId || (['TEACHER', 'PRINCIPAL', 'ADMIN', 'STAFF'].includes(role) ? authData.userId : null),
    parentId: authData.parentId || (role === 'PARENT' ? authData.userId : null),
    studentId: authData.studentId || (role === 'STUDENT' ? authData.userId : null),
    class: authData.class || null,
    section: authData.section || null,
    rollNo: authData.rollNo || null,
    group: authData.group || null,
    displayGroup: authData.displayGroup || authData.group || 'Group Not Assigned',
    assignedClasses: Array.isArray(authData.assignedClasses) ? authData.assignedClasses : [],
    assignedSubjects: Array.isArray(authData.assignedSubjects) ? authData.assignedSubjects : [],
    children: Array.isArray(authData.children) ? authData.children : [],
    passwordMode: authData.passwordMode || 'COMMON',
    isCustomPassword: Boolean(authData.isCustomPassword),
    status: authData.status || 'Active',
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
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SELECTED_CHILD_KEY);
  } catch (e) {
    console.error('[Session] Error removing session:', e);
  }
}
