# STEP 23 — MANUAL ACTIONS INVENTORY & DIVISION OF RESPONSIBILITY
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Storage Provider:** **GOOGLE DRIVE (NO CLOUDFLARE R2)**  
**Status:** **ACTIVE DIVISION MATRIX**

---

## 1. Action Responsibility Matrix

### Category A: USER DOES NOT NEED TO DO
- **USER DOES NOT NEED TO:**
  - Activate Cloudflare R2
  - Add a payment method for Cloudflare R2
  - Create any Cloudflare R2 bucket

### Category B: USER MUST DO (Manual Cloudflare / School Setup)
1. **Cloudflare Account ID Verified:** `5053705be2c3f25dc008a1d7237cdc8d` (**DONE**)
2. **Production D1 Created:** `ve-management-db-prod` (UUID: `fcb05085-a97c-4f4a-8a55-7f06cd15460a`) (**DONE**)
3. **Application Secret Provisioned:** `SESSION_SECRET` on `ve-management-api` (**DONE**)
4. **School Operational Sign-Off:** Schedule the 30-minute maintenance cutover window with school administration.

### Category C: ANTIGRAVITY CAN DO
1. **Automated Schema Generation:** Apply D1 migrations to `ve-management-db-prod`.
2. **Automated ETL Pipeline:** Run `export_sheets_snapshot.js`, `normalize_transform.js`, and `migrate_to_d1.js`.
3. **Automated Verification:** Execute comprehensive test suites (`test_phase23_google_drive_storage.js`, etc.) and checksum comparisons.
4. **Code Packaging:** Build and package Worker bundles and Frontend Vite distributions.

### Category D: DO NOT DO YET
1. **DO NOT switch DNS or traffic routing.**
2. **DO NOT change live Firebase hosting API URL to production Workers.**
3. **DO NOT change Android production build API endpoint.**
4. **DO NOT disable Google Sheets or Google Apps Script backend.**
5. **DO NOT delete or truncate production Google Sheets database.**
