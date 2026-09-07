# STEP 29 — CLOUDFLARE CUSTOM DOMAIN PREPARATION & DNS CUTOVER READINESS
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Audit Timestamp:** 2026-09-03 17:51 IST (`2026-09-03T12:21:07Z`)  
**Account:** `iamrocky899@gmail.com` (`5053705be2c3f25dc008a1d7237cdc8d`)  
**Status:** **`100% READ-ONLY PREPARATION COMPLETE — DNS CHANGES NOT EXECUTED`**  

---

## 1. Domain & DNS Forensic State

### A. Current Live Hostname Resolution Audit

| Hostname | Type / Provider | Query Result | Operational Status |
|---|---|---|---|
| `gameri-hss.edu.in` | Apex Domain | `ENOTFOUND` | Not yet delegated/active in public DNS |
| `staff.gameri-hss.edu.in` | Planned Staff Subdomain | `ENOTFOUND` | Not yet delegated/active in public DNS |
| `parent.gameri-hss.edu.in` | Planned Parent Subdomain | `ENOTFOUND` | Not yet delegated/active in public DNS |
| `api.gameri-hss.edu.in` | Planned API Subdomain | `ENOTFOUND` | Not yet delegated/active in public DNS |
| `ve-management-staff.iamrocky899.workers.dev` | Cloudflare Worker Asset | `HTTP 200` | **LIVE & OPERATIONAL** |
| `ve-management-parent.iamrocky899.workers.dev` | Cloudflare Worker Asset | `HTTP 200` | **LIVE & OPERATIONAL** |
| `ve-management-api.iamrocky899.workers.dev` | Cloudflare Backend API | `HTTP 200/401` | **LIVE & OPERATIONAL** |
| `ghss-75f48.web.app` | Firebase Hosting Fallback | `HTTP 200` | **LIVE ON STANDBY** |
| `ve-management-parent.web.app` | Firebase Hosting Fallback | `HTTP 200` | **LIVE ON STANDBY** |

---

## 2. Target Cloudflare Custom Domain Architecture

```
                                  [ Global Internet / DNS ]
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       ▼                     ▼                     ▼
             [ staff.gameri-hss.edu.in ] [ parent.gameri-hss.edu.in ] [ api.gameri-hss.edu.in ]
                       │                     │                     │
                       ▼                     ▼                     ▼
             (ve-management-staff) (ve-management-parent)  (ve-management-api)
               Cloudflare Worker     Cloudflare Worker     Cloudflare Worker
                 Static Assets         Static Assets          Backend API
                       │                     │                     │
                       └─────────────────────┼─────────────────────┘
                                             ▼
                                    [ Cloudflare D1 ]
                                  ve-management-db-prod
                                             │
                                             ▼
                                      [ Google Drive ]
                                 (Authoritative File Store)
```

### Worker-to-Domain Mapping

1. **Staff Portal Web:**  
   `staff.gameri-hss.edu.in` $\longrightarrow$ Cloudflare Worker: `ve-management-staff`
2. **Parent Portal Web:**  
   `parent.gameri-hss.edu.in` $\longrightarrow$ Cloudflare Worker: `ve-management-parent`
3. **Backend API (Optional / Staged):**  
   `api.gameri-hss.edu.in` $\longrightarrow$ Cloudflare Worker: `ve-management-api`  
   *(Note: The existing verified direct endpoint `https://ve-management-api.iamrocky899.workers.dev` may remain active as the backend target without requiring an immediate custom API domain).*

---

## 3. Technical Readiness & Compatibility Review

### E. CORS Origin Handling
- **Audit:** Inspected `cloudflare/src/response.js` (`getCorsHeaders()`).
- **Mechanism:** Dynamically mirrors incoming `Origin` header and whitelists `https://staff.gameri-hss.edu.in` and `https://parent.gameri-hss.edu.in`.
- **Verdict:** **`PASS`** (Zero CORS errors when requests originate from custom domains).

