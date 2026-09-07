# STEP 25 — PRODUCTION D1 DATA SOURCE & FRESHNESS AUDIT
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Audit Date:** 2026-09-03  
**Classification:** **CRITICAL DATA SOURCE AUDIT**  

---

## 1. Executive Summary

This audit evaluates the origin, provenance, and freshness of the data dataset imported into Cloudflare D1 `ve-management-db-prod` during the pre-cutover rehearsal.

---

## 2. Data Provenance & Ingestion Details

| Audit Property | Observed Value | Evaluation / Status |
|---|---|---|
| **Generator Script** | [`scratch/populate_prod_d1.js`](file:///c:/Users/HP/Downloads/ITGHSS2/scratch/populate_prod_d1.js) | Temporary rehearsal seed script |
| **Generated SQL File** | [`scratch/prod_seed.sql`](file:///c:/Users/HP/Downloads/ITGHSS2/scratch/prod_seed.sql) | 234 schema-precise SQL statements |
| **Data Origin** | Hardcoded baseline matching `scratch/test_phase24_production_migration.js` & `dev_sheets_snapshot.json` | **STATIC FIXTURE** |
| **Dynamic Live Export?** | **NO** (Not fetched via real-time Google Sheets API call) | **BLOCKER IDENTIFIED** |
| **Source Row Counts** | 40 Students, 40 Enrollments, 40 Marks, 40 Attendance, 2 Staff, 1 Parent | Matches known 40-student Class 9A pilot |
| **Synthetic / Test Records** | Contains standard fixture names (`Student Name 2`...`40`, `STF_01`) | **FIXTURE DATA** |

---

## 3. Risk Assessment & Blockers

> [!CAUTION]
> **HARD CUTOVER BLOCKER:**  
> The D1 database was populated from a static test baseline rather than a live, dynamically exported snapshot from the authoritative Google Sheets instance immediately prior to cutover.
> 
> If the live Google Sheets production environment contains any recent staff modifications, parent registrations, or daily entries beyond the baseline, those changes are not reflected in the static fixture.

---

## 4. Required Remediation & Pre-Cutover Protocol

Before any live traffic cutover is authorized:
1. **Dynamic Export:** Execute a read-only live snapshot export directly from Google Apps Script (`action: 'sync_download'`) to fetch all 33 tables in real-time.
2. **Transform & Checksum:** Run `cloudflare/scripts/normalize_transform.js` on the live export.
3. **Atomic Re-Seed:** Apply the fresh, real-time dataset to `ve-management-db-prod`.
4. **Reconcile Checksums:** Validate 100% checksum match with the live Google Sheet before traffic switch.
