/**
 * VE MANAGEMENT STAFF PORTAL — Centralized API Client
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 * Connects directly to the Google Apps Script Web App HTTPS Gateway.
 */

import { getStoredSession, clearStoredSession } from '../utils/session';

// Production Google Apps Script Web App Endpoint URL
export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_APPS_SCRIPT_URL) ||
  'https://ve-management-api.iamrocky899.workers.dev';

// Global Session Expiration Callbacks (e.g. AuthContext listeners)
const sessionErrorListeners = new Set();

export function onSessionError(callback) {
  sessionErrorListeners.add(callback);
  return () => sessionErrorListeners.delete(callback);
}

function notifySessionError(reason, message) {
  clearStoredSession();
  sessionErrorListeners.forEach((cb) => {
    try {
      cb({ reason, message });
    } catch (e) {
      console.error('[ApiClient] Session listener error:', e);
    }
  });
}

/**
 * Dispatches an action request to the Apps Script backend.
 * Automatically attaches the active session token and default school ID.
 */
export async function sendApiRequest(action, payload = {}, options = {}) {
  const session = getStoredSession();
  const token = payload.token || (session ? session.token : null);

  const requestBody = {
    action: action,
    schoolId: payload.schoolId || (session ? session.schoolId : 'GAMERI-HSS-001'),
    token: token || undefined,
    ...payload
  };

  try {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(requestBody),
      redirect: 'follow',
      signal: options.signal
    });

    if (!res.ok && res.status !== 302) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('accounts.google.com')) {
        return {
          success: false,
          action: action,
          data: null,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'School server requires public access permissions. Please verify Apps Script deployment.'
          }
        };
      }
      throw new Error(`Invalid JSON response: ${parseErr.message}`);
    }

    // Handle session expiration & account deactivation triggers
    if (data && data.success === false && data.error) {
      const errCode = data.error.code;
      if (errCode === 'SESSION_EXPIRED' || (errCode === 'UNAUTHORIZED' && data.error.message?.toLowerCase().includes('expired'))) {
        notifySessionError('SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
      } else if (errCode === 'ACCOUNT_DEACTIVATED') {
        notifySessionError('ACCOUNT_DEACTIVATED', 'Your account has been deactivated. Please contact the Administrator.');
      }
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, aborted: true };
    }
    console.error(`[ApiClient] Error during action ${action}:`, err);
    return {
      success: false,
      action: action,
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the school server. Please check your internet connection.'
      }
    };
  }
}

/**
 * Staff Login API Helper
 */
export async function loginStaff(identifier, password, schoolId = 'GAMERI-HSS-001') {
  return sendApiRequest('auth_login', {
    identifier: identifier.trim(),
    password: password.trim(),
    schoolId: schoolId
  });
}
