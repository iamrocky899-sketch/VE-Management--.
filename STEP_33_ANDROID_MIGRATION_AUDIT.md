# STEP 33 — ANDROID PRODUCTION MIGRATION AUDIT REPORT
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Package:** `com.itdept.itghss`  
**Path:** `C:\Users\HP\Downloads\ITGHSS2`  
**Date:** September 4, 2026  
**Status:** **AUDIT COMPLETED — NO-GO / BLOCKED ON OFFLINE BATCH SYNC & ADMIN API ENDPOINTS**

---

## 1. Executive Summary

As part of **STEP 33**, a comprehensive forensic audit was conducted on the Android codebase (`com.itdept.itghss`), inspecting assets, native Java/Kotlin components, WebView bridge interfaces, synchronization architecture, authentication flows, offline queueing, attendance calculations, security dependencies, and release compilation.

### Key Finding:
While direct REST and read-only endpoints (authentication, student rosters, marks, curriculum notes, notices, documents, and individual attendance calculation) are operational on the canonical Cloudflare Worker (`https://ve-management-api.iamrocky899.workers.dev`), **the Android hybrid offline sync engine (`SyncManager.js`) and Admin staff management actions are NOT implemented in the Cloudflare Worker API router.** 
- Invoking `action: 'sync_upload'` returns HTTP 404 `INVALID_ACTION: Unrecognized or unrouted API action: sync_upload`.
- Invoking `action: 'sync_download'` returns HTTP 404 `INVALID_ACTION: Unrecognized or unrouted API action: sync_download`.
- Invoking `action: 'get_staff_list'` returns HTTP 404 `INVALID_ACTION: Unrecognized or unrouted API action: get_staff_list`.

Because the Android client relies on `sync_upload` to flush pending attendance and student edits from its local queue, cutting over Android devices completely to the Worker would cause silent sync failures and trap attendance in local storage.

---

## 2. Android Endpoint Inventory

A complete static and dynamic scan of all network request targets in the Android application was conducted:

| Location / File | Line Number | Configured URL / Target | Nature of Traffic | Backend Type | Status / Compatibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `app/src/main/assets/libs/sync_manager.js` | 10 | `https://ve-management-api.iamrocky899.workers.dev` | Default API URL for SyncManager | Cloudflare Worker | Configured; routes fail on `sync_upload` / `sync_download` |
| `app/src/main/assets/index.html` | 3353 | `SyncManager.getApiUrl()` fallback | Ping Health Check | Cloudflare Worker | Compatible (`HTTP 200 ONLINE`) |
| `app/src/main/assets/index.html` | 3373 | `SyncManager.getApiUrl()` fallback | Admin Dashboard Summary | Cloudflare Worker | **BLOCKED** (`action: get_admin_summary` unrouted) |
| `app/src/main/assets/index.html` | 3553 | `SyncManager.getApiUrl()` fallback | Staff Login (`auth_login`) | Cloudflare Worker | Compatible (`HTTP 200 Token Issued`) |
| `app/src/main/assets/index.html` | 3782 | `SyncManager.getApiUrl()` fallback | Change Password (`auth_change_password`) | Cloudflare Worker | **BLOCKED** (`action: auth_change_password` unrouted) |
| `app/src/main/assets/index.html` | 3834 | `SyncManager.getApiUrl()` fallback | Admin API Base URL | Cloudflare Worker | Configured |
| `app/src/main/assets/index.html` | 3861 | `SyncManager.getApiUrl()` fallback | Get Staff List (`get_staff_list`) | Cloudflare Worker | **BLOCKED** (`action: get_staff_list` unrouted) |
| `app/src/main/assets/index.html` | 4093 | `SyncManager.getApiUrl()` fallback | Register Staff (`register_staff`) | Cloudflare Worker | **BLOCKED** (`action: register_staff` unrouted) |
| `app/src/main/assets/index.html` | 4201 | `SyncManager.getApiUrl()` fallback | Update Staff (`update_staff`) | Cloudflare Worker | **BLOCKED** (`action: update_staff` unrouted) |
| `app/src/main/assets/index.html` | 4279 | `SyncManager.getApiUrl()` fallback | Set Staff Status (`set_staff_status`) | Cloudflare Worker | **BLOCKED** (`action: set_staff_status` unrouted) |
| `app/src/main/assets/index.html` | 4345 | `SyncManager.getApiUrl()` fallback | Reset Staff Password (`auth_reset_user_password`) | Cloudflare Worker | **BLOCKED** (`action: auth_reset_user_password` unrouted) |
| `app/src/main/assets/index.html` | 9041 | `SyncManager.getApiUrl()` fallback | Reset Parent Data (`reset_parent_portal_data`) | Cloudflare Worker | **BLOCKED** (`action: reset_parent_portal_data` unrouted) |
| `app/src/main/assets/index.html` | 9616 | `./models/tiny_face_detector_model-weights_manifest.json` | Local Face Recognition Weights | Local Asset / WebView | Compatible (Local offline asset) |
| `app/src/main/java/.../MainActivity.kt` | 213 | Google Drive AppData Scope (`DRIVE_APPDATA`) | Google Drive AppData backup (`itghss_backup.json`) | Google Drive API | Compatible (Native Google Sign-In) |
| `app/src/main/java/.../MainActivity.kt` | 213 | Google Calendar Scope (`CALENDAR_READONLY`) | Indian Public Holidays Calendar | Google Calendar API | Compatible (Native Google Sign-In) |
| `app/src/main/java/.../MainActivity.kt` | 371 | `https://appassets.androidplatform.net/assets/index.html` | Local WebView Loading | AndroidX WebKit | Compatible (Secure local asset loader) |

