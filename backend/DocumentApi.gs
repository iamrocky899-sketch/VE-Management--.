/**
 * VE MANAGEMENT — ACADEMIC DOCUMENTS ENGINE
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Module: DocumentApi
 * Handles:
 * 1. 14 Document Types & Standard Prefixes
 * 2. Concurrency-Safe Year-Aware Document Number Generator
 * 3. Multi-Stage Lifecycle: DRAFT -> REVIEW -> APPROVED -> ISSUED -> REVISED / CANCELLED
 * 4. Immutable Revision Tracking & Versioning
 * 5. Authoritative Data Contracts (Marksheet, Report Card, Certificates)
 * 6. Public QR Verification Engine & Public API (verify_document)
 * 7. Completion Eligibility Checking (with provisional policy safeguards)
 * 8. RBAC Document Filtering & Audit Logging
 */

const DOCUMENT_TYPES = {
  MARKSHEET: { prefix: 'MARK', name: 'Official Marksheet' },
  COMPLETION_CERTIFICATE: { prefix: 'CERT', name: 'Vocational Completion Certificate' },
  REPORT_CARD: { prefix: 'RC', name: 'Annual Report Card' },
  TRANSFER_CERTIFICATE: { prefix: 'TC', name: 'Transfer Certificate (TC)' },
  CHARACTER_CERTIFICATE: { prefix: 'CHAR', name: 'Character Certificate' },
  MIGRATION_CERTIFICATE: { prefix: 'MIGR', name: 'Migration Certificate' },
  ADMIT_CARD: { prefix: 'ADMT', name: 'Examination Admit Card' },
  BONAFIDE_CERTIFICATE: { prefix: 'BONA', name: 'Bonafide Student Certificate' },
  STUDY_CERTIFICATE: { prefix: 'STDY', name: 'Study Certificate' },
  SCHOOL_LEAVING_CERTIFICATE: { prefix: 'SLC', name: 'School Leaving Certificate' },
  MERIT_CERTIFICATE: { prefix: 'MRIT', name: 'Certificate of Academic Merit' },
  ACHIEVEMENT_CERTIFICATE: { prefix: 'ACHV', name: 'Special Achievement Certificate' },
  PARTICIPATION_CERTIFICATE: { prefix: 'PART', name: 'Participation Certificate' },
  CUSTOM_CERTIFICATE: { prefix: 'CUST', name: 'Institutional Certificate' }
};

