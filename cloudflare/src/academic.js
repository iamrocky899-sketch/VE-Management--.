/**
 * VE MANAGEMENT — Canonical Academic Normalization Layer (Cloudflare Worker)
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
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
