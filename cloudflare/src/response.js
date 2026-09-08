/**
 * VE MANAGEMENT — CLOUDFLARE WORKERS RESPONSE & ENVELOPE FORMATTER
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Enforces standardized JSON response envelopes, status code mappings, and CORS headers.
 */

const DEFAULT_SCHOOL_ID = 'GAMERI-HSS-001';

/**
 * Standard CORS headers.
 */
export function getCorsHeaders(request, env) {
  const requestOrigin = request && typeof request.headers?.get === 'function' ? request.headers.get('Origin') : null;
  let allowedOrigin = '*';

  if (requestOrigin && env && env.CORS_ALLOW_ORIGINS) {
    const whitelist = String(env.CORS_ALLOW_ORIGINS).split(',').map(o => o.trim()).filter(Boolean);
    // Also always allow localhost dev servers
    whitelist.push('http://localhost:5173', 'http://localhost:5174');
    if (whitelist.includes(requestOrigin)) {
      allowedOrigin = requestOrigin;
    } else {
      // Unknown origin — restrict to prevent CSRF
      allowedOrigin = whitelist[0] || '*';
    }
  } else if (requestOrigin) {
    // No whitelist configured — allow the origin (backwards compatibility)
    allowedOrigin = requestOrigin;
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-School-ID',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * Creates standardized success JSON response.
 */
export function successResponse(data, action = 'unknown', status = 200, corsHeaders = {}) {
  const body = {
    success: true,
    action: action,
    data: data || null,
    error: null,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders
    }
  });
}

/**
 * Creates standardized error JSON response.
 */
export function errorResponse(code, message, status = 400, action = 'unknown', corsHeaders = {}) {
  const body = {
    success: false,
    action: action,
    data: null,
    error: {
      code: code || 'ERROR',
      message: message || 'An error occurred'
    },
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders
    }
  });
}
