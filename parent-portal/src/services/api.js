/**
 * VE MANAGEMENT — Unified Student & Parent Portal API Client
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 * Optimized HTTPS API Gateway with In-Memory Caching & Request Deduplication.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://ve-management-api.iamrocky899.workers.dev";

// In-flight request deduplication map
const inFlightPromises = new Map();

// In-memory client-side response cache: key -> { data, expiresAt }
const responseCache = new Map();

// Default TTLs in milliseconds
const CACHE_TTLS = {
  'parent_dashboard': 60 * 1000,       // 1 minute
  'student_dashboard': 60 * 1000,      // 1 minute
  'get_attendance': 60 * 1000,         // 1 minute
  'get_marks': 60 * 1000,              // 1 minute
  'get_parent_children': 5 * 60 * 1000, // 5 minutes
  'get_parent_profile': 5 * 60 * 1000,  // 5 minutes
  'get_student_profile': 5 * 60 * 1000, // 5 minutes
  'get_calendar': 10 * 60 * 1000,       // 10 minutes (static school schedule)
  'get_notices': 3 * 60 * 1000,        // 3 minutes
  'get_activities': 3 * 60 * 1000,     // 3 minutes
  'get_notes': 3 * 60 * 1000,          // 3 minutes
  'get_assignments': 3 * 60 * 1000,    // 3 minutes
  'get_contacts': 5 * 60 * 1000,       // 5 minutes
  'get_student_contacts': 5 * 60 * 1000,
  'get_parent_contacts': 5 * 60 * 1000
};

/**
 * Generates a stable deterministic cache key
 */
function getCacheKey(action, payload) {
  const cleanPayload = { ...payload };
  // Keep key deterministic without non-payload noise
  return `${action}:${JSON.stringify(cleanPayload)}`;
}

/**
 * Standard HTTP Dispatcher with Smart Caching & In-Flight Request Deduplication
 */
export async function sendApiRequest(action, payload = {}, options = {}) {
  const { bypassCache = false, ttl = null } = typeof options === 'boolean' ? { bypassCache: options } : options;
  const cacheKey = getCacheKey(action, payload);
  const now = Date.now();

  // 1. Check in-memory cache if not bypassed
  if (!bypassCache && responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey);
    if (cached.expiresAt > now) {
      return cached.data;
    } else {
      responseCache.delete(cacheKey);
    }
  }

  // 2. Check in-flight promise deduplication
  if (inFlightPromises.has(cacheKey)) {
    return inFlightPromises.get(cacheKey);
  }

  const requestPromise = (async () => {
    const requestBody = {
      action: action,
      schoolId: 'GAMERI-HSS-001',
      ...payload
    };

    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(requestBody)
    };

    try {
      const res = await fetch(API_BASE_URL, {
        ...fetchOptions,
        redirect: 'follow'
      });

      if (!res.ok && res.status !== 302) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('accounts.google.com')) {
          console.error("[ApiClient] Apps Script redirected to HTML/auth page:", text.substring(0, 200));
          return {
            success: false,
            action: action,
            data: null,
            error: {
              code: 'AUTH_REQUIRED',
              message: 'School backend Web App requires public access permissions. Please verify Apps Script deployment settings.'
            }
          };
        }
        throw new Error(`Invalid JSON response from server: ${parseErr.message}`);
      }

      // 3. Cache successful responses if TTL applies
      if (data && data.success) {
        const itemTtl = ttl !== null ? ttl : (CACHE_TTLS[action] || 0);
        if (itemTtl > 0) {
          responseCache.set(cacheKey, {
            data: data,
            expiresAt: Date.now() + itemTtl
          });
        }
      }

      return data;
    } catch (err) {
      console.error("[ApiClient] Request Error:", err);
      return {
        success: false,
        action: action,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Unable to connect to school server. Please check your internet connection.'
        }
      };
    } finally {
      inFlightPromises.delete(cacheKey);
    }
  })();

  inFlightPromises.set(cacheKey, requestPromise);
  return requestPromise;
}