### Legacy Apps Script Dependency Scan:
- **`app/src/main/assets/index.html`:** **0** occurrences of `script.google.com`.
- **`app/src/main/assets/libs/sync_manager.js`:** **0** occurrences of `script.google.com`.
- **`app/src/main/java/`:** **0** occurrences of `script.google.com`.
- **Conclusion:** There are no hardcoded Google Apps Script URLs in the current Android application assets. However, because Cloudflare Worker does not support `sync_upload`, the app currently has no functioning cloud synchronization endpoint for its offline queue.

---

## 3. Native Android Architecture & Bridge Audit

### Native Components (`app/src/main/java/com/itdept/itghss/`):
1. **`MainActivity.kt`:**
   - Implements `WebViewAssetLoader` for secure loading (`https://appassets.androidplatform.net/assets/index.html`) without file-scheme vulnerabilities (`allowFileAccess = false`, `allowFileAccessFromFileURLs = false`).
   - Hosts `WebAppInterface` exposed to JS as `window.Android`.
   - Manages Google Sign-In (`googleSignInClient`, `googleSignInLauncher`), Google Drive AppData file backup (`syncToDrive`, `requestSyncFromDrive`), and Google Calendar holiday sync (`fetchHolidays`).
   - Handles file downloads and exports (`saveFile`, `saveDecodedFileData`, `saveBase64ToDownloads`).
   - Manages Android runtime permissions (`CAMERA_PERMISSION_CODE`, `NOTIFICATION_PERMISSION_CODE`).
   - Manages network connectivity lifecycle via `ConnectivityManager.NetworkCallback`.
2. **`SchoolCloudConfigManager.kt`:**
   - SharedPreferences store (`ve_school_cloud_config`) storing:
     - `school_id` (`GAMERI-HSS-001`)
     - `school_name` (`Gameri Higher Secondary School, Gamiri`)
     - `school_district` (`Biswanath District, Assam`)
     - `bound_account_email`
     - `connection_status` (`CONNECTED` / `DISCONNECTED`)
   - Enforces school ownership binding so arbitrary Google accounts on the device cannot hijack school configuration.
3. **`AttendanceReminderScheduler.kt` & `AttendanceReminderReceiver.kt`:**
   - Native AlarmManager schedules smart attendance reminders matching school timetable periods.
   - Survives device reboots via `BootCompletedReceiver.kt`.
   - Persists state in `attendance_reminder_prefs`.

