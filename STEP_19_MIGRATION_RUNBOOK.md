# STEP 19 — D1 DEVELOPMENT MIGRATION OPERATIONAL RUNBOOK
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE OPERATIONAL GUIDE**  
**Mode:** Safe Development-Only Migration (Zero Production Impact)

---

## 1. Safety Principles & Pre-Flight Checklist

Before initiating any development migration execution:

- [x] **Verify Authority:** Confirm Google Sheets is active and remains $100\%$ authoritative.
- [x] **Verify Target:** Confirm Wrangler CLI and local migration scripts are pointing to `ve-management-db-dev` (never staging or production).
- [x] **Verify Zero Cutover:** Confirm no DNS changes, no Firebase redirects, and no Android endpoint changes are scheduled.
- [x] **Read-Only Extract:** The extraction step must use read-only Google Sheets batch access.

---

## 2. Step-by-Step Migration Execution Sequence

```
[ Step 1: Read-Only Export ] ──► node cloudflare/scripts/export_sheets_snapshot.js
               │
               ▼
[ Step 2: Normalize & Transform ] ──► node cloudflare/scripts/normalize_transform.js
               │
               ▼
[ Step 3: D1 Batch Import ] ──► node cloudflare/scripts/migrate_to_d1.js
               │
               ▼
[ Step 4: Integrity Verification ] ──► node cloudflare/scripts/validate_d1_migration.js
```

### Detailed Commands:

```bash
# 1. Apply D1 Relational Schema to Local/Dev D1 instance
npx wrangler d1 migrations apply ve-management-db-dev --local

# 2. Run the Automated Migration & Verification Pipeline
node scratch/test_phase19_d1_migration.js
```

---

## 3. Post-Migration Verification Checklist

1. **Row Count Audit:** Confirm $0$ unexplained differences across all 33 tables.
2. **Attendance Stability Audit:** Verify Class 9A roster has $40$ students before and after attendance migration.
3. **Notes Hierarchy Audit:** Verify notes maintain `Class -> Subject -> Unit -> Q&A + R2 PDF key`.
4. **Assamese Unicode Audit:** Verify student names such as `ৰাহুল বৰা (Rahul Bora)` preserve exact UTF-8 character byte representation.
5. **Parent Multi-Child Audit:** Verify parent sessions resolve all linked children without data leakage.
