/**
 * VE MANAGEMENT — Canonical Academic Normalization Layer
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Provides shared normalization and mapping for classes, sections, and subjects
 * ensuring seamless parity between UI labels and Cloudflare D1 canonical values.
 */

export function normalizeClass(rawClass) {
  if (rawClass === null || rawClass === undefined) return '9';
  const str = String(rawClass).trim().toLowerCase();
  const match = str.match(/\b(9|10|11|12)\b/);
  if (match) return match[1];
  const cleaned = str.replace(/class/g, '').replace(/[^0-9]/g, '');
  return cleaned || '9';
}

export function normalizeSection(rawClass, rawSection) {
  if (rawSection === null || rawSection === undefined) return 'ALL';
  const sec = String(rawSection).trim();
  if (!sec || sec.toUpperCase() === 'ALL') return 'ALL';

  const cls = normalizeClass(rawClass);
  const cleanSec = sec.replace(/^section\s+/i, '').trim().toUpperCase();

  switch (cls) {
    case '9':
      if (cleanSec === 'A' || cleanSec === 'AMS') return 'AMS';
      if (cleanSec === 'B' || cleanSec === 'GP') return 'GP';
      return cleanSec;

    case '10':
      if (cleanSec === 'A' || cleanSec === 'BL') return 'BL';
      if (cleanSec === 'B' || cleanSec === 'DP') return 'DP';
      if (cleanSec === 'N/A' || cleanSec === 'NA' || cleanSec === 'NONE') return 'N/A';
      return cleanSec;

    case '11':
      if (cleanSec === 'A' || cleanSec === 'VOC') return cleanSec;
      if (cleanSec === 'B') return 'VOC';
      return 'A';

    case '12':
      if (cleanSec === 'N/A' || cleanSec === 'NA' || cleanSec === 'NONE' || cleanSec === 'A') return 'N/A';
      return cleanSec;

    default:
      return cleanSec;
  }
}

export function getClassSections(rawClass) {
  const cls = normalizeClass(rawClass);
  switch (cls) {
    case '9':
      return [
        { value: 'ALL', label: 'All Sections (Class 9 — 42 Students)' },
        { value: 'AMS', label: 'Section A (AMS — 20 Students)' },
        { value: 'GP', label: 'Section B (GP — 22 Students)' }
      ];
    case '10':
      return [
        { value: 'ALL', label: 'All Sections (Class 10 — 47 Students)' },
        { value: 'BL', label: 'Section A (BL — 19 Students)' },
        { value: 'DP', label: 'Section B (DP — 27 Students)' },
        { value: 'N/A', label: 'Section N/A (1 Student)' }
      ];
    case '11':
      return [
        { value: 'ALL', label: 'All Sections (Class 11 — 5 Students)' },
        { value: 'A', label: 'Section A (5 Students)' }
      ];
    case '12':
      return [
        { value: 'ALL', label: 'All Sections (Class 12 — 8 Students)' },
        { value: 'N/A', label: 'Section N/A / Default (8 Students)' }
      ];
    default:
      return [
        { value: 'ALL', label: 'All Sections' },
        { value: 'A', label: 'Section A' }
      ];
  }
}

export function formatSectionDisplay(rawClass, rawSection) {
  const cls = normalizeClass(rawClass);
  const sec = normalizeSection(cls, rawSection);
  if (sec === 'ALL') return 'All Sections';
  if (cls === '9') {
    if (sec === 'AMS') return 'Section A (AMS)';
    if (sec === 'GP') return 'Section B (GP)';
  }
  if (cls === '10') {
    if (sec === 'BL') return 'Section A (BL)';
    if (sec === 'DP') return 'Section B (DP)';
    if (sec === 'N/A') return 'Section N/A';
  }
  if (cls === '11') {
    if (sec === 'A') return 'Section A';
  }
  if (cls === '12') {
    return 'Section N/A';
  }
  return `Section ${sec}`;
}
