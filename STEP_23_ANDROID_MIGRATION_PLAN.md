# STEP 23 — ANDROID NATIVE APPLICATION MIGRATION PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE SPECIFICATION**

---

## 1. Android Release & API Strategy

1. **Gradle Build Config Target:**
   - Update `app/build.gradle.kts` with `API_ENDPOINT_URL = "https://api.gameri-hss.edu.in/api"`.
2. **Backward Compatibility Guarantee:**
   - The Cloudflare Workers API supports the legacy `{ action: '...', ...payload }` format, ensuring zero native code refactoring needed in Kotlin classes (`MainActivity.kt`, `SyncAdapter.kt`).
3. **Release & Rollout:**
   - Generate release APK / AAB.
   - Stage rollout: 10% $\rightarrow$ 50% $\rightarrow$ 100% via MDM or Direct Sideload APK distribution.
