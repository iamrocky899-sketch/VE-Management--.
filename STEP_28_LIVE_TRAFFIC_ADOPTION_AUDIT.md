# STEP 28.1 — LIVE CLIENT TRAFFIC ADOPTION FORENSIC AUDIT
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Audit Timestamp:** 2026-09-03 17:19 IST (`2026-09-03T11:49:42.679Z`)  
**Audit Scope:** 100% Read-Only Forensic Verification of Real Deployed Assets vs Local Builds  

---

## 1. Executive Summary & Forensic Findings

A comprehensive read-only forensic inspection was conducted to distinguish between:
1. **Source-code migration** (Local configuration updated)
2. **Local build migration** (`dist/` bundles compiled with Worker URL)
3. **Deployed production portal migration** (Live Firebase Hosting assets)
4. **Installed Android-client migration** (Physical device installations)
5. **Actual production traffic adoption** (Live incoming HTTP traffic)

### Crucial Findings:
- **Cloudflare Worker & D1 Backend:** **`LIVE & OPERATIONAL`** (`ve-management-api` + `ve-management-db-prod` 33 tables).
- **Staff Portal:** Source `.env` and local `dist/` are migrated to Cloudflare Worker, but **live Firebase Hosting (`https://ghss-75f48.web.app`) is still serving the previous build (`index-mfgAPtFF.js`) pointing to Google Apps Script**.
- **Parent Portal:** Source `.env` and local `dist/` are migrated to Cloudflare Worker, but **live Firebase Hosting (`https://ve-management-parent.web.app`) is still serving the previous build (`index-BEiqDKdW.js`) pointing to Google Apps Script**.
- **Android Client:** Source and local APKs are migrated/built, but **the release artifact is unsigned (`app-release-unsigned.apk`), has NOT been distributed, and installed user devices are NOT yet migrated**.
- **Apps Script + Google Sheets:** Remains fully active, receiving all current live client traffic, and serves as the authoritative standby rollback target.

---

## 2. 16-Category Authority Matrix

| # | Category | Status | Detailed Forensic Evidence |
|---|---|---|---|
| **1** | **Backend API** | **`PASS`** | Cloudflare Worker `ve-management-api` (`https://ve-management-api.iamrocky899.workers.dev`) verified live, responsive, and handling all API routes. |
| **2** | **Database** | **`PASS`** | Cloudflare D1 `ve-management-db-prod` (`fcb05085-a97c-4f4a-8a55-7f06cd15460a`) verified at 100% parity across all 33 tables. |
| **3** | **Staff Portal source** | **`PASS`** | [`staff-portal/.env`](file:///c:/Users/HP/Downloads/ITGHSS2/staff-portal/.env) configured with `VITE_APPS_SCRIPT_URL=https://ve-management-api.iamrocky899.workers.dev`. |
| **4** | **Staff Portal local build** | **`PASS`** | [`staff-portal/dist/assets/index-eb0Al_zY.js`](file:///c:/Users/HP/Downloads/ITGHSS2/staff-portal/dist/assets/index-eb0Al_zY.js) compiled with Cloudflare Worker target embedded. |
| **5** | **Staff Portal live deployment** | **`NOT COMPLETE`** | Live Firebase site `https://ghss-75f48.web.app` serves bundle `index-mfgAPtFF.js` which points to Google Apps Script. `dist` has not been deployed. |
| **6** | **Parent Portal source** | **`PASS`** | [`parent-portal/.env`](file:///c:/Users/HP/Downloads/ITGHSS2/parent-portal/.env) configured with `VITE_API_BASE_URL=https://ve-management-api.iamrocky899.workers.dev`. |
| **7** | **Parent Portal local build** | **`PASS`** | [`parent-portal/dist/assets/`](file:///c:/Users/HP/Downloads/ITGHSS2/parent-portal/dist/assets/) chunks compiled with Cloudflare Worker target embedded. |
| **8** | **Parent Portal live deployment** | **`NOT COMPLETE`** | Live Firebase site `https://ve-management-parent.web.app` serves bundle `index-BEiqDKdW.js` which points to Google Apps Script. `dist` has not been deployed. |
| **9** | **Android source** | **`PASS`** | [`app/src/main/assets/libs/sync_manager.js`](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/assets/libs/sync_manager.js) and `index.html` configured with Cloudflare Worker API. |
| **10** | **Android release artifact** | **`PASS`** | Local build [`app/build/outputs/apk/release/app-release-unsigned.apk`](file:///c:/Users/HP/Downloads/ITGHSS2/app/build/outputs/apk/release/app-release-unsigned.apk) (33.62 MB) successfully assembled. |
| **11** | **Android signed release** | **`NOT COMPLETE`** | Release APK is unsigned; production keystore signing has not been executed. |
| **12** | **Android distribution** | **`NOT COMPLETE`** | Artifact not published to Play Store or direct APK distribution channel. |
| **13** | **Android installed-device migration** | **`UNKNOWN`** | Active physical devices in the field continue running previously installed release pointing to Apps Script. |
| **14** | **Apps Script rollback backend** | **`STANDBY`** | Google Apps Script Web App is active, operational, and handling current live client traffic. |
| **15** | **Google Sheets rollback database** | **`STANDBY`** | Google Sheets database remains intact and operational as authoritative rollback source. |
| **16** | **Google Drive storage** | **`PASS`** | Authoritative file and document attachment links operate seamlessly against Google Drive. |

---

## 3. Android Client Migration Specifics

- **SOURCE MIGRATED:** **`yes`**
- **RELEASE BUILT:** **`yes`** (`app-release-unsigned.apk` 33.62 MB)
- **SIGNED RELEASE:** **`no`**
- **DISTRIBUTED:** **`no`**
- **INSTALLED ON USER DEVICES:** **`unknown`**
- **ACTUAL ANDROID TRAFFIC MIGRATED:** **`no`**

---

## 4. Exact Manual Deployment Steps (DO NOT EXECUTE AUTOMATICALLY)

When human authorization is granted to complete live hosting deployment:

### Step 1: Deploy Staff Portal to Firebase Hosting
```bash
cd staff-portal
npm run build
firebase deploy --only hosting --project ghss-75f48
```

### Step 2: Deploy Parent Portal to Firebase Hosting
```bash
cd parent-portal
npm run build
firebase deploy --only hosting --project ve-management-parent
```

### Step 3: Sign & Distribute Android Production APK
```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore <KEYSTORE_FILE> app/build/outputs/apk/release/app-release-unsigned.apk <KEY_ALIAS>
zipalign -v 4 app/build/outputs/apk/release/app-release-unsigned.apk app-release-signed.apk
```
Distribute `app-release-signed.apk` to staff devices.
