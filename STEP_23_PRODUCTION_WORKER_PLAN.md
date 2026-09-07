# STEP 23 — PRODUCTION WORKER PACKAGING & CONFIGURATION PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE SPECIFICATION**

---

## 1. Production Worker Packaging

- **Main Entry Point:** `cloudflare/src/index.js`
- **Runtime Environment:** Cloudflare Workers V8 with `nodejs_compat`
- **Deployment Target:** `env.production` in `wrangler.toml`

---

## 2. Production Security & CORS Middleware

```javascript
const PRODUCTION_CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://staff.gameri-hss.edu.in,https://parent.gameri-hss.edu.in',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-School-ID',
  'Access-Control-Max-Age': '86400'
};
```

---

## 3. Production Deployment Command (Dry-Run / Ready)
```bash
# Dry-run validation of production worker bundle
npx wrangler deploy --dry-run --env production
```
