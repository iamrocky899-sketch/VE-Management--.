# STEP 18 — DUAL-RUN & SHADOW EXECUTION PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **READY FOR SHADOW MODE**

---

## 1. Dual-Run Architecture & Authority Policy

During Step 18 and subsequent pre-cutover testing, the system operates under a **Strict Single-Authority Model**:

```
                              PRODUCTION TRAFFIC
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │    AUTHORITY ARBITRATOR   │
                        └─────────────┬─────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
      [ GOOGLE APPS SCRIPT ]                     [ CLOUDFLARE WORKER ]
      Status: AUTHORITATIVE                      Status: SHADOW / PASSIVE
      Actions: Read & Write                      Actions: Read & Mirror (Async)
      Data: Primary (Google Sheets)              Data: Validation (Cloudflare D1)
```

> [!WARNING]
> **SPLIT-BRAIN PREVENTION RULE:**
> Under dual-run mode, Cloudflare Workers do **NOT** accept independent production write mutations. All mutations are committed to Google Apps Script first, and asynchronously shadowed to Cloudflare D1 for real-time validation.

---

## 2. Validation Metrics & Comparison Heuristics

1. **Read Comparison:** Periodic automated diff between Apps Script `get_students` / `get_marks` / `get_attendance` vs. Cloudflare Worker `GET /api/v1/...` responses.
2. **Checksum Comparison:** SHA-256 hash comparison of serialized table snapshots across both databases.
3. **Latency Comparison:** Edge Worker response latency ($\sim 15\text{ms} - 45\text{ms}$) benchmarked against Apps Script execution latency ($\sim 800\text{ms} - 2500\text{ms}$).
4. **Error Rate Monitoring:** Zero HTTP 5xx or unexpected 4xx errors allowed on shadow Worker routes.