export const ApiService = {
  /**
   * Clears all cached responses (e.g. on logout or child switch)
   */
  clearCache: () => {
    responseCache.clear();
    inFlightPromises.clear();
  },

  /**
   * Unified Authentication (Parent, Student, Staff)
   */
  login: async (identifier, password) => {
    responseCache.clear();
    return sendApiRequest('parent_login', {
      role: 'PARENT',
      mobile: String(identifier).trim(),
      identifier: String(identifier).trim(),
      password: String(password).trim()
    }, { bypassCache: true });
  },

  /**
   * Voluntary Password Change
   */
  changePassword: async (token, oldPassword, newPassword) => {
    return sendApiRequest('auth_change_password', {
      token: token,
      oldPassword: String(oldPassword).trim(),
      newPassword: String(newPassword).trim()
    }, { bypassCache: true });
  },

  /**
   * Student Dashboard Summary
   */
  getStudentDashboard: async (token, bypassCache = false) => {
    return sendApiRequest('student_dashboard', { token }, { bypassCache });
  },

  /**
   * Parent Dashboard Summary (All Linked Children)
   */
  getParentDashboard: async (token, bypassCache = false) => {
    return sendApiRequest('parent_dashboard', { token }, { bypassCache });
  },

  /**
   * Parent Authorized Children List
   */
  getParentChildren: async (token, bypassCache = false) => {
    return sendApiRequest('get_parent_children', { token }, { bypassCache });
  },

  /**
   * Safe Student Profile
   */
  getStudentProfile: async (token, studentId, bypassCache = false) => {
    return sendApiRequest('get_student_profile', { token, studentId }, { bypassCache });
  },

  /**
   * Safe Parent Profile
   */
  getParentProfile: async (token, bypassCache = false) => {
    return sendApiRequest('get_parent_profile', { token }, { bypassCache });
  },

  /**
   * Attendance Records
   */
  getAttendance: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_attendance', { token, ...query }, { bypassCache });
  },

  /**
   * Marks Records
   */
  getMarks: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_marks', { token, ...query }, { bypassCache });
  },

  /**
   * Teacher Notes & Study Materials
   */
  getNotes: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_notes', { token, ...query }, { bypassCache });
  },

  /**
   * Vocational Activities
   */
  getActivities: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_activities', { token, ...query }, { bypassCache });
  },

  /**
   * Homework & Assignments
   */
  getAssignments: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_assignments', { token, ...query }, { bypassCache });
  },

  /**
   * Notices & Circulars
   */
  getNotices: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_notices', { token, ...query }, { bypassCache });
  },

  /**
   * Academic Calendar
   */
  getCalendar: async (token, bypassCache = false) => {
    return sendApiRequest('get_calendar', { token }, { bypassCache });
  },

  /**
   * School & Teacher Contacts
   */
  getContacts: async (token, bypassCache = false) => {
    return sendApiRequest('get_contacts', { token }, { bypassCache });
  },

  /**
   * Safe Student Contacts (Class-scoped)
   */
  getStudentContacts: async (token, studentId, bypassCache = false) => {
    return sendApiRequest('get_student_contacts', { token, studentId }, { bypassCache });
  },

  /**
   * Safe Parent Contacts (Child-scoped)
   */
  getParentContacts: async (token, childId, bypassCache = false) => {
    return sendApiRequest('get_parent_contacts', { token, childId }, { bypassCache });
  },

  /**
   * Academic Years List
   */
  getAcademicYears: async (token, bypassCache = false) => {
    return sendApiRequest('get_academic_years', { token }, { bypassCache });
  },

  /**
   * Student Multi-Year Academic History
   */
  getStudentHistory: async (token, studentId, bypassCache = false) => {
    return sendApiRequest('get_student_history', { token, studentId }, { bypassCache });
  },

  /**
   * Official Calculated Examination Results
   */
  getExamResults: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_exam_results', { token, ...query }, { bypassCache });
  },

  /**
   * Official Academic Documents (Scoped to student)
   */
  getAcademicDocuments: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_documents', { token, ...query }, { bypassCache });
  },

  /**
   * Public QR Document Verification (No auth required)
   */
  verifyDocument: async (verificationId) => {
    return sendApiRequest('verify_document', { verificationId }, { bypassCache: true });
  },

  /**
   * Student Profile Photo Upload (Requirement #6)
   */
  uploadStudentPhoto: async (token, photoUrl, studentId = null) => {
    return sendApiRequest('upload_student_photo', { token, photoUrl, studentId }, { bypassCache: true });
  },

  /**
   * Student Attendance Report (Requirement #7)
   */
  getStudentAttendanceReport: async (token, payload = {}) => {
    return sendApiRequest('generate_student_attendance_report', { token, ...payload }, { bypassCache: true });
  },

  /**
   * Practical Lists (Requirement #8)
   */
  getPracticalLists: async (token, query = {}) => {
    return sendApiRequest('get_practical_lists', { token, ...query }, { bypassCache: true });
  }
};
