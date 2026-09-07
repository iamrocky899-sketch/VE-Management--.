# STEP 23 — PRODUCTION SECRETS & CREDENTIAL MANAGEMENT PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE SECURITY PLAN**

---

## 1. Secrets Inventory & Storage Guidelines

| Secret Identifier | Description | Injected Via | Git Status |
|---|---|---|---|
| `SESSION_SECRET` | 256-bit HMAC key for JWT session tokens | `wrangler secret put` | **EXCLUDED (Never in Git)** |
| `ADMIN_API_KEY` | High-entropy Administrative API token | `wrangler secret put` | **EXCLUDED (Never in Git)** |
| `CLOUDFLARE_API_TOKEN` | Deployment token with D1/R2/Workers permissions | CI/CD Secret | **EXCLUDED (Never in Git)** |

---

## 2. Zero-Leakage Policy
- Secrets are NEVER placed in frontend code, client bundles, or repository commit history.
- `ShadowObserver.sanitizePayload` scrubs all secret keys before logging.
