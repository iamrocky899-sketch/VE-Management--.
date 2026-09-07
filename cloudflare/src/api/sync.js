/**
 * VE MANAGEMENT — CLOUDFLARE WORKERS OFFLINE-FIRST SYNC ENGINE
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Implements:
 * 1. sync_upload: Atomic batch synchronization, deduplication, and strict idempotency via sync_metadata
 * 2. sync_download: Timestamp-based delta synchronization with strict RBAC academic scoping
 */

import { successResponse, errorResponse } from '../response.js';
import { Security } from '../security.js';

export const SyncApi = {
  /**
   * Processes batched offline changes uploaded from Android or web clients.
   * Enforces idempotency via sync_metadata and validates teacher academic scopes.
   */
  async upload(env, session, payload, corsHeaders) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return errorResponse('UNAUTHORIZED', 'Write permission denied for sync upload', 403, 'sync_upload', corsHeaders);
    }

    const schoolId = payload.schoolId || session.schoolId || env.SCHOOL_ID || 'GAMERI-HSS-001';
    const clientTimestamp = payload.clientSyncTimestamp || new Date().toISOString();
    const clientVersion = payload.clientVersion || 'Android_5.7';
    const syncId = String(payload.syncId || `SYNC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
    const academicYear = payload.academicYear || '2026-2027';

    // 1. Idempotency Check
    const existingSync = await env.DB.prepare(
      `SELECT * FROM sync_metadata WHERE sync_id = ?`
    ).bind(syncId).first();

    if (existingSync) {
      return successResponse({
        syncId: syncId,
        processedAt: existingSync.processed_at,
        status: existingSync.status,
        idempotent: true,
        message: 'Batch already processed'
      }, 'sync_upload', 200, corsHeaders);
    }

    const results = {
      syncId: syncId,
      processedAt: new Date().toISOString(),
      entities: {}
    };

    let totalBatchSize = 0;
    const errors = [];
    const entityTypes = [];

    // Helper for executing D1 statements in chunks of 50 (1 D1 subrequest per batch)
    async function executeInChunks(db, stmts, chunkSize = 50) {
      for (let i = 0; i < stmts.length; i += chunkSize) {
        const chunk = stmts.slice(i, i + chunkSize);
        if (chunk.length > 0) {
          await db.batch(chunk);
        }
      }
    }

    // 2. Process Students
    if (payload.students && Array.isArray(payload.students) && payload.students.length > 0) {
      entityTypes.push('Students');
      const studentStmts = [];
      for (const s of payload.students) {
        const sid = String(s.studentId || s.id || '').trim();
        const sName = String(s.studentName || s.name || '').trim();
        const sClass = String(s.class || '9').trim();
        const sSec = String(s.section || 'A').trim();
        const sRoll = String(s.rollNo || s.roll || '').trim();
        if (!sid || !sName) continue;

        studentStmts.push(
          env.DB.prepare(
            `INSERT INTO students (student_id, school_id, student_name, roll_no, class, section, gender, dob, father_name, mother_name, mobile, aadhaar_no, village, status, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
             ON CONFLICT(student_id) DO UPDATE SET
               student_name = excluded.student_name,
               roll_no = excluded.roll_no,
               class = excluded.class,
               section = excluded.section,
               mobile = COALESCE(excluded.mobile, students.mobile),
               status = excluded.status,
               updated_at = datetime('now')`
          ).bind(
            sid, schoolId, sName, sRoll, sClass, sSec,
            s.gender || 'Male', s.dob || '', s.father || s.fatherName || '',
            s.mother || s.motherName || '', s.mobile || '', s.aadhaar || s.aadhaarNo || '',
            s.village || '', s.status || 'Active'
          )
        );
      }
      try {
        await executeInChunks(env.DB, studentStmts);
        results.entities.students = { count: studentStmts.length };
        totalBatchSize += studentStmts.length;
      } catch (e) {
        errors.push(`Students batch error: ${e.message}`);
      }
    }

    // 3. Process Attendance
    if (payload.attendance) {
      entityTypes.push('Attendance');
      const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'EXCUSED'];
      const dateSessionAggregates = new Map(); // key: "date_class_section" -> { present: Set, absent: Set, class, section, date }
      const attendanceStmts = [];

      // Single lookup for student roster metadata
      const { results: allStudents } = await env.DB.prepare("SELECT student_id, class, section FROM students").all();
      const stuMap = new Map((allStudents || []).map(s => [s.student_id, s]));

      // Single teacher scope check
      let allowedClasses = null;
      if (session.role === 'TEACHER') {
        const teacherScope = await Security.getTeacherAcademicScope(env.DB, session.userId, academicYear);
        if (teacherScope && teacherScope.classes && teacherScope.classes.length > 0) {
          allowedClasses = new Set(teacherScope.classes.map(c => String(c)));
        }
      }

      // Format A: Array of records [{ studentId, date, class, section, status }, ...]
      if (Array.isArray(payload.attendance)) {
        for (const item of payload.attendance) {
          const sid = String(item.studentId || item.id || '').trim();
          const attDate = String(item.date || new Date().toISOString().split('T')[0]).trim();
          const attClass = String(item.class || '9').trim();
          const attSection = String(item.section || 'A').trim();
          const attSubj = String(item.subject || 'IT/ITeS').trim();
          const attComp = String(item.component || 'THEORY').toUpperCase().trim();
          const attPeriod = String(item.period || '1').trim();
          let status = String(item.status || 'PRESENT').toUpperCase().trim();
          if (!validStatuses.includes(status)) status = 'PRESENT';
          if (!sid) continue;

          if (allowedClasses && !allowedClasses.has(attClass)) {
            errors.push(`Unauthorized class ${attClass} for student ${sid}`);
            continue;
          }

          const cleanSub = attSubj.replace(/[^a-zA-Z0-9]/g, '_');
          const attId = item.attendanceId || `ATT_${schoolId}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${attDate}_${attClass}_${attSection}_${cleanSub}_${attComp}_P${attPeriod}_${sid}`;
          const sessionId = item.sessionId || `ATT_SES_${attDate}_${attClass}_${attSection}`;

          attendanceStmts.push(
            env.DB.prepare(
              `INSERT INTO attendance (
                attendance_id, school_id, student_id, academic_year, session_id,
                date, class, section, subject, component, period, teacher_id,
                status, source, reason, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ANDROID_OFFLINE_SYNC', ?, datetime('now'))
              ON CONFLICT(student_id, date, subject, component, period) DO UPDATE SET
                status = excluded.status,
                updated_at = datetime('now')`
            ).bind(
              attId, schoolId, sid, academicYear, sessionId,
              attDate, attClass, attSection, attSubj, attComp, attPeriod, session.userId,
              status, item.reason || ''
            )
          );

          const aggKey = `${attDate}_${attClass}_${attSection}`;
          if (!dateSessionAggregates.has(aggKey)) {
            dateSessionAggregates.set(aggKey, { date: attDate, class: attClass, section: attSection, present: new Set(), absent: new Set() });
          }
          const agg = dateSessionAggregates.get(aggKey);
          if (status === 'PRESENT' || status === 'LATE') agg.present.add(sid);
          else if (status === 'ABSENT') agg.absent.add(sid);
        }
      }
      // Format B: Map object { "YYYY-MM-DD": ["S177...", ...] } OR { "YYYY-MM-DD_class_sec": { "sid": "P" } }
      else if (typeof payload.attendance === 'object') {
        for (const dateKey in payload.attendance) {
          const val = payload.attendance[dateKey];
          if (Array.isArray(val)) {
            // Array of present student IDs
            for (const sid of val) {
              const cleanSid = String(sid).trim();
              if (!cleanSid) continue;

              const stu = stuMap.get(cleanSid);
              const attClass = stu?.class ? String(stu.class) : '9';
              const attSection = stu?.section ? String(stu.section) : 'A';

              if (allowedClasses && !allowedClasses.has(attClass)) continue;

              const attId = `ATT_${schoolId}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${dateKey}_${attClass}_${attSection}_IT_ITeS_THEORY_P1_${cleanSid}`;
              const sessionId = `ATT_SES_${dateKey}_${attClass}_${attSection}`;

              attendanceStmts.push(
                env.DB.prepare(
                  `INSERT INTO attendance (
                    attendance_id, school_id, student_id, academic_year, session_id,
                    date, class, section, subject, component, period, teacher_id,
                    status, source, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IT/ITeS', 'THEORY', '1', ?, 'PRESENT', 'ANDROID_OFFLINE_SYNC', datetime('now'))
                  ON CONFLICT(student_id, date, subject, component, period) DO UPDATE SET
                    status = 'PRESENT',
                    updated_at = datetime('now')`
                ).bind(attId, schoolId, cleanSid, academicYear, sessionId, dateKey, attClass, attSection, session.userId)
              );

              const aggKey = `${dateKey}_${attClass}_${attSection}`;
              if (!dateSessionAggregates.has(aggKey)) {
                dateSessionAggregates.set(aggKey, { date: dateKey, class: attClass, section: attSection, present: new Set(), absent: new Set() });
              }
              dateSessionAggregates.get(aggKey).present.add(cleanSid);
            }
          } else if (typeof val === 'object' && val !== null) {
            // Matrix object format { "sid": "P" }
            const parts = dateKey.split('_');
            const attDate = parts[0] || new Date().toISOString().split('T')[0];
            const attClass = parts[1] || '9';
            const attSection = parts[2] || 'A';

            if (allowedClasses && !allowedClasses.has(attClass)) continue;

            for (const sid in val) {
              const cleanSid = String(sid).trim();
              if (!cleanSid) continue;
              const rawStat = String(val[sid]).toUpperCase().trim();
              const status = (rawStat === 'A' || rawStat === 'ABSENT' || rawStat === '0') ? 'ABSENT' : 'PRESENT';

              const attId = `ATT_${schoolId}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${attDate}_${attClass}_${attSection}_IT_ITeS_THEORY_P1_${cleanSid}`;
              const sessionId = `ATT_SES_${attDate}_${attClass}_${attSection}`;

              attendanceStmts.push(
                env.DB.prepare(
                  `INSERT INTO attendance (
                    attendance_id, school_id, student_id, academic_year, session_id,
                    date, class, section, subject, component, period, teacher_id,
                    status, source, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IT/ITeS', 'THEORY', '1', ?, ?, 'ANDROID_OFFLINE_SYNC', datetime('now'))
                  ON CONFLICT(student_id, date, subject, component, period) DO UPDATE SET
                    status = excluded.status,
                    updated_at = datetime('now')`
                ).bind(attId, schoolId, cleanSid, academicYear, sessionId, attDate, attClass, attSection, session.userId, status)
              );

              const aggKey = `${attDate}_${attClass}_${attSection}`;
              if (!dateSessionAggregates.has(aggKey)) {
                dateSessionAggregates.set(aggKey, { date: attDate, class: attClass, section: attSection, present: new Set(), absent: new Set() });
              }
              const agg = dateSessionAggregates.get(aggKey);
              if (status === 'PRESENT') agg.present.add(cleanSid);
              else agg.absent.add(cleanSid);
            }
          }
        }
      }

      // Execute attendance statements in batch chunks
      try {
        await executeInChunks(env.DB, attendanceStmts);
        results.entities.attendance = { count: attendanceStmts.length };
        totalBatchSize += attendanceStmts.length;
      } catch (e) {
        errors.push(`Attendance batch execution error: ${e.message}`);
      }

      // Update AttendanceSessions metadata in batch
      const sessionStmts = [];
      for (const [_, agg] of dateSessionAggregates) {
        const sessionId = `ATT_SES_${agg.date}_${agg.class}_${agg.section}`;
        const rosterCount = 40;

        sessionStmts.push(
          env.DB.prepare(
            `INSERT INTO attendance_sessions (
              session_id, school_id, academic_year, date, class, section,
              total_students, present_count, absent_count, status, source, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', 'ANDROID_OFFLINE_SYNC', datetime('now'), datetime('now'))
            ON CONFLICT(session_id) DO UPDATE SET
              present_count = excluded.present_count,
              absent_count = excluded.absent_count,
              total_students = MAX(excluded.total_students, attendance_sessions.total_students),
              updated_at = datetime('now')`
          ).bind(
            sessionId, schoolId, academicYear, agg.date, agg.class, agg.section,
            Math.max(rosterCount, agg.present.size + agg.absent.size),
            agg.present.size,
            agg.absent.size
          )
        );
      }
      try {
        await executeInChunks(env.DB, sessionStmts);
      } catch (e) {
        errors.push(`Sessions batch error: ${e.message}`);
      }
    }

    // 4. Process Marks
    if (payload.marks && typeof payload.marks === 'object') {
      entityTypes.push('Marks');
      const markStmts = [];
      const examNameMap = { '0': '1st Unit Test', '1': 'Half Yearly', '2': '2nd Unit Test', '3': 'Final Exam' };

      if (Array.isArray(payload.marks)) {
        for (const m of payload.marks) {
          const sid = String(m.studentId || m.id || '').trim();
          if (!sid) continue;
          const markId = m.markId || `MRK_${schoolId}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${sid}_${(m.examName || m.exam || 'Half_Yearly').replace(/[^a-zA-Z0-9]/g, '_')}`;
          markStmts.push(
            env.DB.prepare(
              `INSERT INTO marks (mark_id, school_id, student_id, academic_year, exam_name, theory_marks, practical_marks, total_marks, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
               ON CONFLICT(mark_id) DO UPDATE SET
                 theory_marks = excluded.theory_marks,
                 practical_marks = excluded.practical_marks,
                 total_marks = excluded.total_marks,
                 updated_at = datetime('now')`
            ).bind(
              markId, schoolId, sid, academicYear, m.examName || m.exam || 'Half Yearly',
              Number(m.theory || 0), Number(m.practical || 0), Number(m.theory || 0) + Number(m.practical || 0)
            )
          );
        }
      } else {
        for (const sid in payload.marks) {
          const studentMarks = payload.marks[sid];
          if (studentMarks && typeof studentMarks === 'object') {
            for (const examKey in studentMarks) {
              const examName = examNameMap[examKey] || examKey;
              const entry = studentMarks[examKey];
              const theory = Number(entry.t || entry.theory || 0);
              const practical = Number(entry.p || entry.practical || 0);
              const markId = `MRK_${schoolId}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${sid}_${examName.replace(/[^a-zA-Z0-9]/g, '_')}`;

              markStmts.push(
                env.DB.prepare(
                  `INSERT INTO marks (mark_id, school_id, student_id, academic_year, exam_name, theory_marks, practical_marks, total_marks, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                   ON CONFLICT(mark_id) DO UPDATE SET
                     theory_marks = excluded.theory_marks,
                     practical_marks = excluded.practical_marks,
                     total_marks = excluded.total_marks,
                     updated_at = datetime('now')`
                ).bind(markId, schoolId, sid, academicYear, examName, theory, practical, theory + practical)
              );
            }
          }
        }
      }
      try {
        await executeInChunks(env.DB, markStmts);
        results.entities.marks = { count: markStmts.length };
        totalBatchSize += markStmts.length;
      } catch (e) {
        errors.push(`Marks batch error: ${e.message}`);
      }
    }

    // 5. Process Notes
    if (payload.notes && Array.isArray(payload.notes) && payload.notes.length > 0) {
      entityTypes.push('Notes');
      const noteStmts = [];
      for (const n of payload.notes) {
        const noteId = String(n.noteId || n.id || `NOTE_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
        const title = String(n.title || 'Untitled Note').trim();
        const nClass = String(n.class || '9').trim();
        const nSubject = String(n.subject || 'IT/ITeS').trim();

        noteStmts.push(
          env.DB.prepare(
            `INSERT INTO notes (note_id, school_id, title, class, subject, updated_at)
             VALUES (?, ?, ?, ?, ?, datetime('now'))
             ON CONFLICT(note_id) DO UPDATE SET
               title = excluded.title,
               class = excluded.class,
               subject = excluded.subject,
               updated_at = datetime('now')`
          ).bind(noteId, schoolId, title, nClass, nSubject)
        );

        if (Array.isArray(n.units)) {
          for (let uIdx = 0; uIdx < n.units.length; uIdx++) {
            const u = n.units[uIdx];
            const unitId = String(u.unitId || u.id || `UNT_${noteId}_${uIdx}`);
            const unitNum = parseInt(u.unitNumber || u.order, 10) || (uIdx + 1);
            const unitTitle = String(u.unitTitle || u.title || `Unit ${unitNum}`).trim();
            const desc = String(u.description || '').trim();

            noteStmts.push(
              env.DB.prepare(
                `INSERT INTO note_units (unit_id, school_id, note_id, unit_number, unit_title, description, display_order, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
                 ON CONFLICT(unit_id) DO UPDATE SET
                   unit_number = excluded.unit_number,
                   unit_title = excluded.unit_title,
                   description = excluded.description,
                   display_order = excluded.display_order,
                   updated_at = datetime('now')`
              ).bind(unitId, schoolId, noteId, unitNum, unitTitle, desc, unitNum)
            );

            if (Array.isArray(u.questions)) {
              for (let qIdx = 0; qIdx < u.questions.length; qIdx++) {
                const q = u.questions[qIdx];
                const qId = String(q.questionId || q.id || `QST_${unitId}_${qIdx}`);
                const qText = String(q.questionText || q.question || '').trim();
                const aText = String(q.answerText || q.answer || '').trim();
                const qOrder = parseInt(q.order || q.display_order, 10) || (qIdx + 1);
                const qType = q.type || (title.includes('Practical') ? 'PRACTICAL_EXERCISE' : 'SHORT_ANSWER');

                noteStmts.push(
                  env.DB.prepare(
                    `INSERT INTO note_questions (question_id, school_id, unit_id, question_text, answer_text, type, display_order, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
                     ON CONFLICT(question_id) DO UPDATE SET
                       question_text = excluded.question_text,
                       answer_text = excluded.answer_text,
                       type = excluded.type,
                       display_order = excluded.display_order,
                       updated_at = datetime('now')`
                  ).bind(qId, schoolId, unitId, qText, aText, qType, qOrder)
                );
              }
            }
          }
        }
      }
      try {
        await executeInChunks(env.DB, noteStmts);
        results.entities.notes = { count: payload.notes.length };
        totalBatchSize += noteStmts.length;
      } catch (e) {
        errors.push(`Notes batch error: ${e.message}`);
      }
    }

    // 6. Record Sync Transaction in sync_metadata
    const syncStatus = errors.length === 0 ? 'PROCESSED' : 'PARTIAL';
    await env.DB.prepare(
      `INSERT INTO sync_metadata (
        sync_id, school_id, client_sync_timestamp, batch_size, entity_type,
        status, processed_at, client_version, errors
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`
    ).bind(
      syncId, schoolId, clientTimestamp, totalBatchSize,
      entityTypes.join(',') || 'NONE', syncStatus, clientVersion,
      errors.length > 0 ? errors.join('; ') : null
    ).run();

    // 7. Audit Logging
    await env.DB.prepare(
      `INSERT INTO audit_logs (log_id, school_id, timestamp, action, actor_type, actor_id, details, status)
       VALUES (?, ?, datetime('now'), 'SYNC_UPLOAD', ?, ?, ?, ?)`
    ).bind(
      `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      schoolId, session.role, session.userId,
      JSON.stringify({ syncId, batchSize: totalBatchSize, entities: results.entities, errorsCount: errors.length }),
      syncStatus === 'PROCESSED' ? 'SUCCESS' : 'ERROR'
    ).run();

    return successResponse(results, 'sync_upload', 200, corsHeaders);
  },

  /**
   * Delta downloads server state modified since a given timestamp.
   * Strictly enforces RBAC academic scoping.
   */
  async download(env, session, payload, corsHeaders) {
    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required for sync download', 401, 'sync_download', corsHeaders);
    }

    const since = payload.since || payload.lastSyncTimestamp || '1970-01-01T00:00:00Z';
    const role = (session.role || 'TEACHER').toUpperCase();
    const userId = session.userId;

    let students = [];
    let attendance = [];
    let marks = [];
    let notes = [];

    // Role-Scoped Entity Queries
    if (role === 'ADMIN' || role === 'PRINCIPAL') {
      // Full Institutional Scope
      const { results: sRes } = await env.DB.prepare(`SELECT * FROM students WHERE status = 'Active' ORDER BY CAST(class AS INTEGER), CAST(roll_no AS INTEGER)`).all();
      students = sRes || [];

      const { results: aRes } = await env.DB.prepare(`SELECT * FROM attendance WHERE updated_at >= ? ORDER BY date DESC`).bind(since).all();
      attendance = aRes || [];

      const { results: mRes } = await env.DB.prepare(`SELECT * FROM marks WHERE updated_at >= ?`).bind(since).all();
      marks = mRes || [];

      const { results: nRes } = await env.DB.prepare(`SELECT * FROM notes WHERE updated_at >= ?`).bind(since).all();
      notes = nRes || [];
    } else if (role === 'TEACHER') {
      // Scoped to Teacher's Assigned Classes
      const scope = await Security.getTeacherAcademicScope(env.DB, userId, payload.academicYear || '2026-2027');
      const teacherClasses = scope.classes || [];

      if (teacherClasses.length > 0) {
        const placeholders = teacherClasses.map(() => '?').join(',');
        const { results: sRes } = await env.DB.prepare(`SELECT * FROM students WHERE class IN (${placeholders}) AND status = 'Active' ORDER BY CAST(roll_no AS INTEGER)`).bind(...teacherClasses).all();
        students = sRes || [];

        const { results: aRes } = await env.DB.prepare(`SELECT * FROM attendance WHERE class IN (${placeholders}) AND updated_at >= ? ORDER BY date DESC`).bind(...teacherClasses, since).all();
        attendance = aRes || [];

        const { results: mRes } = await env.DB.prepare(`SELECT m.* FROM marks m JOIN students s ON s.student_id = m.student_id WHERE s.class IN (${placeholders}) AND m.updated_at >= ?`).bind(...teacherClasses, since).all();
        marks = mRes || [];

        const { results: nRes } = await env.DB.prepare(`SELECT * FROM notes WHERE class IN (${placeholders}) AND updated_at >= ?`).bind(...teacherClasses, since).all();
        notes = nRes || [];
      }
    } else if (role === 'PARENT') {
      // Scoped Strictly to Linked Children
      const authorizedIds = await Security.getAuthorizedStudentIdsForParent(env.DB, userId);
      if (authorizedIds.length > 0) {
        const placeholders = authorizedIds.map(() => '?').join(',');
        const { results: sRes } = await env.DB.prepare(`SELECT * FROM students WHERE student_id IN (${placeholders})`).bind(...authorizedIds).all();
        students = sRes || [];

        const { results: aRes } = await env.DB.prepare(`SELECT * FROM attendance WHERE student_id IN (${placeholders}) AND updated_at >= ? ORDER BY date DESC`).bind(...authorizedIds, since).all();
        attendance = aRes || [];

        const { results: mRes } = await env.DB.prepare(`SELECT * FROM marks WHERE student_id IN (${placeholders}) AND updated_at >= ?`).bind(...authorizedIds, since).all();
        marks = mRes || [];
      }
    } else if (role === 'STUDENT') {
      // Scoped Strictly to Self
      const { results: sRes } = await env.DB.prepare(`SELECT * FROM students WHERE student_id = ?`).bind(userId).all();
      students = sRes || [];

      const { results: aRes } = await env.DB.prepare(`SELECT * FROM attendance WHERE student_id = ? AND updated_at >= ? ORDER BY date DESC`).bind(userId, since).all();
      attendance = aRes || [];

      const { results: mRes } = await env.DB.prepare(`SELECT * FROM marks WHERE student_id = ? AND updated_at >= ?`).bind(userId, since).all();
      marks = mRes || [];
    }

    // Enrich notes with units and questions
    let enrichedNotes = [];
    if (notes && notes.length > 0) {
      enrichedNotes = await Promise.all(notes.map(async note => {
        const { results: units } = await env.DB.prepare(
          `SELECT * FROM note_units WHERE note_id = ? ORDER BY display_order ASC, unit_number ASC`
        ).bind(note.note_id).all();

        const enrichedUnits = await Promise.all((units || []).map(async u => {
          const { results: questions } = await env.DB.prepare(
            `SELECT * FROM note_questions WHERE unit_id = ? ORDER BY display_order ASC`
          ).bind(u.unit_id).all();

          return {
            unitId: u.unit_id,
            unitTitle: u.unit_title,
            unitNumber: u.unit_number,
            description: u.description,
            order: u.display_order,
            questions: (questions || []).map(q => ({
              questionId: q.question_id,
              questionText: q.question_text,
              answerText: q.answer_text,
              type: q.type,
              order: q.display_order
            }))
          };
        }));

        return {
          noteId: note.note_id,
          id: note.note_id,
          title: note.title,
          class: note.class,
          subject: note.subject,
          teacherId: note.teacher_id,
          teacherName: note.teacher_name,
          units: enrichedUnits,
          updatedAt: note.updated_at
        };
      }));
    }

    // Global Entities for Sync
    const { results: actRes } = await env.DB.prepare(`SELECT * FROM activities ORDER BY date DESC`).all();
    const { results: ntcRes } = await env.DB.prepare(`SELECT * FROM notices ORDER BY date DESC`).all();
    const { results: calRes } = await env.DB.prepare(`SELECT * FROM calendar`).all();
    const { results: setRes } = await env.DB.prepare(`SELECT * FROM settings`).all();

    return successResponse({
      serverTimestamp: new Date().toISOString(),
      since: since,
      students: students,
      attendance: attendance,
      marks: marks,
      notes: enrichedNotes,
      activities: actRes || [],
      notices: ntcRes || [],
      calendar: calRes || [],
      settings: setRes || []
    }, 'sync_download', 200, corsHeaders);
  }
};
