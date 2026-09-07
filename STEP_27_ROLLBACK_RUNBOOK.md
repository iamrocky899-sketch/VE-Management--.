# STEP 27 — PRODUCTION ROLLBACK RUNBOOK
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Purpose:** Revert live production traffic to Google Apps Script in case of unforeseen edge issues.  
**Rollback Time Objective (RTO):** $< 5\text{ minutes}$  
**Rollback Point Objective (RPO):** Real-time dual reconciliation  

---

## 1. Rollback Triggers

Rollback is initiated if any of the following occur during or immediately following cutover:
1. Canonical Worker endpoint encounters persistent edge 5xx errors ($> 1\%$ error rate over 5 minutes).
2. D1 database latency or connectivity failures.
3. Authentication failure preventing faculty from marking daily attendance.
4. Data loss or corruption detected.

---

## 2. Step-by-Step Rollback Execution

### Step 1: Revert Portal Endpoints
Revert `.env` files in `staff-portal` and `parent-portal` to Google Apps Script:
```bash
# staff-portal/.env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec

# parent-portal/.env
VITE_API_BASE_URL=https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec
```

### Step 2: Redeploy Firebase Hosting
```bash
cd staff-portal && npm run build
cd ../parent-portal && npm run build
firebase deploy --only hosting
```

### Step 3: Revert Android Configuration
Revert `DEFAULT_API_URL` in `app/src/main/assets/libs/sync_manager.js` and `index.html` back to the Apps Script URL.

---

## 3. Data Re-Synchronization Post-Rollback

If writes occurred in Cloudflare D1 while live, extract delta records from D1 using:
```bash
npx wrangler d1 execute ve-management-db-prod --remote --command "SELECT * FROM attendance WHERE created_at >= '<CUTOVER_TIMESTAMP>';" --config cloudflare/wrangler.toml --json > scratch/cutover_deltas.json
```
And post deltas back to Google Sheets via Apps Script Admin API.
