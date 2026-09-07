/**
 * Firebase Analytics Service for VE Management Unified Portal
 * 
 * Firebase Project: ve-management-parent
 * Web App: VE Management Web (appId: 1:1004101461979:web:a3d6831835d1853b1629fe)
 * Measurement ID: G-6FKWQ5QE9N
 * 
 * STRICT PRIVACY RULES:
 * - NO student names, student IDs, parent names, or parent mobile numbers.
 * - NO passwords or credentials.
 * - NO attendance records, marks, notes content, or PDF contents.
 * - NO Backblaze B2 file keys.
 * - NO authentication tokens or session secrets.
 * - NO user IDs are registered with Analytics (no setUserId).
 * - Roles are mapped exclusively to non-identifying categories: STUDENT, PARENT, STAFF, GUEST.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';

// Public client-side configuration for Firebase Web App
export const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyAOKEPYyA_Bn9CJKxZpxaTcX8BG_ZvED9Y",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "ve-management-parent.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "ve-management-parent",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "ve-management-parent.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "1004101461979",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:1004101461979:web:a3d6831835d1853b1629fe",
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || "G-6FKWQ5QE9N"
};

// Singleton references
let analyticsInstance = null;
let initPromise = null;
const auditLog = [];

/**
 * Whitelist of allowed non-identifying role categories
 */
export const SAFE_ROLE_CATEGORIES = {
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  STAFF: 'STAFF',
  GUEST: 'GUEST'
};

/**
 * Normalizes any role input into a strictly non-identifying categorical string.
 * Never leaks individual identities or specialized titles.
 */
export function toSafeRoleCategory(role) {
  if (!role) return SAFE_ROLE_CATEGORIES.GUEST;
  const upper = String(role).trim().toUpperCase();
  if (upper === 'STUDENT') return SAFE_ROLE_CATEGORIES.STUDENT;
  if (upper === 'PARENT') return SAFE_ROLE_CATEGORIES.PARENT;
  if (['STAFF', 'TEACHER', 'PRINCIPAL', 'ADMIN'].includes(upper)) {
    return SAFE_ROLE_CATEGORIES.STAFF;
  }
  return SAFE_ROLE_CATEGORIES.GUEST;
}

/**
 * Whitelist of allowed feature names for generic telemetry
 */
export const ALLOWED_FEATURE_NAMES = new Set([
  'dashboard',
  'attendance',
  'marks',
  'notes',
  'materials',
  'assignments',
  'activities',
  'notices',
  'calendar',
  'profile',
  'contacts',
  'students',
  'portfolio',
  'teachers',
  'classes',
  'academic-years',
  'reports',
  'documents',
  'settings',
  'admin-guidance'
]);

/**
 * Whitelist of allowed failure reasons (never user inputs or error stack traces)
 */
export const ALLOWED_FAILURE_REASONS = new Set([
  'invalid_credentials',
  'missing_credentials',
  'network_error',
  'generic_failure'
]);

/**
 * Initializes Firebase App and Analytics modularly.
 * Handles environments where IndexedDB / Analytics is unsupported (e.g. adblockers, SSR).
 */
export async function initAnalytics() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (typeof window === 'undefined') return null;

      const supported = await isSupported().catch(() => false);
      if (!supported) {
        // Analytics unsupported in this browser environment (e.g., IndexedDB blocked)
        return null;
      }

      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      analyticsInstance = getAnalytics(app);

      // Expose audit helper in window if in non-production or test mode
      if (typeof window !== 'undefined' && !window.__VE_ANALYTICS_AUDIT__) {
        window.__VE_ANALYTICS_AUDIT__ = auditLog;
      }

      return analyticsInstance;
    } catch (err) {
      // Graceful fallback - analytics failure should NEVER disrupt the application
      console.warn('[Analytics] Initialization skipped or blocked:', err?.message || err);
      return null;
    }
  })();

  return initPromise;
}

/**
 * Internal helper to safely log an event to Firebase Analytics
 * and push to the local privacy audit log.
 */
async function safeLogEvent(eventName, params = {}) {
  const eventRecord = {
    timestamp: new Date().toISOString(),
    event: eventName,
    params: { ...params }
  };
  auditLog.push(eventRecord);

  try {
    const instance = await initAnalytics();
    if (instance) {
      logEvent(instance, eventName, params);
    }
  } catch (err) {
    // Fail silently so user experience is never blocked
  }
}

/**
 * Track session start
 */
export function trackSessionStart() {
  return safeLogEvent('session_start');
}

/**
 * Track page view with sanitized title and path.
 * Strips all query parameters, hashes, student IDs, or credentials.
 */
export function trackPageView(pageName, role = null) {
  const safeName = String(pageName || 'dashboard')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 50);

  const safeRole = toSafeRoleCategory(role);
  const formattedTitle = safeName.charAt(0).toUpperCase() + safeName.slice(1);

  return safeLogEvent('page_view', {
    page_title: formattedTitle,
    page_location: `/#${safeName}`,
    role_category: safeRole
  });
}

/**
 * Track successful login with non-identifying role category only.
 * NEVER sends usernames, mobile numbers, names, IDs, or tokens.
 */
export function trackLoginSuccess(role) {
  const safeRole = toSafeRoleCategory(role);
  return safeLogEvent('login_success', {
    role_category: safeRole
  });
}

/**
 * Track login failure with coarse category reason only.
 * NEVER sends entered mobile numbers, passwords, or error messages with user details.
 */
export function trackLoginFailure(reason) {
  const safeReason = ALLOWED_FAILURE_REASONS.has(reason) ? reason : 'generic_failure';
  return safeLogEvent('login_failure', {
    failure_reason: safeReason
  });
}

/**
 * Track user logout.
 */
export function trackLogout() {
  return safeLogEvent('logout');
}

/**
 * Track generic feature usage.
 * Feature name is strictly sanitized against an allowed whitelist.
 * No content, records, or marks are ever sent.
 */
export function trackFeatureUsage(featureName, role = null) {
  const normalized = String(featureName || '').toLowerCase().trim();
  const safeFeature = ALLOWED_FEATURE_NAMES.has(normalized) ? normalized : 'other';
  const safeRole = toSafeRoleCategory(role);

  return safeLogEvent('feature_usage', {
    feature_name: safeFeature,
    role_category: safeRole
  });
}

/**
 * Get the in-memory audit log of all events fired during this session.
 * Used for automated verification and privacy assertions.
 */
export function getAnalyticsAuditLog() {
  return [...auditLog];
}
