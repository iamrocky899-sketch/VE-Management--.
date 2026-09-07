# STEP 23 — CLOUDFLARE PRODUCTION ARCHITECTURE
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE PRODUCTION BLUEPRINT (CUTOVER READY)**  
**Storage Provider:** **GOOGLE DRIVE (CLOUDFLARE R2 REJECTED / NOT USED)**  
**Safety Guardrail:** **Zero Traffic Switching (Apps Script Remains 100% Authoritative)**

---

## 1. Production Topology & Environment Separation

```
[ DEVELOPMENT ]                  [ STAGING (SHADOW) ]                [ PRODUCTION (FUTURE TARGET) ]
Worker: ve-management-api        Worker: ve-management-api-staging   Worker: ve-management-api
D1: ve-management-db-dev         D1: ve-management-db-staging        D1: ve-management-db-prod (ID: fcb05085...)
Storage: Google Drive            Storage: Google Drive               Storage: Google Drive (NO R2)
Domain: localhost:8787           Domain: staging-api.gameri-hss...   Domain: api.gameri-hss.edu.in
```

### Invariant:
$$\text{DEV} \ne \text{STAGING} \ne \text{PRODUCTION}$$

---

## 2. Component Bindings & Resources

| Resource Layer | Production Resource Name | Binding Name | Purpose |
|---|---|---|---|
| **Compute / API** | `ve-management-api` | N/A | Edge API Gateway handling HTTPS requests |
| **Relational DB** | `ve-management-db-prod` (`fcb05085...`) | `DB` | 33-table relational SQLite database in APAC |
| **Object Storage**| **Google Drive** | N/A | Dedicated binary storage for PDFs, photos, signatures (NO R2) |
| **Edge Secrets**  | `SESSION_SECRET`, `ADMIN_API_KEY` | Environment | Cryptographic token signing & RBAC |
| **Routing Zone**  | `api.gameri-hss.edu.in/*` | Custom Domain | Edge HTTPS entry point |
