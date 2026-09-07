# STEP 21 — LIMITED PRODUCTION SHADOW EXECUTION PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE OPERATIONAL PLAN**  
**Execution Guardrail:** **Controlled Read-Only Production Shadow (Zero Production Cutover)**

---

## 1. Safety Principles & Execution Rules

1. **Production System Remains 100% Authoritative:** Google Sheets, Google Apps Script (`Code.gs`), Firebase Hosting, and Android endpoints remain completely authoritative.
2. **Read-Only Shadowing Only:** Only idempotent read endpoints are shadowed. Mutation/write operations are blocked by `ShadowObserver`.
3. **Non-Blocking Asynchronous Execution:** Shadow processing operates in a fire-and-observe mode. No shadow failure, delay, or timeout may delay or alter production responses.
4. **Instant Kill Switch:** Setting `PRODUCTION_SHADOW_ENABLED=false` immediately halts shadow traffic.
5. **Data Minimization:** Zero credentials, tokens, or raw student PII are stored in shadow logs.

---

## 2. Phased Traffic Progression Strategy

```
[ Phase A: 10% Read Sampling ] ──► [ Phase B: 50% Read Sampling ] ──► [ Phase C: 100% Read Sampling ]
         │                                   │                                    │
    (Validate 0 Mismatches)             (Validate 0 Mismatches)             (Verify Edge Stability)
```

- Progression between phases is strictly manual and requires 0 unexplained mismatches.
- Write operations remain blocked across all shadow phases.
