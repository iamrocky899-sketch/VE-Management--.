import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';
import { sendApiRequest } from '../../api/client';
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Save,
  Check,
  X,
  Clock,
  History,
  Edit3,
  Lock,
  Unlock,
  BarChart2,
  Layers,
  BookOpen,
  Filter,
  CheckSquare,
  ShieldCheck,
  UserCheck,
  UserX,
  Info
} from 'lucide-react';
import { getStudentDisplayName } from '../../utils/formatters';
import {
  getClassSections,
  normalizeClass,
  normalizeSection,
  formatSectionDisplay
} from '../../utils/academic';

export default function Attendance({ onNavigate }) {
  const { user, isTeacher, isPrincipal, isAdmin } = useAuth();
  const isSuperAdmin = isAdmin || isPrincipal;

  // Active Tab: 'daily', 'analytics', 'history', 'sessions'
  const [activeTab, setActiveTab] = useState('daily');

  // Academic Context States
  const [academicYears, setAcademicYears] = useState(['2026-2027', '2025-2026']);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026-2027');

  const availableClasses = useMemo(() => {
    if (isTeacher && user?.assignedClasses && user.assignedClasses.length > 0) {
      return user.assignedClasses;
    }
    return ['9', '10', '11', '12'];
  }, [isTeacher, user]);

  const [selectedClass, setSelectedClass] = useState(() => availableClasses[0] || '10');

  const availableSections = useMemo(() => {
    return getClassSections(selectedClass);
  }, [selectedClass]);

  const [selectedSection, setSelectedSection] = useState(() => {
    const secs = getClassSections(availableClasses[0] || '10');
    return secs[0]?.value || 'ALL';
  });

  const handleClassChange = (newCls) => {
    setSelectedClass(newCls);
    const secs = getClassSections(newCls);
    setSelectedSection(secs[0]?.value || 'ALL');
  };

  const [selectedSubject, setSelectedSubject] = useState('Information Technology / ITeS');
  const [selectedComponent, setSelectedComponent] = useState('THEORY'); // 'THEORY' or 'PRACTICAL'
  const [selectedPeriod, setSelectedPeriod] = useState('1');

  // Date Selection (defaults to today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Data States
  const [students, setStudents] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [studentId]: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'EXCUSED' }
  const [currentSession, setCurrentSession] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  // Tab 2: Analytics States
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Tab 3: History States
  const [historyStudentId, setHistoryStudentId] = useState('');
  const [studentHistoryList, setStudentHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Tab 4: Sessions States
  const [sessionsList, setSessionsList] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Correction Modal State
  const [correctionModal, setCorrectionModal] = useState(null); // { attendanceId, studentId, studentName, currentStatus, newStatus, reason }
  const [correctionLoading, setCorrectionLoading] = useState(false);

  // General UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Class Students, Subjects and Current Attendance
  const loadClassAttendanceData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const canonClass = normalizeClass(selectedClass);
      const canonSection = normalizeSection(canonClass, selectedSection);

      // 1. Fetch Students in Class & Section
      const stuRes = await sendApiRequest('get_students', {
        class: canonClass,
        section: canonSection
      });
      const stuList = stuRes?.data?.students || [];
      setStudents(stuList);

      // 2. Fetch Subjects for Class
      const subRes = await sendApiRequest('get_subjects', { class: canonClass });
      const subs = subRes?.data?.subjects || [];
      setAvailableSubjects(subs);
      if (subs.length > 0 && !subs.some(s => s.subjectName === selectedSubject)) {
        setSelectedSubject(subs[0].subjectName || 'Information Technology / ITeS');
      }

      // 3. Fetch Existing Attendance for Date & Context
      const attRes = await sendApiRequest('get_attendance', {
        academicYear: selectedAcademicYear,
        class: canonClass,
        section: canonSection,
        date: selectedDate,
        subject: selectedSubject,
        component: selectedComponent
      });
      const attList = attRes?.data?.attendance || [];

      // 4. Fetch Session Info if available
      const sessRes = await sendApiRequest('get_attendance_sessions', {
        academicYear: selectedAcademicYear,
        class: canonClass,
        section: canonSection,
        date: selectedDate
      });
      const matchingSess = (sessRes?.data?.sessions || []).find(s =>
        s.component === selectedComponent &&
        (!s.subjectName || s.subjectName === selectedSubject)
      );

      setCurrentSession(matchingSess || null);
      setIsLocked(matchingSess ? (matchingSess.isLocked || matchingSess.status === 'LOCKED') : false);

      // 5. Build Attendance Map covering ALL roster students
      const map = {};
      const attByStudent = {};
      (attList || []).forEach((a) => {
        attByStudent[a.studentId] = (a.status || 'PRESENT').toUpperCase();
      });

      stuList.forEach((s) => {
        if (attByStudent[s.studentId]) {
          map[s.studentId] = attByStudent[s.studentId];
        } else if (attList.length > 0) {
          // If a session was already marked previously but student wasn't in list, default to ABSENT
          map[s.studentId] = 'ABSENT';
        } else {
          // Fresh session defaults to PRESENT
          map[s.studentId] = 'PRESENT';
        }
      });
      setAttendanceMap(map);

    } catch (err) {
      setError('Unable to load attendance data from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClassAttendanceData();
  }, [selectedClass, selectedSection, selectedDate, selectedSubject, selectedComponent, selectedAcademicYear]);

  // Load Analytics
  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await sendApiRequest('get_attendance_metrics', {
        academicYear: selectedAcademicYear,
        class: selectedClass,
        section: selectedSection
      });
      if (res && res.success && res.data) {
        setAnalyticsData(res.data);
      }
    } catch (e) {
      // ignore
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Load Student History
  const loadStudentHistory = async (stuId) => {
    if (!stuId) return;
    setHistoryLoading(true);
    try {
      const res = await sendApiRequest('get_attendance', {
        studentId: stuId,
        academicYear: selectedAcademicYear
      });
      if (res && res.success && res.data) {
        setStudentHistoryList(res.data.attendance || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load Sessions List
  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await sendApiRequest('get_attendance_sessions', {
        academicYear: selectedAcademicYear,
        class: selectedClass
      });
      if (res && res.success && res.data) {
        setSessionsList(res.data.sessions || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') loadAnalytics();
    else if (activeTab === 'sessions') loadSessions();
  }, [activeTab, selectedClass, selectedSection, selectedAcademicYear]);

  // Handle Save Attendance
  const handleSaveAttendance = async (lockImmediately = false) => {
    if (isLocked && !isSuperAdmin) {
      showToast('This attendance session is locked. Modifications require Admin authorization.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const canonClass = normalizeClass(selectedClass);
      const canonSection = normalizeSection(canonClass, selectedSection);

      const records = students.map(s => ({
        studentId: s.studentId,
        status: attendanceMap[s.studentId] || 'PRESENT',
        class: canonClass,
        section: s.section || canonSection,
        date: selectedDate,
        subject: selectedSubject,
        component: selectedComponent,
        period: selectedPeriod
      }));

      const payload = {
        academicYear: selectedAcademicYear,
        class: canonClass,
        section: canonSection,
        date: selectedDate,
        subject: selectedSubject,
        component: selectedComponent,
        period: selectedPeriod,
        lockImmediately: lockImmediately,
        attendance: records
      };

      const res = await sendApiRequest('save_attendance', payload);
      if (res && res.success) {
        showToast(res.message || 'Attendance saved successfully.');
        loadClassAttendanceData();
      } else {
        setError(res?.error?.message || 'Failed to save attendance.');
      }
    } catch (err) {
      setError('Connection error while saving attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Batch Operations
  const handleMarkAll = (status) => {
    if (isLocked && !isSuperAdmin) return;
    const newMap = { ...attendanceMap };
    students.forEach(s => {
      newMap[s.studentId] = status;
    });
    setAttendanceMap(newMap);
  };

  // Handle Single Student Status Toggle
  const handleToggleStatus = (studentId, nextStatus) => {
    if (isLocked && !isSuperAdmin) return;
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: nextStatus
    }));
  };

  // Handle Submit Correction
  const handleSubmitCorrection = async () => {
    if (!correctionModal) return;
    setCorrectionLoading(true);

    try {
      const res = await sendApiRequest('correct_attendance_record', {
        attendanceId: correctionModal.attendanceId,
        newStatus: correctionModal.newStatus,
        reason: correctionModal.reason
      });

      if (res && res.success) {
        showToast('Attendance corrected successfully.');
        setCorrectionModal(null);
        loadClassAttendanceData();
        if (activeTab === 'sessions') loadSessions();
      } else {
        showToast(res?.error?.message || 'Correction failed.');
      }
    } catch (e) {
      showToast('Server communication error.');
    } finally {
      setCorrectionLoading(false);
    }
  };

  // Filtered Students Roster
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(s =>
      (s.studentName || '').toLowerCase().includes(q) ||
      String(s.rollNo || '').includes(q) ||
      String(s.studentId || '').toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Counts Calculation
  const presentCount = students.filter(s => attendanceMap[s.studentId] === 'PRESENT').length;
  const absentCount = students.filter(s => attendanceMap[s.studentId] === 'ABSENT').length;
  const lateCount = students.filter(s => attendanceMap[s.studentId] === 'LATE').length;
  const leaveCount = students.filter(s => attendanceMap[s.studentId] === 'LEAVE' || attendanceMap[s.studentId] === 'EXCUSED').length;

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: 'var(--primary)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER & SUMMARY BAR */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 6px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarCheck size={28} style={{ color: 'var(--primary)' }} />
              <span>Attendance & Academic Operations 2.0</span>
            </h1>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', margin: 0 }}>
              Gameri Higher Secondary School — Authoritative Curriculum-Aware Session Attendance, Theory/Practical Breakdown & Analytics.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Academic Session Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card-bg)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>SESSION:</span>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
              >
                {academicYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => loadClassAttendanceData(true)}
              className="btn-secondary"
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
            >
              <RefreshCw size={15} className={refreshing ? 'spin-anim' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Enrolled Students</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>{students.length}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Present Today</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{presentCount}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserX size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Absent Today</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>{absentCount}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Late / Leave</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{lateCount + leaveCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          onClick={() => setActiveTab('daily')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: activeTab === 'daily' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            color: activeTab === 'daily' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <CalendarCheck size={16} />
          <span>Daily Marker</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: activeTab === 'analytics' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            color: activeTab === 'analytics' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <BarChart2 size={16} />
          <span>Dashboard & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: activeTab === 'history' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <History size={16} />
          <span>Student History</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: activeTab === 'sessions' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            color: activeTab === 'sessions' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Layers size={16} />
          <span>Sessions & Corrections</span>
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '14px 18px', borderRadius: '12px', color: '#991b1b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: DAILY ATTENDANCE MARKER */}
      {activeTab === 'daily' && (
        <div>
          {/* CONTEXT SELECTOR BAR */}
          <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', alignItems: 'center' }}>
              <div>
                <label className="input-label" style={{ margin: '0 0 4px 0', fontSize: '0.72rem' }}>Class</label>
                <select className="input-field" value={selectedClass} onChange={(e) => handleClassChange(e.target.value)} style={{ height: '38px' }}>
                  {availableClasses.map(c => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label" style={{ margin: '0 0 4px 0', fontSize: '0.72rem' }}>Section</label>
                <select className="input-field" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} style={{ height: '38px' }}>
                  {availableSections.map(sec => (
                    <option key={sec.value} value={sec.value}>{sec.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label" style={{ margin: '0 0 4px 0', fontSize: '0.72rem' }}>Attendance Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ height: '38px' }}
                />
              </div>

              <div>
                <label className="input-label" style={{ margin: '0 0 4px 0', fontSize: '0.72rem' }}>Subject</label>
                <select className="input-field" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} style={{ height: '38px' }}>
                  {availableSubjects.map(s => (
                    <option key={s.subjectId} value={s.subjectName}>{s.subjectName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label" style={{ margin: '0 0 4px 0', fontSize: '0.72rem' }}>Component</label>
                <select className="input-field" value={selectedComponent} onChange={(e) => setSelectedComponent(e.target.value)} style={{ height: '38px' }}>
                  <option value="THEORY">Theory</option>
                  <option value="PRACTICAL">Practical</option>
                </select>
              </div>

              <div>
                <label className="input-label" style={{ margin: '0 0 4px 0', fontSize: '0.72rem' }}>Period</label>
                <select className="input-field" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} style={{ height: '38px' }}>
                  <option value="1">Period 1</option>
                  <option value="2">Period 2</option>
                  <option value="3">Period 3</option>
                  <option value="4">Period 4</option>
                  <option value="Daily">Full Day</option>
                </select>
              </div>
            </div>
          </div>

          {/* LOCKED STATUS BANNER */}
          {isLocked && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#92400e', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={16} />
                <span><strong>Session Locked:</strong> This attendance session is officially locked. Modifications require Administrator approval.</span>
              </div>
            </div>
          )}

          {/* BATCH ACTION & SEARCH BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleMarkAll('PRESENT')}
                disabled={isLocked && !isSuperAdmin}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: '8px', color: '#047857' }}
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('ABSENT')}
                disabled={isLocked && !isSuperAdmin}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: '8px', color: '#dc2626' }}
              >
                Mark All Absent
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '30px', height: '34px', fontSize: '0.8rem', width: '180px' }}
                />
              </div>

              <button
                type="button"
                onClick={() => handleSaveAttendance(false)}
                disabled={saving || (isLocked && !isSuperAdmin)}
                className="btn-primary"
                style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
              >
                <Save size={15} />
                <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
              </button>
            </div>
          </div>

          {/* STUDENTS ROSTER TABLE */}
          {loading ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="spin-anim" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--primary)' }} />
              <div>Loading student roster...</div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={36} style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.5 }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>No enrolled students found</div>
              <div style={{ fontSize: '0.85rem' }}>Ensure students are enrolled in Class {selectedClass} ({formatSectionDisplay(selectedClass, selectedSection)}).</div>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '12px 16px', width: '70px' }}>Roll</th>
                      <th style={{ padding: '12px 16px' }}>Student Name & ID</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Quick Toggle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((stu) => {
                      const currentStatus = attendanceMap[stu.studentId] || 'PRESENT';

                      return (
                        <tr key={stu.studentId} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--slate-900)' }}>
                            {stu.rollNo || '-'}
                          </td>

                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{getStudentDisplayName(stu)}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{stu.studentId}</span>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '1px 7px',
                                borderRadius: '6px',
                                background: 'rgba(99, 102, 241, 0.08)',
                                color: '#4f46e5',
                                border: '1px solid rgba(99, 102, 241, 0.18)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <Users size={11} />
                                <span>Group: {stu.group || stu.student_group || stu.group_name || 'Group Not Assigned'}</span>
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '12px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: currentStatus === 'PRESENT' ? '#ecfdf5' : (currentStatus === 'ABSENT' ? '#fef2f2' : '#fef3c7'),
                                color: currentStatus === 'PRESENT' ? '#065f46' : (currentStatus === 'ABSENT' ? '#991b1b' : '#92400e')
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentStatus === 'PRESENT' ? '#10b981' : (currentStatus === 'ABSENT' ? '#ef4444' : '#f59e0b') }}></span>
                              {currentStatus}
                            </span>
                          </td>

                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(stu.studentId, 'PRESENT')}
                                disabled={isLocked && !isSuperAdmin}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  border: '1px solid',
                                  borderColor: currentStatus === 'PRESENT' ? '#10b981' : '#e2e8f0',
                                  background: currentStatus === 'PRESENT' ? '#ecfdf5' : '#ffffff',
                                  color: currentStatus === 'PRESENT' ? '#047857' : '#64748b',
                                  cursor: 'pointer'
                                }}
                              >
                                P
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStatus(stu.studentId, 'ABSENT')}
                                disabled={isLocked && !isSuperAdmin}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  border: '1px solid',
                                  borderColor: currentStatus === 'ABSENT' ? '#ef4444' : '#e2e8f0',
                                  background: currentStatus === 'ABSENT' ? '#fef2f2' : '#ffffff',
                                  color: currentStatus === 'ABSENT' ? '#dc2626' : '#64748b',
                                  cursor: 'pointer'
                                }}
                              >
                                A
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStatus(stu.studentId, 'LATE')}
                                disabled={isLocked && !isSuperAdmin}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  border: '1px solid',
                                  borderColor: currentStatus === 'LATE' ? '#f59e0b' : '#e2e8f0',
                                  background: currentStatus === 'LATE' ? '#fef3c7' : '#ffffff',
                                  color: currentStatus === 'LATE' ? '#b45309' : '#64748b',
                                  cursor: 'pointer'
                                }}
                              >
                                L
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStatus(stu.studentId, 'LEAVE')}
                                disabled={isLocked && !isSuperAdmin}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  border: '1px solid',
                                  borderColor: currentStatus === 'LEAVE' ? '#6366f1' : '#e2e8f0',
                                  background: currentStatus === 'LEAVE' ? '#eff6ff' : '#ffffff',
                                  color: currentStatus === 'LEAVE' ? '#4f46e5' : '#64748b',
                                  cursor: 'pointer'
                                }}
                              >
                                Lv
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ATTENDANCE DASHBOARD & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div>
          {analyticsLoading || !analyticsData ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="spin-anim" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--primary)' }} />
              <div>Computing authoritative attendance metrics...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* SUMMARY CARD */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 16px 0' }}>
                  Class {selectedClass} Section {selectedSection} Attendance Summary ({selectedAcademicYear})
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Total Records</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--slate-900)' }}>{analyticsData.summary?.totalRecords}</div>
                  </div>
                  <div style={{ background: '#ecfdf5', padding: '14px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#047857' }}>{analyticsData.summary?.attendancePercentage !== null && analyticsData.summary?.attendancePercentage !== undefined ? `${analyticsData.summary?.attendancePercentage}%` : '--'}</div>
                  </div>
                  <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}>Total Absent</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#dc2626' }}>{analyticsData.summary?.absentCount}</div>
                  </div>
                  <div style={{ background: '#fef3c7', padding: '14px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>Threshold Alert</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e', marginTop: '4px' }}>{analyticsData.thresholdConfig?.label}</div>
                  </div>
                </div>
              </div>

              {/* SUBJECT BREAKDOWN MATRIX */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 14px 0' }}>
                  Subject-Wise Attendance Breakdown (Theory vs Practical)
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px 14px' }}>Subject</th>
                        <th style={{ padding: '10px 14px' }}>Component</th>
                        <th style={{ padding: '10px 14px' }}>Total Sessions</th>
                        <th style={{ padding: '10px 14px' }}>Present</th>
                        <th style={{ padding: '10px 14px' }}>Absent</th>
                        <th style={{ padding: '10px 14px' }}>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.subjectBreakdown?.map((sub, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700 }}>{sub.subject}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: sub.component === 'THEORY' ? '#eff6ff' : '#ecfdf5', color: sub.component === 'THEORY' ? '#1d4ed8' : '#047857' }}>
                              {sub.component}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>{sub.total}</td>
                          <td style={{ padding: '10px 14px', color: '#047857', fontWeight: 700 }}>{sub.present}</td>
                          <td style={{ padding: '10px 14px', color: '#dc2626', fontWeight: 700 }}>{sub.absent}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 800 }}>{sub.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STUDENT ATTENDANCE HISTORY */}
      {activeTab === 'history' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 16px 0' }}>
            Student Attendance History & Audit Log
          </h3>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select
              className="input-field"
              value={historyStudentId}
              onChange={(e) => {
                setHistoryStudentId(e.target.value);
                loadStudentHistory(e.target.value);
              }}
              style={{ maxWidth: '320px' }}
            >
              <option value="">Select Student...</option>
              {students.map(s => (
                <option key={s.studentId} value={s.studentId}>{s.rollNo ? `#${s.rollNo} ` : ''}{s.studentName} ({s.studentId})</option>
              ))}
            </select>
          </div>

          {historyLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 10px auto', display: 'block', color: 'var(--primary)' }} />
              <div>Loading student history...</div>
            </div>
          ) : studentHistoryList.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {historyStudentId ? 'No attendance records found for this student.' : 'Please select a student from the dropdown above.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 14px' }}>Date</th>
                    <th style={{ padding: '10px 14px' }}>Subject</th>
                    <th style={{ padding: '10px 14px' }}>Component</th>
                    <th style={{ padding: '10px 14px' }}>Period</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                    <th style={{ padding: '10px 14px' }}>Remarks / Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {studentHistoryList.map(rec => (
                    <tr key={rec.attendanceId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{rec.date}</td>
                      <td style={{ padding: '10px 14px' }}>{rec.subject || 'General'}</td>
                      <td style={{ padding: '10px 14px' }}>{rec.component || 'THEORY'}</td>
                      <td style={{ padding: '10px 14px' }}>{rec.period || '1'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: rec.status === 'PRESENT' ? '#ecfdf5' : '#fef2f2', color: rec.status === 'PRESENT' ? '#047857' : '#dc2626' }}>
                          {rec.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {rec.reason || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SESSIONS & CORRECTIONS */}
      {activeTab === 'sessions' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 16px 0' }}>
            Attendance Sessions & Controlled Corrections Hub
          </h3>

          {sessionsLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 10px auto', display: 'block', color: 'var(--primary)' }} />
              <div>Loading attendance sessions...</div>
            </div>
          ) : sessionsList.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No recorded sessions found for Class {selectedClass}.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 14px' }}>Date & Period</th>
                    <th style={{ padding: '10px 14px' }}>Subject & Comp</th>
                    <th style={{ padding: '10px 14px' }}>Counts (P / A / L)</th>
                    <th style={{ padding: '10px 14px' }}>Teacher</th>
                    <th style={{ padding: '10px 14px' }}>Lock Status</th>
                    {isSuperAdmin && <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {sessionsList.map(sess => (
                    <tr key={sess.sessionId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700 }}>{sess.date}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Period {sess.period || '1'}</div>
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <div>{sess.subjectName || 'General'}</div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 4px', borderRadius: '4px', background: sess.component === 'THEORY' ? '#eff6ff' : '#ecfdf5', color: sess.component === 'THEORY' ? '#1d4ed8' : '#047857' }}>
                          {sess.component}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ color: '#047857', fontWeight: 700 }}>{sess.presentCount || 0}P</span> / <span style={{ color: '#dc2626', fontWeight: 700 }}>{sess.absentCount || 0}A</span> / <span style={{ color: '#b45309', fontWeight: 700 }}>{sess.lateCount || 0}L</span>
                      </td>

                      <td style={{ padding: '10px 14px', fontSize: '0.8rem' }}>{sess.teacherName || sess.teacherId}</td>

                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: sess.isLocked ? '#fef2f2' : '#ecfdf5', color: sess.isLocked ? '#991b1b' : '#065f46' }}>
                          {sess.isLocked ? 'LOCKED' : 'OPEN'}
                        </span>
                      </td>

                      {isSuperAdmin && (
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={async () => {
                              const endpoint = sess.isLocked ? 'unlock_attendance_session' : 'lock_attendance_session';
                              await sendApiRequest(endpoint, { sessionId: sess.sessionId });
                              showToast(`Session ${sess.isLocked ? 'unlocked' : 'locked'}`);
                              loadSessions();
                            }}
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.72rem', borderRadius: '6px' }}
                          >
                            {sess.isLocked ? <Unlock size={13} /> : <Lock size={13} />}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
