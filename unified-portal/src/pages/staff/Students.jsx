import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';
import { sendApiRequest, resolveStudentGroup } from '../../api/client';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  X,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Sparkles,
  Phone,
  MapPin,
  ArrowRight,
  TrendingUp,
  Hash,
  History,
  Check,
  AlertTriangle,
  Calendar,
  Layers,
  UserPlus,
  Edit,
  FileText,
  Award,
  Upload,
  Download,
  ShieldCheck,
  Clock,
  Link,
  Unlink,
  Eye,
  Sliders,
  CheckSquare,
  Square,
  ChevronRight,
  BookOpen
} from 'lucide-react';

export default function Students({ onNavigate }) {
  const { user, isTeacher, isPrincipal, isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedStream, setSelectedStream] = useState('ALL');
  const [sortBy, setSortBy] = useState('roll_asc');

  // Modal States
  // 1. Admission / Registration
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [admissionForm, setAdmissionForm] = useState({
    studentName: '',
    admissionNo: '',
    admissionDate: new Date().toISOString().split('T')[0],
    class: '9',
    section: 'A',
    rollNo: '',
    dob: '',
    gender: 'Male',
    category: 'General',
    bloodGroup: '',
    fatherName: '',
    motherName: '',
    mobile: '',
    parentMobile: '',
    relationship: 'Father',
    address: '',
    village: '',
    district: 'Biswanath',
    state: 'Assam',
    pinCode: '784176',
    stream: 'Information Technology (IT/ITeS)',
    academicYear: '2026-2027'
  });
  const [admissionSubmitting, setAdmissionSubmitting] = useState(false);
  const [admissionError, setAdmissionError] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // 2. Comprehensive 360° Profile
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileTab, setProfileTab] = useState('overview'); // overview, personal, parents, enrollment, history, attendance, results, documents, audit
  const [newParentMobile, setNewParentMobile] = useState('');
  const [newParentName, setNewParentName] = useState('');
  const [newParentRel, setNewParentRel] = useState('Father');

  // 3. Edit Student Profile
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  // 4. Update Status
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusStudent, setStatusStudent] = useState(null);
  const [newStatusValue, setNewStatusValue] = useState('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // 5. Bulk Operations
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState('ASSIGN_SECTION');
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [bulkTargetClass, setBulkTargetClass] = useState('9');
  const [bulkTargetSection, setBulkTargetSection] = useState('A');
  const [bulkTargetStatus, setBulkTargetStatus] = useState('ACTIVE');
  const [bulkStartRoll, setBulkStartRoll] = useState('1');
  const [bulkPreviewData, setBulkPreviewData] = useState(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState(null);

  // 6. CSV Import / Export
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importPreviewData, setImportPreviewData] = useState(null);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importError, setImportError] = useState(null);

  // 7. Roll Number Modal
  const [isRollModalOpen, setIsRollModalOpen] = useState(false);
  const [rollClass, setRollClass] = useState('9');
  const [rollAssignments, setRollAssignments] = useState([]);
  const [rollLoading, setRollLoading] = useState(false);
  const [rollError, setRollError] = useState(null);

  // 8. Promotion Modal
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);
  const [promotionSourceYear, setPromotionSourceYear] = useState('2026-2027');
  const [promotionTargetYear, setPromotionTargetYear] = useState('2027-2028');
  const [promotionSourceClass, setPromotionSourceClass] = useState('9');
  const [promotionTargetClass, setPromotionTargetClass] = useState('10');
  const [promotionList, setPromotionList] = useState([]);
  const [promotionSelectedIds, setPromotionSelectedIds] = useState(new Set());
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionError, setPromotionError] = useState(null);
  const [isPromotionConfirmOpen, setIsPromotionConfirmOpen] = useState(false);

  // 9. Academic History Modal
  const [historyStudent, setHistoryStudent] = useState(null);
  const [studentHistoryData, setStudentHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const fetchStudents = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await sendApiRequest('get_students');
      if (res && res.success && res.data) {
        setStudents(res.data.students || []);
      } else {
        setError(res?.error?.message || 'Unable to load student directory.');
      }
    } catch (err) {
      setError('Unable to connect to the school server. Please check your network.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Compute available class options
  const availableClasses = useMemo(() => {
    if (isTeacher) {
      return user?.assignedClasses || ['9', '10'];
    }
    const classesSet = new Set(students.map((s) => String(s.class)));
    if (classesSet.size === 0) return ['9', '10', '11', '12'];
    return Array.from(classesSet).sort((a, b) => Number(a) - Number(b));
  }, [students, isTeacher, user]);

  // Compute available sections
  const availableSections = useMemo(() => {
    const sectionsSet = new Set(students.map((s) => s.section).filter(Boolean));
    return Array.from(sectionsSet).sort();
  }, [students]);

  // Filtered & Sorted Student Records
  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((s) => {
        const name = (s.studentName || s.name || '').toLowerCase();
        const sid = (s.studentId || '').toLowerCase();
        const adm = (s.admissionNo || '').toLowerCase();
        const roll = String(s.rollNo || s.roll || '').toLowerCase();
        const cls = String(s.class || '').toLowerCase();
        const sec = (s.section || '').toLowerCase();
        const mobile = (s.mobile || '').toLowerCase();
        const father = (s.fatherName || '').toLowerCase();
        const mother = (s.motherName || '').toLowerCase();
        const village = (s.village || s.address || '').toLowerCase();

        return (
          name.includes(q) ||
          sid.includes(q) ||
          adm.includes(q) ||
          roll.includes(q) ||
          cls.includes(q) ||
          sec.includes(q) ||
          mobile.includes(q) ||
          father.includes(q) ||
          mother.includes(q) ||
          village.includes(q)
        );
      });
    }

    if (selectedClass !== 'ALL') {
      result = result.filter((s) => String(s.class) === String(selectedClass));
    }
    if (selectedSection !== 'ALL') {
      result = result.filter((s) => String(s.section) === String(selectedSection));
    }
    if (selectedStatus !== 'ALL') {
      result = result.filter((s) => (s.status || 'ACTIVE').toUpperCase() === selectedStatus);
    }
    if (selectedStream !== 'ALL') {
      result = result.filter((s) => (s.stream || '').includes(selectedStream));
    }

    result.sort((a, b) => {
      if (sortBy === 'roll_asc') {
        const rollA = parseInt(a.rollNo || a.roll || '9999', 10);
        const rollB = parseInt(b.rollNo || b.roll || '9999', 10);
        if (rollA !== rollB) return rollA - rollB;
        return (a.studentName || a.name || '').localeCompare(b.studentName || b.name || '');
      }
      if (sortBy === 'roll_desc') {
        const rollA = parseInt(a.rollNo || a.roll || '0', 10);
        const rollB = parseInt(b.rollNo || b.roll || '0', 10);
        if (rollA !== rollB) return rollB - rollA;
        return (b.studentName || b.name || '').localeCompare(a.studentName || a.name || '');
      }
      if (sortBy === 'name_asc') {
        return (a.studentName || a.name || '').localeCompare(b.studentName || b.name || '');
      }
      if (sortBy === 'name_desc') {
        return (b.studentName || b.name || '').localeCompare(a.studentName || a.name || '');
      }
      if (sortBy === 'class_asc') {
        return parseInt(a.class || '0', 10) - parseInt(b.class || '0', 10);
      }
      return 0;
    });

    return result;
  }, [students, searchQuery, selectedClass, selectedSection, selectedStatus, selectedStream, sortBy]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedClass('ALL');
    setSelectedSection('ALL');
    setSelectedStatus('ALL');
    setSelectedStream('ALL');
    setSortBy('roll_asc');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedClass !== 'ALL' ||
    selectedSection !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedStream !== 'ALL' ||
    sortBy !== 'roll_asc';

  // Open 360° Master Profile
  const handleOpen360Profile = async (studentId) => {
    setIsProfileModalOpen(true);
    setProfileLoading(true);
    setProfileData(null);
    setProfileTab('overview');

    try {
      const res = await sendApiRequest('get_student_profile', { studentId });
      if (res && res.success && res.data) {
        setProfileData(res.data);
      } else {
        showToast(res?.error?.message || 'Failed to load student profile.');
      }
    } catch (err) {
      showToast('Error loading student profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Open Direct Profile Editor
  const handleOpenEditModal = (student) => {
    setEditFormData({
      studentId: student.studentId,
      studentName: student.studentName || student.name || '',
      admissionNo: student.admissionNo || '',
      dob: student.dob || '',
      gender: student.gender || 'Male',
      category: student.category || 'General',
      bloodGroup: student.bloodGroup || '',
      fatherName: student.fatherName || '',
      motherName: student.motherName || '',
      mobile: student.mobile || '',
      village: student.village || '',
      address: student.address || '',
      district: student.district || 'Biswanath',
      state: student.state || 'Assam',
      pinCode: student.pinCode || '784176',
      stream: student.stream || 'Information Technology (IT/ITeS)',
      admissionDate: student.admissionDate || ''
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEditProfile = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError(null);

    try {
      const res = await sendApiRequest('update_student_profile', editFormData);
      if (res && res.success) {
        showToast('Student profile updated successfully');
        setIsEditModalOpen(false);
        fetchStudents(true);
        if (profileData && profileData.student.studentId === editFormData.studentId) {
          handleOpen360Profile(editFormData.studentId);
        }
      } else {
        setEditError(res?.error?.message || 'Failed to update profile');
      }
    } catch (err) {
      setEditError('Connection error saving profile');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Open Status Changer
  const handleOpenStatusModal = (student) => {
    setStatusStudent(student);
    setNewStatusValue(student.status || 'ACTIVE');
    setStatusReason('');
    setIsStatusModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!statusStudent) return;
    setStatusSubmitting(true);
    try {
      const res = await sendApiRequest('update_student_status', {
        studentId: statusStudent.studentId,
        status: newStatusValue,
        reason: statusReason
      });
      if (res && res.success) {
        showToast(`Status updated to ${newStatusValue}`);
        setIsStatusModalOpen(false);
        fetchStudents(true);
      } else {
        showToast(res?.error?.message || 'Failed to update status');
      }
    } catch (err) {
      showToast('Network error updating status');
    } finally {
      setStatusSubmitting(false);
    }
  };

  // Live Duplicate Check on Admission Form
  const handleAdmissionFieldChange = async (field, val) => {
    const updated = { ...admissionForm, [field]: val };
    setAdmissionForm(updated);

    if (field === 'studentName' || field === 'dob' || field === 'admissionNo') {
      if (updated.studentName.trim().length >= 3 || updated.admissionNo.trim().length >= 3) {
        try {
          const res = await sendApiRequest('check_duplicate_student', {
            studentName: updated.studentName,
            dob: updated.dob,
            admissionNo: updated.admissionNo,
            mobile: updated.mobile
          });
          if (res && res.success && res.data && res.data.isDuplicate) {
            setDuplicateWarning(res.data.duplicates);
          } else {
            setDuplicateWarning(null);
          }
        } catch (e) {
          // Silent non-blocking duplicate check
        }
      } else {
        setDuplicateWarning(null);
      }
    }
  };

  const handleCreateAdmission = async (e, force = false) => {
    if (e) e.preventDefault();
    setAdmissionSubmitting(true);
    setAdmissionError(null);

    try {
      const res = await sendApiRequest('admit_student', {
        ...admissionForm,
        forceCreate: force
      });

      if (res && res.success) {
        showToast(`Admitted student ${admissionForm.studentName}`);
        setIsAdmissionModalOpen(false);
        setDuplicateWarning(null);
        fetchStudents(true);
      } else if (res?.error?.code === 'POSSIBLE_DUPLICATE_STUDENT') {
        setDuplicateWarning(res.error.duplicates || []);
        setAdmissionError('Possible duplicate student records found. Review below and confirm if you still want to proceed.');
      } else {
        setAdmissionError(res?.error?.message || 'Failed to complete admission');
      }
    } catch (err) {
      setAdmissionError('Connection error during student registration');
    } finally {
      setAdmissionSubmitting(false);
    }
  };

  // Link Parent in Profile
  const handleLinkParent = async () => {
    if (!profileData || !newParentMobile) return;
    try {
      const res = await sendApiRequest('link_parent_student', {
        studentId: profileData.student.studentId,
        parentName: newParentName || 'Parent',
        parentMobile: newParentMobile,
        relationship: newParentRel
      });
      if (res && res.success) {
        showToast('Parent linked successfully');
        setNewParentMobile('');
        setNewParentName('');
        handleOpen360Profile(profileData.student.studentId);
      } else {
        showToast(res?.error?.message || 'Failed to link parent');
      }
    } catch (err) {
      showToast('Error linking parent');
    }
  };

  const handleUnlinkParent = async (linkId) => {
    if (!profileData) return;
    try {
      const res = await sendApiRequest('unlink_parent_student', { linkId });
      if (res && res.success) {
        showToast('Parent unlinked');
        handleOpen360Profile(profileData.student.studentId);
      } else {
        showToast(res?.error?.message || 'Failed to unlink parent');
      }
    } catch (err) {
      showToast('Error unlinking parent');
    }
  };

  // Bulk Operations Handlers
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.studentId)));
    }
  };

  const handleToggleSelectStudent = (sid) => {
    const next = new Set(selectedStudentIds);
    if (next.has(sid)) next.delete(sid);
    else next.add(sid);
    setSelectedStudentIds(next);
  };

  const handleBulkPreview = async () => {
    setBulkSubmitting(true);
    setBulkError(null);
    try {
      const res = await sendApiRequest('bulk_update_students', {
        action: bulkAction,
        studentIds: Array.from(selectedStudentIds),
        targetClass: bulkTargetClass,
        targetSection: bulkTargetSection,
        targetStatus: bulkTargetStatus,
        startRoll: bulkStartRoll,
        preview: true
      });
      if (res && res.success) {
        setBulkPreviewData(res.data);
      } else {
        setBulkError(res?.error?.message || 'Failed to generate bulk preview');
      }
    } catch (err) {
      setBulkError('Connection error during bulk preview');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleExecuteBulkUpdate = async () => {
    setBulkSubmitting(true);
    setBulkError(null);
    try {
      const res = await sendApiRequest('bulk_update_students', {
        action: bulkAction,
        studentIds: Array.from(selectedStudentIds),
        targetClass: bulkTargetClass,
        targetSection: bulkTargetSection,
        targetStatus: bulkTargetStatus,
        startRoll: bulkStartRoll,
        preview: false
      });
      if (res && res.success) {
        showToast(res.message || 'Bulk operation completed');
        setIsBulkModalOpen(false);
        setSelectedStudentIds(new Set());
        setBulkPreviewData(null);
        fetchStudents(true);
      } else {
        setBulkError(res?.error?.message || 'Bulk operation failed');
      }
    } catch (err) {
      setBulkError('Connection error executing bulk updates');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // CSV Export
  const handleExportCsv = async () => {
    try {
      const res = await sendApiRequest('export_students_csv', {
        class: selectedClass !== 'ALL' ? selectedClass : '',
        section: selectedSection !== 'ALL' ? selectedSection : '',
        status: selectedStatus !== 'ALL' ? selectedStatus : ''
      });
      if (res && res.success && res.data) {
        const rows = res.data.students;
        if (rows.length === 0) {
          showToast('No student records found to export');
          return;
        }
        const headers = Object.keys(rows[0]);
        const csvContent = [
          headers.join(','),
          ...rows.map((r) => headers.map((h) => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Students_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Exported ${rows.length} student records`);
      }
    } catch (e) {
      showToast('Failed to export CSV');
    }
  };

  // CSV Import Preview & Execution
  const handleParseCsvAndPreview = async () => {
    if (!importCsvText.trim()) return;
    setImportSubmitting(true);
    setImportError(null);

    try {
      // Basic CSV parser
      const lines = importCsvText.trim().split('\n');
      if (lines.length < 2) {
        setImportError('CSV must contain a header row and at least one data row.');
        setImportSubmitting(false);
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const parsedRows = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (row.length === headers.length) {
          const obj = {};
          headers.forEach((h, idx) => {
            obj[h] = row[idx];
          });
          parsedRows.push(obj);
        }
      }

      const res = await sendApiRequest('import_students_csv', {
        rows: parsedRows,
        preview: true
      });

      if (res && res.success) {
        setImportPreviewData(res.data);
      } else {
        setImportError(res?.error?.message || 'Failed to validate CSV');
      }
    } catch (e) {
      setImportError('Error parsing CSV format');
    } finally {
      setImportSubmitting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreviewData || !importPreviewData.validRows) return;
    setImportSubmitting(true);
    setImportError(null);

    try {
      const res = await sendApiRequest('import_students_csv', {
        rows: importPreviewData.validRows,
        preview: false,
        confirm: true
      });

      if (res && res.success) {
        showToast(res.message || 'CSV Import completed successfully');
        setIsImportModalOpen(false);
        setImportCsvText('');
        setImportPreviewData(null);
        fetchStudents(true);
      } else {
        setImportError(res?.error?.message || 'Import failed');
      }
    } catch (e) {
      setImportError('Connection error during CSV import');
    } finally {
      setImportSubmitting(false);
    }
  };

  // Roll Number Manager Handlers
  const handleOpenRollManager = (cls) => {
    const targetCls = cls || (selectedClass !== 'ALL' ? selectedClass : '9');
    setRollClass(targetCls);
    const classStudents = students.filter((s) => String(s.class) === String(targetCls));
    setRollAssignments(
      classStudents.map((s) => ({
        studentId: s.studentId,
        studentName: s.studentName || s.name || 'Student',
        rollNo: String(s.rollNo || s.roll || '')
      }))
    );
    setRollError(null);
    setIsRollModalOpen(true);
  };

  const handleSaveRollNumbers = async () => {
    setRollLoading(true);
    setRollError(null);

    const rollSet = new Set();
    for (let i = 0; i < rollAssignments.length; i++) {
      const r = String(rollAssignments[i].rollNo || '').trim();
      if (r) {
        if (rollSet.has(r)) {
          setRollError(`Duplicate roll number "${r}" detected for student ${rollAssignments[i].studentName}`);
          setRollLoading(false);
          return;
        }
        rollSet.add(r);
      }
    }

    try {
      const res = await sendApiRequest('assign_roll_numbers', {
        class: rollClass,
        assignments: rollAssignments
      });

      if (res && res.success) {
        showToast(`Roll numbers saved for Class ${rollClass}`);
        setIsRollModalOpen(false);
        fetchStudents(true);
      } else {
        setRollError(res?.error?.message || 'Failed to assign roll numbers.');
      }
    } catch (err) {
      setRollError('Connection error updating roll numbers.');
    } finally {
      setRollLoading(false);
    }
  };

  // Promotion Wizard Handlers
  const handleOpenPromotionWizard = async () => {
    setIsPromotionModalOpen(true);
    setPromotionLoading(true);
    setPromotionError(null);
    try {
      const res = await sendApiRequest('get_academic_years');
      if (res && res.success && res.data?.academicYears) {
        const years = res.data.academicYears;
        setAvailableYears(years);
        const activeY = res.data.activeYear || '2026-2027';
        setPromotionSourceYear(activeY);
        const nextYears = years.filter(y => y.yearName !== activeY && y.status !== 'CLOSED' && y.status !== 'ARCHIVED');
        const nextY = nextYears.length > 0 ? nextYears[0].yearName : (
          (parseInt(activeY.split('-')[0]) + 1) + '-' + (parseInt(activeY.split('-')[1]) + 1)
        );
        setPromotionTargetYear(nextY);
        setPromotionSourceClass('9');
        setPromotionTargetClass('10');
        await loadPromotionCandidates('9', activeY, nextY);
      }
    } catch (e) {
      setPromotionError('Failed to load academic sessions');
    } finally {
      setPromotionLoading(false);
    }
  };

  const loadPromotionCandidates = async (cls, srcY, tgtY) => {
    setPromotionLoading(true);
    setPromotionError(null);
    const sYear = srcY || promotionSourceYear;
    const tYear = tgtY || promotionTargetYear;
    const sClass = cls || promotionSourceClass;

    try {
      const res = await sendApiRequest('get_promotion_candidates', {
        sourceAcademicYear: sYear,
        sourceClass: sClass,
        targetAcademicYear: tYear
      });
      if (res && res.success && res.data?.candidates) {
        const cands = res.data.candidates;
        setPromotionList(cands.map(c => ({
          studentId: c.studentId,
          studentName: c.studentName,
          sourceClass: c.sourceClass,
          targetClass: c.suggestedTargetClass,
          decision: c.defaultDecision,
          newRollNo: c.suggestedRollNo,
          targetSection: c.suggestedTargetSection || 'A',
          alreadyPromoted: c.alreadyPromoted,
          existingDecision: c.existingDecision
        })));
        // Select all eligible (unpromoted) students by default
        const eligibleIds = new Set(cands.filter(c => !c.alreadyPromoted).map(c => c.studentId));
        setPromotionSelectedIds(eligibleIds);
        setPromotionTargetClass(res.data.defaultTargetClass || (sClass === '9' ? '10' : sClass === '10' ? '11' : sClass === '11' ? '12' : 'COMPLETED'));
      } else {
        setPromotionError(res?.error?.message || 'Unable to load candidates');
      }
    } catch (err) {
      setPromotionError('Network error loading promotion candidates');
    } finally {
      setPromotionLoading(false);
    }
  };

  const handlePrePromotionCheck = () => {
    setPromotionError(null);
    const selectedList = promotionList.filter(p => promotionSelectedIds.has(p.studentId));
    if (selectedList.length === 0) {
      setPromotionError('Please select at least one student to promote.');
      return;
    }

    // Check duplicate roll numbers
    const rollSet = new Set();
    for (const p of selectedList) {
      if (p.decision !== 'COMPLETED' && p.newRollNo) {
        const rollKey = `${p.targetSection}_${p.newRollNo}`;
        if (rollSet.has(rollKey)) {
          setPromotionError(`Duplicate roll number "${p.newRollNo}" detected in section ${p.targetSection}. Each student must have a unique roll number.`);
          return;
        }
        rollSet.add(rollKey);
      }
    }

    setIsPromotionConfirmOpen(true);
  };

  const handleExecutePromotion = async () => {
    const selectedList = promotionList.filter(p => promotionSelectedIds.has(p.studentId));
    setPromotionLoading(true);
    setPromotionError(null);

    try {
      const res = await sendApiRequest('promote_students', {
        sourceAcademicYear: promotionSourceYear,
        targetAcademicYear: promotionTargetYear,
        promotions: selectedList
      });

      if (res && res.success) {
        showToast(`Successfully promoted ${selectedList.length} students to ${promotionTargetClass === 'COMPLETED' ? 'COMPLETED' : 'Class ' + promotionTargetClass}!`);
        setIsPromotionConfirmOpen(false);
        setIsPromotionModalOpen(false);
        fetchStudents(true);
      } else {
        setPromotionError(res?.error?.message || 'Failed to execute promotions.');
        setIsPromotionConfirmOpen(false);
      }
    } catch (err) {
      setPromotionError('Connection error processing promotions.');
      setIsPromotionConfirmOpen(false);
    } finally {
      setPromotionLoading(false);
    }
  };

  // Helper: Status Badge Styling
  const renderStatusBadge = (status) => {
    const s = String(status || 'ACTIVE').toUpperCase();
    let bg = '#dcfce7';
    let color = '#15803d';
    if (s === 'INACTIVE') {
      bg = '#fee2e2';
      color = '#dc2626';
    } else if (s === 'TRANSFERRED') {
      bg = '#fef3c7';
      color = '#b45309';
    } else if (s === 'COMPLETED') {
      bg = '#e0e7ff';
      color = '#4338ca';
    } else if (s === 'LEFT_SCHOOL') {
      bg = '#f1f5f9';
      color = '#475569';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: bg,
          color: color,
          padding: '3px 8px',
          borderRadius: '999px',
          fontSize: '0.7rem',
          fontWeight: 800,
          letterSpacing: '0.3px'
        }}
      >
        {s}
      </span>
    );
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a, #0284c7)',
          color: '#fff',
          border: 'none',
          padding: '24px',
          boxShadow: '0 10px 25px rgba(2, 132, 199, 0.25)',
          marginBottom: '20px',
          borderRadius: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.85, fontWeight: 700 }}>
              Gameri Higher Secondary School • GAMERI-HSS-001
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={28} />
              <span>Student Management & Academic Operations</span>
            </h1>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, margin: 0 }}>
              Central administrative master directory, admissions, enrollment lifecycle, 360° student records & bulk workflows
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-outline"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)' }}
              onClick={() => fetchStudents(true)}
              disabled={refreshing}
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            {(isAdmin || isPrincipal) && (
              <>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={() => setIsImportModalOpen(true)}
                >
                  <Upload size={15} />
                  <span>Import / Export CSV</span>
                </button>

                <button
                  type="button"
                  className="btn-outline"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={() => setIsBulkModalOpen(true)}
                >
                  <Sliders size={15} />
                  <span>Bulk Operations</span>
                </button>

                <button
                  type="button"
                  className="btn-outline"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={() => handleOpenRollManager('9')}
                >
                  <Hash size={15} />
                  <span>Roll Manager</span>
                </button>

                <button
                  type="button"
                  className="btn-outline"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={handleOpenPromotionWizard}
                >
                  <TrendingUp size={15} />
                  <span>Promotion Wizard</span>
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: '#10b981', borderColor: '#10b981', color: '#fff', fontWeight: 800 }}
                  onClick={() => {
                    setAdmissionError(null);
                    setDuplicateWarning(null);
                    setIsAdmissionModalOpen(true);
                  }}
                >
                  <UserPlus size={16} />
                  <span>New Admission</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '16px 20px', borderRadius: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by Name, Student ID, Admission No, Mobile, Roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Class Filter */}
          <div style={{ minWidth: '130px' }}>
            <select
              className="filter-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="ALL">All Classes</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div style={{ minWidth: '120px' }}>
            <select
              className="filter-select"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="ALL">All Sections</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '130px' }}>
            <select
              className="filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="TRANSFERRED">TRANSFERRED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="LEFT_SCHOOL">LEFT_SCHOOL</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div style={{ minWidth: '140px' }}>
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="roll_asc">Roll No (1 → 99)</option>
              <option value="roll_desc">Roll No (99 → 1)</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
              <option value="class_asc">Class (9 → 12)</option>
            </select>
          </div>

          {/* Export Quick Button */}
          <button
            type="button"
            className="btn-outline"
            style={{ fontSize: '0.8rem', padding: '8px 12px' }}
            onClick={handleExportCsv}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn-outline"
              style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#dc2626', borderColor: '#fca5a5' }}
              onClick={clearAllFilters}
            >
              <X size={13} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Directory Count Summary */}
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
          <div>
            Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> registered students
            {selectedStudentIds.size > 0 && (
              <span style={{ marginLeft: '12px', color: '#0284c7', fontWeight: 700 }}>
                ({selectedStudentIds.size} selected)
              </span>
            )}
          </div>
          {selectedStudentIds.size > 0 && (isAdmin || isPrincipal) && (
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={() => setIsBulkModalOpen(true)}
            >
              Perform Bulk Action ({selectedStudentIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Main Student Directory Table */}
      <div className="card" style={{ padding: '0', borderRadius: '18px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '30px' }}>
            <div className="card skeleton" style={{ height: '80px', marginBottom: '12px', borderRadius: '12px' }} />
            <div className="card skeleton" style={{ height: '80px', marginBottom: '12px', borderRadius: '12px' }} />
            <div className="card skeleton" style={{ height: '80px', borderRadius: '12px' }} />
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#dc2626', fontWeight: 700 }}>{error}</p>
            <button type="button" className="btn-primary" onClick={() => fetchStudents(true)} style={{ marginTop: '10px' }}>
              Retry Loading
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: '#64748b' }}>
            <Users size={48} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', color: '#334155' }}>No Students Found</h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>No student records match the active search or filter criteria.</p>
            {hasActiveFilters && (
              <button type="button" className="btn-outline" onClick={clearAllFilters} style={{ marginTop: '12px' }}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                  {(isAdmin || isPrincipal) && (
                    <th style={{ padding: '12px 16px', width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0}
                        onChange={handleToggleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                  )}
                  <th style={{ padding: '12px 16px' }}>Student Name & ID</th>
                  <th style={{ padding: '12px 16px' }}>Admission No</th>
                  <th style={{ padding: '12px 16px' }}>Class / Sec</th>
                  <th style={{ padding: '12px 16px' }}>Roll</th>
                  <th style={{ padding: '12px 16px' }}>Parent / Contact</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const isSelected = selectedStudentIds.has(s.studentId);
                  return (
                    <tr
                      key={s.studentId}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isSelected ? '#f0f9ff' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {(isAdmin || isPrincipal) && (
                        <td style={{ padding: '12px 16px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectStudent(s.studentId)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                      )}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                          {s.name || s.studentName || s.student_name || 'Student'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          ID: <span style={{ fontFamily: 'monospace' }}>{s.studentId || s.student_id || s.id || '--'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 700, color: '#0284c7', background: '#f0f9ff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                          {s.admissionNo || s.admission_no || '--'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>Class {s.className || s.class || '--'} ({s.section || 'N/A'})</div>
                        <div style={{ marginTop: '4px' }}>
                          {(() => {
                            const groupName = resolveStudentGroup(s);
                            const isAssigned = groupName && groupName !== 'Group Not Assigned';
                            return (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: isAssigned ? '#eff6ff' : '#f8fafc',
                                  color: isAssigned ? '#1d4ed8' : '#64748b',
                                  border: isAssigned ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700
                                }}
                              >
                                <Users size={11} />
                                <span>{isAssigned ? `Group: ${groupName}` : 'Group Not Assigned'}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#334155' }}>
                          {s.rollNo || s.roll_no || s.roll || '--'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ color: '#334155' }}>{s.parentName || s.fatherName || s.father_name || s.motherName || s.mother_name || 'Parent'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.parentMobile || s.mobile || '--'}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {renderStatusBadge(s.status)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn-outline"
                            style={{ padding: '5px 9px', fontSize: '0.75rem', background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}
                            onClick={() => handleOpen360Profile(s.studentId)}
                            title="Open 360° Master Profile"
                          >
                            <Eye size={13} />
                            <span>Profile</span>
                          </button>

                          {(isAdmin || isPrincipal || isTeacher) && (
                            <button
                              type="button"
                              className="btn-outline"
                              style={{ padding: '5px 9px', fontSize: '0.75rem' }}
                              onClick={() => handleOpenEditModal(s)}
                              title="Edit Personal Information"
                            >
                              <Edit size={13} />
                              <span>Edit</span>
                            </button>
                          )}

                          {(isAdmin || isPrincipal) && (
                            <button
                              type="button"
                              className="btn-outline"
                              style={{ padding: '5px 9px', fontSize: '0.75rem', color: '#d97706', borderColor: '#fde68a' }}
                              onClick={() => handleOpenStatusModal(s)}
                              title="Change Administrative Status"
                            >
                              <ShieldCheck size={13} />
                              <span>Status</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Admission / Registration Form */}
      {isAdmissionModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Student Admission & Registration
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Register a new student with authoritative active enrollment and guardian linking
                </p>
              </div>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '6px', border: 'none' }}
                onClick={() => setIsAdmissionModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Live Duplicate Warning Banner */}
            {duplicateWarning && duplicateWarning.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: 800, fontSize: '0.85rem', marginBottom: '6px' }}>
                  <AlertTriangle size={16} />
                  <span>POSSIBLE DUPLICATE STUDENT DETECTED ({duplicateWarning.length})</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
                  Existing records match the specified name, DOB, or admission number:
                </div>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {duplicateWarning.map((d, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #fef3c7', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{d.existingStudent.studentName}</strong> (ID: {d.existingStudent.studentId} • Class {d.existingStudent.class})
                      </div>
                      <span style={{ color: '#b45309', fontWeight: 700 }}>Match: {d.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {admissionError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '14px' }}>
                {admissionError}
              </div>
            )}

            <form onSubmit={(e) => handleCreateAdmission(e, false)}>
              {/* Identity Details */}
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e3a8a', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                1. Student Identity
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Sharma"
                    value={admissionForm.studentName}
                    onChange={(e) => handleAdmissionFieldChange('studentName', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={admissionForm.dob}
                    onChange={(e) => handleAdmissionFieldChange('dob', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Gender</label>
                  <select
                    value={admissionForm.gender}
                    onChange={(e) => handleAdmissionFieldChange('gender', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Social Category</label>
                  <select
                    value={admissionForm.category}
                    onChange={(e) => handleAdmissionFieldChange('category', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="MOBC">MOBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
              </div>

              {/* Academic Placement */}
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e3a8a', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                2. Academic Placement
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Admission No</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={admissionForm.admissionNo}
                    onChange={(e) => handleAdmissionFieldChange('admissionNo', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Class *</label>
                  <select
                    value={admissionForm.class}
                    onChange={(e) => handleAdmissionFieldChange('class', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                    <option value="11">Class 11</option>
                    <option value="12">Class 12</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Section</label>
                  <select
                    value={admissionForm.section}
                    onChange={(e) => handleAdmissionFieldChange('section', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 1"
                    value={admissionForm.rollNo}
                    onChange={(e) => handleAdmissionFieldChange('rollNo', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Guardian & Contact */}
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e3a8a', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                3. Guardian & Contact
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Father's Name</label>
                  <input
                    type="text"
                    value={admissionForm.fatherName}
                    onChange={(e) => handleAdmissionFieldChange('fatherName', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Mother's Name</label>
                  <input
                    type="text"
                    value={admissionForm.motherName}
                    onChange={(e) => handleAdmissionFieldChange('motherName', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Parent/Guardian Mobile (Portal Login)</label>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={admissionForm.parentMobile}
                    onChange={(e) => handleAdmissionFieldChange('parentMobile', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Village / Town</label>
                  <input
                    type="text"
                    value={admissionForm.village}
                    onChange={(e) => handleAdmissionFieldChange('village', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setIsAdmissionModalOpen(false)}
                >
                  Cancel
                </button>
                {duplicateWarning && duplicateWarning.length > 0 && (
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ color: '#b45309', borderColor: '#fde68a' }}
                    onClick={(e) => handleCreateAdmission(e, true)}
                    disabled={admissionSubmitting}
                  >
                    Force Register (Override Duplicate)
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={admissionSubmitting}
                >
                  {admissionSubmitting ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: 360° Comprehensive Student Master Profile */}
      {isProfileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
            {profileLoading ? (
              <div style={{ padding: '40px' }}>
                <div className="card skeleton" style={{ height: '140px', borderRadius: '16px', marginBottom: '16px' }} />
                <div className="card skeleton" style={{ height: '220px', borderRadius: '16px' }} />
              </div>
            ) : profileData ? (
              <div>
                {/* Profile Top Banner */}
                <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff', padding: '24px 28px', position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
                  >
                    <X size={22} />
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                          {profileData.student.studentName}
                        </h2>
                        {renderStatusBadge(profileData.student.status)}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span>Student ID: <strong style={{ color: '#38bdf8' }}>{profileData.student.studentId}</strong></span>
                        <span>Admission No: <strong style={{ color: '#38bdf8' }}>{profileData.student.admissionNo || '--'}</strong></span>
                        <span>Class: <strong>{profileData.student.class} ({profileData.student.section || 'N/A'})</strong></span>
                        <span>Roll: <strong>#{profileData.student.rollNo || '--'}</strong></span>
                        {(() => {
                          const modalGroup = resolveStudentGroup(profileData.student);
                          const hasModalGroup = modalGroup && modalGroup !== 'Group Not Assigned';
                          return (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: hasModalGroup ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                border: hasModalGroup ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                                color: hasModalGroup ? '#38bdf8' : '#cbd5e1',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 700
                              }}
                            >
                              <Users size={12} />
                              <span>Group: <strong>{modalGroup}</strong></span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Tabs */}
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'personal', label: 'Personal & Contact' },
                      { id: 'parents', label: 'Parents / Guardian' },
                      { id: 'enrollment', label: 'Current Enrollment' },
                      { id: 'history', label: 'Academic History' },
                      { id: 'attendance', label: 'Attendance' },
                      { id: 'results', label: 'Examinations' },
                      { id: 'documents', label: 'Documents' },
                      ...(isAdmin || isPrincipal ? [{ id: 'audit', label: 'Audit Trail' }] : [])
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setProfileTab(tab.id)}
                        style={{
                          background: profileTab === tab.id ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                          color: profileTab === tab.id ? '#0f172a' : '#cbd5e1',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profile Body Content by Tab */}
                <div style={{ padding: '24px 28px' }}>
                  {profileTab === 'overview' && (
                    <div>
                      {/* Metric Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                        <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700 }}>ATTENDANCE RATE</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#166534', margin: '4px 0' }}>
                            {profileData.attendanceSummary.percentage}%
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                            {profileData.attendanceSummary.presentDays} / {profileData.attendanceSummary.totalWorkingDays} days present
                          </div>
                        </div>

                        <div style={{ background: '#f0f9ff', border: '1px solid #e0f2fe', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 700 }}>ACADEMIC DOCUMENTS</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#075985', margin: '4px 0' }}>
                            {profileData.documents.length}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
                            Official records on file
                          </div>
                        </div>

                        <div style={{ background: '#fdf4ff', border: '1px solid #fae8ff', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#a21caf', fontWeight: 700 }}>EXAM RESULTS</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#86198f', margin: '4px 0' }}>
                            {profileData.examinationResults.length}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#a21caf' }}>
                            Calculated term evaluations
                          </div>
                        </div>

                        <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#a16207', fontWeight: 700 }}>STREAM / TRADE</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#854d0e', margin: '6px 0' }}>
                            {profileData.student.stream || 'IT/ITeS'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#a16207' }}>
                            Vocational Specialization
                          </div>
                        </div>

                        <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Users size={13} />
                            <span>STUDENT GROUP</span>
                          </div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a', margin: '6px 0' }}>
                            {resolveStudentGroup(profileData.student)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#3b82f6' }}>
                            Authoritative Cohort
                          </div>
                        </div>
                      </div>

                      {/* Quick Summary Grid */}
                      <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' }}>
                        <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#1e293b' }}>Key Profile Overview</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.8rem' }}>
                          <div><span style={{ color: '#64748b' }}>Date of Birth:</span> <strong>{profileData.student.dob || '--'}</strong></div>
                          <div><span style={{ color: '#64748b' }}>Gender:</span> <strong>{profileData.student.gender || 'Male'}</strong></div>
                          <div><span style={{ color: '#64748b' }}>Father's Name:</span> <strong>{profileData.student.fatherName || '--'}</strong></div>
                          <div><span style={{ color: '#64748b' }}>Mother's Name:</span> <strong>{profileData.student.motherName || '--'}</strong></div>
                          <div><span style={{ color: '#64748b' }}>Contact Mobile:</span> <strong>{profileData.student.mobile || '--'}</strong></div>
                          <div><span style={{ color: '#64748b' }}>Village/Town:</span> <strong>{profileData.student.village || '--'}</strong></div>
                          <div><span style={{ color: '#64748b' }}>Assigned Group:</span> <strong>{resolveStudentGroup(profileData.student)}</strong></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {profileTab === 'personal' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '0.85rem' }}>
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Full Student Name</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: '2px' }}>{profileData.student.studentName}</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Date of Birth</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: '2px' }}>{profileData.student.dob || '--'}</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Gender & Category</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: '2px' }}>{profileData.student.gender || 'Male'} • {profileData.student.category || 'General'}</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Blood Group</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: '2px' }}>{profileData.student.bloodGroup || 'Not specified'}</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Primary Mobile</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: '2px' }}>{profileData.student.mobile || '--'}</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Residential Address</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', marginTop: '2px' }}>{profileData.student.address || profileData.student.village || '--'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{profileData.student.district || 'Biswanath'}, {profileData.student.state || 'Assam'} - {profileData.student.pinCode || '784176'}</div>
                      </div>
                    </div>
                  )}

                  {profileTab === 'parents' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b' }}>Authorized Parent/Guardian Accounts</h4>
                      </div>

                      {profileData.parents.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '0.85rem' }}>
                          No linked parent portal accounts found.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                          {profileData.parents.map((p) => (
                            <div
                              key={p.linkId || p.parentId}
                              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                              <div>
                                <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.parentName} ({p.relationship})</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Mobile: {p.mobile} • Account ID: {p.parentId}</div>
                              </div>
                              {(isAdmin || isPrincipal) && (
                                <button
                                  type="button"
                                  className="btn-outline"
                                  style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '4px 8px', fontSize: '0.75rem' }}
                                  onClick={() => handleUnlinkParent(p.linkId)}
                                >
                                  <Unlink size={13} />
                                  <span>Unlink</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Parent Form (Admin/Principal only) */}
                      {(isAdmin || isPrincipal) && (
                        <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '12px', marginTop: '16px' }}>
                          <h5 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#1e293b' }}>Link New Parent Account</h5>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                            <input
                              type="text"
                              placeholder="Parent Name"
                              value={newParentName}
                              onChange={(e) => setNewParentName(e.target.value)}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                            />
                            <input
                              type="tel"
                              placeholder="10-digit Mobile Number"
                              value={newParentMobile}
                              onChange={(e) => setNewParentMobile(e.target.value)}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                            />
                            <select
                              value={newParentRel}
                              onChange={(e) => setNewParentRel(e.target.value)}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                            >
                              <option value="Father">Father</option>
                              <option value="Mother">Mother</option>
                              <option value="Guardian">Guardian</option>
                            </select>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={handleLinkParent}
                            >
                              <Link size={13} />
                              <span>Link Parent</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {profileTab === 'enrollment' && (
                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#1e293b' }}>Current Active Enrollment Details</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                        <div><span style={{ color: '#64748b' }}>Academic Session:</span> <strong>{profileData.currentEnrollment.academicYear || '2026-2027'}</strong></div>
                        <div><span style={{ color: '#64748b' }}>Assigned Class:</span> <strong>Class {profileData.currentEnrollment.class}</strong></div>
                        <div><span style={{ color: '#64748b' }}>Assigned Section:</span> <strong>Section {profileData.currentEnrollment.section || 'A'}</strong></div>
                        <div><span style={{ color: '#64748b' }}>Assigned Roll:</span> <strong>#{profileData.currentEnrollment.rollNo || '--'}</strong></div>
                        <div><span style={{ color: '#64748b' }}>Assigned Group:</span> <strong>{resolveStudentGroup(profileData.student)}</strong></div>
                        <div><span style={{ color: '#64748b' }}>Enrollment Status:</span> {renderStatusBadge(profileData.currentEnrollment.status)}</div>
                        <div><span style={{ color: '#64748b' }}>Enrolled Stream:</span> <strong>{profileData.student.stream || 'IT/ITeS'}</strong></div>
                      </div>
                    </div>
                  )}

                  {profileTab === 'history' && (
                    <div>
                      <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#1e293b' }}>Chronological Academic Trajectory</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {profileData.academicHistory.map((h, i) => (
                          <div
                            key={h.academicYear || i}
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <div>
                              <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem' }}>
                                {h.academicYear} • Class {h.class} ({h.section || 'A'})
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Roll #{h.rollNo || '--'} • Attendance: {h.attendancePercentage !== null && h.attendancePercentage !== undefined ? `${h.attendancePercentage}%` : '--'} • Evaluated Marks: {h.marksCount} records
                              </div>
                            </div>
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                              {h.promotionDecision || h.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {profileTab === 'attendance' && (
                    <div>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ background: '#f0fdf4', padding: '12px 18px', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                          <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>Overall Attendance</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d' }}>{profileData.attendanceSummary.percentage}%</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '12px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700 }}>Present Days</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#334155' }}>{profileData.attendanceSummary.presentDays}</div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '12px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700 }}>Absent Days</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#334155' }}>{profileData.attendanceSummary.absentDays}</div>
                        </div>
                      </div>

                      <h5 style={{ margin: '0 0 8px', fontSize: '0.85rem' }}>Recent Attendance Logs</h5>
                      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <th style={{ padding: '6px 10px' }}>Date</th>
                              <th style={{ padding: '6px 10px' }}>Class</th>
                              <th style={{ padding: '6px 10px' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profileData.attendanceSummary.recentRecords.map((r, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 10px' }}>{r.date}</td>
                                <td style={{ padding: '6px 10px' }}>Class {r.class}</td>
                                <td style={{ padding: '6px 10px', fontWeight: 700, color: r.status === 'PRESENT' ? '#16a34a' : '#dc2626' }}>
                                  {r.status}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {profileTab === 'results' && (
                    <div>
                      <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#1e293b' }}>Authoritative Examination Results</h4>
                      {profileData.examinationResults.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '0.85rem' }}>
                          No published examination results recorded.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {profileData.examinationResults.map((r, i) => (
                            <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontWeight: 800, color: '#1e3a8a' }}>{r.examName} ({r.academicYear})</div>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Marks: {r.totalMarks}/{r.maxMarks} • Percentage: {r.percentage}%</div>
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>
                                  Grade: {r.grade}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {profileTab === 'documents' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b' }}>Academic Documents on File</h4>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          onClick={() => {
                            setIsProfileModalOpen(false);
                            if (onNavigate) onNavigate('/documents');
                          }}
                        >
                          <span>Open Document Center</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>

                      {profileData.documents.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '0.85rem' }}>
                          No academic documents currently issued for this student.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {profileData.documents.map((d) => (
                            <div
                              key={d.documentId}
                              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>{d.title || d.documentType}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Number: {d.documentNumber || '--'} • Issue Date: {d.issueDate || d.createdAt || '--'}</div>
                              </div>
                              <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                                {d.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {profileTab === 'audit' && (isAdmin || isPrincipal) && (
                    <div>
                      <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#1e293b' }}>Administrative Audit Logs</h4>
                      {profileData.auditLogs.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '0.85rem' }}>
                          No audit trail records found.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto' }}>
                          {profileData.auditLogs.map((l, i) => (
                            <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '0.75rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                <span>{l.action}</span>
                                <span style={{ color: '#64748b' }}>{l.timestamp}</span>
                              </div>
                              <div style={{ color: '#475569', marginTop: '2px' }}>
                                Actor: {l.actorId} ({l.actorType || l.role}) • Status: {l.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal 3: Edit Student Personal Info */}
      {isEditModalOpen && editFormData && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Edit Student Profile Information
              </h3>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '6px', border: 'none' }}
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '14px' }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEditProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Student ID (Immutable)</label>
                  <input
                    type="text"
                    disabled
                    value={editFormData.studentId}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Admission Number</label>
                  <input
                    type="text"
                    value={editFormData.admissionNo}
                    onChange={(e) => setEditFormData({ ...editFormData, admissionNo: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.studentName}
                    onChange={(e) => setEditFormData({ ...editFormData, studentName: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={editFormData.dob}
                    onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Gender</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Category</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="MOBC">MOBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Father's Name</label>
                  <input
                    type="text"
                    value={editFormData.fatherName}
                    onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Mother's Name</label>
                  <input
                    type="text"
                    value={editFormData.motherName}
                    onChange={(e) => setEditFormData({ ...editFormData, motherName: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Mobile Number</label>
                  <input
                    type="tel"
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Stream / Trade</label>
                  <input
                    type="text"
                    value={editFormData.stream}
                    onChange={(e) => setEditFormData({ ...editFormData, stream: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Update Student Status */}
      {isStatusModalOpen && statusStudent && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '480px', padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Update Student Status
              </h3>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '6px', border: 'none' }}
                onClick={() => setIsStatusModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 16px' }}>
              Changing the status of <strong>{statusStudent.studentName || statusStudent.name}</strong> ({statusStudent.studentId}). Historical attendance, marks, and documents are always preserved.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>Target Status:</label>
              <select
                value={newStatusValue}
                onChange={(e) => setNewStatusValue(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              >
                <option value="ACTIVE">ACTIVE (Currently enrolled and attending)</option>
                <option value="INACTIVE">INACTIVE (Temporarily suspended / On hold)</option>
                <option value="TRANSFERRED">TRANSFERRED (Issued Transfer Certificate)</option>
                <option value="COMPLETED">COMPLETED (Graduated / Completed Class 12)</option>
                <option value="LEFT_SCHOOL">LEFT_SCHOOL (Withdrawn / Discontinued)</option>
              </select>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>Administrative Reason / Remarks:</label>
              <input
                type="text"
                placeholder="e.g. Higher secondary admission in another district"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setIsStatusModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#d97706', borderColor: '#d97706' }}
                onClick={handleSaveStatus}
                disabled={statusSubmitting}
              >
                {statusSubmitting ? 'Updating...' : 'Confirm Status Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Bulk Operations Wizard */}
      {isBulkModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Administrative Bulk Operations
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Perform batch assignments on {selectedStudentIds.size} selected students with 2-phase preview verification
                </p>
              </div>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '6px', border: 'none' }}
                onClick={() => setIsBulkModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {bulkError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '14px' }}>
                {bulkError}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>Select Operation Action:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {[
                  { id: 'ASSIGN_CLASS', label: 'Assign Class' },
                  { id: 'ASSIGN_SECTION', label: 'Assign Section' },
                  { id: 'UPDATE_STATUS', label: 'Update Status' },
                  { id: 'ASSIGN_ROLL', label: 'Sequential Roll' }
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      setBulkAction(act.id);
                      setBulkPreviewData(null);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: bulkAction === act.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: bulkAction === act.id ? '#f0f9ff' : '#fff',
                      color: bulkAction === act.id ? '#0369a1' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Specific Parameters */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              {bulkAction === 'ASSIGN_CLASS' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Target Class:</label>
                    <select
                      value={bulkTargetClass}
                      onChange={(e) => setBulkTargetClass(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    >
                      <option value="9">Class 9</option>
                      <option value="10">Class 10</option>
                      <option value="11">Class 11</option>
                      <option value="12">Class 12</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Target Section:</label>
                    <select
                      value={bulkTargetSection}
                      onChange={(e) => setBulkTargetSection(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                </div>
              )}

              {bulkAction === 'ASSIGN_SECTION' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Target Section:</label>
                  <select
                    value={bulkTargetSection}
                    onChange={(e) => setBulkTargetSection(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              )}

              {bulkAction === 'UPDATE_STATUS' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Target Status:</label>
                  <select
                    value={bulkTargetStatus}
                    onChange={(e) => setBulkTargetStatus(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="TRANSFERRED">TRANSFERRED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="LEFT_SCHOOL">LEFT_SCHOOL</option>
                  </select>
                </div>
              )}

              {bulkAction === 'ASSIGN_ROLL' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>Starting Sequential Roll Number:</label>
                  <input
                    type="number"
                    min="1"
                    value={bulkStartRoll}
                    onChange={(e) => setBulkStartRoll(e.target.value)}
                    style={{ width: '120px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  />
                </div>
              )}
            </div>

            {/* Preview Verification Table */}
            {bulkPreviewData && (
              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#1e293b' }}>
                  Validation Preview ({bulkPreviewData.affectedCount} students affected)
                </h5>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '6px 10px' }}>Student</th>
                        <th style={{ padding: '6px 10px' }}>Current State</th>
                        <th style={{ padding: '6px 10px' }}>New State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreviewData.changes.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 700 }}>{c.studentName}</td>
                          <td style={{ padding: '6px 10px', color: '#64748b' }}>
                            Class {c.before.class} ({c.before.section}) • Roll #{c.before.rollNo || '--'} • {c.before.status}
                          </td>
                          <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0369a1' }}>
                            Class {c.after.class} ({c.after.section}) • Roll #{c.after.rollNo || '--'} • {c.after.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setIsBulkModalOpen(false)}
              >
                Cancel
              </button>
              {!bulkPreviewData ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleBulkPreview}
                  disabled={bulkSubmitting}
                >
                  {bulkSubmitting ? 'Validating...' : 'Generate Preview'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: '#059669', borderColor: '#059669' }}
                  onClick={handleExecuteBulkUpdate}
                  disabled={bulkSubmitting}
                >
                  {bulkSubmitting ? 'Applying Updates...' : 'Confirm & Execute Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: CSV Import / Export Tool */}
      {isImportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                Controlled CSV Student Import & Export
              </h3>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '6px', border: 'none' }}
                onClick={() => setIsImportModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {importError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '14px' }}>
                {importError}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                Paste CSV Data (Header: <code>studentName,class,section,rollNo,dob,admissionNo,fatherName,motherName,mobile,village</code>):
              </label>
              <textarea
                rows={6}
                placeholder={`studentName,class,section,rollNo,dob,admissionNo,fatherName,motherName,mobile,village\nRohan Sharma,9,A,1,2011-04-15,ADM-2026-101,Mr. Sharma,Mrs. Sharma,9876543210,Gamiri`}
                value={importCsvText}
                onChange={(e) => {
                  setImportCsvText(e.target.value);
                  setImportPreviewData(null);
                }}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontFamily: 'monospace' }}
              />
            </div>

            {/* Validation Report */}
            {importPreviewData && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                    Valid Rows: {importPreviewData.summary.validCount}
                  </span>
                  <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                    Errors: {importPreviewData.summary.invalidCount}
                  </span>
                  <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                    Duplicates: {importPreviewData.summary.duplicateWarningCount}
                  </span>
                </div>

                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '6px 10px' }}>Student Name</th>
                        <th style={{ padding: '6px 10px' }}>Class / Sec</th>
                        <th style={{ padding: '6px 10px' }}>Admission No</th>
                        <th style={{ padding: '6px 10px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreviewData.validRows.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 700 }}>{r.studentName}</td>
                          <td style={{ padding: '6px 10px' }}>Class {r.class} ({r.section})</td>
                          <td style={{ padding: '6px 10px' }}>{r.admissionNo}</td>
                          <td style={{ padding: '6px 10px', color: '#16a34a', fontWeight: 700 }}>Ready to Import</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setIsImportModalOpen(false)}
              >
                Cancel
              </button>
              {!importPreviewData ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleParseCsvAndPreview}
                  disabled={importSubmitting || !importCsvText.trim()}
                >
                  {importSubmitting ? 'Validating CSV...' : 'Validate & Preview'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: '#059669', borderColor: '#059669' }}
                  onClick={handleConfirmImport}
                  disabled={importSubmitting || importPreviewData.summary.validCount === 0}
                >
                  {importSubmitting ? 'Importing...' : `Confirm Import (${importPreviewData.summary.validCount} Students)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 7: Roll Number Manager */}
      {isRollModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '580px', padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                Roll Number Manager
              </h3>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '6px', border: 'none' }}
                onClick={() => setIsRollModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {rollError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '14px' }}>
                {rollError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto' }}>
              {availableClasses.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => handleOpenRollManager(cls)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: rollClass === cls ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: rollClass === cls ? '#f0f9ff' : '#fff',
                    color: rollClass === cls ? '#0369a1' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Class {cls}
                </button>
              ))}
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>Student Name</th>
                    <th style={{ padding: '8px 12px', width: '100px' }}>Roll Number</th>
                  </tr>
                </thead>
                <tbody>
                  {rollAssignments.map((a, idx) => (
                    <tr key={a.studentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{a.studentName}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="text"
                          value={a.rollNo}
                          onChange={(e) => {
                            const updated = [...rollAssignments];
                            updated[idx].rollNo = e.target.value;
                            setRollAssignments(updated);
                          }}
                          style={{ width: '60px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setIsRollModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveRollNumbers}
                disabled={rollLoading}
              >
                {rollLoading ? 'Saving...' : 'Save Roll Numbers'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 8: Promotion Wizard */}
      {isPromotionModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '650px', padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                Academic Promotion Wizard
              </h3>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '6px', border: 'none' }}
                onClick={() => setIsPromotionModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {promotionError && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '14px' }}>
                {promotionError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Source Academic Session</label>
                <select
                  value={promotionSourceYear}
                  onChange={(e) => {
                    setPromotionSourceYear(e.target.value);
                    loadPromotionCandidates(promotionSourceClass, e.target.value, promotionTargetYear);
                  }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  {availableYears.length > 0 ? (
                    availableYears.map(y => <option key={y.yearName} value={y.yearName}>{y.yearName} {y.isCurrent ? '(Active)' : ''}</option>)
                  ) : (
                    <option value={promotionSourceYear}>{promotionSourceYear}</option>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Target Academic Session</label>
                <select
                  value={promotionTargetYear}
                  onChange={(e) => {
                    setPromotionTargetYear(e.target.value);
                    loadPromotionCandidates(promotionSourceClass, promotionSourceYear, e.target.value);
                  }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  {availableYears.length > 0 ? (
                    availableYears.map(y => <option key={y.yearName} value={y.yearName}>{y.yearName} {y.isCurrent ? '(Active)' : ''}</option>)
                  ) : (
                    <option value={promotionTargetYear}>{promotionTargetYear}</option>
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '12px', marginBottom: '16px', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>From Class</label>
                <select
                  value={promotionSourceClass}
                  onChange={(e) => {
                    const cls = e.target.value;
                    setPromotionSourceClass(cls);
                    loadPromotionCandidates(cls, promotionSourceYear, promotionTargetYear);
                  }}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>

              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <ArrowRight size={20} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Target Action</label>
                <div style={{ padding: '6px 10px', borderRadius: '6px', background: '#ecfdf5', color: '#065f46', fontWeight: 800, fontSize: '0.85rem', textAlign: 'center' }}>
                  {promotionSourceClass === '12' ? 'COMPLETED / GRADUATE' : `Class ${promotionTargetClass}`} ({promotionTargetYear})
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                Eligible Students ({promotionSelectedIds.size} of {promotionList.length} selected)
              </span>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => {
                  const unpromoted = promotionList.filter(p => !p.alreadyPromoted).map(p => p.studentId);
                  if (promotionSelectedIds.size === unpromoted.length) {
                    setPromotionSelectedIds(new Set());
                  } else {
                    setPromotionSelectedIds(new Set(unpromoted));
                  }
                }}
              >
                {promotionSelectedIds.size === promotionList.filter(p => !p.alreadyPromoted).length ? 'Deselect All' : 'Select All Eligible'}
              </button>
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', width: '36px' }}></th>
                    <th style={{ padding: '8px 12px' }}>Student</th>
                    <th style={{ padding: '8px 12px', width: '140px' }}>Decision</th>
                    <th style={{ padding: '8px 12px', width: '90px' }}>New Roll</th>
                  </tr>
                </thead>
                <tbody>
                  {promotionList.map((p, idx) => {
                    const isSelected = promotionSelectedIds.has(p.studentId);
                    return (
                      <tr key={p.studentId} style={{ borderBottom: '1px solid #f1f5f9', opacity: p.alreadyPromoted ? 0.6 : 1 }}>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={p.alreadyPromoted}
                            onChange={(e) => {
                              const updated = new Set(promotionSelectedIds);
                              if (e.target.checked) updated.add(p.studentId);
                              else updated.delete(p.studentId);
                              setPromotionSelectedIds(updated);
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                          <div>{p.studentName}</div>
                          {p.alreadyPromoted && (
                            <span style={{ fontSize: '0.7rem', color: '#15803d', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                              ✓ Already Promoted
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <select
                            value={p.decision}
                            disabled={p.alreadyPromoted}
                            onChange={(e) => {
                              const updated = [...promotionList];
                              updated[idx].decision = e.target.value;
                              setPromotionList(updated);
                            }}
                            style={{ width: '100%', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                          >
                            <option value="PROMOTED">Promote</option>
                            <option value="NOT_PROMOTED">Retain</option>
                            {promotionSourceClass === '12' && <option value="COMPLETED">Completed</option>}
                          </select>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="text"
                            value={p.newRollNo}
                            disabled={p.alreadyPromoted || p.decision === 'COMPLETED'}
                            onChange={(e) => {
                              const updated = [...promotionList];
                              updated[idx].newRollNo = e.target.value;
                              setPromotionList(updated);
                            }}
                            style={{ width: '50px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setIsPromotionModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#059669', borderColor: '#059669' }}
                onClick={handlePrePromotionCheck}
                disabled={promotionLoading || promotionSelectedIds.size === 0}
              >
                {promotionLoading ? 'Loading Candidates...' : `Review & Promote (${promotionSelectedIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Confirmation Summary Modal */}
      {isPromotionConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '480px', padding: '28px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '12px' }}>
                <CheckCircle2 size={24} color="#059669" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Confirm Student Promotion
              </h3>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '18px', border: '1px solid #e2e8f0', fontSize: '0.88rem', lineHeight: '1.6' }}>
              <div><strong>Students Selected:</strong> {promotionSelectedIds.size} student(s)</div>
              <div><strong>From Class:</strong> Class {promotionSourceClass} ({promotionSourceYear})</div>
              <div><strong>To Target:</strong> {promotionSourceClass === '12' ? 'COMPLETED / GRADUATED' : `Class ${promotionTargetClass}`} ({promotionTargetYear})</div>
              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#059669' }}>
                ✓ Zero data loss: Previous academic history, attendance, and exam marks remain intact.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setIsPromotionConfirmOpen(false)}
                disabled={promotionLoading}
              >
                Back to Edit
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#059669', borderColor: '#059669' }}
                onClick={handleExecutePromotion}
                disabled={promotionLoading}
              >
                {promotionLoading ? 'Promoting Students...' : 'Execute Promotion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
