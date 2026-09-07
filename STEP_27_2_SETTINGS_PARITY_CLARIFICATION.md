# STEP 27.2 — SETTINGS TABLE PARITY & FORENSIC CLARIFICATION REPORT
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Database:** Cloudflare D1 `ve-management-db-prod` (`fcb05085-a97c-4f4a-8a55-7f06cd15460a`)  
**Audit Scope:** Forensic Investigation of `settings` Table Row Count & Parity Metrics  
**Investigation Mode:** 100% READ-ONLY  
**Status:** **`PASS — LEGITIMATE ARCHITECTURAL DIFFERENCE FULLY EXPLAINED`**  

---

## 1. Executive Summary & Root Cause Analysis

In the Step 27.1 audit report, the `settings` table was presented with:
```
settings:
  Source = 4
  D1 = 12
  Missing = 0
  Extra = 0
  Status = PASS
```
This apparent internal inconsistency was caused by:
1. **Reporting Script Artifact (`Classification E`):** The automated audit script [`scratch/test_phase27_1_regression_remediation.js`](file:///c:/Users/HP/Downloads/ITGHSS2/scratch/test_phase27_1_regression_remediation.js) hardcoded `sourceCount = 4` based strictly on the 4 explicit reconciliation keys upserted in Step 26, while displaying default summary zeroes (`Missing = 0, Extra = 0`) instead of computing the set difference.
2. **Legitimate System Configuration Baseline (`Classification A`):** The production D1 database contains exactly **12 legitimate, non-duplicated institutional configuration keys**. Nine keys originated from the baseline schema seed (`prod_seed.sql` / `0001_initial_schema.sql`), and 3 additional keys (`COMMON_PASSWORD`, `ACTIVE_ACADEMIC_YEAR`, `STORAGE_PROVIDER`) were added during Step 26 reconciliation (`SCHOOL_NAME` overlaps between both).

**Zero unauthorized or legacy test records exist in the `settings` table.**

---

## 2. Safe Metadata & Primary Key Forensic Inventory

### Schema Definition:
```sql
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    school_id TEXT NOT NULL DEFAULT 'GAMERI-HSS-001',
    value TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'GENERAL',
    description TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Complete Inventory of 12 D1 Settings Keys (Safe Metadata — No Secret Values Exposed):

| # | Primary Key (`key`) | Category | Description / Semantics | Provenance & Origin |
|---|---|---|---|---|
| **1** | `SCHOOL_ID` | `GENERAL` | Institutional School Identifier | Baseline Schema Seed |
| **2** | `SCHOOL_NAME` | `GENERAL` | Institutional Name | Baseline Seed + Step 26 Reconciled |
| **3** | `ACADEMIC_YEAR` | `ACADEMIC` | Current Active Academic Year | Baseline Schema Seed |
| **4** | `ACTIVE_ACADEMIC_YEAR` | `ACADEMIC` | Active Academic Year Session Alias | Step 26 Reconciled |
| **5** | `ALERT_THRESHOLD` | `ATTENDANCE` | Low Attendance Alert Threshold | Baseline Schema Seed |
| **6** | `PASSING_PERCENTAGE` | `EXAMINATION` | Minimum Passing Percentage | Baseline Schema Seed |
| **7** | `LOGO_URL` | `BRANDING` | School Crest Logo (Google Drive reference) | Baseline Schema Seed |
| **8** | `SEAL_URL` | `BRANDING` | Official Stamp Seal (Google Drive reference) | Baseline Schema Seed |
| **9** | `PRINCIPAL_SIGNATURE_URL` | `SIGNATURES` | Principal Signature (Google Drive reference) | Baseline Schema Seed |
| **10**| `TEACHER_SIGNATURE_URL` | `SIGNATURES` | Exam Controller Signature (Google Drive ref) | Baseline Schema Seed |
| **11**| `COMMON_PASSWORD` | `SECURITY` | Default Common Student & Parent Password Mode | Step 26 Reconciled |
| **12**| `STORAGE_PROVIDER` | `INFRASTRUCTURE` | Authoritative File Storage Provider (`GOOGLE_DRIVE`) | Step 26 Reconciled |

---

## 3. Mathematical Reconciliation Summary

- **Source Sheet Rows in Authoritative Snapshot (`snapshot.tables.settings`):** `0` (Google Sheets backend stores settings in script properties/constants rather than a dedicated user sheet).
- **Explicit Step 26 Reconciliation Keys:** `4`
- **Baseline Institutional Seed Keys:** `9`
- **Total Unique Keys in D1:** **`12`** ($9\text{ baseline} + 3\text{ new} = 12$)
- **Matching Expected System Keys:** **`12 / 12`**
- **Missing Required System Keys:** **`0`**
- **Unexplained Extra Keys:** **`0`**
- **Duplicate Keys:** **`0`** (Strictly prevented by `PRIMARY KEY (key)`)
- **Orphan Records:** **`0`**

---

## 4. Classification & Conclusion

- **Classification:** **`A. LEGITIMATE SYSTEM-GENERATED SETTINGS ROWS`** + **`E. PARITY-REPORTING SCRIPT ARTIFACT`**
- **Impact Assessment:** Zero security risk, zero data corruption, zero legacy pilot leftovers. All 12 settings are active institutional configuration parameters required by the Worker API for branding, RBAC, grading thresholds, attendance monitoring, and Google Drive storage routing.

---

## 5. Final Verdict

# **`PASS — LEGITIMATE ARCHITECTURAL DIFFERENCE FULLY EXPLAINED`**

---

### Invariant Hold Status:
- No live traffic switched.
- No endpoints modified.
- No DNS changes.
- Zero D1 rows inserted, modified, or deleted during this investigation.
