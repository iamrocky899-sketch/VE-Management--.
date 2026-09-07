# STEP 31.1 — ARCHITECTURE RECONCILIATION & LIVE STATE AUDIT
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Timestamp:** 2026-09-03 18:55 IST (`2026-09-03T13:25:00Z`)  
**Scope:** Authoritative Architecture Correction, Live Endpoint Classification & Bundle Verification  
**Deliverable File:** `STEP_31_1_ARCHITECTURE_RECONCILIATION.md`  

---

## 1. Executive Summary & Objective

The technical verification conducted in Step 31 proved 100% mathematical parity across the institutional attendance engine (102 students, 2,680 attendance records, 200 sessions, 0 mismatch) and full RBAC scoping across all endpoints. However, the operational cutover documentation generated in Step 31 incorporated an outdated assumption: that the institution owned or was acquiring a custom domain (`gameri-hss.edu.in`) requiring registrar nameserver delegation and custom subdomain routing.

### Authoritative Architecture Directives:
1. **No Custom Domain Owned:** Gameri Higher Secondary School does **NOT** currently own a custom domain.
2. **Domain Recommendations Prohibited:** The migration runbook and operational procedures shall **NOT** require or recommend domain purchase, registrar delegation, Cloudflare DNS zone creation, or custom subdomains (`api.gameri-hss.edu.in`, `staff.gameri-hss.edu.in`, `parent.gameri-hss.edu.in`).
3. **Primary Frontend Hosting:** **Firebase Hosting** is the authoritative primary frontend hosting target for both the Staff Portal (`ghss-75f48.web.app`) and Parent Portal (`ve-management-parent.web.app`).
4. **Backend API & Database:** **Cloudflare Workers** (`ve-management-api.iamrocky899.workers.dev`) backed by **Cloudflare D1** (`ve-management-db-prod`).
5. **File Storage:** **Backblaze B2** is designated as the target file storage layer, with Google Drive functioning as active backup/transition storage.
6. **Cloudflare Frontend Workers:** `ve-management-staff` and `ve-management-parent` are strictly **validation and backup environments**, preserved to ensure secondary redundancy, but are **NOT** the primary production frontend hosting.
7. **Legacy Rollback Standby:** Google Apps Script Web App + Google Sheets remain 100% intact, unmodified, and active as the emergency rollback mechanism.

---

## 2. Authoritative Target Production Architecture

```
                                  =======================================
                                  PRIMARY PRODUCTION CLIENT ACCESS
                                  =======================================
                                                     │
                   ┌─────────────────────────────────┴─────────────────────────────────┐
                   ▼                                                                   ▼
       ┌────────────────────────┐                                         ┌────────────────────────┐
       │ Firebase Staff Hosting │                                         │ Firebase Parent Hosting│
       │  ghss-75f48.web.app    │                                         │ve-management-parent.   │
       │                        │                                         │      web.app           │
       └───────────┬────────────┘                                         └───────────┬────────────┘
                   │                                                                  │
                   │  React / Vite SPA                                                │  React / Vite SPA
                   │  (VITE_APPS_SCRIPT_URL)                                          │  (VITE_API_BASE_URL)
                   │                                                                  │
                   └─────────────────────────────────┬────────────────────────────────┘
                                                     │
                                                     │ HTTPS POST / GET (JSON)
                                                     ▼
                                  ┌─────────────────────────────────────┐
                                  │   PRIMARY CLOUDFLARE WORKER API     │
                                  │  ve-management-api.iamrocky899.     │
                                  │             workers.dev             │
                                  └──────────────────┬──────────────────┘
                                                     │
                                     D1 SQL Queries  │  S3-Compatible Storage API
                                     (D1 Database)   │  (Async Attachments)
                                                     │
                            ┌────────────────────────┴────────────────────────┐
                            ▼                                                 ▼
               ┌────────────────────────┐                        ┌────────────────────────┐
               │     Cloudflare D1      │                        │      Backblaze B2      │
               │  ve-management-db-prod │                        │  Object File Storage   │
               │ (33 Relational Tables) │                        │ (Google Drive Backup)  │
               └────────────────────────┘                        └────────────────────────┘

───────────────────────────────────────────────────────────────────────────────────────────────────
                                      STANDBY & VALIDATION TIERS
───────────────────────────────────────────────────────────────────────────────────────────────────
  ┌────────────────────────────────────────────────────────┐  ┌─────────────────────────────────┐
  │         VALIDATION & BACKUP FRONTEND WORKERS           │  │    LEGACY STANDBY / ROLLBACK    │
  │ • ve-management-staff.iamrocky899.workers.dev          │  │ • Google Apps Script Web App    │
  │ • ve-management-parent.iamrocky899.workers.dev         │  │ • Google Sheets Database        │
  │ (Preserved for staging verification & edge redundancy) │  │ (100% intact, zero mutations)   │
  └────────────────────────────────────────────────────────┘  └─────────────────────────────────┘
```

