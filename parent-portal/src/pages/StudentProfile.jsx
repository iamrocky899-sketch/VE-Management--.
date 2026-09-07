import React, { useState, useEffect } from 'react';
import { useAuth } from '../state/AuthContext';
import { ApiService } from '../services/api';
import {
  User, GraduationCap, Phone, Mail, MapPin, Calendar,
  ShieldCheck, KeyRound, LogOut, RefreshCw, AlertCircle,
  Sparkles, CheckCircle2, BookOpen, Award, Bell, Activity,
  ArrowRight, School, MessageCircle, HeartHandshake, Shield,
  Camera, UploadCloud
} from 'lucide-react';
import { getStudentDisplayName, getCertificateLevel } from '../utils/formatters';

export default function StudentProfile({ setActivePage, setIsChangePasswordOpen }) {
  const { user, logout, handleSessionRevocation } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  const fetchProfile = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Student profile strictly resolves own session token on backend
      const res = await ApiService.getStudentProfile(user?.token);

      if (res && res.success && res.data) {
        setProfileData(res.data);
      } else {
        const errCode = res?.error?.code;
        if (errCode === 'SESSION_EXPIRED') {
          handleSessionRevocation('SESSION_EXPIRED');
          return;
        } else if (errCode === 'ACCOUNT_DEACTIVATED') {
          handleSessionRevocation('ACCOUNT_DEACTIVATED');
          return;
        }
        setError(res?.error?.message || 'Unable to load student profile details.');
      }
    } catch (e) {
      setError('Network connection error. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchProfile();
    }
  }, [user?.token]);

  // Generate clean initials avatar (safe photo fallback)
  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Safe phone cleaning for contact links
  const cleanPhone = (phoneStr) => {
    if (!phoneStr) return '';
    return String(phoneStr).replace(/\D/g, '');
  };

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files (JPG, PNG, WebP) are supported.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Photo size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target.result;
      setUploadingPhoto(true);
      setError(null);
      try {
        const res = await ApiService.uploadStudentPhoto(user?.token, dataUrl, profileData?.student?.studentId);
        if (res && res.success) {
          setProfileData((prev) => ({
            ...prev,
            student: {
              ...prev.student,
              photoUrl: dataUrl
            }
          }));
        } else {
          setError(res?.error?.message || 'Failed to update profile photo.');
        }
      } catch (err) {
        setError('Network error while uploading profile photo.');
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="profile-skeleton-wrap animate-fade-in" role="status" aria-label="Loading student profile">
        {/* Hero Card Skeleton */}
        <div className="card skeleton" style={{ height: '170px', marginBottom: '20px', borderRadius: '20px' }} />

        {/* 2-Column Info Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: '20px' }}>
          <div className="card skeleton" style={{ height: '240px', borderRadius: '16px' }} />
          <div className="card skeleton" style={{ height: '240px', borderRadius: '16px' }} />
        </div>

        {/* Parent & Contact Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: '20px' }}>
          <div className="card skeleton" style={{ height: '220px', borderRadius: '16px' }} />
          <div className="card skeleton" style={{ height: '220px', borderRadius: '16px' }} />
        </div>

        {/* Quick Links Skeleton */}
        <div className="card skeleton" style={{ height: '140px', borderRadius: '16px' }} />
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="card animate-fade-in" role="alert" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '20px' }}>
        <AlertCircle size={44} color="var(--accent-rose)" style={{ margin: '0 auto 16px auto' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Unable to Load Profile
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px auto' }}>
          {error}
        </p>
        <button
          type="button"
          onClick={() => fetchProfile(true)}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
        >
          <RefreshCw size={16} />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const student = profileData?.student || {};
  const guardians = profileData?.guardians || [];
  const primaryGuardian = guardians.length > 0 ? guardians[0] : null;

  const rawPhone = student.mobile || user?.identifier || '';
  const cleanedPhone = cleanPhone(rawPhone);
  const guardianPhone = primaryGuardian?.mobile || student.mobile || '';
  const cleanedGuardianPhone = cleanPhone(guardianPhone);

  return (
    <div className="student-profile-view animate-fade-in">
      {/* 1. Header & Hero Profile Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 60%, #0ea5e9 100%)',
          color: '#ffffff',
          padding: '24px 28px',
          borderRadius: '20px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Profile Photo / Avatar with Upload Button */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={getStudentDisplayName(student)}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '3px solid rgba(255, 255, 255, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                {getInitials(getStudentDisplayName(student))}
              </div>
            )}

            <label
              htmlFor="student-photo-input"
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                background: '#ffffff',
                color: '#1e3a8a',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploadingPhoto ? 'wait' : 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                border: '1px solid #cbd5e1'
              }}
              title="Upload / Change Profile Photo"
            >
              {uploadingPhoto ? <RefreshCw size={14} className="spin-anim" /> : <Camera size={14} />}
            </label>
            <input
              id="student-photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handlePhotoFileChange}
              disabled={uploadingPhoto}
            />
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                {getStudentDisplayName(student)}
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backdropFilter: 'blur(4px)'
                }}
              >
                <CheckCircle2 size={12} />
                <span>{student.status || 'Active'}</span>
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f59e0b',
                  color: '#ffffff',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}
              >
                {getCertificateLevel(student.class)}
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.9)', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <School size={14} />
              <span>Gameri Higher Secondary School, Gamiri • Academic Year 2026–2027</span>
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700 }}>
                ID: {student.studentId || 'N/A'}
              </span>
              <span style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700 }}>
                Class {student.class || '9'} (Sec {student.section || 'A'})
              </span>
              <span style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700 }}>
                Roll No: {student.rollNo || 'N/A'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchProfile(true)}
            disabled={refreshing}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
            title="Refresh profile details"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Two-Column Grid: Basic Info & Academic Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: '20px' }}>
        {/* Basic Personal Information */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <User size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Personal Information
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Full Name
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {student.studentName || 'Not Provided'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Gender
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {student.gender || 'Male'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Date of Birth
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {student.dob || 'Not Recorded'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Village / Residence
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {student.village || 'Gamiri Gaon'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Account Status
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-green-text)' }}>
                {student.status || 'Active'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Aadhaar Verification
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                XXXX XXXX 1234 (Protected)
              </div>
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <GraduationCap size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Academic Enrollment
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Enrolled Class
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Class {student.class || '9'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Section
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Section {student.section || 'A'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Class Roll Number
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {student.rollNo || 'N/A'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Student ID
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)' }}>
                {student.studentId || 'N/A'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Institution
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Gameri HSS, Gamiri
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                School Code
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                GAMERI-HSS-001
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Two-Column Grid: Parent/Guardian & Student Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: '20px' }}>
        {/* Parent / Guardian Information */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <HeartHandshake size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Parent & Guardian Details
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Father's Name
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {student.fatherName || 'Not Recorded'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Mother's Name
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {student.motherName || 'Not Recorded'}
              </div>
            </div>

            {primaryGuardian && (
              <div style={{ padding: '10px 12px', background: 'var(--bg-card-muted)', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                  Linked Portal Parent
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {primaryGuardian.parentName} ({primaryGuardian.relationship || 'Guardian'})
                </div>
                {primaryGuardian.mobile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <a
                      href={`tel:${cleanedGuardianPhone}`}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', minHeight: '36px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Phone size={12} />
                      <span>Call Guardian</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Student Contact Information */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <Phone size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Contact Information
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Registered Mobile Number
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {rawPhone ? `+91 ${rawPhone}` : 'Not Provided'}
              </div>

              {cleanedPhone && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href={`tel:${cleanedPhone}`}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px', minHeight: '40px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Phone size={14} />
                    <span>Call Mobile</span>
                  </a>

                  <a
                    href={`https://wa.me/91${cleanedPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 12px', minHeight: '40px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#16a34a', borderColor: '#bbf7d0' }}
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Residential Location
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="var(--primary)" />
                <span>{student.village ? `${student.village}, Biswanath, Assam` : 'Gamiri, Biswanath, Assam'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Academic Quick Links Section */}
      <div className="card" style={{ padding: '20px 22px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Sparkles size={18} color="var(--primary)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Academic Shortcuts
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setActivePage('attendance')}
            className="btn-secondary"
            style={{ padding: '10px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', borderRadius: '12px' }}
          >
            <CheckCircle2 size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Attendance</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('marks')}
            className="btn-secondary"
            style={{ padding: '10px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', borderRadius: '12px' }}
          >
            <Award size={16} color="var(--accent-amber)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Report Card</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('materials')}
            className="btn-secondary"
            style={{ padding: '10px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', borderRadius: '12px' }}
          >
            <BookOpen size={16} color="var(--accent-teal)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Study Materials</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('assignments')}
            className="btn-secondary"
            style={{ padding: '10px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', borderRadius: '12px' }}
          >
            <BookOpen size={16} color="var(--accent-purple)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Assignments</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('activities')}
            className="btn-secondary"
            style={{ padding: '10px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', borderRadius: '12px' }}
          >
            <Activity size={16} color="var(--accent-green)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Activities</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('notices')}
            className="btn-secondary"
            style={{ padding: '10px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', borderRadius: '12px' }}
          >
            <Bell size={16} color="var(--accent-rose)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Notices</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('calendar')}
            className="btn-secondary"
            style={{ padding: '10px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', borderRadius: '12px' }}
          >
            <Calendar size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePage('contacts')}
            className="btn-secondary"
            style={{ padding: '10px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', borderRadius: '12px' }}
          >
            <Phone size={16} color="var(--accent-teal)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>School Contacts</span>
          </button>
        </div>
      </div>

      {/* 5. Account Settings & Security Card */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <ShieldCheck size={18} color="var(--primary)" />
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Account Security & Controls
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Portal Account Credentials
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Update your account password securely at any time.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.84rem' }}
            >
              <KeyRound size={14} />
              <span>Change Password</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.84rem', color: 'var(--accent-rose-text)', borderColor: 'var(--accent-rose-light)' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
