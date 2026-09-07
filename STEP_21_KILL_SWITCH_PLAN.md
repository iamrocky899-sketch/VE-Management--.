# STEP 21 — SHADOW KILL SWITCH OPERATIONAL RUNBOOK
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE OPERATIONAL KILL SWITCH**

---

## 1. Instant Shadow Deactivation

The shadow observation layer is governed by a server-side kill switch:
```javascript
PRODUCTION_SHADOW_ENABLED = false;
```

### Kill Switch Activation Mechanics:
1. When set to `false`, `ShadowObserver.isEligibleForShadow` immediately returns `{ eligible: false, reason: 'KILL_SWITCH_ACTIVE' }`.
2. All shadow observation logic is bypassed with $0\text{ms}$ overhead.
3. Production traffic proceeds strictly through Google Apps Script as normal.
4. Activation is auditable and takes effect in real-time.
