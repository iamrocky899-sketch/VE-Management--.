# STEP 33 — ANDROID SECURITY AUDIT & CREDENTIAL GOVERNANCE REPORT
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Package:** `com.itdept.itghss`  
**Date:** September 4, 2026  
**Status:** **SECURITY AUDIT COMPLETED — NO SECRETS EXPOSED; ROTATION DEFERRED**

---

## 1. Executive Summary

As mandated by Step 33 safety guidelines, an exhaustive security scan was performed across the entire Android project directory (`app/src/` and configuration files). 

**Key Safety Guarantees Met:**
1. **Zero Exposure:** The historical `ADMIN_API_KEY` was **never printed, exposed, or logged**.
2. **Zero In-Flight Rotation:** The `ADMIN_API_KEY` was **not rotated** in Step 33, preserving compatibility with all field devices.
3. **No New Leakages:** Zero private keys, Google service account credentials, Backblaze B2 application keys, or Cloudflare API tokens exist within the Android application.

---

## 2. Forensic Analysis of `itd3_admin_sync_key`

A systematic trace of the static administrative synchronization key was performed across the Android client:

### A. Storage Location
- **Key Identifier:** `itd3_admin_sync_key`
- **Location:** HTML5 `localStorage` in the WebView sandbox (`localStorage.getItem('itd3_admin_sync_key')` and `localStorage.setItem('itd3_admin_sync_key', ...)`).
- **Fallback Location:** In-memory code constant in `app/src/main/assets/libs/sync_manager.js` line 15 (`DEFAULT_ADMIN_KEY`).

### B. Access & Read Flow
- Exposed through `window.SyncManager.getAdminKey()`, which resolves:
  1. `localStorage.getItem('itd3_admin_sync_key')`
  2. If empty or absent, falls back to `DEFAULT_ADMIN_KEY`.
- In `index.html`, read by:
  - `loadSchoolCloudSetup()` (line 3275): populates the Admin Key configuration input in the Cloud Setup modal.
  - `saveSchoolCloudSetup()` (line 3305): persists manual overrides into `localStorage`.
  - `getAdminApiParams()` (line 3833): retrieves the key for administrative HTTP requests.

### C. Features Dependent on the Key
1. **Background Unauthenticated Sync:** `SyncManager.uploadPendingQueue` and `SyncManager.downloadCloudDeltas` attach `apiKey` when no staff session token (`itd3_staff_session`) is available.
2. **Staff Account Administration:** `loadStaffList`, `submitStaffAccountForm`, `handleEditStaff`, `toggleStaffStatus`, and `handleResetPassword` in `index.html` append `apiKey` to request payloads.
3. **Emergency Data Operations:** `reset_parent_portal_data` requires admin verification.

### D. Installed-Client Dependency
- **Existing Installed Devices:** Older Android versions installed on staff phones rely directly on `itd3_admin_sync_key` to authenticate background sync requests against the Google Apps Script backend.
- **Critical Risk:** If `ADMIN_API_KEY` is rotated or removed prematurely, all existing installed Android devices will immediately fail synchronization with Google Apps Script.

### E. Cloudflare Compatibility
- **Current Behavior:** The canonical Cloudflare Worker **does not accept** static `itd3_admin_sync_key` for authentication.
- Cloudflare strictly enforces Web Crypto HMAC-SHA256 session tokens (`Authorization: Bearer <JWT>`), issued through `action: 'auth_login'`.
- Sending `apiKey` without a valid session token results in HTTP 401 `UNAUTHORIZED: Authentication token required`.

---

## 3. Security Findings Table

| Item | File | Line Number | Secret Type | Redacted Audit Snippet | Security Risk Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `app/src/main/assets/libs/sync_manager.js` | 15 | `ADMIN_API_KEY` (Static Fallback Key) | `const DEFAULT_ADMIN_KEY = '[REDACTED]';` | Medium (Static credential embedded in asset bundle; required by legacy Apps Script) |
| **2** | `app/google-services.json` | 47 | `FIREBASE_CLIENT_API_KEY` | `"current_key": "[REDACTED_FIREBASE_CLIENT_API_KEY]"` | Low (Standard public client-side OAuth identifier for Android Google Play Services) |

### Negative Findings (Verified Absent):
- Private keys (`.pem`, `.key`, `BEGIN PRIVATE KEY`): **NONE**
- Google Service Account Credentials (`client_secret`, `private_key_id`): **NONE**
- Backblaze B2 Application Keys (`applicationKey`, `b2_key`): **NONE**
- Cloudflare API Tokens (`CF_TOKEN`, `CLOUDFLARE_API_KEY`): **NONE**
- Plaintext Passwords / Database URIs: **NONE**

---

## 4. Phased Credential Removal & Security Migration Plan

To safely eliminate static administrative credentials from the Android app without disrupting existing installed clients:

```
[ PHASE A: CURRENT PREPARATION (STEP 33) ]
- Preserve ADMIN_API_KEY intact in Apps Script backend.
- Maintain DEFAULT_ADMIN_KEY fallback in Android assets.
- Validate that all interactive logins generate dynamic HMAC JWTs.

                   │
                   ▼
[ PHASE B: BACKEND WORKER PROVISIONING (STEP 34) ]
- Implement secure admin authentication in Cloudflare Worker.
- Add worker-side rate limiting and session exchange endpoints.
- Maintain legacy Apps Script key for old clients.

                   │
                   ▼
[ PHASE C: ANDROID CLIENT REFACTOR (STEP 35) ]
- Require staff login before initiating any sync operations.
- Remove DEFAULT_ADMIN_KEY and itd3_admin_sync_key from assets.
- Eliminate apiKey parameter; transmit only dynamic JWT tokens.
- Bump Android versionCode to 7 (versionName: "6.0").

                   │
                   ▼
[ PHASE D: FIELD ADOPTION & RETIREMENT (STEP 36) ]
- Verify all school devices have updated to versionCode 7.
- Monitor Apps Script logs until legacy sync traffic ceases.
- Rotate and retire the legacy ADMIN_API_KEY on Apps Script.
```

---

## 5. Security Recommendations
1. **Never Rotate Key in Pre-Production:** Keep the existing Apps Script `ADMIN_API_KEY` untouched until all active devices have transitioned.
2. **Transition to Dynamic Sessions:** All administrative functions must exclusively use short-lived HMAC session tokens signed by `SESSION_SECRET` on Cloudflare.
3. **Preserve Proguard Minification:** When building release APKs, ensure code obfuscation is enabled to prevent reverse-engineering of asset endpoints.