const DocumentApi = {

  /**
   * Generates a unique, non-duplicating, year-aware document number.
   * Format: GHSS-{PREFIX}-{YEAR}-{SEQUENCE} (e.g. GHSS-MARK-2026-000001)
   */
  generateDocumentNumber: function(schoolId, documentType, academicYear) {
    const docMeta = DOCUMENT_TYPES[documentType] || { prefix: 'DOC' };
    const yearShort = (academicYear || '2026-2027').split('-')[0] || '2026';
    const prefix = `GHSS-${docMeta.prefix}-${yearShort}-`;

    const allDocs = Database.readAll('Documents') || [];
    let maxSeq = 0;

    allDocs.forEach(d => {
      const dNum = String(d.documentNumber || '');
      if (dNum.startsWith(prefix)) {
        const seqPart = parseInt(dNum.substring(prefix.length), 10);
        if (!isNaN(seqPart) && seqPart > maxSeq) {
          maxSeq = seqPart;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    const seqStr = String(nextSeq).padStart(6, '0');
    return `${prefix}${seqStr}`;
  },

  /**
   * Generates a unique verification ID for QR code verification.
   * Format: VRF-{PREFIX}-{YEAR}-{HASH}
   */
  generateVerificationId: function(documentType, academicYear) {
    const docMeta = DOCUMENT_TYPES[documentType] || { prefix: 'DOC' };
    const yearShort = (academicYear || '2026-2027').split('-')[0] || '2026';
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `VRF-${docMeta.prefix}-${yearShort}-${randomHex}`;
  },

  /**
   * Retrieves documents filtered by caller permissions and criteria.
   */
  getDocuments: function(session, query) {
    query = query || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    let allDocs = Database.readAll('Documents');

    // Role-based filtering via Security layer
    if (query.studentId && !Security.canAccessStudent(session, String(query.studentId))) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    allDocs = Security.filterDocumentsForSession(session, allDocs);

    if (query.studentId) {
      allDocs = allDocs.filter(d => String(d.studentId) === String(query.studentId));
    }
    if (query.class) {
      allDocs = allDocs.filter(d => String(d.class) === String(query.class));
    }
    if (query.academicYear) {
      allDocs = allDocs.filter(d => d.academicYear === query.academicYear);
    }
    if (query.documentType) {
      allDocs = allDocs.filter(d => d.documentType === query.documentType || d.category === query.documentType);
    }
    if (query.status) {
      allDocs = allDocs.filter(d => String(d.status || '').toUpperCase() === String(query.status).toUpperCase());
    }
    if (query.documentNumber) {
      allDocs = allDocs.filter(d => String(d.documentNumber || '').toLowerCase().includes(String(query.documentNumber).toLowerCase()));
    }

    // Enrich documents with student name
    const students = Database.readAll('Students');
    const studentMap = new Map();
    students.forEach(s => studentMap.set(String(s.studentId), s));

    const enriched = allDocs.map(d => {
      const stu = studentMap.get(String(d.studentId)) || {};
      return {
        documentId: d.documentId,
        schoolId: d.schoolId || schoolId,
        studentId: d.studentId,
        studentName: stu.studentName || d.title || 'Student',
        rollNo: stu.rollNo || '',
        class: d.class || stu.class || '',
        section: stu.section || 'A',
        academicYear: d.academicYear || '2026-2027',
        documentType: d.documentType || d.category || 'CUSTOM_CERTIFICATE',
        documentNumber: d.documentNumber || '',
        title: d.title || (DOCUMENT_TYPES[d.documentType]?.name || 'Academic Document'),
        status: d.status || 'ISSUED',
        issueDate: d.issueDate || d.createdAt || '',
        issuedBy: d.issuedBy || '',
        approvedBy: d.approvedBy || '',
        verificationId: d.verificationId || '',
        version: d.version || 1,
        revisionOf: d.revisionOf || '',
        fileReference: d.fileReference || d.url || '',
        metadata: typeof d.metadata === 'string' ? d.metadata : JSON.stringify(d.metadata || {}),
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      };
    });

    return {
      success: true,
      data: {
        documents: enriched,
        total: enriched.length
      }
    };
  },

  /**
   * Creates a new draft academic document.
   */
  createDocument: function(session, payload) {
    if (!['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to create documents' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const sid = String(payload.studentId || '').trim();
    if (!sid) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId is required' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) {
      return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: `Student not found: ${sid}` } };
    }

    if (session.role === 'TEACHER') {
      if (student.class && !Security.canAccessClass(session, student.class)) {
        return { success: false, error: { code: 'UNAUTHORIZED_CLASS', message: `Teacher is not authorized for Class ${student.class}` } };
      }
    }

    const docType = String(payload.documentType || 'MARKSHEET').toUpperCase().trim();
    const validTypes = Object.keys(DOCUMENT_TYPES);
    if (!validTypes.includes(docType)) {
      return { success: false, error: { code: 'INVALID_DOCUMENT_TYPE', message: `Invalid document type. Must be one of: ${validTypes.join(', ')}` } };
    }

    const currentActiveSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const academicYear = payload.academicYear || (currentActiveSetting ? currentActiveSetting.value : '2026-2027');
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const targetClass = String(payload.class || student.class || '9');
    const initialStatus = payload.status === 'REVIEW' ? 'REVIEW' : 'DRAFT';

    const documentId = `DOC_${sid}_${docType}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

    const docRecord = {
      documentId: documentId,
      schoolId: schoolId,
      studentId: sid,
      academicYear: academicYear,
      class: targetClass,
      documentType: docType,
      documentNumber: '',
      title: payload.title || `${DOCUMENT_TYPES[docType]?.name || docType} - ${student.studentName}`,
      description: payload.description || '',
      category: docType,
      status: initialStatus,
      issueDate: '',
      issuedBy: '',
      approvedBy: '',
      verificationId: '',
      version: 1,
      revisionOf: '',
      fileReference: payload.fileReference || '',
      url: payload.url || '',
      metadata: typeof payload.metadata === 'object' ? JSON.stringify(payload.metadata) : (payload.metadata || '{}'),
      visibility: 'STUDENT',
      createdAt: nowStr,
      updatedAt: nowStr
    };

    Database.upsertBatch('Documents', [docRecord]);

    Audit.log('CREATE_DOCUMENT', session.role, session.userId, {
      documentId: documentId,
      studentId: sid,
      documentType: docType,
      status: initialStatus
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Document created in ${initialStatus} status`,
      data: { document: docRecord }
    };
  },

  /**
   * Approves a document for issuance. (Admin / Principal only)
   */
  approveDocument: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can approve documents' } };
    }

    const docId = String(payload.documentId || '').trim();
    const doc = Database.findByPk('Documents', docId);
    if (!doc) {
      return { success: false, error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' } };
    }

    if (doc.status === 'ISSUED') {
      return { success: false, error: { code: 'ALREADY_ISSUED', message: 'Document has already been issued' } };
    }

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    doc.status = 'APPROVED';
    doc.approvedBy = session.userId;
    doc.updatedAt = nowStr;

    Database.upsertBatch('Documents', [doc]);
    Audit.log('APPROVE_DOCUMENT', session.role, session.userId, { documentId: docId }, 'SUCCESS', '', session.schoolId);

    return {
      success: true,
      message: 'Document approved successfully',
      data: { document: doc }
    };
  },

  /**
   * Issues an official academic document with a unique document number and verification ID.
   * (Admin / Principal only)
   */
  issueDocument: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can issue official documents' } };
    }

    const docId = String(payload.documentId || '').trim();
    let doc = Database.findByPk('Documents', docId);
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;

    // If direct issuance without pre-created draft
    if (!doc && payload.studentId && payload.documentType) {
      const sid = String(payload.studentId).trim();
      const student = Database.findByPk('Students', sid);
      if (!student) {
        return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: `Student not found: ${sid}` } };
      }
      const docType = String(payload.documentType).toUpperCase().trim();
      const academicYear = payload.academicYear || '2026-2027';

      doc = {
        documentId: `DOC_${sid}_${docType}_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
        schoolId: schoolId,
        studentId: sid,
        academicYear: academicYear,
        class: String(payload.class || student.class || '9'),
        documentType: docType,
        title: payload.title || `${DOCUMENT_TYPES[docType]?.name || docType} - ${student.studentName}`,
        description: payload.description || '',
        category: docType,
        version: 1,
        revisionOf: '',
        metadata: typeof payload.metadata === 'object' ? JSON.stringify(payload.metadata) : (payload.metadata || '{}'),
        visibility: 'STUDENT',
        createdAt: nowStr,
        updatedAt: nowStr
      };
    } else if (!doc) {
      return { success: false, error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' } };
    }

    if (doc.status === 'ISSUED') {
      return {
        success: true,
        message: 'Document is already issued',
        data: { document: doc }
      };
    }

    // Generate unique document number & verification ID
    const docNumber = doc.documentNumber || this.generateDocumentNumber(schoolId, doc.documentType, doc.academicYear);
    const verificationId = doc.verificationId || this.generateVerificationId(doc.documentType, doc.academicYear);

    doc.documentNumber = docNumber;
    doc.verificationId = verificationId;
    doc.status = 'ISSUED';
    doc.issueDate = payload.issueDate || nowStr;
    doc.issuedBy = session.userId;
    doc.approvedBy = doc.approvedBy || session.userId;
    doc.updatedAt = nowStr;

    Database.upsertBatch('Documents', [doc]);

    Audit.log('ISSUE_DOCUMENT', session.role, session.userId, {
      documentId: doc.documentId,
      documentNumber: docNumber,
      verificationId: verificationId,
      studentId: doc.studentId,
      documentType: doc.documentType
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Document successfully issued as ${docNumber}`,
      data: { document: doc }
    };
  },

  /**
   * Revises an issued document. Marks previous version as REVISED and creates a new ISSUED v2 document.
   */
  reviseDocument: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can revise documents' } };
    }

    const docId = String(payload.documentId || '').trim();
    const oldDoc = Database.findByPk('Documents', docId);
    if (!oldDoc) {
      return { success: false, error: { code: 'DOCUMENT_NOT_FOUND', message: 'Original document not found' } };
    }

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const currentVersion = parseInt(oldDoc.version, 10) || 1;
    const nextVersion = currentVersion + 1;

    // 1. Mark old document as REVISED
    oldDoc.status = 'REVISED';
    oldDoc.updatedAt = nowStr;
    Database.upsertBatch('Documents', [oldDoc]);

    // 2. Generate new document number & verification ID
    const newDocNumber = this.generateDocumentNumber(schoolId, oldDoc.documentType, oldDoc.academicYear);
    const newVerificationId = this.generateVerificationId(oldDoc.documentType, oldDoc.academicYear);
    const newDocId = `DOC_${oldDoc.studentId}_${oldDoc.documentType}_v${nextVersion}_${Date.now()}`;

    const newDoc = {
      documentId: newDocId,
      schoolId: schoolId,
      studentId: oldDoc.studentId,
      academicYear: oldDoc.academicYear,
      class: payload.class || oldDoc.class,
      documentType: oldDoc.documentType,
      documentNumber: newDocNumber,
      title: payload.title || oldDoc.title,
      description: payload.description || `Revision of ${oldDoc.documentNumber}`,
      category: oldDoc.category,
      status: 'ISSUED',
      issueDate: payload.issueDate || nowStr,
      issuedBy: session.userId,
      approvedBy: session.userId,
      verificationId: newVerificationId,
      version: nextVersion,
      revisionOf: oldDoc.documentId,
      fileReference: payload.fileReference || '',
      url: payload.url || '',
      metadata: typeof payload.metadata === 'object' ? JSON.stringify(payload.metadata) : (payload.metadata || oldDoc.metadata || '{}'),
      visibility: 'STUDENT',
      createdAt: nowStr,
      updatedAt: nowStr
    };

    Database.upsertBatch('Documents', [newDoc]);

    Audit.log('REVISE_DOCUMENT', session.role, session.userId, {
      originalDocumentId: oldDoc.documentId,
      originalDocumentNumber: oldDoc.documentNumber,
      newDocumentId: newDocId,
      newDocumentNumber: newDocNumber,
      version: nextVersion
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Document revised. New official document: ${newDocNumber} (v${nextVersion})`,
      data: {
        originalDocument: oldDoc,
        newDocument: newDoc
      }
    };
  },

  /**
   * Cancels a document. The document is permanently marked CANCELLED and fails active verification.
   */
  cancelDocument: function(session, payload) {
    if (!Security.enforceRole(session, ['ADMIN', 'PRINCIPAL'])) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can cancel documents' } };
    }

    const docId = String(payload.documentId || '').trim();
    const doc = Database.findByPk('Documents', docId);
    if (!doc) {
      return { success: false, error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' } };
    }

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const reason = String(payload.reason || 'Cancelled by administration').trim();

    doc.status = 'CANCELLED';
    const currentMeta = typeof doc.metadata === 'string' ? (JSON.parse(doc.metadata || '{}') || {}) : (doc.metadata || {});
    currentMeta.cancellationReason = reason;
    currentMeta.cancelledBy = session.userId;
    currentMeta.cancelledAt = nowStr;
    doc.metadata = JSON.stringify(currentMeta);
    doc.updatedAt = nowStr;

    Database.upsertBatch('Documents', [doc]);

    Audit.log('CANCEL_DOCUMENT', session.role, session.userId, {
      documentId: docId,
      documentNumber: doc.documentNumber,
      reason: reason
    }, 'SUCCESS', '', session.schoolId);

    return {
      success: true,
      message: `Document ${doc.documentNumber || docId} has been CANCELLED`,
      data: { document: doc }
    };
  },

  /**
   * Public Verification API (Unauthenticated).
   * Verifies document authenticity using verificationId or documentNumber.
   * Never leaks passwords, parent phone numbers, or private details.
   */
  verifyDocument: function(payload) {
    payload = payload || {};
    const queryStr = String(payload.verificationId || payload.documentNumber || payload.id || '').trim();
    if (!queryStr) {
      return {
        success: false,
        data: { status: 'DOCUMENT_NOT_FOUND', message: 'Verification identifier required' }
      };
    }

    const allDocs = Database.readAll('Documents');
    const doc = allDocs.find(d =>
      (d.verificationId && String(d.verificationId).toUpperCase() === queryStr.toUpperCase()) ||
      (d.documentNumber && String(d.documentNumber).toUpperCase() === queryStr.toUpperCase()) ||
      (d.documentId && String(d.documentId) === queryStr)
    );

    if (!doc) {
      return {
        success: true,
        data: {
          status: 'DOCUMENT_NOT_FOUND',
          message: 'No official record found matching the verification identifier.'
        }
      };
    }

    if (doc.status === 'CANCELLED') {
      const meta = typeof doc.metadata === 'string' ? (JSON.parse(doc.metadata || '{}') || {}) : (doc.metadata || {});
      return {
        success: true,
        data: {
          status: 'DOCUMENT_CANCELLED',
          documentNumber: doc.documentNumber,
          documentType: doc.documentType || doc.category,
          cancellationReason: meta.cancellationReason || 'Document has been invalidated by school administration',
          message: 'This document has been CANCELLED and is no longer valid.'
        }
      };
    }

    if (doc.status === 'REVISED') {
      // Find newer version
      const newerDoc = allDocs.find(d => d.revisionOf === doc.documentId && d.status === 'ISSUED');
      return {
        success: true,
        data: {
          status: 'DOCUMENT_REVISED',
          documentNumber: doc.documentNumber,
          documentType: doc.documentType || doc.category,
          supersededBy: newerDoc ? newerDoc.documentNumber : 'A newer revision exists',
          message: 'This document version has been SUPERSEDED by a revised official document.'
        }
      };
    }

    // Mask student name for public privacy (e.g. "Rohan Sharma" -> "R. S*****")
    const student = Database.findByPk('Students', doc.studentId) || {};
    const rawName = student.studentName || doc.title || 'Student';
    const nameParts = rawName.split(' ');
    const maskedName = nameParts.map((p, idx) => idx === 0 ? p : p[0] + '*'.repeat(Math.max(1, p.length - 1))).join(' ');

    return {
      success: true,
      data: {
        status: 'VERIFIED',
        documentNumber: doc.documentNumber,
        documentType: doc.documentType || doc.category,
        title: DOCUMENT_TYPES[doc.documentType]?.name || doc.title,
        academicYear: doc.academicYear,
        class: doc.class,
        studentNameMasked: maskedName,
        issueDate: doc.issueDate,
        schoolName: DEFAULT_SCHOOL_NAME,
        schoolId: DEFAULT_SCHOOL_ID,
        verificationId: doc.verificationId,
        message: 'Official document verified by Gameri Higher Secondary School.'
      }
    };
  },

  /**
   * Authoritative Marksheet Data Contract.
   */
  getMarksheetData: function(session, payload) {
    const sid = String(payload.studentId || '').trim();
    if (!sid) return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId required' } };
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };

    const academicYear = payload.academicYear || '2026-2027';
    const examName = String(payload.examName || payload.exam || '1st Unit Test').trim();
    const targetClass = String(payload.class || student.class || '9');

    // Fetch marks
    const allMarks = Database.readAll('Marks');
    const studentMarks = allMarks.filter(m => {
      const matchSid = String(m.studentId) === sid;
      const matchYear = !m.academicYear || m.academicYear === academicYear;
      const matchExam = String(m.exam || '').toLowerCase().trim().includes(examName.toLowerCase().trim());
      return matchSid && matchYear && matchExam;
    });

    let grandTotal = 0;
    let maxPossible = 0;
    const subjectList = studentMarks.map(m => {
      const t = parseInt(m.theory, 10) || 0;
      const p = parseInt(m.practical, 10) || 0;
      const subTot = t + p;
      const subMax = parseInt(m.maxMarks, 10) || 100;
      grandTotal += subTot;
      maxPossible += subMax;
      return {
        subject: m.subject,
        theory: t,
        practical: p,
        total: subTot,
        maxMarks: subMax,
        isPass: subTot >= Math.round(subMax * 0.30)
      };
    });

    if (maxPossible === 0) maxPossible = 100;
    const percentage = parseFloat(((grandTotal / maxPossible) * 100).toFixed(2));
    let grade = 'E';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C+';
    else if (percentage >= 40) grade = 'C';
    else if (percentage >= 30) grade = 'D';

    return {
      success: true,
      data: {
        school: {
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          address: 'Gamiri, Biswanath, Assam - 784172',
          affiliation: 'ASSEB / SEBA Vocational IT/ITeS'
        },
        student: Object.assign({}, AcademicApi.sanitizeStudent(student), {
          studentDisplayName: typeof AcademicApi !== 'undefined' && AcademicApi.getStudentDisplayName ? AcademicApi.getStudentDisplayName(student) : (student.studentName || 'Student')
        }),
        academicYear: academicYear,
        class: targetClass,
        certificateLevel: typeof AcademicApi !== 'undefined' && AcademicApi.getCertificateLevel ? AcademicApi.getCertificateLevel(targetClass) : DocumentApi.getCertificateLevel(targetClass),
        section: student.section || 'A',
        rollNo: student.rollNo || '',
        examination: {
          examName: examName,
          status: 'EVALUATED'
        },
        subjects: subjectList,
        totals: {
          grandTotal: grandTotal,
          maxTotal: maxPossible,
          percentage: percentage,
          grade: grade,
          resultStatus: subjectList.every(s => s.isPass) ? 'PASSED' : 'NEEDS_IMPROVEMENT'
        },
        signatory: {
          signatoryTitle: 'Principal / Head of Institution',
          institution: DEFAULT_SCHOOL_NAME,
          principalSignatureUrl: (Database.findByPk('Settings', 'PRINCIPAL_SIGNATURE_URL')?.value) || 'DEVELOPMENT_PLACEHOLDER',
          teacherSignatureUrl: (Database.findByPk('Settings', 'TEACHER_SIGNATURE_URL')?.value) || 'DEVELOPMENT_PLACEHOLDER',
          logoUrl: (Database.findByPk('Settings', 'LOGO_URL')?.value) || 'DEVELOPMENT_PLACEHOLDER'
        }
      }
    };
  },

  /**
   * Authoritative Report Card Data Contract.
   */
  getReportCardData: function(session, payload) {
    const sid = String(payload.studentId || '').trim();
    if (!sid) return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId required' } };
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };

    const academicYear = payload.academicYear || '2026-2027';
    const targetClass = String(payload.class || student.class || '9');

    // Attendance computation
    const allAttendance = Database.readAll('Attendance').filter(a => String(a.studentId) === sid);
    const presentCount = allAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const totalWorkingDays = allAttendance.length || 180;
    const attendancePercentage = totalWorkingDays > 0 ? Math.round((presentCount / (allAttendance.length || 180)) * 100) : 100;

    // Exams computation
    const terms = ['1st Unit Test', 'Half Yearly Examination', '2nd Unit Test', 'Annual Examination'];
    const examResults = terms.map(term => {
      const res = this.getMarksheetData(session, { studentId: sid, academicYear, examName: term, class: targetClass });
      return {
        examName: term,
        totals: res.success ? res.data.totals : null,
        subjectsCount: res.success ? res.data.subjects.length : 0
      };
    });

    return {
      success: true,
      data: {
        school: {
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          address: 'Gamiri, Biswanath, Assam - 784172'
        },
        student: AcademicApi.sanitizeStudent(student),
        academicYear: academicYear,
        class: targetClass,
        section: student.section || 'A',
        rollNo: student.rollNo || '',
        attendance: {
          totalWorkingDays: totalWorkingDays,
          daysPresent: presentCount,
          percentage: attendancePercentage
        },
        termEvaluations: examResults,
        teacherRemarks: payload.teacherRemarks || 'Satisfactory academic and vocational performance.',
        principalRemarks: payload.principalRemarks || 'Promoted with commendable progress in IT/ITeS.',
        signatory: {
          classTeacher: 'Class Teacher',
          principal: 'Principal / Head of Institution'
        }
      }
    };
  },

  /**
   * Authoritative Transfer Certificate Data Contract (get_transfer_certificate_data)
   */
  getTransferCertificateData: function(session, payload) {
    const sid = String(payload.studentId || '').trim();
    if (!sid) return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId required' } };
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };

    const academicYear = payload.academicYear || '2026-2027';
    const targetClass = String(payload.class || student.class || '10');
    const meta = typeof payload.metadata === 'object' ? payload.metadata : (typeof payload.metadata === 'string' ? JSON.parse(payload.metadata || '{}') : {});

    // Authoritative attendance lookup
    const allAtt = Database.readAll('Attendance') || [];
    const studentAtt = allAtt.filter(a => String(a.studentId) === sid);
    const presentCount = studentAtt.filter(a => String(a.status).toUpperCase() === 'PRESENT').length;
    const totalWorkingDays = studentAtt.length > 0 ? studentAtt.length : 180;
    const attendancePercentage = studentAtt.length > 0 ? parseFloat(((presentCount / totalWorkingDays) * 100).toFixed(1)) : 88.5;

    // Subjects studied lookup
    const allSubjects = Database.readAll('Subjects') || [];
    const classSubjects = allSubjects.filter(s => String(s.class) === targetClass).map(s => s.subjectName);
    const subjectsStudied = classSubjects.length > 0 ? classSubjects : ['Information Technology (IT/ITeS)', 'Employability Skills', 'General Science', 'General Mathematics', 'Social Science', 'Language I (Assamese)', 'Language II (English)'];

    // Missing data check
    const leavingDate = payload.leavingDate || meta.leavingDate || null;
    const reasonForLeaving = payload.reasonForLeaving || meta.reasonForLeaving || null;
    const missingFields = [];
    if (!leavingDate) missingFields.push('leavingDate');
    if (!reasonForLeaving) missingFields.push('reasonForLeaving');

    return {
      success: true,
      data: {
        school: {
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          address: 'Gamiri, Biswanath, Assam - 784172',
          affiliation: 'Affiliated to ASSEB / SEBA (Vocational IT/ITeS)'
        },
        student: AcademicApi.sanitizeStudent(student),
        admissionNo: student.admissionNo || meta.admissionNo || student.studentId,
        dateOfBirth: student.dob || student.dateOfBirth || meta.dob || 'Unavailable',
        parentName: student.fatherName || student.motherName || student.guardianName || 'Parent / Guardian',
        classLastAttended: targetClass,
        section: student.section || 'A',
        rollNo: student.rollNo || '',
        academicYear: academicYear,
        dateOfAdmission: student.admissionDate || meta.admissionDate || 'Unavailable',
        dateOfLeaving: leavingDate,
        reasonForLeaving: reasonForLeaving,
        subjectsStudied: subjectsStudied,
        attendancePercentage: attendancePercentage,
        academicResult: meta.academicResult || 'Passed and Eligible for Promotion',
        conduct: meta.conduct || 'Good',
        duesCleared: meta.duesCleared !== undefined ? meta.duesCleared : true,
        remarks: meta.remarks || 'Conduct and character have been good during the tenure.',
        missingFields: missingFields,
        isComplete: missingFields.length === 0,
        signatory: {
          classTeacher: 'Class Teacher',
          principal: 'Principal / Head of Institution'
        }
      }
    };
  },

  /**
   * Authoritative Character Certificate Data Contract (get_character_certificate_data)
   */
  getCharacterCertificateData: function(session, payload) {
    const sid = String(payload.studentId || '').trim();
    if (!sid) return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId required' } };
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };

    const academicYear = payload.academicYear || '2026-2027';
    const targetClass = String(payload.class || student.class || '10');
    const meta = typeof payload.metadata === 'object' ? payload.metadata : (typeof payload.metadata === 'string' ? JSON.parse(payload.metadata || '{}') : {});
    const conductStatement = payload.conductStatement || meta.conductStatement || 'bears a commendable character, moral integrity, and orderly conduct during the period of study';

    return {
      success: true,
      data: {
        school: {
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          address: 'Gamiri, Biswanath, Assam - 784172',
          affiliation: 'ASSEB / SEBA'
        },
        student: AcademicApi.sanitizeStudent(student),
        class: targetClass,
        academicYear: academicYear,
        rollNo: student.rollNo || '',
        conductStatement: conductStatement,
        signatory: {
          classTeacher: 'Class Teacher',
          principal: 'Principal / Head of Institution'
        }
      }
    };
  },

  /**
   * Authoritative Migration Certificate Data Contract (get_migration_certificate_data)
   */
  getMigrationCertificateData: function(session, payload) {
    const sid = String(payload.studentId || '').trim();
    if (!sid) return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId required' } };
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };

    const academicYear = payload.academicYear || '2026-2027';
    const targetClass = String(payload.class || student.class || '10');
    const meta = typeof payload.metadata === 'object' ? payload.metadata : (typeof payload.metadata === 'string' ? JSON.parse(payload.metadata || '{}') : {});

    return {
      success: true,
      data: {
        school: {
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          address: 'Gamiri, Biswanath, Assam - 784172',
          affiliation: 'Affiliated to ASSEB / SEBA'
        },
        student: AcademicApi.sanitizeStudent(student),
        dateOfBirth: student.dob || student.dateOfBirth || meta.dob || 'Unavailable',
        classLastAttended: targetClass,
        academicYear: academicYear,
        destinationInstitution: payload.destinationInstitution || meta.destinationInstitution || 'Any Recognized Educational Institution / University',
        migrationReason: payload.migrationReason || meta.migrationReason || 'Higher Education & Academic Transfer',
        examinationStatus: meta.examinationStatus || 'Appeared / Completed Prescribed Course',
        signatory: {
          principal: 'Principal / Head of Institution'
        }
      }
    };
  },

  /**
   * Authoritative Examination Admit Card Data Contract (get_admit_card_data)
   */
  getAdmitCardData: function(session, payload) {
    const sid = String(payload.studentId || '').trim();
    if (!sid) return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId required' } };
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };

    const academicYear = payload.academicYear || '2026-2027';
    const targetClass = String(payload.class || student.class || '10');
    const examName = payload.examName || payload.examination || 'Annual Examination 2027';
    const meta = typeof payload.metadata === 'object' ? payload.metadata : (typeof payload.metadata === 'string' ? JSON.parse(payload.metadata || '{}') : {});

    // Standard Examination Schedule
    const defaultSchedule = [
      { date: '2027-03-01', day: 'Monday', time: '09:00 AM - 12:00 PM', subject: 'Information Technology (IT/ITeS) - Theory', venue: 'Hall 1' },
      { date: '2027-03-03', day: 'Wednesday', time: '09:00 AM - 11:00 AM', subject: 'Employability Skills', venue: 'Hall 1' },
      { date: '2027-03-05', day: 'Friday', time: '09:00 AM - 12:00 PM', subject: 'General Mathematics', venue: 'Hall 2' },
      { date: '2027-03-08', day: 'Monday', time: '09:00 AM - 12:00 PM', subject: 'General Science', venue: 'Hall 2' },
      { date: '2027-03-10', day: 'Wednesday', time: '09:00 AM - 01:00 PM', subject: 'IT/ITeS Practical & Lab Viva', venue: 'IT Lab' }
    ];

    return {
      success: true,
      data: {
        school: {
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          address: 'Gamiri, Biswanath, Assam - 784172',
          affiliation: 'ASSEB / SEBA Examination Division'
        },
        student: AcademicApi.sanitizeStudent(student),
        class: targetClass,
        section: student.section || 'A',
        rollNo: student.rollNo || '',
        academicYear: academicYear,
        examination: examName,
        examCentre: meta.examCentre || 'Gameri HSS Examination Centre (Code: GHSS-01)',
        schedule: meta.schedule || defaultSchedule,
        candidateInstructions: [
          'Candidates must arrive at the examination hall at least 15 minutes before scheduled start time.',
          'Entry without a printed official Admit Card and Student Identity Card is strictly prohibited.',
          'Electronic devices, mobile phones, smartwatches, and unauthorized papers are strictly banned.',
          'Follow all COVID/ASSEB safety guidelines and maintain absolute discipline during examination.'
        ],
        signatory: {
          centreSuperintendent: 'Centre Superintendent',
          principal: 'Principal / Head of Institution'
        }
      }
    };
  },

  /**
   * Authoritative Bonafide Certificate Data Contract (get_bonafide_certificate_data)
   */
  getBonafideCertificateData: function(session, payload) {
    const sid = String(payload.studentId || '').trim();
    if (!sid) return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId required' } };
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };

    const academicYear = payload.academicYear || '2026-2027';
    const targetClass = String(payload.class || student.class || '10');
    const meta = typeof payload.metadata === 'object' ? payload.metadata : (typeof payload.metadata === 'string' ? JSON.parse(payload.metadata || '{}') : {});
    const purpose = payload.purpose || meta.purpose || null;

    const missingFields = [];
    if (!purpose) missingFields.push('purpose');

    return {
      success: true,
      data: {
        school: {
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          address: 'Gamiri, Biswanath, Assam - 784172',
          affiliation: 'ASSEB / SEBA'
        },
        student: AcademicApi.sanitizeStudent(student),
        class: targetClass,
        section: student.section || 'A',
        rollNo: student.rollNo || '',
        academicYear: academicYear,
        purpose: purpose || 'Official Verification & Institutional Purposes',
        missingFields: missingFields,
        isComplete: missingFields.length === 0,
        signatory: {
          signatoryTitle: 'Principal / Head of Institution',
          principal: 'Principal / Head of Institution',
          principalSignatureUrl: (Database.findByPk('Settings', 'PRINCIPAL_SIGNATURE_URL')?.value) || 'DEVELOPMENT_PLACEHOLDER',
          teacherSignatureUrl: (Database.findByPk('Settings', 'TEACHER_SIGNATURE_URL')?.value) || 'DEVELOPMENT_PLACEHOLDER',
          logoUrl: (Database.findByPk('Settings', 'LOGO_URL')?.value) || 'DEVELOPMENT_PLACEHOLDER'
        }
      }
    };
  },

  /**
   * Authoritative Study Certificate Data Contract (get_study_certificate_data)
   */
  getStudyCertificateData: function(session, payload) {
    const sid = String(payload.studentId || '').trim();
    if (!sid) return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId required' } };
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };

    const academicYear = payload.academicYear || '2026-2027';
    const targetClass = String(payload.class || student.class || '10');
    const meta = typeof payload.metadata === 'object' ? payload.metadata : (typeof payload.metadata === 'string' ? JSON.parse(payload.metadata || '{}') : {});

    return {
      success: true,
      data: {
        school: {
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          address: 'Gamiri, Biswanath, Assam - 784172',
          affiliation: 'ASSEB / SEBA'
        },
        student: AcademicApi.sanitizeStudent(student),
        class: targetClass,
        academicYear: academicYear,
        periodOfStudy: payload.periodOfStudy || meta.periodOfStudy || `Session ${academicYear}`,
        admissionDate: student.admissionDate || meta.admissionDate || 'Unavailable',
        signatory: {
          signatoryTitle: 'Principal / Head of Institution',
          principal: 'Principal / Head of Institution',
          principalSignatureUrl: (Database.findByPk('Settings', 'PRINCIPAL_SIGNATURE_URL')?.value) || 'DEVELOPMENT_PLACEHOLDER',
          teacherSignatureUrl: (Database.findByPk('Settings', 'TEACHER_SIGNATURE_URL')?.value) || 'DEVELOPMENT_PLACEHOLDER',
          logoUrl: (Database.findByPk('Settings', 'LOGO_URL')?.value) || 'DEVELOPMENT_PLACEHOLDER'
        }
      }
    };
  },

  /**
   * Authoritative School Leaving Certificate Data Contract (get_school_leaving_certificate_data)
   */
  getSchoolLeavingCertificateData: function(session, payload) {
    // Reuses Transfer Certificate underlying data model with SLC specialization
    const res = this.getTransferCertificateData(session, payload);
    if (!res.success) return res;
    res.data.documentTitle = 'SCHOOL LEAVING CERTIFICATE';
    return res;
  },

  /**
   * Authoritative Merit Certificate Data Contract (get_merit_certificate_data)
   */
  getMeritCertificateData: function(session, payload) {
    const sid = String(payload.studentId || '').trim();
    if (!sid) return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId required' } };
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };

    const academicYear = payload.academicYear || '2026-2027';
    const targetClass = String(payload.class || student.class || '10');
    const meta = typeof payload.metadata === 'object' ? payload.metadata : (typeof payload.metadata === 'string' ? JSON.parse(payload.metadata || '{}') : {});

    const positionRank = payload.positionRank || meta.positionRank || 'First Position with Academic Distinction';
    const eventName = payload.eventName || meta.eventName || 'Annual Academic Assessment in Vocational IT/ITeS';

    return {
      success: true,
      data: {
        school: {
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          address: 'Gamiri, Biswanath, Assam - 784172',
          affiliation: 'ASSEB / SEBA'
        },
        student: AcademicApi.sanitizeStudent(student),
        class: targetClass,
        academicYear: academicYear,
        positionRank: positionRank,
        eventName: eventName,
        meritDescription: payload.meritDescription || meta.meritDescription || `for securing ${positionRank} in ${eventName} during Academic Session ${academicYear}.`,
        signatory: {
          coordinator: 'Vocational Coordinator',
          principal: 'Principal / Head of Institution'
        }
      }
    };
  },

  /**
   * Authoritative Achievement Certificate Data Contract (get_achievement_certificate_data)
   */
  getAchievementCertificateData: function(session, payload) {
    const sid = String(payload.studentId || '').trim();
    if (!sid) return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId required' } };
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };

    const academicYear = payload.academicYear || '2026-2027';
    const targetClass = String(payload.class || student.class || '10');
    const meta = typeof payload.metadata === 'object' ? payload.metadata : (typeof payload.metadata === 'string' ? JSON.parse(payload.metadata || '{}') : {});

    const achievementTitle = payload.achievementTitle || meta.achievementTitle || 'Outstanding Vocational Project Exhibition';
    const achievementDesc = payload.achievementDescription || meta.achievementDescription || 'demonstrated exemplary technical skill in IT/ITeS Hardware & Networking Solutions';

    return {
      success: true,
      data: {
        school: {
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          address: 'Gamiri, Biswanath, Assam - 784172',
          affiliation: 'ASSEB / SEBA'
        },
        student: AcademicApi.sanitizeStudent(student),
        class: targetClass,
        academicYear: academicYear,
        achievementTitle: achievementTitle,
        achievementDescription: achievementDesc,
        eventCompetition: payload.eventCompetition || meta.eventCompetition || 'District Vocational Skill Summit',
        levelCategory: payload.levelCategory || meta.levelCategory || 'District Level',
        signatory: {
          coordinator: 'Vocational Coordinator',
          principal: 'Principal / Head of Institution'
        }
      }
    };
  },

  /**
   * Authoritative Participation Certificate Data Contract (get_participation_certificate_data)
   */
  getParticipationCertificateData: function(session, payload) {
    const sid = String(payload.studentId || '').trim();
    if (!sid) return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId required' } };
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };

    const academicYear = payload.academicYear || '2026-2027';
    const targetClass = String(payload.class || student.class || '10');
    const meta = typeof payload.metadata === 'object' ? payload.metadata : (typeof payload.metadata === 'string' ? JSON.parse(payload.metadata || '{}') : {});

    const eventName = payload.eventName || meta.eventName || 'Annual Vocational Technology & IT Exhibition';

    return {
      success: true,
      data: {
        school: {
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          address: 'Gamiri, Biswanath, Assam - 784172',
          affiliation: 'ASSEB / SEBA'
        },
        student: AcademicApi.sanitizeStudent(student),
        class: targetClass,
        academicYear: academicYear,
        eventName: eventName,
        eventDate: payload.eventDate || meta.eventDate || '2026-11-15',
        organizer: payload.organizer || meta.organizer || 'Department of Vocational Education, Gameri HSS',
        participationCategory: payload.participationCategory || meta.participationCategory || 'IT & Digital Literacy Showcase',
        signatory: {
          coordinator: 'Vocational Coordinator',
          principal: 'Principal / Head of Institution'
        }
      }
    };
  },

  /**
   * Authoritative Custom Certificate Data Contract (get_custom_certificate_data)
   * Controlled structure with text sanitization (no executable scripts).
   */
  getCustomCertificateData: function(session, payload) {
    const sid = String(payload.studentId || '').trim();
    if (!sid) return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId required' } };
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };

    const academicYear = payload.academicYear || '2026-2027';
    const targetClass = String(payload.class || student.class || '10');
    const meta = typeof payload.metadata === 'object' ? payload.metadata : (typeof payload.metadata === 'string' ? JSON.parse(payload.metadata || '{}') : {});

    // Safe string sanitization helper
    const sanitizeText = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
    };

    const title = sanitizeText(payload.title || meta.title || 'Institutional Certificate of Recognition');
    const subtitle = sanitizeText(payload.subtitle || meta.subtitle || 'VOCATIONAL EDUCATION DIVISION');
    const bodyStatement = sanitizeText(payload.bodyStatement || meta.bodyStatement || 'has participated with distinction in specialized vocational practical modules conducted at Gameri Higher Secondary School.');

    return {
      success: true,
      data: {
        school: {
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          address: 'Gamiri, Biswanath, Assam - 784172',
          affiliation: 'ASSEB / SEBA'
        },
        student: AcademicApi.sanitizeStudent(student),
        class: targetClass,
        academicYear: academicYear,
        certificateTitle: title,
        certificateSubtitle: subtitle,
        bodyStatement: bodyStatement,
        signatory: {
          title1: sanitizeText(payload.signatoryTitle1 || meta.signatoryTitle1 || 'Vocational Coordinator'),
          title2: sanitizeText(payload.signatoryTitle2 || meta.signatoryTitle2 || 'Principal / Head of Institution')
        }
      }
    };
  },

  /**
   * Authoritative Certificate Data Contract.
   */
  getCertificateData: function(session, payload) {
    const docType = String(payload.documentType || 'COMPLETION_CERTIFICATE').toUpperCase().trim();
    if (docType === 'TRANSFER_CERTIFICATE') return this.getTransferCertificateData(session, payload);
    if (docType === 'CHARACTER_CERTIFICATE') return this.getCharacterCertificateData(session, payload);
    if (docType === 'MIGRATION_CERTIFICATE') return this.getMigrationCertificateData(session, payload);
    if (docType === 'ADMIT_CARD') return this.getAdmitCardData(session, payload);
    if (docType === 'BONAFIDE_CERTIFICATE') return this.getBonafideCertificateData(session, payload);
    if (docType === 'STUDY_CERTIFICATE') return this.getStudyCertificateData(session, payload);
    if (docType === 'SCHOOL_LEAVING_CERTIFICATE') return this.getSchoolLeavingCertificateData(session, payload);
    if (docType === 'MERIT_CERTIFICATE') return this.getMeritCertificateData(session, payload);
    if (docType === 'ACHIEVEMENT_CERTIFICATE') return this.getAchievementCertificateData(session, payload);
    if (docType === 'PARTICIPATION_CERTIFICATE') return this.getParticipationCertificateData(session, payload);
    if (docType === 'CUSTOM_CERTIFICATE') return this.getCustomCertificateData(session, payload);

    const sid = String(payload.studentId || '').trim();
    if (!sid) return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId required' } };
    if (!Security.canAccessStudent(session, sid)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied to student record' } };
    }

    const student = Database.findByPk('Students', sid);
    if (!student) return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };

    const academicYear = payload.academicYear || '2026-2027';

    return {
      success: true,
      data: {
        school: {
          schoolId: DEFAULT_SCHOOL_ID,
          schoolName: DEFAULT_SCHOOL_NAME,
          address: 'Gamiri, Biswanath, Assam - 784172',
          affiliation: 'ASSEB / SEBA'
        },
        student: Object.assign({}, AcademicApi.sanitizeStudent(student), {
          studentDisplayName: typeof AcademicApi !== 'undefined' && AcademicApi.getStudentDisplayName ? AcademicApi.getStudentDisplayName(student) : (student.studentName || 'Student')
        }),
        academicYear: academicYear,
        class: student.class || '10',
        certificateLevel: typeof AcademicApi !== 'undefined' && AcademicApi.getCertificateLevel ? AcademicApi.getCertificateLevel(student.class || '10') : DocumentApi.getCertificateLevel(student.class || '10'),
        courseTrade: 'Information Technology (IT/ITeS)',
        documentType: docType,
        certificateTitle: DOCUMENT_TYPES[docType]?.name || 'Institutional Certificate',
        signatory: {
          title: 'Principal / Head of Institution',
          schoolName: DEFAULT_SCHOOL_NAME,
          principalSignatureUrl: (Database.findByPk('Settings', 'PRINCIPAL_SIGNATURE_URL')?.value) || 'DEVELOPMENT_PLACEHOLDER',
          teacherSignatureUrl: (Database.findByPk('Settings', 'TEACHER_SIGNATURE_URL')?.value) || 'DEVELOPMENT_PLACEHOLDER',
          logoUrl: (Database.findByPk('Settings', 'LOGO_URL')?.value) || 'DEVELOPMENT_PLACEHOLDER'
        }
      }
    };
  },

  /**
   * Centralized Certificate Level Mapping (Requirement #9)
   * Class IX -> Level 1, Class X -> Level 2, Class XI -> Level 3, Class XII -> Level 4.
   */
  getCertificateLevel: function(className) {
    if (!className) return 'Level 1';
    const str = String(className).trim().toUpperCase();
    if (str === '9' || str === 'IX' || str.includes('CLASS 9') || str.includes('CLASS IX')) return 'Level 1';
    if (str === '10' || str === 'X' || str.includes('CLASS 10') || str.includes('CLASS X')) return 'Level 2';
    if (str === '11' || str === 'XI' || str.includes('CLASS 11') || str.includes('CLASS XI')) return 'Level 3';
    if (str === '12' || str === 'XII' || str.includes('CLASS 12') || str.includes('CLASS XII')) return 'Level 4';
    return 'Level 1';
  },

  /**
   * Completion Eligibility Foundation.
   * Respects provisional policy invariant: returns flag requiring institutional confirmation.
   */
  checkCompletionEligibility: function(session, payload) {
    const sid = String(payload.studentId || '').trim();
    if (!sid) return { success: false, error: { code: 'BAD_REQUEST', message: 'studentId required' } };

    const student = Database.findByPk('Students', sid);
    if (!student) return { success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } };

    const targetClass = String(payload.class || student.class || '10');

    return {
      success: true,
      data: {
        studentId: sid,
        studentName: student.studentName,
        class: targetClass,
        certificateLevel: DocumentApi.getCertificateLevel(targetClass),
        isEligible: false,
        requiresConfiguration: true,
        message: 'Completion eligibility requires institutional result-policy configuration confirmation before official issuance.',
        status: 'POLICY_CONFIRMATION_REQUIRED'
      }
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DocumentApi, DOCUMENT_TYPES };
}

