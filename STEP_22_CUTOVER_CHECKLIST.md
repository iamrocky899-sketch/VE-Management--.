# STEP 22 — PRODUCTION CUTOVER VERIFICATION CHECKLIST
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **OPERATIONAL CHECKLIST (FOR FUTURE CUTOVER ONLY)**

---

## 1. Pre-Cutover Verification Checklist

- [ ] School Administration notified of 30-minute scheduled maintenance window.
- [ ] Automated backup snapshot extracted from Google Sheets (`23_tables_backup.json`).
- [ ] D1 Production Database provisioned (`ve-management-db-prod`).
- [ ] R2 Production Storage provisioned (`ve-management-storage-prod`).
- [ ] Production secrets configured via `wrangler secret put SESSION_SECRET`.
- [ ] Zero pending marks or unsubmitted attendance sessions in Apps Script queue.

---

## 2. Cutover Day Execution Checklist

- [ ] Execute `node cloudflare/scripts/export_sheets_snapshot.js`.
- [ ] Execute `node cloudflare/scripts/normalize_transform.js`.
- [ ] Execute `node cloudflare/scripts/migrate_to_d1.js` (Target: Production).
- [ ] Run automated data validation suite (`validate_d1_migration.js`) — 100% Passing.
- [ ] Deploy Cloudflare Worker (`npx wrangler deploy --env production`).
- [ ] Run production health-check smoke test (`curl https://api.gameri-hss.edu.in/api?action=ping`).
- [ ] Update Parent & Staff Portal build API base URLs to Cloudflare edge.
- [ ] Deploy Portal updates to Firebase Hosting (`firebase deploy --only hosting`).

---

## 3. Post-Cutover Monitoring Checklist (First 24 Hours)

- [ ] Edge HTTP error rate remains $< 0.01\%$.
- [ ] Edge p95 latency remains $< 50\text{ms}$.
- [ ] Attendance mark submissions maintain full 40-student roster stability.
- [ ] Zero parent multi-child or cross-student privacy escalations reported.
- [ ] Daily incremental backup script configured for D1 database.