### Native Bridge Methods (`window.Android`):
All native bridge methods remain completely functional and decoupled from the backend API:
- `Android.getAppVersion()`: Returns `5.7`.
- `Android.showAttendanceNotification(...)`: Generates native Android heads-up notification.
- `Android.cancelAttendanceNotification(...)`: Cancels scheduled notifications.
- `Android.syncNativeState(...)`: Updates native timetable and attendance state.
- `Android.saveFile(base64, filename, mime)`: Saves exported PDF and Excel rosters to device Downloads folder.
- `Android.loginWithGoogle()`: Launches official Google OAuth consent flow.
- `Android.logoutFromGoogle()`: Disconnects Google account.
- `Android.getSchoolCloudConfig()`: Reads school identity JSON.
- `Android.saveSchoolDetails(...)`: Updates school identity.
- `Android.completeFirstTimeSetup(...)`: Marks setup completed.
- `Android.disconnectSchoolAccount()`: Unbinds school Google account.
- `Android.confirmSwitchSchoolAccount(...)`: Switches bound Google account.
- `Android.fetchHolidays(year)`: Queries Google Calendar API.
- `Android.syncToDrive(jsonData)`: Backs up full app data to Google Drive AppData folder.
- `Android.requestSyncFromDrive()`: Pulls backup data from Google Drive AppData folder.

---

## 4. Offline Queue & Sync Architecture Audit

### Storage & Protocol (`sync_manager.js`):
- **Local Queue Storage:** `localStorage.getItem('itd3_sync_queue')`
- **Item Schema:**
  ```javascript
  {
    syncId: "SYNC_1772643600000_abcd",
    entity: "Attendance" | "Students" | "Marks" | "TeacherNotes" | "Activities" | "Notices",
    entityId: "string",
    operation: "UPSERT" | "DELETE",
    payload: { ... },
    createdAt: "2026-09-04T...",
    attemptCount: 0,
    status: "PENDING" | "SYNCING" | "FAILED",
    errorCode: null,
    errorMessage: null
  }
  ```
- **Biometric Exclusion Invariant:** Face descriptors (`Faces`, `itd3_f`) are explicitly rejected from enqueueing (Line 150-152) and remain strictly device-local.
- **Deduplication & Coalescing:** Consecutive edits to the same `entity` and `entityId` overwrite the existing pending item, preventing redundant uploads.
- **Backoff & Retry Policy:** Exponential backoff with `MAX_RETRY_ATTEMPTS = 5`, `BASE_BACKOFF_MS = 2000`, `MAX_BACKOFF_MS = 60000`.

### Sync Failure Root Cause:
`SyncManager.uploadPendingQueue` compiles batches and sends:
```json
{
  "action": "sync_upload",
  "token": "...",
  "schoolId": "GAMERI-HSS-001",
  "clientSyncTimestamp": "...",
  "students": [],
  "attendance": {},
  "marks": {},
  "notes": [],
  "activities": [],
  "notices": []
}
```
Because the Cloudflare Worker API router does not recognize `sync_upload`, this call returns:
```json
{
  "success": false,
  "action": "sync_upload",
  "error": {
    "code": "INVALID_ACTION",
    "message": "Unrecognized or unrouted API action: sync_upload"
  }
}
```
As a result:
1. Pending items are marked `FAILED` with message `Unrecognized or unrouted API action: sync_upload`.
2. The UI displays `⚠️ Sync Error`.
3. Offline changes are never synchronized to Cloudflare D1.

---

## 5. Summary of Audit Findings

1. **Native Compilation & Bridge:** PASS (Debug APK compiles cleanly; all Android interfaces intact).
2. **Canonical Worker Endpoint:** PASS (Worker API configured; authentication and reads functioning).
3. **Authentication Parity:** PASS (Web Crypto HMAC tokens issued for TEACHER, PRINCIPAL, ADMIN, PARENT, STUDENT).
4. **Attendance Calculation Parity:** PASS (102 students match authoritative formula: `present / conducted * 100`).
5. **Offline Queue Mechanism:** PASS locally, but **BLOCKED on network upload** due to missing `sync_upload` / `sync_download` actions in Cloudflare Worker.
6. **Admin Operations:** **BLOCKED** on Cloudflare Worker (`get_staff_list`, `register_staff`, etc.).
7. **Verdict:** **NO-GO — ANDROID MIGRATION BLOCKED** until Worker API adds `sync_upload`/`sync_download` or direct REST sync handlers.
