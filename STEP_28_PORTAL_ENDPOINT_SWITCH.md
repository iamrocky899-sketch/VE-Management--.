# STEP 28 — PORTAL ENDPOINT SWITCH SPECIFICATION
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Scope:** Controlled Configuration Migration for Web Client Portals  
**Status:** **PREPARED — FILES 100% UNTOUCHED (AWAITING GATE #1 APPROVAL)**  

---

## 1. Current Live Endpoint vs Target Cloudflare Endpoint

- **CURRENT AUTHORITATIVE ENDPOINT (Live Google Apps Script):**  
  `https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec`

- **TARGET CLOUDFLARE WORKER ENDPOINT (Prepared Production Target):**  
  `https://ve-management-api.iamrocky899.workers.dev`

- **ROLLBACK VALUE:**  
  `https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec`

---

## 2. Exact Files & Variables to Modify (Upon Gate #1 Approval)

### File 1: [`staff-portal/.env`](file:///c:/Users/HP/Downloads/ITGHSS2/staff-portal/.env)
- **Variable:** `VITE_APPS_SCRIPT_URL`
- **Current Content:**
  ```env
  VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec
  ```
- **Prepared Replacement:**
  ```env
  VITE_APPS_SCRIPT_URL=https://ve-management-api.iamrocky899.workers.dev
  ```

### File 2: [`parent-portal/.env`](file:///c:/Users/HP/Downloads/ITGHSS2/parent-portal/.env)
- **Variable:** `VITE_API_BASE_URL`
- **Current Content:**
  ```env
  # Google Apps Script Web App Deployment URL
  VITE_API_BASE_URL=https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec
  ```
- **Prepared Replacement:**
  ```env
  # Cloudflare Worker Production API URL
  VITE_API_BASE_URL=https://ve-management-api.iamrocky899.workers.dev
  ```

---

## 3. Post-Switch Verification Protocol (Phase 28-F)

Immediately following endpoint modification:
1. Re-build `staff-portal` and `parent-portal` with `npm run build`.
2. Verify API payload dispatch to `https://ve-management-api.iamrocky899.workers.dev`.
3. Verify Teacher session login and student roster retrieval.
4. Verify Parent multi-child isolation (Parent A denied access to Child B).
5. Verify zero mutation requests dispatched during smoke testing.
