# STEP 27 — ANDROID APP CUTOVER PLAN
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Components:** Android App (`app/src/main/assets/`)  
**Status:** **PREPARED (UNAPPLIED)**  

---

## 1. Current State vs Target State Diff

### 1.1 `app/src/main/assets/libs/sync_manager.js` (Line 10)

```diff
- const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec";
+ const DEFAULT_API_URL = "https://ve-management-api.iamrocky899.workers.dev/api";
```

### 1.2 `app/src/main/assets/index.html` (Lines 3553, 3782, 3834)

```diff
- const apiUrl = window.SyncManager ? window.SyncManager.getApiUrl() : "https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec";
+ const apiUrl = window.SyncManager ? window.SyncManager.getApiUrl() : "https://ve-management-api.iamrocky899.workers.dev/api";
```

---

## 2. Controlled Execution Sequence (Upon Human Approval)

1. Update endpoint strings in `sync_manager.js` and `index.html`.
2. Build signed production APK:
   ```bash
   ./gradlew assembleRelease
   ```
3. Distribute release APK to faculty devices.
4. Verify Android offline SQLite $\rightarrow$ online SyncManager syncs with `ve-management-api`.
