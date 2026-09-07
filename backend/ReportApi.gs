/**
 * VE MANAGEMENT — REPORTS, ANALYTICS & PERFORMANCE DASHBOARD 2.0 API (STEP 12)
 * Institutional Entity: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Authoritative Read/Analytics Layer consuming Students, Staff, Curriculum, Attendance,
 * Examinations, Results, and Academic Documents without creating duplicate data stores.
 */

var ReportApi = {

  /**
   * Retrieves role-scoped Dashboard summary metrics.
   */
  getDashboardSummary: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT', 'PARENT'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized dashboard access' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const todayStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
    const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const activeYear = activeSetting ? String(activeSetting.value).trim() : '2026-2027';

    // 1. Teacher Dashboard Scoping
    if (session.role === 'TEACHER') {
      const staff = Database.findByPk('Staff', session.userId);
      const scope = Security.getTeacherAcademicScope(session.userId, schoolId, activeYear);
      const assignedClasses = scope.classes || [];
      const assignedSubjects = scope.assignedSubjects || [];

      const allStaffAssignments = Database.readAll('StaffAssignments') || [];
      const teacherAssignments = allStaffAssignments.filter(a =>
        String(a.staffId) === String(session.userId) &&
        (!a.academicYear || a.academicYear === activeYear) &&
        (!a.status || a.status === 'ACTIVE' || a.status === 'Active')
      );

      const allStudents = Database.readAll('Students');
      const scopedStudents = allStudents.filter(s => {
        if (!assignedClasses.includes(String(s.class))) return false;
        const allowedSecs = scope.sectionsByClass[String(s.class)];
        if (allowedSecs && allowedSecs.length > 0 && s.section && !allowedSecs.includes(String(s.section))) return false;
        return true;
      });

      const allAttendance = Database.readAll('Attendance');
      const todayAtt = allAttendance.filter(a => a.date === todayStr && assignedClasses.includes(String(a.class)));
      const presentCount = todayAtt.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;

      const theoryCount = teacherAssignments.filter(a => a.component === 'THEORY' || a.component === 'BOTH').length;
      const practicalCount = teacherAssignments.filter(a => a.component === 'PRACTICAL' || a.component === 'BOTH').length;

      return {
        success: true,
        data: {
          role: 'TEACHER',
          userId: session.userId,
          teacherName: staff ? staff.staffName : session.identifier,
          assignedClasses: assignedClasses,
          assignedSubjects: assignedSubjects,
          academicYear: activeYear,
          today: todayStr,
          kpis: {
            totalStudents: scopedStudents.length,
            classesCount: assignedClasses.length,
            activeAssignments: teacherAssignments.length,
            todayPresent: presentCount,
            todayAttendancePct: scopedStudents.length > 0 ? Math.round((presentCount / scopedStudents.length) * 100) : 0
          },
          workload: {
            totalAssignments: teacherAssignments.length,
            theoryComponents: theoryCount,
            practicalComponents: practicalCount,
            classesCount: assignedClasses.length
          },
          sectionsByClass: scope.sectionsByClass,
          classTeacherRoles: scope.classTeacherRoles
        }
      };
    }

    // 2. Student Dashboard
    if (session.role === 'STUDENT') {
      const student = Database.findByPk('Students', session.userId);
      const studentResults = Database.findBy('ExamResults', r => String(r.studentId) === String(session.userId) && r.resultStatus === 'PUBLISHED');
      const studentAtt = Database.findBy('Attendance', a => String(a.studentId) === String(session.userId));
      const presentDays = studentAtt.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;
      const attPct = studentAtt.length > 0 ? Math.round((presentDays / studentAtt.length) * 100) : 100;

      return {
        success: true,
        data: {
          role: 'STUDENT',
          student: AcademicApi.sanitizeStudent(student),
          academicYear: activeYear,
          kpis: {
            attendancePercentage: attPct,
            totalAttendanceDays: studentAtt.length,
            publishedExamsCount: studentResults.length
          },
          recentResults: studentResults.slice(-4).reverse()
        }
      };
    }

    // 3. Parent Dashboard
    if (session.role === 'PARENT') {
      const authorizedIds = Security.getAuthorizedStudentIdsForParent(session.userId, schoolId);
      const students = Database.readAll('Students').filter(s => authorizedIds.includes(String(s.studentId)));

      return {
        success: true,
        data: {
          role: 'PARENT',
          linkedChildrenCount: students.length,
          children: students.map(s => AcademicApi.sanitizeStudent(s)),
          academicYear: activeYear
        }
      };
    }

    // 4. Admin & Principal (School-Wide Scope)
    const allStudents = Database.readAll('Students').filter(s => !s.schoolId || s.schoolId === schoolId);
    const activeStudents = allStudents.filter(s => (s.status || 'Active').toLowerCase() !== 'inactive');
    const allStaff = Database.readAll('Staff').filter(s => !s.schoolId || s.schoolId === schoolId);
    const allExams = Database.readAll('Examinations').filter(e => !e.schoolId || e.schoolId === schoolId);
    const allResults = Database.readAll('ExamResults').filter(r => !r.schoolId || r.schoolId === schoolId);
    const allAttendance = Database.readAll('Attendance').filter(a => !a.schoolId || a.schoolId === schoolId);

    const todayAtt = allAttendance.filter(a => a.date === todayStr);
    const presentToday = todayAtt.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;
    const overallAttPct = allAttendance.length > 0
      ? Math.round((allAttendance.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length / allAttendance.length) * 100)
      : 100;

    const publishedExams = allExams.filter(e => e.status === 'PUBLISHED');
    const openExams = allExams.filter(e => e.status === 'OPEN');
    const lockedExams = allExams.filter(e => e.status === 'LOCKED');

    return {
      success: true,
      data: {
        role: session.role,
        academicYear: activeYear,
        today: todayStr,
        kpis: {
          totalStudents: allStudents.length,
          activeStudents: activeStudents.length,
          totalStaff: allStaff.length,
          activeClassesCount: 4, // 9, 10, 11, 12
          overallAttendancePercentage: overallAttPct,
          todayAttendancePercentage: activeStudents.length > 0 ? Math.round((presentToday / activeStudents.length) * 100) : 0,
          totalExaminations: allExams.length,
          openExaminations: openExams.length,
          lockedExaminations: lockedExams.length,
          publishedExaminations: publishedExams.length,
          totalCalculatedResults: allResults.length
        },
        classDistribution: {
          '9': allStudents.filter(s => String(s.class) === '9').length,
          '10': allStudents.filter(s => String(s.class) === '10').length,
          '11': allStudents.filter(s => String(s.class) === '11').length,
          '12': allStudents.filter(s => String(s.class) === '12').length
        }
      }
    };
  },

  /**
   * Authoritative Student Analytics Breakdown.
   */
  getStudentAnalytics: function(session, query) {
    if (!session || !['ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin or Principal role required for school-wide student analytics' } };
    }

    query = query || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    let students = Database.readAll('Students').filter(s => !s.schoolId || s.schoolId === schoolId);

    if (query.class) students = students.filter(s => String(s.class) === String(query.class));
    if (query.section) students = students.filter(s => String(s.section || 'A').toUpperCase() === String(query.section).toUpperCase());
    if (query.stream) students = students.filter(s => String(s.stream || '').toLowerCase().includes(String(query.stream).toLowerCase()));

    const total = students.length;
    const active = students.filter(s => (s.status || 'Active').toLowerCase() === 'active').length;
    const inactive = students.filter(s => (s.status || '').toLowerCase() === 'inactive').length;
    const completed = students.filter(s => (s.status || '').toLowerCase() === 'completed').length;
    const transferred = students.filter(s => (s.status || '').toLowerCase() === 'transferred').length;

    const byClass = {};
    const bySection = {};
    const byStream = {};

    students.forEach(s => {
      const cls = String(s.class || 'Unassigned');
      const sec = `${cls}-${s.section || 'A'}`;
      const strm = s.stream || 'Vocational IT/ITeS';

      byClass[cls] = (byClass[cls] || 0) + 1;
      bySection[sec] = (bySection[sec] || 0) + 1;
      byStream[strm] = (byStream[strm] || 0) + 1;
    });

    return {
      success: true,
      data: {
        summary: {
          totalStudents: total,
          activeStudents: active,
          inactiveStudents: inactive,
          completedStudents: completed,
          transferredStudents: transferred
        },
        breakdowns: {
          byClass: byClass,
          bySection: bySection,
          byStream: byStream
        }
      }
    };
  },

  /**
   * Authoritative Class Analytics.
   */
  getClassAnalytics: function(session, query) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied for class analytics' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const activeSetting = Database.findByPk('Settings', 'ACADEMIC_YEAR');
    const academicYear = query.academicYear || (activeSetting ? String(activeSetting.value).trim() : '2026-2027');
    const classes = query.class ? [String(query.class)] : ['9', '10', '11', '12'];

    const allStudents = Database.readAll('Students');
    const allAttendance = Database.readAll('Attendance');
    const allResults = Database.readAll('ExamResults');

    const classSummaries = classes.map(cls => {
      const clsStudents = allStudents.filter(s => String(s.class) === cls && (!s.schoolId || s.schoolId === schoolId));
      const clsAtt = allAttendance.filter(a => String(a.class) === cls && (!a.academicYear || a.academicYear === academicYear));
      const presentCount = clsAtt.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;
      const attPct = clsAtt.length > 0 ? Math.round((presentCount / clsAtt.length) * 100) : (clsStudents.length > 0 ? 100 : 0);

      const clsResults = allResults.filter(r => String(r.class) === cls && (!r.academicYear || r.academicYear === academicYear));
      const evaluatedCount = clsResults.length;
      const passedCount = clsResults.filter(r => r.resultStatus === 'PASSED' || r.resultStatus === 'PUBLISHED').length;
      const needsImprovementCount = clsResults.filter(r => r.resultStatus === 'NEEDS_IMPROVEMENT').length;
      const avgResultPct = evaluatedCount > 0
        ? parseFloat((clsResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / evaluatedCount).toFixed(2))
        : 0;

      return {
        class: cls,
        totalStudents: clsStudents.length,
        attendancePercentage: attPct,
        totalAttendanceRecords: clsAtt.length,
        evaluatedResultsCount: evaluatedCount,
        passedResultsCount: passedCount,
        needsImprovementCount: needsImprovementCount,
        averageResultPercentage: avgResultPct
      };
    });

    return {
      success: true,
      data: {
        academicYear: academicYear,
        classes: classSummaries
      }
    };
  },

  /**
   * Authoritative Low Attendance Report.
   */
  getLowAttendanceReport: function(session, query) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied for low attendance report' } };
    }

    query = query || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const thresholdSetting = Database.findByPk('Settings', 'ATTENDANCE_ALERT_THRESHOLD');
    const isThresholdConfigured = thresholdSetting && thresholdSetting.value && !isNaN(parseInt(thresholdSetting.value, 10));
    const thresholdPct = isThresholdConfigured ? parseInt(thresholdSetting.value, 10) : null;

    if (!isThresholdConfigured) {
      return {
        success: true,
        data: {
          isConfigured: false,
          policyStatus: 'CONFIGURED_NOT_LIVE',
          statusMessage: 'Threshold not configured. Requires Institutional Approval for official attendance threshold.',
          students: []
        }
      };
    }

    let students = Database.readAll('Students').filter(s => !s.schoolId || s.schoolId === schoolId);
    if (session.role === 'TEACHER') {
      const scope = Security.getTeacherAcademicScope(session.userId, schoolId);
      students = students.filter(s => scope.classes.includes(String(s.class)));
    }

    const allAttendance = Database.readAll('Attendance');
    const lowAttendanceList = [];

    students.forEach(s => {
      const sid = String(s.studentId);
      const stuAtt = allAttendance.filter(a => String(a.studentId) === sid);
      const totalDays = stuAtt.length;
      if (totalDays > 0) {
        const presentDays = stuAtt.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;
        const pct = Math.round((presentDays / totalDays) * 100);
        if (pct < thresholdPct) {
          lowAttendanceList.push({
            studentId: sid,
            studentName: s.studentName,
            class: s.class,
            section: s.section || 'A',
            rollNo: s.rollNo || '',
            totalDays: totalDays,
            presentDays: presentDays,
            absentDays: totalDays - presentDays,
            attendancePercentage: pct,
            threshold: thresholdPct
          });
        }
      }
    });

    return {
      success: true,
      data: {
        isConfigured: true,
        threshold: thresholdPct,
        totalLowAttendanceStudents: lowAttendanceList.length,
        students: lowAttendanceList
      }
    };
  },

  /**
   * Subject Performance Analytics across examinations.
   */
  getSubjectPerformanceReport: function(session, query) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied for subject performance analytics' } };
    }

    query = query || {};
    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const allMarks = Database.readAll('Marks').filter(m => !m.schoolId || m.schoolId === schoolId);

    const subjectsMap = {};

    allMarks.forEach(m => {
      const sub = String(m.subject || 'General');
      if (query.class && String(m.class) !== String(query.class)) return;
      if (query.exam && !String(m.exam || '').toLowerCase().includes(String(query.exam).toLowerCase())) return;

      if (!subjectsMap[sub]) {
        subjectsMap[sub] = {
          subjectName: sub,
          totalEntries: 0,
          totalTheoryMarks: 0,
          totalPracticalMarks: 0,
          totalCombinedMarks: 0,
          maxMarksSum: 0,
          passCount: 0,
          scores: []
        };
      }

      const t = parseInt(m.theory, 10) || 0;
      const p = parseInt(m.practical, 10) || 0;
      const tot = t + p;
      const maxM = parseInt(m.maxMarks, 10) || 100;

      subjectsMap[sub].totalEntries++;
      subjectsMap[sub].totalTheoryMarks += t;
      subjectsMap[sub].totalPracticalMarks += p;
      subjectsMap[sub].totalCombinedMarks += tot;
      subjectsMap[sub].maxMarksSum += maxM;
      subjectsMap[sub].scores.push(tot);
      if (tot >= Math.round(maxM * 0.30)) {
        subjectsMap[sub].passCount++;
      }
    });

    const report = Object.values(subjectsMap).map(s => {
      const avg = s.totalEntries > 0 ? parseFloat((s.totalCombinedMarks / s.totalEntries).toFixed(2)) : 0;
      const highest = s.scores.length > 0 ? Math.max(...s.scores) : 0;
      const lowest = s.scores.length > 0 ? Math.min(...s.scores) : 0;
      const passPct = s.totalEntries > 0 ? parseFloat(((s.passCount / s.totalEntries) * 100).toFixed(2)) : 0;

      return {
        subjectName: s.subjectName,
        evaluatedStudents: s.totalEntries,
        averageScore: avg,
        highestScore: highest,
        lowestScore: lowest,
        passCount: s.passCount,
        needsImprovementCount: s.totalEntries - s.passCount,
        passPercentage: passPct
      };
    });

    return {
      success: true,
      data: {
        subjects: report,
        totalSubjects: report.length
      }
    };
  },

  /**
   * Teacher Workload Report.
   * Strictly labeled as Workload (not Teacher Quality / Rating / Performance).
   */
  getTeacherWorkloadReport: function(session, query) {
    if (!session || !['ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin or Principal role required for teacher workload report' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const allStaff = Database.readAll('Staff').filter(s => (!s.schoolId || s.schoolId === schoolId) && (s.role === 'TEACHER' || s.role === 'Teacher'));
    const allAssignments = Database.readAll('StaffAssignments').filter(a => !a.schoolId || a.schoolId === schoolId);

    const workloadList = allStaff.map(t => {
      const sid = String(t.staffId);
      const assignments = allAssignments.filter(a => String(a.staffId) === sid && (!a.status || a.status === 'ACTIVE' || a.status === 'Active'));
      const classes = Array.from(new Set(assignments.map(a => String(a.class))));
      const subjects = Array.from(new Set(assignments.map(a => String(a.subject))));
      const theoryAssignments = assignments.filter(a => a.component === 'THEORY' || a.component === 'BOTH').length;
      const practicalAssignments = assignments.filter(a => a.component === 'PRACTICAL' || a.component === 'BOTH').length;

      return {
        staffId: sid,
        teacherName: t.staffName || 'Teacher',
        designation: t.designation || 'Vocational Teacher',
        department: t.department || 'Vocational Education',
        assignedClasses: classes,
        assignedSubjects: subjects,
        totalAssignmentsCount: assignments.length,
        theoryAssignmentsCount: theoryAssignments,
        practicalAssignmentsCount: practicalAssignments,
        metricLabel: 'Academic Workload Summary'
      };
    });

    return {
      success: true,
      data: {
        workloadReport: workloadList,
        totalTeachers: workloadList.length
      }
    };
  },

  /**
   * Cross Academic-Year Performance Comparison.
   */
  getAcademicYearComparison: function(session, query) {
    if (!session || !['ADMIN', 'PRINCIPAL'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin or Principal role required for academic year comparison' } };
    }

    const schoolId = session.schoolId || DEFAULT_SCHOOL_ID;
    const years = ['2024-2025', '2025-2026', '2026-2027'];
    const allStudents = Database.readAll('Students');
    const allAttendance = Database.readAll('Attendance');
    const allResults = Database.readAll('ExamResults');

    const yearReports = years.map(yr => {
      const yrAtt = allAttendance.filter(a => a.academicYear === yr);
      const presentCount = yrAtt.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;
      const attPct = yrAtt.length > 0 ? Math.round((presentCount / yrAtt.length) * 100) : null;

      const yrResults = allResults.filter(r => r.academicYear === yr);
      const evalCount = yrResults.length;
      const passCount = yrResults.filter(r => r.resultStatus === 'PASSED' || r.resultStatus === 'PUBLISHED').length;
      const avgPct = evalCount > 0 ? parseFloat((yrResults.reduce((a, b) => a + (b.percentage || 0), 0) / evalCount).toFixed(2)) : null;

      return {
        academicYear: yr,
        hasData: yrAtt.length > 0 || yrResults.length > 0,
        attendancePercentage: attPct !== null ? attPct : 'Partial Data / No Data',
        evaluatedResultsCount: evalCount,
        passedResultsCount: passCount,
        averageResultPercentage: avgPct !== null ? avgPct : 'Partial Data / No Data',
        comparisonLabel: 'Performance Comparison'
      };
    });

    return {
      success: true,
      data: {
        comparison: yearReports
      }
    };
  },

  /**
   * Safe CSV Export with spreadsheet formula injection protection.
   */
  exportReportData: function(session, payload) {
    if (!session || !['ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Permission denied to export reports' } };
    }

    payload = payload || {};
    const reportType = String(payload.reportType || 'STUDENTS').toUpperCase();
    const rows = Array.isArray(payload.rows) ? payload.rows : [];

    if (rows.length === 0) {
      return { success: false, error: { code: 'NO_DATA', message: 'No rows available for export' } };
    }

    // Formula Injection Sanitization Helper
    const sanitizeValue = function(val) {
      if (val === null || val === undefined) return '';
      let str = String(val);
      // If starts with dangerous spreadsheet formula triggers, prefix with single quote
      if (/^[=\+\-@]/.test(str)) {
        str = "'" + str;
      }
      // Escape quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = Object.keys(rows[0]);
    const csvLines = [headers.map(sanitizeValue).join(',')];

    rows.forEach(r => {
      const line = headers.map(h => sanitizeValue(r[h])).join(',');
      csvLines.push(line);
    });

    const csvContent = csvLines.join('\r\n');

    Audit.log('REPORT_EXPORTED', session.role, session.userId, {
      reportType: reportType,
      rowsCount: rows.length
    }, 'SUCCESS', '', session.schoolId || DEFAULT_SCHOOL_ID);

    return {
      success: true,
      data: {
        reportType: reportType,
        mimeType: 'text/csv;charset=utf-8;',
        fileName: `${reportType.toLowerCase()}_report_${Date.now()}.csv`,
        csvContent: csvContent,
        rowsCount: rows.length
      }
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ReportApi };
}
