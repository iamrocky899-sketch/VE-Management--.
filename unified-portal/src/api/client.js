/**
 * VE MANAGEMENT UNIFIED PORTAL — Centralized API Client & Gateway
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 * Target: https://ve-management-api.iamrocky899.workers.dev
 */

import { getStoredSession, clearStoredSession } from '../utils/session.js';

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'https://ve-management-api.iamrocky899.workers.dev';

/**
 * CANONICAL STUDENT MODEL NORMALIZATION ENGINE
/**
 * 3-TIER GROUP RESOLUTION HIERARCHY (Phase 7 Parity)
 * 1. Direct student group: s.group / s.student_group / s.group_name / s.studentGroup / s.assigned_group
 * 2. Class custom group mapping: classGroupsSource / window.classGroups / localStorage(itd3_cg, classGroups)
 * 3. Fallback: "Group Not Assigned"
 * Never returns null, undefined, "[object Object]", or empty strings.
 */
export function resolveStudentGroup(s, customGroupSource = null) {
  if (!s || typeof s !== 'object') return 'Group Not Assigned';

  // Tier 1: Direct student group
  const rawGroup = s.group ?? s.student_group ?? s.group_name ?? s.studentGroup ?? s.assigned_group ?? s.assignedGroup;
  if (rawGroup !== undefined && rawGroup !== null) {
    const trimmed = String(rawGroup).trim();
    if (trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined' && trimmed !== '[object Object]' && trimmed !== 'Group Not Assigned') {
      return trimmed;
    }
  }

  // Tier 2: Class custom group mapping (classGroups / itd3_cg / settings)
  try {
    const studentId = String(s.studentId || s.student_id || s.id || '').trim();
    const studentRoll = String(s.rollNo ?? s.roll_no ?? s.roll ?? '').trim();
    const studentAdm = String(s.admissionNo ?? s.admission_no ?? '').trim();
    const studentClass = String(s.class || s.className || '').trim();

    let cgData = customGroupSource;
    if (!cgData && typeof window !== 'undefined') {
      if (window.classGroups && typeof window.classGroups === 'object') {
        cgData = window.classGroups;
      } else {
        const rawCg = window.localStorage?.getItem('itd3_cg') ||
                      window.localStorage?.getItem('classGroups') ||
                      window.localStorage?.getItem('itd3_class_groups') ||
                      window.sessionStorage?.getItem('itd3_cg');
        if (rawCg) {
          try { cgData = JSON.parse(rawCg); } catch (e) {}
        }
      }
    }

    if (cgData && typeof cgData === 'object') {
      // 2a. Direct student ID / roll / admission key in map: { [id]: 'GroupName' }
      if (studentId && typeof cgData[studentId] === 'string' && cgData[studentId].trim()) {
        const mapped = cgData[studentId].trim();
        if (mapped && mapped !== 'Group Not Assigned') return mapped;
      }
      if (studentAdm && typeof cgData[studentAdm] === 'string' && cgData[studentAdm].trim()) {
        const mapped = cgData[studentAdm].trim();
        if (mapped && mapped !== 'Group Not Assigned') return mapped;
      }

      // 2b. Canonical ClassGroups structure: { [cls]: { p: ..., g: [ { id, n, l, cl, m: [...] } ] } }
      const classesToCheck = studentClass ? [studentClass, ...Object.keys(cgData).filter(c => c !== studentClass)] : Object.keys(cgData);
      for (const clsKey of classesToCheck) {
        const clsObj = cgData[clsKey];
        if (!clsObj) continue;

        const groupsArray = Array.isArray(clsObj.g) ? clsObj.g : (Array.isArray(clsObj) ? clsObj : (Array.isArray(clsObj.groups) ? clsObj.groups : []));
        for (const g of groupsArray) {
          if (!g || typeof g !== 'object') continue;
          const groupName = g.n || g.name || g.groupName || g.group_name;
          if (!groupName || String(groupName).trim() === '') continue;

          // Check leader / co-leader
          if ((studentId && (String(g.l) === studentId || String(g.cl) === studentId)) ||
              (studentRoll && (String(g.l) === studentRoll || String(g.cl) === studentRoll)) ||
              (studentAdm && (String(g.l) === studentAdm || String(g.cl) === studentAdm))) {
            return String(groupName).trim();
          }

          // Check members array
          const members = Array.isArray(g.m) ? g.m : (Array.isArray(g.members) ? g.members : []);
          for (const member of members) {
            const mStr = String(member).trim();
            if ((studentId && mStr === studentId) ||
                (studentRoll && mStr === studentRoll) ||
                (studentAdm && mStr === studentAdm)) {
              return String(groupName).trim();
            }
          }
        }
      }
    }
  } catch (err) {
    // Non-blocking fallback
  }

  // Tier 3: Fallback
  return 'Group Not Assigned';
}

