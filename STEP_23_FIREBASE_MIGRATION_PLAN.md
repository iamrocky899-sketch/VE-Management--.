# STEP 23 — FIREBASE HOSTING MIGRATION & PORTAL ROLLOUT PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE SPECIFICATION**

---

## 1. Firebase Portal Cutover Protocol

1. **Update Portal Environment Configurations:**
   - `parent-portal/.env.production`: `VITE_API_BASE_URL=https://api.gameri-hss.edu.in/api`
   - `staff-portal/.env.production`: `VITE_API_BASE_URL=https://api.gameri-hss.edu.in/api`
2. **Build Production Asset Bundles:**
   - `cd parent-portal && npm run build`
   - `cd staff-portal && npm run build`
3. **Deploy to Firebase Hosting:**
   - `firebase deploy --only hosting:parent-portal,hosting:staff-portal`
4. **Smoke-Test Live Portals:**
   - Verify login, attendance 40 roster, parent multi-child isolation, and marks calculation.
