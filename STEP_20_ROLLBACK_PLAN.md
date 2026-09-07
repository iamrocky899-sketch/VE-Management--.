# STEP 20 — STAGING SHADOW ROLLBACK PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE & VERIFIED**

---

## 1. Zero-Cutover Safety Guardrail

Because Step 20 operates strictly in **Staging Shadow Mode**, the production infrastructure (Google Apps Script, Google Sheets, Firebase Hosting, and Android production endpoints) has not been touched.

- **Primary Production Rollback:** Not required because production traffic was never switched.
- **Staging Database Rollback:** Staging D1 can be truncated or re-migrated at any time without impacting school operations.

---

## 2. Emergency Cutover Inhibitor Checklist

If any of the following triggers occur:
1. `TR-01`: Attendance roster drops below 40.
2. `TR-02`: Cross-student or cross-parent privacy failure.
3. `TR-03`: Worker logical discrepancy against Google Apps Script.

**Action:** Halt shadow mode, freeze staging deployment, and conduct root cause analysis.
