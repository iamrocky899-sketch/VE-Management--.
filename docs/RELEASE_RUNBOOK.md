# VE MANAGEMENT — Production Release Runbook
**Release Candidate:** `v5.7-RC1`  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Academic Session:** 2026–27

---

## 1. Pre-Deployment Prerequisites Checklist
- [ ] **1. Google Drive Master Snapshot:** Confirm baseline copy of master Google Spreadsheet exists in `VE_Management_Backups/`.
- [ ] **2. Test Token Invalidation:** Flush all temporary developer test tokens from server cache.
- [ ] **3. Release Signing Keystore:** Provide release signing keystore for final APK signing if publishing to Google Play / MDM.
- [ ] **4. Verify Zero Vulnerabilities:** Confirm `npm audit` shows 0 vulnerabilities across web applications.

---

## 2. Release Sequence & Deployment Order
1. **Step 1: Backend Deployment**
   * Push validated `backend/` scripts to Google Apps Script via Clasp.
   * Manage deployments in Apps Script Editor to generate production Web App URL.
2. **Step 2: Web Portals Deployment**
   * Build production distributions:
     ```bash
     cd parent-portal && npm run build
     cd ../staff-portal && npm run build
     ```
   * Deploy `dist/` directories to school hosting service (e.g. Firebase Hosting / Cloudflare Pages / Vercel).
3. **Step 3: Android Release Distribution**
   * Build signed release APK / AAB.
   * Distribute to designated administrative device(s) at Gameri Higher Secondary School.

---

## 3. Post-Deployment Verification & Smoke Testing
* Execute [docs/POST_RELEASE_SMOKE_TEST.md](file:///c:/Users/HP/Downloads/ITGHSS2/docs/POST_RELEASE_SMOKE_TEST.md).
* Confirm Admin, Staff, Student, and Parent logins.
* Verify bidirectional synchronization indicator (`SYNCED`).

---

## 4. Emergency Rollback Procedure
* **Web Portals:** Revert hosting deployment to previous release tag.
* **Apps Script Backend:** In Apps Script Editor, select **Manage Deployments** -> point active deployment to previous version number.
* **Android Client:** Reinstall previous APK build.
* **Database State:** Execute point-in-time `SPREADSHEET_ID` restore as detailed in [docs/DISASTER_RECOVERY.md](file:///c:/Users/HP/Downloads/ITGHSS2/docs/DISASTER_RECOVERY.md).
