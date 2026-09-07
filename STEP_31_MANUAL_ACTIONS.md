# STEP 31 — MANUAL ACTIONS & OPERATIONAL RUNBOOK
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Timestamp:** 2026-09-03 18:47 IST (`2026-09-03T13:17:00Z`)  
**Deliverable File:** `STEP_31_MANUAL_ACTIONS.md`  

---

## 1. Overview of Remaining Actions for Human Operator

The technical migration, mathematical attendance parity, server-side RBAC scoping, and multi-portal Cloudflare deployments are **100% complete and verified**.

The following sequential actions require explicit human operator execution or human approval before proceeding:

---

## 2. Action Matrix & Execution Protocol

```
[Phase 1: Registrar Delegation] ──► [Phase 2: Custom Domains] ──► [Phase 3: Firebase Deployment]
                                                                            │
[Phase 6: Standby Decommission] ◄── [Phase 5: Secret Rotation] ◄── [Phase 4: Android Release]
```

### Action 1: Domain Delegation at Registrar (Manual External Action)
- **Target Domain:** `gameri-hss.edu.in`
- **Action Required:**
  1. Log into your domain registrar dashboard (e.g. INRegistry / GoDaddy / Namecheap).
  2. Navigate to DNS / Nameserver settings for `gameri-hss.edu.in`.
  3. Change authoritative nameservers to the Cloudflare nameservers assigned to your Cloudflare account.
- **Verification:**
  - Run `node scratch/audit_domain_delegation.js` to verify public DNS resolution switches from `NXDOMAIN` to `NOERROR`.

---

### Action 2: Cloudflare Custom Domain Attachment (Post-Delegation)
- **Action Required:**
  Once nameservers are active, bind custom domains to workers via Cloudflare Dashboard or Wrangler:
  - `staff.gameri-hss.edu.in` $\rightarrow$ `ve-management-staff`
  - `parent.gameri-hss.edu.in` $\rightarrow$ `ve-management-parent`
  - `api.gameri-hss.edu.in` $\rightarrow$ `ve-management-api`

---

### Action 3: Production Firebase Deployment (Optional Fallback Sync)
- **Target Sites:** `ghss-75f48.web.app`, `ve-management-parent.web.app`
- **Action Required:**
  - Only deploy if you wish Firebase fallback portals to also use the Cloudflare Worker API instead of Apps Script:
    ```bash
    firebase deploy --only hosting
    ```
  - *Current Status:* Preserved as Apps Script fallback until cutover observation completes.

---

### Action 4: Android Production APK Build & Release (Authorized Post-Cutover)
- **Target App:** `com.itdept.itghss`
- **Action Required:**
  1. Assemble signed release APK (`./gradlew assembleRelease`).
  2. Verify APK points to `https://ve-management-api.iamrocky899.workers.dev` (or `https://api.gameri-hss.edu.in`).
  3. Distribute to faculty devices.

---

### Action 5: Production Secret Rotation (`ADMIN_API_KEY`)
- **Action Required:**
  - After custom domains and client migrations are fully adopted, rotate `ADMIN_API_KEY` via `wrangler secret put ADMIN_API_KEY`.
  - Update any automated administrative tools accordingly.

---

### Action 6: Google Sheets & Apps Script Standby Decommissioning
- **Action Required:**
  - Keep Google Sheets and Apps Script active in read-only standby mode for at least **14 days** of stable production observation.
  - Decommission only after full stakeholder sign-off.

---

## 3. Human Approval Gate Before Next Step

> [!IMPORTANT]
> **DO YOU APPROVE PROCEEDING WITH STEP 32 (FINAL CUTOVER & DOMAIN ACTIVATION)?**
>
> Please confirm:
> 1. Approval of the **102-Student Attendance Parity Report** (`Mismatch = 0`).
> 2. Approval of the **Production Integrity Audit** (44/44 checks passed).
> 3. Decision on whether to initiate custom domain delegation at the registrar or continue observing on direct `*.workers.dev` hostnames.
