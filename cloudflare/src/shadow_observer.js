/**
 * VE MANAGEMENT — PRODUCTION SHADOW OBSERVATION ENGINE (STEP 22 EXPANDED)
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Implements:
 * 1. Immediate Server-Side Kill Switch (`PRODUCTION_SHADOW_ENABLED`)
 * 2. Comprehensive Write-Path Interception & Blocking (25+ Mutation Actions Blocked)
 * 3. Asynchronous Non-Blocking Failure Isolation (Workers shadow failure never affects production)
 * 4. PII Anonymization & Data Minimization (Zero credentials, session tokens or passwords logged)
 * 5. Strict Execution Timeout Budget Enforcement (250ms)
 */

import crypto from 'crypto';

const WRITE_ACTIONS = new Set([
  'save_attendance',
  'save_marks',
  'issue_document',
  'approve_document',
  'cancel_document',
  'create_notice',
  'publish_notice',
  'archive_notice',
  'update_student',
  'update_student_profile',
  'update_student_status',
  'admit_student',
  'register_student',
  'assign_roll_numbers',
  'promote_students',
  'save_notes',
  'save_practical',
  'save_settings',
  'save_assignment',
  'save_activity',
  'save_achievement',
  'create_staff',
  'update_staff',
  'save_staff_assignments',
  'save_curriculum',
  'publish_curriculum',
  'archive_curriculum',
  'duplicate_curriculum_to_year',
  'save_academic_years',
  'set_active_academic_year',
  'save_classes',
  'save_subjects',
  'set_subject_status',
  'save_enrollments',
  'auth_change_password',
  'change_password',
  'auth_reset_user_password',
  'auth_reset_all_passwords',
  'init_schema',
  'restore_backup',
  'clear_cache'
]);

export class ShadowObserver {
  constructor(config = {}) {
    this.enabled = config.enabled !== undefined ? config.enabled : true;
    this.timeoutMs = config.timeoutMs || 250; // 250ms execution budget
    this.samplingRate = config.samplingRate !== undefined ? config.samplingRate : 1.0;
    this.schoolId = config.schoolId || 'GAMERI-HSS-001';
  }

  /**
   * Generates a correlation ID for a shadow observation event.
   */
  generateCorrelationId() {
    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 8);
    return `SHADOW-${timestamp}-${rand}`;
  }

  /**
   * Hashes a sensitive identifier (e.g. Student ID or Parent ID) for privacy-preserving logging.
   */
  anonymizeId(rawId) {
    if (!rawId) return 'ANONYMOUS';
    return 'ANON_' + crypto.createHash('sha256').update(String(rawId) + '_GHSS_SALT').digest('hex').substring(0, 12);
  }

  /**
   * Sanitizes request payload removing passwords, tokens, and raw credentials.
   */
  sanitizePayload(payload) {
    if (!payload || typeof payload !== 'object') return payload;
    const sanitized = { ...payload };

    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.password_hash;
    delete sanitized.salt;
    delete sanitized.secret;
    delete sanitized.authorization;

    if (sanitized.studentId) sanitized.studentId = this.anonymizeId(sanitized.studentId);
    if (sanitized.parentId) sanitized.parentId = this.anonymizeId(sanitized.parentId);

    return sanitized;
  }

  /**
   * Evaluates if a request is eligible for shadow observation.
   */
  isEligibleForShadow(action) {
    if (!this.enabled) return { eligible: false, reason: 'KILL_SWITCH_ACTIVE' };
    if (WRITE_ACTIONS.has(action)) return { eligible: false, reason: 'WRITE_OPERATION_BLOCKED' };
    if (Math.random() > this.samplingRate) return { eligible: false, reason: 'SAMPLED_OUT' };
    return { eligible: true, reason: 'ELIGIBLE' };
  }

  /**
   * Observes a request asynchronously with non-blocking failure isolation.
   */
  async observeAsync(action, payload, workerExecutor) {
    const correlationId = this.generateCorrelationId();
    const eligibility = this.isEligibleForShadow(action);

    if (!eligibility.eligible) {
      return {
        correlationId: correlationId,
        action: action,
        executed: false,
        status: eligibility.reason,
        result: null
      };
    }

    // Wrap executor with timeout budget
    try {
      const execPromise = workerExecutor();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SHADOW_TIMEOUT')), this.timeoutMs)
      );

      const result = await Promise.race([execPromise, timeoutPromise]);
      return {
        correlationId: correlationId,
        action: action,
        executed: true,
        status: 'SUCCESS',
        result: result,
        sanitizedPayload: this.sanitizePayload(payload)
      };
    } catch (err) {
      return {
        correlationId: correlationId,
        action: action,
        executed: false,
        status: err.message === 'SHADOW_TIMEOUT' ? 'SHADOW_TIMEOUT' : 'SHADOW_ERROR',
        error: err.message,
        sanitizedPayload: this.sanitizePayload(payload)
      };
    }
  }
}

export { WRITE_ACTIONS };
