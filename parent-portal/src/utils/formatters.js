/**
 * Authoritative Student & Academic Formatting Utilities
 * Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 */

/**
 * Formats a student's full display name cleanly without undefined or extra spaces.
 * Handles fullName, studentName, name, and split firstName/middleName/lastName.
 */
export function getStudentDisplayName(student) {
  if (!student) return 'Student';
  if (typeof student === 'string') {
    const trimmed = student.trim();
    return trimmed || 'Student';
  }

  const directName = student.studentName || student.fullName || student.name;
  if (directName && typeof directName === 'string' && directName.trim().length > 0) {
    return directName.trim().replace(/\s+/g, ' ');
  }

  const parts = [];
  if (student.firstName && typeof student.firstName === 'string') parts.push(student.firstName.trim());
  if (student.middleName && typeof student.middleName === 'string') parts.push(student.middleName.trim());
  if (student.lastName && typeof student.lastName === 'string') parts.push(student.lastName.trim());

  if (parts.length > 0) {
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  if (student.rollNo || student.roll) {
    return `Roll ${student.rollNo || student.roll}`;
  }
  if (student.studentId || student.id) {
    return String(student.studentId || student.id);
  }
  return 'Student';
}

/**
 * Maps class name to the authoritative Vocational Skill Certificate Level.
 * Invariants: Class IX -> Level 1, Class X -> Level 2, Class XI -> Level 3, Class XII -> Level 4.
 */
export function getCertificateLevel(className) {
  if (!className) return 'Level 1';
  const str = String(className).trim().toUpperCase();
  if (str === '9' || str === 'IX' || str.includes('CLASS 9') || str.includes('CLASS IX')) return 'Level 1';
  if (str === '10' || str === 'X' || str.includes('CLASS 10') || str.includes('CLASS X')) return 'Level 2';
  if (str === '11' || str === 'XI' || str.includes('CLASS 11') || str.includes('CLASS XI')) return 'Level 3';
  if (str === '12' || str === 'XII' || str.includes('CLASS 12') || str.includes('CLASS XII')) return 'Level 4';
  return 'Level 1';
}
