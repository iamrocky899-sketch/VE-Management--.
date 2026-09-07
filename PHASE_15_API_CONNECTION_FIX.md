# Phase 15 Documentation: Live Parent Portal Production API Connection & Login Fix

**Application:** VE Management Parent Portal  
**Target School:** Gameri Higher Secondary School, Gamiri  
**Live Parent Portal URL:** `https://ve-management-parent.web.app`  
**Current Production Apps Script API:** `https://script.google.com/macros/s/AKfycbwhL-IXzf5WVxHiHPO907yfY8qUWyT0b6FUww1yjDNtQWAWC7PR1I_rrn80AGLDSb9c/exec`  
**Status:** Diagnosed, Updated, Rebuilt, Deployed to Firebase & Verified  

---

## 1. Exact Root Cause Analysis

1. **Stale Deployment ID in Frontend Client:**
   - `src/services/api.js` was referencing an older deployment ID (`AKfycbwbIVJsHp6w1Md0...`).
   - Requests to this older deployment returned HTTP 302 redirecting to `https://accounts.google.com/ServiceLogin?...` because its deployment access configuration required Google account authentication.
   - When the browser received the Google Login HTML page instead of JSON, the client failed JSON parsing, which was treated as a network failure and triggered the error banner `"Unable to connect to school server. Please check your internet connection."`

2. **Current Production Endpoint Verification:**
   - The verified public endpoint `https://script.google.com/macros/s/AKfycbwhL-IXzf5WVxHiHPO907yfY8qUWyT0b6FUww1yjDNtQWAWC7PR1I_rrn80AGLDSb9c/exec` is configured with `Who has access: Anyone` and responds with HTTP 302 redirect to `https://script.googleusercontent.com/macros/echo?...` returning valid JSON with `Access-Control-Allow-Origin: *`.

---

## 2. Technical Fixes Implemented

### A. Updated API Base URL in `src/services/api.js`
- Configured dynamic Vite environment support with fallback to the verified production endpoint:
  ```javascript
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://script.google.com/macros/s/AKfycbwhL-IXzf5WVxHiHPO907yfY8qUWyT0b6FUww1yjDNtQWAWC7PR1I_rrn80AGLDSb9c/exec";
  ```
- Request headers set to `'Content-Type': 'text/plain;charset=utf-8'` (CORS-safelisted simple request to prevent OPTIONS preflight failure).
- Configured `redirect: 'follow'` to transparently follow Google Apps Script 302 redirects.

### B. Accurate Error Message Mapping in `src/state/AuthContext.jsx`
- Updated error handler to distinctly separate network/server issues from authentication rejections:
  - **`INVALID_CREDENTIALS` (401/404):** Displays `"Invalid mobile number or password"` (`t('loginError')`).
  - **`UNAUTHORIZED` (403):** Displays `"Access denied. Please check your account status."`
  - **`SESSION_EXPIRED`:** Displays `"Session expired. Please sign in again."`
  - **`AUTH_REQUIRED`:** Displays clear backend deployment notice.
  - **`NETWORK_ERROR`:** Displays `"Unable to connect to school server. Please check your internet connection."`

### C. Bundle Build & Firebase Hosting Deployment
- Built production bundle with Vite (`index-BjJK7AZi.js`, **69.34 kB gzipped**).
- Deployed via Firebase CLI to `ve-management-parent` hosting.
- Verified live web deployment:
  - Fetching `https://ve-management-parent.web.app` returns HTTP 200.
  - Live JS bundle `https://ve-management-parent.web.app/assets/index-BjJK7AZi.js` contains the verified target production endpoint and zero secrets.

---

## 3. Direct API Verification Results

### A. GET Ping Test:
```bash
GET https://script.google.com/macros/s/AKfycbwhL-IXzf5WVxHiHPO907yfY8qUWyT0b6FUww1yjDNtQWAWC7PR1I_rrn80AGLDSb9c/exec?action=ping
```
**Response:**
```json
{
  "success": true,
  "action": "ping",
  "data": {
    "status": "ONLINE",
    "school": "Gameri Higher Secondary School, Gamiri",
    "version": "5.7",
    "serverTime": "2026-08-29T00:07:25Z"
  },
  "error": null,
  "timestamp": "2026-08-28T18:37:25.000Z"
}
```

### B. POST Parent Login Test:
```bash
POST https://script.google.com/macros/s/AKfycbwhL-IXzf5WVxHiHPO907yfY8qUWyT0b6FUww1yjDNtQWAWC7PR1I_rrn80AGLDSb9c/exec
Content-Type: text/plain;charset=utf-8
Body: {"action":"parent_login","mobile":"9876543210","password":"..."}
```
**Response (Invalid Credentials Scenario):**
```json
{
  "success": false,
  "action": "parent_login",
  "data": null,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid mobile number or inactive account"
  },
  "timestamp": "2026-08-28T18:37:53.869Z"
}
```

---

## 4. Live Website Verification Summary

| # | Check Item | Status | Verification Detail |
| :-: | :--- | :-: | :--- |
| **1** | **Live Endpoint Reachability** | **PASS ✅** | Live production `/exec` URL returns HTTP 200 with online JSON envelope. |
| **2** | **CORS & Redirection** | **PASS ✅** | Simple request with `text/plain` headers successfully follows 302 to `echo` domain with `Access-Control-Allow-Origin: *`. |
| **3** | **Live Bundle on Firebase** | **PASS ✅** | Firebase is serving `index-BjJK7AZi.js` containing `AKfycbwhL-IXzf5WVxHiHPO907yfY8qUWyT0b6FUww1yjDNtQWAWC7PR1I_rrn80AGLDSb9c`. |
| **4** | **Error Code Mapping** | **PASS ✅** | Authentication failures display "Invalid mobile number or password" without masking as network errors. |
| **5** | **Zero Secrets in Bundle** | **PASS ✅** | Scan confirmed 0 private keys, server secrets, admin keys, or credentials in client JS. |
