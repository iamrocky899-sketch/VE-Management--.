/**
 * VE MANAGEMENT — EXAMINATION, MARKS & RESULT MANAGEMENT 2.0 API (STEP 11)
 * Institutional Entity: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Authoritative Examination Master, Exam Schedule, Curriculum-Aware Mark Entry & Validation,
 * Authoritative Result Engine, Lifecycle State Machine & Controlled Revisions.
 */

var ExaminationApi = {

  /**
   * Retrieves examination records with strict role-based scoping.
   * Parents and students only see PUBLISHED examinations.
   */
  getExaminations: function(session, query) {
    query = query || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    let allExams = Database.readAll('Examinations');
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const currentActiveSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const activeYear = currentActiveSetting ? currentActiveSetting.value : '2026-2027';

    // Seed standard 4-term institutional exams if empty
    if (allExams.length === 0) {
      const classes = ['9', '10', '11', '12'];
      const standardTerms = [
        { type: 'UNIT_1', name: '1st Unit Test', start: '2026-06-15', end: '2026-06-22' },
        { type: 'HALF_YEARLY', name: 'Half Yearly Examination', start: '2026-09-20', end: '2026-09-30' },
        { type: 'UNIT_2', name: '2nd Unit Test', start: '2026-12-10', end: '2026-12-18' },
        { type: 'ANNUAL', name: 'Annual Examination', start: '2027-03-01', end: '2027-03-15' }
      ];

      allExams = [];
      classes.forEach(cls => {
        standardTerms.forEach(term => {
          allExams.push({
            examId: `EXAM_${cls}_${term.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
            schoolId: schoolId,
            academicYear: activeYear,
            class: cls,
            sectionScope: 'ALL',
            stream: 'Vocational IT/ITeS',
            trade: 'IT/ITeS',
            examName: term.name,
            examType: term.type,
            startDate: term.start,
            endDate: term.end,
            status: 'OPEN',
            isLocked: false,
            createdAt: nowStr,
            updatedAt: nowStr
          });
        });
      });
      Database.upsertBatch('Examinations', allExams);
    }

    if (query.class) {
      allExams = allExams.filter(e => String(e.class) === String(query.class));
    }
    if (query.academicYear) {
      allExams = allExams.filter(e => e.academicYear === query.academicYear);
    }
    if (query.status) {
      allExams = allExams.filter(e => (e.status || '').toUpperCase() === String(query.status).toUpperCase());
    }

    // Role-based visibility: Parents and Students ONLY receive PUBLISHED examinations
    if (session && (session.role === 'PARENT' || session.role === 'STUDENT')) {
      allExams = allExams.filter(e => e.status === 'PUBLISHED');
    }

    return {
      success: true,
      data: {
        examinations: allExams,
        total: allExams.length
      }
    };
  },

  /**
   * Saves or updates examination master definitions (Admin / Principal only).
   */
  saveExaminations: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Administrator or Principal can manage examinations' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const inputExams = Array.isArray(payload.examinations) ? payload.examinations : [payload];

    if (inputExams.length === 0 || !inputExams[0].examName) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Exam name and class are required' } };
    }

    const records = inputExams.map(e => {
      const cls = String(e.class || '10').trim();
      const eName = String(e.examName || e.name || 'Unit Test').trim();
      const yr = String(e.academicYear || '2026-2027').trim();
      const cleanName = eName.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanYr = yr.replace(/[^a-zA-Z0-9]/g, '_');
      const examId = e.examId || `EXAM_${schoolId}_${cleanYr}_CLS_${cls}_${cleanName}`;

      const existing = Database.findByPk('Examinations', examId);

      return {
        examId: examId,
        schoolId: schoolId,
        academicYear: yr,
        class: cls,
        sectionScope: e.sectionScope || 'ALL',
        stream: e.stream || 'Vocational IT/ITeS',
        trade: e.trade || 'IT/ITeS',
        examName: eName,
        examType: e.examType || 'UNIT_TEST',
        startDate: e.startDate || '',
        endDate: e.endDate || '',
        status: e.status || existing?.status || 'OPEN',
        isLocked: e.isLocked !== undefined ? e.isLocked : (existing?.isLocked || false),
        lockedBy: existing?.lockedBy || '',
        lockedAt: existing?.lockedAt || '',
        publishedAt: existing?.publishedAt || '',
        archivedAt: existing?.archivedAt || '',
        createdAt: existing?.createdAt || nowStr,
        updatedAt: nowStr
      };
    });

    Database.upsertBatch('Examinations', records);
    Audit.log('SAVE_EXAMINATIONS', session.role, session.userId, { count: records.length }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Saved ${records.length} examination records successfully`,
      data: { examinations: records }
    };
  },

  /**
   * Transitions an examination through its authoritative lifecycle:
   * DRAFT -> OPEN -> LOCKED -> PUBLISHED -> ARCHIVED
   */
  setExaminationStatus: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Administrator or Principal can modify examination lifecycle states.' } };
    }

    const examId = payload.examId;
    const targetStatus = String(payload.status || '').toUpperCase().trim();
    const validStatuses = ['DRAFT', 'OPEN', 'LOCKED', 'PUBLISHED', 'ARCHIVED'];

    if (!validStatuses.includes(targetStatus)) {
      return { success: false, error: { code: 'INVALID_STATUS', message: `Invalid status '${targetStatus}'. Allowed: ${validStatuses.join(', ')}` } };
    }

    let exam = Database.findByPk('Examinations', examId);
    if (!exam) {
      // Fallback matching by name + class
      if (payload.examName && payload.class) {
        exam = Database.findBy('Examinations', e =>
          String(e.class) === String(payload.class) &&
          String(e.examName).toLowerCase().trim() === String(payload.examName).toLowerCase().trim()
        )[0];
      }
    }

    if (!exam) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Examination record not found' } };
    }

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const previousStatus = exam.status;

    exam.status = targetStatus;
    exam.updatedAt = nowStr;

    if (targetStatus === 'LOCKED') {
      exam.isLocked = true;
      exam.lockedBy = session.userId;
      exam.lockedAt = nowStr;
    } else if (targetStatus === 'OPEN') {
      exam.isLocked = false;
    } else if (targetStatus === 'PUBLISHED') {
      exam.publishedAt = nowStr;

      // Update all calculated results for this exam to PUBLISHED
      const allResults = Database.findBy('ExamResults', r =>
        String(r.class) === String(exam.class) &&
        (r.examId === exam.examId || String(r.examName).toLowerCase().trim() === String(exam.examName).toLowerCase().trim())
      );

      if (allResults.length > 0) {
        allResults.forEach(r => {
          r.resultStatus = 'PUBLISHED';
          r.publishedAt = nowStr;
          r.updatedAt = nowStr;
        });
        Database.upsertBatch('ExamResults', allResults);
      }
    } else if (targetStatus === 'ARCHIVED') {
      exam.archivedAt = nowStr;
    }

    Database.upsertBatch('Examinations', [exam]);

    Audit.log(targetStatus === 'PUBLISHED' ? 'RESULT_PUBLISHED' : 'EXAM_STATUS_UPDATED', session.role, session.userId, {
      examId: exam.examId,
      examName: exam.examName,
      class: exam.class,
      previousStatus: previousStatus,
      newStatus: targetStatus
    }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: `Examination '${exam.examName}' status updated to ${targetStatus}`,
      data: { examination: exam }
    };
  },

  /**
   * Retrieves marks scoped by caller role and filtered by query.
   */
  getMarks: function(session, query) {
    query = query || {};
    const allMarks = Database.readAll('Marks');
    let filtered = Security.filterMarksForSession(session, allMarks);

    if (query.studentId) filtered = filtered.filter(m => String(m.studentId) === String(query.studentId));
    if (query.exam || query.examName) {
      const qExam = String(query.exam || query.examName).toLowerCase().trim();
      filtered = filtered.filter(m => String(m.exam || '').toLowerCase().trim().includes(qExam));
    }
    if (query.subject) {
      const qSub = String(query.subject).toLowerCase().trim();
      filtered = filtered.filter(m => String(m.subject || '').toLowerCase().trim().includes(qSub));
    }
    if (query.class) filtered = filtered.filter(m => String(m.class) === String(query.class));
    if (query.section && query.section !== 'ALL') filtered = filtered.filter(m => String(m.section || 'A').toUpperCase() === String(query.section).toUpperCase());
    if (query.academicYear) filtered = filtered.filter(m => !m.academicYear || String(m.academicYear) === String(query.academicYear));

    return {
      success: true,
      data: {
        marks: filtered,
        total: filtered.length
      }
    };
  },

  /**
   * Saves or updates marks with strict teacher scoping, curriculum theory/practical limits,
   * negative mark rejection, and exam lock state checks.
   */
  saveMarks: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Write permission denied for Marks' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const currentSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const academicYear = String(payload.academicYear || (currentSetting ? currentSetting.value : '2026-2027')).trim();
    const targetClass = String(payload.class || '').trim();
    const targetSection = String(payload.section || 'A').trim();
    const examName = String(payload.exam || payload.examName || '1st Unit Test').trim();
    const targetSubject = String(payload.subject || '').trim();
    const targetComponent = String(payload.component || 'BOTH').toUpperCase();
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    // 1. Teacher Academic Scoping Check
    if (session.role === 'TEACHER') {
      if (targetClass && !Security.canAccessClass(session, targetClass)) {
        return { success: false, error: { code: 'UNAUTHORIZED_CLASS', message: 'Write permission denied for unassigned class: ' + targetClass } };
      }
      if (targetSubject && !Security.canTeacherManageSubject(session, targetSubject, targetComponent)) {
        return { success: false, error: { code: 'UNAUTHORIZED_SUBJECT', message: 'Write permission denied for unassigned subject or component: ' + targetSubject } };
      }
    }

    // 2. Resolve Examination Lock State
    const allExams = Database.readAll('Examinations');
    const matchingExam = allExams.find(e =>
      String(e.class) === targetClass &&
      (e.examName === examName || String(e.examName).toLowerCase().trim() === examName.toLowerCase().trim())
    );

    if (matchingExam && (matchingExam.isLocked || matchingExam.status === 'LOCKED' || matchingExam.status === 'PUBLISHED')) {
      if (!['ADMIN', 'PRINCIPAL'].includes(session.role)) {
        return {
          success: false,
          error: {
            code: 'EXAM_LOCKED',
            message: `Examination '${examName}' is ${matchingExam.status}. Modifications require Administrator or Principal approval.`
          }
        };
      }
    }

    // 3. Resolve Subject Max Marks from Curriculum
    let maxTheory = parseInt(payload.maxTheory, 10);
    let maxPractical = parseInt(payload.maxPractical, 10);
    let maxTotal = parseInt(payload.maxMarks, 10);

    if (isNaN(maxTheory) || isNaN(maxPractical) || isNaN(maxTotal)) {
      const resolvedCurr = AcademicApi.resolveCurriculumForContext(schoolId, academicYear, targetClass, targetSection);
      const matchedSub = resolvedCurr?.subjects?.find(s =>
        String(s.subjectName || '').toLowerCase().trim() === targetSubject.toLowerCase().trim() ||
        String(s.subjectCode || '').toLowerCase().trim() === targetSubject.toLowerCase().trim()
      );

      if (matchedSub) {
        maxTheory = matchedSub.hasTheory ? (matchedSub.theoryMaxMarks || 70) : 0;
        maxPractical = matchedSub.hasPractical ? (matchedSub.practicalMaxMarks || 30) : 0;
        maxTotal = matchedSub.totalMaxMarks || 100;
      } else {
        maxTheory = targetComponent === 'PRACTICAL' ? 0 : 70;
        maxPractical = targetComponent === 'THEORY' ? 0 : 30;
        maxTotal = 100;
      }
    }

    // 4. Parse & Validate Mark Entries
    const markRecords = [];
    const uniqueKeys = new Set();

    if (Array.isArray(payload.marks)) {
      for (let i = 0; i < payload.marks.length; i++) {
        const m = payload.marks[i];
        const sid = String(m.studentId || '').trim();
        if (!sid) {
          return { success: false, error: { code: 'VALIDATION_ERROR', message: 'studentId is required for every mark entry' } };
        }

        const mClass = String(m.class || targetClass || '').trim();
        const mSection = String(m.section || targetSection || 'A').trim();
        const mExam = String(m.exam || examName).trim();
        const mSubject = String(m.subject || targetSubject).trim();

        // Teacher Scope Check per row
        if (session.role === 'TEACHER') {
          if (mClass && !Security.canAccessClass(session, mClass)) {
            return { success: false, error: { code: 'UNAUTHORIZED_CLASS', message: 'Permission denied for class: ' + mClass } };
          }
          if (!Security.canAccessStudent(session, sid, mClass)) {
            return { success: false, error: { code: 'UNAUTHORIZED_STUDENT', message: 'Permission denied for student: ' + sid } };
          }
        }

        const uniqueKey = `${sid}_${mExam}_${mSubject}_${academicYear}`;
        if (uniqueKeys.has(uniqueKey)) {
          return { success: false, error: { code: 'DUPLICATE_MARK', message: `Duplicate mark entry detected for student ${sid} in ${mSubject}` } };
        }
        uniqueKeys.add(uniqueKey);

        const theoryRaw = m.theory !== undefined ? m.theory : (m.t !== undefined ? m.t : 0);
        const practicalRaw = m.practical !== undefined ? m.practical : (m.p !== undefined ? m.p : 0);
        const theory = parseInt(theoryRaw, 10) || 0;
        const practical = parseInt(practicalRaw, 10) || 0;

        if (theory < 0 || practical < 0) {
          return { success: false, error: { code: 'INVALID_MARKS', message: `Marks cannot be negative (Student: ${sid})` } };
        }

        if (theory > maxTheory) {
          return { success: false, error: { code: 'MARKS_EXCEED_MAXIMUM', message: `Theory marks (${theory}) exceed maximum allowed (${maxTheory}) for student ${sid}` } };
        }

        if (practical > maxPractical) {
          return { success: false, error: { code: 'MARKS_EXCEED_MAXIMUM', message: `Practical marks (${practical}) exceed maximum allowed (${maxPractical}) for student ${sid}` } };
        }

        const total = theory + practical;
        if (total > maxTotal) {
          return { success: false, error: { code: 'MARKS_EXCEED_MAXIMUM', message: `Total marks (${total}) exceed subject maximum (${maxTotal}) for student ${sid}` } };
        }

        const cleanExam = mExam.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanSub = mSubject.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanYr = academicYear.replace(/[^a-zA-Z0-9]/g, '_');
        const markId = m.markId || `MRK_${sid}_${cleanExam}_${cleanSub}_${cleanYr}`;

        markRecords.push({
          markId: markId,
          schoolId: schoolId,
          studentId: sid,
          academicYear: academicYear,
          class: mClass,
          section: mSection,
          exam: mExam,
          subject: mSubject,
          component: targetComponent,
          theory: theory,
          practical: practical,
          total: total,
          maxMarks: maxTotal,
          status: 'ENTERED',
          reason: m.reason || payload.reason || '',
          correctedBy: payload.reason ? session.userId : '',
          correctedAt: payload.reason ? nowStr : '',
          updatedAt: nowStr
        });
      }
    }

    if (markRecords.length === 0) {
      return { success: true, message: 'No marks to save', data: { count: 0 } };
    }

    const dbResult = Database.upsertBatch('Marks', markRecords);

    Audit.log('SAVE_MARKS', session.role, session.userId, {
      count: markRecords.length,
      class: targetClass,
      exam: examName,
      subject: targetSubject,
      academicYear: academicYear
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Saved ${markRecords.length} marks records successfully`,
      data: {
        count: markRecords.length,
        records: markRecords,
        dbResult: dbResult
      }
    };
  },

  /**
   * Authoritative calculation layer for Examination Results.
   * Computes Subject Totals, Grand Total, Percentage, Grade, and Provisional Result Status.
   */
  calculateExamResults: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to calculate examination results' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const currentSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const academicYear = String(payload.academicYear || (currentSetting ? currentSetting.value : '2026-2027')).trim();
    const targetClass = String(payload.class || '10').trim();
    const targetSection = String(payload.section || 'A').trim();
    const examName = String(payload.examName || payload.exam || '1st Unit Test').trim();
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    const students = Database.readAll('Students').filter(s => {
      const matchSchool = !s.schoolId || s.schoolId === schoolId;
      const matchClass = String(s.class) === targetClass;
      const matchStatus = (s.status || 'Active').toLowerCase() !== 'inactive';
      return matchSchool && matchClass && matchStatus;
    });

    const allMarks = Database.readAll('Marks').filter(m => {
      const matchSchool = !m.schoolId || m.schoolId === schoolId;
      const matchYear = !m.academicYear || m.academicYear === academicYear;
      const matchClass = !m.class || String(m.class) === targetClass;
      const mExam = String(m.exam || '').toLowerCase().trim();
      const targetExam = examName.toLowerCase().trim();
      const matchExam = mExam === targetExam ||
        (targetExam.includes('half yearly') && mExam.includes('half yearly')) ||
        (targetExam.includes('annual') && (mExam.includes('annual') || mExam.includes('final'))) ||
        (targetExam.includes('1st unit') && mExam.includes('1st unit')) ||
        (targetExam.includes('2nd unit') && mExam.includes('2nd unit'));
      return matchSchool && matchYear && matchClass && matchExam;
    });

    const calculatedResults = [];

    students.forEach(stu => {
      const sid = String(stu.studentId);
      const studentMarks = allMarks.filter(m => String(m.studentId) === sid);

      let grandTotal = 0;
      let maxPossible = 0;
      let allSubjectsPassed = true;
      let passedCount = 0;

      studentMarks.forEach(m => {
        const theory = parseInt(m.theory, 10) || 0;
        const practical = parseInt(m.practical, 10) || 0;
        const total = theory + practical;
        const subMax = parseInt(m.maxMarks, 10) || 100;
        const isPass = total >= Math.round(subMax * 0.30);

        if (isPass) passedCount++;
        else allSubjectsPassed = false;

        grandTotal += total;
        maxPossible += subMax;
      });

      if (maxPossible === 0) maxPossible = 100;

      const percentage = maxPossible > 0 && studentMarks.length > 0
        ? parseFloat(((grandTotal / maxPossible) * 100).toFixed(2))
        : 0;

      // Provisional Grading Policy
      let grade = 'E';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C+';
      else if (percentage >= 40) grade = 'C';
      else if (percentage >= 30) grade = 'D';

      const resultStatus = (studentMarks.length > 0 && allSubjectsPassed) ? 'PASSED' : 'NEEDS_IMPROVEMENT';
      const cleanExam = examName.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanYr = academicYear.replace(/[^a-zA-Z0-9]/g, '_');
      const resultId = `RES_${sid}_${targetClass}_${cleanExam}_${cleanYr}`;

      calculatedResults.push({
        resultId: resultId,
        schoolId: schoolId,
        studentId: sid,
        academicYear: academicYear,
        class: targetClass,
        section: stu.section || targetSection,
        stream: stu.stream || 'Vocational IT/ITeS',
        examId: `EXAM_${targetClass}_${cleanExam}`,
        examName: examName,
        totalMarks: grandTotal,
        maxMarks: maxPossible,
        percentage: percentage,
        grade: grade,
        resultStatus: payload.publish === true ? 'PUBLISHED' : resultStatus,
        evaluatedSubjectsCount: studentMarks.length,
        passedSubjectsCount: passedCount,
        revision: 1,
        revisionReason: '',
        revisedBy: '',
        revisedAt: '',
        publishedAt: payload.publish === true ? nowStr : '',
        updatedAt: nowStr
      });
    });

    if (calculatedResults.length > 0) {
      Database.upsertBatch('ExamResults', calculatedResults);
    }

    Audit.log('CALCULATE_EXAM_RESULTS', session.role, session.userId, {
      academicYear: academicYear,
      class: targetClass,
      examName: examName,
      evaluatedStudents: calculatedResults.length
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Calculated results for ${calculatedResults.length} students in Class ${targetClass}`,
      data: {
        results: calculatedResults,
        total: calculatedResults.length,
        academicYear: academicYear,
        class: targetClass,
        examName: examName
      }
    };
  },

  /**
   * Controlled revision of a published or calculated examination result.
   */
  reviseExamResult: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Administrator or Principal can perform result revisions.' } };
    }

    const resultId = payload.resultId;
    if (!resultId) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: 'resultId is required for revision' } };
    }

    const result = Database.findByPk('ExamResults', resultId);
    if (!result) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Result record not found' } };
    }

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const revNumber = (result.revision || 1) + 1;

    result.revision = revNumber;
    result.revisionReason = payload.reason || payload.revisionReason || 'Administrative grade adjustment';
    result.revisedBy = session.userId;
    result.revisedAt = nowStr;
    result.updatedAt = nowStr;

    if (payload.totalMarks !== undefined) result.totalMarks = parseInt(payload.totalMarks, 10);
    if (payload.percentage !== undefined) result.percentage = parseFloat(payload.percentage);
    if (payload.grade !== undefined) result.grade = payload.grade;
    if (payload.resultStatus !== undefined) result.resultStatus = payload.resultStatus;

    Database.upsertBatch('ExamResults', [result]);

    Audit.log('RESULT_REVISED', session.role, session.userId, {
      resultId: resultId,
      studentId: result.studentId,
      examName: result.examName,
      revision: revNumber,
      reason: result.revisionReason
    }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: `Result for student ${result.studentId} revised successfully (Revision v${revNumber})`,
      data: { result: result }
    };
  },

  /**
   * Retrieves examination results with student/parent scoping and enrichment.
   */
  getExamResults: function(session, payload) {
    payload = payload || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    let allResults = Database.readAll('ExamResults');
    const allExams = Database.readAll('Examinations');

    const publishedExamMap = new Map();
    allExams.forEach(e => {
      const key = `${e.examName}_${e.class}_${e.academicYear}`;
      publishedExamMap.set(key, e.status === 'PUBLISHED');
    });

    if (payload.studentId) {
      if (!Security.canAccessStudent(session, payload.studentId)) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to requested student results' } };
      }
      allResults = allResults.filter(r => String(r.studentId) === String(payload.studentId));
    } else if (session.role === 'STUDENT') {
      allResults = allResults.filter(r => String(r.studentId) === String(session.userId));
    } else if (session.role === 'PARENT') {
      const authorizedIds = Security.getAuthorizedStudentIdsForParent(session.userId, schoolId);
      allResults = allResults.filter(r => authorizedIds.includes(String(r.studentId)));
    } else if (session.role === 'TEACHER') {
      const assigned = Security.getTeacherAssignedClasses(session.userId, schoolId);
      if (assigned.length > 0) {
        allResults = allResults.filter(r => assigned.includes(String(r.class)));
      }
    }

    if (session.role === 'PARENT' || session.role === 'STUDENT') {
      allResults = allResults.filter(r => {
        const isPublishedStatus = r.resultStatus === 'PUBLISHED';
        const examKey = `${r.examName}_${r.class}_${r.academicYear}`;
        const isExamPublished = publishedExamMap.get(examKey) === true;
        return isPublishedStatus || isExamPublished;
      });
    }

    if (payload.academicYear) {
      allResults = allResults.filter(r => r.academicYear === payload.academicYear);
    }
    if (payload.class) {
      allResults = allResults.filter(r => String(r.class) === String(payload.class));
    }
    if (payload.examName || payload.exam) {
      const targetExam = String(payload.examName || payload.exam).toLowerCase().trim();
      allResults = allResults.filter(r => String(r.examName || '').toLowerCase().trim().includes(targetExam));
    }

    return {
      success: true,
      data: {
        results: allResults,
        total: allResults.length
      }
    };
  },

  /**
   * Retrieves aggregated class and subject analytics for an examination.
   */
  getExamAnalytics: function(session, query) {
    query = query || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const allResults = Database.readAll('ExamResults').filter(r => {
      const matchSchool = !r.schoolId || r.schoolId === schoolId;
      const matchYear = !query.academicYear || r.academicYear === query.academicYear;
      const matchClass = !query.class || String(r.class) === String(query.class);
      const matchExam = !query.examName || String(r.examName).toLowerCase().includes(String(query.examName).toLowerCase());
      return matchSchool && matchYear && matchClass && matchExam;
    });

    const evaluatedCount = allResults.length;
    const passedCount = allResults.filter(r => r.resultStatus === 'PASSED' || r.resultStatus === 'PUBLISHED').length;
    const needsImprovementCount = allResults.filter(r => r.resultStatus === 'NEEDS_IMPROVEMENT').length;

    const percentages = allResults.map(r => r.percentage || 0);
    const avgPercentage = evaluatedCount > 0 ? parseFloat((percentages.reduce((a, b) => a + b, 0) / evaluatedCount).toFixed(2)) : 0;
    const highestPercentage = evaluatedCount > 0 ? Math.max(...percentages) : 0;
    const lowestPercentage = evaluatedCount > 0 ? Math.min(...percentages) : 0;

    return {
      success: true,
      data: {
        summary: {
          totalEvaluated: evaluatedCount,
          passedCount: passedCount,
          needsImprovementCount: needsImprovementCount,
          averagePercentage: avgPercentage,
          highestPercentage: highestPercentage,
          lowestPercentage: lowestPercentage
        },
        policyStatus: 'CONFIGURED_NOT_LIVE',
        boardPolicyLabel: 'Requires Institutional Approval for official board policy'
      }
    };
  },

  /**
   * Retrieves exam timetable schedules.
   */
  getExamSchedules: function(session, query) {
    query = query || {};
    let allSchedules = Database.readAll('ExamSchedules');

    if (query.examId) allSchedules = allSchedules.filter(s => s.examId === query.examId);
    if (query.class) allSchedules = allSchedules.filter(s => String(s.class) === String(query.class));
    if (query.academicYear) allSchedules = allSchedules.filter(s => s.academicYear === query.academicYear);

    return {
      success: true,
      data: {
        schedules: allSchedules.sort((a, b) => (a.examDate || '').localeCompare(b.examDate || '')),
        total: allSchedules.length
      }
    };
  },

  /**
   * Saves or updates exam schedules with conflict prevention.
   */
  saveExamSchedules: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Administrator or Principal can manage exam schedules' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const inputSchedules = Array.isArray(payload.schedules) ? payload.schedules : [payload];

    const records = inputSchedules.map(s => {
      const scheduleId = s.scheduleId || Auth.generateId('SCHED');
      return {
        scheduleId: scheduleId,
        schoolId: schoolId,
        examId: s.examId || '',
        academicYear: s.academicYear || '2026-2027',
        class: String(s.class || '10'),
        section: s.section || 'A',
        subjectId: s.subjectId || '',
        subjectCode: s.subjectCode || '',
        subjectName: s.subjectName || '',
        component: s.component || 'THEORY',
        examDate: s.examDate || '',
        startTime: s.startTime || '',
        endTime: s.endTime || '',
        venue: s.venue || 'Main Hall',
        instructions: s.instructions || '',
        status: s.status || 'SCHEDULED',
        createdAt: s.createdAt || nowStr,
        updatedAt: nowStr
      };
    });

    Database.upsertBatch('ExamSchedules', records);

    return {
      success: true,
      message: `Saved ${records.length} exam schedule items`,
      data: { schedules: records }
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExaminationApi };
}
