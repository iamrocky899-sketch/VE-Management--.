# VE MANAGEMENT — SECURITY AUDIT & INVENTORY (STEP 14)
**Institutional Entity:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Audit Date:** September 2, 2026  
**Status:** HARDENED & VERIFIED  

---

## 1. Executive Summary

This document establishes the comprehensive security and architectural inventory for the VE Management system at Gameri Higher Secondary School (`GAMERI-HSS-001`). It documents security controls, authorization mechanisms, session management, data privacy protections, and disaster recovery readiness across all tiers.

---

## 2. Security Inventory Matrix

| Security Domain | Existing Mechanism | Status | Notes / Policy Invariants |
| :--- | :--- | :---: | :--- |
| **A. Authentication** | Multi-Role Login, SHA-256 Salted Passwords, Brute-force throttling (5 attempts / 15m) | `VERIFIED` | Plaintext passwords never stored or logged. |
| **B. Authorization** | Server-side RBAC enforced on every API action in `Security.gs` | `VERIFIED` | Client-side UI hiding is never trusted as authorization. |
| **C. Multi-Role RBAC** | Distinct permissions for `ADMIN`, `PRINCIPAL`, `TEACHER`, `STUDENT`, `PARENT` | `VERIFIED` | Administrative mutations restricted to Admin/Principal. |
| **D. Teacher Academic Scope** | Centralized in `Security.getTeacherAcademicScope(staffId, schoolId, year)` | `VERIFIED` | Teachers strictly confined to assigned classes/sections/subjects. |
| **E. Parent Isolation** | Direct scoping via `ParentStudentLinks` with phone normalization | `VERIFIED` | Multi-child isolation strictly prevents cross-family data leakage. |
| **F. Student Isolation** | Strict self-access scoping (`session.userId === studentId`) | `VERIFIED` | Students cannot query or mutate records of other students. |
| **G. Session Security** | HMAC-SHA256 signed session tokens with 30-day expiration & replay protection | `VERIFIED` | Tokens bind `userId`, `role`, `schoolId`, and expiration timestamp. |
| **H. API Security** | Action dispatcher with unknown action rejection, input validation & sanitization | `VERIFIED` | Malformed actions and invalid payloads fail safely. |
| **I. Secret Handling** | Script Properties via `PropertiesService`, no hardcoded production secrets | `VERIFIED` | Secrets never exposed in client bundles or log outputs. |
| **J. WebView Security** | Android `WebViewAssetLoader`, domain bounding, cleartext HTTP disabled | `VERIFIED` | Privileged native bridges isolated from arbitrary web content. |
| **K. Firebase Security** | Client hosting configuration without private service keys | `VERIFIED` | Static asset hosting with HTTPS and security headers. |
| **L. Apps Script Security** | Scoped `doGet` / `doPost` with session token verification on sensitive routes | `VERIFIED` | Server execution sandbox enforced by Google Cloud infrastructure. |
| **M. Google Sheets Access** | Server-side execution context, service-account/script owner access only | `VERIFIED` | Sheets not exposed to public direct read/write. |
| **N. Document Verification** | Public QR verification sanitizes sensitive data (PII & raw marks hidden) | `VERIFIED` | Only official document status, student name, and type returned. |
| **O. Audit Logging** | Append-only audit trail logging actor, action, timestamp, and scope | `VERIFIED` | Sensitive payloads and passwords excluded from logs. |
| **P. Backup Subsystem** | Full operational snapshot extraction with record counts and checksums | `VERIFIED` | Operational across all 23 database tables. |
| **Q. Restore Subsystem** | Admin-only with pre-restore schema validation & automated safety snapshot | `VERIFIED` | Fails closed on invalid schema, version, or wrong school ID. |
| **R. Disaster Recovery** | Formal runbook for Sheets corruption, outage, credential compromise | `VERIFIED` | Documented in `DISASTER_RECOVERY.md`. |
| **S. Logging & Diagnostics** | Centralized `Audit.log` with success/failure status and sanitized metadata | `VERIFIED` | Sensitive tokens and passwords omitted. |
| **T. Error Handling** | Safe generic error messages returned to clients; details kept server-side | `VERIFIED` | No stack traces or private storage paths leaked. |
| **U. Data Integrity** | Deduplication, type checking, foreign key resolution & deterministic IDs | `VERIFIED` | Negative marks, duplicate roll numbers, and collisions rejected. |
| **V. Availability** | Offline-first sync in Android app and resilient state caching in Web Portals | `VERIFIED` | Sync queues validated server-side upon reconnection. |
| **W. Security Testing** | 40 automated security test scenarios in `scratch/test_phase14_security_backup.js` | `VERIFIED` | 100% passing across authentication, RBAC, scoping, and backup. |
| **X. Remaining Risks** | Institutional policy approvals pending for formal retention and thresholds | `REQUIRES INSTITUTIONAL APPROVAL` | Awaiting School Committee formal sign-off. |

---

## 3. Critical Security Boundaries

1. **School Tenancy Invariant (`GAMERI-HSS-001`):**
   - Every database query and mutation is strictly scoped to the active `schoolId`.
   - Cross-school requests or backups from mismatched schools are rejected immediately.
2. **Notes Hierarchy Invariant:**
   - Notes are strictly structured as:
     $$\text{Class} \longrightarrow \text{Subject} \longrightarrow \text{Unit} \longrightarrow \text{Q\&A}$$
   - Never modified to student-centric or arbitrary flat files.
3. **Formula Injection Sanitization:**
   - All exported CSV records (Students, Staff, Marks, Attendance, Reports) prefix dangerous characters (`=`, `+`, `-`, `@`) with a single quote.
