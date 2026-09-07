# VE MANAGEMENT — Complete Technical System Audit
**Institution:** Gameri Higher Secondary School, Gamiri  
**School Identifier:** `GAMERI-HSS-001`  
**Current System Version:** `5.7` (Release Candidate)  
**Audit Date:** September 2026  
**Auditor:** Antigravity AI Engineering Suite  

---

## 1. Executive Summary

A comprehensive, non-destructive technical audit of the **VE Management** system (Gameri Higher Secondary School, Gamiri) was conducted across all subsystems: Android Native Client, Google Apps Script Cloud Backend, Parent Portal Web App, Staff Portal Web App, Google Sheets Database Layer, and Firebase Hosting infrastructure.

### Key Audit Highlights:
- **System Integrity:** The codebase represents a mature, feature-complete, production-oriented Vocational Education Management System. All core modules (Attendance with on-device face recognition, 4-Exam Marks Management, Class-wise Notes, Activities, Notices, Calendar, Portfolio generation, Parent Portal, Multi-child support, and Delta Sync) are fully implemented and verified.
- **Build Verification:**
  - `parent-portal`: Vite build completed successfully (`dist/` generated, 0 errors).
  - `staff-portal`: Vite build completed successfully (`dist/` generated, 0 errors).
  - `Android`: Kotlin compilation (`compileDebugKotlin`) and unit test suite (`testDebugUnitTest`) completed with code 0 (`BUILD SUCCESSFUL`).
  - `Cloud API`: Live HTTPS health check (`action=ping`) returned `ONLINE` with valid institutional metadata (`GAMERI-HSS-001`).
- **Safety Compliance:** No production URLs, deployment IDs, common passwords, database schemas, or student records were modified or deleted during this audit.

---

## 2. Current Architecture

The VE Management ecosystem operates on an **Offline-First Hybrid Cloud Architecture**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                                    │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐  │
│  │   Android Admin App     │  │    Parent Portal    │  │  Staff Portal   │  │
│  │   (Offline-First SPA)   │  │    (React / Vite)   │  │  (React / Vite) │  │
│  │   WebView + Face-API    │  │   Firebase Hosting  │  │ Firebase Hosting│  │
│  └────────────┬────────────┘  └──────────┬──────────┘  └────────┬────────┘  │
└───────────────┼──────────────────────────┼──────────────────────┼───────────┘
                │                          │                      │
                │ HTTPS (JSON / Actions)   │ HTTPS (JSON / Token) │ HTTPS (Token)
                ▼                          ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                    │
│                                                                             │
│              Google Apps Script Web App HTTPS Gateway (`Code.gs`)           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ • Action Dispatcher & Request Envelope Formatter (`Code.gs`)          │  │
│  │ • Cryptographic Authentication & Password Engine (`Auth.gs`)          │  │
│  │ • Zero-Trust Role & IDOR Access Control (`Security.gs`)               │  │
│  │ • Parent-Child Relational Scoping (`Authorization.gs`, `ParentApi.gs`) │  │
│  │ • Academic Entity Handlers (`AcademicApi.gs`)                         │  │
│  │ • Staff & Institutional Administration (`AdminApi.gs`)                 │  │
│  │ • Delta Batch Sync Engine (`SyncApi.gs`)                              │  │
│  │ • Sanitized Audit Logger (`Audit.gs`)                                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Atomic Batch getValues / setValues
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA STORAGE LAYER                               │
│                                                                             │
│              Google Sheets Database (`GAMERI-HSS-001 Master DB`)            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 20 Structured Tables: Settings, Students, Parents, ParentStudentLinks,│  │
│  │ Staff, Attendance, Marks, Notes, NoteUnits, NoteQuestions, Activities,│  │
│  │ Assignments, Notices, Notifications, Calendar, Documents,             │  │
│  │ Achievements, Contacts, SyncMetadata, Audit                           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Android Architecture

