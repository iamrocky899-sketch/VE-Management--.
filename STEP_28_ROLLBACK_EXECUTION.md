# STEP 28 — ROLLBACK EXECUTION RUNBOOK
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Estimated Execution Time:** $< 60\text{ seconds}$  
**Rollback Target:** Google Apps Script + Google Sheets (Always Active & Available)  

---

## 1. Rollback Pre-Conditions & Principles
1. **Zero Data Loss:** D1 data will not be truncated or deleted during rollback.
2. **Instant Reversion:** Client endpoint variables in `staff-portal/.env`, `parent-portal/.env`, and `app/src/main/assets/libs/sync_manager.js` are reverted immediately back to the Apps Script URL.
3. **No Infrastructure Destruction:** Cloudflare Workers and D1 remain available in shadow mode for diagnostic review.

---

## 2. Step-by-Step Rollback Procedure

### Step 1: Revert Client Configuration
```bash
# staff-portal/.env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec

# parent-portal/.env
VITE_API_BASE_URL=https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec
```

### Step 2: Re-deploy Portals to Firebase
```bash
cd staff-portal && npm run build
cd ../parent-portal && npm run build
firebase deploy --only hosting
```

### Step 3: Verify Apps Script Endpoints
```bash
curl -s "https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec?action=ping"
```
Ensure HTTP 200/302 response and confirm Google Sheets live update connectivity.
