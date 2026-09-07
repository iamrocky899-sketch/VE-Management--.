# STEP 18 — CLOUDFLARE TO GOOGLE APPS SCRIPT ROLLBACK PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **READY & VERIFIED**

---

## 1. Rollback Triggers & Thresholds

An immediate emergency rollback to the original Google Apps Script + Firebase infrastructure will be triggered if any of the following conditions occur during migration or pilot testing:

| Trigger ID | Condition | Critical Threshold | Required Action |
|---|---|---|---|
| **TR-01** | Attendance Roster Shrinkage | Any session where `total_students` drops below enrolled roster | Immediate Rollback |
| **TR-02** | Data Privacy / Leakage Breach | Cross-student or cross-parent unauthorized data access | Immediate Rollback |
| **TR-03** | High Edge Failure Rate | Worker 5xx error rate $> 0.5\%$ over a 10-minute window | Immediate Rollback |
| **TR-04** | Authentication Failure | Valid users unable to log in via PBKDF2/HMAC | Immediate Rollback |
| **TR-05** | D1 Query Deadlock / Quota | D1 rate limit or transaction failure exceeding 5 instances | Immediate Rollback |

---

## 2. Emergency Rollback Execution Sequence

```
1. TRIGGER IDENTIFIED ──► 2. TRAFFIC REVERSION ──► 3. AUTHORITATIVE RESUME ──► 4. POST-MORTEM AUDIT
   (Automated alert          (Point DNS / Base URL       (Google Apps Script       (Log incident,
    or Admin action)          back to Firebase / GAS)     resumes full authority)   preserve D1 logs)
```

**Zero-Data-Loss Guarantee:**
Because Google Sheets remains the primary authoritative data store throughout Step 18 and dual-run shadow testing, **zero production data can be lost** during any rollback event.