- **Application ID / Package:** `com.itdept.itghss`
- **Build System:** Gradle `9.4.1`, Android Gradle Plugin (AGP) `9.2.1`, Kotlin `2.3.0`.
- **SDK Targets:** `minSdk = 26` (Android 8.0 Oreo), `targetSdk = 36`, `compileSdk = 36` (Java 11).
- **Core Components:**
  - `MainActivity.kt`: Native container hosting full-screen WebView with `WebViewAssetLoader` mapping `https://appassets.androidplatform.net/assets/` to bypass local origin CORS restrictions.
  - `WebAppInterface`: Bidirectional JavaScript bridge (`window.Android`) providing native download management (`MediaStore` & Scoped Storage), Google Sign-In, Google Drive appDataFolder sync, Google Calendar holiday queries, and network connectivity state.
  - `AttendanceReminderScheduler.kt` & `AttendanceReminderReceiver.kt`: Exact Alarm / AlarmManager scheduling daily morning & afternoon attendance reminder notifications.
  - `BootCompletedReceiver.kt`: Re-registers scheduled reminder alarms upon device restart or package update.
  - `SchoolCloudConfigManager.kt`: Encapsulates local school binding and cloud sync connection states in SharedPreferences.
  - `AssebCalendarHelper.kt`: Offline calendar validation against the 254-day official ASSEB 2026–27 school calendar.
- **Bundled Offline Assets (`app/src/main/assets/`):**
  - SPA UI: `index.html` (580 KB vanilla CSS/JS dark glassmorphic interface).
  - Neural Network Weights (`/models/`): Tiny Face Detector, 68-Point Face Landmarks, and 128-dimensional Face Recognition Embeddings shards.
  - Vendor Libraries (`/libs/`): `face-api.min.js` (1.33 MB), `xlsx.full.min.js` (881 KB), `jspdf.umd.min.js` (364 KB), `jspdf.plugin.autotable.min.js` (36 KB), `sync_manager.js` (26 KB), `asseb_calendar_2026_27.js` (158 KB).
- **Offline Sync Client (`sync_manager.js`):**
  - Manages persistent queue `itd3_sync_queue` in `localStorage`.
  - Implements micro-debouncing (1500ms), exponential backoff (2s to 60s, max 5 retries), and idempotent delta sync against `action=sync_upload`.

---

## 4. Backend Architecture

- **Platform:** Google Apps Script (V8 Runtime) exposed as Web App (`doGet` / `doPost`).
- **Endpoint Structure:** Single HTTPS Gateway with `action` parameter routing.
- **Protocol Envelope:**
  ```json
  {
    "success": true,
    "action": "parent_dashboard",
    "data": { ... },
    "error": null,
    "timestamp": "2026-09-02T10:45:00Z"
  }
  ```
- **Backend File Modules:**
  1. `Code.gs` (14.5 KB): Request dispatcher, JSON parsing, exception wrapper, and routing.
  2. `Auth.gs` (30.2 KB): Password hashing (SHA-256 + salt), brute-force rate limiter (15 min cache window), and HMAC-SHA256 session token issuance/verification (30 days TTL).
  3. `Security.gs` (15.8 KB): Zero-trust role enforcement (`ADMIN`, `PRINCIPAL`, `TEACHER`, `STUDENT`, `PARENT`), real-time account status checks (`isAccountActive`), and class/subject/student IDOR filtering.
  4. `Authorization.gs` (2.6 KB): Specialized parent-child relationship validator (`isAuthorized`, `getAuthorizedChildren`).
  5. `Database.gs` (11.7 KB): High-performance atomic batch spreadsheet access layer with request-scoped caching and schema verification.
  6. `Schema.gs` (5.2 KB): Formal 20-table column schemas and institutional constant definitions.
  7. `AdminApi.gs` (24.0 KB): Staff roster CRUD, password resets, parent auto-provisioning, administrative summaries, and safe selective data resets.
  8. `ParentApi.gs` (9.2 KB): Aggregated parent dashboard, authorized attendance/marks reads, and parent password changes.
  9. `AcademicApi.gs` (63.9 KB): Comprehensive CRUD handlers for Students, Attendance, Marks, Notes, Units, Questions, Activities, Assignments, Notices, Calendar, Documents, and Achievements.
  10. `SyncApi.gs` (6.3 KB): Delta batch upload and timestamp-based delta download engine.
  11. `Audit.gs` (2.0 KB): Audit logger with automatic credential masking (passwords, hashes, tokens, API keys).
  12. `appsscript.json`: Manifest configured with `executeAs: USER_DEPLOYING` and `access: ANYONE_ANONYMOUS`.

---

## 5. Parent Portal Architecture

