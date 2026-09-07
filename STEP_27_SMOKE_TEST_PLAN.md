# STEP 27 — POST-CUTOVER SMOKE TEST PLAN
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Scope:** Post-Cutover Live End-to-End Validation  
**Status:** **READY FOR EXECUTION POST-TRAFFIC SWITCH**  

---

## 1. Post-Cutover Smoke Test Protocol

| Test Phase | User Role | Test Action | Expected Result |
|---|---|---|---|
| **ST-01** | Public | Access `GET /api/ping` | `status: ONLINE`, `env: production` |
| **ST-02** | Public | Scan QR Code `VRF_MS_001` | Marksheet verified for `Abhinash Chetry` |
| **ST-03** | Faculty | Login via `staff.gameri-hss.edu.in` (`9101004032`) | Dashboard loads with Class 9-12 rosters |
| **ST-04** | Faculty | View Class 9A Attendance History | 40-student roster returned from D1 |
| **ST-05** | Parent | Login via `parent.gameri-hss.edu.in` (`9365108860`) | Child `Abhinash Chetry` displayed |
| **ST-06** | Parent | View Attendance & Notices | Historical attendance & 3,160 notices load |
| **ST-07** | Android | Open App $\rightarrow$ Trigger SyncManager | 100% sync success against `ve-management-api` |

---

## 2. Safety Guidelines

- Smoke testing must begin with read-only validation.
- Live mutation validation (e.g. marking today's real attendance) should be done only by authentic faculty during school hours.
