# STEP 17 — DISASTER RECOVERY & ROLLBACK PLAN
**Institutional Entity:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Version:** 2.0  
**Effective Date:** September 2, 2026  

---

## 1. Overview & Rollback Principles

This document establishes the emergency rollback, recovery, and reversion protocols for Gameri Higher Secondary School's VE Management deployment.

### Fundamental Safety Invariants:
1. **Automated Safety Snapshot:** No data restoration or batch update is ever executed without an immediate, preceding pre-restore snapshot (`SNAP_{timestamp}`).
2. **Zero In-Flight Data Loss:** All operational tables maintain transactional backups with cryptographic checksum verification (`CHK_{sha256}`).
3. **Role-Enforced Authorization:** Reversion and restore endpoints require authenticated `ADMIN` credentials with explicit confirmation (`confirmed: true`).

---

## 2. Rollback Scenarios & Runbooks

### Scenario A: Accidental Bulk Data Overwrite or Corruption
- **Trigger:** Corrupted CSV import, accidental bulk status mutation, or unintentional record alteration.
- **Rollback Procedure:**
  1. Identify the most recent valid backup timestamp in `Backups` table or local archive.
  2. Initiate the pre-restore safety snapshot via `BackupApi.createSafetySnapshot('GAMERI-HSS-001', adminUserId)`.
  3. Execute `BackupApi.restoreBackup(adminSession, { backup: targetBackupData, confirmed: true })`.
  4. Verify table checksums and record counts via `BackupApi.validateBackupIntegrity()`.
  5. Audit log entry `BACKUP_RESTORED` is recorded automatically.

### Scenario B: Frontend Deployment Defect
- **Trigger:** UI breaking error in Parent Portal or Staff Portal post-build.
- **Rollback Procedure:**
  1. Revert to previous release bundle in Firebase Hosting / Static Hosting:
     ```bash
     firebase hosting:rollback
     ```
  2. Clear browser application service-worker and client caches.
  3. Validate login and core dashboard views across supported browser viewports.

### Scenario C: Backend Apps Script Revision Failure
- **Trigger:** Erroneous API script deployment or broken GAS endpoint.
- **Rollback Procedure:**
  1. Open Google Apps Script Project Settings -> **Deployments**.
  2. Select previous stable deployment version number.
  3. Set active deployment to the previous version and deploy.
  4. Run automated test suite (`node scratch/test_phase17_pilot.js`) to confirm endpoint functionality.

---

## 3. Post-Rollback Validation Checklist
- [ ] Database record counts match expected historical baseline.
- [ ] Multi-role authentication (Admin, Principal, Teacher, Student, Parent) verified.
- [ ] Parent multi-child isolation (`ParentStudentLinks`) functional.
- [ ] Teacher academic scope (`StaffAssignments`) intact.
- [ ] Published examination results and issued official documents unchanged.
- [ ] Audit log reflects exact actor, timestamp, and restored snapshot ID.
