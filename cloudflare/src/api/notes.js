/**
 * VE MANAGEMENT — NOTES & STUDY MATERIALS API HANDLERS
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * CRITICAL INVARIANT: Notes strictly maintain Class -> Subject -> Unit -> Q&A hierarchy (Never student-centric).
 */

import { successResponse, errorResponse } from '../response.js';

export const NotesApi = {
  async getNotes(env, session, payload, corsHeaders) {
    const classParam = payload.class ? String(payload.class) : '9';
    const subjectParam = payload.subject ? String(payload.subject) : null;

    let query = `SELECT * FROM notes WHERE class = ?`;
    const params = [classParam];

    if (subjectParam) {
      query += ` AND subject = ?`;
      params.push(subjectParam);
    }
    query += ` ORDER BY created_at DESC`;

    const { results: notes } = await env.DB.prepare(query).bind(...params).all();

    // Fetch units and questions with dual camelCase & snake_case properties
    const enrichedNotes = await Promise.all((notes || []).map(async note => {
      const { results: units } = await env.DB.prepare(`SELECT * FROM note_units WHERE note_id = ? ORDER BY display_order ASC, unit_number ASC`).bind(note.note_id).all();
      const enrichedUnits = await Promise.all((units || []).map(async unit => {
        const { results: questions } = await env.DB.prepare(`SELECT * FROM note_questions WHERE unit_id = ? ORDER BY display_order ASC`).bind(unit.unit_id).all();
        const enrichedQuestions = (questions || []).map(q => ({
          ...q,
          questionId: q.question_id,
          question_id: q.question_id,
          questionText: q.question_text,
          question_text: q.question_text,
          answerText: q.answer_text,
          answer_text: q.answer_text,
          order: q.display_order,
          display_order: q.display_order
        }));
        return {
          ...unit,
          unitId: unit.unit_id,
          unit_id: unit.unit_id,
          unitTitle: unit.unit_title,
          unit_title: unit.unit_title,
          unitNumber: unit.unit_number,
          unit_number: unit.unit_number,
          attachmentUrl: unit.attachment_url || null,
          attachment_url: unit.attachment_url || null,
          attachmentName: unit.attachment_name || null,
          attachment_name: unit.attachment_name || null,
          attachmentSize: unit.attachment_size || null,
          attachment_size: unit.attachment_size || null,
          order: unit.display_order || unit.unit_number,
          display_order: unit.display_order,
          questions: enrichedQuestions
        };
      }));
      return {
        ...note,
        noteId: note.note_id,
        note_id: note.note_id,
        units: enrichedUnits
      };
    }));

    return successResponse({ notes: enrichedNotes }, 'get_notes', 200, corsHeaders);
  },

  async saveNotes(env, session, payload, corsHeaders) {
    if (session && session.role === 'STUDENT') {
      return errorResponse('UNAUTHORIZED', 'Students cannot create or edit study notes', 403, 'save_notes', corsHeaders);
    }
    if (session && session.role === 'PARENT') {
      return errorResponse('UNAUTHORIZED', 'Parents cannot create or edit study notes', 403, 'save_notes', corsHeaders);
    }

    const schoolId = env.SCHOOL_ID || 'GAMERI-HSS-001';
    const noteId = String(payload.noteId || payload.id || `NOT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
    const title = String(payload.title || 'Main Book').trim();
    const classNum = String(payload.class || '9').trim();
    const subject = String(payload.subject || 'IT/ITeS').trim();
    const teacherId = session?.userId || payload.teacherId || null;
    const teacherName = session?.userName || payload.teacherName || null;
    const units = Array.isArray(payload.units) ? payload.units : [];

    // 1. Upsert Note Master
    await env.DB.prepare(
      `INSERT INTO notes (note_id, school_id, title, class, subject, teacher_id, teacher_name, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(note_id) DO UPDATE SET
         title = excluded.title,
         class = excluded.class,
         subject = excluded.subject,
         teacher_id = COALESCE(excluded.teacher_id, notes.teacher_id),
         teacher_name = COALESCE(excluded.teacher_name, notes.teacher_name),
         updated_at = datetime('now')
       WHERE notes.title IS NOT excluded.title
          OR notes.class IS NOT excluded.class
          OR notes.subject IS NOT excluded.subject
          OR (excluded.teacher_id IS NOT NULL AND notes.teacher_id IS NOT excluded.teacher_id)
          OR (excluded.teacher_name IS NOT NULL AND notes.teacher_name IS NOT excluded.teacher_name)`
    ).bind(noteId, schoolId, title, classNum, subject, teacherId, teacherName).run();

    // 2. Track unit IDs to clean up deleted units
    const currentUnitIds = [];

    for (let uIdx = 0; uIdx < units.length; uIdx++) {
      const u = units[uIdx];
      const unitId = String(u.unitId || u.id || `UNT_${Date.now()}_${uIdx}_${Math.random().toString(36).substring(2, 6)}`);
      currentUnitIds.push(unitId);
      const unitNumber = parseInt(u.unitNumber || u.order, 10) || (uIdx + 1);
      const unitTitle = String(u.unitTitle || u.title || `Unit ${unitNumber}`).trim();
      const description = String(u.description || '').trim();

      const attachmentUrl = u.attachmentUrl || u.attachment_url || null;
      const attachmentName = u.attachmentName || u.attachment_name || null;
      const attachmentSize = (u.attachmentSize !== undefined && u.attachmentSize !== null) ? parseInt(u.attachmentSize, 10) :
                             (u.attachment_size !== undefined && u.attachment_size !== null) ? parseInt(u.attachment_size, 10) : null;

      await env.DB.prepare(
        `INSERT INTO note_units (unit_id, school_id, note_id, unit_number, unit_title, description, attachment_url, attachment_name, attachment_size, display_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(unit_id) DO UPDATE SET
           unit_number = excluded.unit_number,
           unit_title = excluded.unit_title,
           description = excluded.description,
           attachment_url = excluded.attachment_url,
           attachment_name = excluded.attachment_name,
           attachment_size = excluded.attachment_size,
           display_order = excluded.display_order,
           updated_at = datetime('now')
         WHERE note_units.unit_number IS NOT excluded.unit_number
            OR note_units.unit_title IS NOT excluded.unit_title
            OR note_units.description IS NOT excluded.description
            OR (excluded.attachment_url IS NOT NULL AND note_units.attachment_url IS NOT excluded.attachment_url)
            OR (excluded.attachment_name IS NOT NULL AND note_units.attachment_name IS NOT excluded.attachment_name)
            OR (excluded.attachment_size IS NOT NULL AND note_units.attachment_size IS NOT excluded.attachment_size)
            OR note_units.display_order IS NOT excluded.display_order`
      ).bind(unitId, schoolId, noteId, unitNumber, unitTitle, description, attachmentUrl, attachmentName, attachmentSize, unitNumber).run();

      // 3. Process Questions inside Unit
      const questions = Array.isArray(u.questions) ? u.questions : [];
      const currentQuestionIds = [];

      for (let qIdx = 0; qIdx < questions.length; qIdx++) {
        const q = questions[qIdx];
        const questionId = String(q.questionId || q.id || `QST_${Date.now()}_${qIdx}_${Math.random().toString(36).substring(2, 6)}`);
        currentQuestionIds.push(questionId);
        const questionText = String(q.questionText || q.question || '').trim();
        const answerText = String(q.answerText || q.answer || '').trim();
        const displayOrder = parseInt(q.order || q.display_order, 10) || (qIdx + 1);
        const qType = q.type || (title.includes('Practical') ? 'PRACTICAL_EXERCISE' : 'SHORT_ANSWER');

        await env.DB.prepare(
          `INSERT INTO note_questions (question_id, school_id, unit_id, question_text, answer_text, type, display_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(question_id) DO UPDATE SET
             question_text = excluded.question_text,
             answer_text = excluded.answer_text,
             type = excluded.type,
             display_order = excluded.display_order,
             updated_at = datetime('now')
           WHERE note_questions.question_text IS NOT excluded.question_text
              OR note_questions.answer_text IS NOT excluded.answer_text
              OR note_questions.type IS NOT excluded.type
              OR note_questions.display_order IS NOT excluded.display_order`
        ).bind(questionId, schoolId, unitId, questionText, answerText, qType, displayOrder).run();
      }

      // Delete questions in this unit that are no longer in payload
      if (currentQuestionIds.length > 0) {
        const qPlaceholders = currentQuestionIds.map(() => '?').join(',');
        await env.DB.prepare(
          `DELETE FROM note_questions WHERE unit_id = ? AND question_id NOT IN (${qPlaceholders})`
        ).bind(unitId, ...currentQuestionIds).run();
      } else {
        await env.DB.prepare(`DELETE FROM note_questions WHERE unit_id = ?`).bind(unitId).run();
      }
    }

    // Delete units in this note that are no longer in payload
    if (currentUnitIds.length > 0) {
      const uPlaceholders = currentUnitIds.map(() => '?').join(',');
      // First delete associated questions
      await env.DB.prepare(
        `DELETE FROM note_questions WHERE unit_id IN (
          SELECT unit_id FROM note_units WHERE note_id = ? AND unit_id NOT IN (${uPlaceholders})
        )`
      ).bind(noteId, ...currentUnitIds).run();
      // Then delete units
      await env.DB.prepare(
        `DELETE FROM note_units WHERE note_id = ? AND unit_id NOT IN (${uPlaceholders})`
      ).bind(noteId, ...currentUnitIds).run();
    } else {
      await env.DB.prepare(`DELETE FROM note_questions WHERE unit_id IN (SELECT unit_id FROM note_units WHERE note_id = ?)`).bind(noteId).run();
      await env.DB.prepare(`DELETE FROM note_units WHERE note_id = ?`).bind(noteId).run();
    }

    return successResponse({
      noteId,
      title,
      class: classNum,
      subject,
      unitsCount: units.length,
      updatedAt: new Date().toISOString()
    }, 'save_notes', 200, corsHeaders);
  },

  async deleteNote(env, session, payload, corsHeaders) {
    if (session && (session.role === 'STUDENT' || session.role === 'PARENT')) {
      return errorResponse('UNAUTHORIZED', 'Access denied to delete note', 403, 'delete_note', corsHeaders);
    }

    const noteId = String(payload.noteId || payload.id || '');
    if (!noteId) {
      return errorResponse('INVALID_PAYLOAD', 'noteId required', 400, 'delete_note', corsHeaders);
    }

    await env.DB.prepare(`DELETE FROM note_questions WHERE unit_id IN (SELECT unit_id FROM note_units WHERE note_id = ?)`).bind(noteId).run();
    await env.DB.prepare(`DELETE FROM note_units WHERE note_id = ?`).bind(noteId).run();
    await env.DB.prepare(`DELETE FROM notes WHERE note_id = ?`).bind(noteId).run();

    return successResponse({ noteId, deleted: true }, 'delete_note', 200, corsHeaders);
  },

  async saveUnit(env, session, payload, corsHeaders) {
    if (session && (session.role === 'STUDENT' || session.role === 'PARENT')) {
      return errorResponse('UNAUTHORIZED', 'Access denied to edit study materials', 403, 'save_unit', corsHeaders);
    }
    const schoolId = env.SCHOOL_ID || 'GAMERI-HSS-001';
    let noteId = payload.noteId;

    if (!noteId) {
      const cls = String(payload.class || '9').trim();
      const subj = String(payload.subject || 'IT/ITeS').trim();
      const title = String(payload.title || 'Main Book').trim();
      const existingNote = await env.DB.prepare(`SELECT note_id FROM notes WHERE class = ? AND subject = ? AND title = ?`).bind(cls, subj, title).first();
      if (!existingNote) {
        noteId = `NOT_${cls}_${subj.replace(/\//g, '_')}_${title.replace(/\s+/g, '_')}`;
        await env.DB.prepare(
          `INSERT INTO notes (note_id, school_id, title, class, subject, teacher_id, teacher_name, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(noteId, schoolId, title, cls, subj, session?.userId || null, session?.name || null).run();
      } else {
        noteId = existingNote.note_id;
      }
    }

    const unitId = String(payload.unitId || payload.id || `UNT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
    const unitNumber = parseInt(payload.unitNumber || payload.order, 10) || 1;
    const unitTitle = String(payload.unitTitle || payload.title || `Unit ${unitNumber}`).trim();
    const description = String(payload.description || '').trim();

    const attachmentUrl = payload.attachmentUrl || payload.attachment_url || null;
    const attachmentName = payload.attachmentName || payload.attachment_name || null;
    const attachmentSize = (payload.attachmentSize !== undefined && payload.attachmentSize !== null) ? parseInt(payload.attachmentSize, 10) :
                           (payload.attachment_size !== undefined && payload.attachment_size !== null) ? parseInt(payload.attachment_size, 10) : null;

    await env.DB.prepare(
      `INSERT INTO note_units (unit_id, school_id, note_id, unit_number, unit_title, description, attachment_url, attachment_name, attachment_size, display_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(unit_id) DO UPDATE SET
         unit_number = excluded.unit_number,
         unit_title = excluded.unit_title,
         description = excluded.description,
         attachment_url = excluded.attachment_url,
         attachment_name = excluded.attachment_name,
         attachment_size = excluded.attachment_size,
         display_order = excluded.display_order,
         updated_at = datetime('now')
       WHERE note_units.unit_number IS NOT excluded.unit_number
          OR note_units.unit_title IS NOT excluded.unit_title
          OR note_units.description IS NOT excluded.description
          OR (excluded.attachment_url IS NOT NULL AND note_units.attachment_url IS NOT excluded.attachment_url)
          OR (excluded.attachment_name IS NOT NULL AND note_units.attachment_name IS NOT excluded.attachment_name)
          OR (excluded.attachment_size IS NOT NULL AND note_units.attachment_size IS NOT excluded.attachment_size)
          OR note_units.display_order IS NOT excluded.display_order`
    ).bind(unitId, schoolId, noteId, unitNumber, unitTitle, description, attachmentUrl, attachmentName, attachmentSize, unitNumber).run();

    return successResponse({
      unitId,
      unit_id: unitId,
      noteId,
      note_id: noteId,
      unitTitle,
      unit_title: unitTitle,
      unitNumber,
      unit_number: unitNumber,
      description,
      attachmentUrl,
      attachment_url: attachmentUrl,
      attachmentName,
      attachment_name: attachmentName,
      attachmentSize,
      attachment_size: attachmentSize
    }, 'save_unit', 200, corsHeaders);
  },

  async deleteUnit(env, session, payload, corsHeaders) {
    if (session && (session.role === 'STUDENT' || session.role === 'PARENT')) {
      return errorResponse('UNAUTHORIZED', 'Access denied to delete unit', 403, 'delete_unit', corsHeaders);
    }
    const unitId = String(payload.unitId || payload.id || '');
    if (!unitId) {
      return errorResponse('INVALID_PAYLOAD', 'unitId is required', 400, 'delete_unit', corsHeaders);
    }

    await env.DB.prepare(`DELETE FROM note_questions WHERE unit_id = ?`).bind(unitId).run();
    await env.DB.prepare(`DELETE FROM note_units WHERE unit_id = ?`).bind(unitId).run();

    return successResponse({ unitId, deleted: true }, 'delete_unit', 200, corsHeaders);
  },

  async saveQuestion(env, session, payload, corsHeaders) {
    if (session && (session.role === 'STUDENT' || session.role === 'PARENT')) {
      return errorResponse('UNAUTHORIZED', 'Access denied to edit study materials', 403, 'save_question', corsHeaders);
    }
    const unitId = String(payload.unitId || '');
    if (!unitId) {
      return errorResponse('INVALID_PAYLOAD', 'unitId is required to attach question', 400, 'save_question', corsHeaders);
    }
    const schoolId = env.SCHOOL_ID || 'GAMERI-HSS-001';
    const questionId = String(payload.questionId || payload.id || `QST_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
    const questionText = String(payload.questionText || payload.question || '').trim();
    const answerText = String(payload.answerText || payload.answer || '').trim();
    const displayOrder = parseInt(payload.order || payload.displayOrder || payload.display_order, 10) || 1;
    const type = payload.type || 'SHORT_ANSWER';

    if (!questionText || !answerText) {
      return errorResponse('INVALID_PAYLOAD', 'questionText and answerText are required', 400, 'save_question', corsHeaders);
    }

    await env.DB.prepare(
      `INSERT INTO note_questions (question_id, school_id, unit_id, question_text, answer_text, type, display_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(question_id) DO UPDATE SET
         question_text = excluded.question_text,
         answer_text = excluded.answer_text,
         type = excluded.type,
         display_order = excluded.display_order,
         updated_at = datetime('now')
       WHERE note_questions.question_text IS NOT excluded.question_text
          OR note_questions.answer_text IS NOT excluded.answer_text
          OR note_questions.type IS NOT excluded.type
          OR note_questions.display_order IS NOT excluded.display_order`
    ).bind(questionId, schoolId, unitId, questionText, answerText, type, displayOrder).run();

    return successResponse({
      questionId,
      question_id: questionId,
      unitId,
      unit_id: unitId,
      questionText,
      question_text: questionText,
      answerText,
      answer_text: answerText,
      type
    }, 'save_question', 200, corsHeaders);
  },

  async deleteQuestion(env, session, payload, corsHeaders) {
    if (session && (session.role === 'STUDENT' || session.role === 'PARENT')) {
      return errorResponse('UNAUTHORIZED', 'Access denied to delete question', 403, 'delete_question', corsHeaders);
    }
    const questionId = String(payload.questionId || payload.id || '');
    if (!questionId) {
      return errorResponse('INVALID_PAYLOAD', 'questionId is required', 400, 'delete_question', corsHeaders);
    }

    await env.DB.prepare(`DELETE FROM note_questions WHERE question_id = ?`).bind(questionId).run();

    return successResponse({ questionId, deleted: true }, 'delete_question', 200, corsHeaders);
  }
};
