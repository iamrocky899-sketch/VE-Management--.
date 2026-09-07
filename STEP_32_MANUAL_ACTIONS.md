# STEP 32 — OPERATIONAL MANUAL ACTIONS & RUNBOOK
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Timestamp:** 2026-09-03 19:12 IST (`2026-09-03T13:42:00Z`)  
**Status:** **`STEP 32 COMPLETED — ALL AUTOMATED ACTIONS PAUSED`**  
**Deliverable File:** `STEP_32_MANUAL_ACTIONS.md`  

---

## 1. Summary of Actions Completed in Step 32

| Action Completed | Target Resource / Environment | Result & Evidence |
|---|---|---|
| **AST & Substring Scan** | `staff-portal/src`, `parent-portal/src` | 0 occurrences of `script.google.com`, 0 occurrences of `92.5`, 0 fake attendance arrays. |
| **Staff Production Build**| `staff-portal/dist` | Compiled `index-1E1hFbN7.js` (676.21 kB) targeting Cloudflare Worker API. |
| **Parent Production Build**| `parent-portal/dist` | Compiled `index-HO7iJIAr.js` (35.36 kB) targeting Cloudflare Worker API. |
| **Firebase Staff Deployment**| `ghss-75f48.web.app` | Version finalized and released via Firebase CLI (Exit Code 0). |
| **Firebase Parent Deployment**| `ve-management-parent.web.app` | Version finalized and released via Firebase CLI (Exit Code 0). |
| **Live CDN Bundle Audit** | Public Web URLs | Probed live JS bundles on Firebase CDN: 100% targeting Cloudflare Worker API. |
| **Live Functional UAT** | Portals & Cloudflare Worker API | 15/15 Staff checks PASS, 11/11 Parent checks PASS, 6/6 Attendance checks PASS. |
| **Standby Verification** | Google Apps Script + Sheets | Responding HTTP 200 (`status: ONLINE`). Standby preserved intact. |

---

## 2. Sequential Post-Cutover Operational Matrix

```
[Step 32: Firebase Cutover] (COMPLETED)
            │
            ▼
[Phase 32.1: 72-Hour Observation Period] (CURRENT OPERATIONAL STATE)
            │
            ▼
[Step 33: Android Client Migration] (FUTURE GATE — PENDING EXPLICIT APPROVAL)
            │
            ▼
[Step 34: Secret Rotation (ADMIN_API_KEY)] (DEFERRED POST-ANDROID ROLLOUT)
            │
            ▼
[Step 35: Legacy Standby Decommissioning] (DEFERRED — 14-DAY MINIMUM)
```

---

## 3. Human Operator Actions for Current Phase (Phase 32.1)

### Action 1: Confirm Live Portal Access
- **Staff Portal URL:** `https://ghss-75f48.web.app`
- **Parent Portal URL:** `https://ve-management-parent.web.app`
- **Instruction:** Instruct faculty and guardians to access the official portals at these Firebase URLs. Confirm user satisfaction and absence of UI rendering issues.

### Action 2: Monitor Real-Time Telemetry (72-Hour Window)
- **Instruction:** Observe Cloudflare Dashboard (`ve-management-api`) and Cloudflare D1 console for query latency, error rates, and write throughput.

---

## 4. Deferred Future Actions (DO NOT EXECUTE AUTOMATICALLY)

### Action 3: Android Native Client Migration (Step 33)
- **Policy:** **HOLD — DO NOT DISTRIBUTE APK YET.**
- **Reason:** Physical devices in the field must be migrated in a planned, scheduled rollout with institutional support.
- **Future Procedure:**
  1. Assemble signed release APK using school keystore (`app-release-signed.apk`).
  2. Distribute to faculty devices.
  3. Verify physical tablet/phone attendance sync directly to Cloudflare Worker API.

### Action 4: Secret Key Rotation (`ADMIN_API_KEY`) (Step 34)
- **Policy:** **HOLD — DO NOT ROTATE SECRETS.**
- **Reason:** Installed Android clients hold the existing sync credential.
- **Future Procedure:** Rotate via `wrangler secret put ADMIN_API_KEY` only after 100% of faculty Android devices have installed the modern app.

### Action 5: Standby Decommissioning (Step 35)
- **Policy:** Retain Google Sheets and Apps Script for at least **14 days**.
- **Future Procedure:** Decommission only after formal written administrative sign-off.

---

## 5. Strict Operational Invariants

Even with the successful completion of Step 32:
- ❌ **DO NOT configure or purchase a custom domain.**
- ❌ **DO NOT perform any DNS registrar modifications.**
- ❌ **DO NOT distribute or sign Android APKs.**
- ❌ **DO NOT rotate `ADMIN_API_KEY`.**
- ❌ **DO NOT disable Google Apps Script.**
- ❌ **DO NOT delete or alter Google Sheets records.**
- ❌ **DO NOT delete Cloudflare validation workers (`ve-management-staff`, `ve-management-parent`).**
- ❌ **DO NOT automatically proceed to Step 33 without explicit human approval.**
