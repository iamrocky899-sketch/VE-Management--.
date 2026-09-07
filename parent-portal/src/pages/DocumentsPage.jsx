import React, { useState, useEffect } from 'react';
import { useAuth } from '../state/AuthContext';
import { ApiService } from '../services/api';
import {
  FileText,
  Download,
  ExternalLink,
  Calendar,
  ShieldCheck,
  Award,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  Lock,
  Printer,
  Eye,
  X
} from 'lucide-react';
import {
  buildMarksheetHtml,
  buildCompletionCertificateHtml,
  buildDocumentHtml,
  printDocumentHtml,
  downloadDocumentFile
} from '../utils/pdfGenerator';

export default function DocumentsPage() {
  const { t, user, selectedChildId } = useAuth();
  const [activeTab, setActiveTab] = useState('academic');
  const [academicDocs, setAcademicDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewOrientation, setPreviewOrientation] = useState('portrait');
  const [previewLoading, setPreviewLoading] = useState(false);

  // General Institutional Documents
  const generalDocuments = [
    {
      id: 'DOC_1',
      title: 'ASSEB Academic Calendar 2026–27 (Official PDF)',
      category: 'Academic Schedule',
      date: '01 Apr 2026',
      size: '2.4 MB',
      url: 'https://sebaonline.org'
    },
    {
      id: 'DOC_2',
      title: 'Vocational IT/ITeS Curriculum & Practical Syllabus',
      category: 'Syllabus',
      date: '10 May 2026',
      size: '1.1 MB',
      url: 'https://sebaonline.org'
    },
    {
      id: 'DOC_3',
      title: '1st Unit Test Examination Routine & Guidelines',
      category: 'Examination',
      date: '20 Jul 2026',
      size: '450 KB',
      url: 'https://sebaonline.org'
    }
  ];

  // Fetch Child-Scoped Academic Documents
  const loadAcademicDocs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await ApiService.getAcademicDocuments(
        user?.token,
        { studentId: selectedChildId },
        isManual
      );

      if (res && res.success && res.data) {
        setAcademicDocs(res.data.documents || []);
      } else {
        setAcademicDocs([]);
      }
    } catch (err) {
      setError('Unable to load official academic documents.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      loadAcademicDocs();
    }
  }, [user?.token, selectedChildId]);

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

  // Open Document Preview Modal
  const handleOpenPreview = async (doc) => {
    setPreviewLoading(true);
    setPreviewDoc(doc);
    try {
      const endpoint = resolveContractEndpoint(doc.documentType);
      const res = await ApiService.sendApiRequest(endpoint, {
        token: user?.token,
        studentId: doc.studentId,
        academicYear: doc.academicYear,
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
      } else {
        setError('Could not retrieve document verification details.');
      }
    } catch (err) {
      setError('Network error loading document preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePrint = () => {
    if (previewHtml) {
      printDocumentHtml(previewHtml, previewOrientation);
    }
  };

  const handleDownload = () => {
    if (previewHtml && previewDoc) {
      const filename = `${previewDoc.documentNumber || 'DOCUMENT'}_${previewDoc.studentId}.html`;
      downloadDocumentFile(previewHtml, filename);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '30px' }}>
      {/* 1. Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0284c7, #0369a1)',
          color: '#fff',
          border: 'none',
          padding: '20px',
          boxShadow: '0 8px 20px rgba(2, 132, 199, 0.22)',
          marginBottom: '14px',
          borderRadius: '16px'
        }}
      >
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9, fontWeight: '700' }}>
          {t('schoolName')}
        </div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '3px 0' }}>
          {t('documentsTitle')}
        </h1>
        <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>
          Official Marksheets, Certificates, Routines & Verified Institutional Documents
        </p>
      </div>

      {/* 2. Tab Navigation Toolbar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('academic')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '12px',
            border: activeTab === 'academic' ? '2px solid #0284c7' : '1px solid #cbd5e1',
            background: activeTab === 'academic' ? '#f0f9ff' : '#ffffff',
            color: activeTab === 'academic' ? '#0369a1' : '#64748b',
            fontWeight: 800,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Award size={16} />
          <span>Official Student Documents</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('general')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '12px',
            border: activeTab === 'general' ? '2px solid #0284c7' : '1px solid #cbd5e1',
            background: activeTab === 'general' ? '#f0f9ff' : '#ffffff',
            color: activeTab === 'general' ? '#0369a1' : '#64748b',
            fontWeight: 800,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <FileText size={16} />
          <span>Syllabi & Circulars</span>
        </button>
      </div>

      {/* 3. Tab Content: Academic Documents */}
      {activeTab === 'academic' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
              Showing verified documents for selected child
            </div>
            <button
              type="button"
              className="btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              onClick={() => loadAcademicDocs(true)}
              disabled={refreshing}
            >
              <RefreshCw size={12} className={refreshing ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="card skeleton" style={{ height: '180px', borderRadius: '14px' }} />
          ) : error ? (
            <div className="card" style={{ padding: '24px', textAlign: 'center', borderRadius: '14px' }}>
              <AlertCircle size={36} color="#dc2626" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{error}</p>
            </div>
          ) : academicDocs.length === 0 ? (
            <div className="card" style={{ padding: '36px 20px', textAlign: 'center', borderRadius: '16px' }}>
              <ShieldCheck size={44} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                No Issued Documents Yet
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Official marksheets and certificates will appear here once approved and published by school administration.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {academicDocs.map((doc) => (
                <div
                  key={doc.documentId}
                  className="card"
                  style={{ marginBottom: 0, padding: '16px', borderRadius: '14px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: '#e0f2fe',
                          color: '#0369a1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Award size={22} />
                      </div>

                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
                          {doc.title || doc.documentType}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          Doc No: <strong style={{ color: '#0369a1' }}>{doc.documentNumber}</strong> • {doc.academicYear} (v{doc.version})
                        </div>
                        {doc.verificationId && (
                          <div style={{ fontSize: '0.72rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <ShieldCheck size={12} />
                            <span>Verified ID: {doc.verificationId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleOpenPreview(doc)}
                      >
                        <Printer size={14} />
                        <span>View / Print</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Tab Content: General Syllabi & Circulars */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {generalDocuments.map((doc) => (
            <div key={doc.id} className="card" style={{ marginBottom: 0, padding: '14px', borderRadius: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <FileText size={20} />
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {doc.category} • {doc.date} • {doc.size}
                    </div>
                  </div>
                </div>

                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <button
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', minHeight: '36px' }}
                  >
                    <ExternalLink size={14} />
                    <span>{t('viewDoc')}</span>
                  </button>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Document Preview Modal */}
      {previewDoc && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '960px', padding: '24px', borderRadius: '20px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  {previewDoc.title || previewDoc.documentType}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Doc No: {previewDoc.documentNumber} • Verification ID: {previewDoc.verificationId}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleDownload}
                  title="Download standalone HTML document file"
                >
                  <Download size={14} />
                  <span>Save HTML Archive</span>
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handlePrint}
                  title="Open browser print dialog to print or Save as PDF"
                >
                  <Printer size={14} />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ padding: '6px', border: 'none' }}
                  onClick={() => setPreviewDoc(null)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {previewLoading ? (
              <div className="card skeleton" style={{ height: '300px', borderRadius: '12px' }} />
            ) : (
              <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
