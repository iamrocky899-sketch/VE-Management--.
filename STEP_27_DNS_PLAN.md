# STEP 27 — DOMAIN & DNS ROUTING PLAN
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Domain:** `gameri-hss.edu.in`  
**Status:** **OPTIONAL / PREPARED (UNAPPLIED)**  

---

## 1. Domain Architecture

| Hostname | Type | Target | Purpose | Status |
|---|---|---|---|---|
| `staff.gameri-hss.edu.in` | CNAME | Firebase Hosting | Staff Management Portal | **Active** |
| `parent.gameri-hss.edu.in` | CNAME | Firebase Hosting | Parent & Student Portal | **Active** |
| `api.gameri-hss.edu.in` | Custom Domain | Cloudflare Worker (`ve-management-api`) | Optional Custom API Endpoint | **Optional / Prepared** |
| `*.workers.dev` | Native Route | `ve-management-api.iamrocky899.workers.dev` | Direct Cloudflare Worker Route | **Verified & Active** |

---

## 2. Recommendation

For the initial cutover, routing portals directly to `https://ve-management-api.iamrocky899.workers.dev/api` is standard and requires zero DNS propagation delay. Setting up `api.gameri-hss.edu.in` can be done at leisure without impacting cutover execution.
