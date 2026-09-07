# STEP 25 — PRODUCTION CUTOVER MANUAL ACTIONS CHECKLIST
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Phase:** Step 25 — Manual Cutover Checklist & Execution Sequence  
**Status:** **AWAITING HUMAN AUTHORIZATION**  

---

## 1. Division of Responsibilities

To ensure operational safety, all actions during the cutover window are strictly divided between human operator (`👤 USER/MANUAL`) and AI assistant (`🤖 ANTIGRAVITY`).

```
┌──────────────────────────────────────────────────────────┐
│                   CUTOVER STAGES                         │
├──────────────────────────────────────────────────────────┤
│ Stage 1: Maintenance Window Scheduling (👤 USER)        │
│ Stage 2: Final Data Snapshot & Sync (🤖 + 👤)            │
│ Stage 3: Cloudflare Worker Route Activation (👤 + 🤖)    │
│ Stage 4: Portal API Endpoint Switch (🤖 ANTIGRAVITY)     │
│ Stage 5: Portal Deployment to Firebase (👤 USER)        │
│ Stage 6: Post-Cutover Verification & Smoke Test (👤 + 🤖)│
│ Stage 7: Android Endpoint Migration Deployment (👤 USER) │
│ Stage 8: Rollback Decision Point (👤 USER)               │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Step-by-Step Cutover Execution Sequence

### Stage 1: Maintenance Window Scheduling
- [ ] `👤 USER/MANUAL`: Select a 15-minute maintenance window outside instructional hours (Recommended: Weekday after 4:30 PM IST or Weekend).
- [ ] `👤 USER/MANUAL`: Inform administrative staff that attendance marking and marks entry will be paused for 15 minutes.

### Stage 2: Final Pre-Cutover Data Reconciliation
- [ ] `🤖 ANTIGRAVITY`: Execute shadow data diff check between Google Sheets and production D1 `ve-management-db-prod`.
- [ ] `🤖 ANTIGRAVITY`: Confirm 40/40 student attendance and marks checksums match.
- [ ] `👤 USER/MANUAL`: Review and confirm data sync report.

### Stage 3: DNS & Worker Custom Domain Routing
- [ ] `👤 USER/MANUAL`: In Cloudflare Dashboard (Zone: `gameri-hss.edu.in`):
  - Verify route `api.gameri-hss.edu.in/*` is linked to Worker `ve-management-api` (or deploy production worker with route binding via Wrangler).
  - Verify DNS record for `api` subdomain is proxied (Orange Cloud) with TTL set to Auto / 300s.
- [ ] `🤖 ANTIGRAVITY`: Execute `curl -s https://api.gameri-hss.edu.in/api/ping` to verify edge routing health.

### Stage 4: Web Portals API Endpoint Update
- [ ] `🤖 ANTIGRAVITY`: Update `parent-portal/.env` to:
  ```env
  VITE_API_BASE_URL=https://api.gameri-hss.edu.in/api
  ```
- [ ] `🤖 ANTIGRAVITY`: Update `staff-portal/.env` to:
  ```env
  VITE_APPS_SCRIPT_URL=https://api.gameri-hss.edu.in/api
  ```
- [ ] `🤖 ANTIGRAVITY`: Run production builds:
  - `npm --prefix staff-portal run build`
  - `npm --prefix parent-portal run build`

### Stage 5: Firebase Hosting Deployment
- [ ] `👤 USER/MANUAL`: Deploy production bundles to Firebase Hosting by running:
  ```bash
  firebase deploy --only hosting:parent-portal,hosting:staff-portal
  ```

### Stage 6: Post-Switch Live Smoke Testing
- [ ] `👤 USER/MANUAL`: Open `https://staff.gameri-hss.edu.in` in an incognito browser window.
  - Sign in as Admin / Teacher.
  - Load Class 9A attendance roster (Verify 40 students load instantly).
  - Record one test attendance update.
  - Check Examination & Marks for Class 9A IT/ITeS.
- [ ] `👤 USER/MANUAL`: Open `https://parent.gameri-hss.edu.in`.
  - Sign in as Parent (`PAR_01` / Mobile).
  - Verify multi-child selector switches between Rahul Bora (`STU_9A_01`) and Ananya Bora (`STU_9A_02`).
  - Verify attendance percentage and marksheet display.
- [ ] `👤 USER/MANUAL`: Scan QR code on issued document `VRF_MS_001` to test public document verification.

### Stage 7: Android App Endpoint Migration
- [ ] `🤖 ANTIGRAVITY`: Update Android fallback URL in `app/src/main/assets/index.html` to `https://api.gameri-hss.edu.in/api`.
- [ ] `👤 USER/MANUAL`: Build signed release APK for school staff devices.
- [ ] `👤 USER/MANUAL`: Distribute updated APK to staff devices.

### Stage 8: Rollback Decision Point (If Any Gate Fails)
- [ ] `👤 USER/MANUAL`: If critical error occurs, trigger rollback:
  1. `🤖 ANTIGRAVITY` will revert `staff-portal/.env` and `parent-portal/.env` back to the Apps Script URL.
  2. `👤 USER/MANUAL` runs `firebase deploy --only hosting`.
  3. All traffic immediately reverts to Google Sheets + Apps Script (Total rollback time: ~4 minutes).

---

## 3. Exact First Manual Action Required

When the human operator is ready to initiate the cutover, the **very first manual action** is:

> [!IMPORTANT]
> **FIRST REQUIRED MANUAL ACTION:**  
> **Confirm authorization for the cutover maintenance window by typing:**  
> `AUTHORIZE CUTOVER WINDOW: [Preferred Date & Time, e.g., TODAY 17:00 IST]`
