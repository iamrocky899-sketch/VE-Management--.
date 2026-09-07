# STEP 18 — CLOUDFLARE TARGET ARCHITECTURE SPECIFICATION
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Document Status:** **VERIFIED & ARCHITECTED**  
**Execution Phase:** Step 18 — Parallel Foundation (Zero Production Cutover)

---

## 1. Architectural Overview & System Topology

The target architecture transitions the VE Management system from a Google Apps Script + Google Sheets + Firebase Hosting stack to a globally distributed, high-performance, edge-first architecture on **Cloudflare**:

```
                                  CLOUDFLARE EDGE
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
      Workers Static Assets                                Cloudflare Workers
    (Vite / React SPAs: Portals)                              (Edge REST API)
                 │                                               │
     ┌───────────┴───────────┐                       ┌───────────┴───────────┐
     │                       │                       │                       │
Parent Portal          Staff Portal             Cloudflare D1          Cloudflare R2
(Responsive Web)     (Responsive Web)        (Relational SQL DB)    (Object File Store)
     │                       │                       │                       │
     └───────────┬───────────┘                       │                       │
                 │                                   │                       │
           Android Client ───────────────────────────┴───────────────────────┘
      (Native / Edge-Aware)
```

---

## 2. Component Evaluation & Selection Matrix

| Cloudflare Component | Selected? | Architectural Role in VE Management | Classification |
|---|---|---|---|
| **Cloudflare Workers** | **YES** | Serverless Edge API runtime executing routing, multi-role RBAC, PBKDF2/HMAC authentication, result calculation, and document verification. | `READY FOR MIGRATION` |
| **Cloudflare Workers Static Assets** | **YES** | High-performance edge hosting for React/Vite frontends (Parent Portal & Staff Portal) replacing Firebase Hosting. | `READY FOR MIGRATION` |
| **Cloudflare D1** | **YES** | Distributed SQLite-based relational database hosting all 33 normalized relational tables, foreign keys, and indexes. | `READY FOR MIGRATION` |
| **Cloudflare R2** | **YES** | S3-compatible zero-egress object storage for binary files (School Logo, Principal/Teacher Signatures, Student Photos, Notes PDFs). | `READY FOR MIGRATION` |
| **Cloudflare DNS** | **YES** | Authoritative DNS management, apex domain routing (`gameri-hss.edu.in`), and instant failover control. | `PLANNED` |
| **Cloudflare Pages** | **NO** | Not required; Workers Static Assets provides superior unified deployment under a single `wrangler.toml` file. | `NOT IMPLEMENTED` |

---

## 3. End-to-End Request Flow & Invariants

1. **Client Interaction:**
   - Web portals (Staff Portal, Parent Portal) and Android App initiate HTTPS requests with standard JSON envelopes.
2. **Edge Security & Routing:**
   - Cloudflare Workers validate CORS headers, decrypt HMAC/JWT session claims, and enforce server-side RBAC (Admin, Principal, Teacher, Student, Parent).
3. **Structured Data Access (D1):**
   - Atomic SQL queries (`INSERT`, `UPDATE`, `SELECT`, `JOIN`) execute against Cloudflare D1 with millisecond latency.
4. **Binary Asset Handling (R2):**
   - Binary files (PDFs, photos, signatures) are uploaded directly to Cloudflare R2; only unique object keys (`r2://...` or clean CDN path) are stored in D1 metadata fields.
5. **Core Business Invariants Preserved:**
   - **Notes Invariant:** Strictly `Class -> Subject -> Unit -> Q&A + PDF` (Class-wise, never student-wise).
   - **Attendance Invariant:** Marking attendance never reduces the enrolled roster count (e.g. 40 students).
   - **Certificate Level Invariant:** Class IX $\rightarrow$ Level 1, Class X $\rightarrow$ Level 2, Class XI $\rightarrow$ Level 3, Class XII $\rightarrow$ Level 4.