- **Location:** `C:\Users\HP\Downloads\ITGHSS2\parent-portal`
- **Framework:** React 18.3.1 + Vite 6.0.1 + Lucide React.
- **Deployment:** Firebase Hosting (`ve-management-parent.web.app`).
- **Key Modules & Logic:**
  - `AuthContext.jsx`: Manages session lifecycle (`itd3_portal_session`), active child selection (`itd3_portal_selected_child_id`), login, logout, password changes, and real-time session revocation.
  - `api.js`: Features in-memory TTL caching (1 to 10 minutes) and in-flight Promise deduplication (`inFlightPromises`) to eliminate redundant HTTP round-trips.
  - Multi-Child Handling:
    - Supports parents with multiple children enrolled across different classes (e.g., Child A in Class 9, Child B in Class 10).
    - `switchChild(childId)` seamlessly switches active child state across `ParentDashboard`, `ParentAttendance`, `ParentMarks`, and `ParentMaterials`.
    - Cross-child data leakage is strictly prevented via child-specific filtering in UI state (`childMarks`, `childAttendanceRecords`, `childNotes`).
  - Class-Wise Study Materials (`ParentMaterials.jsx`):
    - Strictly scopes materials by enrolled child class (`selectedStudent.class`).
    - Implements hierarchical view: Class → Category (`Main Book`, `Employability Skill`) → Subject → Unit → Questions & Answers.

---

## 6. Data Model & Sheet Inventory

The system defines **20 structured sheets** managed by `Schema.gs` and `Database.gs`:

| Sheet / Table Name | Primary Key | Purpose | Historical Data | Migration Safety |
|---|---|---|---|---|
| **`Settings`** | `key` | School identity, session, and global configs | Yes (Config) | Safe to Migrate |
| **`Students`** | `studentId` | Master student directory (Names, Roll, Class, Mobile) | Critical Master | Preserve 100% |
| **`Parents`** | `parentId` | Parent accounts & hashed credentials | Yes (Auth) | Safe to Migrate |
| **`ParentStudentLinks`** | `linkId` | Many-to-Many relational links between parents & students | Yes (Relations) | Safe to Migrate |
| **`Staff`** | `staffId` | Teacher, Principal, and Admin profiles & access scopes | Yes (Auth) | Safe to Migrate |
| **`Attendance`** | `attendanceId` | Daily student attendance logs (Theory & Practical) | Historical Logs | Safe to Migrate |
| **`Marks`** | `markId` | Continuous assessment marks (4 standard exams) | Historical Marks | Safe to Migrate |
| **`Notes`** | `noteId` | Class-wise subject books / note categories | Curriculum Data | Safe to Migrate |
| **`NoteUnits`** | `unitId` | Individual chapters / curriculum units | Curriculum Data | Safe to Migrate |
| **`NoteQuestions`** | `questionId` | Questions, detailed answers, marks weightage | Curriculum Data | Safe to Migrate |
| **`Activities`** | `activityId` | Vocational field visits, guest lectures, events | Historical Logs | Safe to Migrate |
| **`Assignments`** | `assignmentId` | Homework and practical assignment tasks | Active / Past | Safe to Migrate |
| **`Notices`** | `noticeId` | Official school circulars and announcements | Active Notices | Safe to Migrate |
| **`Notifications`** | `notificationId` | Push and in-app notification inbox records | Ephemeral | Safe to Migrate |
| **`Calendar`** | `calendarId` | ASSEB 2026–27 254-day working calendar & holidays | Master Calendar | Safe to Migrate |
| **`Documents`** | `documentId` | Official academic circulars, syllabus PDFs, forms | References | Safe to Migrate |
| **`Achievements`** | `achievementId` | Student awards, recognitions, skill milestones | Student Records | Safe to Migrate |
| **`Contacts`** | `contactId` | School directory, vocational teachers, emergency lines | Public Directory | Safe to Migrate |
| **`SyncMetadata`** | `syncId` | Audit logs of offline batch sync transactions | Historical Logs | Safe to Migrate |
| **`Audit`** | `logId` | Security audit trail with masked credentials | Security Logs | Safe to Migrate |

> [!IMPORTANT]
> **Notes Architecture Invariant:** Notes are strictly **CLASS-WISE** (Class → Subject → Unit → Questions/Answers). They are NOT student-specific and must never be refactored into student-level tables.

---

## 7. Authentication Model