---

## 3. Comprehensive Live State Classification

To ensure operational clarity, every live hostname, service, and repository asset has been verified independently. Live status was determined via real-time HTTP probes and network inspection, not inferred from source code.

| Hostname / Service | Category | Current Verified Status | Architectural Role & Notes |
|---|---|---|---|
| **`https://ghss-75f48.web.app`** | **`PRODUCTION / LIVE`** | **HTTP 200** (Size: 1,209 B, Title: *VE Management — Staff Portal*) | **Primary Production Staff Portal.** Deployed on Firebase Hosting. Bundle `index-eb0Al_zY.js` actively points to Cloudflare Worker API. |
| **`https://ve-management-parent.web.app`** | **`PRODUCTION / LIVE`** | **HTTP 200** (Size: 1,344 B, Title: *VE Management — Parent Portal*) | **Primary Production Parent Portal.** Deployed on Firebase Hosting. Bundle `index-E-Nk5TyP.js` actively points to Cloudflare Worker API. |
| **`https://ve-management-api.iamrocky899.workers.dev`** | **`PRODUCTION / LIVE`** | **HTTP 200** (`/api/ping`: *status: ONLINE, env: production*) | **Authoritative Backend API Gateway.** Powered by Cloudflare Workers and D1 database. Handles all institutional logic and RBAC. |
| **`https://ve-management-staff.iamrocky899.workers.dev`** | **`VALIDATION / BACKUP`** | **HTTP 200** (Size: 1,209 B, Title: *VE Management — Staff Portal*) | **Validation & Failover Environment.** Serves static staff bundle `index-kvTUGY-E.js` via Cloudflare Worker assets. Retained as secondary backup. |
| **`https://ve-management-parent.iamrocky899.workers.dev`** | **`VALIDATION / BACKUP`** | **HTTP 200** (Size: 1,344 B, Title: *VE Management — Parent Portal*) | **Validation & Failover Environment.** Serves static parent bundle `index-HO7iJIAr.js` via Cloudflare Worker assets. Retained as secondary backup. |
| **Google Apps Script Web App** (`...AKfycbyNsz.../exec`) | **`STANDBY / ROLLBACK`** | **HTTP 200 / 302** (Active Web App Gateway) | **Disaster Recovery Standby.** Google Apps Script endpoint intact. Capable of receiving production traffic if emergency rollback is declared. |
| **Google Sheets Database** (`15pDe...`) | **`STANDBY / ROLLBACK`** | **Pristine / Unmodified** (All 33 sheets synced) | **Authoritative Fallback Database.** Zero records truncated or mutated during migration steps. Data remains in exact parity with D1. |
| **Android Client Source & APK** (`com.itdept.itghss`) | **`SOURCE-ONLY / STAGED`** | **Build Complete** (`app-release-unsigned.apk`, 33.62 MB) | **Decoupled from Web Cutover.** Client points to Cloudflare API in source, but APK is unsigned, unreleased, and installed devices run legacy sync. |

---

## 4. Firebase Hosting Forensic Bundle Verification

A deep inspection of the JavaScript bundles currently hosted on the live Firebase production sites was executed to establish whether they target Google Apps Script or Cloudflare Workers.

### 4.1 Firebase Staff Portal (`https://ghss-75f48.web.app`)
- **HTML Document:** Loads `<script type="module" crossorigin src="/assets/index-eb0Al_zY.js"></script>`.
- **Bundle Size:** 675,905 bytes.
- **Embedded Environment Object:**
  ```javascript
  const ax = {
    BASE_URL: "/",
    DEV: !1,
    MODE: "production",
    PROD: !0,
    SSR: !1,
    VITE_APPS_SCRIPT_URL: "https://ve-management-api.iamrocky899.workers.dev"
  };
  ```
- **API Endpoint Evaluator:**
  ```javascript
  ox = typeof import.meta < "u" && ax && "https://ve-management-api.iamrocky899.workers.dev" || "https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec"
  ```
