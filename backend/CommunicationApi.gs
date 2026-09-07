/**
 * VE MANAGEMENT — NOTICES, COMMUNICATION & SCHOOL CALENDAR 2.0 API (STEP 13)
 * Institutional Entity: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Authoritative Communication & Calendar Subsystem consolidating Notices, Targeting,
 * Read/Acknowledgement Tracking, and Exam/Event Calendar integration without duplicating
 * academic master data.
 */

var CommunicationApi = {

  /**
   * Retrieves notices filtered by caller's role, academic scope, and publication status.
   */
  getNotices: function(session, query) {
    query = query || {};
    const schoolId = session?.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const todayDate = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');

    const allNotices = Database.readAll('Notices').filter(n => !n.schoolId || n.schoolId === schoolId);
    let filtered = Security.filterNoticesForSession(session, allNotices);

    // Filter by academicYear if supplied
    if (query.academicYear) {
      filtered = filtered.filter(n => !n.academicYear || n.academicYear === query.academicYear);
    }

    // Filter by priority
    if (query.priority && query.priority !== 'ALL') {
      filtered = filtered.filter(n => (n.priority || 'NORMAL').toUpperCase() === String(query.priority).toUpperCase());
    }

    // Filter by noticeType
    if (query.noticeType && query.noticeType !== 'ALL') {
      filtered = filtered.filter(n => (n.noticeType || 'GENERAL').toUpperCase() === String(query.noticeType).toUpperCase());
    }

    // Filter by class
    if (query.class && query.class !== 'All' && query.class !== 'ALL') {
      filtered = filtered.filter(n => !n.class || n.class === 'All' || String(n.class) === String(query.class));
    }

    // Filter by section
    if (query.section && query.section !== 'All') {
      filtered = filtered.filter(n => !n.section || n.section === 'All' || String(n.section).toUpperCase() === String(query.section).toUpperCase());
    }

    // Filter by search query
    if (query.search) {
      const q = String(query.search).toLowerCase().trim();
      filtered = filtered.filter(n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.body && n.body.toLowerCase().includes(q)) ||
        (n.summary && n.summary.toLowerCase().includes(q))
      );
    }

    // Sort highlighted notices first, then newest date
    filtered.sort((a, b) => {
      const aHigh = a.isHighlighted === true || a.isHighlighted === 'true' || a.highlighted === true ? 1 : 0;
      const bHigh = b.isHighlighted === true || b.isHighlighted === 'true' || b.highlighted === true ? 1 : 0;
      if (aHigh !== bHigh) return bHigh - aHigh;
      return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
    });

    // Enrich with read / acknowledgement status if session user is present
    if (session && session.userId) {
      const allInteractions = Database.readAll('NoticeInteractions');
      filtered = filtered.map(n => {
        const inter = allInteractions.find(i => String(i.noticeId) === String(n.noticeId) && String(i.userId) === String(session.userId));
        return Object.assign({}, n, {
          isRead: inter ? inter.isRead === true || inter.isRead === 'true' : false,
          isAcknowledged: inter ? inter.isAcknowledged === true || inter.isAcknowledged === 'true' : false,
          isHighlighted: n.isHighlighted === true || n.isHighlighted === 'true' || n.highlighted === true || n.highlighted === 'true'
        });
      });
    }

    return {
      success: true,
      data: {
        notices: filtered,
        total: filtered.length
      }
    };
  },

  /**
   * Creates or updates notices with strict teacher scoping and lifecycle handling.
   */
  saveNotices: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Write permission denied for Notices' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const todayDate = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
    const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const defaultAcademicYear = activeSetting ? String(activeSetting.value).trim() : '2026-2027';

    payload = payload || {};
    const rawList = Array.isArray(payload.notices) ? payload.notices : [payload];

    if (rawList.length === 0) {
      return { success: true, message: 'No notices provided', data: { records: [] } };
    }

    // Validate Teacher Scoping
    for (let i = 0; i < rawList.length; i++) {
      const n = rawList[i];
      if (session.role === 'TEACHER') {
        const targetClass = n.class || '';
        if (!targetClass || targetClass === 'All' || !Security.canAccessClass(session, targetClass)) {
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: `Teacher can only publish notices targeted to their assigned classes (unauthorized target: ${targetClass || 'School-Wide'})`
            }
          };
        }
      }
    }

    const records = rawList.map(n => {
      const noticeId = n.noticeId || Auth.generateId('NOTIC');
      const initialStatus = n.status || 'PUBLISHED';

      return {
        noticeId: noticeId,
        schoolId: schoolId,
        academicYear: n.academicYear || defaultAcademicYear,
        title: String(n.title || 'Notice').trim(),
        summary: String(n.summary || '').trim(),
        body: String(n.body || n.content || '').trim(),
        date: n.date || todayDate,
        priority: (n.priority || 'NORMAL').toUpperCase(),
        isHighlighted: n.isHighlighted === true || n.isHighlighted === 'true' || n.highlighted === true || n.highlighted === 'true',
        visibility: (n.visibility || (n.class ? 'CLASS' : 'ALL')).toUpperCase(),
        noticeType: (n.noticeType || 'GENERAL').toUpperCase(),
        audienceType: n.audienceType || (n.class ? 'CLASS' : 'ALL'),
        class: n.class || '',
        section: n.section || '',
        stream: n.stream || '',
        studentScope: n.studentScope || '',
        staffScope: n.staffScope || '',
        status: initialStatus,
        publishAt: n.publishAt || null,
        expiryAt: n.expiryAt || null,
        publishedBy: initialStatus === 'PUBLISHED' ? session.userId : null,
        createdBy: n.createdBy || session.userId,
        isAcknowledgementRequired: n.isAcknowledgementRequired === true || n.isAcknowledgementRequired === 'true',
        attachmentUrl: n.attachmentUrl || '',
        createdAt: n.createdAt || nowStr,
        updatedAt: nowStr
      };
    });

    Database.upsertBatch('Notices', records);

    Audit.log('SAVE_NOTICES', session.role, session.userId, {
      count: records.length,
      noticeIds: records.map(r => r.noticeId)
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Saved ${records.length} notice(s) successfully`,
      data: {
        records: records
      }
    };
  },

  /**
   * Sets lifecycle state for a notice (DRAFT, REVIEW, PUBLISHED, EXPIRED, ARCHIVED).
   */
  setNoticeStatus: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to update notice status' } };
    }

    payload = payload || {};
    const noticeId = String(payload.noticeId || payload.id || '').trim();
    const newStatus = String(payload.status || '').toUpperCase().trim();

    const validStatuses = ['DRAFT', 'REVIEW', 'PUBLISHED', 'EXPIRED', 'ARCHIVED'];
    if (!noticeId || !validStatuses.includes(newStatus)) {
      return { success: false, error: { code: 'BAD_REQUEST', message: `Invalid noticeId or status (allowed: ${validStatuses.join(', ')})` } };
    }

    const notice = Database.findByPk('Notices', noticeId);
    if (!notice) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Notice not found' } };
    }

    if (session.role === 'TEACHER') {
      if (notice.createdBy !== session.userId && (!notice.class || !Security.canAccessClass(session, notice.class))) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Teacher can only update own notices or assigned class notices' } };
      }
    }

    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    notice.status = newStatus;
    if (newStatus === 'PUBLISHED' && !notice.publishedBy) {
      notice.publishedBy = session.userId;
    }
    notice.updatedAt = nowStr;

    Database.upsertBatch('Notices', [notice]);

    Audit.log('SET_NOTICE_STATUS', session.role, session.userId, {
      noticeId: noticeId,
      newStatus: newStatus
    }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: `Notice status updated to ${newStatus}`,
      data: { notice: notice }
    };
  },

  /**
   * Deletes a notice.
   */
  deleteNotice: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to delete notice' } };
    }

    payload = payload || {};
    const noticeId = String(payload.noticeId || payload.id || '').trim();
    if (!noticeId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'noticeId is required' } };
    }

    const notice = Database.findByPk('Notices', noticeId);
    if (!notice) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Notice not found' } };
    }

    if (session.role === 'TEACHER') {
      if (notice.createdBy !== session.userId && (!notice.class || !Security.canAccessClass(session, notice.class))) {
        return { success: false, error: { code: 'UNAUTHORIZED', message: 'Teacher cannot delete notice outside authorized scope' } };
      }
    }

    notice.status = 'ARCHIVED';
    notice.updatedAt = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    Database.upsertBatch('Notices', [notice]);

    Audit.log('NOTICE_ARCHIVED', session.role, session.userId, { noticeId: noticeId }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: 'Notice archived successfully',
      data: { noticeId: noticeId }
    };
  },

  /**
   * Records a user reading a notice.
   */
  recordNoticeRead: function(session, payload) {
    if (!session || !session.userId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Session user required' } };
    }

    payload = payload || {};
    const noticeId = String(payload.noticeId || '').trim();
    if (!noticeId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'noticeId is required' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const interactionId = `INTER_${noticeId}_${session.userId}`;

    const interaction = {
      interactionId: interactionId,
      schoolId: schoolId,
      noticeId: noticeId,
      userId: session.userId,
      role: session.role,
      isRead: true,
      readAt: nowStr,
      updatedAt: nowStr
    };

    Database.upsertBatch('NoticeInteractions', [interaction]);

    return {
      success: true,
      data: { interaction: interaction }
    };
  },

  /**
   * Records user acknowledgement for a notice requiring confirmation.
   */
  acknowledgeNotice: function(session, payload) {
    if (!session || !session.userId) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Session user required' } };
    }

    payload = payload || {};
    const noticeId = String(payload.noticeId || '').trim();
    if (!noticeId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'noticeId is required' } };
    }

    const notice = Database.findByPk('Notices', noticeId);
    if (!notice) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Notice not found' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const interactionId = `INTER_${noticeId}_${session.userId}`;

    let inter = Database.findByPk('NoticeInteractions', interactionId);
    if (!inter) {
      inter = {
        interactionId: interactionId,
        schoolId: schoolId,
        noticeId: noticeId,
        userId: session.userId,
        role: session.role,
        isRead: true,
        readAt: nowStr
      };
    }

    inter.isAcknowledged = true;
    inter.acknowledgedAt = nowStr;
    inter.updatedAt = nowStr;

    Database.upsertBatch('NoticeInteractions', [inter]);

    Audit.log('NOTICE_ACKNOWLEDGED', session.role, session.userId, { noticeId: noticeId }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: 'Notice acknowledged successfully',
      data: { interaction: inter }
    };
  },

  /**
   * Retrieves academic calendar merged with examination timetables.
   */
  getCalendar: function(session, query) {
    query = query || {};
    const schoolId = session?.schoolId || DEFAULT_SCHOOL_ID;
    const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const defaultAcademicYear = activeSetting ? String(activeSetting.value).trim() : '2026-2027';
    const academicYear = query.academicYear || defaultAcademicYear;

    let calEvents = Database.readAll('Calendar').filter(c => !c.schoolId || c.schoolId === schoolId);
    if (academicYear) {
      calEvents = calEvents.filter(c => !c.academicYear || c.academicYear === academicYear || !c.academicSession || c.academicSession === academicYear);
    }

    // If query by class
    if (query.class && query.class !== 'All') {
      calEvents = calEvents.filter(c => !c.classScope || c.classScope === 'ALL' || c.classScope === 'All' || String(c.classScope) === String(query.class));
    }

    // Merge Examination Schedules (Step 11 ExamSchedules)
    const examSchedules = Database.readAll('ExamSchedules').filter(s =>
      (!s.schoolId || s.schoolId === schoolId) &&
      (!s.academicYear || s.academicYear === academicYear) &&
      (!query.class || query.class === 'All' || String(s.class) === String(query.class))
    );

    const mappedExamEvents = examSchedules.map(es => {
      return {
        calendarId: `CAL_EXAM_${es.scheduleId}`,
        schoolId: schoolId,
        academicYear: es.academicYear,
        date: es.examDate,
        startDate: es.examDate,
        endDate: es.examDate,
        title: `Exam: Class ${es.class} - ${es.subjectName || es.subjectCode}`,
        description: `Component: ${es.component || 'Theory'} | Time: ${es.startTime || ''} - ${es.endTime || ''} | Venue: ${es.venue || 'Main Hall'}`,
        eventType: 'EXAMINATION',
        classScope: es.class,
        sectionScope: es.section || 'ALL',
        streamScope: '',
        examId: es.examId,
        scheduleId: es.scheduleId,
        officialStatus: 'Scheduled',
        isWorking: true,
        status: 'PUBLISHED',
        source: 'ExamSchedules',
        updatedAt: es.updatedAt
      };
    });

    const combined = calEvents.concat(mappedExamEvents);

    // Sort by date ascending
    combined.sort((a, b) => new Date(a.date || a.startDate || 0) - new Date(b.date || b.startDate || 0));

    return {
      success: true,
      data: {
        academicYear: academicYear,
        events: combined,
        calendar: combined,
        total: combined.length
      }
    };
  },

  /**
   * Creates or updates academic calendar events.
   */
  saveCalendarEvents: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can manage academic calendar events' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const defaultAcademicYear = activeSetting ? String(activeSetting.value).trim() : '2026-2027';

    payload = payload || {};
    const rawEvents = Array.isArray(payload.events) ? payload.events : [payload];

    if (rawEvents.length === 0) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'No calendar events provided' } };
    }

    const records = rawEvents.map(e => {
      const calId = e.calendarId || Auth.generateId('CAL');
      return {
        calendarId: calId,
        schoolId: schoolId,
        academicYear: e.academicYear || defaultAcademicYear,
        academicSession: e.academicSession || defaultAcademicYear,
        date: e.date || e.startDate || Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd'),
        startDate: e.startDate || e.date || '',
        endDate: e.endDate || e.date || '',
        title: String(e.title || 'Event').trim(),
        description: String(e.description || '').trim(),
        eventType: (e.eventType || 'EVENT').toUpperCase(),
        classScope: e.classScope || e.class || 'ALL',
        sectionScope: e.sectionScope || e.section || 'ALL',
        streamScope: e.streamScope || '',
        examId: e.examId || '',
        scheduleId: e.scheduleId || '',
        officialStatus: e.officialStatus || 'Active',
        isWorking: e.isWorking !== undefined
          ? (e.isWorking === true || e.isWorking === 'true')
          : ((e.eventType || '').toUpperCase() !== 'HOLIDAY'),
        status: e.status || 'PUBLISHED',
        source: 'MANUAL',
        createdBy: e.createdBy || session.userId,
        createdAt: e.createdAt || nowStr,
        updatedAt: nowStr
      };
    });

    Database.upsertBatch('Calendar', records);

    Audit.log('CALENDAR_EVENT_CREATED', session.role, session.userId, {
      count: records.length,
      calendarIds: records.map(r => r.calendarId)
    }, 'SUCCESS', '', schoolId);

    return {
      success: true,
      message: `Saved ${records.length} calendar event(s) successfully`,
      data: { records: records }
    };
  },

  /**
   * Deletes / archives a calendar event.
   */
  deleteCalendarEvent: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Only Admin or Principal can delete calendar events' } };
    }

    payload = payload || {};
    const calendarId = String(payload.calendarId || payload.id || '').trim();
    if (!calendarId) {
      return { success: false, error: { code: 'BAD_REQUEST', message: 'calendarId is required' } };
    }

    const event = Database.findByPk('Calendar', calendarId);
    if (!event) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Calendar event not found' } };
    }

    event.status = 'ARCHIVED';
    event.updatedAt = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
    Database.upsertBatch('Calendar', [event]);

    Audit.log('CALENDAR_EVENT_ARCHIVED', session.role, session.userId, { calendarId: calendarId }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      message: 'Calendar event archived successfully',
      data: { calendarId: calendarId }
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CommunicationApi };
}
