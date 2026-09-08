/**
 * VE MANAGEMENT — STUDENTS API HANDLERS
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 */

import { successResponse, errorResponse } from '../response.js';
import { Security } from '../security.js';
import { normalizeClass, normalizeSection } from '../academic.js';

export function formatStudentRecord(s) {
  if (!s || typeof s !== 'object') return s;
  const studentId = s.student_id || s.studentId || s.id || '';
  const name = s.student_name || s.studentName || s.name || '';
  const admissionNo = s.admission_no || s.admissionNo || '';
  const className = String(s.class || s.className || '');
  const section = s.section || 'A';
  const rollNo = s.roll_no !== undefined && s.roll_no !== null ? String(s.roll_no) : (s.rollNo !== undefined && s.rollNo !== null ? String(s.rollNo) : '');
  const fatherName = s.father_name || s.fatherName || '';
  const motherName = s.mother_name || s.motherName || '';
  const parentName = s.parentName || fatherName || motherName || 'Parent';
  const mobile = s.mobile || s.parentMobile || '';
  const parentMobile = s.parentMobile || s.mobile || '';
  const status = s.status || 'Active';
  const rawGroup = s.group || s.student_group || s.group_name || s.studentGroup || s.assigned_group || s.assignedGroup;
  const group = (rawGroup !== undefined && rawGroup !== null && String(rawGroup).trim() !== '' && String(rawGroup).trim() !== 'null' && String(rawGroup).trim() !== 'undefined' && String(rawGroup).trim() !== 'Group Not Assigned') ? String(rawGroup).trim() : null;

  return {
    ...s,
    id: studentId,
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
    fatherName,
    father_name: fatherName,
    motherName,
    mother_name: motherName,
    parentName,
    parentMobile,
    mobile,
    status
  };
}