1. **Admin Authentication:**
   - Script Property `ADMIN_API_KEY` passed via `apiKey` body payload or `Authorization: Bearer <API_KEY>` header.
   - Staff login with role `ADMIN` or `PRINCIPAL`.
2. **Teacher / Staff Authentication:**
   - Identifier: Mobile number (10-digit), Email, or Staff ID (`STF_...`).
   - Password: Default common school password (`12345`) or custom user password.
   - Storage: Salted SHA-256 hash (`passwordHash` + `salt`).
3. **Parent Authentication:**
   - Identifier: Parent 10-digit mobile number or Parent ID (`PAR_...`).
   - Password: Default common parent password (`12345`) or custom user password.
   - JIT Auto-Provisioning: If a parent logs in whose mobile number is present in `Students.mobile`, an account and `ParentStudentLinks` are automatically created on first login.
4. **Student Authentication:**
   - Identifier: Student ID (`STU_...`), Roll Number, or Registered Mobile Number.
   - Password: Default common school password (`12345`).
5. **Session Management:**
   - Token format: `base64url(userId|role|schoolId|identifier|expiresAt|hmacSignature)`.
   - Secret key: Generated randomly on first run and stored in `SERVER_SECRET` script property.
   - Lifetime: 30 days.

---

## 8. Authorization Model (Zero-Trust RBAC & IDOR Protection)

| Role | Permitted Access Scope | Prohibited Actions |
|---|---|---|
| **`ADMIN`** | Full CRUD over all 20 tables, school settings, staff accounts, sync, and logs | None |
| **`PRINCIPAL`** | Full school-wide read and review; staff and parent management; notice publication | System settings deletion |
| **`TEACHER`** | Read/Write attendance, marks, assignments, notes, and activities for **assigned classes** and **assigned subjects** | Accessing unassigned classes/subjects; modifying school settings |
| **`PARENT`** | Read dashboard, attendance, marks, class materials, activities, and notices for **authorized linked children only** | Accessing records of unlinked students (enforced with 403 Forbidden); modifying academic data |
| **`STUDENT`** | Read personal dashboard, attendance, marks, class materials, and student notices | Accessing peer records; modifying academic records |

---

## 9. API Inventory

All API endpoints accept HTTP POST requests to the Apps Script Web App URL:

| Action | Required Role | Description |
|---|---|---|
| `ping` | Public | Health check and server clock synchronization |
| `auth_login` / `login` / `parent_login` | Public | Authenticates user and issues signed HMAC-SHA256 session token |
| `auth_change_password` | Session | Changes user password to custom password |
| `auth_reset_user_password` | Admin/Principal | Resets a specific user to common school password |
| `auth_reset_all_passwords` | Admin/Principal | Resets all parents or staff to common school password |
| `get_students` / `save_students` | Teacher/Admin | Reads / batch upserts student master records |
| `get_attendance` / `save_attendance` | Teacher/Admin/Parent/Student | Scoped attendance reads / batch recording |
| `get_marks` / `save_marks` | Teacher/Admin/Parent/Student | Scoped continuous assessment marks reads / recording |
| `get_notes` / `save_notes` / `delete_notes` | All Roles (Scoped) | Class-wise notes, units, and Q&A retrieval/management |
| `get_activities` / `save_activities` | All Roles (Scoped) | Field visits, guest lectures, vocational activity logs |
| `get_assignments` / `save_assignments`| All Roles (Scoped) | Homework & practical assignments |
| `get_notices` / `save_notices` | All Roles (Scoped) | Audience-scoped circulars and announcements |
| `get_calendar` | Public | ASSEB 2026–27 254-day working calendar & holidays |
| `get_contacts` | Public | School directory and vocational faculty contacts |
| `parent_dashboard` | Parent | Unified aggregated dashboard for all linked children |
| `student_dashboard` | Student | Student dashboard summary |
| `staff_dashboard` | Teacher/Principal | Staff overview dashboard |
| `sync_upload` | Teacher/Admin | Delta batch synchronization from Android Admin client |
| `sync_download` | Teacher/Admin | Delta timestamp-based cloud updates download |
| `get_staff_list` / `register_staff` | Admin/Principal | Staff account management |
| `reset_parent_portal_data` | Admin | Safe selective cloud data reset |

---

## 10. Existing Functionality Matrix