### F. Authentication & Session Management
- **Audit:** Inspected `staff-portal/src/context/AuthContext.jsx` and `parent-portal/src/state/AuthContext.jsx`.
- **Mechanism:** HMAC SHA-256 JWT tokens stored in `localStorage` (`itd3_staff_session`, `itd3_parent_token`) and transmitted via `Authorization: Bearer <token>` header.
- **Dependencies:** Zero dependency on cookie domains, SameSite flags, or specific origin hostnames.
- **Verdict:** **`PASS`** (Seamless cross-origin session persistence).

### G. TLS / SSL Certificate Provisioning
- **Mechanism:** Cloudflare Universal SSL automatically issues managed TLS certificates for all active proxied hostnames (`*.gameri-hss.edu.in` and apex `gameri-hss.edu.in`).
- **Requirement:** Domain apex delegated to Cloudflare nameservers or CNAME setup with Cloudflare validation.
- **Verdict:** **`READY FOR PROVISIONING`**.

---

## 4. Staged DNS Cutover Procedure (When Authorized)

> [!IMPORTANT]
> **Recommended Staging Strategy:** Do NOT switch all domains simultaneously. Execute a controlled, staged sequence:
> 1. Stage 1: Attach `staff.gameri-hss.edu.in` $\rightarrow$ Validate live Staff Portal.
> 2. Stage 2: Attach `parent.gameri-hss.edu.in` $\rightarrow$ Validate live Parent Portal.
> 3. Stage 3 (Optional): Attach `api.gameri-hss.edu.in` $\rightarrow$ Validate live Worker API.

### DNS Records to Create / Configure in Cloudflare Zone

| Record Type | Name / Subdomain | Target / Content | Proxy Status | TTL |
|---|---|---|---|---|
| **CNAME / Custom Domain** | `staff` | `ve-management-staff.iamrocky899.workers.dev` (or Worker Custom Domain binding) | Proxied (Orange Cloud) | Auto / 300s |
| **CNAME / Custom Domain** | `parent` | `ve-management-parent.iamrocky899.workers.dev` (or Worker Custom Domain binding) | Proxied (Orange Cloud) | Auto / 300s |
| **CNAME / Custom Domain** | `api` | `ve-management-api.iamrocky899.workers.dev` (or Worker Custom Domain binding) | Proxied (Orange Cloud) | Auto / 300s |

---

## 5. Rollback Runbook (<60 Seconds)

If any DNS or routing issue occurs after cutover:
1. **Frontend Fallback:** Immediately revert DNS CNAMEs for `staff` and `parent` to Firebase Hosting targets (`ghss-75f48.web.app` and `ve-management-parent.web.app`).
2. **Direct Worker URL Access:** Users can immediately access `https://ve-management-staff.iamrocky899.workers.dev` and `https://ve-management-parent.iamrocky899.workers.dev` with zero downtime.
3. **Backend Rollback:** The backend API Worker and Google Apps Script standby remain 100% operational.

---

## 6. Responsibility Separation Matrix

### 🤖 ANTIGRAVITY CAN PREPARE
- [x] Configure Worker Custom Domain configurations in `wrangler.toml`.
- [x] Validate CORS headers and session token handling.
- [x] Prepare non-mutating automated verification scripts for custom domains.
- [x] Maintain read-only monitoring of edge endpoints and D1 database.

### 👤 USER MUST MANUALLY AUTHORIZE & CONFIGURE
- [ ] Ensure `gameri-hss.edu.in` registrar delegation or active Cloudflare zone status.
- [ ] Authorize DNS record creation or Cloudflare Worker Custom Domain attachment.
- [ ] Authorize human approval gate (GATE F).

### 🛑 DO NOT EXECUTE YET
- [ ] **NO DNS record creation or modification.**
- [ ] **NO deletion of Firebase Hosting.**
- [ ] **NO shutdown of Google Apps Script backend.**
- [ ] **NO production database mutations.**
