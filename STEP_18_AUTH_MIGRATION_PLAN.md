# STEP 18 — CLOUDFLARE AUTHENTICATION & RBAC MIGRATION PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **READY FOR MIGRATION**

---

## 1. Authentication Architecture (Web Crypto API)

The Cloudflare Workers authentication layer replaces Google Apps Script `Utilities.computeHmacSha256Signature` with the standardized, high-performance W3C **Web Crypto API** (`crypto.subtle`):

1. **Password Hashing:**
   - Algorithm: **PBKDF2-SHA256**
   - Iterations: $100,000$ rounds
   - Salt: Cryptographically secure 16-byte random hex string (`crypto.getRandomValues`)
   - Zero Plaintext Passwords: Plaintext passwords are never stored or logged.
2. **Session Token Issuance:**
   - Format: Standard 3-part HMAC-SHA256 signed JWT (`header.payload.signature`)
   - Claims: `{ userId, role, name, schoolId, iat, exp, iss }`
   - Validity: 7 days with server-side revocation verification on account deactivation.

---

## 2. Server-Side RBAC & Scope Invariants

All access control checks execute strictly on the **Cloudflare Worker Edge** prior to database execution:

```
[ Incoming Request ]
         │
         ▼
[ Verify Token & Check Revocation ]
         │
         ├── Role: ADMIN / PRINCIPAL ──► Full Institutional Oversight
         │
         ├── Role: TEACHER ────────────► Scoped to Assigned Classes & Subjects
         │                                (Validated via staff_assignments query)
         │
         ├── Role: PARENT ─────────────► Scoped to Linked Children Only
         │                                (Validated via parent_student_links query)
         │
         └── Role: STUDENT ────────────► Scoped to Own Record Only
                                          (Validated via session.userId == studentId)
```

---

## 3. Secret Management & Zero-Leakage Policy

- Secrets (`SESSION_SECRET`, `ADMIN_API_KEY`) are injected via Cloudflare Environment Bindings / `wrangler secret put`.
- No secrets are ever stored in:
  - Git repository
  - Frontend JavaScript bundles
  - Android client APK assets
  - Edge console logs or audit trail entries
