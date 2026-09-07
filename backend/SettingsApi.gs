/**
 * VE MANAGEMENT — SYSTEM ADMINISTRATION & CONFIGURATION 2.0 API (STEP 15)
 * Institutional Entity: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Centralized, validated, auditable institutional settings and policy engine.
 * Governs school profile, branding, academic rules, grading policies, attendance thresholds,
 * document numbering, notifications, security defaults, and feature flags.
 */

var SettingsApi = {

  // Protected / Immutable Setting Keys
  IMMUTABLE_KEYS: ['SCHOOL_ID'],

  // Default Institutional Settings Seed
  DEFAULT_SETTINGS: {
    // School Identity
    SCHOOL_NAME: { value: 'Gameri Higher Secondary School, Gamiri', domain: 'SCHOOL_PROFILE', description: 'Official School Name' },
    SCHOOL_SHORT_NAME: { value: 'Gameri HSS', domain: 'SCHOOL_PROFILE', description: 'Short School Name' },
    SCHOOL_CODE: { value: 'GHSS-001', domain: 'SCHOOL_PROFILE', description: 'State / Board School Code' },
    SCHOOL_ID: { value: 'GAMERI-HSS-001', domain: 'SCHOOL_PROFILE', description: 'Authoritative School Tenancy ID' },
    SCHOOL_ADDRESS: { value: 'Gamiri, P.O. Gamiri', domain: 'SCHOOL_PROFILE', description: 'Campus Physical Address' },
    SCHOOL_DISTRICT: { value: 'Biswanath', domain: 'SCHOOL_PROFILE', description: 'Administrative District' },
    SCHOOL_STATE: { value: 'Assam', domain: 'SCHOOL_PROFILE', description: 'State' },
    SCHOOL_PINCODE: { value: '784172', domain: 'SCHOOL_PROFILE', description: 'Postal Code' },
    SCHOOL_PHONE: { value: '+91-9876543210', domain: 'SCHOOL_PROFILE', description: 'Official Contact Phone' },
    SCHOOL_EMAIL: { value: 'gameri.hss@assam.gov.in', domain: 'SCHOOL_PROFILE', description: 'Official Contact Email' },
    SCHOOL_WEBSITE: { value: 'https://gamerihss.assam.gov.in', domain: 'SCHOOL_PROFILE', description: 'Official Website URL' },

    // Branding
    LOGO_URL: { value: 'DEVELOPMENT_PLACEHOLDER', domain: 'BRANDING', description: 'School Crest / Logo URL' },
    SEAL_URL: { value: 'DEVELOPMENT_PLACEHOLDER', domain: 'BRANDING', description: 'Official Institutional Seal URL' },
    PRINCIPAL_SIGNATURE_URL: { value: 'DEVELOPMENT_PLACEHOLDER', domain: 'BRANDING', description: 'Principal Official Signature URL' },
    TEACHER_SIGNATURE_URL: { value: 'DEVELOPMENT_PLACEHOLDER', domain: 'BRANDING', description: 'Vocational Teacher Official Signature URL' },
    DOCUMENT_HEADER: { value: 'GAMERI HIGHER SECONDARY SCHOOL, GAMIRI', domain: 'BRANDING', description: 'Official Header Text' },
    DOCUMENT_FOOTER: { value: 'GAMIRI, BISWANATH, ASSAM - 784172', domain: 'BRANDING', description: 'Official Footer Text' },

    // Academic Rules
    ACADEMIC_YEAR: { value: '2026-2027', domain: 'ACADEMIC', description: 'Current Active Academic Session' },
    DEFAULT_CLASS: { value: '10', domain: 'ACADEMIC', description: 'Default Navigation Class' },
    DEFAULT_SECTION: { value: 'A', domain: 'ACADEMIC', description: 'Default Navigation Section' },
    YEAR_FORMAT: { value: 'YYYY-YYYY', domain: 'ACADEMIC', description: 'Academic Year Display Pattern' },

    // Attendance Policy
    ATTENDANCE_ALERT_THRESHOLD: { value: '75', domain: 'ATTENDANCE', description: 'Low Attendance Alert Threshold (%)', status: 'CONFIGURED — NOT LIVE' },
    LATE_COUNTS_AS_PRESENT: { value: 'true', domain: 'ATTENDANCE', description: 'Late attendance counts as present in calculation' },
    LEAVE_REQUIRES_REASON: { value: 'true', domain: 'ATTENDANCE', description: 'Leave entry requires mandatory remark' },
    ATTENDANCE_POLICY_STATUS: { value: 'CONFIGURED — NOT LIVE', domain: 'ATTENDANCE', description: 'Attendance Policy Activation Status' },

    // Grading & Pass/Fail Policy
    GRADING_POLICY: {
      value: JSON.stringify([
        { code: 'A+', min: 90, max: 100, gradePoint: 10, status: 'Outstanding' },
        { code: 'A', min: 80, max: 89.99, gradePoint: 9, status: 'Excellent' },
        { code: 'B+', min: 70, max: 79.99, gradePoint: 8, status: 'Very Good' },
        { code: 'B', min: 60, max: 69.99, gradePoint: 7, status: 'Good' },
        { code: 'C+', min: 50, min: 50, max: 59.99, gradePoint: 6, status: 'Fair' },
        { code: 'C', min: 40, max: 49.99, gradePoint: 5, status: 'Average' },
        { code: 'D', min: 30, max: 39.99, gradePoint: 4, status: 'Pass' },
        { code: 'E', min: 0, max: 29.99, gradePoint: 0, status: 'Needs Improvement' }
      ]),
      domain: 'GRADING',
      description: 'Institutional Grading Scale Bands',
      status: 'CONFIGURED — NOT LIVE'
    },
    GRADING_POLICY_STATUS: { value: 'CONFIGURED — NOT LIVE', domain: 'GRADING', description: 'Grading Scale Activation Status' },
    PASS_SUBJECT_MINIMUM: { value: '30', domain: 'GRADING', description: 'Minimum Subject Pass Percentage (%)' },
    OVERALL_PASS_RULE: { value: 'ALL_SUBJECTS_PASS', domain: 'GRADING', description: 'Evaluation Pass Criterion', status: 'CONFIGURED — NOT LIVE' },

    // Merit Ranking Policy
    RANKING_ENABLED: { value: 'false', domain: 'RANKING', description: 'Merit Ranking Publication Flag', status: 'CONFIGURED — NOT LIVE' },
    RANKING_SCOPE: { value: 'CLASS', domain: 'RANKING', description: 'Ranking Scope (CLASS/SECTION/STREAM/SCHOOL)' },
    RANKING_POLICY_STATUS: { value: 'CONFIGURED — NOT LIVE', domain: 'RANKING', description: 'Merit Ranking Policy Status' },

    // Document Settings
    DOCUMENT_NUMBER_PREFIX: { value: 'GHSS', domain: 'DOCUMENTS', description: 'Institutional Document Number Prefix' },
    DOCUMENT_NUMBER_FORMAT: { value: '{PREFIX}/{YEAR}/{TYPE}/{SEQUENCE}', domain: 'DOCUMENTS', description: 'Official Document Identifier Pattern' },
    SEQUENCE_PADDING: { value: '4', domain: 'DOCUMENTS', description: 'Document Sequence Zero-Padding Length' },
    VERIFICATION_BASE_URL: { value: 'https://ve-management.org/verify', domain: 'PUBLIC_VERIFICATION', description: 'Public QR Verification Portal URL', status: 'CONFIGURED — NOT LIVE' },
    DEFAULT_SIGNATORY_TITLE: { value: 'Principal', domain: 'SIGNATORIES', description: 'Primary Signatory Official Designation', status: 'REQUIRES INSTITUTIONAL APPROVAL' },
    DEFAULT_SIGNATORY_NAME: { value: 'Dr. B. K. Sarmah', domain: 'SIGNATORIES', description: 'Primary Signatory Legal Name' },

    // Notifications & Communication
    IN_APP_NOTIFICATIONS_ENABLED: { value: 'true', domain: 'NOTIFICATIONS', description: 'In-app notification badge active' },
    ANDROID_NOTIFICATIONS_ENABLED: { value: 'true', domain: 'NOTIFICATIONS', description: 'Android push notification active' },
    WHATSAPP_NOTIFICATIONS_ENABLED: { value: 'false', domain: 'NOTIFICATIONS', description: 'WhatsApp notification gateway active' },
    NOTICE_NOTIFICATIONS_ENABLED: { value: 'true', domain: 'NOTIFICATIONS', description: 'Publishing notice triggers notification' },
    EXAM_REMINDERS_ENABLED: { value: 'true', domain: 'NOTIFICATIONS', description: 'Upcoming exam reminders active' },

    // Security & Audit
    SESSION_TIMEOUT_DAYS: { value: '30', domain: 'SECURITY', description: 'Session Token Validity Duration (Days)' },
    MAX_LOGIN_ATTEMPTS: { value: '5', domain: 'SECURITY', description: 'Brute-force Throttle Max Failed Attempts' },
    LOCKOUT_WINDOW_MINUTES: { value: '15', domain: 'SECURITY', description: 'Account Lockout Window (Minutes)' },
    AUDIT_RETENTION_DAYS: { value: '365', domain: 'AUDIT', description: 'Audit Log Retention Window (Days)', status: 'REQUIRES INSTITUTIONAL APPROVAL' },
    COMMON_PASSWORD: { value: '12345', domain: 'SECURITY', description: 'Default Reset Password' },

    // Backup & Disaster Recovery
    BACKUP_ENABLED: { value: 'true', domain: 'BACKUP', description: 'Automated Snapshot Generation Active' },
    BACKUP_FREQUENCY: { value: 'WEEKLY', domain: 'BACKUP', description: 'Automated Snapshot Schedule' },
    DISASTER_RECOVERY_RPO_HOURS: { value: '24', domain: 'DISASTER_RECOVERY', description: 'Recovery Point Objective (Hours)', status: 'REQUIRES INSTITUTIONAL APPROVAL' },
    DISASTER_RECOVERY_RTO_HOURS: { value: '2', domain: 'DISASTER_RECOVERY', description: 'Recovery Time Objective (Hours)', status: 'REQUIRES INSTITUTIONAL APPROVAL' },

    // Feature Flags
    FEATURE_ATTENDANCE_V2: { value: 'true', domain: 'FEATURE_FLAGS', description: 'Curriculum-aware Attendance Active' },
    FEATURE_EXAM_V2: { value: 'true', domain: 'FEATURE_FLAGS', description: 'Examination & Marks Engine Active' },
    FEATURE_DOCUMENTS_V2: { value: 'true', domain: 'FEATURE_FLAGS', description: 'Official Academic Documents Active' },
    FEATURE_COMMUNICATION_V2: { value: 'true', domain: 'FEATURE_FLAGS', description: 'Notices & Calendar 2.0 Active' },
    FEATURE_REPORTS_V2: { value: 'true', domain: 'FEATURE_FLAGS', description: 'Reports & Performance Dashboards Active' },
    FEATURE_SECURITY_V2: { value: 'true', domain: 'FEATURE_FLAGS', description: 'Hardened Security & Backup 2.0 Active' }
  },

  /**
   * Retrieves all institutional settings filtered by caller role and school tenancy.
   */
  getSettings: function(session, query) {
    session = session || { role: 'PUBLIC' };
    query = query || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const role = session.role || 'PUBLIC';

    const dbRecords = Database.readAll('Settings');
    const settingsMap = {};

    // Seed defaults
    Object.keys(this.DEFAULT_SETTINGS).forEach(k => {
      settingsMap[k] = Object.assign({ key: k, schoolId: schoolId, updatedAt: new Date().toISOString() }, this.DEFAULT_SETTINGS[k]);
    });

    // Merge DB overrides
    dbRecords.forEach(r => {
      if (!r.schoolId || r.schoolId === schoolId) {
        if (settingsMap[r.key]) {
          settingsMap[r.key] = Object.assign({}, settingsMap[r.key], r);
        } else {
          settingsMap[r.key] = r;
        }
      }
    });

    let settingsList = Object.values(settingsMap);

    // Apply Domain Filter if requested
    if (query.domain) {
      settingsList = settingsList.filter(s => s.domain === query.domain || s.category === query.domain);
    }

    // Role-based visibility sanitization
    if (role === 'ADMIN') {
      // Full access
    } else if (role === 'PRINCIPAL') {
      // Exclude direct security credential settings
      settingsList = settingsList.filter(s => s.domain !== 'SECURITY' || s.key !== 'COMMON_PASSWORD');
    } else if (role === 'TEACHER') {
      // Teachers only see School, Academic, Attendance, Grading, Documents, Calendar domains
      const allowedDomains = ['SCHOOL_PROFILE', 'BRANDING', 'ACADEMIC', 'ATTENDANCE', 'GRADING', 'DOCUMENTS', 'SIGNATORIES', 'NOTIFICATIONS', 'FEATURE_FLAGS'];
      settingsList = settingsList.filter(s => allowedDomains.includes(s.domain));
    } else {
      // Students / Parents / Public see public school info and non-sensitive branding/academic settings
      const publicKeys = ['SCHOOL_NAME', 'SCHOOL_SHORT_NAME', 'SCHOOL_CODE', 'SCHOOL_ID', 'SCHOOL_ADDRESS', 'SCHOOL_DISTRICT', 'SCHOOL_STATE', 'SCHOOL_PINCODE', 'SCHOOL_PHONE', 'SCHOOL_EMAIL', 'SCHOOL_WEBSITE', 'LOGO_URL', 'DOCUMENT_HEADER', 'DOCUMENT_FOOTER', 'ACADEMIC_YEAR', 'YEAR_FORMAT'];
      settingsList = settingsList.filter(s => publicKeys.includes(s.key));
    }

    return {
      success: true,
      data: {
        settings: settingsList,
        total: settingsList.length,
        schoolId: schoolId,
        activeAcademicYear: (settingsMap['ACADEMIC_YEAR'] && settingsMap['ACADEMIC_YEAR'].value) || '2026-2027'
      }
    };
  },

  /**
   * Validates a setting key and value format.
   */
  validateSetting: function(key, value, domain) {
    if (!key || typeof key !== 'string') {
      return { isValid: false, error: 'Setting key is required' };
    }

    if (this.IMMUTABLE_KEYS.includes(key)) {
      return { isValid: false, error: `Setting ${key} is immutable and cannot be modified` };
    }

    if (key === 'ATTENDANCE_ALERT_THRESHOLD' || key === 'PASS_SUBJECT_MINIMUM') {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 100) {
        return { isValid: false, error: `${key} must be a valid percentage between 0 and 100` };
      }
    }

    if (key === 'GRADING_POLICY') {
      try {
        const bands = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(bands) || bands.length === 0) {
          return { isValid: false, error: 'GRADING_POLICY must be a non-empty array of grade bands' };
        }

        const codes = new Set();
        for (let i = 0; i < bands.length; i++) {
          const b = bands[i];
          if (!b.code || typeof b.min !== 'number' || typeof b.max !== 'number') {
            return { isValid: false, error: `Grade band at index ${i} is missing code, min, or max` };
          }
          if (b.min < 0 || b.max > 100 || b.min > b.max) {
            return { isValid: false, error: `Invalid percentage range for grade ${b.code}: [${b.min}, ${b.max}]` };
          }
          if (codes.has(b.code)) {
            return { isValid: false, error: `Duplicate grade code detected: ${b.code}` };
          }
          codes.add(b.code);

          // Check overlapping with previous bands
          for (let j = 0; j < i; j++) {
            const prev = bands[j];
            if ((b.min >= prev.min && b.min < prev.max) || (b.max > prev.min && b.max <= prev.max)) {
              return { isValid: false, error: `Grade band ${b.code} overlaps with ${prev.code}` };
            }
          }
        }
      } catch (e) {
        return { isValid: false, error: 'Malformed JSON payload for GRADING_POLICY' };
      }
    }

    if (key === 'DOCUMENT_NUMBER_PREFIX' && (!value || String(value).trim() === '')) {
      return { isValid: false, error: 'DOCUMENT_NUMBER_PREFIX cannot be empty' };
    }

    return { isValid: true };
  },

  /**
   * Updates an institutional setting.
   */
  updateSetting: function(session, payload) {
    if (!session || !Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin or Principal role required to update settings' } };
    }

    payload = payload || {};
    const key = payload.key;
    const value = payload.value !== undefined ? String(payload.value) : '';
    const domain = payload.domain || 'GENERAL';
    const description = payload.description || '';
    const status = payload.status || 'ACTIVE';
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;

    // Principal cannot modify system security settings
    if (session.role === 'PRINCIPAL' && ['SESSION_TIMEOUT_DAYS', 'MAX_LOGIN_ATTEMPTS', 'COMMON_PASSWORD'].includes(key)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Principal cannot modify core security settings' } };
    }

    const valRes = this.validateSetting(key, payload.value !== undefined ? payload.value : value, domain);
    if (!valRes.isValid) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: valRes.error } };
    }

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const existing = Database.findByPk('Settings', key);
    const oldValue = existing ? existing.value : (this.DEFAULT_SETTINGS[key] ? this.DEFAULT_SETTINGS[key].value : '');

    const record = {
      key: key,
      schoolId: schoolId,
      value: typeof payload.value === 'object' ? JSON.stringify(payload.value) : value,
      domain: domain,
      category: domain,
      description: description || (existing ? existing.description : ''),
      status: status,
      updatedBy: session.userId,
      updatedAt: nowStr
    };

    Database.upsertBatch('Settings', [record]);

    Audit.log('SETTING_UPDATED', session.role, session.userId, {
      key: key,
      domain: domain,
      oldValue: key.includes('PASSWORD') || key.includes('SECRET') ? '***' : oldValue,
      newValue: key.includes('PASSWORD') || key.includes('SECRET') ? '***' : value,
      status: status
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Setting ${key} updated successfully`,
      data: { record: record }
    };
  },

  /**
   * Bulk updates multiple settings atomically.
   */
  bulkUpdateSettings: function(session, payload) {
    if (!session || !Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin or Principal role required for bulk settings update' } };
    }

    payload = payload || {};
    const settingsList = Array.isArray(payload.settings) ? payload.settings : [];
    if (settingsList.length === 0) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'settings array cannot be empty' } };
    }

    // Validate all before writing
    for (let i = 0; i < settingsList.length; i++) {
      const s = settingsList[i];
      const valRes = this.validateSetting(s.key, s.value, s.domain);
      if (!valRes.isValid) {
        return { success: false, error: { code: 'VALIDATION_ERROR', message: `Validation failed on ${s.key}: ${valRes.error}` } };
      }
    }

    const updatedRecords = [];
    settingsList.forEach(s => {
      const res = this.updateSetting(session, s);
      if (res.success && res.data && res.data.record) {
        updatedRecords.push(res.data.record);
      }
    });

    return {
      success: true,
      message: `Successfully updated ${updatedRecords.length} settings`,
      data: { records: updatedRecords }
    };
  },

  /**
   * Activates or deactivates an institutional policy.
   */
  setPolicyStatus: function(session, payload) {
    if (!session || !Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin or Principal role required to modify policy status' } };
    }

    payload = payload || {};
    const policyKey = payload.policyKey || payload.key;
    const newStatus = payload.status || 'CONFIGURED — NOT LIVE';
    const isConfirmed = payload.confirmed === true || payload.confirm === true;

    if (!isConfirmed) {
      return {
        success: false,
        error: { code: 'CONFIRMATION_REQUIRED', message: 'Explicit confirmation (confirmed: true) is required to alter institutional policy status' }
      };
    }

    const allowedStatuses = ['NOT_CONFIGURED', 'CONFIGURED — NOT LIVE', 'ACTIVE', 'INACTIVE', 'REQUIRES INSTITUTIONAL APPROVAL'];
    if (!allowedStatuses.includes(newStatus)) {
      return {
        success: false,
        error: { code: 'INVALID_STATUS', message: `Invalid status: ${newStatus}. Allowed: ${allowedStatuses.join(', ')}` }
      };
    }

    const res = this.updateSetting(session, {
      key: policyKey,
      value: payload.value !== undefined ? payload.value : newStatus,
      status: newStatus,
      domain: payload.domain || 'POLICY'
    });

    Audit.log(newStatus === 'ACTIVE' ? 'POLICY_ACTIVATED' : 'POLICY_DEACTIVATED', session.role, session.userId, {
      policyKey: policyKey,
      newStatus: newStatus
    }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: `Policy ${policyKey} status set to ${newStatus}`,
      data: res.data
    };
  },

  /**
   * Authoritative School Logo & Signatures Upload (Requirement #5)
   */
  uploadSchoolBranding: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Administrator or Principal can update institutional branding assets.' } };
    }

    payload = payload || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const updated = {};

    if (payload.logoUrl !== undefined) {
      this.updateSetting(session, { key: 'LOGO_URL', value: payload.logoUrl, domain: 'BRANDING' });
      updated.logoUrl = payload.logoUrl;
    }
    if (payload.sealUrl !== undefined) {
      this.updateSetting(session, { key: 'SEAL_URL', value: payload.sealUrl, domain: 'BRANDING' });
      updated.sealUrl = payload.sealUrl;
    }
    if (payload.principalSignatureUrl !== undefined) {
      this.updateSetting(session, { key: 'PRINCIPAL_SIGNATURE_URL', value: payload.principalSignatureUrl, domain: 'BRANDING' });
      updated.principalSignatureUrl = payload.principalSignatureUrl;
    }
    if (payload.teacherSignatureUrl !== undefined) {
      this.updateSetting(session, { key: 'TEACHER_SIGNATURE_URL', value: payload.teacherSignatureUrl, domain: 'BRANDING' });
      updated.teacherSignatureUrl = payload.teacherSignatureUrl;
    }

    Audit.log('UPDATE_SCHOOL_BRANDING', session.role, session.userId, { assets: Object.keys(updated) }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: 'School branding and signature assets updated successfully',
      data: updated
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SettingsApi };
}
