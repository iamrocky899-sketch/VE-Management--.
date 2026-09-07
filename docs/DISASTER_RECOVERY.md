# VE MANAGEMENT — Production Disaster Recovery & Backup Plan
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Academic Session:** 2026–27 (April 1, 2026 to March 31, 2027)  
**Classification:** Operational Security & Business Continuity Standard

---

## 1. Scope
This standard establishes the authoritative disaster recovery (DR), automated data preservation, snapshot backup, and restoration procedures for all systems supporting VE Management:
- **Cloud Backend:** Google Apps Script Web App Gateway & Master Google Spreadsheet Database.
- **Administrative Client:** Android Admin Mobile Application with offline SQLite / IndexedDB cache.
- **Portals:** Parent & Student Portal (`parent-portal`) and Staff Portal (`staff-portal`).
- **Academic Entities:** Students, Staff, Parents, ParentStudentLinks, Attendance, Marks, Notes, Activities, Assignments, Notices, Calendar, and Settings across all 20 schema definitions.

---

## 2. Authoritative Data Source
* **Primary Source of Truth:** Cloud-hosted Master Google Spreadsheet linked to Google Apps Script (`SPREADSHEET_ID` property).
* **School Context:** `GAMERI-HSS-001` (`Gameri Higher Secondary School, Gamiri`).
* **Active Academic Session:** `2026-27`.
* **Table Inventory:** 20 Schema Sheets (`Students`, `Parents`, `Staff`, `ParentStudentLinks`, `Attendance`, `Marks`, `Notes`, `NoteUnits`, `NoteQuestions`, `Activities`, `Assignments`, `Notices`, `Notifications`, `Calendar`, `Documents`, `Achievements`, `Contacts`, `Settings`, `SyncMetadata`, `Audit`).

---

## 3. Backup Procedure (Google Drive Snapshot)
1. **Manual / Scheduled Drive Snapshot:**
   * Open the designated administrative Google Drive hosting the school master database.
   * Right-click the Master Spreadsheet -> **"Make a copy"**.
   * Standard File Naming Convention:
     `GHSS_GAMERI_BACKUP_YYYY-MM-DD_SESSION_2026-27.xlsx`
2. **Offline Local SQLite Snapshot (Android):**
   * The Android Admin client stores an offline SQLite snapshot of all synced school entities in local application storage.

---

