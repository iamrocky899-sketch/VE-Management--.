import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';
import { sendApiRequest } from '../../api/client';
import {
  FileText,
  Award,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Users,
  Plus,
  Filter,
  Eye,
  Check,
  Send,
  X,
  Lock,
  Unlock,
  QrCode,
  ShieldCheck,
  Ban,
  Clock,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Printer,
  Download
} from 'lucide-react';
import {
  buildMarksheetHtml,
  buildCompletionCertificateHtml,
  buildDocumentHtml,
  printDocumentHtml,
  downloadDocumentFile
} from '../../utils/pdfGenerator';

export default function AcademicDocuments({ onNavigate }) {
  const { user, isTeacher, isPrincipal, isAdmin } = useAuth();

  const DOCUMENT_TYPES = [
    { id: 'MARKSHEET', label: 'Official Marksheet' },
    { id: 'REPORT_CARD', label: 'Annual Report Card' },
    { id: 'COMPLETION_CERTIFICATE', label: 'Vocational Completion Certificate' },
    { id: 'TRANSFER_CERTIFICATE', label: 'Transfer Certificate (TC)' },
    { id: 'CHARACTER_CERTIFICATE', label: 'Character Certificate' },
    { id: 'MIGRATION_CERTIFICATE', label: 'Migration Certificate' },
    { id: 'ADMIT_CARD', label: 'Examination Admit Card' },
    { id: 'BONAFIDE_CERTIFICATE', label: 'Bonafide Student Certificate' },
    { id: 'STUDY_CERTIFICATE', label: 'Study Certificate' },
    { id: 'SCHOOL_LEAVING_CERTIFICATE', label: 'School Leaving Certificate (SLC)' },
    { id: 'MERIT_CERTIFICATE', label: 'Certificate of Academic Merit' },
    { id: 'ACHIEVEMENT_CERTIFICATE', label: 'Special Achievement Certificate' },
    { id: 'PARTICIPATION_CERTIFICATE', label: 'Participation Certificate' },
    { id: 'CUSTOM_CERTIFICATE', label: 'Custom Institutional Certificate' }
  ];

  const STATUSES = ['ALL', 'DRAFT', 'REVIEW', 'APPROVED', 'ISSUED', 'REVISED', 'CANCELLED'];

  // Filters State
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2026-2027');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [documents, setDocuments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals & Drawers
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [contractData, setContractData] = useState(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewOrientation, setPreviewOrientation] = useState('portrait');

  // Form State for Document Creation
  const [formData, setFormData] = useState({
    studentId: '',
    documentType: 'MARKSHEET',
    class: '9',
    academicYear: '2026-2027',
    title: '',
    description: '',
    status: 'DRAFT'
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load Data
  const loadDocuments = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const [docsRes, stuRes, yearsRes] = await Promise.all([
        sendApiRequest('get_documents', {
          academicYear: selectedYear,
          class: selectedClass !== 'ALL' ? selectedClass : undefined,
          documentType: selectedType !== 'ALL' ? selectedType : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined
        }),
        sendApiRequest('get_students', { class: selectedClass !== 'ALL' ? selectedClass : undefined }),
        sendApiRequest('get_academic_years')
      ]);

      if (docsRes?.data?.documents) {
        setDocuments(docsRes.data.documents);
      }
      if (stuRes?.data?.students) {
        setStudents(stuRes.data.students);
        if (stuRes.data.students.length > 0 && !formData.studentId) {
          setFormData((prev) => ({ ...prev, studentId: stuRes.data.students[0].studentId }));
        }
      }
      if (yearsRes?.data?.academicYears) {
        setAcademicYears(yearsRes.data.academicYears);
      }
    } catch (err) {
      setError('Unable to load academic documents. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [selectedYear, selectedClass, selectedType, selectedStatus]);

  // Filtered Documents
  const displayedDocuments = useMemo(() => {
    let list = [...documents];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((d) => {
        const title = (d.title || '').toLowerCase();
        const num = (d.documentNumber || '').toLowerCase();
        const student = (d.studentName || '').toLowerCase();
        const sid = (d.studentId || '').toLowerCase();
        const vrf = (d.verificationId || '').toLowerCase();
        return title.includes(q) || num.includes(q) || student.includes(q) || sid.includes(q) || vrf.includes(q);
      });
    }
    return list;
  }, [documents, searchQuery]);

  // Helper to resolve contract endpoint for any document type
  const resolveContractEndpoint = (type) => {
    const t = String(type || '').toUpperCase();
    switch (t) {
      case 'MARKSHEET': return 'get_marksheet_data';
      case 'REPORT_CARD': return 'get_report_card_data';
      case 'TRANSFER_CERTIFICATE': return 'get_transfer_certificate_data';
      case 'CHARACTER_CERTIFICATE': return 'get_character_certificate_data';
      case 'MIGRATION_CERTIFICATE': return 'get_migration_certificate_data';
      case 'ADMIT_CARD': return 'get_admit_card_data';
      case 'BONAFIDE_CERTIFICATE': return 'get_bonafide_certificate_data';
      case 'STUDY_CERTIFICATE': return 'get_study_certificate_data';
      case 'SCHOOL_LEAVING_CERTIFICATE': return 'get_school_leaving_certificate_data';
      case 'MERIT_CERTIFICATE': return 'get_merit_certificate_data';
      case 'ACHIEVEMENT_CERTIFICATE': return 'get_achievement_certificate_data';
      case 'PARTICIPATION_CERTIFICATE': return 'get_participation_certificate_data';
      case 'CUSTOM_CERTIFICATE': return 'get_custom_certificate_data';
      default: return 'get_certificate_data';
    }
  };

  // Open Document Details & Fetch authoritative contract payload
  const handleOpenDocDetails = async (doc) => {
    setSelectedDoc(doc);
    setContractLoading(true);
    setContractData(null);

    try {
      const endpoint = resolveContractEndpoint(doc.documentType);
      const res = await sendApiRequest(endpoint, {
        studentId: doc.studentId,
        academicYear: doc.academicYear || selectedYear,
        documentType: doc.documentType,
        class: doc.class,
        metadata: doc.metadata
      });

      if (res && res.success) {
        setContractData(res.data);
      }
    } catch (err) {
      // Preview contract optional
    } finally {
      setContractLoading(false);
    }
  };

  // Trigger Visual Document Preview & PDF Builder
  const handlePreviewDocument = async (doc) => {
    setContractLoading(true);
    try {
      const endpoint = resolveContractEndpoint(doc.documentType);
      const res = await sendApiRequest(endpoint, {
        studentId: doc.studentId,
        academicYear: doc.academicYear || selectedYear,
        documentType: doc.documentType,
        class: doc.class,
        metadata: doc.metadata
      });

      if (res && res.success && res.data) {
        const landscapeTypes = ['COMPLETION_CERTIFICATE', 'CHARACTER_CERTIFICATE', 'MERIT_CERTIFICATE', 'ACHIEVEMENT_CERTIFICATE', 'PARTICIPATION_CERTIFICATE', 'CUSTOM_CERTIFICATE'];
        const orientation = landscapeTypes.includes(doc.documentType) ? 'landscape' : 'portrait';
        const html = buildDocumentHtml(doc.documentType, res.data, doc);

        setPreviewHtml(html);
        setPreviewOrientation(orientation);
        setSelectedDoc(doc);
        setIsPreviewModalOpen(true);
      } else {
        setError('Unable to load document contract data for preview.');
      }
    } catch (err) {
      setError('Connection error generating document preview.');
    } finally {
      setContractLoading(false);
    }
  };

  // Print Document
  const handlePrintDocument = () => {
    if (previewHtml) {
      printDocumentHtml(previewHtml, previewOrientation);
    }
  };

  // Download Document as HTML / PDF Package
  const handleDownloadDocument = () => {
    if (previewHtml && selectedDoc) {
      const filename = `${selectedDoc.documentNumber || 'DOCUMENT'}_${selectedDoc.studentId}.html`;
      downloadDocumentFile(previewHtml, filename);
    }
  };

  // Create Document Mutation
  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;
    setFormSubmitting(true);
    setError(null);

    try {
      const res = await sendApiRequest('create_document', formData);
      if (res && res.success) {
        setSuccessMsg(`Document draft created successfully for ${res.data.document.studentId}`);
        setIsGenerateModalOpen(false);
        await loadDocuments(true);
      } else {
        setError(res?.error?.message || 'Failed to create document');
      }
    } catch (err) {
      setError('Connection error creating document');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Lifecycle Action: Approve
  const handleApproveDocument = async (docId) => {
    try {
      const res = await sendApiRequest('approve_document', { documentId: docId });
      if (res && res.success) {
        setSuccessMsg('Document approved successfully');
        if (selectedDoc && selectedDoc.documentId === docId) {
          setSelectedDoc(res.data.document);
        }
        await loadDocuments(true);
      } else {
        setError(res?.error?.message || 'Failed to approve document');
      }
    } catch (err) {
      setError('Network error approving document');
    }
  };

  // Lifecycle Action: Issue
  const handleIssueDocument = async (docId) => {
    try {
      const res = await sendApiRequest('issue_document', { documentId: docId });
      if (res && res.success) {
        setSuccessMsg(`Document officially issued as ${res.data.document.documentNumber}`);
        if (selectedDoc && selectedDoc.documentId === docId) {
          setSelectedDoc(res.data.document);
        }
        await loadDocuments(true);
      } else {
        setError(res?.error?.message || 'Failed to issue document');
      }
    } catch (err) {
      setError('Network error issuing document');
    }
  };

  // Lifecycle Action: Revise
  const handleReviseDocument = async (docId) => {
    try {
      const res = await sendApiRequest('revise_document', { documentId: docId });
      if (res && res.success) {
        setSuccessMsg(`Document revised. New official document: ${res.data.newDocument.documentNumber}`);
        setSelectedDoc(res.data.newDocument);
        await loadDocuments(true);
      } else {
        setError(res?.error?.message || 'Failed to revise document');
      }
    } catch (err) {
      setError('Network error revising document');
    }
  };

  // Lifecycle Action: Cancel
  const handleCancelDocument = async (docId) => {
    const reason = window.prompt('Enter reason for document cancellation:', 'Administrative cancellation');
    if (!reason) return;

    try {
      const res = await sendApiRequest('cancel_document', { documentId: docId, reason });
      if (res && res.success) {
        setSuccessMsg('Document has been cancelled and invalidated');
        if (selectedDoc && selectedDoc.documentId === docId) {
          setSelectedDoc(res.data.document);
        }
        await loadDocuments(true);
      } else {
        setError(res?.error?.message || 'Failed to cancel document');
      }
    } catch (err) {
      setError('Network error cancelling document');
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* 1. Header Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>
              Academic Documents Center
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Official Marksheets, Certificates, Report Cards & QR Verification Engine
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => loadDocuments(true)}
              disabled={refreshing}
            >
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsGenerateModalOpen(true)}
            >
              <Plus size={15} />
              <span>Generate Document</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Session:</label>
            <select
              className="filter-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {academicYears.map((y) => (
                <option key={y.yearId || y.yearName} value={y.yearName}>
                  {y.yearName} {y.isCurrent ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Class:</label>
            <select
              className="filter-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="ALL">All Classes</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Type:</label>
            <select
              className="filter-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="ALL">All Document Types (14)</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Status:</label>
            <select
              className="filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="card" style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', marginBottom: '16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="card" style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', marginBottom: '16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="card" style={{ padding: '14px 20px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by Document Number (e.g. GHSS-MARK-2026-000001), Student Name, ID, or Verification ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div className="card skeleton" style={{ height: '340px', borderRadius: '16px' }} />
      ) : displayedDocuments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', borderRadius: '16px' }}>
          <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
            No Academic Documents Found
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Generate a new document or modify your search filters above.
          </p>
        </div>
      ) : (
        <div className="students-table-wrapper card" style={{ borderRadius: '16px', padding: 0, overflow: 'hidden' }}>
          <table className="students-table">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th>Doc Number</th>
                <th>Document Type</th>
                <th>Student</th>
                <th>Class</th>
                <th style={{ textAlign: 'center' }}>Version</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedDocuments.map((doc) => {
                const isIssued = doc.status === 'ISSUED';
                const isRevised = doc.status === 'REVISED';
                const isCancelled = doc.status === 'CANCELLED';
                const isApproved = doc.status === 'APPROVED';

                return (
                  <tr key={doc.documentId}>
                    <td>
                      <div style={{ fontWeight: 800, color: isIssued ? '#1e3a8a' : '#64748b', fontSize: '0.85rem' }}>
                        {doc.documentNumber || 'DRAFT-PENDING'}
                      </div>
                      {doc.verificationId && (
                        <div style={{ fontSize: '0.72rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <ShieldCheck size={11} />
                          <span>{doc.verificationId}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{doc.title || doc.documentType}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{doc.academicYear}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{doc.studentName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {doc.studentId} • Roll #{doc.rollNo || '--'}</div>
                    </td>
                    <td>
                      <span className="roll-badge">Class {doc.class || '9'}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                        v{doc.version || 1}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          background: isIssued ? '#dbeafe' : (isApproved ? '#dcfce7' : (isCancelled ? '#fee2e2' : (isRevised ? '#fef3c7' : '#f1f5f9'))),
                          color: isIssued ? '#1d4ed8' : (isApproved ? '#15803d' : (isCancelled ? '#dc2626' : (isRevised ? '#b45309' : '#64748b'))),
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 800
                        }}
                      >
                        {doc.status || 'DRAFT'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                          onClick={() => handlePreviewDocument(doc)}
                          title="Preview & Print Official PDF"
                        >
                          <Printer size={13} />
                          <span>Print / PDF</span>
                        </button>
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleOpenDocDetails(doc)}
                          title="Inspect Metadata & Manage Lifecycle"
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Visual Document PDF Preview Modal */}
      {isPreviewModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '980px', padding: '24px', borderRadius: '20px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                  Document PDF & Print Preview
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  {selectedDoc?.documentNumber || 'DRAFT'} • {selectedDoc?.studentName} (Class {selectedDoc?.class})
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleDownloadDocument}
                  title="Download standalone HTML document file"
                >
                  <Download size={14} />
                  <span>Save HTML Archive</span>
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handlePrintDocument}
                  title="Open browser print dialog to print or Save as PDF"
                >
                  <Printer size={14} />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ padding: '6px', border: 'none' }}
                  onClick={() => setIsPreviewModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Visual Container */}
            <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>
        </div>
      )}

      {/* Inspect Document Details Drawer */}
      {selectedDoc && !isPreviewModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '720px', padding: '24px', borderRadius: '20px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  {selectedDoc.title || selectedDoc.documentType}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Document ID: {selectedDoc.documentId}
                </p>
              </div>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '6px', border: 'none' }}
                onClick={() => setSelectedDoc(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Document Metadata Grid */}
            <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '16px', background: '#f8fafc', padding: '14px', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Document Number</div>
                <div style={{ fontWeight: 800, color: '#1e3a8a' }}>{selectedDoc.documentNumber || 'UNASSIGNED (DRAFT)'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Verification Identifier</div>
                <div style={{ fontWeight: 800, color: '#059669' }}>{selectedDoc.verificationId || 'PENDING ISSUANCE'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Student & Class</div>
                <div style={{ fontWeight: 600 }}>{selectedDoc.studentName} (Class {selectedDoc.class})</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Lifecycle Status</div>
                <div style={{ fontWeight: 800 }}>{selectedDoc.status} (v{selectedDoc.version})</div>
              </div>
            </div>

            {/* Authoritative Contract Preview */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                  Authoritative Contract Data (Backend Source of Truth)
                </h4>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={() => handlePreviewDocument(selectedDoc)}
                >
                  <Eye size={12} />
                  <span>Open Full PDF Preview</span>
                </button>
              </div>
              {contractLoading ? (
                <div className="card skeleton" style={{ height: '120px', borderRadius: '8px' }} />
              ) : contractData ? (
                <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', overflowX: 'auto', maxHeight: '180px' }}>
                  {JSON.stringify(contractData, null, 2)}
                </pre>
              ) : (
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No contract data preview available.</p>
              )}
            </div>

            {/* Lifecycle Transition Actions (Admin / Principal) */}
            {(isPrincipal || isAdmin) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedDoc.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ color: '#dc2626', borderColor: '#fca5a5', fontSize: '0.8rem' }}
                      onClick={() => handleCancelDocument(selectedDoc.documentId)}
                    >
                      <Ban size={14} />
                      <span>Cancel Document</span>
                    </button>
                  )}
                  {selectedDoc.status === 'ISSUED' && (
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ color: '#b45309', borderColor: '#fde68a', fontSize: '0.8rem' }}
                      onClick={() => handleReviseDocument(selectedDoc.documentId)}
                    >
                      <RefreshCw size={14} />
                      <span>Issue Revision (v{parseInt(selectedDoc.version || 1) + 1})</span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedDoc.status === 'DRAFT' && (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ background: '#3b82f6', borderColor: '#3b82f6', fontSize: '0.8rem' }}
                      onClick={() => handleApproveDocument(selectedDoc.documentId)}
                    >
                      <Check size={14} />
                      <span>Approve</span>
                    </button>
                  )}
                  {selectedDoc.status !== 'ISSUED' && selectedDoc.status !== 'CANCELLED' && selectedDoc.status !== 'REVISED' && (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ background: '#10b981', borderColor: '#10b981', fontSize: '0.8rem' }}
                      onClick={() => handleIssueDocument(selectedDoc.documentId)}
                    >
                      <Send size={14} />
                      <span>Issue Official Document</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Document Modal */}
      {isGenerateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '560px', padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Generate Academic Document
              </h3>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '6px', border: 'none' }}
                onClick={() => setIsGenerateModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDocument}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  Document Type:
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  Select Student:
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={formData.studentId}
                  onChange={(e) => {
                    const s = students.find((st) => st.studentId === e.target.value);
                    setFormData({
                      ...formData,
                      studentId: e.target.value,
                      class: s ? s.class : formData.class
                    });
                  }}
                >
                  {students.map((s) => (
                    <option key={s.studentId} value={s.studentId}>
                      {s.name || s.studentName} (Class {s.class} • Roll #{s.roll || '--'})
                    </option>
                  ))}
                </select>
              </div>

              {formData.documentType === 'COMPLETION_CERTIFICATE' && (
                <div style={{ marginBottom: '14px', background: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e' }}>
                    Institutional Result-Policy Confirmation Required
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#b45309' }}>
                    Completion eligibility verification requires confirmed school grading and passing thresholds before official issuance.
                  </p>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  Document Title (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Official Marksheet - Annual Exam"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setIsGenerateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={formSubmitting}
                >
                  <Plus size={15} />
                  <span>{formSubmitting ? 'Creating...' : 'Create Draft Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
