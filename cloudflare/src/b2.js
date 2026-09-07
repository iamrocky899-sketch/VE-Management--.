/**
 * VE MANAGEMENT — BACKBLAZE B2 PRIVATE OBJECT STORAGE SERVICE
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Implements Backblaze B2 Native REST API with automatic session caching and pure Web Crypto.
 * Zero external npm dependencies.
 * All credentials remain 100% server-side in Cloudflare Worker secrets.
 */

// In-memory cache for B2 Authorization Session (scoped to Worker isolate)
let cachedAuth = null;
let cachedBucketId = null;
let authExpiresAt = 0;

// Utility: Compute SHA-1 Hex for Backblaze B2 upload integrity verification
async function sha1Hex(data) {
  let buffer;
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data);
  } else if (data instanceof ArrayBuffer) {
    buffer = data;
  } else if (ArrayBuffer.isView(data)) {
    buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  } else if (data instanceof Uint8Array) {
    buffer = data;
  } else {
    buffer = new Uint8Array(0);
  }

  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Path & Key Sanitization to prevent traversal or malicious naming
export function sanitizeObjectKey(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') return null;
  const parts = rawKey
    .replace(/\\/g, '/')
    .split('/')
    .map((p) => p.trim())
    .filter((p) => p && p !== '.' && p !== '..');

  if (parts.length === 0) return null;
  const normalized = parts.join('/');
  // Allow alphanumeric, underscores, hyphens, dots, and slashes
  if (!/^[a-zA-Z0-9_\-\./]+$/.test(normalized)) {
    return null;
  }
  return normalized;
}