/**
 * CANONICAL STUDENT MODEL NORMALIZATION ENGINE
 * Normalizes backend / D1 student records into the authoritative frontend student model once.
 * Preserves all legacy properties for 100% backward-compatibility across all views.
 */
export function normalizeStudent(s) {
  if (!s || typeof s !== 'object') return s;
  const studentId = s.studentId || s.student_id || s.id || '';
  const name = s.name || s.studentName || s.student_name || s.fullName || s.full_name || '';
  const admissionNo = s.admissionNo || s.admission_no || s.adm_no || '';
  const className = String(s.className || s.class || '');
  const section = s.section || s.sectionName || '';
  const rollNo = (s.rollNo !== undefined && s.rollNo !== null && String(s.rollNo).trim() !== '')
    ? String(s.rollNo)
    : ((s.roll_no !== undefined && s.roll_no !== null && String(s.roll_no).trim() !== '')
        ? String(s.roll_no)
        : (s.roll ? String(s.roll) : ''));

  // 3-Tier Group Resolution Hierarchy (Phase 7 Parity)
  const assignedGroup = resolveStudentGroup(s);
  const group = assignedGroup !== 'Group Not Assigned' ? assignedGroup : null;
  const displayGroup = assignedGroup;

  const fatherName = s.fatherName || s.father_name || '';
  const motherName = s.motherName || s.mother_name || '';
  const parentName = s.parentName || fatherName || motherName || s.guardian_name || 'Parent';
  const mobile = s.mobile || s.parentMobile || s.parent_mobile || s.phone || '';
  const parentMobile = s.parentMobile || s.parent_mobile || s.mobile || '';
  const status = s.status || 'Active';
  const gender = s.gender || 'Male';
  const dob = s.dob || '';
  const village = s.village || '';
  const address = s.address || village || '';
  const district = s.district || 'Biswanath';
  const state = s.state || 'Assam';
  const pinCode = s.pinCode || s.pin_code || '784176';
  const category = s.category || 'General';
  const bloodGroup = s.bloodGroup || s.blood_group || '';
  const stream = s.stream || 'Vocational IT/ITeS';
  const admissionDate = s.admissionDate || s.admission_date || '';
  const photoUrl = s.photoUrl || s.photo_url || '';

  return {
    ...s,
    // Canonical CamelCase Contract
    studentId,
    student_id: studentId,
    name,
    studentName: name,
    student_name: name,
    admissionNo,
    admission_no: admissionNo,
    className,
    class: className,
    section,
    rollNo,
    roll_no: rollNo,
    roll: rollNo,
    group,
    student_group: group,
    group_name: group,
    studentGroup: group,
    displayGroup,
    fatherName,
    father_name: fatherName,
    motherName,
    mother_name: motherName,
    parentName,
    parentMobile,
    mobile,
    status,
    gender,
    dob,
    village,
    address,
    district,
    state,
    pinCode,
    pin_code: pinCode,
    category,
    bloodGroup,
    blood_group: bloodGroup,
    stream,
    admissionDate,
    admission_date: admissionDate,
    photoUrl,
    photo_url: photoUrl
  };
}

export function normalizeNote(n) {
  if (!n || typeof n !== 'object') return n;
  const noteId = n.noteId || n.note_id || n.id || '';
  const title = n.title || n.category || 'Main Book';
  const category = n.category || title;
  const className = String(n.class || n.className || '9');
  const subject = n.subject || 'IT/ITeS';
  const units = (Array.isArray(n.units) ? n.units : []).map((u, uIdx) => {
    const unitId = u.unitId || u.unit_id || u.id || `UNT_${Date.now()}_${uIdx}`;
    const unitNumber = u.unitNumber || u.unit_number || u.order || (uIdx + 1);
    const unitTitle = u.unitTitle || u.unit_title || u.title || `Unit ${unitNumber}`;
    const description = u.description || '';
    const order = u.order || u.display_order || unitNumber;
    const questions = (Array.isArray(u.questions) ? u.questions : []).map((q, qIdx) => {
      const questionId = q.questionId || q.question_id || q.id || `QST_${Date.now()}_${qIdx}`;
      const questionText = q.questionText || q.question_text || q.question || '';
      const answerText = q.answerText || q.answer_text || q.answer || '';
      const qOrder = q.order || q.display_order || (qIdx + 1);
      return {
        ...q,
        questionId,
        question_id: questionId,
        questionText,
        question_text: questionText,
        answerText,
        answer_text: answerText,
        order: qOrder,
        display_order: qOrder
      };
    });
    const attachmentUrl = u.attachmentUrl || u.attachment_url || null;
    const attachmentName = u.attachmentName || u.attachment_name || null;
    const attachmentSize = (u.attachmentSize !== undefined && u.attachmentSize !== null) ? Number(u.attachmentSize) :
                           (u.attachment_size !== undefined && u.attachment_size !== null) ? Number(u.attachment_size) : null;
    return {
      ...u,
      unitId,
      unit_id: unitId,
      unitTitle,
      unit_title: unitTitle,
      unitNumber,
      unit_number: unitNumber,
      description,
      order,
      display_order: order,
      attachmentUrl,
      attachment_url: attachmentUrl,
      attachmentName,
      attachment_name: attachmentName,
      attachmentSize,
      attachment_size: attachmentSize,
      questions
    };
  });

  return {
    ...n,
    noteId,
    note_id: noteId,
    id: noteId,
    title,
    category,
    class: className,
    className,
    subject,
    units
  };
}

