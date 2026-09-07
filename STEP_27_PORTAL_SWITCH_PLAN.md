# STEP 27 — FIREBASE PORTAL CUTOVER PLAN
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Components:** `staff-portal`, `parent-portal`  
**Status:** **PREPARED (UNAPPLIED)**  

---

## 1. Current State vs Target State Diff

### 1.1 Staff Portal ([`staff-portal/.env`](file:///c:/Users/HP/Downloads/ITGHSS2/staff-portal/.env))

```diff
- VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec
+ VITE_APPS_SCRIPT_URL=https://ve-management-api.iamrocky899.workers.dev/api
```

### 1.2 Parent Portal ([`parent-portal/.env`](file:///c:/Users/HP/Downloads/ITGHSS2/parent-portal/.env))

```diff
- VITE_API_BASE_URL=https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec
+ VITE_API_BASE_URL=https://ve-management-api.iamrocky899.workers.dev/api
```

---

## 2. Controlled Execution Sequence (Upon Human Approval)

1. Update `.env` files in `staff-portal` and `parent-portal`.
2. Build frontend production bundles:
   ```bash
   cd staff-portal && npm run build
   cd ../parent-portal && npm run build
   ```
3. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```
4. Verify HTTP requests from `https://staff.gameri-hss.edu.in` and `https://parent.gameri-hss.edu.in` route to `https://ve-management-api.iamrocky899.workers.dev`.
