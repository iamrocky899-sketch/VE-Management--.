/**
 * VE MANAGEMENT — PRODUCTION SHADOW COMPARATOR & MISMATCH TRIAGE ENGINE
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Compares Google Apps Script (Authoritative Production) vs Cloudflare Workers (Shadow Mode).
 * Classifies discrepancies according to institutional taxonomy:
 * - DATA_STALE
 * - API_LOGIC_MISMATCH
 * - AUTHORIZATION_MISMATCH
 * - SCHEMA_MISMATCH
 * - TRANSFORMATION_MISMATCH
 * - EXPECTED_DYNAMIC_DIFFERENCE
 * - UNKNOWN
 */

/**
 * Normalizes volatile fields like timestamps or server metadata.
 */
function normalizeResponseForComparison(responseObj) {
  if (!responseObj || typeof responseObj !== 'object') return responseObj;
  const clone = JSON.parse(JSON.stringify(responseObj));

  // Strip volatile execution timestamps
  delete clone.timestamp;
  delete clone.serverTime;
  delete clone.reportGeneratedAt;
  delete clone.executionTimeMs;

  if (clone.data && typeof clone.data === 'object') {
    delete clone.data.serverTime;
    delete clone.data.reportGeneratedAt;
    delete clone.data.executionTimeMs;
  }

  return clone;
}

/**
 * Classifies the difference between Apps Script and Workers responses.
 */
function classifyMismatch(gasRes, workerRes, dataAgeMs = 0) {
  if (!gasRes || !workerRes) return 'UNKNOWN';

  // Check authorization decision mismatch
  if (gasRes.success !== workerRes.success) {
    if (gasRes.error?.code === 'UNAUTHORIZED' || workerRes.error?.code === 'UNAUTHORIZED' ||
        gasRes.error?.code === 'FORBIDDEN' || workerRes.error?.code === 'FORBIDDEN') {
      return 'AUTHORIZATION_MISMATCH';
    }
    return 'API_LOGIC_MISMATCH';
  }

  // If status is matching but data differs
  if (dataAgeMs > 60000) {
    return 'DATA_STALE';
  }

  // Check schema differences (keys mismatch)
  const gasKeys = gasRes.data ? Object.keys(gasRes.data).sort().join(',') : '';
  const workerKeys = workerRes.data ? Object.keys(workerRes.data).sort().join(',') : '';
  if (gasKeys !== workerKeys) {
    return 'SCHEMA_MISMATCH';
  }

  return 'API_LOGIC_MISMATCH';
}

/**
 * Executes an authoritative shadow comparison.
 */
function compareResponses(endpointName, appsScriptRes, workerRes, options = {}) {
  const dataAgeMs = options.dataAgeMs || 0;
  const correlationId = options.correlationId || `SHADOW-${Date.now()}`;

  const normGas = normalizeResponseForComparison(appsScriptRes);
  const normWorker = normalizeResponseForComparison(workerRes);

  const gasStr = JSON.stringify(normGas);
  const workerStr = JSON.stringify(normWorker);

  const isExactMatch = gasStr === workerStr;
  let mismatchType = null;
  let severity = 'LOW';

  if (!isExactMatch) {
    mismatchType = classifyMismatch(normGas, normWorker, dataAgeMs);
    if (mismatchType === 'AUTHORIZATION_MISMATCH') {
      severity = 'CRITICAL';
    } else if (mismatchType === 'API_LOGIC_MISMATCH') {
      severity = 'HIGH';
    } else if (mismatchType === 'DATA_STALE') {
      severity = 'MEDIUM';
    } else {
      severity = 'HIGH';
    }
  }

  return {
    correlationId: correlationId,
    endpoint: endpointName,
    matched: isExactMatch,
    exactMatch: isExactMatch,
    mismatchType: mismatchType,
    severity: severity,
    successParity: normGas.success === normWorker.success,
    gasSuccess: normGas.success,
    workerSuccess: normWorker.success,
    gasDataSample: normGas.data ? Object.keys(normGas.data) : null,
    workerDataSample: normWorker.data ? Object.keys(normWorker.data) : null,
    dataAgeMs: dataAgeMs
  };
}

module.exports = {
  normalizeResponseForComparison,
  classifyMismatch,
  compareResponses
};
