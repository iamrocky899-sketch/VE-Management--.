# STEP 22 — PRODUCTION CUTOVER EMERGENCY ROLLBACK PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE EMERGENCY SPECIFICATION**

---

## 1. Emergency Rollback Triggers

An immediate emergency rollback to Google Apps Script will be triggered if any of the following occur post-cutover:

| Trigger ID | Failure Condition | Maximum Tolerance Window | Action |
|---|---|---|---|
| **TR-01** | Attendance roster shrinkage ($< 40$ students for Class 9A) | Immediate | **EXECUTE ROLLBACK** |
| **TR-02** | Cross-student or parent privacy breach (IDOR / Unauthorized data leak) | Immediate | **EXECUTE ROLLBACK** |
| **TR-03** | Data corruption or lost marks submissions | $< 5\text{ minutes}$ | **EXECUTE ROLLBACK** |
| **TR-04** | Edge Worker HTTP 5xx error rate $> 1.0\%$ | $> 10\text{ minutes}$ | **EXECUTE ROLLBACK** |
| **TR-05** | Persistent edge latency $> 1,000\text{ms}$ | $> 15\text{ minutes}$ | **EXECUTE ROLLBACK** |

---

## 2. 5-Minute Reversion Procedure

1. Re-point Client API Dispatchers in Portals back to Google Apps Script Web App URL.
2. Redeploy Firebase Hosting static assets (`firebase deploy --only hosting`).
3. Re-enable write access on authoritative Google Sheets.
4. Issue administrative status notice to school portal users.
