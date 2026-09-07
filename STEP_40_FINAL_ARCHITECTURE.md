# STEP 40 — FINAL ARCHITECTURE SPECIFICATION

**Institutional Entity**: Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Canonical API Endpoint**: `https://ve-management-api.iamrocky899.workers.dev`  
**Database**: Cloudflare D1 (`ve-management-db`)  
**Web Hosting**: Firebase Hosting (`ve-management-parent`)

---

## 1. Complete System Architecture Diagram

```
========================================================================================
                                 CLIENT ACCESS LAYER
========================================================================================

    [ WEB USERS: Parent / Student / Staff ]            [ ANDROID APP: Teacher / Admin ]
                     |                                                |
                     v                                                v
       +----------------------------+                   +----------------------------+
       |      Firebase Hosting      |                   |    Android Native Shell    |
       |  (Unified React/Vite App)  |                   |  (WebView + Offline Queue) |
       +----------------------------+                   +----------------------------+
                     |                                                |
                     |  HTTPS / JSON                                  |  HTTPS / JSON
                     +-----------------------+  +---------------------+
                                             |  |
                                             v  v
========================================================================================
                               APPLICATION GATEWAY & API
========================================================================================

                     +---------------------------------------+
                     |       Cloudflare Edge Workers         |
                     |  (ve-management-api.workers.dev)      |
                     +---------------------------------------+
                     | • JWT / HMAC-SHA256 Token Auth        |
                     | • Strict Role-Based Access (RBAC)     |
                     | • 42 Registered Modular Actions       |
                     | • Zero Google Apps Script / Sheets    |
                     +---------------------------------------+
                                         |
                                         | SQL Queries / Bound Context
                                         v
========================================================================================
                               PRIMARY PERSISTENCE LAYER
========================================================================================

                     +---------------------------------------+
                     |         Cloudflare D1 Database        |
                     |          (ve-management-db)           |
                     +---------------------------------------+
                     | 33 Relational Tables:                 |
                     | • students, parents, staff            |
                     | • parent_student_links, enrollments   |
                     | • attendance_sessions, attendance     |
                     | • examinations, marks, exam_results   |
                     | • teacher_notes, curriculum, classes  |
                     | • notices, activities, calendar       |
                     | • official_documents, audit_logs      |
                     +---------------------------------------+
                                   |           |
            Future S3 Gateway      |           |  Automated Snapshot / Export
            (Object Storage)       |           |  (Non-blocking)
                                   v           v
========================================================================================
                         STORAGE & DISASTER RECOVERY LAYER
========================================================================================

       +----------------------------+                   +----------------------------+
       |        Backblaze B2        |                   |        Google Drive        |
       |   (Future File Storage)    |                   |   (Backup & Archive Only)  |
       +----------------------------+                   +----------------------------+
       | • Student Profiles/Photos  |                   | • D1 SQL Dump Snapshots    |
       | • Official Certificates    |                   | • Android State Backups    |
       | • Teacher Study Materials  |                   | • Non-blocking to Runtime  |
       +----------------------------+                   +----------------------------+

========================================================================================
                              DECOMMISSIONED / RETIRED
========================================================================================

       +----------------------------+                   +----------------------------+
       |     Google Apps Script     |                   |       Google Sheets        |
       |     [ 0% RUNTIME CALLS ]   |                   |    [ 0% RUNTIME CALLS ]    |
       +----------------------------+                   +----------------------------+
```

---

## 2. Core Architectural Pillars

### A. Web Application Runtime
- **Hosting**: Firebase Hosting (CDN Edge Distribution).
- **Client**: Unified React 18 + Vite Portal with original pastel theme, clean navbar with brand icon, desktop tabs, bottom navigation, pastel cards, and child selector for single- and multi-child families.
- **Backend API**: Dispatches all requests exclusively to Cloudflare Workers (`https://ve-management-api.iamrocky899.workers.dev`).
- **Google Dependency**: **ZERO**. No calls to `script.google.com`, `script.googleusercontent.com`, or Sheets API.

### B. Android Native Application Runtime
- **Client**: Native Kotlin wrapper + WebView + `SyncManager`.
- **Sync Engine**: Bidirectional offline-first sync engine connecting to Cloudflare Worker endpoints `sync_upload` and `sync_download`.
- **Offline Storage**: Local `SyncQueue` with exponential backoff retry. Local edits never fail when offline.
- **Google Services**:
  - `google-services.json` used exclusively for client package verification and OAuth client identification.
  - Google Drive `appDataFolder` used exclusively for asynchronous client state backup (`itghss_backup.json`).
  - Google Apps Script: **ZERO** runtime dependency.

### C. Database & Data Integrity
- **Authoritative Database**: Cloudflare D1 (`ve-management-db`).
- **Tenancy**: Multi-tenant ready with `school_id = 'GAMERI-HSS-001'` indexing.
- **Data Protection**: Zero destructive mutations, zero table truncations, zero fake records.

### D. Attendance Calculation Contract
- **Formula**:
  $$\text{Attendance Percentage} = \frac{\text{Conducted Sessions Attended}}{\text{Applicable Conducted Sessions}} \times 100$$
- **Enforcement**: If 0 applicable conducted sessions exist, returns `null` / `N/A`. No artificial $100\%$ or $92.5\%$ fallbacks.

### E. Notes Hierarchy Contract
- **Structure**: $\text{Class} \longrightarrow \text{Subject} \longrightarrow \text{Unit} \longrightarrow \text{Q\&A Notes}$.
- **Isolated**: Never linked to student entities.
