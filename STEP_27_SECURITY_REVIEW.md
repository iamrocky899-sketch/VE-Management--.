# STEP 27 — PRE-CUTOVER SECURITY & ISOLATION REVIEW
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **SECURITY HARDENED — ZERO SECRETS EXPOSED**  

---

## 1. Security Architecture & Boundary Verification

1. **Worker Secret Storage:**  
   `ADMIN_API_KEY` and `SESSION_SECRET` are managed strictly via Cloudflare Encrypted Secrets (`secret_text`). Zero secrets are committed in repository files or logs.
2. **JWT Session Lifecycle:**  
   Issued tokens are signed using HMAC SHA-256 via Web Crypto API on Cloudflare Edge with 24-hour expiration.
3. **Role-Based Access Control (RBAC):**  
   - `PRINCIPAL`: Full institutional access across all academic classes.
   - `TEACHER`: Scoped to assigned classes and academic functions.
   - `PARENT`: Cryptographically scoped to authenticated parent identity; child data filtered by `parent_student_links`.
   - `PUBLIC`: Public document verification, calendar, and health ping only.
4. **Relational Constraints:**  
   Enforced at the database level with strict foreign keys, unique mobile indices, and unique attendance period constraints.
5. **Storage Invariant:**  
   Google Drive is the sole file storage mechanism. Cloudflare R2 is **NOT USED**.
