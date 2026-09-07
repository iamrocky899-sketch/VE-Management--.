# STEP 23 — MASTER CUTOVER VERIFICATION CHECKLIST
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Storage Provider:** **GOOGLE DRIVE (NO CLOUDFLARE R2)**  
**Status:** **ACTIVE OPERATIONAL CHECKLIST**

---

## 1. Master Cutover Phase Checklists

### Pre-Cutover Verification:
- [ ] School leadership notified of maintenance window.
- [ ] Automated backup taken from Google Sheets & Google Drive.
- [ ] D1 Production Database verified (`ve-management-db-prod`, UUID: `fcb05085-a97c-4f4a-8a55-7f06cd15460a`).
- [ ] Cloudflare R2 verified as NOT USED (No buckets or R2 activation required).
- [ ] Production secrets verified (`SESSION_SECRET` provisioned).

### Cutover Execution:
- [ ] Final snapshot exported from Google Sheets.
- [ ] Data normalized and validated with 0 errors.
- [ ] Production D1 populated with 33 tables.
- [ ] Production Cloudflare Worker deployed.
- [ ] Portal frontend assets deployed to Firebase.

### Post-Cutover Verification:
- [ ] Attendance roster verified at 40 students ($40 \rightarrow 40$).
- [ ] Notes hierarchy verified as class-wise (`Class -> Subject -> Unit -> Q&A`).
- [ ] Google Drive file references and URLs verified for photos, crest, and PDFs.
- [ ] Assamese Unicode student names verified (`ৰাহুল বৰা`).
- [ ] Parent multi-child isolation verified.
- [ ] Error rates $< 0.01\%$, p95 latency $< 50\text{ms}$.
