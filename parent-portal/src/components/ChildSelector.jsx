import React, { useState } from 'react';
import { useAuth } from '../state/AuthContext';
import { Users, GraduationCap, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ChildSelector() {
  const { children, selectedChildId, switchChild, t } = useAuth();
  const [switchingId, setSwitchingId] = useState(null);

  if (!children || children.length === 0) {
    return null;
  }

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
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {t('class')} {onlyChild.class} ({onlyChild.section || 'A'}) • {t('rollNo')}: {onlyChild.rollNo}
            </div>
          </div>
        </div>
        <span className="badge badge-blue">{t('active')}</span>
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
          <span>{t('myChildren')} ({children.length})</span>
        </div>
        <span className="badge badge-blue">{t('selectChild')}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
        {children.map((child) => {
          const isSelected = String(child.studentId) === String(selectedChildId);
          const isSwitching = switchingId === child.studentId;

          return (
            <button
              key={child.studentId}
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
                opacity: isSwitching ? 0.7 : 1
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
                  <div style={{ fontSize: '0.72rem', opacity: isSelected ? 0.9 : 0.65 }}>
                    {t('class')} {child.class} • {t('section')} {child.section || 'A'} • {t('rollNo')}: {child.rollNo}
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
