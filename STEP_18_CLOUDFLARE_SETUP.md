# STEP 18 — CLOUDFLARE SETUP & OPERATIONAL GUIDE
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **FOUNDATION READY**

---

## 1. Prerequisites & Tooling

To interact with the Cloudflare Worker and D1 database foundation locally:
1. Node.js $\ge 18.0.0$ and `npm` installed.
2. Cloudflare Wrangler CLI (`npm install -g wrangler` or `npx wrangler`).

---

## 2. Environment Setup & Configuration

### A. Environment Separation Matrix

| Environment | Purpose | Worker Name | D1 Database Binding | R2 Storage Binding |
|---|---|---|---|---|
| **Development** (`local`) | Local developer testing | `ve-management-api` | `ve-management-db-dev` | `ve-management-storage-dev` |
| **Staging** (`staging`) | Shadow dual-run validation | `ve-management-api-staging` | `ve-management-db-staging` | `ve-management-storage-staging` |
| **Production** (`production`) | Future cutover target | `ve-management-api-prod` | `ve-management-db-prod` | `ve-management-storage-prod` |

### B. Secret Provisioning (via Wrangler)

```bash
# Provision session encryption secrets
npx wrangler secret put SESSION_SECRET --env staging
npx wrangler secret put SESSION_SECRET --env production

# Provision Admin API Master Key
npx wrangler secret put ADMIN_API_KEY --env staging
npx wrangler secret put ADMIN_API_KEY --env production
```

### C. D1 Database Migration Commands

```bash
# Apply initial schema migration locally
npx wrangler d1 migrations apply ve-management-db-dev --local

# Apply initial schema migration to staging
npx wrangler d1 migrations apply ve-management-db-staging --remote --env staging

# Apply initial schema migration to production (Pre-cutover)
npx wrangler d1 migrations apply ve-management-db-prod --remote --env production
```

---

## 3. Capacity, Quota & Cost Review

| Cloudflare Service | Free Tier Allocation | Estimated Gameri HSS Monthly Usage | Headroom / Status |
|---|---|---|---|
| **Cloudflare Workers** | $100,000$ requests / day | $\sim 3,500$ requests / day | $> 96\%$ Headroom (Free Tier Sufficient) |
| **Cloudflare D1 Reads** | $5,000,000$ rows read / day | $\sim 85,000$ rows read / day | $> 98\%$ Headroom (Free Tier Sufficient) |
| **Cloudflare D1 Writes** | $100,000$ rows written / day | $\sim 1,200$ rows written / day | $> 98\%$ Headroom (Free Tier Sufficient) |
| **Cloudflare D1 Storage** | $5\text{ GB}$ total storage | $\sim 45\text{ MB}$ total storage | $> 99\%$ Headroom (Free Tier Sufficient) |
| **Cloudflare R2 Storage** | $10\text{ GB}$ storage / month | $\sim 350\text{ MB}$ storage / month | $> 96\%$ Headroom (Free Tier Sufficient) |
| **Cloudflare R2 Class A Ops** | $1,000,000$ writes / month | $\sim 2,500$ writes / month | $> 99\%$ Headroom (Free Tier Sufficient) |
| **Cloudflare R2 Class B Ops** | $10,000,000$ reads / month | $\sim 45,000$ reads / month | $> 99\%$ Headroom (Free Tier Sufficient) |

**Cost Summary:**
All projected operational workloads for Gameri Higher Secondary School comfortably reside within Cloudflare's generous free tier allocations, with zero anticipated cloud hosting costs during regular academic sessions.