## 4. Backup Verification
* Verify the copied snapshot contains all 20 canonical schema sheets.
* Confirm that column headers in the backup exactly match [backend/Schema.gs](file:///c:/Users/HP/Downloads/ITGHSS2/backend/Schema.gs).
* Run automated or manual record-count checks comparing the live database against the backup file.

---

## 5. Backup Storage
* **Primary Backup Location:** Dedicated, isolated Google Drive folder: `VE_Management_Backups/` owned by the school administrative account.
* **Secondary Offline Archive:** Encrypted local external storage under physical custody of the School Principal / IT Administrator.

---

## 6. Access Control & Security
* Backup folders must restrict permissions strictly to authorized school leadership (`ADMIN`, `PRINCIPAL`).
* Public and anonymous access links are strictly prohibited.
* Backups must **NEVER** expose plain-text passwords, `SERVER_SECRET`, `ADMIN_API_KEY`, or private encryption keys.

---

## 7. Production Restore Procedure (Disaster Recovery)
> [!CAUTION]
> Never restore directly over a live corrupted database without first halting all incoming sync writes.

1. **Step 1: Emergency Write Freeze**
   * Switch the Apps Script Web App or Android Sync client to offline mode (`isSyncing = false`) to halt conflicting writes.
2. **Step 2: Backup Validation**
   * Inspect the chosen snapshot to verify non-corruption, header integrity, and non-zero record count.
3. **Step 3: Staging Restoration & Validation**
   * Restore the snapshot into an isolated staging sheet and verify relational integrity before applying to production.
4. **Step 4: Production Point-in-Time Swap**
   * Update the Apps Script Script Property `SPREADSHEET_ID` to reference the validated restored master sheet.
5. **Step 5: Resume Operations**
   * Trigger manual "Sync Now" on the Android Admin client to confirm successful bidirectional synchronization.

---

## 8. Staging Restore Procedure
* Create a temporary staging spreadsheet `GHSS_STAGING_RESTORE_TEST`.
* Paste or import the snapshot data into staging.
* Execute API test queries against staging to ensure no runtime exceptions occur.

---

## 9. Google Apps Script Recovery & Rollback
* **Rollback Pathway:** Google Apps Script Editor -> **Deploy** -> **Manage Deployments**.
* Select the previous known-good deployment version and update the active Web App URL mapping.

---

## 10. Web Portals Rebuild Procedure
* **Parent & Student Portal:**
  ```bash
  cd parent-portal
  npm run build
  ```
  Generates production distribution in `parent-portal/dist/`.
* **Staff Portal:**
  ```bash
  cd staff-portal
  npm run build
  ```
  Generates production distribution in `staff-portal/dist/`.

---

## 11. Android Application Recovery & APK Rebuild
* Clean and compile the debug Android APK:
  ```bash
  gradlew.bat clean
  gradlew.bat assembleDebug
  ```
  Output generated at `app/build/outputs/apk/debug/app-debug.apk`.

---

## 12. Configuration Recovery
* **School Identity:** `GAMERI-HSS-001`
* **School Name:** `Gameri Higher Secondary School, Gamiri`
* **Academic Session:** `2026-27`
* **Script Properties Required:** `SERVER_SECRET`, `ADMIN_API_KEY`, `SPREADSHEET_ID`.

---

## 13. Data Integrity & Schema Validation
* Ensure all primary keys (`studentId`, `staffId`, `parentId`, `attendanceId`, `markId`, `noticeId`) are unique.
* Ensure all foreign keys in `ParentStudentLinks` map to existing students and parents.
* Verify numeric mark boundaries and Attendance 2.0 working-day compliance.

---

## 14. Post-Restore Sync Validation
* Trigger `SyncManager.triggerAutoSync(true)` on the Android Admin device.
* Verify indicator transitions: `SYNCING` -> `SYNCED`.
* Confirm zero mutations are lost from `itd3_sync_queue`.

---

## 15. Recovery Point Objective (RPO)
* **Target RPO:** Maximum 24 hours (Daily automated/manual Drive snapshot before close of school day).

---

## 16. Recovery Time Objective (RTO)
* **Target RTO:** `< 30 minutes` from disaster identification to full service restoration.

---

## 17. Backup Retention Policy
* **Daily Snapshots:** Retained for 14 days.
* **Weekly Snapshots:** Retained for 8 weeks.
* **Term-End / Session Snapshots:** Retained permanently for academic archiving.

---

## 18. Recovery Testing & Drill Schedule
* Bi-annual non-destructive disaster recovery drill performed prior to the start of each academic semester.

---

## 19. Emergency Response Checklist

- [ ] **1. Identify Failure Mode:** Determine if failure is network, Apps Script, Google Sheet, or client-side.
- [ ] **2. Halt Write Operations:** Switch Android clients to offline mode to protect the sync queue.
- [ ] **3. Locate Last Valid Backup:** Identify the most recent snapshot in `VE_Management_Backups/`.
- [ ] **4. Verify Snapshot Health:** Confirm all 20 sheets and headers are intact.
- [ ] **5. Execute Staging Dry-Run:** Restore to staging sheet and test API responses.
- [ ] **6. Apply Production Fix:** Point `SPREADSHEET_ID` to restored sheet or roll back Apps Script version.
- [ ] **7. Verify End-to-End Auth:** Confirm Student, Parent, Staff, and Admin logins.
- [ ] **8. Flush Android Sync Queue:** Re-enable online sync on Admin device.
- [ ] **9. Log Incident:** Record root cause, downtime duration, and corrective actions in the administrative log.