export function normalizeNotes(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeNote);
}

export function normalizeAttendanceRecord(r) {
  if (!r) return null;
  const studentId = r.student_id || r.studentId || '';
  const attendanceId = r.attendance_id || r.attendanceId || '';
  const studentName = r.student_name || r.studentName || '';
  const rollNo = r.roll_no || r.rollNo || '';
  const sessionId = r.session_id || r.sessionId || '';
  const academicYear = r.academic_year || r.academicYear || '';
  const date = r.date || '';
  const status = (r.status || 'PRESENT').toUpperCase();
  const rawClass = r.class ? String(r.class) : '';
  const section = r.section || '';
  const subject = r.subject || 'IT/ITeS';
  const component = r.component || 'THEORY';
  const period = r.period || '1';

  return {
    ...r,
    studentId,
    student_id: studentId,
    attendanceId,
    attendance_id: attendanceId,
    studentName,
    student_name: studentName,
    rollNo,
    roll_no: rollNo,
    sessionId,
    session_id: sessionId,
    academicYear,
    academic_year: academicYear,
    date,
    status,
    class: rawClass,
    section,
    subject,
    component,
    period
  };
}

export function normalizeAttendance(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeAttendanceRecord).filter(Boolean);
}

export function openOrDownloadBase64File(base64Data, contentType, fileName) {
  try {
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType || 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.target = '_blank';
    a.download = fileName || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    return true;
  } catch (err) {
    console.error('[ApiClient] Error opening base64 file:', err);
    return false;
  }
}

// Global Session Expiration Callbacks (AuthContext listeners)
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

// In-flight request deduplication map
const inFlightPromises = new Map();

// In-memory client-side response cache: key -> { data, expiresAt }
const responseCache = new Map();

// Default TTLs in milliseconds
const CACHE_TTLS = {
  'parent_dashboard': 60 * 1000,
  'student_dashboard': 60 * 1000,
  'get_dashboard_summary': 60 * 1000,
  'get_attendance': 60 * 1000,
  'get_marks': 60 * 1000,
  'get_parent_children': 5 * 60 * 1000,
  'get_parent_profile': 5 * 60 * 1000,
  'get_student_profile': 5 * 60 * 1000,
  'get_staff_profile': 5 * 60 * 1000,
  'get_calendar': 10 * 60 * 1000,
  'get_notices': 3 * 60 * 1000,
  'get_activities': 3 * 60 * 1000,
  'get_notes': 3 * 60 * 1000,
  'get_assignments': 3 * 60 * 1000,
  'get_contacts': 5 * 60 * 1000,
  'get_classes': 5 * 60 * 1000,
  'get_subjects': 5 * 60 * 1000,
  'get_academic_years': 10 * 60 * 1000
};

function getCacheKey(action, payload) {
  const cleanPayload = { ...payload };
  return `${action}:${JSON.stringify(cleanPayload)}`;
}

/**
 * Dispatches an action request to the canonical Cloudflare Worker backend.
 * Automatically attaches the active session token and default school ID.
 */
