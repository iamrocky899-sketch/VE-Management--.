# STEP 21 — SHADOW OBSERVATION ARCHITECTURE
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE SYSTEM DESIGN**

---

## 1. Dual-Path Observation Topology

```
                     REAL PRODUCTION USERS (Staff / Parents / Android)
                                            │
                                            ▼
                          [ CLIENT APPLICATION DISPATCHER ]
                                     │            │
            (Authoritative Primary) │            │ (Non-blocking Shadow Observation)
                                     ▼            ▼
                           [ APPS SCRIPT API ]  [ SHADOW OBSERVER ]
                                     │            │ (Check Kill Switch & Read-Only)
                                     ▼            ▼
                            [ GOOGLE SHEETS ]   [ WORKERS STAGING ]
                                     │            │
                                     │            ▼
                                     │      [ D1 STAGING ]
                                     │            │
                                     ▼            ▼
                            [ SHADOW COMPARATOR HARNESS ]
                                     │
                                     ▼
                            [ PARITY METRICS & LOGS ]
```

---

## 2. Failure Isolation Guarantee

- The client application awaits the response from **Google Apps Script exclusively**.
- `ShadowObserver` wraps Workers staging calls in a `Promise.race` with a **$250\text{ms}$ execution budget**.
- If Workers fails, times out, or errors out, the production response is returned immediately with zero degradation.
