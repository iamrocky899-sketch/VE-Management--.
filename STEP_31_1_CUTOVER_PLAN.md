# STEP 31.1 — REVISED PRODUCTION CUTOVER PLAN
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Timestamp:** 2026-09-03 18:56 IST (`2026-09-03T13:26:00Z`)  
**Scope:** Reconciled Cutover Protocol without Custom Domain Dependencies  
**Deliverable File:** `STEP_31_1_CUTOVER_PLAN.md`  

---

## 1. Cutover Plan Philosophy & Objectives

This document establishes the revised, authoritative production cutover runbook for Gameri Higher Secondary School. It replaces all prior cutover schedules that relied on registrar delegation or custom domains (`gameri-hss.edu.in`).

### Key Principles:
1. **Zero Domain Pre-requisites:** Cutover operates entirely on existing, stable, free infrastructure:
   - Frontend: **Firebase Hosting** (`ghss-75f48.web.app` and `ve-management-parent.web.app`)
   - Backend API: **Cloudflare Workers** (`ve-management-api.iamrocky899.workers.dev`)
   - Database: **Cloudflare D1** (`ve-management-db-prod`)
   - File Storage: **Backblaze B2** (Google Drive standby backup)
2. **Deterministic Gating:** Every deployment transition is governed by strict technical validation and an explicit Human Operator Approval gate.
3. **Decoupled Client Tracks:** The Web Portals cutover is cleanly separated from the Android Native App release to prevent operational entanglement.
4. **Credential Continuity:** Existing shared keys (including `ADMIN_API_KEY`) are frozen to protect active Android client synchronization until client app upgrades are coordinated.
5. **Instant Rollback (RTO < 60s):** Google Apps Script and Google Sheets remain active in parallel, allowing an immediate rollback by switching frontend environmental endpoints if any issue occurs.

---

## 2. Reconciled Gate Sequence

```
                                      [STEP 31.0: TECHNICAL INTEGRITY]
                                 Passed 44/44 Checks & 102/102 Attendance Parity
                                                     │
                                                     ▼
                                  [STEP 31.1: ARCHITECTURE RECONCILIATION]
                            Reconciled Firebase Primary Hosting & Zero Domain Dependencies
                                                     │
                                                     ▼
                       =============================================================
                       STOP: HUMAN OPERATOR APPROVAL GATE FOR FIREBASE PRODUCTION CUTOVER
                       =============================================================
                                                     │ (Upon Explicit User Approval)
                                                     ▼
                                    [STEP 32.0: FIREBASE PRODUCTION CUTOVER]
                               • Fresh Production Build of Staff & Parent Portals
                               • Atomic Firebase Hosting Deployment
                               • Verification of Live HTTP Dispatches to Worker API
                                                     │
                                                     ▼
                                    [STEP 32.1: PRODUCTION OBSERVATION]
                               • 72-Hour Continuous Operational Telemetry
                               • D1 Real-Time Query & Write Health Audit
                               • Parallel Google Sheets Mirroring Verification
                                                     │
                                                     ▼
                                    [STEP 33.0: ANDROID CLIENT MIGRATION]
                               • Keystore Signing of Production APK
                               • Controlled Staged Rollout to Faculty Devices
                               • Verification of Direct Worker API Token Handshakes
                                                     │
                                                     ▼
                                    [STEP 34.0: POST-MIGRATION HARDENING]
                               • Safe Rotation of ADMIN_API_KEY
                               • Formal Standby Phase for Google Apps Script (14 Days)
                               • Archival Decommissioning of Legacy Google Sheets
```

---

## 3. Phase-by-Phase Execution Runbook

### Phase A: Pre-Cutover Baseline Verification (COMPLETED in Step 31)
- **Status:** **PASS**
- **Artifacts Verified:**
  - Cloudflare D1 `ve-management-db-prod`: 102 students, 200 sessions, 2,680 attendance marks, 0 discrepancies.
  - Cloudflare Worker `ve-management-api`: Responding 200 to `/api/ping`, sub-5ms edge latency.
  - Multi-tenant RBAC: Cross-child access blocked (403), teacher class-level scoping active.
  - Backblaze B2: Storage bucket configured, Google Drive fallback active.

