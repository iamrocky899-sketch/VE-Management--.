# STEP 20 — CLOUDFLARE STAGING & SHADOW MODE ARCHITECTURE PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE STAGING SPECIFICATION**  
**Execution Mode:** **Parallel Shadow Mode (Zero Production Cutover)**

---

## 1. Environment Topology & Separation

```
[ Production Users (Portals & Android) ]
                   │
                   ▼
       [ GOOGLE APPS SCRIPT ] ──► (Authoritative Primary API)
                   │
                   ▼
         [ GOOGLE SHEETS ] ──────► (Authoritative Primary Database)
                   │
          (Read-Only Snapshot)
                   │
                   ▼
       [ CLOUDFLARE WORKERS ] ───► (Staging Shadow Mode / Comparison)
                   │
                   ▼
        [ CLOUDFLARE D1 ] ───────► (ve-management-db-staging)
```

### Environment Partitioning Matrix:

| Environment | Worker Name | D1 Database Binding | R2 Storage Binding | Traffic Role |
|---|---|---|---|---|
| **Development** | `ve-management-api` | `ve-management-db-dev` | `ve-management-storage-dev` | Local unit & integration testing |
| **Staging** | `ve-management-api-staging` | `ve-management-db-staging` | `ve-management-storage-staging` | **Shadow mode response benchmarking** |
| **Production** | `ve-management-api-prod` | `ve-management-db-prod` | `ve-management-storage-prod` | *Reserved for future cutover stage* |

---

## 2. Shadow Mode Operational Invariants

1. **Production Immunity:** Google Sheets, Google Apps Script, Firebase Hosting, and Android endpoints remain $100\%$ authoritative.
2. **Read-Only Shadowing:** Cloudflare Workers staging is populated via fresh read-only snapshots and executes identical read requests for side-by-side comparison.
3. **Zero Production Mutation:** Workers staging is prohibited from writing to production Google Sheets or production D1.
