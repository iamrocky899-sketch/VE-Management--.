# VE MANAGEMENT — DISASTER RECOVERY PLAN (STEP 14)
**Institutional Entity:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Document Version:** 2.0  
**Effective Date:** Academic Session 2026–2027  

---

## 1. Disaster Recovery Objectives

| Metric | Target | Status | Notes |
| :--- | :---: | :---: | :--- |
| **Recovery Point Objective (RPO)** | $\le 24$ Hours | `CONFIGURED — NOT LIVE` | Daily automated snapshot + on-demand administrative backups. |
| **Recovery Time Objective (RTO)** | $\le 2$ Hours | `CONFIGURED — NOT LIVE` | Scripted full database restore via `BackupApi.restoreBackup`. |
| **Data Integrity Level** | 100% Deterministic | `VERIFIED` | Validated via pre-restore schema & checksum verification. |
| **Institutional Approval** | Formal Sign-off | `REQUIRES INSTITUTIONAL APPROVAL` | Awaiting School Managing Committee formal adoption. |

---

## 2. Failure Scenarios & Response Runbooks

### Scenario 1: Google Sheets Database Corruption / Data Loss
1. **Detection:** API queries fail or return corrupted arrays; `BackupApi.validateBackupIntegrity` detects checksum mismatch.
2. **Immediate Action:** Admin freezes writes by toggling maintenance mode or revoking write permissions.
3. **Restoration Workflow:**
   - Locate most recent valid backup JSON in Secure Drive Storage (`backupId: BKP_...`).
   - Execute `BackupApi.restoreBackup(adminSession, { backup: backupJson, confirmed: true })`.
   - The engine automatically creates a pre-restore safety snapshot before updating tables.
   - Validate record counts across all 23 tables (`Students`, `Staff`, `Attendance`, `Marks`, etc.).
4. **Post-Recovery Verification:** Run `scratch/test_phase14_security_backup.js` and notify Principal.

### Scenario 2: Accidental Student / Attendance / Mark Deletion
1. **Detection:** Teacher or administrator reports missing records for a class or examination.
2. **Action:** Inspect `AuditLogs` for `STUDENT_STATUS_CHANGED`, `ATTENDANCE_CORRECTED`, or `RESULT_REVISED`.
3. **Resolution:** Query the pre-restore safety snapshot or latest backup file to retrieve the historical records, and execute scoped upsert via `Database.upsertBatch`.

### Scenario 3: Apps Script / Google Cloud Outage
1. **Impact:** Web Portals and Sync endpoints return HTTP 500 / 503 errors.
2. **Android Offline Behavior:** The Android app switches automatically to offline-first cache mode. Teachers continue recording attendance and viewing downloaded student rosters locally.
3. **Recovery:** Once Google Cloud services recover, the Android app sync queue automatically pushes pending records via `SyncApi.syncOfflineAttendance` with idempotency verification.

### Scenario 4: Compromised Staff or Admin Credentials
1. **Immediate Action:** Administrator logs in and invokes `AdminApi.resetAllPasswordsToCommon` or resets individual password hash in `Staff` table.
2. **Session Termination:** Existing session tokens can be invalidated globally by rotating `SERVER_SECRET` in `PropertiesService`.
3. **Audit Inspection:** Review `AuditLogs` for any unauthorized mutations performed during the compromised window.

### Scenario 5: Web Portal (Firebase Hosting) Outage
1. **Impact:** React web portals unreachable at public URLs.
2. **Mitigation:** Android mobile app communicates directly with backend APIs without depending on Firebase Hosting.
3. **Resolution:** Redeploy static portal bundles via Firebase CLI (`npm run build && firebase deploy --only hosting`).

---

## 3. Backup Retention & Storage Architecture

- **Primary Storage:** Google Sheets operational tables in school institutional workspace (`GAMERI-HSS-001`).
- **Backup Location:** Encrypted Google Drive folder restricted exclusively to Head of Institution (`Principal`) and System Administrator.
- **Backup Frequency:**
  - Automated weekly snapshots.
  - Mandatory on-demand backup before major operations (academic year rollover, bulk promotions, final result publication).
- **Pre-Restore Invariant:** Every restore operation automatically creates an immutable safety snapshot before applying backup records.

---

## 4. Emergency Contacts & Escalation Matrix

1. **System Administrator / Vocational IT Faculty:** Gameri HSS IT Department
2. **Head of Institution:** Principal, Gameri Higher Secondary School, Gamiri
3. **Academic Committee:** Examination & Curriculum In-Charge
