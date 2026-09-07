import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';
import { sendApiRequest } from '../../api/client';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  AlertCircle,
  Users,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  FileText,
  Bell,
  TrendingUp,
  Filter,
  ArrowUpRight
} from 'lucide-react';

const EXAM_TYPES = [
  { value: '1st Unit Test', label: '1st Unit Test' },
  { value: 'Half Yearly Examination', label: 'Half Yearly Examination' },
  { value: '2nd Unit Test', label: '2nd Unit Test' },
  { value: 'Final Examination', label: 'Final Examination' }
];

export default function Reports({ onNavigate }) {
  const { user, isTeacher, isPrincipal } = useAuth();

  // Class Selection & Scoping
  const availableClasses = useMemo(() => {
    if (isTeacher) {
      return user?.assignedClasses && user.assignedClasses.length > 0 ? user.assignedClasses : ['9', '10'];
    }
    return ['All', '9', '10', '11', '12'];
  }, [isTeacher, user]);

  const [selectedClass, setSelectedClass] = useState(() => (isTeacher ? availableClasses[0] || '9' : 'All'));

  // Subject Selection & Scoping
  const availableSubjects = useMemo(() => {
    if (isTeacher) {
      return user?.assignedSubjects && user.assignedSubjects.length > 0
        ? user.assignedSubjects
        : ['IT/ITeS'];
    }
    return ['All', 'IT/ITeS', 'Retail', 'General Science', 'Mathematics', 'English', 'Assamese'];
  }, [isTeacher, user]);

  const [selectedSubject, setSelectedSubject] = useState(() => (isTeacher ? availableSubjects[0] || 'IT/ITeS' : 'All'));
  const [selectedExam, setSelectedExam] = useState('1st Unit Test');

  // Date Range Filter
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Active Report Tab
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'marks' | 'students' | 'activities' | 'assignments' | 'notices'

  // Data States
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notices, setNotices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load All Relevant Data for Analytics
  const loadReportsData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    // Validate Date Range
    if (startDate && endDate && startDate > endDate) {
      setError('Start Date cannot be later than End Date.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const classQuery = selectedClass !== 'All' ? { class: selectedClass } : {};
      const subjectQuery = selectedSubject !== 'All' ? { subject: selectedSubject } : {};

      // Batch Fetch
      const [stuRes, attRes, mrkRes, actRes, asgRes, ntcRes] = await Promise.all([
        sendApiRequest('get_students', classQuery),
        sendApiRequest('get_attendance', classQuery),
        sendApiRequest('get_marks', { ...classQuery, ...subjectQuery, exam: selectedExam }),
        sendApiRequest('get_activities', { ...classQuery, ...subjectQuery }),
        sendApiRequest('get_assignments', { ...classQuery, ...subjectQuery }),
        sendApiRequest('get_notices', classQuery)
      ]);

      setStudents(stuRes?.data?.students || []);
      setAttendance(attRes?.data?.attendance || []);
      setMarks(mrkRes?.data?.marks || []);
      setActivities(actRes?.data?.activities || []);
      setAssignments(asgRes?.data?.assignments || []);
      setNotices(ntcRes?.data?.notices || []);
    } catch (err) {
      setError('Unable to compile reports and analytics. Please check network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, [selectedClass, selectedSubject, selectedExam, startDate, endDate]);

  // -------------------------------------------------------------
  // ATTENDANCE ANALYTICS CALCULATIONS
  // -------------------------------------------------------------
  const attendanceAnalytics = useMemo(() => {
    const filteredAtt = attendance.filter((a) => {
      if (startDate && a.date < startDate) return false;
      if (endDate && a.date > endDate) return false;
      return true;
    });

    const datesRecorded = [...new Set(filteredAtt.map((a) => a.date))];
    const totalWorkingDays = datesRecorded.length;
    const totalPossibleRecords = totalWorkingDays * (students.length || 1);
    const presentRecords = filteredAtt.filter((a) => a.status === 'PRESENT').length;
    const overallRate = totalPossibleRecords > 0 ? Math.round((presentRecords / totalPossibleRecords) * 100) : 0;

    // Student-wise Attendance Rates & Streaks
    const studentStats = students.map((s) => {
      const sRecords = filteredAtt.filter((a) => a.studentId === s.studentId);
      const sPresent = sRecords.filter((a) => a.status === 'PRESENT').length;
      const sTotal = totalWorkingDays || 1;
      const sRate = totalWorkingDays > 0 ? Math.round((sPresent / sTotal) * 100) : 100;

      // Absence streak on recent recorded dates (sorted newest first)
      const sortedDates = [...datesRecorded].sort((a, b) => new Date(b) - new Date(a));
      let streak = 0;
      for (const d of sortedDates) {
        const rec = filteredAtt.find((a) => a.studentId === s.studentId && a.date === d);
        if (rec && rec.status === 'ABSENT') {
          streak++;
        } else {
          break;
        }
      }

      let health = 'GOOD';
      if (sRate < 60) health = 'AT_RISK';
      else if (sRate < 75) health = 'ATTENTION';

      return {
        ...s,
        presentDays: sPresent,
        totalDays: totalWorkingDays,
        rate: sRate,
        streak,
        health
      };
    });

    const atRiskStudents = studentStats.filter((s) => s.health === 'AT_RISK' || s.streak >= 3);
    atRiskStudents.sort((a, b) => b.streak - a.streak || a.rate - b.rate);

    // Class Comparisons
    const classComparison = ['9', '10', '11', '12']
      .filter((cls) => availableClasses.includes('All') || availableClasses.includes(cls))
      .map((cls) => {
        const clsStudents = students.filter((s) => String(s.class) === cls);
        const clsAtt = filteredAtt.filter((a) => String(a.class) === cls);
        const clsPresent = clsAtt.filter((a) => a.status === 'PRESENT').length;
        const clsTotal = (totalWorkingDays * (clsStudents.length || 1)) || 1;
        const clsRate = totalWorkingDays > 0 ? Math.round((clsPresent / clsTotal) * 100) : 0;
        return { classNum: cls, studentCount: clsStudents.length, rate: clsRate };
      });

    return {
      totalWorkingDays,
      overallRate,
      studentStats,
      atRiskStudents,
      classComparison
    };
  }, [attendance, students, startDate, endDate, availableClasses]);

  // -------------------------------------------------------------
  // MARKS ANALYTICS CALCULATIONS
  // -------------------------------------------------------------
  const marksAnalytics = useMemo(() => {
    const validMarks = marks.filter((m) => m.totalMarks !== undefined && m.totalMarks !== null && !isNaN(m.totalMarks));
    const totalEvaluated = validMarks.length;
    const sum = validMarks.reduce((acc, m) => acc + Number(m.totalMarks), 0);
    const avg = totalEvaluated > 0 ? Math.round((sum / totalEvaluated) * 10) / 10 : 0;
    const max = totalEvaluated > 0 ? Math.max(...validMarks.map((m) => Number(m.totalMarks))) : 0;
    const min = totalEvaluated > 0 ? Math.min(...validMarks.map((m) => Number(m.totalMarks))) : 0;
    const completionRate = students.length > 0 ? Math.round((totalEvaluated / students.length) * 100) : 0;

    return {
      totalEvaluated,
      avg,
      max,
      min,
      completionRate,
      marksList: marks
    };
  }, [marks, students]);

  // -------------------------------------------------------------
  // EXPORT CSV HANDLER (AUTHORIZED DATA ONLY)
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `Report_${activeTab}_Class${selectedClass}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'attendance') {
      headers = ['Student ID', 'Roll No', 'Name', 'Class', 'Section', 'Present Days', 'Total Days', 'Attendance %', 'Health Status', 'Absence Streak'];
      rows = attendanceAnalytics.studentStats.map((s) => [
        s.studentId,
        s.rollNo || '',
        `"${(s.name || '').replace(/"/g, '""')}"`,
        s.class,
        s.section || 'A',
        s.presentDays,
        s.totalDays,
        `${s.rate}%`,
        s.health,
        s.streak
      ]);
    } else if (activeTab === 'marks') {
      headers = ['Student ID', 'Roll No', 'Name', 'Class', 'Subject', 'Exam', 'Theory (50)', 'Practical (50)', 'Total (100)'];
      rows = marksAnalytics.marksList.map((m) => [
        m.studentId,
        m.rollNo || '',
        `"${(m.studentName || '').replace(/"/g, '""')}"`,
        m.class,
        m.subject,
        m.exam,
        m.theoryMarks ?? '',
        m.practicalMarks ?? '',
        m.totalMarks ?? ''
      ]);
    } else if (activeTab === 'students') {
      headers = ['Student ID', 'Roll No', 'Name', 'Class', 'Section', 'Gender', 'Mobile', 'Village'];
      rows = students.map((s) => [
        s.studentId,
        s.rollNo || '',
        `"${(s.name || '').replace(/"/g, '""')}"`,
        s.class,
        s.section || 'A',
        s.gender || 'Not Specified',
        s.mobile || '',
        `"${(s.village || '').replace(/"/g, '""')}"`
      ]);
    } else if (activeTab === 'activities') {
      headers = ['Activity ID', 'Title', 'Category', 'Class', 'Subject', 'Date'];
      rows = activities.map((a) => [
        a.activityId,
        `"${(a.title || '').replace(/"/g, '""')}"`,
        a.category,
        a.class,
        a.subject,
        a.date
      ]);
    } else if (activeTab === 'assignments') {
      headers = ['Assignment ID', 'Title', 'Class', 'Subject', 'Due Date', 'Max Marks', 'Status'];
      rows = assignments.map((a) => [
        a.assignmentId,
        `"${(a.title || '').replace(/"/g, '""')}"`,
        a.class,
        a.subject,
        a.dueDate,
        a.maxMarks,
        a.status
      ]);
    } else {
      headers = ['Notice ID', 'Title', 'Priority', 'Target Class', 'Date'];
      rows = notices.map((n) => [
        n.noticeId,
        `"${(n.title || '').replace(/"/g, '""')}"`,
        n.priority,
        n.class ? `Class ${n.class}` : 'School-Wide',
        n.date
      ]);
    }

    // Sanitize values to prevent spreadsheet formula injection and escape delimiters
    const sanitizeCsvVal = (val) => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      if (/^[=\+\-@]/.test(str)) {
        str = "'" + str;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.map(sanitizeCsvVal).join(','),
      ...rows.map((r) => r.map(sanitizeCsvVal).join(','))
    ].join('\r\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Print-Only Header */}
      <div className="print-only-header">
        <h1>Gameri Higher Secondary School, Gamiri</h1>
        <p>School ID: GAMERI-HSS-001 • Vocational & Academic Management System</p>
        <p>
          Report: <strong>{activeTab.toUpperCase()}</strong> • Scope: Class {selectedClass} • Generated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* 1. Header & Shared Filter Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Class Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="rep-class-select" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                Class:
              </label>
              <select
                id="rep-class-select"
                className="filter-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                aria-label="Select Class"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls === 'All' ? 'All Classes' : `Class ${cls} ${isTeacher ? '(Assigned)' : ''}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selector (for Marks, Activities, Assignments) */}
            {(activeTab === 'marks' || activeTab === 'activities' || activeTab === 'assignments') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="rep-subject-select" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                  Subject:
                </label>
                <select
                  id="rep-subject-select"
                  className="filter-select"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  aria-label="Select Subject"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub} {isTeacher ? '(Assigned)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Exam Selector (for Marks) */}
            {activeTab === 'marks' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label htmlFor="rep-exam-select" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                  Exam:
                </label>
                <select
                  id="rep-exam-select"
                  className="filter-select"
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  aria-label="Select Exam"
                >
                  {EXAM_TYPES.map((ex) => (
                    <option key={ex.value} value={ex.value}>
                      {ex.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range Filters (for Attendance) */}
            {activeTab === 'attendance' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)' }}>From:</label>
                <input
                  type="date"
                  className="filter-select"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)' }}>To:</label>
                <input
                  type="date"
                  className="filter-select"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn-refresh"
              style={{ color: 'var(--slate-700)', background: '#ffffff', borderColor: 'var(--slate-200)' }}
              onClick={() => loadReportsData(true)}
              disabled={refreshing}
              aria-label="Refresh reports"
            >
              <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              className="btn-refresh"
              style={{ color: 'var(--slate-700)', background: '#ffffff', borderColor: 'var(--slate-200)' }}
              onClick={handleExportCSV}
              aria-label="Export CSV"
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              className="btn-primary"
              style={{ width: 'auto', padding: '0 18px' }}
              onClick={handlePrint}
              aria-label="Print Report"
            >
              <Printer size={16} />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Report Category Tabs */}
      <div className="reports-tab-nav">
        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <Calendar size={16} />
          <span>Attendance Analytics</span>
        </button>

        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'marks' ? 'active' : ''}`}
          onClick={() => setActiveTab('marks')}
        >
          <Award size={16} />
          <span>Academic Performance</span>
        </button>

        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <Users size={16} />
          <span>Students Directory</span>
        </button>

        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          <BookOpen size={16} />
          <span>Vocational Activities</span>
        </button>

        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <FileText size={16} />
          <span>Homework & Assignments</span>
        </button>

        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'notices' ? 'active' : ''}`}
          onClick={() => setActiveTab('notices')}
        >
          <Bell size={16} />
          <span>Notices & Circulars</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert-banner alert-danger" role="alert" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} className="flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. TAB CONTENT: ATTENDANCE ANALYTICS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'attendance' && (
        <div>
          {/* KPI Cards */}
          <div className="reports-kpi-grid">
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600, marginBottom: '6px' }}>
                Students Enrolled
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                {students.length}
              </div>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600, marginBottom: '6px' }}>
                Working Days Recorded
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                {attendanceAnalytics.totalWorkingDays}
              </div>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600, marginBottom: '6px' }}>
                Average Attendance Rate
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: attendanceAnalytics.overallRate >= 75 ? 'var(--success-700)' : 'var(--danger-600)' }}>
                {attendanceAnalytics.overallRate}%
              </div>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600, marginBottom: '6px' }}>
                At-Risk Students (&lt;60%)
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--danger-600)' }}>
                {attendanceAnalytics.atRiskStudents.length}
              </div>
            </div>
          </div>

          {/* Class Comparison Progress Bars */}
          <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '16px' }}>
              Class Attendance Comparison
            </h3>
            {attendanceAnalytics.classComparison.map((cls) => (
              <div key={cls.classNum} className="comparison-bar-row">
                <div className="comparison-bar-label">Class {cls.classNum}</div>
                <div className="comparison-bar-track">
                  <div
                    className="comparison-bar-fill"
                    style={{
                      width: `${cls.rate}%`,
                      background: cls.rate >= 75 ? 'var(--success-500)' : cls.rate >= 60 ? 'var(--warning-500)' : 'var(--danger-500)'
                    }}
                  />
                </div>
                <div className="comparison-bar-val">{cls.rate}%</div>
              </div>
            ))}
          </div>

          {/* At-Risk & Absence Streaks Table */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                Students Requiring Attendance Attention
              </h3>
              <span className="hero-chip" style={{ background: 'var(--danger-50)', color: 'var(--danger-700)' }}>
                {attendanceAnalytics.atRiskStudents.length} Flagged
              </span>
            </div>

            {attendanceAnalytics.atRiskStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--slate-500)', fontSize: '0.875rem' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--success-600)', margin: '0 auto 8px auto' }} />
                Great news! All students have satisfactory attendance attendance health.
              </div>
            ) : (
              <div className="student-table-container">
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>Roll</th>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Attendance Rate</th>
                      <th>Consecutive Absences</th>
                      <th>Health Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceAnalytics.atRiskStudents.map((s) => (
                      <tr key={s.studentId}>
                        <td><strong>#{s.rollNo || '—'}</strong></td>
                        <td><strong>{s.name}</strong></td>
                        <td>Class {s.class}</td>
                        <td>
                          <span style={{ fontWeight: 800, color: s.rate < 60 ? 'var(--danger-600)' : 'var(--warning-600)' }}>
                            {s.rate}%
                          </span>
                        </td>
                        <td>
                          {s.streak > 0 ? (
                            <span className="hero-chip" style={{ background: 'var(--danger-100)', color: 'var(--danger-800)', fontWeight: 800 }}>
                              {s.streak} Days
                            </span>
                          ) : (
                            '0 Days'
                          )}
                        </td>
                        <td>
                          <span className={`status-badge-pill ${s.health === 'AT_RISK' ? 'status-inactive' : 'status-pending'}`}>
                            {s.health === 'AT_RISK' ? 'At Risk' : 'Attention'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-view-portfolio"
                            onClick={() => onNavigate(`/portfolio?studentId=${s.studentId}`)}
                          >
                            <span>View 360°</span>
                            <ArrowUpRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. TAB CONTENT: ACADEMIC PERFORMANCE (MARKS) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'marks' && (
        <div>
          <div className="reports-kpi-grid">
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600, marginBottom: '6px' }}>
                Students Evaluated
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                {marksAnalytics.totalEvaluated} / {students.length}
              </div>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600, marginBottom: '6px' }}>
                Average Marks (Max 100)
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                {marksAnalytics.avg}
              </div>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600, marginBottom: '6px' }}>
                Highest Score
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--success-700)' }}>
                {marksAnalytics.max} / 100
              </div>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600, marginBottom: '6px' }}>
                Marks Entry Completion
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: marksAnalytics.completionRate === 100 ? 'var(--success-700)' : 'var(--warning-700)' }}>
                {marksAnalytics.completionRate}%
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '14px' }}>
              Score Roster — {selectedExam} ({selectedSubject})
            </h3>

            {marksAnalytics.marksList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--slate-500)', fontSize: '0.875rem' }}>
                No marks recorded for {selectedExam}.
              </div>
            ) : (
              <div className="student-table-container">
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>Roll</th>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Theory (50)</th>
                      <th>Practical (50)</th>
                      <th>Total (100)</th>
                      <th>Performance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marksAnalytics.marksList.map((m, idx) => (
                      <tr key={m.studentId || idx}>
                        <td><strong>#{m.rollNo || '—'}</strong></td>
                        <td><strong>{m.studentName || 'Student'}</strong></td>
                        <td>Class {m.class}</td>
                        <td>{m.theoryMarks ?? '—'}</td>
                        <td>{m.practicalMarks ?? '—'}</td>
                        <td><strong style={{ color: 'var(--primary-700)' }}>{m.totalMarks ?? '—'}</strong></td>
                        <td>
                          <span className={`status-badge-pill ${(m.totalMarks || 0) >= 30 ? 'status-active' : 'status-inactive'}`}>
                            {(m.totalMarks || 0) >= 30 ? 'Passed' : 'Needs Support'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-view-portfolio"
                            onClick={() => onNavigate(`/portfolio?studentId=${m.studentId}`)}
                          >
                            <span>Portfolio</span>
                            <ArrowUpRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. TAB CONTENT: STUDENTS DIRECTORY */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'students' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '14px' }}>
            Class Enrolled Students ({students.length})
          </h3>
          <div className="student-table-container">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student Name</th>
                  <th>Class & Section</th>
                  <th>Gender</th>
                  <th>Guardian</th>
                  <th>Village</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.studentId}>
                    <td><strong>#{s.rollNo || '—'}</strong></td>
                    <td><strong>{s.name}</strong></td>
                    <td>Class {s.class} • Sec {s.section || 'A'}</td>
                    <td>{s.gender || 'Not Specified'}</td>
                    <td>{s.fatherName || s.motherName || '—'}</td>
                    <td>{s.village || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-view-portfolio"
                        onClick={() => onNavigate(`/portfolio?studentId=${s.studentId}`)}
                      >
                        <span>View 360°</span>
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. TAB CONTENT: ACTIVITIES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'activities' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '14px' }}>
            Vocational Activities Recorded ({activities.length})
          </h3>
          <div className="student-table-container">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Activity Title</th>
                  <th>Category</th>
                  <th>Class</th>
                  <th>Subject</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.activityId}>
                    <td>{a.date || '—'}</td>
                    <td><strong>{a.title}</strong></td>
                    <td><span className="hero-chip">{a.category}</span></td>
                    <td>Class {a.class}</td>
                    <td>{a.subject}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. TAB CONTENT: ASSIGNMENTS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'assignments' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '14px' }}>
            Homework & Coursework Summary ({assignments.length})
          </h3>
          <div className="student-table-container">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Due Date</th>
                  <th>Max Marks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((asg) => (
                  <tr key={asg.assignmentId}>
                    <td><strong>{asg.title}</strong></td>
                    <td>Class {asg.class}</td>
                    <td>{asg.subject}</td>
                    <td>{asg.dueDate || 'No Deadline'}</td>
                    <td>{asg.maxMarks || 50}</td>
                    <td>
                      <span className={`assignment-status-pill asg-${(asg.status || 'active').toLowerCase()}`}>
                        {asg.status || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. TAB CONTENT: NOTICES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'notices' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '14px' }}>
            Notices & Announcements ({notices.length})
          </h3>
          <div className="student-table-container">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Target Class</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((n) => (
                  <tr key={n.noticeId}>
                    <td>{n.date || '—'}</td>
                    <td><strong>{n.title}</strong></td>
                    <td>
                      <span className={`notice-priority-pill pri-${(n.priority || 'normal').toLowerCase()}`}>
                        {n.priority || 'NORMAL'}
                      </span>
                    </td>
                    <td>{n.class ? `Class ${n.class}` : 'School-Wide'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
