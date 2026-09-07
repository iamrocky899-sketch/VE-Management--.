import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendApiRequest } from '../api/client';
import {
  Users,
  Search,
  Filter,
  Plus,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Shield,
  BookOpen,
  School,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Edit,
  RotateCcw,
  Sparkles,
  Layers,
  Briefcase,
  GraduationCap,
  Calendar,
  Download,
  Upload,
  AlertTriangle,
  ArrowRight,
  Check,
  History,
  Award,
  CheckSquare,
  Square,
  ChevronRight,
  UserPlus,
  Clock,
  FileSpreadsheet
} from 'lucide-react';

export default function Teachers({ onNavigate }) {
  const { user, isPrincipal, isAdmin, isTeacher } = useAuth();
  
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'assignments', 'workload', 'bulk'

  // Master Data States
  const [staffList, setStaffList] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [workloadsList, setWorkloadsList] = useState([]);
  const [academicYears, setAcademicYears] = useState(['2026-2027', '2025-2026']);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026-2027');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters for Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedDesignation, setSelectedDesignation] = useState('ALL');

  // Filters for Assignments Tab
  const [asgClassFilter, setAsgClassFilter] = useState('ALL');
  const [asgSectionFilter, setAsgSectionFilter] = useState('ALL');
  const [asgSubjectFilter, setAsgSubjectFilter] = useState('ALL');
  const [asgTeacherFilter, setAsgTeacherFilter] = useState('ALL');
  const [asgTypeFilter, setAsgTypeFilter] = useState('ALL');

  // Modal 1: 360° Staff Profile Drawer / Modal
  const [profileStaffId, setProfileStaffId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileTab, setProfileTab] = useState('overview'); // 'overview', 'assignments', 'workload', 'account', 'audit'

  // Modal 2: Add Staff
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    staffName: '',
    firstName: '',
    lastName: '',
    gender: 'Male',
    dob: '',
    mobile: '',
    email: '',
    role: 'TEACHER',
    designation: 'Vocational Teacher',
    department: 'Vocational Education',
    employmentType: 'Permanent',
    qualification: 'Post Graduate / B.Ed',
    specialization: 'Information Technology',
    stream: 'IT/ITeS',
    address: '',
    village: '',
    district: 'Biswanath',
    state: 'Assam',
    pinCode: '784176',
    passwordMode: 'COMMON',
    customPassword: ''
  });
  const [showCustomPassword, setShowCustomPassword] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);

  // Modal 3: Edit Staff
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);

  // Modal 4: Assign Teacher (Single)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    staffId: '',
    academicYear: '2026-2027',
    class: '9',
    section: 'A',
    subject: 'Information Technology (IT/ITeS)',
    component: 'BOTH',
    assignmentType: 'SUBJECT_TEACHER',
    confirmOverwrite: false,
    remarks: ''
  });
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const [assignConflict, setAssignConflict] = useState(null);

  // Modal 5: Change Status Modal
  const [statusModalStaff, setStatusModalStaff] = useState(null);
  const [newStatusValue, setNewStatusValue] = useState('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Modal 6: Confirmation Modal
  const [confirmModal, setConfirmModal] = useState(null);

  // Bulk Operations State
  const [bulkStaffId, setBulkStaffId] = useState('');
  const [bulkClasses, setBulkClasses] = useState(['9', '10']);
  const [bulkSections, setBulkSections] = useState(['A', 'B']);
  const [bulkSubject, setBulkSubject] = useState('Information Technology (IT/ITeS)');
  const [bulkComponent, setBulkComponent] = useState('BOTH');
  const [bulkType, setBulkType] = useState('SUBJECT_TEACHER');
  const [bulkPreviewData, setBulkPreviewData] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // CSV Import State
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreviewData, setCsvPreviewData] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState(null);

  // Available institutional options
  const departmentsList = [
    'Vocational Education',
    'Information Technology',
    'Languages',
    'Mathematics',
    'Science',
    'Social Science',
    'Administration',
    'Sports & Arts'
  ];

  const designationsList = [
    'Principal',
    'Vice Principal',
    'Vocational Teacher',
    'Senior Teacher',
    'Assistant Teacher',
    'Instructor',
    'Office Staff',
    'Coordinator',
    'Librarian',
    'Other'
  ];

  const subjectsList = [
    'Information Technology (IT/ITeS)',
    'Computer Applications',
    'English',
    'Assamese',
    'Mathematics',
    'General Science',
    'Social Science',
    'Hindi',
    'Environmental Studies'
  ];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch all staff and assignment data
  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Staff List
      const staffRes = await sendApiRequest('get_staff_list', { academicYear: selectedAcademicYear });
      if (staffRes && staffRes.success && staffRes.data) {
        setStaffList(staffRes.data.staff || []);
      }

      // 2. Assignments List
      const asgRes = await sendApiRequest('get_staff_assignments', { academicYear: selectedAcademicYear, allStaff: true });
      if (asgRes && asgRes.success && asgRes.data) {
        setAssignmentsList(asgRes.data.assignments || []);
      }

      // 3. Workloads Summary
      const wlRes = await sendApiRequest('get_teacher_workload', { academicYear: selectedAcademicYear, allStaff: true });
      if (wlRes && wlRes.success && wlRes.data) {
        setWorkloadsList(wlRes.data.workloads || []);
      }

      // 4. Academic Years
      const yrsRes = await sendApiRequest('get_academic_years');
      if (yrsRes && yrsRes.success && yrsRes.data && yrsRes.data.academicYears) {
        const yrs = yrsRes.data.academicYears.map(y => y.yearName || y.yearId).filter(Boolean);
        if (yrs.length > 0) setAcademicYears(yrs);
      }
    } catch (err) {
      setError('Unable to load staff and academic workforce records from the server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedAcademicYear]);

  // Filtered Staff Directory
  const filteredStaff = useMemo(() => {
    let list = [...staffList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => {
        const name = (s.staffName || s.name || '').toLowerCase();
        const empId = String(s.employeeId || s.staffId || '').toLowerCase();
        const mobile = String(s.mobile || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const desig = (s.designation || '').toLowerCase();
        const dept = (s.department || '').toLowerCase();
        return name.includes(q) || empId.includes(q) || mobile.includes(q) || email.includes(q) || desig.includes(q) || dept.includes(q);
      });
    }

    if (selectedRole !== 'ALL') {
      list = list.filter((s) => (s.role || 'TEACHER').toUpperCase() === selectedRole);
    }

    if (selectedStatus !== 'ALL') {
      list = list.filter((s) => String(s.status || 'ACTIVE').toUpperCase() === selectedStatus);
    }

    if (selectedDepartment !== 'ALL') {
      list = list.filter((s) => (s.department || '') === selectedDepartment);
    }

    if (selectedDesignation !== 'ALL') {
      list = list.filter((s) => (s.designation || '') === selectedDesignation);
    }

    return list;
  }, [staffList, searchQuery, selectedRole, selectedStatus, selectedDepartment, selectedDesignation]);

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    let list = [...assignmentsList];

    if (asgClassFilter !== 'ALL') {
      list = list.filter(a => String(a.class) === asgClassFilter);
    }
    if (asgSectionFilter !== 'ALL') {
      list = list.filter(a => String(a.section) === asgSectionFilter || a.section === 'All');
    }
    if (asgSubjectFilter !== 'ALL') {
      list = list.filter(a => (a.subject || '').includes(asgSubjectFilter));
    }
    if (asgTeacherFilter !== 'ALL') {
      list = list.filter(a => String(a.staffId) === asgTeacherFilter);
    }
    if (asgTypeFilter !== 'ALL') {
      list = list.filter(a => a.assignmentType === asgTypeFilter);
    }

    return list;
  }, [assignmentsList, asgClassFilter, asgSectionFilter, asgSubjectFilter, asgTeacherFilter, asgTypeFilter]);

  // 360° Profile Viewer Handler
  const handleOpenProfile = async (staffId) => {
    setProfileStaffId(staffId);
    setProfileTab('overview');
    setProfileLoading(true);
    setProfileData(null);

    try {
      const res = await sendApiRequest('get_staff_profile', { staffId: staffId, academicYear: selectedAcademicYear });
      if (res && res.success && res.data) {
        setProfileData(res.data);
      } else {
        showToast(res?.error?.message || 'Failed to load staff master profile.');
      }
    } catch (e) {
      showToast('Error connecting to server.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Register New Staff Submit
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    setAddError(null);

    if (!addForm.staffName.trim()) {
      setAddError('Staff full name is required.');
      return;
    }
    const cleanMob = String(addForm.mobile || '').replace(/\D/g, '').slice(-10);
    if (cleanMob.length !== 10) {
      setAddError('Valid 10-digit mobile number is required.');
      return;
    }

    if (addForm.passwordMode === 'CUSTOM' && (!addForm.customPassword || addForm.customPassword.length < 5)) {
      setAddError('Custom password must be at least 5 characters.');
      return;
    }

    setAddLoading(true);
    try {
      const payload = {
        ...addForm,
        mobile: cleanMob,
        password: addForm.passwordMode === 'CUSTOM' ? addForm.customPassword : '',
        academicYear: selectedAcademicYear
      };

      const res = await sendApiRequest('register_staff', payload);
      if (res && res.success) {
        showToast(res.data?.message || 'Staff member registered successfully.');
        setIsAddModalOpen(false);
        fetchData();
      } else {
        setAddError(res?.error?.message || 'Failed to register staff member.');
      }
    } catch (err) {
      setAddError('Server communication error.');
    } finally {
      setAddLoading(false);
    }
  };

  // Edit Staff Submit
  const handleEditStaffSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData) return;
    setEditError(null);
    setEditLoading(true);

    try {
      const res = await sendApiRequest('update_staff_profile', editFormData);
      if (res && res.success) {
        showToast('Staff profile updated successfully.');
        setIsEditModalOpen(false);
        if (profileStaffId === editFormData.staffId) {
          handleOpenProfile(editFormData.staffId);
        }
        fetchData();
      } else {
        setEditError(res?.error?.message || 'Failed to update staff profile.');
      }
    } catch (err) {
      setEditError('Server communication error.');
    } finally {
      setEditLoading(false);
    }
  };

  // Assign Teacher Submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setAssignError(null);
    setAssignConflict(null);

    if (!assignForm.staffId) {
      setAssignError('Please select a teacher.');
      return;
    }

    setAssignLoading(true);
    try {
      const res = await sendApiRequest('save_staff_assignment', assignForm);
      if (res && res.success) {
        showToast(res.message || 'Academic assignment saved successfully.');
        setIsAssignModalOpen(false);
        fetchData();
      } else if (res?.error?.code === 'CLASS_TEACHER_CONFLICT') {
        setAssignConflict(res.error.message);
      } else {
        setAssignError(res?.error?.message || 'Failed to save academic assignment.');
      }
    } catch (err) {
      setAssignError('Server communication error.');
    } finally {
      setAssignLoading(false);
    }
  };

  // Deactivate Assignment
  const handleDeactivateAssignment = (assignment) => {
    setConfirmModal({
      title: 'Deactivate Academic Assignment',
      message: `Are you sure you want to deactivate the assignment of ${assignment.staffName} for Class ${assignment.class}-${assignment.section} (${assignment.subject})? Historical records will remain intact.`,
      confirmText: 'Deactivate',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await sendApiRequest('deactivate_staff_assignment', { assignmentId: assignment.assignmentId });
          if (res && res.success) {
            showToast('Assignment deactivated successfully.');
            fetchData();
          } else {
            showToast(res?.error?.message || 'Failed to deactivate assignment.');
          }
        } catch (e) {
          showToast('Server communication error.');
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  // Change Status Submit
  const handleStatusChangeSubmit = async () => {
    if (!statusModalStaff) return;
    setStatusLoading(true);

    try {
      const res = await sendApiRequest('set_staff_status', {
        staffId: statusModalStaff.staffId,
        status: newStatusValue,
        reason: statusReason
      });
      if (res && res.success) {
        showToast(res.message || 'Status updated successfully.');
        setStatusModalStaff(null);
        fetchData();
      } else {
        showToast(res?.error?.message || 'Failed to update status.');
      }
    } catch (e) {
      showToast('Server communication error.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Reset Password to Common
  const handleResetPassword = (staff) => {
    setConfirmModal({
      title: 'Reset Password to Common',
      message: `Reset password for ${staff.staffName} (${staff.employeeId}) to the school default common password?`,
      confirmText: 'Reset Password',
      isDanger: false,
      onConfirm: async () => {
        try {
          const res = await sendApiRequest('auth_reset_user_password', { userId: staff.staffId, role: staff.role });
          if (res && res.success) {
            showToast('Password reset to common successfully.');
            fetchData();
          } else {
            showToast(res?.error?.message || 'Failed to reset password.');
          }
        } catch (e) {
          showToast('Server communication error.');
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  // Bulk Assignment Preview & Commit
  const handleBulkPreview = async () => {
    if (!bulkStaffId) {
      showToast('Please select a teacher for bulk assignment.');
      return;
    }
    const classSections = [];
    bulkClasses.forEach(c => {
      bulkSections.forEach(s => {
        classSections.push({ class: c, section: s });
      });
    });

    if (classSections.length === 0) {
      showToast('Select at least one class and section.');
      return;
    }

    setBulkLoading(true);
    try {
      const payload = {
        staffId: bulkStaffId,
        academicYear: selectedAcademicYear,
        classSections: classSections,
        subject: bulkSubject,
        component: bulkComponent,
        assignmentType: bulkType,
        preview: true
      };
      const res = await sendApiRequest('bulk_assign_staff', payload);
      if (res && res.success) {
        setBulkPreviewData(res.data);
      } else {
        showToast(res?.error?.message || 'Failed to generate preview.');
      }
    } catch (e) {
      showToast('Server communication error.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkCommit = async () => {
    if (!bulkPreviewData) return;
    setBulkLoading(true);
    try {
      const classSections = [];
      bulkClasses.forEach(c => {
        bulkSections.forEach(s => {
          classSections.push({ class: c, section: s });
        });
      });

      const payload = {
        staffId: bulkStaffId,
        academicYear: selectedAcademicYear,
        classSections: classSections,
        subject: bulkSubject,
        component: bulkComponent,
        assignmentType: bulkType,
        preview: false,
        confirm: true
      };
      const res = await sendApiRequest('bulk_assign_staff', payload);
      if (res && res.success) {
        showToast(res.message || 'Bulk assignments created successfully.');
        setBulkPreviewData(null);
        fetchData();
      } else {
        showToast(res?.error?.message || 'Bulk assignment failed.');
      }
    } catch (e) {
      showToast('Server error during bulk assignment.');
    } finally {
      setBulkLoading(false);
    }
  };

  // CSV Export Handler
  const handleExportCsv = async () => {
    try {
      const res = await sendApiRequest('export_staff_csv', { academicYear: selectedAcademicYear });
      if (res && res.success && res.data && res.data.staff) {
        const rows = res.data.staff;
        if (rows.length === 0) {
          showToast('No staff records found to export.');
          return;
        }

        const headers = Object.keys(rows[0]);
        const csvContent = [
          headers.join(','),
          ...rows.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `GHSS_Staff_Directory_${selectedAcademicYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Staff directory exported to CSV.');
      }
    } catch (e) {
      showToast('Failed to export CSV.');
    }
  };

  // CSV Import File Parser
  const handleCsvFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvError(null);
    setCsvPreviewData(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result;
        const lines = String(text).split(/\r\n|\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) {
          setCsvError('CSV file must contain a header row and at least one data row.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
        const parsedRows = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cols[idx] || '';
          });
          parsedRows.push(rowObj);
        }

        setCsvLoading(true);
        const res = await sendApiRequest('import_staff_csv', { rows: parsedRows, preview: true });
        if (res && res.success) {
          setCsvPreviewData(res.data);
        } else {
          setCsvError(res?.error?.message || 'CSV validation failed.');
        }
      } catch (err) {
        setCsvError('Failed to parse CSV file.');
      } finally {
        setCsvLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleCsvCommit = async () => {
    if (!csvPreviewData || !csvPreviewData.validRows) return;
    setCsvLoading(true);
    try {
      const res = await sendApiRequest('import_staff_csv', {
        rows: csvPreviewData.validRows,
        preview: false,
        confirm: true
      });
      if (res && res.success) {
        showToast(res.message || 'Staff imported successfully.');
        setCsvFile(null);
        setCsvPreviewData(null);
        fetchData();
      } else {
        setCsvError(res?.error?.message || 'Failed to commit CSV import.');
      }
    } catch (e) {
      setCsvError('Server communication error.');
    } finally {
      setCsvLoading(false);
    }
  };

  // Summary Metrics
  const activeCount = staffList.filter(s => s.active).length;
  const teachersCount = staffList.filter(s => s.role === 'TEACHER').length;
  const totalAssignmentsCount = assignmentsList.length;

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

      {/* HEADER & QUICK STATS */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 6px 0', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={28} style={{ color: 'var(--primary)' }} />
              <span>Staff & Academic Workforce</span>
            </h1>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', margin: 0 }}>
              Centrally manage faculty master records, designations, department areas, and multi-year academic assignments.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Academic Year Selector */}
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
              onClick={() => fetchData(true)}
              className="btn-secondary"
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
              title="Refresh staff and workforce data"
            >
              <RefreshCw size={15} className={refreshing ? 'spin-anim' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {(isAdmin || isPrincipal) && (
              <>
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                >
                  <BookOpen size={16} />
                  <span>Assign Teacher</span>
                </button>

                <button
                  onClick={() => {
                    setAddForm({
                      staffName: '',
                      firstName: '',
                      lastName: '',
                      gender: 'Male',
                      dob: '',
                      mobile: '',
                      email: '',
                      role: 'TEACHER',
                      designation: 'Vocational Teacher',
                      department: 'Vocational Education',
                      employmentType: 'Permanent',
                      qualification: 'Post Graduate / B.Ed',
                      specialization: 'Information Technology',
                      stream: 'IT/ITeS',
                      address: '',
                      village: '',
                      district: 'Biswanath',
                      state: 'Assam',
                      pinCode: '784176',
                      passwordMode: 'COMMON',
                      customPassword: ''
                    });
                    setAddError(null);
                    setIsAddModalOpen(true);
                  }}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px' }}
                >
                  <UserPlus size={16} />
                  <span>Add Staff</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* METRICS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Faculty</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>{staffList.length}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Staff</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>{activeCount}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Teachers</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>{teachersCount}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Assignments</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>{totalAssignmentsCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          onClick={() => setActiveTab('directory')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: activeTab === 'directory' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            color: activeTab === 'directory' ? 'var(--primary)' : 'var(--text-muted)',
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
          <Users size={16} />
          <span>Staff Directory ({staffList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: activeTab === 'assignments' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            color: activeTab === 'assignments' ? 'var(--primary)' : 'var(--text-muted)',
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
          <BookOpen size={16} />
          <span>Academic Assignments ({assignmentsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('workload')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: activeTab === 'workload' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
            color: activeTab === 'workload' ? 'var(--primary)' : 'var(--text-muted)',
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
          <span>Academic Assignment Load ({workloadsList.length})</span>
        </button>

        {(isAdmin || isPrincipal) && (
          <button
            onClick={() => setActiveTab('bulk')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: activeTab === 'bulk' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: activeTab === 'bulk' ? 'var(--primary)' : 'var(--text-muted)',
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
            <FileSpreadsheet size={16} />
            <span>Bulk & CSV Tools</span>
          </button>
        )}
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '14px 18px', borderRadius: '12px', color: '#991b1b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === 'directory' && (
        <div>
          {/* SEARCH & FILTERS BAR */}
          <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', gridColumn: 'span 2' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search staff by name, Employee ID, mobile, designation, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px', height: '40px' }}
                />
              </div>

              <div>
                <select className="input-field" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={{ height: '40px' }}>
                  <option value="ALL">All Roles</option>
                  <option value="TEACHER">Teachers</option>
                  <option value="PRINCIPAL">Principals</option>
                  <option value="ADMIN">Administrators</option>
                </select>
              </div>

              <div>
                <select className="input-field" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} style={{ height: '40px' }}>
                  <option value="ALL">All Departments</option>
                  {departmentsList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <select className="input-field" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ height: '40px' }}>
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="TRANSFERRED">Transferred</option>
                  <option value="RETIRED">Retired</option>
                  <option value="LEFT_SERVICE">Left Service</option>
                </select>
              </div>
            </div>
          </div>

          {/* STAFF TABLE */}
          {loading ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="spin-anim" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--primary)' }} />
              <div>Loading faculty & staff directory...</div>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={36} style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.5 }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>No staff members found</div>
              <div style={{ fontSize: '0.85rem' }}>Try adjusting your search query or filter parameters.</div>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '14px 16px' }}>Staff Member & ID</th>
                      <th style={{ padding: '14px 16px' }}>Designation & Dept</th>
                      <th style={{ padding: '14px 16px' }}>Contact</th>
                      <th style={{ padding: '14px 16px' }}>Current Scope ({selectedAcademicYear})</th>
                      <th style={{ padding: '14px 16px' }}>Status</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((s) => {
                      const isActive = s.status === 'ACTIVE' || s.status === 'Active';
                      const isLeave = s.status === 'ON_LEAVE';
                      return (
                        <tr
                          key={s.staffId}
                          style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                          className="table-row-hover"
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '10px',
                                  background: s.role === 'PRINCIPAL' ? '#f59e0b' : (s.role === 'ADMIN' ? '#8b5cf6' : 'var(--primary)'),
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.9rem',
                                  flexShrink: 0
                                }}
                              >
                                {(s.staffName || 'S').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                                  {s.staffName}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                  {s.employeeId || s.staffId}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.designation}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.department}</div>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '0.8rem' }}>
                              <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                              <span>{s.mobile || '—'}</span>
                            </div>
                            {s.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                <Mail size={13} />
                                <span>{s.email}</span>
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                              {Array.isArray(s.assignedClasses) && s.assignedClasses.length > 0 ? (
                                s.assignedClasses.map(c => (
                                  <span
                                    key={c}
                                    style={{
                                      background: 'rgba(99, 102, 241, 0.1)',
                                      color: 'var(--primary)',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '2px 6px',
                                      borderRadius: '6px'
                                    }}
                                  >
                                    Class {c}
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Unassigned</span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: isActive ? '#ecfdf5' : (isLeave ? '#fef3c7' : '#fef2f2'),
                                color: isActive ? '#065f46' : (isLeave ? '#92400e' : '#991b1b')
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#10b981' : (isLeave ? '#f59e0b' : '#ef4444') }}></span>
                              {s.status || 'ACTIVE'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenProfile(s.staffId)}
                                className="btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px' }}
                                title="View 360° Profile"
                              >
                                <Eye size={14} />
                                <span style={{ marginLeft: '4px' }}>Profile</span>
                              </button>

                              {(isAdmin || isPrincipal) && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditFormData({ ...s });
                                      setEditError(null);
                                      setIsEditModalOpen(true);
                                    }}
                                    className="btn-secondary"
                                    style={{ padding: '6px 8px', fontSize: '0.75rem', borderRadius: '8px' }}
                                    title="Edit Master Record"
                                  >
                                    <Edit size={14} />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setStatusModalStaff(s);
                                      setNewStatusValue(s.status || 'ACTIVE');
                                      setStatusReason('');
                                    }}
                                    className="btn-secondary"
                                    style={{ padding: '6px 8px', fontSize: '0.75rem', borderRadius: '8px' }}
                                    title="Change Status"
                                  >
                                    <Clock size={14} />
                                  </button>

                                  <button
                                    onClick={() => handleResetPassword(s)}
                                    className="btn-secondary"
                                    style={{ padding: '6px 8px', fontSize: '0.75rem', borderRadius: '8px' }}
                                    title="Reset Password to Common"
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                </>
                              )}
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

      {/* TAB 2: ACADEMIC ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div>
          {/* ASSIGNMENTS FILTERS */}
          <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'center' }}>
              <div>
                <select className="input-field" value={asgClassFilter} onChange={(e) => setAsgClassFilter(e.target.value)} style={{ height: '40px' }}>
                  <option value="ALL">All Classes</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>

              <div>
                <select className="input-field" value={asgSectionFilter} onChange={(e) => setAsgSectionFilter(e.target.value)} style={{ height: '40px' }}>
                  <option value="ALL">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>

              <div>
                <select className="input-field" value={asgSubjectFilter} onChange={(e) => setAsgSubjectFilter(e.target.value)} style={{ height: '40px' }}>
                  <option value="ALL">All Subjects</option>
                  {subjectsList.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <select className="input-field" value={asgTypeFilter} onChange={(e) => setAsgTypeFilter(e.target.value)} style={{ height: '40px' }}>
                  <option value="ALL">All Assignment Types</option>
                  <option value="SUBJECT_TEACHER">Subject Teacher</option>
                  <option value="CLASS_TEACHER">Class Teacher</option>
                  <option value="PRACTICAL_TEACHER">Practical Teacher</option>
                  <option value="COORDINATOR">Coordinator</option>
                </select>
              </div>

              <div>
                <select className="input-field" value={asgTeacherFilter} onChange={(e) => setAsgTeacherFilter(e.target.value)} style={{ height: '40px' }}>
                  <option value="ALL">All Faculty Members</option>
                  {staffList.map(s => (
                    <option key={s.staffId} value={s.staffId}>{s.staffName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ASSIGNMENTS TABLE */}
          {filteredAssignments.length === 0 ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookOpen size={36} style={{ margin: '0 auto 12px auto', display: 'block', opacity: 0.5 }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>No academic assignments found</div>
              <div style={{ fontSize: '0.85rem' }}>Create assignments using the "Assign Teacher" button.</div>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '14px 16px' }}>Faculty Member</th>
                      <th style={{ padding: '14px 16px' }}>Class & Section</th>
                      <th style={{ padding: '14px 16px' }}>Subject</th>
                      <th style={{ padding: '14px 16px' }}>Component</th>
                      <th style={{ padding: '14px 16px' }}>Assignment Role</th>
                      <th style={{ padding: '14px 16px' }}>Status</th>
                      {(isAdmin || isPrincipal) && <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((a) => {
                      const isCT = a.assignmentType === 'CLASS_TEACHER';
                      const isActive = (a.status || 'ACTIVE') === 'ACTIVE';
                      return (
                        <tr key={a.assignmentId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{a.staffName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.designation}</div>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                              Class {a.class} — Section {a.section}
                            </span>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{a.subject}</div>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: a.component === 'THEORY' ? '#eff6ff' : (a.component === 'PRACTICAL' ? '#ecfdf5' : '#f5f3ff'),
                                color: a.component === 'THEORY' ? '#1d4ed8' : (a.component === 'PRACTICAL' ? '#047857' : '#6d28d9')
                              }}
                            >
                              {a.component || 'BOTH'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: isCT ? '#fef3c7' : '#f1f5f9',
                                color: isCT ? '#b45309' : '#475569'
                              }}
                            >
                              {isCT && <Award size={12} />}
                              {a.assignmentType}
                            </span>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: isActive ? '#ecfdf5' : '#f1f5f9',
                                color: isActive ? '#065f46' : '#64748b'
                              }}
                            >
                              {a.status || 'ACTIVE'}
                            </span>
                          </td>

                          {(isAdmin || isPrincipal) && (
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              {isActive && (
                                <button
                                  onClick={() => handleDeactivateAssignment(a)}
                                  className="btn-secondary"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px', color: '#dc2626' }}
                                  title="Deactivate assignment"
                                >
                                  Deactivate
                                </button>
                              )}
                            </td>
                          )}
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

      {/* TAB 3: WORKLOAD VIEW */}
      {activeTab === 'workload' && (
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
              Academic Assignment Load ({selectedAcademicYear})
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Summary of assigned classes, subjects, theory/practical components, and class-teacher duties.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {workloadsList.map((wl) => (
              <div key={wl.staffId} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 2px 0' }}>
                        {wl.staffName}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {wl.designation} • {wl.department}
                      </div>
                    </div>

                    <span
                      style={{
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: 'var(--primary)',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 800
                      }}
                    >
                      {wl.totalAssignmentsCount} Assignments
                    </span>
                  </div>

                  {/* STATS MATRIX */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '10px', marginBottom: '14px', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>CLASSES</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)' }}>{wl.classes?.length || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>THEORY</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1d4ed8' }}>{wl.theoryAssignmentsCount || 0}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>PRACTICAL</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#047857' }}>{wl.practicalAssignmentsCount || 0}</div>
                    </div>
                  </div>

                  {/* CLASS TEACHER ROLES */}
                  {wl.isClassTeacher && (
                    <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '6px 10px', fontSize: '0.75rem', color: '#92400e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                      <Award size={14} />
                      <span>Class Teacher: Class {wl.classTeacherRoles?.join(', ')}</span>
                    </div>
                  )}

                  {/* ASSIGNED SUBJECTS */}
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700 }}>Subjects: </span>
                    {wl.subjects?.length > 0 ? wl.subjects.join(', ') : 'None'}
                  </div>
                </div>

                <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleOpenProfile(wl.staffId)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
                  >
                    View Breakdown
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BULK OPERATIONS & CSV */}
      {activeTab === 'bulk' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* BULK ASSIGNMENT WIZARD */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                  Bulk Academic Assignment Wizard
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Assign a teacher to multiple classes and sections simultaneously.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">Select Teacher *</label>
                <select className="input-field" value={bulkStaffId} onChange={(e) => setBulkStaffId(e.target.value)}>
                  <option value="">-- Choose Faculty Member --</option>
                  {staffList.filter(s => s.active).map(s => (
                    <option key={s.staffId} value={s.staffId}>{s.staffName} ({s.designation})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Target Subject *</label>
                <select className="input-field" value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)}>
                  {subjectsList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">Component</label>
                  <select className="input-field" value={bulkComponent} onChange={(e) => setBulkComponent(e.target.value)}>
                    <option value="BOTH">Both (Theory & Practical)</option>
                    <option value="THEORY">Theory Only</option>
                    <option value="PRACTICAL">Practical Only</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Assignment Type</label>
                  <select className="input-field" value={bulkType} onChange={(e) => setBulkType(e.target.value)}>
                    <option value="SUBJECT_TEACHER">Subject Teacher</option>
                    <option value="PRACTICAL_TEACHER">Practical Teacher</option>
                    <option value="CLASS_TEACHER">Class Teacher</option>
                  </select>
                </div>
              </div>

              {/* TARGET CLASSES CHECKBOXES */}
              <div>
                <label className="input-label">Select Target Classes</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {['9', '10', '11', '12'].map(c => {
                    const isChecked = bulkClasses.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          if (isChecked) setBulkClasses(bulkClasses.filter(x => x !== c));
                          else setBulkClasses([...bulkClasses, c]);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: isChecked ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                          background: isChecked ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          color: isChecked ? 'var(--primary)' : 'var(--text-main)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Class {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TARGET SECTIONS CHECKBOXES */}
              <div>
                <label className="input-label">Select Target Sections</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {['A', 'B'].map(sec => {
                    const isChecked = bulkSections.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          if (isChecked) setBulkSections(bulkSections.filter(x => x !== sec));
                          else setBulkSections([...bulkSections, sec]);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: isChecked ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                          background: isChecked ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          color: isChecked ? 'var(--primary)' : 'var(--text-main)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Section {sec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PREVIEW & CONFLICT REPORT */}
              {bulkPreviewData && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginTop: '10px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '6px' }}>
                    Preview: {bulkPreviewData.totalItems} Assignments for {bulkPreviewData.staffName}
                  </div>
                  {bulkPreviewData.conflictWarnings?.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      {bulkPreviewData.conflictWarnings.map((w, idx) => (
                        <div key={idx} style={{ fontSize: '0.75rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={13} />
                          <span>{w.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button onClick={handleBulkCommit} className="btn-primary" disabled={bulkLoading} style={{ flex: 1, padding: '8px' }}>
                      {bulkLoading ? 'Committing...' : 'Confirm & Create Assignments'}
                    </button>
                    <button onClick={() => setBulkPreviewData(null)} className="btn-secondary" style={{ padding: '8px' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!bulkPreviewData && (
                <button
                  onClick={handleBulkPreview}
                  className="btn-primary"
                  disabled={bulkLoading}
                  style={{ marginTop: '10px', padding: '10px' }}
                >
                  {bulkLoading ? 'Validating...' : 'Preview Bulk Assignment'}
                </button>
              )}
            </div>
          </div>

          {/* CSV IMPORT & EXPORT */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                  CSV Import & Export
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Batch import faculty records or export directory data.
                </div>
              </div>
            </div>

            {/* EXPORT BUTTON */}
            <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <label className="input-label">Export Staff Directory</label>
              <button
                onClick={handleExportCsv}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center', padding: '10px' }}
              >
                <Download size={16} />
                <span>Export Active Faculty Directory (CSV)</span>
              </button>
            </div>

            {/* IMPORT CONTROLS */}
            <div>
              <label className="input-label">Import Staff via CSV</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvFileSelect}
                style={{ display: 'block', width: '100%', fontSize: '0.85rem', marginBottom: '12px' }}
              />

              {csvError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', color: '#991b1b', fontSize: '0.78rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} />
                  <span>{csvError}</span>
                </div>
              )}

              {csvPreviewData && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '4px' }}>
                    CSV Validation Result:
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    • {csvPreviewData.summary?.validCount} valid rows ready for import<br />
                    • {csvPreviewData.summary?.invalidCount} invalid rows (skipped)<br />
                    • {csvPreviewData.summary?.duplicateWarningCount} duplicate warnings
                  </div>

                  <button
                    onClick={handleCsvCommit}
                    className="btn-primary"
                    disabled={csvLoading || csvPreviewData.summary?.validCount === 0}
                    style={{ width: '100%', padding: '10px' }}
                  >
                    {csvLoading ? 'Importing...' : `Commit Import (${csvPreviewData.summary?.validCount} Records)`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: 360° STAFF PROFILE DRAWER */}
      {profileStaffId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            {profileLoading || !profileData ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={28} className="spin-anim" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--primary)' }} />
                <div>Loading comprehensive faculty profile...</div>
              </div>
            ) : (
              <div>
                {/* PROFILE HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.3rem' }}>
                      {profileData.staff?.staffName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 4px 0' }}>
                        {profileData.staff?.staffName}
                      </h2>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {profileData.staff?.designation} • {profileData.staff?.department} • ID: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{profileData.staff?.employeeId}</span>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setProfileStaffId(null)} className="btn-secondary" style={{ padding: '6px', borderRadius: '8px' }}>
                    <X size={18} />
                  </button>
                </div>

                {/* PROFILE TABS */}
                <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                  <button onClick={() => setProfileTab('overview')} style={{ padding: '8px 14px', border: 'none', background: profileTab === 'overview' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: profileTab === 'overview' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem', borderRadius: '8px', cursor: 'pointer' }}>
                    Overview
                  </button>
                  <button onClick={() => setProfileTab('assignments')} style={{ padding: '8px 14px', border: 'none', background: profileTab === 'assignments' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: profileTab === 'assignments' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem', borderRadius: '8px', cursor: 'pointer' }}>
                    Assignments & History ({profileData.assignmentHistory?.length || 0})
                  </button>
                  <button onClick={() => setProfileTab('workload')} style={{ padding: '8px 14px', border: 'none', background: profileTab === 'workload' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: profileTab === 'workload' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem', borderRadius: '8px', cursor: 'pointer' }}>
                    Workload Load
                  </button>
                  <button onClick={() => setProfileTab('account')} style={{ padding: '8px 14px', border: 'none', background: profileTab === 'account' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: profileTab === 'account' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem', borderRadius: '8px', cursor: 'pointer' }}>
                    Account & Security
                  </button>
                  {(isAdmin || isPrincipal) && (
                    <button onClick={() => setProfileTab('audit')} style={{ padding: '8px 14px', border: 'none', background: profileTab === 'audit' ? 'rgba(99, 102, 241, 0.1)' : 'transparent', color: profileTab === 'audit' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem', borderRadius: '8px', cursor: 'pointer' }}>
                      Audit Trail
                    </button>
                  )}
                </div>

                {/* PROFILE TAB 1: OVERVIEW */}
                {profileTab === 'overview' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Personal Information</div>
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                        <div><strong>Full Name:</strong> {profileData.staff?.staffName}</div>
                        <div><strong>Gender:</strong> {profileData.staff?.gender}</div>
                        <div><strong>Date of Birth:</strong> {profileData.staff?.dob || '—'}</div>
                        <div><strong>Status:</strong> {profileData.staff?.status}</div>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Contact & Address</div>
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                        <div><strong>Mobile:</strong> {profileData.staff?.mobile}</div>
                        <div><strong>Email:</strong> {profileData.staff?.email || '—'}</div>
                        <div><strong>Village / Addr:</strong> {profileData.staff?.village || profileData.staff?.address || '—'}</div>
                        <div><strong>District:</strong> {profileData.staff?.district}, {profileData.staff?.state} - {profileData.staff?.pinCode}</div>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Employment & Academic</div>
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                        <div><strong>Designation:</strong> {profileData.staff?.designation}</div>
                        <div><strong>Department:</strong> {profileData.staff?.department}</div>
                        <div><strong>Qualification:</strong> {profileData.staff?.qualification}</div>
                        <div><strong>Specialization:</strong> {profileData.staff?.specialization}</div>
                        <div><strong>Joining Date:</strong> {profileData.staff?.joiningDate || '—'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PROFILE TAB 2: ASSIGNMENTS & HISTORY */}
                {profileTab === 'assignments' && (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 10px 0' }}>Academic Assignments History</h4>
                    {profileData.assignmentHistory?.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No assignments recorded.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {profileData.assignmentHistory.map(asg => (
                          <div key={asg.assignmentId} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '0.85rem' }}>
                                Class {asg.class}-{asg.section} • {asg.subject} ({asg.component})
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Academic Session: {asg.academicYear} • Role: {asg.assignmentType}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', background: asg.status === 'ACTIVE' ? '#ecfdf5' : '#f1f5f9', color: asg.status === 'ACTIVE' ? '#047857' : '#64748b' }}>
                              {asg.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PROFILE TAB 3: WORKLOAD */}
                {profileTab === 'workload' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px', textAlign: 'center' }}>
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL ASSIGNMENTS</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>{profileData.workload?.totalAssignments || 0}</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>THEORY SUBJECTS</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1d4ed8' }}>{profileData.workload?.theoryComponents || 0}</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PRACTICAL SUBJECTS</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#047857' }}>{profileData.workload?.practicalComponents || 0}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PROFILE TAB 4: ACCOUNT */}
                {profileTab === 'account' && (
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>System Role: {profileData.account?.role}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Password Mode: <strong style={{ color: profileData.account?.passwordMode === 'CUSTOM' ? '#047857' : '#b45309' }}>{profileData.account?.passwordMode}</strong>
                        </div>
                      </div>

                      {(isAdmin || isPrincipal) && (
                        <button onClick={() => handleResetPassword(profileData.staff)} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                          Reset Password
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* PROFILE TAB 5: AUDIT */}
                {profileTab === 'audit' && (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 10px 0' }}>Recent Administrative Audit Logs</h4>
                    {profileData.auditLogs?.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No audit records found.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {profileData.auditLogs.map((log, idx) => (
                          <div key={idx} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong>{log.action}</strong>
                              <span style={{ color: 'var(--text-muted)' }}>{log.timestamp || log.createdAt}</span>
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>Actor: {log.actorType} ({log.actorId})</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER NEW STAFF */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                Register New Faculty / Staff Member
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="btn-secondary" style={{ padding: '6px', borderRadius: '8px' }}>
                <X size={18} />
              </button>
            </div>

            {addError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">Full Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={addForm.staffName}
                    onChange={(e) => setAddForm({ ...addForm, staffName: e.target.value })}
                    placeholder="e.g. Dr. Pranab Saikia"
                  />
                </div>

                <div>
                  <label className="input-label">Role *</label>
                  <select
                    className="input-field"
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  >
                    <option value="TEACHER">Teacher</option>
                    <option value="PRINCIPAL">Principal</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">Designation *</label>
                  <select
                    className="input-field"
                    value={addForm.designation}
                    onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                  >
                    {designationsList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label">Department *</label>
                  <select
                    className="input-field"
                    value={addForm.department}
                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  >
                    {departmentsList.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">Mobile Number (10 Digits) *</label>
                  <input
                    type="tel"
                    className="input-field"
                    required
                    maxLength={10}
                    value={addForm.mobile}
                    onChange={(e) => setAddForm({ ...addForm, mobile: e.target.value })}
                    placeholder="e.g. 9876543210"
                  />
                </div>

                <div>
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    className="input-field"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="e.g. teacher@ghss.ac.in"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">Highest Qualification</label>
                  <input
                    type="text"
                    className="input-field"
                    value={addForm.qualification}
                    onChange={(e) => setAddForm({ ...addForm, qualification: e.target.value })}
                    placeholder="e.g. M.Sc (IT), B.Ed"
                  />
                </div>

                <div>
                  <label className="input-label">Specialization / Subject Area</label>
                  <input
                    type="text"
                    className="input-field"
                    value={addForm.specialization}
                    onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })}
                    placeholder="e.g. Computer Science"
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '6px' }}>
                <label className="input-label">Authentication Password Option</label>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="addPwMode"
                      checked={addForm.passwordMode === 'COMMON'}
                      onChange={() => setAddForm({ ...addForm, passwordMode: 'COMMON' })}
                    />
                    <span>Default School Password (12345)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="addPwMode"
                      checked={addForm.passwordMode === 'CUSTOM'}
                      onChange={() => setAddForm({ ...addForm, passwordMode: 'CUSTOM' })}
                    />
                    <span>Set Custom Password</span>
                  </label>
                </div>

                {addForm.passwordMode === 'CUSTOM' && (
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCustomPassword ? 'text' : 'password'}
                      className="input-field"
                      placeholder="Enter custom password"
                      value={addForm.customPassword}
                      onChange={(e) => setAddForm({ ...addForm, customPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomPassword(!showCustomPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {showCustomPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary" disabled={addLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={addLoading}>
                  {addLoading ? 'Registering...' : 'Register Faculty Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT STAFF */}
      {isEditModalOpen && editFormData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                Edit Faculty Master Record
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="btn-secondary" style={{ padding: '6px', borderRadius: '8px' }}>
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem', marginBottom: '14px' }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleEditStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={editFormData.staffName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, staffName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">Designation</label>
                  <select
                    className="input-field"
                    value={editFormData.designation || 'Vocational Teacher'}
                    onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                  >
                    {designationsList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label">Department</label>
                  <select
                    className="input-field"
                    value={editFormData.department || 'Vocational Education'}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  >
                    {departmentsList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">Mobile</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={editFormData.mobile || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary" disabled={editLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ASSIGN TEACHER */}
      {isAssignModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                Academic Staff Assignment
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="btn-secondary" style={{ padding: '6px', borderRadius: '8px' }}>
                <X size={18} />
              </button>
            </div>

            {assignError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem', marginBottom: '14px' }}>
                {assignError}
              </div>
            )}

            {assignConflict && (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '12px 14px', borderRadius: '8px', color: '#92400e', fontSize: '0.85rem', marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} />
                  <span>Class Teacher Conflict Detected</span>
                </div>
                <div>{assignConflict}</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={assignForm.confirmOverwrite}
                    onChange={(e) => setAssignForm({ ...assignForm, confirmOverwrite: e.target.checked })}
                  />
                  <span>I confirm overwriting the existing class teacher assignment.</span>
                </label>
              </div>
            )}

            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">Select Faculty Member *</label>
                <select
                  className="input-field"
                  required
                  value={assignForm.staffId}
                  onChange={(e) => setAssignForm({ ...assignForm, staffId: e.target.value })}
                >
                  <option value="">-- Choose Faculty Member --</option>
                  {staffList.filter(s => s.active).map(s => (
                    <option key={s.staffId} value={s.staffId}>{s.staffName} ({s.designation})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">Class *</label>
                  <select
                    className="input-field"
                    value={assignForm.class}
                    onChange={(e) => setAssignForm({ ...assignForm, class: e.target.value })}
                  >
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                    <option value="11">Class 11</option>
                    <option value="12">Class 12</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Section *</label>
                  <select
                    className="input-field"
                    value={assignForm.section}
                    onChange={(e) => setAssignForm({ ...assignForm, section: e.target.value })}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="All">All Sections</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Subject *</label>
                <select
                  className="input-field"
                  value={assignForm.subject}
                  onChange={(e) => setAssignForm({ ...assignForm, subject: e.target.value })}
                >
                  {subjectsList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">Component</label>
                  <select
                    className="input-field"
                    value={assignForm.component}
                    onChange={(e) => setAssignForm({ ...assignForm, component: e.target.value })}
                  >
                    <option value="BOTH">Both (Theory & Practical)</option>
                    <option value="THEORY">Theory Only</option>
                    <option value="PRACTICAL">Practical Only</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Assignment Type</label>
                  <select
                    className="input-field"
                    value={assignForm.assignmentType}
                    onChange={(e) => setAssignForm({ ...assignForm, assignmentType: e.target.value })}
                  >
                    <option value="SUBJECT_TEACHER">Subject Teacher</option>
                    <option value="CLASS_TEACHER">Class Teacher</option>
                    <option value="PRACTICAL_TEACHER">Practical Teacher</option>
                    <option value="COORDINATOR">Coordinator</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="btn-secondary" disabled={assignLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={assignLoading}>
                  {assignLoading ? 'Saving...' : 'Save Academic Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CHANGE STATUS */}
      {statusModalStaff && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 6px 0' }}>
              Change Staff Status: {statusModalStaff.staffName}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Select the new institutional status. Inactive or left-service staff cannot receive new assignments, but their academic records remain preserved.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">New Status</label>
                <select className="input-field" value={newStatusValue} onChange={(e) => setNewStatusValue(e.target.value)}>
                  <option value="ACTIVE">ACTIVE (Normal Active Duty)</option>
                  <option value="ON_LEAVE">ON_LEAVE (Temporary Leave)</option>
                  <option value="INACTIVE">INACTIVE (Temporarily Inactive)</option>
                  <option value="TRANSFERRED">TRANSFERRED (Transferred to Other School)</option>
                  <option value="RETIRED">RETIRED (Superannuated / Retired)</option>
                  <option value="LEFT_SERVICE">LEFT_SERVICE (Resigned / Left)</option>
                </select>
              </div>

              <div>
                <label className="input-label">Status Change Reason (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Medical leave approved by administration"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button onClick={() => setStatusModalStaff(null)} className="btn-secondary" disabled={statusLoading}>
                  Cancel
                </button>
                <button onClick={handleStatusChangeSubmit} className="btn-primary" disabled={statusLoading}>
                  {statusLoading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CONFIRM ACTION */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 8px 0' }}>
              {confirmModal.title}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginBottom: '20px', lineHeight: 1.5 }}>
              {confirmModal.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setConfirmModal(null)}>
                Cancel
              </button>
              <button
                className={confirmModal.isDanger ? 'btn-danger' : 'btn-primary'}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
