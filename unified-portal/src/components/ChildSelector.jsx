import React, { useState } from 'react';
import { useAuth } from '../state/AuthContext';
import { Users, GraduationCap, CheckCircle2 } from 'lucide-react';
import { resolveStudentGroup, normalizeStudent } from '../api/client';

export default function ChildSelector() {
  const { user, selectedChildId, switchChild, isParent } = useAuth();
  const [switchingId, setSwitchingId] = useState(null);

  if (!isParent || !user || !user.children || user.children.length === 0) {
    return null;
  }

  const rawChildren = user.children;
  const children = rawChildren.map(c => {
    const norm = normalizeStudent(c);
    const grp = resolveStudentGroup(norm);
    return {
      ...norm,
      studentId: norm.studentId || norm.student_id || norm.id,
      studentName: norm.studentName || norm.name || 'Student',
      class: norm.class || norm.className || '10',
      section: norm.section || 'N/A',
      rollNo: norm.rollNo || norm.roll_no || norm.roll || '-',
      group: grp !== 'Group Not Assigned' ? grp : null,
      displayGroup: grp
    };
  });

  // Single-child family: show clean compact identity summary
  if (children.length === 1) {
    const onlyChild = children[0];
    return (
      <div className="card" style={{
        background: 'linear-gradient(135deg, #f0f9ff, #ffffff)',
        borderColor: '#bae6fd',
        padding: '12px 16px',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '0.9rem'
          }}>
            {onlyChild.studentName ? onlyChild.studentName.charAt(0) : 'S'}
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {onlyChild.studentName}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
              <span>Class {onlyChild.class} ({onlyChild.section || 'N/A'})</span>
              <span>•</span>
              <span>Roll No: {onlyChild.rollNo}</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <Users size={12} />
                <span>Group: <strong>{onlyChild.displayGroup || onlyChild.group || 'Group Not Assigned'}</strong></span>
              </span>
            </div>
          </div>
        </div>
        <span className="badge badge-blue">Active Student</span>
      </div>
    );
  }

  // Multi-child switcher
  const handleSwitch = (studentId) => {
    if (studentId === selectedChildId) return;
    setSwitchingId(studentId);
    switchChild(studentId);
    setTimeout(() => {
      setSwitchingId(null);
    }, 200);
  };

  return (
    <div className="card" style={{
      background: 'linear-gradient(135deg, #f0f9ff, #f8fafc)',
      borderColor: '#bae6fd',
      padding: '14px 16px',
      marginBottom: '14px'
    }}>
      <div className="card-header" style={{ marginBottom: '10px' }}>
        <div className="card-title" style={{ fontSize: '0.92rem', color: 'var(--primary-text)' }}>
          <Users size={18} color="var(--primary)" />
          <span>My Children ({children.length})</span>
        </div>
        <span className="badge badge-blue">Select Child</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
        {children.map((child) => {
          const isSelected = String(child.studentId) === String(selectedChildId);
          const isSwitching = switchingId === child.studentId;

          return (
            <button
              key={child.studentId}
              type="button"
              onClick={() => handleSwitch(child.studentId)}
              disabled={isSwitching}
              aria-label={`Select ${child.studentName}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                color: isSelected ? '#fff' : 'var(--text-primary)',
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                boxShadow: isSelected ? '0 4px 10px rgba(2, 132, 199, 0.25)' : 'none',
                textAlign: 'left',
                minHeight: '48px',
                opacity: isSwitching ? 0.7 : 1,
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--primary-light)',
                    color: isSelected ? '#fff' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.85rem'
                  }}
                >
                  {child.studentName ? child.studentName.charAt(0) : 'S'}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', lineHeight: 1.2 }}>
                    {child.studentName}
                  </div>
                  <div style={{ fontSize: '0.72rem', opacity: isSelected ? 0.9 : 0.65, display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                    <span>Class {child.class} • Sec {child.section || 'N/A'} • Roll {child.rollNo}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Users size={11} />
                      <span>Group: <strong>{child.displayGroup || child.group || 'Group Not Assigned'}</strong></span>
                    </span>
                  </div>
                </div>
              </div>

              {isSelected && (
                <div style={{ fontSize: '0.8rem', fontWeight: '800', marginLeft: '6px' }}>✓</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