### Phase B: Architecture Alignment & Documentation (COMPLETED in Step 31.1)
- **Status:** **PASS**
- **Action:**
  - Corrected cutover assumptions: Removed all references to custom domain purchase, registrar delegation, and custom subdomains.
  - Established Firebase Hosting as the single authoritative production frontend hosting platform.
  - Classified Cloudflare frontend workers (`ve-management-staff`, `ve-management-parent`) as permanent validation and backup targets.
  - Frozen `ADMIN_API_KEY` secret rotation.

---

### Phase C: Human Authorization Gate (CURRENT STATUS: PAUSED)
> [!IMPORTANT]
> **GATE REQUIREMENT:**  
> Automatic production deployment is strictly forbidden. The system must pause and present the final verdict to the Human Operator. Execution of Phase D (Step 32) requires explicit written user consent.

---

### Phase D: Step 32 — Firebase Frontend Production Cutover (PENDING APPROVAL)
*This phase will ONLY be executed after explicit human approval.*

1. **Clean Production Compile:**
   ```bash
   # Staff Portal Production Build
   cd staff-portal
   npm run build

   # Parent Portal Production Build
   cd ../parent-portal
   npm run build
   ```
2. **Verify Bundles for Canonical Worker Target:**
   - Confirm generated `dist/` contains `https://ve-management-api.iamrocky899.workers.dev`.
   - Confirm absence of hardcoded development URLs.
3. **Atomic Deployment to Firebase Hosting:**
   ```bash
   # Deploy Staff Portal to Production Firebase
   cd staff-portal
   firebase deploy --only hosting --project ghss-75f48

   # Deploy Parent Portal to Production Firebase
   cd ../parent-portal
   firebase deploy --only hosting --project ve-management-parent
   ```
4. **Post-Deployment Smoke Verification:**
   - Probe `https://ghss-75f48.web.app` and confirm HTTP 200 with new assets.
   - Probe `https://ve-management-parent.web.app` and confirm HTTP 200 with new assets.
   - Execute authenticated Teacher, Principal, and Parent logins against live Firebase sites.
   - Inspect browser network panel to ensure `ve-management-api.iamrocky899.workers.dev` receives 100% of API payloads.

---

### Phase E: Production Observation & Dual-Run Telemetry
1. **Observation Window:** Maintain active dual-run observation for a minimum of **72 hours** post-Firebase deployment.
2. **Monitoring Invariants:**
   - Zero HTTP 5xx errors on `ve-management-api`.
   - D1 query execution times remaining $< 25\text{ms}$.
   - Attendance write operations executing with immediate consistency.
   - Google Sheets and Apps Script remaining intact as idle standby.

---

### Phase F: Coordinated Android Migration (Step 33)
1. **Android Isolation:**
   - Do NOT distribute APKs during Web Cutover.
   - Maintain current device communication until Web stability is proven.
2. **Android Release Protocol:**
   - Assemble and sign release APK using institutional production keystore.
   - Coordinate installation on designated faculty tablets/phones.
   - Validate attendance submission directly from physical Android devices to Cloudflare Workers.

---

### Phase G: Post-Migration Hardening & Secret Rotation (Step 34)
1. **`ADMIN_API_KEY` Rotation:**
   - Execute `wrangler secret put ADMIN_API_KEY` only after all physical Android devices are confirmed running the modern client.
2. **Standby Decommissioning:**
   - Maintain Google Sheets in read-only archive mode for at least **14 days**.
   - Create complete export dump of Google Sheets before final disconnection.

---

## 4. Disaster Recovery & Instant Rollback Runbook

If any critical failure occurs during or immediately following Phase D (Firebase Frontend Deployment):

### Trigger Conditions:
- API connectivity failure between Firebase frontend and Cloudflare Worker API.
- D1 database write errors or consistency anomalies.
- Widespread user authentication failure.

### Rollback Procedure (< 60 Seconds RTO):
1. **Step 1: Revert Portal Environment Configuration:**
   - Revert `staff-portal/.env` to point to Google Apps Script:
     ```env
     VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec
     ```
   - Revert `parent-portal/.env` to point to Google Apps Script:
     ```env
     VITE_API_BASE_URL=https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec
     ```
2. **Step 2: Rapid Rebuild & Redeploy:**
   ```bash
   cd staff-portal && npm run build && firebase deploy --only hosting --project ghss-75f48
   cd ../parent-portal && npm run build && firebase deploy --only hosting --project ve-management-parent
   ```
3. **Step 3: Verification:**
   - Confirm portals resume communication with Google Apps Script Web App.
   - Google Sheets continues recording attendance seamlessly.
