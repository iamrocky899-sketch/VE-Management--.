# STEP 28 — POST-CUTOVER OBSERVATION PLAN
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Observation Window:** 24–48 Hours Post-Traffic Adoption  
**Primary Target:** Cloudflare Worker `ve-management-api` + D1 `ve-management-db-prod`  

---

## 1. Key Metrics & Health Indicators

1. **Authentication & Session Tokens:**
   - Monitor for 401/403 spikes during staff and parent logins.
   - Verify JWT claim decoding across Teacher, Parent, Student, and Principal roles.

2. **Authorization & Privacy Enforcement:**
   - Verify parent-child isolation: Zero unauthorized cross-parent queries.
   - Verify teacher academic scope: Teachers access only assigned classes.
   - Verify student self-record isolation.

3. **Data Integrity & D1 Performance:**
   - D1 query execution times ($< 50\text{ms}$ nominal).
   - Zero SQL constraint violations or lock contentions.
   - 33 tables maintain continuous primary-key integrity.

4. **Document & Media Storage Routing:**
   - Verify all student document links resolve against Google Drive without 404s.
   - Confirm Cloudflare R2 remains disabled.

---

## 2. Thresholds for Triggering Rollback

| Observed Event | Severity | Threshold | Action |
|---|---|---|---|
| Parent Cross-Child Data Leak | **CRITICAL** | 1 instance | **IMMEDIATE ROLLBACK** |
| Teacher Academic Scope Bypass | **CRITICAL** | 1 instance | **IMMEDIATE ROLLBACK** |
| Attendance Write Failure / Loss | **CRITICAL** | $> 1\%$ error rate | **IMMEDIATE ROLLBACK** |
| Worker 5xx Error Spike | **HIGH** | $> 2\%$ over 5 min | **IMMEDIATE ROLLBACK** |
| Document Link Resolution Failure | **MEDIUM** | Repeated 404s | Investigate Google Drive URL mapping |
