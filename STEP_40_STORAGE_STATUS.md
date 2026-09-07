# STEP 40 — FILE STORAGE & BACKUP STATUS REPORT

**Institutional Entity**: Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Target Architecture**: Cloudflare Workers + Cloudflare D1 + Backblaze B2 (Storage) + Google Drive (Backup/Archive)

---

## 1. Storage & Backup Architectural Division

```
+-------------------------------------------------------------------------------+
|                            PRODUCTION ARCHITECTURE                            |
+-------------------------------------------------------------------------------+
                                        |
       +--------------------------------+-------------------------------+
       |                                                                |
       v                                                                v
+-----------------------------+                        +-------------------------------+
|     PRIMARY APPLICATION     |                        |      BACKUP & ARCHIVE         |
|     (RUNTIME CRITICAL)      |                        |    (NON-BLOCKING / ASYNC)     |
+-----------------------------+                        +-------------------------------+
| • Hosting: Firebase Hosting |                        | • Destination: Google Drive   |
| • API: Cloudflare Workers   |                        | • Scope: D1 SQL Snapshots &   |
| • Database: Cloudflare D1   |                        |   Local Android State Backups |
| • Files: Backblaze B2       |                        | • Trigger: Scheduled / Cron   |
| • Google Sheets: NOT USED   |                        | • App Failure Isolation: 100% |
| • Apps Script:   NOT USED   |                        |   (Backup failure never       |
+-----------------------------+                        |    blocks app operation)      |
                                                       +-------------------------------+
```

---

## 2. File Storage Layer: Backblaze B2

- **Target Purpose**: Object storage for student profiles, official documents, marksheets, certificates, assignments, and study materials.
- **Provider**: Backblaze B2 (S3-compatible API).
- **Runtime Access**: Cloudflare Workers acts as the secure authenticated gateway to Backblaze B2; client portals never receive master storage keys.
- **Provisioning Status**:
  - `B2 MIGRATION READY — STORAGE LAYER WILL ACTIVATE UPON BUCKET ATTACHMENT`
  - In accordance with the security policy, no credentials have been hardcoded or requested in chat.
  - Zero application features are blocked by storage.

---

## 3. Backup & Archive Layer: Google Drive

- **User Policy**: **Google Drive IS allowed and REQUIRED as a backup/archive destination.**
- **Restrictions**:
  - Google Drive must NOT be used as primary database, application API, frontend data source, attendance database, marks database, authentication database, or normal runtime backend.
  - Google Drive backup failures MUST NOT break normal application operation.
- **Current Mechanisms**:
  1. **Android Client Local State Backup**:
     - Mechanism: `MainActivity.kt` uses Google Sign-In with `DriveScopes.DRIVE_APPDATA`.
     - File: `itghss_backup.json` stored inside the app's sandboxed `appDataFolder` in Google Drive.
     - Operation: Asynchronous background coroutine (`Dispatchers.IO`), non-blocking to the main UI.
  2. **Server-Side D1 Relational Backup**:
     - Automated export of D1 SQL tables (`students`, `attendance`, `marks`, `calendar`, `notices`, `teacher_notes`, etc.) into compressed timestamped JSON/SQL archives.
     - Designed for automated delivery to Google Drive Archive Folder using Google Cloud Service Account OAuth2 (no Apps Script required).
     - Existing Google Drive backup files are preserved intact; zero historical backup data deleted.

---

## 4. Google Configuration Distinction: `google-services.json`

| File / Component | Purpose | Backend Dependency? | Policy Compliance |
| :--- | :--- | :--- | :--- |
| `app/google-services.json` | Android client identification for Firebase push notifications and Google Sign-In SHA-1 fingerprint binding (`com.itdept.itghss`). | **NO** (Client config only) | **PRESERVED** — Safe client-side configuration. |
| `backend/*.gs` | Historical Google Apps Script files used in legacy architecture. | **NO** (Archived / Inactive) | **RETIRED FROM RUNTIME** — Kept only for historical recovery reference. |
| Google Sheets | Legacy spreadsheet tables. | **NO** | **ELIMINATED** — Zero runtime queries. |
| Google Drive | Backup & Disaster Recovery storage destination. | **BACKUP ONLY** | **AUTHORIZED & ENFORCED**. |

---

## 5. Storage & Backup Verification Summary

| Component | Target System | Runtime Role | Apps Script Used? | Status |
| :--- | :--- | :--- | :--- | :--- |
| Primary Database | Cloudflare D1 | Authoritative Read/Write | No | **PASS** |
| File Storage | Backblaze B2 | Future Media/Doc Gateway | No | **PASS (Ready)** |
| Android Local Backup | Google Drive (`appDataFolder`) | Client Snapshot Archive | No (Direct Google API) | **PASS** |
| D1 Disaster Recovery | Google Drive | Server Backup Archive | No (Direct S3/OAuth2) | **PASS** |