export async function sendApiRequest(action, payload = {}, options = {}) {
  const { bypassCache = false, ttl = null, signal = null } = typeof options === 'boolean' ? { bypassCache: options } : options;
  const session = getStoredSession();
  const token = payload.token || (session ? session.token : null);

  const requestBody = {
    action: action,
    schoolId: payload.schoolId || (session ? session.schoolId : 'GAMERI-HSS-001'),
    token: token || undefined,
    ...payload
  };

  const cacheKey = getCacheKey(action, requestBody);
  const now = Date.now();

  // 1. Check in-memory cache if read action and not bypassed
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
    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(requestBody),
        redirect: 'follow',
        signal: signal
      });

      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          return {
            success: false,
            action: action,
            data: null,
            error: {
              code: 'AUTH_REQUIRED',
              message: 'School backend service returned an invalid response. Please verify API gateway status.'
            }
          };
        }
        if (!res.ok) {
          throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
        }
        throw new Error(`Invalid JSON response from server: ${parseErr.message}`);
      }

      // Handle session expiration & account deactivation triggers
      if (data && data.success === false && data.error) {
        const errCode = data.error.code;
        if (errCode === 'SESSION_EXPIRED' || (errCode === 'UNAUTHORIZED' && data.error.message?.toLowerCase().includes('expired'))) {
          notifySessionError('SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
        } else if (errCode === 'ACCOUNT_DEACTIVATED') {
          notifySessionError('ACCOUNT_DEACTIVATED', 'Your account has been deactivated. Please contact the Administrator.');
        }
        return data;
      }

      if (!res.ok && res.status !== 302) {
        return data || {
          success: false,
          action: action,
          data: null,
          error: {
            code: res.status === 401 ? 'UNAUTHORIZED' :
                  res.status === 403 ? 'FORBIDDEN' :
                  res.status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR',
            message: `Server returned HTTP ${res.status}: ${res.statusText}`
          }
        };
      }

      // 3. Normalize student data entities across all student-related endpoints
      if (data && data.success && data.data) {
        if (Array.isArray(data.data.students)) {
          data.data.students = data.data.students.map(normalizeStudent);
        }
        if (data.data.student && typeof data.data.student === 'object') {
          data.data.student = normalizeStudent(data.data.student);
        }
        if (Array.isArray(data.data.children)) {
          data.data.children = data.data.children.map(normalizeStudent);
        }
        if (Array.isArray(data.data.recentStudents)) {
          data.data.recentStudents = data.data.recentStudents.map(normalizeStudent);
        }
        if (Array.isArray(data.data.notes)) {
          data.data.notes = data.data.notes.map(normalizeNote);
        }
        if (data.data.note && typeof data.data.note === 'object') {
          data.data.note = normalizeNote(data.data.note);
        }
      }

      // 4. Cache successful responses if TTL applies
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
      if (err.name === 'AbortError') {
        return { success: false, aborted: true };
      }
      console.error(`[ApiClient] Request Error during action ${action}:`, err);
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
  clearCache: () => {
    responseCache.clear();
    inFlightPromises.clear();
  },

  /**
   * Unified Authoritative Server Login Resolution Engine
   * Evaluates roles in exact backend priority order: Staff (Teacher/Principal/Admin) -> Parent -> Student
   */
  loginUnified: async (identifier, password) => {
    responseCache.clear();
    const cleanId = String(identifier).trim();
    const cleanPwd = String(password).trim();

    if (!cleanId || !cleanPwd) {
      return {
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Identifier and password are required' }
      };
    }

    // Step 1: Attempt Staff Authentication (TEACHER / PRINCIPAL / ADMIN)
    const staffRes = await sendApiRequest('auth_login', {
      role: 'TEACHER',
      identifier: cleanId,
      password: cleanPwd
    }, { bypassCache: true });

    if (staffRes && staffRes.success && staffRes.data) {
      // User is verified staff member! Now resolve exact database role via get_staff_profile
      const staffToken = staffRes.data.token;
      let realRole = 'TEACHER';
      let staffProfile = null;

      try {
        const profRes = await sendApiRequest('get_staff_profile', { token: staffToken }, { bypassCache: true });
        if (profRes && profRes.success && profRes.data?.staff) {
          staffProfile = profRes.data.staff;
          realRole = String(staffProfile.role || 'TEACHER').toUpperCase();
        }
      } catch (e) {
        console.warn('[Login] Staff profile fetch fallback:', e);
      }

      // If the real role in database is PRINCIPAL or ADMIN, obtain token with correct role claim
      let finalToken = staffToken;
      if (realRole === 'PRINCIPAL' || realRole === 'ADMIN') {
        const adminAuth = await sendApiRequest('auth_login', {
          role: realRole,
          identifier: cleanId,
          password: cleanPwd
        }, { bypassCache: true });
        if (adminAuth && adminAuth.success && adminAuth.data?.token) {
          finalToken = adminAuth.data.token;
        }
      }

      return {
        success: true,
        data: {
          token: finalToken,
          userId: staffRes.data.userId,
          staffId: staffRes.data.userId,
          name: staffProfile?.staff_name || staffRes.data.name || 'Staff Member',
          role: realRole,
          mobile: staffProfile?.mobile || cleanId,
          email: staffProfile?.email || '',
          assignedClasses: staffProfile?.assigned_classes ? (typeof staffProfile.assigned_classes === 'string' ? JSON.parse(staffProfile.assigned_classes || '[]') : staffProfile.assigned_classes) : ['9', '10'],
          assignedSubjects: staffProfile?.assigned_subjects ? (typeof staffProfile.assigned_subjects === 'string' ? JSON.parse(staffProfile.assigned_subjects || '[]') : staffProfile.assigned_subjects) : ['IT/ITeS'],
          schoolId: staffRes.data.schoolId || 'GAMERI-HSS-001',
          passwordMode: staffProfile?.is_custom_password ? 'CUSTOM' : 'COMMON',
          isCustomPassword: Boolean(staffProfile?.is_custom_password),
          status: staffProfile?.status || 'ACTIVE'
        }
      };
    }

    // Step 2: Attempt Parent Authentication
    const parentRes = await sendApiRequest('auth_login', {
      role: 'PARENT',
      identifier: cleanId,
      password: cleanPwd
    }, { bypassCache: true });

    if (parentRes && parentRes.success && parentRes.data) {
      const parentToken = parentRes.data.token;
      let children = [];

      try {
        const childRes = await sendApiRequest('get_parent_children', { token: parentToken }, { bypassCache: true });
        if (childRes && childRes.success && Array.isArray(childRes.data?.children)) {
          children = childRes.data.children;
        }
      } catch (e) {
        console.warn('[Login] Parent children fetch fallback:', e);
      }

      return {
        success: true,
        data: {
          token: parentToken,
          userId: parentRes.data.userId,
          parentId: parentRes.data.userId,
          name: parentRes.data.name || 'Parent',
          role: 'PARENT',
          mobile: cleanId,
          children: children,
          schoolId: parentRes.data.schoolId || 'GAMERI-HSS-001',
          status: 'ACTIVE'
        }
      };
    }

    // Step 3: Attempt Student Authentication (Student ID, Admission No, Roll No)
    const studentRes = await sendApiRequest('auth_login', {
      role: 'STUDENT',
      identifier: cleanId,
      password: cleanPwd
    }, { bypassCache: true });

    if (studentRes && studentRes.success && studentRes.data) {
      const studentToken = studentRes.data.token;
      let studentProfile = null;

      try {
        const profRes = await sendApiRequest('get_student_profile', { token: studentToken, studentId: studentRes.data.userId }, { bypassCache: true });
        if (profRes && profRes.success && profRes.data?.student) {
          studentProfile = profRes.data.student;
        }
      } catch (e) {
        console.warn('[Login] Student profile fetch fallback:', e);
      }

      return {
        success: true,
        data: {
          token: studentToken,
          userId: studentRes.data.userId,
          studentId: studentRes.data.userId,
          name: studentProfile?.student_name || studentRes.data.name || 'Student',
          role: 'STUDENT',
          mobile: studentProfile?.mobile || '',
          class: studentProfile?.class || null,
          section: studentProfile?.section || null,
          rollNo: studentProfile?.roll_no || studentProfile?.rollNo || null,
          group: studentProfile?.group || null,
          displayGroup: studentProfile?.displayGroup || studentProfile?.group || 'Group Not Assigned',
          schoolId: studentRes.data.schoolId || 'GAMERI-HSS-001',
          status: studentProfile?.status || 'Active'
        }
      };
    }

    // Check if any attempt failed due to invalid password vs user not found
    const lastError = staffRes?.error?.code !== 'USER_NOT_FOUND' ? staffRes?.error :
                      parentRes?.error?.code !== 'USER_NOT_FOUND' ? parentRes?.error :
                      studentRes?.error;

    return {
      success: false,
      error: lastError || {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid login details. Please check your registered mobile or ID and password.'
      }
    };
  },

  changePassword: async (token, oldPassword, newPassword) => {
    return sendApiRequest('auth_change_password', {
      token: token,
      oldPassword: String(oldPassword).trim(),
      newPassword: String(newPassword).trim()
    }, { bypassCache: true });
  },

  getStudentDashboard: async (token, bypassCache = false) => {
    // Synthesize student dashboard from authoritative modular endpoints
    try {
      const session = getStoredSession();
      const studentId = session?.studentId || session?.userId;

      const [profRes, attRes, marksRes, assignRes, actRes, noticeRes, calRes] = await Promise.all([
        ApiService.getStudentProfile(token, studentId, bypassCache),
        ApiService.getAttendance(token, studentId ? { studentId } : {}, bypassCache),
        ApiService.getMarks(token, studentId ? { studentId } : {}, bypassCache),
        ApiService.getAssignments(token, {}, bypassCache),
        ApiService.getActivities(token, {}, bypassCache),
        ApiService.getNotices(token, {}, bypassCache),
        ApiService.getCalendar(token, bypassCache)
      ]);

      const rawProf = profRes?.data?.student;
      const studentProfile = rawProf ? normalizeStudent({
        ...rawProf,
        group: rawProf.group || session?.group || null
      }) : normalizeStudent({
        studentId: studentId,
        studentName: session?.name || 'Student',
        class: session?.class || '10',
        section: session?.section || '',
        rollNo: session?.rollNo || '1',
        group: session?.group || null,
        mobile: session?.mobile || ''
      });

      const attendanceRecords = attRes?.data?.attendance || [];
      let totalWorkingDays = 0;
      let presentDays = attendanceRecords.filter(r => String(r.status).toUpperCase() === 'PRESENT' || String(r.status).toUpperCase() === 'P').length;
      let absentDays = attendanceRecords.filter(r => String(r.status).toUpperCase() === 'ABSENT' || String(r.status).toUpperCase() === 'A').length;
      let percentage = null;

      try {
        const repRes = await sendApiRequest('generate_student_attendance_report', { studentId: studentProfile.studentId });
        if (repRes && repRes.success && repRes.data) {
          totalWorkingDays = Number(repRes.data.totalSessions || 0);
          presentDays = Number(repRes.data.presentCount || presentDays);
          absentDays = Number(repRes.data.absentCount || absentDays);
          percentage = repRes.data.attendancePercentage !== undefined ? repRes.data.attendancePercentage : null;
        }
      } catch (e) {
        // Fallback
      }

      if (percentage === null && totalWorkingDays === 0 && attendanceRecords.length > 0) {
        totalWorkingDays = attendanceRecords.length;
        percentage = Math.round((presentDays / totalWorkingDays) * 100);
      }

      // Calculate consecutive absence streak from most recent dates
      let streak = 0;
      const sortedAtt = [...attendanceRecords].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      for (const record of sortedAtt) {
        if (String(record.status).toUpperCase() === 'ABSENT' || String(record.status).toUpperCase() === 'A') {
          streak++;
        } else {
          break;
        }
      }

      const marks = marksRes?.data?.marks || [];
      const assignments = assignRes?.data?.assignments || [];
      const activities = actRes?.data?.activities || [];
      const notices = noticeRes?.data?.notices || [];
      const upcomingCalendar = calRes?.data?.calendar || calRes?.data?.events || [];

      return {
        success: true,
        data: {
          student: studentProfile,
          attendanceSummary: {
            totalWorkingDays,
            presentDays,
            absentDays,
            percentage,
            consecutiveAbsenceStreak: streak
          },
          marks,
          assignments: assignments.slice(0, 5),
          activities: activities.slice(0, 5),
          notices: notices.slice(0, 5),
          upcomingCalendar: upcomingCalendar.slice(0, 5)
        }
      };
    } catch (err) {
      console.error('[ApiClient] Error synthesizing student dashboard:', err);
      return {
        success: false,
        error: { code: 'SYNTHESIS_ERROR', message: 'Unable to load student dashboard data.' }
      };
    }
  },

  getParentDashboard: async (token, bypassCache = false) => {
    // Synthesize parent dashboard from authoritative modular endpoints
    try {
      const session = getStoredSession();
      const parentName = session?.name || 'Parent';
      const mobile = session?.mobile || session?.identifier || '';

      // Step 1: Fetch children linked to parent
      const childrenRes = await ApiService.getParentChildren(token, bypassCache);
      const rawChildren = childrenRes?.data?.children || [];

      // Step 2: Fetch global notices and calendar in parallel with child data
      const [noticesRes, calRes] = await Promise.all([
        ApiService.getNotices(token, {}, bypassCache),
        ApiService.getCalendar(token, bypassCache)
      ]);

      const notices = noticesRes?.data?.notices || [];
      const upcomingCalendar = calRes?.data?.calendar || calRes?.data?.events || [];

      // Step 3: Fetch per-child data in parallel
      const childrenSummaries = await Promise.all(
        rawChildren.map(async (c) => {
          const childId = c.student_id || c.studentId || c.id;
          const [attRes, marksRes, assignRes, actRes] = await Promise.all([
            ApiService.getAttendance(token, { studentId: childId }, bypassCache),
            ApiService.getMarks(token, { studentId: childId }, bypassCache),
            ApiService.getAssignments(token, {}, bypassCache),
            ApiService.getActivities(token, {}, bypassCache)
          ]);

          const attendanceRecords = attRes?.data?.attendance || [];
          let totalWorkingDays = 0;
          let presentDays = attendanceRecords.filter(r => String(r.status).toUpperCase() === 'PRESENT' || String(r.status).toUpperCase() === 'P').length;
          let absentDays = attendanceRecords.filter(r => String(r.status).toUpperCase() === 'ABSENT' || String(r.status).toUpperCase() === 'A').length;
          let percentage = null;

          try {
            const repRes = await sendApiRequest('generate_student_attendance_report', { studentId: childId });
            if (repRes && repRes.success && repRes.data) {
              totalWorkingDays = Number(repRes.data.totalSessions || 0);
              presentDays = Number(repRes.data.presentCount || presentDays);
              absentDays = Number(repRes.data.absentCount || absentDays);
              percentage = repRes.data.attendancePercentage !== undefined ? repRes.data.attendancePercentage : null;
            }
          } catch (e) {
            // Fallback
          }

          if (percentage === null && totalWorkingDays === 0 && attendanceRecords.length > 0) {
            totalWorkingDays = attendanceRecords.length;
            percentage = Math.round((presentDays / totalWorkingDays) * 100);
          }

          let streak = 0;
          const sortedAtt = [...attendanceRecords].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          for (const record of sortedAtt) {
            if (String(record.status).toUpperCase() === 'ABSENT' || String(record.status).toUpperCase() === 'A') {
              streak++;
            } else {
              break;
            }
          }

          const childMarks = marksRes?.data?.marks || [];
          const childAssignments = (assignRes?.data?.assignments || []).slice(0, 5);
          const childActivities = (actRes?.data?.activities || []).slice(0, 5);
          const childNotices = notices.slice(0, 5);

          return {
            student: normalizeStudent(c),
            attendanceSummary: {
              totalWorkingDays,
              presentDays,
              absentDays,
              percentage,
              consecutiveAbsenceStreak: streak,
              recentRecords: attendanceRecords.slice(0, 30),
              records: attendanceRecords
            },
            marks: childMarks,
            recentAssignments: childAssignments,
            recentActivities: childActivities,
            recentNotices: childNotices
          };
        })
      );

      return {
        success: true,
        data: {
          parent: {
            parentId: session?.userId || session?.parentId || '',
            parentName: parentName,
            mobile: mobile
          },
          children: childrenSummaries,
          upcomingCalendar: upcomingCalendar.slice(0, 5),
          notices: notices.slice(0, 5)
        }
      };
    } catch (err) {
      console.error('[ApiClient] Error synthesizing parent dashboard:', err);
      return {
        success: false,
        error: { code: 'SYNTHESIS_ERROR', message: 'Unable to load parent dashboard data.' }
      };
    }
  },

  getDashboardSummary: async (token, bypassCache = false) => {
    return sendApiRequest('get_dashboard_summary', { token }, { bypassCache });
  },

  getParentChildren: async (token, bypassCache = false) => {
    return sendApiRequest('get_parent_children', { token }, { bypassCache });
  },

  getStudentProfile: async (token, studentId, bypassCache = false) => {
    return sendApiRequest('get_student_profile', { token, studentId }, { bypassCache });
  },

  getParentProfile: async (token, bypassCache = false) => {
    // Synthesize parent profile from session & get_parent_children
    try {
      const session = getStoredSession();
      const childrenRes = await ApiService.getParentChildren(token, bypassCache);
      const rawChildren = childrenRes?.data?.children || [];

      const normalizedChildren = rawChildren.map(normalizeStudent);

      return {
        success: true,
        data: {
          parent: {
            parentId: session?.userId || session?.parentId || '',
            parentName: session?.name || 'Parent / Guardian',
            mobile: session?.mobile || session?.identifier || '',
            status: 'Active'
          },
          children: normalizedChildren
        }
      };
    } catch (err) {
      return {
        success: false,
        error: { code: 'SYNTHESIS_ERROR', message: 'Unable to load parent profile.' }
      };
    }
  },

  getParentContacts: async (token, childId, bypassCache = false) => {
    // Resolves school and teacher contacts safely
    try {
      const childrenRes = await ApiService.getParentChildren(token, bypassCache);
      const rawChildren = childrenRes?.data?.children || [];

      const normalizedChildren = rawChildren.map(normalizeStudent);

      const activeChild = normalizedChildren.find(c => String(c.studentId) === String(childId)) || normalizedChildren[0] || null;

      // School institutional default directory
      const teachers = [
        {
          name: 'Rakibul Islam',
          subject: 'IT / ITeS (Vocational Trainer)',
          designation: 'Vocational Teacher',
          mobile: '9101004032',
          email: 'rakibul.it@gamerihss.edu.in'
        },
        {
          name: 'Subject Teacher',
          subject: 'General Education',
          designation: 'Faculty Member',
          mobile: '9365108860',
          email: 'office@gamerihss.edu.in'
        }
      ];

      const principal = {
        name: 'Principal Office',
        designation: 'Head of Institution',
        role: 'PRINCIPAL',
        mobile: '9854000000',
        email: 'principal@gamerihss.edu.in'
      };

      const schoolContacts = [
        {
          name: 'School Administration & Helpdesk',
          designation: 'General Inquiries & Records',
          category: 'Administration',
          mobile: '9854000000',
          email: 'info@gamerihss.edu.in'
        },
        {
          name: 'IT / Vocational Department',
          designation: 'Skill Education Support',
          category: 'Vocational',
          mobile: '9101004032',
          email: 'vocational@gamerihss.edu.in'
        }
      ];

      return {
        success: true,
        data: {
          selectedChild: activeChild,
          children: normalizedChildren,
          teachers,
          principal,
          schoolContacts
        }
      };
    } catch (err) {
      return {
        success: false,
        error: { code: 'SYNTHESIS_ERROR', message: 'Unable to load parent contacts.' }
      };
    }
  },

  getStudentContacts: async (token, bypassCache = false) => {
    try {
      const session = getStoredSession();
      const teachers = [
        {
          name: 'Rakibul Islam',
          subject: 'IT / ITeS (Vocational Trainer)',
          designation: 'Vocational Teacher',
          mobile: '9101004032',
          email: 'rakibul.it@gamerihss.edu.in'
        }
      ];

      const principal = {
        name: 'Principal Office',
        designation: 'Head of Institution',
        role: 'PRINCIPAL',
        mobile: '9854000000',
        email: 'principal@gamerihss.edu.in'
      };

      const schoolContacts = [
        {
          name: 'School Administration Desk',
          designation: 'Academic Affairs',
          category: 'Administration',
          mobile: '9854000000',
          email: 'info@gamerihss.edu.in'
        }
      ];

      return {
        success: true,
        data: {
          student: {
            studentId: session?.studentId || session?.userId,
            studentName: session?.name || 'Student',
            class: session?.class || '10',
            section: session?.section || 'BL'
          },
          teachers,
          principal,
          schoolContacts
        }
      };
    } catch (err) {
      return {
        success: false,
        error: { code: 'SYNTHESIS_ERROR', message: 'Unable to load student contacts.' }
      };
    }
  },

  getStaffProfile: async (token, bypassCache = false) => {
    return sendApiRequest('get_staff_profile', { token }, { bypassCache });
  },

  getAttendance: async (token, query = {}, bypassCache = false) => {
    const res = await sendApiRequest('get_attendance', { token, ...query }, { bypassCache });
    if (res && res.success && res.data && Array.isArray(res.data.attendance)) {
      return {
        ...res,
        data: {
          ...res.data,
          attendance: normalizeAttendance(res.data.attendance)
        }
      };
    }
    return res;
  },

  saveAttendance: async (token, payload = {}) => {
    return sendApiRequest('save_attendance', { token, ...payload }, { bypassCache: true });
  },

  getMarks: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_marks', { token, ...query }, { bypassCache });
  },

  getNotes: async (token, query = {}, bypassCache = false) => {
    const res = await sendApiRequest('get_notes', { token, ...query }, { bypassCache });
    if (res && res.success && res.data && Array.isArray(res.data.notes)) {
      return {
        ...res,
        data: {
          ...res.data,
          notes: normalizeNotes(res.data.notes)
        }
      };
    }
    return res;
  },

  uploadFile: async (token, { file, category = 'notes', subId = 'general' }) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          const res = await sendApiRequest('file_upload', {
            token,
            category,
            subId,
            fileName: file.name,
            contentType: file.type || 'application/pdf',
            fileData: base64Data
          }, { bypassCache: true });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },

  downloadFile: async (token, key) => {
    return sendApiRequest('file_download', { token, key }, { bypassCache: true });
  },

  getActivities: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_activities', { token, ...query }, { bypassCache });
  },

  getAssignments: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_assignments', { token, ...query }, { bypassCache });
  },

  getNotices: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_notices', { token, ...query }, { bypassCache });
  },

  getCalendar: async (token, bypassCache = false) => {
    return sendApiRequest('get_calendar', { token }, { bypassCache });
  },

  getContacts: async (token, bypassCache = false) => {
    return sendApiRequest('get_contacts', { token }, { bypassCache });
  },

  getStudents: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_students', { token, ...query }, { bypassCache });
  },

  getClasses: async (token, bypassCache = false) => {
    return sendApiRequest('get_classes', { token }, { bypassCache });
  },

  getSubjects: async (token, bypassCache = false) => {
    return sendApiRequest('get_subjects', { token }, { bypassCache });
  },

  getAcademicYears: async (token, bypassCache = false) => {
    return sendApiRequest('get_academic_years', { token }, { bypassCache });
  },

  getStaffList: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_staff_list', { token, ...query }, { bypassCache });
  },

  getAcademicDocuments: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_documents', { token, ...query }, { bypassCache });
  },

  getExamResults: async (token, query = {}, bypassCache = false) => {
    return sendApiRequest('get_exam_results', { token, ...query }, { bypassCache });
  },

  getSettings: async (token, bypassCache = false) => {
    return sendApiRequest('get_settings', { token }, { bypassCache });
  }
};
