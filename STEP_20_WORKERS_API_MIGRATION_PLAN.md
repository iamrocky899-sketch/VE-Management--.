# STEP 20 — CLOUDFLARE WORKERS API MIGRATION PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE ARCHITECTURE**

---

## 1. Modular Workers API Structure

The Cloudflare Workers API is organized into dedicated domain modules:

```
cloudflare/src/
├── index.js          # Gateway entry point & CORS handler
├── router.js         # Unified action-to-route dispatcher
├── auth.js           # Web Crypto PBKDF2/HMAC token engine
├── security.js       # Server-side multi-role RBAC & scope resolver
├── response.js       # Standardized response envelopes & headers
├── validation.js     # Request sanitizer & SQL injection defense
└── api/              # Domain-specific endpoint handlers
    ├── auth.js
    ├── students.js
    ├── parents.js
    ├── staff.js
    ├── attendance.js
    ├── exams.js
    ├── marks.js
    ├── results.js
    ├── notes.js
    ├── documents.js
    ├── notices.js
    ├── reports.js
    ├── settings.js
    ├── calendar.js
    └── practicals.js
```

---

## 2. API Compatibility Principle

- The Workers API accepts standard JSON envelopes `{ action: '...', token: '...', ... }` as well as REST paths (`/api/v1/...`).
- Output format is identical: `{ success: true, action: '...', data: { ... }, error: null, timestamp: '...' }`.
