# STEP 21 — SHADOW DATA FRESHNESS AUDIT REPORT
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE DATA FRESHNESS MONITORING**

---

## 1. Staging Data Synchronization Strategy

1. **Authoritative Master:** Google Sheets remains the singular authoritative database.
2. **Snapshot Age Limit:** Recommended maximum staging snapshot age is **$24\text{ hours}$** during active shadow testing.
3. **Stale Data Mismatch Classification:**
   - Any discrepancy arising where D1 staging data age $> 60\text{ seconds}$ and Google Sheets has newer records is classified as `DATA_STALE` (Severity: `MEDIUM`), avoiding false-positive `API_LOGIC_MISMATCH` alerts.

---

## 2. Refresh Runbook
```bash
# Periodic Staging D1 Refresh
node cloudflare/scripts/export_sheets_snapshot.js
node cloudflare/scripts/normalize_transform.js
node cloudflare/scripts/migrate_to_d1.js
```
