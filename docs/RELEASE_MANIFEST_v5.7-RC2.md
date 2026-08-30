# VE MANAGEMENT — Release Candidate 2 Manifest (v5.7-RC2)
**Release Candidate:** `v5.7-RC2`  
**Release Title:** `Login UI Modernization Iteration`  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Academic Session:** 2026–27  
**Build Date:** 2026-08-30  
**Baseline Parent:** `v5.7-RC1` (Phase 7 Step 12 Baseline)  
**Code Freeze Status:** **`FROZEN (RC2)`**

---

## 1. Release Scope & Purpose

This Release Candidate (`v5.7-RC2`) introduces a modernized institutional Login UI across both the Staff Portal and Parent/Student Portal while keeping backend Google Apps Script code, authentication logic, session token mechanisms, and database structures 100% untouched and protected.

### Modified Source Files (Login UI Only):
1. `staff-portal/src/components/Login.jsx` — Modernized Staff Login Component (Visual hierarchy, crest badge, password toggle, accessibility)
2. `staff-portal/src/index.css` — Modernized Staff Login Stylesheet (Glassmorphism, ambient gradients, responsive tokens)
3. `parent-portal/src/pages/LoginPage.jsx` — Modernized Parent/Student Login Component (Visual hierarchy, crest badge, password toggle, accessibility)
4. `parent-portal/src/index.css` — Modernized Parent/Student Login Stylesheet (Glassmorphism, ambient gradients, responsive tokens)

---

## 2. Release Component Matrix

| Component | Target Environment | Version / Identifier | Build Output Location | Status |
|---|---|---|---|---|
| **Staff Portal** | Web / Desktop / Mobile | `v1.0.0 (RC2)` (Vite / React 18) | `staff-portal/dist/` | ✅ **VERIFIED (RC2)** |
| **Parent & Student Portal** | Web / Mobile Responsive | `v1.0.0 (RC2)` (Vite / React 18) | `parent-portal/dist/` | ✅ **VERIFIED (RC2)** |
| **Android Admin App** | Android 11+ (Physical / Emulator) | `v5.7` (versionCode: 6) | `app/build/outputs/apk/debug/app-debug.apk` | ✅ **PRESERVED (RC1 baseline)** |
| **Google Apps Script Backend** | Google Cloud / Workspace | `v5.7-BACKEND` | `backend/` (20 Schema Sheets) | ✅ **100% UNTOUCHED** |
| **Cloud Synchronization Engine** | Android ↔ Apps Script | `v2.0-DELTA` | `app/src/main/assets/libs/sync_manager.js` | ✅ **100% UNTOUCHED** |
| **ASSEB Academic Calendar** | State Board 2026–27 | `254 Working Days` | `app/src/main/assets/libs/asseb_calendar_2026_27.js` | ✅ **100% UNTOUCHED** |

---

## 3. Quality Assurance & Verification Summary

* **Frontend Production Builds:**
  * `staff-portal`: `vite build` succeeded with 0 errors (1,600 modules transformed)
  * `parent-portal`: `vite build` succeeded with 0 errors (1,610 modules transformed)
* **Login UI Functional & Accessibility QA:**
  * `scratch/test_login_ui_qa.js`: **21 / 21 Tests PASSED (100%)**
  * Verified: School Crest branding, `GAMERI-HSS-001` badge, empty field validation, password toggle, loading spinner & `aria-busy`, error banners, responsive layout (<480px), keyboard navigation, WCAG focus states.
* **Core Domain Regressions (Phases 2 through 6):**
  * **28 / 28 Core Domain Suites PASSED (100%)**
* **Safety Invariants:**
  * Backend Apps Script files: 0 modified
  * Production Google Spreadsheet: 0 modified
  * `ADMIN_API_KEY` & Script Properties: 0 modified
  * Authentication logic & API contracts: 0 modified
