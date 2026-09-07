/**
 * VE MANAGEMENT — CLOUDFLARE WORKERS API ENTRY POINT
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Implements:
 * 1. Modular Request Routing & Error Handling
 * 2. Multi-Environment Staging & Development Support
 * 3. Unified Legacy Action & RESTful API Compatibility
 */

import { routeRequest } from './router.js';
import { getCorsHeaders, errorResponse } from './response.js';

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = getCorsHeaders(request);

    // 1. Handle CORS Pre-flight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      return await routeRequest(request, env, corsHeaders);
    } catch (err) {
      return errorResponse('INTERNAL_SERVER_ERROR', err.message, 500, 'error', corsHeaders);
    }
  }
};