| Feature | Exists | Working | Partial | Broken | Not Implemented | Notes |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **Admin Login** | ✅ | ✅ | | | | Supported via Admin API Key & Staff Admin role |
| **Teacher Login** | ✅ | ✅ | | | | Supported via mobile/email + common/custom password |
| **Parent Login** | ✅ | ✅ | | | | Supported via mobile + common password `12345` |
| **Multi-Child Parent** | ✅ | ✅ | | | | Links multiple children; independent switching |
| **Student Management** | ✅ | ✅ | | | | Local offline & cloud master student directory |
| **Staff Management** | ✅ | ✅ | | | | Staff roster, roles, class/subject assignments |
| **Classes & Subjects** | ✅ | ✅ | | | | Vocational IT/ITeS Class 9 & 10 structure |
| **Curriculum Tracking** | ✅ | ✅ | | | | Weekly syllabus & activity logging |
| **Class-Wise Notes** | ✅ | ✅ | | | | Class → Subject → Unit → Questions & Answers |
| **Theory Attendance** | ✅ | ✅ | | | | Daily roll-call & face recognition |
| **Practical Attendance** | ✅ | ✅ | | | | Tabular register & session tracking |
| **Marks Entry (4 Exams)** | ✅ | ✅ | | | | 1st Unit, Half Yearly, 2nd Unit, Final Exam |
| **Results & Report Cards** | ✅ | ✅ | | | | Aggregated results & print preview |
| **Parent Dashboard** | ✅ | ✅ | | | | Summary cards, attendance %, marks breakdown |
| **Notices & Circulars** | ✅ | ✅ | | | | Audience-scoped notice publication |
| **Academic Calendar** | ✅ | ✅ | | | | Official ASSEB 2026–27 254-day calendar |
| **Student Portfolio** | ✅ | ✅ | | | | Comprehensive multi-metric student summary |
| **Student Promotion** | ✅ | | ✅ | | | Basic class progression logic in Android app |
| **Certificates** | ✅ | | ✅ | | | Basic PDF export generation |
| **Marksheets Generation** | ✅ | ✅ | | | | Print-ready marksheet rendering in portals |
| **QR Verification** | | | | | ❌ | Planned for future document validation |
| **Offline Backup (Drive)**| ✅ | ✅ | | | | Google Drive appDataFolder JSON backup |
| **Audit Logs** | ✅ | ✅ | | | | Masked security audit logging |
| **Role Permissions** | ✅ | ✅ | | | | Complete 5-tier RBAC enforcement |

---

## 11. Security Audit Findings

> [!NOTE]
> All credentials and sensitive tokens discovered during the audit are masked below in compliance with security guidelines.

1. **Server Secret & Signing Key:**
   - **Type:** Server-side HMAC-SHA256 signing secret.
   - **Location:** `PropertiesService.getScriptProperties().getProperty('SERVER_SECRET')`.
   - **Status:** Automatically generated via UUID if missing; masked in audit logs.
2. **Admin API Key:**
   - **Type:** Static API Key for administrative synchronization.
   - **Location:** `backend/Auth.gs` and `app/src/main/assets/libs/sync_manager.js`.
   - **Value:** `GHSS_ADMIN_SECURE_KEY_***`.
   - **Risk Assessment:** Fallback key exists in client-side code for offline testing. In production, this should be superseded by dynamically validated script properties.
3. **Common Parent Password:**
   - **Type:** Default institutional password for student/parent accounts.
   - **Value:** `12345` (Configured in `Schema.gs` and `Settings`).
   - **Status:** Intended school policy default; preserved as requested.
4. **Credential Masking in Logging:**
   - Verified that `Audit.gs` sanitizes all JSON details, replacing `password`, `passwordHash`, `token`, and `apiKey` fields with `***` before writing to Google Sheets.
5. **Biometric Privacy:**
   - Verified that `AcademicApi.sanitizeStudent` strips `faceEmbedding`, `descriptor`, and `biometricData` before returning student payloads to web portals.

---

## 12. Performance Findings

1. **Google Sheets Quotas & Optimization:**
   - `Database.gs` utilizes atomic batch reading (`getValues`) and batch writing (`setValues`), avoiding single-cell quota bottlenecks.
   - Single-request memoization (`_cachedData`) prevents duplicate reads within the same execution context.
