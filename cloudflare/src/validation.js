/**
 * VE MANAGEMENT — REQUEST VALIDATION & SANITIZATION ENGINE
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Enforces parameter types, string sanitization, and SQL injection protection.
 */

export const Validation = {
  /**
   * Sanitizes generic string input.
   */
  sanitizeString: function(val, defaultVal = '') {
    if (val === undefined || val === null) return defaultVal;
    return String(val).trim();
  },

  /**
   * Sanitizes integer inputs safely.
   */
  sanitizeInt: function(val, defaultVal = 0) {
    const num = parseInt(val, 10);
    return isNaN(num) ? defaultVal : num;
  },

  /**
   * Sanitizes boolean flags (0/1 or true/false).
   */
  sanitizeBool: function(val, defaultVal = 0) {
    if (val === true || val === 1 || val === 'true' || val === '1') return 1;
    return 0;
  },

  /**
   * Validates mobile number format (10 digits).
   */
  isValidMobile: function(mobile) {
    if (!mobile) return false;
    const clean = String(mobile).replace(/\D/g, '');
    return clean.length === 10;
  },

  /**
   * Validates date format (YYYY-MM-DD).
   */
  isValidDate: function(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  },

  /**
   * Checks for dangerous SQL injection patterns in raw parameters.
   */
  isSqlInjectionFree: function(input) {
    if (typeof input !== 'string') return true;
    const dangerousPatterns = [
      /--/i,
      /;\s*DROP\s+TABLE/i,
      /UNION\s+ALL\s+SELECT/i,
      /OR\s+1\s*=\s*1/i
    ];
    return !dangerousPatterns.some(pat => pat.test(input));
  }
};
