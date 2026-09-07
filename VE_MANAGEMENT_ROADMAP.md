# VE MANAGEMENT — Phased Implementation Roadmap (2026–2027)
**Institution:** Gameri Higher Secondary School, Gamiri  
**School Identifier:** `GAMERI-HSS-001`  
**Target Version:** `5.8+`  
**Status:** STEP 1 (Phase 0 Audit) Completed  

---

## Roadmap Overview

This roadmap defines the structured, non-destructive, phased engineering plan for the continuous development, refinement, and scaling of the **VE Management** ecosystem.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               PHASED ROADMAP                                │
│                                                                             │
│  [PHASE 0] Audit & Safety Verification                 (COMPLETED)          │
│      │                                                                      │
│  [PHASE 1] Foundation & Institutional Identity          (PLANNED)            │
│      │                                                                      │
│  [PHASE 2] Academic Structure & Class-wise Notes       (PLANNED)            │
│      │                                                                      │
│  [PHASE 3] Attendance Engine & Biometric Optimization  (PLANNED)            │
│      │                                                                      │
│  [PHASE 4] People, Roster & Multi-Child Access Links   (PLANNED)            │
│      │                                                                      │
│  [PHASE 5] Communication, Notices & Notifications       (PLANNED)            │
│      │                                                                      │
│  [PHASE 6] Academic Documents, Marksheets & Reports    (PLANNED)            │
│      │                                                                      │
│  [PHASE 7] Analytics, Insights & Performance Dashboards(PLANNED)            │
│      │                                                                      │
│  [PHASE 8] Achievements, Recognition & Milestones       (PLANNED)            │
│      │                                                                      │
│  [PHASE 9] Infrastructure Modernization & Cloud Ready   (PLANNED)            │
│      │                                                                      │
│  [PHASE 10] Final Testing, Security Review & Release   (PLANNED)            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Phase Breakdown

---

### PHASE 0 — Audit & Safety (Current Step)
- **Objective:** Complete non-destructive technical audit of Android app, Backend API, Parent Portal, Staff Portal, Google Sheets database, and security boundaries.
- **Key Deliverables:**
  - `VE_MANAGEMENT_AUDIT.md`: Complete 18-section technical architecture audit.
  - `VE_MANAGEMENT_ROADMAP.md`: Phased continuous development plan.
  - Automated compilation, unit testing, and live API health ping verification.
- **Safety Guarantee:** Zero modifications to production credentials, database records, endpoints, or common parent passwords.

---

### PHASE 1 — Foundation & Institutional Identity
- **Objective:** Standardize and harden school identity parameters and baseline configurations across all clients.
- **Key Tasks:**
  - Verify strict binding of School ID `GAMERI-HSS-001` across Android native config, Apps Script properties, and portal environments.
  - Standardize error code formats (`UNAUTHORIZED`, `ACCOUNT_DEACTIVATED`, `VALIDATION_ERROR`, `NETWORK_ERROR`).
  - Strengthen request validation schemas for all incoming API payloads.

---

### PHASE 2 — Academic Structure & Class-wise Curriculum
- **Objective:** Consolidate academic calendar management, class subjects, and class-wise study notes hierarchy.
- **Key Tasks:**
  - Reinforce official ASSEB 2026–27 254-day working calendar integration in Android and Web Portals.
  - Verify and optimize class-wise study notes hierarchy:
    $$\text{Class} \longrightarrow \text{Subject} \longrightarrow \text{Unit} \longrightarrow \text{Questions \& Answers}$$
  - Ensure Notes remain strictly class-scoped and accessible by enrolled class level.

---

### PHASE 3 — Attendance Engine & Biometrics
- **Objective:** Maintain and optimize daily attendance recording, face recognition pipeline, and localized alert dispatching.
- **Key Tasks:**
  - Verify on-device neural network execution for offline facial recognition (`face-api.js`).
  - Optimize tabular attendance register views with month-by-month navigation.
  - Maintain localized Assamese WhatsApp absence notification triggers.
  - Validate native reminder alarms via Android `AlarmManager` and `AttendanceReminderScheduler`.

---

### PHASE 4 — People & Access Control
- **Objective:** Manage student directory, staff roster, parent accounts, and multi-child relationships.
- **Key Tasks:**
  - Validate Just-in-Time parent account provisioning from student records.
  - Ensure multi-child parent links (`ParentStudentLinks`) allow single-login multi-child switching without data leakage.
  - Maintain common parent password (`12345`) authentication with optional user-driven custom password upgrade.
  - Enforce real-time account status checks (`isAccountActive`) across all endpoints.

---

### PHASE 5 — Communication & Circulars
- **Objective:** Streamline circulars, academic notices, and notification delivery.
- **Key Tasks:**
  - Refine role-targeted and class-targeted notice filtering (`ALL`, `STUDENTS`, `PARENTS`, `STAFF`).
  - Provide rich markdown and attachment URL support for official circulars.
  - Support ephemeral notification delivery for attendance alerts and exam announcements.

---

### PHASE 6 — Academic Documents & Marksheets
- **Objective:** Standardize student marksheets, exam grading, report cards, and student portfolios.
- **Key Tasks:**
  - Verify 4-exam continuous evaluation structure (1st Unit Test, Half Yearly, 2nd Unit Test, Annual Exam).
  - Generate print-ready marksheets and student portfolios in PDF format via `jsPDF` / `autotable`.
  - Prepare groundwork for secure document verification.

---

### PHASE 7 — Analytics & Reporting
- **Objective:** Provide high-visibility attendance summaries, academic performance trends, and administrative statistics.
- **Key Tasks:**
  - Implement aggregated attendance health indicators (Good Standing $\ge 75\%$, Needs Attention $60\text{--}74\%$, At Risk $< 60\%$).
  - Render student subject marks distribution and progress analytics.
  - Provide Principal and Admin executive overview dashboards.

---

### PHASE 8 — Achievements & Milestones
- **Objective:** Track vocational student achievements, skill milestones, certifications, and awards.
- **Key Tasks:**
  - Manage student achievement logs with category, date, and award details.
  - Display verified achievements in student portfolio and parent dashboard views.

---

### PHASE 9 — Infrastructure Modernization & Cloud Ready
- **Objective:** Prepare backend architecture for high-performance scale while preserving backward compatibility.
- **Key Tasks:**
  - Assess and prototype Cloudflare Workers (TypeScript / Hono) + Cloudflare D1 (SQLite) backend architecture.
  - Structure relational migration scripts from Google Sheets to Cloudflare D1.
  - Implement Cloudflare R2 object storage for document and photo attachments.
  - Maintain dual-backend compatibility during any future staging trials.

---

### PHASE 10 — Final Testing, Security Review & Release
- **Objective:** Perform comprehensive end-to-end testing, security penetration audit, release build verification, and deployment.
- **Key Tasks:**
  - Execute full E2E automated regression suite across Android app, Parent Portal, and Staff Portal.
  - Perform final security audit for credential exposure, IDOR vulnerabilities, and rate-limiting.
  - Generate final release packages (Android Release APK / AAB) and update deployment manifests.

---

## Critical Execution Principles
1. **Preserve Working Functionality:** Every phase must preserve existing working features without regressions.
2. **Strict Non-Destructive Operations:** Never delete live master data, schemas, or active user credentials.
3. **Class-Wise Curriculum Invariant:** Notes must always remain class-wise (Class → Subject → Unit → Q&A).
4. **Institutional Security:** School ID `GAMERI-HSS-001` and HMAC token signing must remain strictly enforced.