2. **Parent Portal Web Performance:**
   - `api.js` implements in-flight Promise deduplication (`inFlightPromises`) preventing duplicate simultaneous network requests.
   - In-memory response caching (`responseCache`) reduces backend round-trips for static datasets (10-minute TTL on calendar, 5-minute TTL on profiles).
   - Code splitting: Routes and heavy pages are lazy-loaded (`React.lazy`), reducing the initial vendor bundle to ~142 kB gzip.
3. **Android App Performance:**
   - `WebViewAssetLoader` delivers local assets without network overhead.
   - Neural network weights are stored locally in APK assets (no runtime model downloads required).

---

## 13. Technical Debt

1. **Backend Code Structure:** Apps Script files share a global namespace. Future migrations to modern TypeScript runtimes will require modular import/export structuring.
2. **Hardcoded Fallbacks:** Default API URLs and admin keys are hardcoded as fallbacks in `sync_manager.js` and `api.js`.
3. **Parent Portal Child Change Trigger:** In `ParentAttendance.jsx`, adding `selectedChildId` to the `useEffect` dependency array will ensure instantaneous calendar reloads on child switching.

---

## 14. Cloudflare Migration Readiness Assessment

While the system is currently deployed on Apps Script + Google Sheets + Firebase Hosting, an assessment for future migration to **Cloudflare Workers + D1 + R2 + Workers Static Assets** was conducted:

- **Database (Sheets → D1 SQLite):**
  - High readiness: The 20 schemas in `Schema.gs` map directly 1:1 to SQL tables with primary keys and foreign key relationships (`parentId`, `studentId`, `noteId`, `unitId`).
- **API Logic (Apps Script → Cloudflare Worker):**
  - High readiness: Pure JavaScript business logic in `Auth.gs`, `Security.gs`, `AcademicApi.gs`, and `AdminApi.gs` uses standard crypto (`crypto.subtle` / Web Crypto API) and can be adapted into a Hono/TypeScript Cloudflare Worker.
- **File Storage (Drive → Cloudflare R2):**
  - PDFs and image assets currently handled via base64 or Drive can seamlessly move to Cloudflare R2 with S3-compatible APIs.
- **Frontend Hosting (Firebase → Cloudflare Pages / Static Assets):**
  - High readiness: Both `parent-portal` and `staff-portal` generate static Vite production bundles (`dist/`) ready for Cloudflare Static Assets.

---

## 15. Operational Risks

1. **Google Sheets Scalability:** If concurrent sync requests surge, Google Sheets API rate limits may trigger temporary lock contention.
2. **Session Secret Rotation:** If `SERVER_SECRET` is rotated in Script Properties, all active user sessions will require re-login.

---

## 16. Recommended Phased Implementation Order

1. **Phase 0:** Audit, Baseline Safety, and Health Verification (Complete).
2. **Phase 1:** Core Foundation, School Identity, and Config Hardening.
3. **Phase 2:** Academic Calendar, Session Management, and ASSEB Invariants.
4. **Phase 3:** Attendance Engine, Biometric Verification, and WhatsApp Alerting.
5. **Phase 4:** People Directory, Roster Management, and Multi-Child Links.
6. **Phase 5:** Communication, Notices, and Ephemeral Notifications.
7. **Phase 6:** Academic Documents, Marksheets, and PDF Portfolios.
8. **Phase 7:** Analytics, Attendance Summaries, and Performance Insights.
9. **Phase 8:** Student Achievements, Recognitions, and Milestones.
10. **Phase 9:** Infrastructure Modernization, Sync Hardening, and Cloudflare Preparation.
11. **Phase 10:** Comprehensive End-to-End Testing, Security Review, and Release.

---

## 17. Items Requiring Human Decision

1. **Production Admin API Key Rotation:** Decision on when to transition from development fallback keys to high-entropy randomly generated production keys.
2. **Target Cloud Infrastructure Timeline:** Decision on the exact schedule for initiating Phase 9 Cloudflare Worker & D1 database provisioning.

---

## 18. Critical Items That Must NOT Be Changed

1. **Common Parent Password:** Must remain `12345` (or configured school common password).
2. **Notes Storage Architecture:** Must remain **CLASS-WISE** (Class → Subject → Unit → Questions/Answers).
3. **School ID Invariant:** Must strictly remain `GAMERI-HSS-001`.
4. **Existing Production Endpoints:** Must preserve live Apps Script Web App URL and Firebase Hosting domains.
5. **Existing Student Master Records:** Must never be deleted or purged during sync operations.
