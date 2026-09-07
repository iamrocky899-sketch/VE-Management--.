# STEP 27 — CONTROLLED PRODUCTION CUTOVER PREPARATION
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Target Infrastructure:** Cloudflare Worker `ve-management-api` + Cloudflare D1 `ve-management-db-prod` (`fcb05085-a97c-4f4a-8a55-7f06cd15460a`)  
**Storage Provider:** Google Drive (Cloudflare R2 Rejected / Not Used)  
**Status:** **PREPARED — AWAITING EXPLICIT HUMAN CUTOVER AUTHORIZATION**  

---

## 1. Executive Summary

All prerequisite data reconciliation, schema validation, secret provisioning, RBAC isolation, read API parity, and client configuration audits have been completed. Production D1 `ve-management-db-prod` is in 100% parity with the authoritative Google Sheets snapshot (`2026-09-03T10:44:31.091Z`).

**Zero live user traffic has been switched.** The legacy Google Apps Script + Google Sheets pipeline remains the active authoritative production system.

---

## 2. Infrastructure Inventory & Topology

```
[LIVE AUTHORITATIVE PRODUCTION - UNTOUCHED]
Users / Portals / Android App
             │
             ▼
Google Apps Script (Deployment ID: AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm)
             │
             ▼
Google Sheets (Authoritative Spreadsheet) + Google Drive (File Storage)
```

```
[PREPARED TARGET PRODUCTION - VERIFIED & DORMANT]
Cloudflare Worker: ve-management-api (https://ve-management-api.iamrocky899.workers.dev)
             │
             ▼
Cloudflare D1: ve-management-db-prod (UUID: fcb05085-a97c-4f4a-8a55-7f06cd15460a)
             │
             ▼
Google Drive (Authoritative Media Storage - R2 NOT USED)
```

---

## 3. End-to-End Cutover Phasing Plan

- **Phase A — Preparation & Reconciliation (COMPLETED):**
  - Canonical Worker `ve-management-api` deployed and bound to `ve-management-db-prod`.
  - Secrets `ADMIN_API_KEY` and `SESSION_SECRET` verified present.
  - Full primary-key reconciliation completed (102 students, 102 enrollments, 4 staff, 99 parents, 100 links, 2,680 attendance rows, 200 sessions, 492 activities, 3,160 notices).
  - Residual legacy pilot records pruned to `0`.

- **Phase B — Human Approval Gate (CURRENT STAGE):**
  - Present pre-cutover audit findings and wait for human owner authorization.

- **Phase C — Portal Endpoint Switch (PENDING HUMAN APPROVAL):**
  - Update `staff-portal/.env` and `parent-portal/.env` to point to `https://ve-management-api.iamrocky899.workers.dev`.
  - Build and deploy Firebase Hosting (`firebase deploy --only hosting`).

- **Phase D — Android Endpoint Switch & Release (PENDING HUMAN APPROVAL):**
  - Update `app/src/main/assets/index.html` and `sync_manager.js` to point to `https://ve-management-api.iamrocky899.workers.dev`.
  - Build release APK (`gradlew assembleRelease`).

- **Phase E — DNS Custom Route Routing (PENDING HUMAN APPROVAL):**
  - Configure `api.gameri-hss.edu.in` Cloudflare Custom Domain if desired.

- **Phase F — Post-Cutover Smoke Testing (PENDING HUMAN APPROVAL):**
  - Execute read-only smoke tests on live portals and Android app.

- **Phase G — Observation & Dual-Run Monitoring:**
  - 48-hour monitoring window with rollback runbook ready.
