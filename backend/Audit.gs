/**
 * VE MANAGEMENT — Secure Audit Logging Service
 * School: Gameri Higher Secondary School, Gamiri
 * Records audit trails with strict sensitive-data masking (passwords, tokens, keys).
 */

const Audit = {

  /**
   * Masks sensitive information from audit detail objects or strings.
   */
  sanitizeDetails: function(details) {
    if (!details) return '';
    let str = (typeof details === 'object') ? JSON.stringify(details) : String(details);

    // Mask passwords, hashes, tokens, keys
    str = str.replace(/"password"\s*:\s*"[^"]*"/gi, '"password":"***"');
    str = str.replace(/"newPassword"\s*:\s*"[^"]*"/gi, '"newPassword":"***"');
    str = str.replace(/"oldPassword"\s*:\s*"[^"]*"/gi, '"oldPassword":"***"');
    str = str.replace(/"passwordHash"\s*:\s*"[^"]*"/gi, '"passwordHash":"***"');
    str = str.replace(/"token"\s*:\s*"[^"]*"/gi, '"token":"***"');
    str = str.replace(/"apiKey"\s*:\s*"[^"]*"/gi, '"apiKey":"***"');
    str = str.replace(/"secret"\s*:\s*"[^"]*"/gi, '"secret":"***"');

    return str.substring(0, 1500); // Prevent sheet cell overflow
  },

  /**
   * Logs an action to the Audit sheet.
   */
  log: function(action, actorType, actorId, details, status, ipAddress, schoolId) {
    try {
      const nowStr = Utilities.formatDate(new Date(), 'Asia/Kolkata', "yyyy-MM-dd'T'HH:mm:ss'Z'");
      const logEntry = {
        logId: Auth.generateId('LOG'),
        schoolId: schoolId || DEFAULT_SCHOOL_ID,
        timestamp: nowStr,
        action: String(action || 'UNKNOWN'),
        actorType: String(actorType || 'SYSTEM'),
        actorId: String(actorId || 'N/A'),
        details: this.sanitizeDetails(details),
        status: String(status || 'SUCCESS'),
        ipAddress: String(ipAddress || '')
      };

      Database.upsertBatch('Audit', [logEntry]);
    } catch (e) {
      console.error("Audit log failure: " + e.message);
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Audit };
}
