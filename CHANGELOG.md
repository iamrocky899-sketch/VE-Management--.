# Changelog — VE Management System

All notable changes to the VE Management application and backend infrastructure are documented in this file.

## [v6.0-GA] — 2026-09-07

### Architecture & Modernization
- **Cloudflare Edge + D1 + Backblaze B2 Architecture:** Migrated all production persistence to Cloudflare Workers, Cloudflare D1 SQL database, and Backblaze B2 private object storage. Completely retired Google Apps Script and Google Sheets runtime APIs.
- **Unified Portal (Web/Mobile/PWA):** Consolidated Staff, Student, and Parent experiences into a high-performance single Vite/React application with role-based routing and canonical navigation.
- **Notes PDF Upload & Viewing Engine:** End-to-end PDF attachment flow for teachers (`staff/Notes.jsx`) with automatic presigned B2 upload, D1 metadata persistence (`attachment_url`, `attachment_name`, `attachment_size`), and secure in-app download/viewing for students and parents (`StudentMaterials.jsx`, `ParentMaterials.jsx`).
- **Attendance Data Normalization:** Enforced canonical camelCase/snake_case mapping across all student & parent endpoints, reconciling monthly summary statistics with chronological daily timeline records.
- **Authoritative Student & Group Integrity:** Strict isolation between class sections and student groups (`AMS`/`GP` for Class 9; `BL`/`DP` for Class 10). "Group Not Assigned" fallback for unassigned students.

### Android WebView & Mobile UX Repairs
- **Responsive Flexbox Modal Architecture:** Restructured dialogs (`modal-dialog-flex`) with fixed header, fixed date/class controls, independently scrollable roster body, and pinned action footer.
- **Safe-Area Content Clearance:** Replaced excessive bottom padding with balanced `calc(88px + env(safe-area-inset-bottom))` container layout, eliminating blank scroll regions.
- **Lazy Export Library Loading:** SheetJS (`xlsx.full.min.js`) and jsPDF (`jspdf.umd.min.js`) are now lazy-loaded on demand during report export, optimizing initial WebView render times.
- **Soft Keyboard Handling:** Added automatic smooth scroller on input focus, preventing keyboard clipping on physical devices.

### Security & Release Verification
- **Zero-Trust Security Verification:** 0 hardcoded secrets, 0 exposed B2 credentials, 0 Apps Script runtime URLs, 0 localhost endpoints.
- **Build Verification:** All production targets validated (`unified-portal`, `parent-portal`, `staff-portal`, Android APK debug build).
- **Clean Git Repository:** Comprehensive `.gitignore` protecting build outputs, environment configs, node_modules, and test artifacts.

## [v5.7-RC1] — 2026-08-29

### Features
- **Centralized Institutional Multi-Tenancy:** Locked to `Gameri Higher Secondary School, Gamiri` (`GAMERI-HSS-001`), Session `2026-27`.
- **Parent & Student Portal (Web/Mobile):** React 19 single-page portal with Student 360° portfolio, multi-child switcher, attendance calendar timeline, marks analytics, study notes viewer, practical activities, and institutional notices.
- **Staff Portal (Web/Desktop):** Dedicated role-gated faculty portal supporting Teacher, Principal, and Admin workflows with assigned-class filters and marks calculation engine.
- **Official ASSEB Academic Calendar 2026–27:** Complete 365-day dataset containing exactly 254 working days and official gazetted holidays.
- **Native Smart Attendance Reminder Scheduler:** Exact alarm triggers on Android with boot persistence and Saturday half-day rules.

### Cloud Synchronization & Offline Architecture
- **Bidirectional Delta Sync Engine:** Offline-first synchronization between Android Admin client and Google Apps Script backend.
- **Resilient Sync Queue (`itd3_sync_queue`):** Local storage queue with 1500ms micro-debounce, exponential backoff (2s–60s), and automatic network reconnection flushing.
- **Idempotent Primary Key Upsert:** Multi-layer conflict resolution shielding local pending edits against cloud overwrites.

### Security & Access Control
- **Cryptographic HMAC-SHA256 Sessions:** Signed session tokens with 30-day validity and instant logout revocation.
- **Zero-Trust Server-Side RBAC:** Strict backend role validation across `STUDENT`, `PARENT`, `TEACHER`, `PRINCIPAL`, and `ADMIN`.
- **IDOR Protection:** Ownership verification on all student, parent, attendance, and evaluation queries.
- **Data Sanitization:** Automatic server-side stripping of `passwordHash`, `salt`, `SERVER_SECRET`, `ADMIN_API_KEY`, and `faceEmbedding`.
- **Zero Vulnerabilities:** Verified 0 security advisories across all production npm dependency trees.

### Backup & Disaster Recovery
- **Standardized Snapshot Architecture:** Documented Google Drive snapshot backup and staging restore pathways.
- **Business Continuity:** 24-Hour RPO and < 30-Minute RTO point-in-time configuration swap standard.

### Performance & Reliability
- **0 Crashes / 0 ANRs:** Verified on Realme 6 Pro (Android 11) over Wireless ADB across cold starts, warm starts, and stress loops.
- **Memory Footprint:** Flat 72.3 MB PSS footprint on physical hardware.
- **Clean Bundles:** Web portal distributions optimized under 504 kB JS with gzip compression under 95 kB.
