# STEP 33 — ANDROID MIGRATION MANUAL ACTIONS & PRE-PILOT RUNBOOK
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Scope:** Pre-Migration Checklist & Action Items for Systems Administrator  
**Date:** September 4, 2026  
**Status:** **AWAITING HUMAN ACTION PRIOR TO STEP 34**

---

## 1. Mandatory Pre-Conditions (DO NOT PROCEED AUTOMATICALLY)

> [!CAUTION]
> **ABSOLUTE FREEZE RULES IN FORCE:**
> - DO NOT distribute or install any APK on staff or teacher devices.
> - DO NOT rotate `ADMIN_API_KEY` in Google Apps Script or Cloudflare.
> - DO NOT disable Google Apps Script or Google Sheets.
> - DO NOT truncate Cloudflare D1 or modify live attendance data.
> - DO NOT migrate production files to Backblaze B2.

---

## 2. Outstanding Manual Action Items

### Action 1: Worker API Router Enhancement (Required for Offline Sync)
- **Problem:** When Android's `SyncManager.js` triggers auto-sync, it sends `{ action: 'sync_upload', ... }` and `{ action: 'sync_download', ... }`. The Cloudflare Worker currently responds with HTTP 404 `INVALID_ACTION`.
- **Action Required:**
  1. Add `sync_upload` and `sync_download` handlers to `cloudflare/src/router.js` and `cloudflare/src/api/sync.js`.
  2. Map incoming batch attendance and marks payloads to execute against Cloudflare D1 tables (`attendance`, `attendance_sessions`, `marks`).
  3. Deploy the updated worker script using `npx wrangler deploy --config cloudflare/wrangler.toml`.
  4. Retest offline sync using `scratch/test_step33_android_migration.js`.

### Action 2: Staff Management Endpoint Implementation
- **Problem:** Android Admin UI calls `get_staff_list`, `register_staff`, `update_staff`, `set_staff_status`, and `auth_reset_user_password`. These are currently unrouted in Cloudflare.
- **Action Required:**
  1. Implement staff management handlers in `cloudflare/src/api/staff.js`.
  2. Ensure only users with `role: 'ADMIN'` or `role: 'PRINCIPAL'` can execute these write operations.

### Action 3: Controlled Single-Device Test Lab Verification
- **Prerequisite:** Actions 1 & 2 completed.
- **Test Procedure:**
  1. Connect a dedicated offline test Android device (NOT a staff production phone) via USB.
  2. Execute: `adb install -r app/build/outputs/apk/debug/app-debug.apk`.
  3. Launch application and log in as Teacher (`9101004032` / `12345`).
  4. Turn off Wi-Fi and mobile data (airplane mode).
  5. Mark attendance for Class 9 GP. Verify attendance is enqueued in local storage (`⏳ 1 Pending`).
  6. Re-enable Wi-Fi. Verify `SyncManager` flushes queue and UI changes to `✓ Synced`.
  7. Query Cloudflare D1 to confirm attendance session was written to `ve-management-db-prod`.

### Action 4: Google Play Protect & Signing Keystore Governance
- **Action Required:**
  - Verify that the school's official signing keystore is backed up in offline encrypted storage.
  - Do NOT sign production releases until end-to-end sync verification on Cloudflare is complete.

---

## 3. Rollback Runbook (If Reversion Needed)

If an Android client experiences synchronization anomalies:
1. Open the Android App -> Click Settings / Cloud Setup.
2. Under "Cloud Backend API URL", enter the standby Apps Script Web App URL:
   `https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec`
3. Click "Save Configuration".
4. The client immediately reverts to syncing with Google Sheets and Google Apps Script without requiring an APK reinstallation.
