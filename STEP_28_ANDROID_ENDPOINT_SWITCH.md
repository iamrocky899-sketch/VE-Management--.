# STEP 28 — ANDROID ENDPOINT SWITCH SPECIFICATION & AUDIT REPORT
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Scope:** Android Native & Hybrid Client API Endpoint Migration  
**Status:** **`100% COMPLETED & VALIDATED (DEBUG APK BUILT)`**  

---

## 1. Exact Android Files & Line Numbers Changed

### File 1: [`app/src/main/assets/libs/sync_manager.js`](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/assets/libs/sync_manager.js)
- **Line 10:**
  ```javascript
  // Old:
  const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec";
  // New:
  const DEFAULT_API_URL = "https://ve-management-api.iamrocky899.workers.dev";
  ```

### File 2: [`app/src/main/assets/index.html`](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/assets/index.html)
- **Line 3553 (Login Fallback):**
  ```javascript
  const apiUrl = window.SyncManager ? window.SyncManager.getApiUrl() : "https://ve-management-api.iamrocky899.workers.dev";
  ```
- **Line 3782 (Password Change Fallback):**
  ```javascript
  const apiUrl = window.SyncManager ? window.SyncManager.getApiUrl() : "https://ve-management-api.iamrocky899.workers.dev";
  ```
- **Line 3834 (Admin API Fallback):**
  ```javascript
  const apiUrl = window.SyncManager ? window.SyncManager.getApiUrl() : "https://ve-management-api.iamrocky899.workers.dev";
  ```

---

## 2. Preserved Android Native Features & Invariants

1. **Admin API Key Compatibility:** Supported via `x-api-key: [REDACTED — PRODUCTION ADMIN_API_KEY]` header.
2. **Offline Attendance Queue:** SQLite local queue remains intact (`SyncManager.enqueue`, `uploadPendingQueue`).
3. **Face Recognition Models:** Local model inference unaffected.
4. **Attendance Reminders:** Native Kotlin `AttendanceReminderScheduler.kt` and `BootCompletedReceiver.kt` unaffected.
5. **Google Drive Storage References:** File attachment handling compatible.

---

## 3. Build & APK Artifacts

- **Build Tool:** Gradle 9.4.1 / Android Gradle Plugin 8.9.1
- **Command:** `.\\gradlew assembleDebug`
- **Build Duration:** 34s (Exit Code `0`)
- **Debug APK Location:** [`app/build/outputs/apk/debug/app-debug.apk`](file:///c:/Users/HP/Downloads/ITGHSS2/app/build/outputs/apk/debug/app-debug.apk) (43.17 MB)
- **Production APK Release Status:** **NOT RELEASED AUTOMATICALLY** (Awaiting explicit human instruction).