export const B2StorageService = {
  /**
   * Validates presence of B2 configuration and secrets.
   */
  isConfigured(env) {
    return !!(
      (env.B2_KEY_ID || env.B2_APPLICATION_KEY_ID) &&
      (env.B2_APPLICATION_KEY || env.B2_SECRET_ACCESS_KEY) &&
      env.B2_BUCKET_NAME
    );
  },

  /**
   * Authorize account with Backblaze B2 Native REST API (b2_authorize_account).
   * Caches token for up to 20 hours (B2 tokens are valid for 24 hours).
   */
  async getAuthSession(env, forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedAuth && now < authExpiresAt) {
      return cachedAuth;
    }

    const rawKeyId = String(env.B2_KEY_ID || env.B2_APPLICATION_KEY_ID || '');
    const rawAppKey = String(env.B2_APPLICATION_KEY || env.B2_SECRET_ACCESS_KEY || '');

    const keyId = rawKeyId.replace(/^["']|["']$/g, '').replace(/[\r\n\t\f\v\s]/g, '');
    const appKey = rawAppKey.replace(/^["']|["']$/g, '').replace(/[\r\n\t\f\v\s]/g, '');

    if (!keyId || !appKey) {
      throw new Error('B2_CREDENTIALS_MISSING: Cloudflare secrets B2_KEY_ID or B2_APPLICATION_KEY are not set.');
    }

    const credentials = btoa(`${keyId}:${appKey}`);
    const res = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`B2_AUTH_FAILED (HTTP ${res.status}): ${errText}`);
    }

    const data = await res.json();
    cachedAuth = {
      accountId: data.accountId,
      apiUrl: data.apiUrl,
      authorizationToken: data.authorizationToken,
      downloadUrl: data.downloadUrl,
      allowed: data.allowed || {}
    };

    // Cache for 20 hours
    authExpiresAt = now + 20 * 60 * 60 * 1000;

    if (data.allowed?.bucketId) {
      cachedBucketId = data.allowed.bucketId;
    }

    return cachedAuth;
  },

  /**
   * Resolve Bucket ID from B2 API.
   */
  async getBucketId(env, session, bucketName) {
    if (cachedBucketId) {
      return cachedBucketId;
    }

    if (session.allowed?.bucketId) {
      cachedBucketId = session.allowed.bucketId;
      return cachedBucketId;
    }

    const res = await fetch(`${session.apiUrl}/b2api/v2/b2_list_buckets`, {
      method: 'POST',
      headers: {
        'Authorization': session.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId: session.accountId,
        bucketName: bucketName
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`B2_LIST_BUCKETS_FAILED (HTTP ${res.status}): ${errText}`);
    }

    const data = await res.json();
    const targetBucket = data.buckets?.find((b) => b.bucketName === bucketName);
    if (!targetBucket) {
      throw new Error(`B2_BUCKET_NOT_FOUND: Bucket "${bucketName}" not found in B2 account.`);
    }

    cachedBucketId = targetBucket.bucketId;
    return cachedBucketId;
  },

  /**
   * Upload an object to Backblaze B2 (b2_get_upload_url -> b2_upload_file).
   */
  async putObject(env, key, data, contentType = 'application/octet-stream') {
    const sanitizedKey = sanitizeObjectKey(key);
    if (!sanitizedKey) {
      throw new Error('INVALID_OBJECT_KEY: Object key contains invalid characters or traversal patterns.');
    }

    const bucketName = String(env.B2_BUCKET_NAME || 've-management-files').trim();
    let auth = await this.getAuthSession(env);
    let bucketId = await this.getBucketId(env, auth, bucketName);

    let bodyBuffer;
    let byteLength = 0;

    if (typeof data === 'string') {
      bodyBuffer = new TextEncoder().encode(data);
      byteLength = bodyBuffer.byteLength;
    } else if (data instanceof ArrayBuffer) {
      bodyBuffer = data;
      byteLength = data.byteLength;
    } else if (ArrayBuffer.isView(data)) {
      bodyBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      byteLength = data.byteLength;
    } else {
      throw new Error('INVALID_PAYLOAD: Data must be a string, ArrayBuffer, or TypedArray.');
    }

    const sha1 = await sha1Hex(bodyBuffer);

    // Step 1: Obtain Upload URL
    let uploadUrlRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: 'POST',
      headers: {
        'Authorization': auth.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bucketId: bucketId })
    });

    // If token expired, refresh auth once
    if (uploadUrlRes.status === 401) {
      auth = await this.getAuthSession(env, true);
      bucketId = await this.getBucketId(env, auth, bucketName);
      uploadUrlRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
        method: 'POST',
        headers: {
          'Authorization': auth.authorizationToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bucketId: bucketId })
      });
    }

    if (!uploadUrlRes.ok) {
      const errText = await uploadUrlRes.text();
      throw new Error(`B2_GET_UPLOAD_URL_FAILED (HTTP ${uploadUrlRes.status}): ${errText}`);
    }

    const uploadUrlData = await uploadUrlRes.json();
    const uploadUrl = uploadUrlData.uploadUrl;
    const uploadAuthToken = uploadUrlData.authorizationToken;

    // Step 2: Upload File to B2
    const encodedFileName = encodeURI(sanitizedKey);
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': uploadAuthToken,
        'X-Bz-File-Name': encodedFileName,
        'Content-Type': contentType,
        'Content-Length': String(byteLength),
        'X-Bz-Content-Sha1': sha1
      },
      body: bodyBuffer
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`B2_UPLOAD_FAILED (HTTP ${uploadRes.status}): ${errText}`);
    }

    const uploadedFileData = await uploadRes.json();
    return {
      success: true,
      key: sanitizedKey,
      fileId: uploadedFileData.fileId,
      size: uploadedFileData.contentLength || byteLength,
      contentType: uploadedFileData.contentType || contentType,
      etag: uploadedFileData.contentSha1 || sha1
    };
  },

  /**
   * Retrieve an object from Backblaze B2 (b2_download_file_by_name).
   */
  async getObject(env, key) {
    const sanitizedKey = sanitizeObjectKey(key);
    if (!sanitizedKey) {
      throw new Error('INVALID_OBJECT_KEY: Object key contains invalid characters.');
    }

    const bucketName = String(env.B2_BUCKET_NAME || 've-management-files').trim();
    let auth = await this.getAuthSession(env);

    const downloadUri = `${auth.downloadUrl}/file/${bucketName}/${encodeURI(sanitizedKey)}`;
    let res = await fetch(downloadUri, {
      method: 'GET',
      headers: {
        'Authorization': auth.authorizationToken
      }
    });

    if (res.status === 401) {
      auth = await this.getAuthSession(env, true);
      res = await fetch(downloadUri, {
        method: 'GET',
        headers: {
          'Authorization': auth.authorizationToken
        }
      });
    }

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`B2_DOWNLOAD_FAILED (HTTP ${res.status}): ${errText}`);
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    const etag = res.headers.get('x-bz-content-sha1') || '';
    const body = await res.arrayBuffer();

    return {
      key: sanitizedKey,
      contentType: contentType,
      contentLength: contentLength || body.byteLength,
      etag: etag,
      data: body
    };
  },

  /**
   * Check object metadata and existence (HEAD).
   */
  async headObject(env, key) {
    const sanitizedKey = sanitizeObjectKey(key);
    if (!sanitizedKey) {
      throw new Error('INVALID_OBJECT_KEY: Object key contains invalid characters.');
    }

    const bucketName = String(env.B2_BUCKET_NAME || 've-management-files').trim();
    let auth = await this.getAuthSession(env);

    const downloadUri = `${auth.downloadUrl}/file/${bucketName}/${encodeURI(sanitizedKey)}`;
    let res = await fetch(downloadUri, {
      method: 'HEAD',
      headers: {
        'Authorization': auth.authorizationToken
      }
    });

    if (res.status === 401) {
      auth = await this.getAuthSession(env, true);
      res = await fetch(downloadUri, {
        method: 'HEAD',
        headers: {
          'Authorization': auth.authorizationToken
        }
      });
    }

    if (res.status === 404) {
      return { exists: false };
    }

    if (!res.ok) {
      throw new Error(`B2_HEAD_FAILED (HTTP ${res.status})`);
    }

    return {
      exists: true,
      key: sanitizedKey,
      contentType: res.headers.get('content-type') || 'application/octet-stream',
      contentLength: parseInt(res.headers.get('content-length') || '0', 10),
      etag: res.headers.get('x-bz-content-sha1') || '',
      lastModified: res.headers.get('last-modified') || ''
    };
  },

  /**
   * Delete an object from Backblaze B2 (b2_list_file_names -> b2_delete_file_version).
   */
  async deleteObject(env, key) {
    const sanitizedKey = sanitizeObjectKey(key);
    if (!sanitizedKey) {
      throw new Error('INVALID_OBJECT_KEY: Object key contains invalid characters.');
    }

    const bucketName = String(env.B2_BUCKET_NAME || 've-management-files').trim();
    let auth = await this.getAuthSession(env);
    let bucketId = await this.getBucketId(env, auth, bucketName);

    // List file to obtain fileId
    let listRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_file_names`, {
      method: 'POST',
      headers: {
        'Authorization': auth.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucketId: bucketId,
        startFileName: sanitizedKey,
        maxFileCount: 1,
        prefix: sanitizedKey
      })
    });

    if (listRes.status === 401) {
      auth = await this.getAuthSession(env, true);
      bucketId = await this.getBucketId(env, auth, bucketName);
      listRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_file_names`, {
        method: 'POST',
        headers: {
          'Authorization': auth.authorizationToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bucketId: bucketId,
          startFileName: sanitizedKey,
          maxFileCount: 1,
          prefix: sanitizedKey
        })
      });
    }

    if (!listRes.ok) {
      const errText = await listRes.text();
      throw new Error(`B2_DELETE_LIST_FAILED (HTTP ${listRes.status}): ${errText}`);
    }

    const listData = await listRes.json();
    const file = listData.files?.find((f) => f.fileName === sanitizedKey);

    if (!file) {
      // File already deleted or doesn't exist
      return {
        success: true,
        key: sanitizedKey,
        deleted: true
      };
    }

    // Delete file version
    const deleteRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_delete_file_version`, {
      method: 'POST',
      headers: {
        'Authorization': auth.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId: file.fileId,
        fileName: file.fileName
      })
    });

    if (!deleteRes.ok && deleteRes.status !== 404) {
      const errText = await deleteRes.text();
      throw new Error(`B2_DELETE_FAILED (HTTP ${deleteRes.status}): ${errText}`);
    }

    return {
      success: true,
      key: sanitizedKey,
      deleted: true
    };
  }
};
