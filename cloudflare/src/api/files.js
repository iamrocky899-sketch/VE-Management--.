/**
 * VE MANAGEMENT — SECURE FILE STORAGE & BACKBLAZE B2 API HANDLERS
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * All B2 interactions are server-side mediated and RBAC authorized.
 * Zero credentials are sent to clients.
 */

import { successResponse, errorResponse } from '../response.js';
import { Security } from '../security.js';
import { B2StorageService, sanitizeObjectKey } from '../b2.js';

// Convert Uint8Array/ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 string to Uint8Array
function base64ToUint8Array(base64String) {
  // Strip any data URL prefixes (e.g. data:application/pdf;base64,...)
  const cleanBase64 = base64String.replace(/^data:[^;]+;base64,/, '');
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const FilesApi = {
  /**
   * Evaluates role-based permission to access an object key.
   */
  async verifyObjectAccess(env, session, objectKey, isWrite = false) {
    if (!session || !session.role) return false;
    const role = session.role.toUpperCase();

    // Admins and Principals have unrestricted read/write within the school tenant
    if (Security.isAdminOrPrincipal(session)) {
      return true;
    }

    const sanitized = sanitizeObjectKey(objectKey);
    if (!sanitized) return false;

    // Direct test namespace support
    if (sanitized.startsWith('ve-management-test/') || sanitized.includes('/test/')) {
      return role === 'TEACHER' || role === 'ADMIN' || role === 'PRINCIPAL';
    }

    const parts = sanitized.split('/');
    const schoolId = parts[0];
    const category = parts[1] || '';
    const subId = parts[2] || '';

    // Enforce multi-tenant boundary
    const expectedSchoolId = env.SCHOOL_ID || 'GAMERI-HSS-001';
    if (schoolId !== expectedSchoolId) {
      return false;
    }

    // Write permissions: only Teachers and Admins can create/delete official files
    if (isWrite) {
      if (role !== 'TEACHER' && role !== 'ADMIN' && role !== 'PRINCIPAL') {
        return false;
      }
      return true;
    }

    // Read permissions
    switch (category) {
      case 'documents':
      case 'certificates':
        // subId is studentId
        return await Security.canAccessStudent(env.DB, session, subId);

      case 'profiles':
        // subId is userId or studentId
        return await Security.canAccessStudent(env.DB, session, subId) || session.userId === subId;

      case 'notes':
      case 'assignments':
      case 'materials':
      case 'notices':
        // Public academic materials accessible to all authenticated school members
        return true;

      default:
        return false;
    }
  },

  /**
   * Upload file to Backblaze B2 (POST / action: 'file_upload').
   */
  async uploadFile(env, session, payload, corsHeaders) {
    if (!B2StorageService.isConfigured(env)) {
      return errorResponse('STORAGE_NOT_CONFIGURED', 'Backblaze B2 private storage is not configured on this environment.', 503, 'file_upload', corsHeaders);
    }

    const category = payload.category || 'documents';
    const subId = payload.subId || session.userId || 'general';
    const fileName = payload.fileName || `file_${Date.now()}`;
    const contentType = payload.contentType || 'application/octet-stream';
    const rawData = payload.fileData || payload.data;

    if (!rawData) {
      return errorResponse('BAD_REQUEST', 'Missing fileData payload (Base64 string required)', 400, 'file_upload', corsHeaders);
    }

    const schoolId = env.SCHOOL_ID || 'GAMERI-HSS-001';
    let targetKey = payload.key || payload.fileKey;

    if (!targetKey) {
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      targetKey = `${schoolId}/${category}/${subId}/${Date.now()}_${cleanFileName}`;
    }

    // Authorize write access
    const canWrite = await this.verifyObjectAccess(env, session, targetKey, true);
    if (!canWrite) {
      return errorResponse('UNAUTHORIZED', 'Access denied to upload file to target destination', 403, 'file_upload', corsHeaders);
    }

    let binaryData;
    try {
      if (typeof rawData === 'string') {
        binaryData = base64ToUint8Array(rawData);
      } else {
        binaryData = rawData;
      }
    } catch (e) {
      return errorResponse('BAD_REQUEST', `Malformed file data: ${e.message}`, 400, 'file_upload', corsHeaders);
    }

    // Size constraint: Max 10MB per object
    if (binaryData.byteLength > 10 * 1024 * 1024) {
      return errorResponse('PAYLOAD_TOO_LARGE', 'File exceeds maximum allowed size of 10MB', 413, 'file_upload', corsHeaders);
    }

    try {
      const result = await B2StorageService.putObject(env, targetKey, binaryData, contentType);
      return successResponse({
        fileKey: result.key,
        size: result.size,
        contentType: result.contentType,
        etag: result.etag,
        downloadUrl: `/api/v1/files/download?key=${encodeURIComponent(result.key)}`
      }, 'file_upload', 200, corsHeaders);
    } catch (err) {
      return errorResponse('STORAGE_ERROR', `Storage upload failed: ${err.message}`, 500, 'file_upload', corsHeaders);
    }
  },

  /**
   * Download / Stream file from Backblaze B2 (POST / action: 'file_download' or GET).
   */
  async downloadFile(env, session, payload, corsHeaders, isRawStream = false) {
    if (!B2StorageService.isConfigured(env)) {
      return errorResponse('STORAGE_NOT_CONFIGURED', 'Backblaze B2 private storage is not configured on this environment.', 503, 'file_download', corsHeaders);
    }

    const key = payload.key || payload.fileKey;
    if (!key) {
      return errorResponse('BAD_REQUEST', 'Missing file key parameter', 400, 'file_download', corsHeaders);
    }

    const canRead = await this.verifyObjectAccess(env, session, key, false);
    if (!canRead) {
      return errorResponse('UNAUTHORIZED', 'Access denied to requested file', 403, 'file_download', corsHeaders);
    }

    try {
      const object = await B2StorageService.getObject(env, key);
      if (!object) {
        return errorResponse('NOT_FOUND', 'Requested file not found in storage', 404, 'file_download', corsHeaders);
      }

      if (isRawStream) {
        const fileName = key.split('/').pop() || 'download';
        const headers = new Headers({
          'Content-Type': object.contentType,
          'Content-Length': String(object.contentLength),
          'Content-Disposition': `inline; filename="${fileName}"`,
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'private, max-age=3600'
        });
        Object.entries(corsHeaders || {}).forEach(([k, v]) => headers.set(k, v));

        return new Response(object.data, {
          status: 200,
          headers: headers
        });
      }

      // JSON Action Envelope with base64 data
      const base64Data = arrayBufferToBase64(object.data);
      return successResponse({
        fileKey: object.key,
        contentType: object.contentType,
        contentLength: object.contentLength,
        etag: object.etag,
        fileData: base64Data
      }, 'file_download', 200, corsHeaders);
    } catch (err) {
      return errorResponse('STORAGE_ERROR', `Storage download failed: ${err.message}`, 500, 'file_download', corsHeaders);
    }
  },

  /**
   * Check file existence & metadata (action: 'file_head').
   */
  async headFile(env, session, payload, corsHeaders) {
    if (!B2StorageService.isConfigured(env)) {
      return errorResponse('STORAGE_NOT_CONFIGURED', 'Backblaze B2 private storage is not configured on this environment.', 503, 'file_head', corsHeaders);
    }

    const key = payload.key || payload.fileKey;
    if (!key) {
      return errorResponse('BAD_REQUEST', 'Missing file key parameter', 400, 'file_head', corsHeaders);
    }

    const canRead = await this.verifyObjectAccess(env, session, key, false);
    if (!canRead) {
      return errorResponse('UNAUTHORIZED', 'Access denied to requested file', 403, 'file_head', corsHeaders);
    }

    try {
      const meta = await B2StorageService.headObject(env, key);
      return successResponse({ metadata: meta }, 'file_head', 200, corsHeaders);
    } catch (err) {
      return errorResponse('STORAGE_ERROR', `Storage metadata check failed: ${err.message}`, 500, 'file_head', corsHeaders);
    }
  },

  /**
   * Delete file from Backblaze B2 (action: 'file_delete').
   */
  async deleteFile(env, session, payload, corsHeaders) {
    if (!B2StorageService.isConfigured(env)) {
      return errorResponse('STORAGE_NOT_CONFIGURED', 'Backblaze B2 private storage is not configured on this environment.', 503, 'file_delete', corsHeaders);
    }

    const key = payload.key || payload.fileKey;
    if (!key) {
      return errorResponse('BAD_REQUEST', 'Missing file key parameter', 400, 'file_delete', corsHeaders);
    }

    const canDelete = await this.verifyObjectAccess(env, session, key, true);
    if (!canDelete) {
      return errorResponse('UNAUTHORIZED', 'Administrative or Teacher privilege required to delete storage objects', 403, 'file_delete', corsHeaders);
    }

    try {
      const result = await B2StorageService.deleteObject(env, key);
      return successResponse({ deleted: true, fileKey: result.key }, 'file_delete', 200, corsHeaders);
    } catch (err) {
      return errorResponse('STORAGE_ERROR', `Storage delete failed: ${err.message}`, 500, 'file_delete', corsHeaders);
    }
  }
};
