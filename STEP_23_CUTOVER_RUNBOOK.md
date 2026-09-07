# STEP 23 — PRODUCTION CUTOVER OPERATIONAL RUNBOOK
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Storage Provider:** **GOOGLE DRIVE (NO CLOUDFLARE R2)**  
**Status:** **ACTIVE OPERATIONAL RUNBOOK**

---

## 1. Step-by-Step Cutover Execution Sequence

1. **Phase 1 (Preparation):**
   - Confirm all Step 23 specification documents are signed off.
   - Run `node scratch/test_phase23_google_drive_storage.js` to ensure 100% test pass rate.
2. **Phase 2 (Freeze & Export):**
   - Set `SHEETS_WRITE_ENABLED=false` on Google Apps Script.
   - Run `node cloudflare/scripts/export_sheets_snapshot.js`.
   - Run `node cloudflare/scripts/normalize_transform.js`.
3. **Phase 3 (Production D1 Import):**
   - Run `node cloudflare/scripts/migrate_to_d1.js` against production D1 (`ve-management-db-prod`).
   - Run `node cloudflare/scripts/validate_d1_migration.js` — Must yield 100% match.
4. **Phase 4 (Worker & Frontend Rollout):**
   - Run `npx wrangler deploy --env production`.
   - Deploy updated Firebase hosting portals pointing to Worker API.
5. **Phase 5 (Smoke Test & Lift Freeze):**
   - Execute live authentication, attendance 40 roster check, marks entry test, and Google Drive file access.
   - Enable live operations.
