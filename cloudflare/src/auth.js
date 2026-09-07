/**
 * VE MANAGEMENT — Cloudflare Workers Web Crypto Authentication Layer
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 *
 * Implements PBKDF2-SHA256 password hashing & HMAC-SHA256 session token generation
 * using standard native Web Crypto API (supported natively in Cloudflare Workers).
 */

const DEFAULT_SCHOOL_ID = 'GAMERI-HSS-001';
const TOKEN_EXPIRY_SECONDS = 86400 * 7; // 7 days

/**
 * Derives a cryptographic salt.
 */
export function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes PBKDF2-SHA256 password hash.
 */
export async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign', 'verify']
  );

  const rawKey = await crypto.subtle.exportKey('raw', derivedKey);
  return Array.from(new Uint8Array(rawKey), b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies a plaintext password against a salt and hash.
 */
export async function verifyPassword(password, salt, storedHash) {
  const computedHash = await hashPassword(password, salt);
  return computedHash.toLowerCase() === storedHash.toLowerCase();
}

function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Generates an authoritative HMAC-signed session token.
 */
export async function generateSessionToken(userPayload, secretKey) {
  const enc = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = Object.assign({}, userPayload, {
    iat: now,
    exp: now + TOKEN_EXPIRY_SECONDS,
    iss: 've-management-cloudflare-worker',
    schoolId: userPayload.schoolId || DEFAULT_SCHOOL_ID
  });

  const b64Header = base64UrlEncode(JSON.stringify(header));
  const b64Payload = base64UrlEncode(JSON.stringify(claims));
  const message = `${b64Header}.${b64Payload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secretKey || 'GAMERI_HSS_DEFAULT_SESSION_SECRET_KEY_CHANGE_IN_PROD'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const b64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${message}.${b64Signature}`;
}

/**
 * Verifies and decodes an HMAC session token.
 */
export async function verifySessionToken(tokenString, secretKey) {
  if (!tokenString || typeof tokenString !== 'string') return null;
  const parts = tokenString.split('.');
  if (parts.length !== 3) return null;

  const [b64Header, b64Payload, b64Signature] = parts;
  const message = `${b64Header}.${b64Payload}`;
  const enc = new TextEncoder();

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secretKey || 'GAMERI_HSS_DEFAULT_SESSION_SECRET_KEY_CHANGE_IN_PROD'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    let sigB64 = b64Signature.replace(/-/g, '+').replace(/_/g, '/');
    while (sigB64.length % 4) sigB64 += '=';
    const sigBinary = atob(sigB64);
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(message));
    if (!isValid) return null;

    const payloadJson = base64UrlDecode(b64Payload);
    const claims = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && claims.exp < now) {
      return null; // Expired
    }

    return claims;
  } catch (err) {
    return null;
  }
}