export const StudentsApi = {
  async getStudents(env, session, payload, corsHeaders) {
    const rawClass = payload.class ? String(payload.class) : null;
    const rawSection = payload.section ? String(payload.section) : null;
    const academicYear = payload.academicYear || payload.academic_year || null;
    const statusParam = payload.status ? String(payload.status) : 'Active';

    const classParam = rawClass ? normalizeClass(rawClass) : null;
    const sectionParam = rawSection ? normalizeSection(classParam, rawSection) : null;

    let query;
    const params = [];

    if (academicYear) {
      query = `SELECT s.*, e.roll_no as enrollment_roll_no, e.class as enrollment_class, e.section as enrollment_section, e.status as enrollment_status, e.academic_year
               FROM students s
               JOIN enrollments e ON s.student_id = e.student_id
               WHERE e.academic_year = ?`;
      params.push(academicYear);

      if (classParam) {
        query += ` AND e.class = ?`;
        params.push(classParam);
      }
      if (sectionParam && sectionParam !== 'ALL') {
        query += ` AND e.section = ?`;
        params.push(sectionParam);
      }
      if (statusParam && statusParam !== 'ALL') {
        query += ` AND e.status = ?`;
        params.push(statusParam.toUpperCase());
      }
      query += ` ORDER BY CAST(COALESCE(e.roll_no, s.roll_no) AS INTEGER) ASC, s.student_name ASC`;
    } else {
      query = `SELECT * FROM students WHERE 1=1`;
      if (statusParam && statusParam !== 'ALL') {
        query += ` AND status = ?`;
        params.push(statusParam);
      }
      if (classParam) {
        query += ` AND class = ?`;
        params.push(classParam);
      }
      if (sectionParam && sectionParam !== 'ALL') {
        query += ` AND section = ?`;
        params.push(sectionParam);
      }
      query += ` ORDER BY CAST(roll_no AS INTEGER) ASC, student_name ASC`;
    }

    const { results } = await env.DB.prepare(query).bind(...params).all();
    const normalizedStudents = (results || []).map(s => {
      const formatted = formatStudentRecord(s);
      if (s.enrollment_class) formatted.class = s.enrollment_class;
      if (s.enrollment_section) formatted.section = s.enrollment_section;
      if (s.enrollment_roll_no) formatted.roll_no = s.enrollment_roll_no;
      if (s.enrollment_roll_no) formatted.rollNo = s.enrollment_roll_no;
      return formatted;
    });

    return successResponse({ students: normalizedStudents }, 'get_students', 200, corsHeaders);
  },

  async getStudentProfile(env, session, payload, corsHeaders) {
    const studentId = payload.studentId || session.userId;
    const canAccess = await Security.canAccessStudent(env.DB, session, studentId);
    if (!canAccess) {
      return errorResponse('UNAUTHORIZED', 'Access denied to student record', 403, 'get_student_profile', corsHeaders);
    }

    const student = await env.DB.prepare(`SELECT * FROM students WHERE student_id = ?`).bind(studentId).first();
    if (!student) {
      return errorResponse('NOT_FOUND', 'Student record not found', 404, 'get_student_profile', corsHeaders);
    }

    return successResponse({ student: formatStudentRecord(student) }, 'get_student_profile', 200, corsHeaders);
  },

  /**
   * Fetches eligible candidates for student promotion between academic years.
   */
  async getPromotionCandidates(env, session, payload, corsHeaders) {
    if (!Security.isAdminOrPrincipal(session)) {
      return errorResponse('UNAUTHORIZED', 'Administrative privilege required to view promotion candidates', 403, 'get_promotion_candidates', corsHeaders);
    }

    const sourceYear = String(payload.sourceAcademicYear || payload.sourceYear || '').trim();
    const sourceClass = payload.sourceClass ? normalizeClass(payload.sourceClass) : '9';
    const targetYear = String(payload.targetAcademicYear || payload.targetYear || '').trim();

    if (!sourceYear || !targetYear) {
      return errorResponse('BAD_REQUEST', 'sourceAcademicYear and targetAcademicYear are required', 400, 'get_promotion_candidates', corsHeaders);
    }

    // Suggested next class
    const defaultTargetClass = sourceClass === '9' ? '10' : (sourceClass === '10' ? '11' : (sourceClass === '11' ? '12' : 'COMPLETED'));

    // Retrieve students enrolled in source class and year, with target year enrollment status if any
    const query = `
      SELECT 
        s.student_id,
        s.student_name,
        COALESCE(se.roll_no, s.roll_no) as current_roll,
        COALESCE(se.class, s.class) as source_class,
        COALESCE(se.section, s.section) as source_section,
        se.status as source_status,
        te.enrollment_id as target_enrollment_id,
        te.class as target_class,
        te.section as target_section,
        te.roll_no as target_roll,
        te.status as target_status,
        te.promotion_decision as existing_decision
      FROM students s
      JOIN enrollments se ON se.student_id = s.student_id AND se.academic_year = ? AND se.class = ?
      LEFT JOIN enrollments te ON te.student_id = s.student_id AND te.academic_year = ?
      WHERE s.status IN ('Active', 'Completed')
      ORDER BY CAST(COALESCE(se.roll_no, s.roll_no) AS INTEGER) ASC, s.student_name ASC
    `;

    const { results } = await env.DB.prepare(query).bind(sourceYear, sourceClass, targetYear).all();

    // Determine occupied roll numbers in target class/section
    const { results: occupiedRolls } = await env.DB.prepare(
      `SELECT roll_no, section FROM enrollments WHERE academic_year = ? AND class = ? AND status = 'ACTIVE'`
    ).bind(targetYear, defaultTargetClass).all();

    const usedRollSet = new Set((occupiedRolls || []).map(r => String(r.roll_no).trim()));

    let nextRollCounter = 1;
    function getNextAvailableRoll() {
      while (usedRollSet.has(String(nextRollCounter))) {
        nextRollCounter++;
      }
      const r = String(nextRollCounter);
      usedRollSet.add(r);
      nextRollCounter++;
      return r;
    }

    const candidates = (results || []).map(row => {
      const alreadyPromoted = !!row.target_enrollment_id;
      const suggestedRoll = alreadyPromoted ? (row.target_roll || '') : (defaultTargetClass === 'COMPLETED' ? '' : getNextAvailableRoll());

      return {
        studentId: row.student_id,
        studentName: row.student_name,
        sourceClass: row.source_class,
        sourceSection: row.source_section || 'A',
        currentRollNo: row.current_roll || '',
        suggestedTargetClass: defaultTargetClass,
        suggestedTargetSection: row.source_section || 'A',
        suggestedRollNo: suggestedRoll,
        defaultDecision: defaultTargetClass === 'COMPLETED' ? 'COMPLETED' : 'PROMOTED',
        alreadyPromoted: alreadyPromoted,
        existingTargetClass: row.target_class || null,
        existingTargetStatus: row.target_status || null,
        existingDecision: row.existing_decision || null
      };
    });

    return successResponse({
      candidates,
      sourceAcademicYear: sourceYear,
      sourceClass,
      targetAcademicYear: targetYear,
      defaultTargetClass,
      totalCandidates: candidates.length,
      alreadyPromotedCount: candidates.filter(c => c.alreadyPromoted).length
    }, 'get_promotion_candidates', 200, corsHeaders);
  },

  /**
   * Promotes or retains a batch of students with zero data loss and Free-tier write minimization.
   */
  async promoteStudents(env, session, payload, corsHeaders) {
    if (!Security.isAdminOrPrincipal(session)) {
      return errorResponse('UNAUTHORIZED', 'Administrative privilege required to execute student promotions', 403, 'promote_students', corsHeaders);
    }

    const schoolId = payload.schoolId || session.schoolId || env.SCHOOL_ID || 'GAMERI-HSS-001';
    const sourceYear = String(payload.sourceAcademicYear || payload.sourceYear || '').trim();
    const targetYear = String(payload.targetAcademicYear || payload.targetYear || '').trim();
    const promotions = payload.promotions || [];

    if (!sourceYear || !targetYear) {
      return errorResponse('BAD_REQUEST', 'sourceAcademicYear and targetAcademicYear are required', 400, 'promote_students', corsHeaders);
    }
    if (sourceYear === targetYear) {
      return errorResponse('BAD_REQUEST', 'Source and target academic years cannot be the same', 400, 'promote_students', corsHeaders);
    }
    if (!Array.isArray(promotions) || promotions.length === 0) {
      return errorResponse('BAD_REQUEST', 'Promotions list cannot be empty', 400, 'promote_students', corsHeaders);
    }

    // 1. Validate Target Academic Year status
    const targetYearRow = await env.DB.prepare(
      `SELECT * FROM academic_years WHERE year_name = ?`
    ).bind(targetYear).first();

    if (!targetYearRow) {
      return errorResponse('NOT_FOUND', `Target academic year "${targetYear}" does not exist`, 404, 'promote_students', corsHeaders);
    }
    if (targetYearRow.status === 'CLOSED' || targetYearRow.status === 'ARCHIVED') {
      return errorResponse('INVALID_STATE', `Cannot promote students into a ${targetYearRow.status.toLowerCase()} academic year (${targetYear})`, 400, 'promote_students', corsHeaders);
    }

    const isTargetActiveYear = targetYearRow.is_current === 1;

    // 2. Pre-fetch existing target year enrollments to prevent duplicates and detect roll collisions
    const { results: existingTargetEnrollments } = await env.DB.prepare(
      `SELECT student_id, class, section, roll_no, status FROM enrollments WHERE academic_year = ?`
    ).bind(targetYear).all();

    const existingTargetStudentMap = new Map((existingTargetEnrollments || []).map(e => [e.student_id, e]));
    const occupiedTargetRolls = new Map(); // key: `${class}_${section}` -> Set of roll_no

    (existingTargetEnrollments || []).forEach(e => {
      if (e.roll_no && e.status === 'ACTIVE') {
        const key = `${e.class}_${e.section || 'A'}`;
        if (!occupiedTargetRolls.has(key)) occupiedTargetRolls.set(key, new Set());
        occupiedTargetRolls.get(key).add(String(e.roll_no).trim());
      }
    });

    // In-payload roll tracker to detect duplicate roll assignments in the incoming batch
    const batchRollTracker = new Map();

    const statements = [];
    const promotedDetails = [];

    for (let i = 0; i < promotions.length; i++) {
      const p = promotions[i];
      const sid = String(p.studentId || p.id || '').trim();
      const sName = String(p.studentName || p.name || sid).trim();
      const decision = String(p.decision || p.promotionDecision || 'PROMOTED').toUpperCase();
      const srcCls = normalizeClass(p.sourceClass || p.currentClass || '9');
      let tgtCls = p.targetClass ? String(p.targetClass).trim() : '';
      const tgtSec = normalizeSection(tgtCls || srcCls, p.targetSection || p.section || 'A');
      const newRoll = String(
        p.newRollNo !== undefined && p.newRollNo !== null ? p.newRollNo :
        p.targetRoll !== undefined && p.targetRoll !== null ? p.targetRoll :
        p.targetRollNo !== undefined && p.targetRollNo !== null ? p.targetRollNo :
        p.rollNo !== undefined && p.rollNo !== null ? p.rollNo :
        p.roll_no !== undefined && p.roll_no !== null ? p.roll_no : ''
      ).trim();

      if (!sid) continue;

      // Prevent duplicate promotion if student already enrolled in target year
      if (existingTargetStudentMap.has(sid)) {
        const existingRec = existingTargetStudentMap.get(sid);
        return errorResponse(
          'ALREADY_PROMOTED',
          `Student "${sName}" (ID: ${sid}) has already been promoted to Class ${existingRec.class} in academic year ${targetYear}. Duplicate promotion blocked.`,
          409,
          'promote_students',
          corsHeaders
        );
      }

      // Safeguard: Cannot promote Class 12 to Class 13 or any higher class
      if (srcCls === '12' && tgtCls && tgtCls !== 'COMPLETED' && decision !== 'RETAINED' && decision !== 'NOT_PROMOTED') {
        return errorResponse(
          'INVALID_PROMOTION',
          `Class 12 students must be marked as COMPLETED / GRADUATED. Cannot promote to Class ${tgtCls}.`,
          400,
          'promote_students',
          corsHeaders
        );
      }

      // Class 12 completion safeguard
      if (srcCls === '12' || decision === 'COMPLETED') {
        tgtCls = 'COMPLETED';
      } else if (decision === 'NOT_PROMOTED' || decision === 'RETAINED') {
        tgtCls = srcCls;
      } else if (!tgtCls) {
        tgtCls = srcCls === '9' ? '10' : (srcCls === '10' ? '11' : (srcCls === '11' ? '12' : 'COMPLETED'));
      }

      // Safeguard: Invalid skip leap (e.g. 9 -> 11 or 10 -> 12)
      if (decision === 'PROMOTED' && tgtCls !== 'COMPLETED') {
        const srcNum = parseInt(srcCls, 10);
        const tgtNum = parseInt(tgtCls, 10);
        if (!isNaN(srcNum) && !isNaN(tgtNum) && tgtNum > srcNum + 1) {
          return errorResponse(
            'INVALID_PROMOTION',
            `Invalid grade leap from Class ${srcCls} to Class ${tgtCls}.`,
            400,
            'promote_students',
            corsHeaders
          );
        }
      }

      // Safeguard: Roll Number Collisions
      if (newRoll && tgtCls !== 'COMPLETED') {
        const classSecKey = `${tgtCls}_${tgtSec}`;

        // Check against existing enrollments in DB
        if (occupiedTargetRolls.has(classSecKey) && occupiedTargetRolls.get(classSecKey).has(newRoll)) {
          return errorResponse(
            'DUPLICATE_ROLL_NUMBER',
            `Roll number "${newRoll}" is already assigned to another student in Class ${tgtCls} Section ${tgtSec} (${targetYear}).`,
            409,
            'promote_students',
            corsHeaders
          );
        }

        // Check within current promotion payload
        if (!batchRollTracker.has(classSecKey)) batchRollTracker.set(classSecKey, new Set());
        const batchSet = batchRollTracker.get(classSecKey);
        if (batchSet.has(newRoll)) {
          return errorResponse(
            'DUPLICATE_ROLL_NUMBER',
            `Duplicate roll number "${newRoll}" assigned multiple times in Class ${tgtCls} Section ${tgtSec} in this promotion batch.`,
            409,
            'promote_students',
            corsHeaders
          );
        }
        batchSet.add(newRoll);
      }

      // 1. Update source year enrollment to PROMOTED / COMPLETED / RETAINED
      const srcEnrId = `ENR_${sid}_${sourceYear.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const srcStatus = decision === 'PROMOTED' ? 'PROMOTED' : (decision === 'COMPLETED' ? 'COMPLETED' : 'DETAINED');

      statements.push(
        env.DB.prepare(
          `INSERT INTO enrollments (enrollment_id, school_id, student_id, academic_year, class, section, roll_no, status, promotion_decision, remarks, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(student_id, academic_year) DO UPDATE SET
             status = excluded.status,
             promotion_decision = excluded.promotion_decision,
             remarks = COALESCE(excluded.remarks, enrollments.remarks),
             updated_at = datetime('now')`
        ).bind(
          srcEnrId, schoolId, sid, sourceYear, srcCls, p.sourceSection || 'A',
          p.currentRollNo || '', srcStatus, decision,
          p.remarks || `Promotion decision: ${decision} to Class ${tgtCls} (${targetYear})`
        )
      );

      // 2. Create target year enrollment record
      if (decision !== 'TRANSFERRED' && decision !== 'WITHDRAWN') {
        const tgtEnrId = `ENR_${sid}_${targetYear.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const tgtStatus = tgtCls === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE';
        const tgtDecision = tgtCls === 'COMPLETED' ? 'COMPLETED' : 'PENDING';

        statements.push(
          env.DB.prepare(
            `INSERT INTO enrollments (enrollment_id, school_id, student_id, academic_year, class, section, roll_no, status, promotion_decision, remarks, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
             ON CONFLICT(student_id, academic_year) DO UPDATE SET
               class = excluded.class,
               section = excluded.section,
               roll_no = excluded.roll_no,
               status = excluded.status,
               promotion_decision = excluded.promotion_decision,
               updated_at = datetime('now')`
          ).bind(
            tgtEnrId, schoolId, sid, targetYear, tgtCls, tgtSec, newRoll, tgtStatus, tgtDecision,
            p.remarks || (tgtCls === 'COMPLETED' ? `Graduated from Gameri HSS in Class 12 (${sourceYear})` : `Promoted from Class ${srcCls} (${sourceYear})`)
          )
        );
      }

      // 3. Update master Students table IF target year is the current active session
      if (isTargetActiveYear) {
        if (tgtCls === 'COMPLETED') {
          statements.push(
            env.DB.prepare(
              `UPDATE students SET status = 'Graduated', updated_at = datetime('now') WHERE student_id = ?`
            ).bind(sid)
          );
        } else {
          statements.push(
            env.DB.prepare(
              `UPDATE students SET class = ?, section = ?, roll_no = COALESCE(NULLIF(?, ''), roll_no), status = 'Active', updated_at = datetime('now') WHERE student_id = ?`
            ).bind(tgtCls, tgtSec, newRoll, sid)
          );
        }
      }

      promotedDetails.push({
        studentId: sid,
        studentName: sName,
        fromClass: srcCls,
        toClass: tgtCls,
        newRollNo: newRoll,
        decision
      });
    }

    // 4. Exactly 1 Consolidated Audit Log Write for the entire batch
    const auditLogId = `LOG_PROMO_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    statements.push(
      env.DB.prepare(
        `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
         VALUES (?, ?, datetime('now'), 'STUDENT_PROMOTION', ?, ?, ?, 'SUCCESS')`
      ).bind(
        auditLogId,
        schoolId,
        session.role,
        session.userId || session.staffId || 'SYSTEM',
        JSON.stringify({
          sourceYear,
          targetYear,
          promotedCount: promotedDetails.length,
          promotions: promotedDetails
        })
      )
    );

    // Execute batch in chunks of 50 statements (1 D1 subrequest per chunk)
    for (let i = 0; i < statements.length; i += 50) {
      const chunk = statements.slice(i, i + 50);
      if (chunk.length > 0) {
        await env.DB.batch(chunk);
      }
    }

    return successResponse({
      processedCount: promotedDetails.length,
      promotedCount: promotedDetails.length,
      sourceAcademicYear: sourceYear,
      targetAcademicYear: targetYear,
      promotedStudents: promotedDetails,
      message: `Successfully processed ${promotedDetails.length} promotions from ${sourceYear} to ${targetYear}. Complete historical records preserved.`
    }, 'promote_students', 200, corsHeaders);
  }
};

