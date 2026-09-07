# STEP 31.1 — OPERATIONAL MANUAL ACTIONS & RUNBOOK
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Timestamp:** 2026-09-03 18:56 IST (`2026-09-03T13:26:00Z`)  
**Status:** **RECONCILED & PAUSED AWAITING HUMAN OPERATOR AUTHORIZATION**  
**Deliverable File:** `STEP_31_1_MANUAL_ACTIONS.md`  

---

## 1. Executive Reconciliation & Scope of Human Responsibilities

All backend automated systems, database schemas, RBAC scoping, and mathematical parity checks are **100% complete and verified**.

This operational runbook replaces the outdated Step 31 manual actions document. Specifically:
- **Domain Delegation & Custom DNS:** **STRICKEN OUT & REMOVED**. The institution does **NOT** own a custom domain (`gameri-hss.edu.in`). No registrar modifications, nameserver changes, or custom subdomain allocations are to be performed.
- **Authoritative Hosting Infrastructure:**
  - Frontend: **Firebase Hosting** (`ghss-75f48.web.app` and `ve-management-parent.web.app`)
  - Backend API: **Cloudflare Workers** (`ve-management-api.iamrocky899.workers.dev`)
  - Database: **Cloudflare D1** (`ve-management-db-prod`)
  - Storage: **Backblaze B2** (Google Drive standby backup)
- **Validation Workers Retained:** Cloudflare static workers (`ve-management-staff` and `ve-management-parent`) remain active as validation and edge backup environments. Do not delete them.

---

## 2. Updated Manual Action Matrix

```
[Action 1: Architecture Review] ──► [Action 2: Human Approval Gate] ──► [Action 3: Firebase Deployment]
                                                                                  │
[Action 6: Standby Decommission] ◄── [Action 5: Secret Rotation] ◄── [Action 4: Android Release]
```

### Action 1: Review Architecture Reconciliation & Current Live State
- **Description:** Review the verified live state of the five active endpoints:
  1. `https://ghss-75f48.web.app` (Production Staff Portal on Firebase)
  2. `https://ve-management-parent.web.app` (Production Parent Portal on Firebase)
  3. `https://ve-management-api.iamrocky899.workers.dev` (Production Worker API on D1)
  4. `https://ve-management-staff.iamrocky899.workers.dev` (Validation Staff Worker)
  5. `https://ve-management-parent.iamrocky899.workers.dev` (Validation Parent Worker)
- **Status:** **VERIFIED (All endpoints healthy and responding HTTP 200).**

---

### Action 2: Human Operator Approval for Step 32 (Current Gate)
- **Target:** Authorization to proceed to **Step 32 — Firebase Frontend Cutover**.
- **Requirement:** A human operator must explicitly authorize the production build and deployment to Firebase Hosting.
- **Safety Boundary:** The AI agent and automated scripts are **strictly prohibited** from initiating production deployments without prior human approval.

---

### Action 3: Firebase Frontend Production Deployment (Step 32 — Post-Approval)
- **Target Projects:** `ghss-75f48` (Staff), `ve-management-parent` (Parent)
- **Execution Protocol (ONLY after Action 2 is approved):**
  1. Compile production bundles:
     ```bash
     cd staff-portal && npm run build
     cd ../parent-portal && npm run build
     ```
  2. Deploy bundles to Firebase Hosting:
     ```bash
     cd staff-portal && firebase deploy --only hosting --project ghss-75f48
     cd ../parent-portal && firebase deploy --only hosting --project ve-management-parent
     ```
  3. Confirm that both live portals dispatch API traffic directly to `https://ve-management-api.iamrocky899.workers.dev`.

---

### Action 4: Android Native Client Release (Step 33 — Deferred)
- **Target App:** `com.itdept.itghss`
- **Policy:** **DO NOT DISTRIBUTE APK YET.**
  - Installed devices currently run the legacy client synchronized with Google Apps Script.
  - Android client migration must be handled as a separate, controlled track after web portals are stable.
- **Action Required (During Step 33):**
  1. Sign release APK using institutional production keystore.
  2. Coordinate scheduled rollout to faculty devices.

---

### Action 5: Secret Rotation (`ADMIN_API_KEY`) (Step 34 — Deferred)
- **Policy:** **DO NOT ROTATE SECRETS YET.**
  - Installed Android clients rely on the locally stored administrative synchronization credential.
  - Rotating `ADMIN_API_KEY` now would break synchronization on active faculty devices.
- **Action Required (During Step 34):**
  - Rotate `ADMIN_API_KEY` via `wrangler secret put ADMIN_API_KEY` only after all physical Android devices are verified migrated to the modern client.

---

### Action 6: Google Sheets & Apps Script Standby Decommissioning (Step 35 — Deferred)
- **Policy:** Retain Google Sheets and Apps Script in read-only standby mode for at least **14 days** of stable production observation.
- **Action Required:** Decommission only after formal stakeholder sign-off following the 14-day observation period.

---

## 3. Strict Operational Invariants

The following safety constraints are permanently active:
- ❌ **DO NOT change DNS or attempt domain registration.**
- ❌ **DO NOT deploy Firebase without human approval.**
- ❌ **DO NOT switch production traffic automatically.**
- ❌ **DO NOT disable Google Apps Script.**
- ❌ **DO NOT modify or truncate Google Sheets records.**
- ❌ **DO NOT delete Cloudflare D1 data.**
- ❌ **DO NOT sign or distribute Android APKs.**
- ❌ **DO NOT rotate `ADMIN_API_KEY`.**
- ❌ **DO NOT delete Cloudflare validation workers (`ve-management-staff`, `ve-management-parent`).**

---

## 4. Human Approval Gate Before Step 32

> [!IMPORTANT]
> **GATE VERDICT:**
> # **`GO — READY FOR FIREBASE FRONTEND CUTOVER APPROVAL`**
>
> The correct next gate is **STEP 32 — FIREBASE FRONTEND CUTOVER** (NOT domain activation).
>
> **Required Human Operator Action:**  
> Confirm approval to proceed with **Step 32 (Firebase Frontend Cutover)** to build and deploy the production staff and parent web portals to Firebase Hosting.
>
> *All automated processes are paused at this gate awaiting your explicit command.*
