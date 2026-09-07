# STEP 28.2 — CLOUDFLARE FRONTEND HOSTING MIGRATION PLAN
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Target Architecture:** Cloudflare Workers Static Assets (Global Edge CDN)  
**Backend API:** `https://ve-management-api.iamrocky899.workers.dev` (Unchanged & Isolated)  
**Status:** **`ARCHITECTURAL PLAN PREPARED — DEPLOYMENT NOT PERFORMED (AWAITING APPROVAL)`**  

---

## 1. Cloudflare Frontend Hosting Architecture

### Architectural Decision: Dedicated Worker Per Frontend (Workers Static Assets)
Instead of conflating backend API execution with frontend UI assets or relying on deprecated Workers Sites (KV-based), each portal will utilize modern **Cloudflare Workers Static Assets**:

```
                                  [ Internet / Users ]
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
   [ Staff Portal Frontend ]    [ Parent Portal Frontend ]      [ Backend API Worker ]
    ve-management-staff          ve-management-parent           ve-management-api
    (Workers Static Assets)      (Workers Static Assets)        (NodeJS Compat + D1)
    .workers.dev URL:            .workers.dev URL:              .workers.dev URL:
    https://ve-management-staff. https://ve-management-parent.  https://ve-management-api.
    iamrocky899.workers.dev      iamrocky899.workers.dev        iamrocky899.workers.dev
               │                            │                            │
               └────────────────────────────┴────────────────────────────┤
                                                                         ▼
                                                                [ Cloudflare D1 ]
                                                             ve-management-db-prod
                                                                         │
                                                                         ▼
                                                                  [ Google Drive ]
                                                             (Authoritative File Store)
```

### Why This Architecture Is Safest:
1. **API Isolation:** The backend API Worker (`ve-management-api`) is strictly separated from frontend assets. Deploying a UI change never modifies, restarts, or risks API routing.
2. **Dedicated `.workers.dev` URLs Before DNS:**
   - Staff Portal: `https://ve-management-staff.iamrocky899.workers.dev`
   - Parent Portal: `https://ve-management-parent.iamrocky899.workers.dev`
   - API Backend: `https://ve-management-api.iamrocky899.workers.dev`
   Both portals can be tested in production *before* any DNS changes are made to `staff.gameri-hss.edu.in` and `parent.gameri-hss.edu.in`.
3. **Built-in SPA Routing:** Native Cloudflare `html_handling = "single-page-application"` and `not_found_handling = "single-page-application"` automatically routes deep client routes (`/dashboard`, `/marks`, `/notices`, `/attendance`) back to `index.html` without 404 errors.
4. **Zero R2 Requirement:** Frontend static assets are distributed natively via Cloudflare's global edge network asset pipeline without Cloudflare R2.
5. **Zero Additional Databases:** Uses existing D1 `ve-management-db-prod`.

---

## 2. Configuration Specifications

### A. Staff Portal Configuration (`staff-portal/wrangler.toml`)
```toml
# ============================================================
# VE MANAGEMENT — STAFF PORTAL CLOUDFLARE HOSTING
# ============================================================
name = "ve-management-staff"
main = "worker.js"
compatibility_date = "2026-09-01"
account_id = "5053705be2c3f25dc008a1d7237cdc8d"
workers_dev = true

[assets]
directory = "./dist"
binding = "ASSETS"
html_handling = "single-page-application"
not_found_handling = "single-page-application"
```

### Staff Portal Worker Script (`staff-portal/worker.js`)
```javascript
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
};
```

---

### B. Parent Portal Configuration (`parent-portal/wrangler.toml`)
```toml
# ============================================================
# VE MANAGEMENT — PARENT PORTAL CLOUDFLARE HOSTING
# ============================================================
name = "ve-management-parent"
main = "worker.js"
compatibility_date = "2026-09-01"
account_id = "5053705be2c3f25dc008a1d7237cdc8d"
workers_dev = true

[assets]
directory = "./dist"
binding = "ASSETS"
html_handling = "single-page-application"
not_found_handling = "single-page-application"
```

### Parent Portal Worker Script (`parent-portal/worker.js`)
```javascript
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
};
```

---

## 3. Production Deployment Commands (For Future Execution)

### Step 1: Deploy Staff Portal to Cloudflare
```bash
cd staff-portal
npm run build
npx wrangler deploy --config wrangler.toml
```
*Outputs:* `https://ve-management-staff.iamrocky899.workers.dev`

### Step 2: Deploy Parent Portal to Cloudflare
```bash
cd parent-portal
npm run build
npx wrangler deploy --config wrangler.toml
```
*Outputs:* `https://ve-management-parent.iamrocky899.workers.dev`

---

## 4. Rollback Method to Firebase

If any unexpected edge routing anomaly occurs on Cloudflare frontend hosting:
1. **Zero Backend Impact:** The API Worker `ve-management-api` and D1 database remain unchanged.
2. **Instant Frontend Fallback:** Firebase Hosting sites (`https://ghss-75f48.web.app` and `https://ve-management-parent.web.app`) remain active and on standby. Users can immediately navigate to the Firebase URLs.
3. **No Teardown Needed:** Cloudflare frontend workers can remain in place for diagnostics without interfering with Firebase.

---

## 5. Post-Deployment Verification Procedure

1. **HTTP Status & Asset Loading:**
   - Fetch `https://ve-management-staff.iamrocky899.workers.dev` (Verify HTTP 200 and CSS/JS asset resolution).
   - Fetch `https://ve-management-parent.iamrocky899.workers.dev` (Verify HTTP 200 and CSS/JS asset resolution).
2. **SPA Deep-Linking:**
   - Request `https://ve-management-staff.iamrocky899.workers.dev/dashboard` directly (Verify `index.html` fallback, HTTP 200).
   - Request `https://ve-management-parent.iamrocky899.workers.dev/notices` directly (Verify `index.html` fallback, HTTP 200).
3. **API Dispatch Verification:**
   - Open browser network console and confirm all API fetches target `https://ve-management-api.iamrocky899.workers.dev`.
   - Confirm zero requests are sent to Google Apps Script.
4. **Live Authentication & Data Integrity:**
   - Test Teacher login (`9101004032`) on Staff Portal.
   - Test Parent login (`9365108860`) on Parent Portal.
   - Verify non-mutating data retrieval (students, attendance, notes, notices, documents).

---

## 6. Cloudflare Account & Token Permissions Assessment

- **Account ID:** `5053705be2c3f25dc008a1d7237cdc8d`
- **Permissions:** Verified active for Worker deployments, D1 database execution, and secret management.
- **Wrangler Version:** Modern `@cloudflare/workers-types` & `wrangler` v3+ supports native `[assets]` binding.
- **Manual Actions Required from Human Owner:** Explicit authorization before executing `npx wrangler deploy` for either frontend.