- **Runtime Execution In Browser:**
  Because the bundle is loaded natively as an ECMAScript module (`type="module"`), `typeof import.meta !== "undefined"` evaluates to `true`. The variable `ax` is an initialized object (truthy). Therefore, the expression evaluates **exclusively** to:
  $$\text{ox} = \text{"https://ve-management-api.iamrocky899.workers.dev"}$$
- **Network Dispatch Proof:**
  All staff API requests are dispatched via `fetch(ox, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, ... })`. The Google Apps Script URL serves merely as dead fallback code that is never reached in standard browsers.

### 4.2 Firebase Parent Portal (`https://ve-management-parent.web.app`)
- **HTML Document:** Loads `<script type="module" crossorigin src="/assets/index-E-Nk5TyP.js"></script>`.
- **Bundle Size:** 35,348 bytes.
- **Embedded API Endpoint:**
  ```javascript
  xe = "https://ve-management-api.iamrocky899.workers.dev"
  ```
- **Apps Script Infiltration:** **Zero.** The string `script.google.com` does not appear anywhere in the bundle.
- **Network Dispatch Proof:**
  All parent and student requests are dispatched directly via `fetch(xe, { ...fetchOptions, redirect: "follow" })`.

### 4.3 Build Hash Reconciliation: Local vs Firebase Hosting
- **Staff Portal:**
  - Firebase Live: `index-eb0Al_zY.js` (675,905 B)
  - Local `dist/` & Cloudflare Validation Worker: `index-kvTUGY-E.js` (676,011 B)
  - Delta: 106 bytes (resulting from minor build timestamp and minifier symbol allocation). Both builds target `https://ve-management-api.iamrocky899.workers.dev`.
- **Parent Portal:**
  - Firebase Live: `index-E-Nk5TyP.js` (35,348 B)
  - Local `dist/` & Cloudflare Validation Worker: `index-HO7iJIAr.js` (35,348 B)
  - Delta: 0 bytes in length; identical except for dynamic vendor chunk reference hash.
- **Finding:** While the live Firebase production portals are already functionally configured to communicate with the Cloudflare Worker API, a synchronized production build and deployment to Firebase Hosting will be performed under **Step 32** following explicit human sign-off.

---

## 5. Domain Policy Reconciliation

- **Policy Statement:**  
  *"No custom domain currently owned. Free Firebase and workers.dev URLs are used."*
- **Eliminated Dependencies:**
  - No domain registration or renewal required (`gameri-hss.edu.in`).
  - No external DNS registrar nameserver changes required (e.g., INRegistry, GoDaddy, BigRock).
  - No Cloudflare zone onboarding or CNAME flattening required.
  - No custom subdomain SSL/TLS provisioning required (`api.*`, `staff.*`, `parent.*`).
- **Operational Advantage:**
  Zero external DNS propagation delay, zero registrar dependencies, and zero recurring domain registration overhead for the institution.

---

## 6. Secret Rotation Policy & Android Synchronization Safety

- **`ADMIN_API_KEY` Rotation Status:** **HOLD / DO NOT ROTATE YET**.
- **Technical Justification:**
  Installed Android clients on faculty devices may currently hold the existing local administrative synchronization credentials.
  Rotating `ADMIN_API_KEY` at this juncture would immediately sever background synchronization on deployed Android devices before a coordinated client upgrade can take place.
- **Remediation Order:**
  1. Complete Web Portal Cutover (Firebase $\rightarrow$ Cloudflare $\rightarrow$ D1).
  2. Stabilize web production traffic under Step 32.
  3. Execute dedicated Android release and distribution (Step 33).
  4. Once Android devices are confirmed migrated and authenticated via user tokens, rotate `ADMIN_API_KEY` safely.

---

## 7. Operational Invariants Enforced in Step 31.1

During the execution of this architectural reconciliation:
- ❌ **NO DNS changes were attempted.**
- ❌ **NO Firebase production deployments were initiated.**
- ❌ **NO Google Apps Script endpoints were disabled.**
- ❌ **NO Google Sheets records were altered or deleted.**
- ❌ **NO Cloudflare D1 production data was truncated or mutated.**
- ❌ **NO Android production APKs were distributed.**
- ❌ **NO secret keys (`ADMIN_API_KEY`) were rotated.**
- ❌ **NO Cloudflare validation workers (`ve-management-staff`, `ve-management-parent`) were deleted.**
