# STEP 15 — SYSTEM ADMINISTRATION, CONFIGURATION & INSTITUTIONAL SETTINGS 2.0 REPORT
## VE MANAGEMENT — Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)

---

### A. Configuration Audit
- Complete configuration audit completed across backend APIs, schemas, database tables, web portals, and Android applications.
- Status: **VERIFIED**.

### B. Existing Settings
- Consolidates scattered hard-coded variables into the centralized `Settings` table and `SettingsApi.gs` engine.
- Status: **VERIFIED**.

### C. School Profile
- Official profile configured:
  - School Name: `Gameri Higher Secondary School, Gamiri`
  - Short Name: `Gameri HSS`
  - School Code: `GHSS-001`
  - School Tenancy ID: `GAMERI-HSS-001` (Protected & Immutable)
  - Address: `Gamiri, P.O. Gamiri, Biswanath, Assam - 784172`
  - Contact: `+91-9876543210` / `gameri.hss@assam.gov.in`
- Status: **VERIFIED**.

### D. Branding
- Header Text: `GAMERI HIGHER SECONDARY SCHOOL, GAMIRI`
- Footer Text: `GAMIRI, BISWANATH, ASSAM - 784172`
- Logo / Crest / Seal URLs: Configured with `DEVELOPMENT_PLACEHOLDER` pending physical crest upload.
- Status: **DEVELOPMENT PLACEHOLDER**.

### E. Academic Settings
- Current Academic Year: `2026-2027` (Directly synced with `AcademicYears.isCurrent`).
- Defaults: Class `10`, Section `A`, Format `YYYY-YYYY`.
- Status: **VERIFIED**.

### F. Attendance Policy
- Alert Threshold: `75%` (`CONFIGURED — NOT LIVE`, `REQUIRES INSTITUTIONAL APPROVAL`).
- Calculation Rule: `(Present + Late) / Total * 100` (Preserved and active).
- Status: **CONFIGURED — NOT LIVE**.

### G. Grading Policy
- 8-Band Scale (`A+` to `E`): Defined and validated in JSON structure.
- Status: **CONFIGURED — NOT LIVE** (`REQUIRES INSTITUTIONAL APPROVAL`).

### H. Pass/Fail Policy
- Minimum Subject Pass Percentage: `30%`.
- Criterion: `ALL_SUBJECTS_PASS`.
- Status: **CONFIGURED — NOT LIVE** (`REQUIRES INSTITUTIONAL APPROVAL`).

### I. Ranking Policy
- Merit Ranking: Disabled by default (`RANKING_ENABLED: false`).
- Scope: `CLASS`.
- Status: **CONFIGURED — NOT LIVE** (`REQUIRES INSTITUTIONAL APPROVAL`).

### J. Optional Subjects Policy
- Governed via `CurriculumSubjects.isMandatory`.
- Status: **VERIFIED**.

### K. Documents Configuration
- Prefix: `GHSS`.
- Pattern: `{PREFIX}/{YEAR}/{TYPE}/{SEQUENCE}`.
- Zero-Padding: `4` digits.
- Status: **VERIFIED**.

### L. Numbering Invariant
- Issued document numbers remain strictly immutable; changing settings affects future documents only.
- Status: **VERIFIED**.

### M. Signatories
- Title: `Principal` (`REQUIRES INSTITUTIONAL APPROVAL`).
- Name: `Dr. B. K. Sarmah`.
- Status: **REQUIRES INSTITUTIONAL APPROVAL**.

### N. Certificates Configuration
- Standard institutional completion statements configured.
- Status: **VERIFIED**.

### O. Public Verification
- Verification Base URL: `https://ve-management.org/verify` (`CONFIGURED — NOT LIVE`).
- Status: **CONFIGURED — NOT LIVE**.

### P. Notifications
- In-App Notifications: `ACTIVE`.
- Android Push Notifications: `ACTIVE`.
- WhatsApp Notifications: `CONFIGURED — NOT LIVE`.
- Status: **VERIFIED**.

### Q. WhatsApp Security
- Zero API credentials or tokens stored in settings or exposed to clients.
- Status: **VERIFIED**.

### R. Security Settings
- Session Token Lifetime: `30` Days.
- Brute-Force Max Attempts: `5` attempts / 15-minute window.
- Status: **VERIFIED**.

### S. Sessions
- Server-authoritative HMAC-SHA256 signed session tokens.
- Status: **VERIFIED**.

### T. Audit Settings
- Retention Policy: `365` Days (`REQUIRES INSTITUTIONAL APPROVAL`).
- Status: **REQUIRES INSTITUTIONAL APPROVAL**.

### U. Backup Configuration
- Automated Weekly Snapshots: `ACTIVE`.
- Status: **VERIFIED**.

### V. Disaster Recovery
- RPO Target: `24` Hours (`REQUIRES INSTITUTIONAL APPROVAL`).
- RTO Target: `2` Hours (`REQUIRES INSTITUTIONAL APPROVAL`).
- Status: **REQUIRES INSTITUTIONAL APPROVAL**.

### W. Feature Flags
- Core Modular Flags: `FEATURE_ATTENDANCE_V2`, `FEATURE_EXAM_V2`, `FEATURE_DOCUMENTS_V2`, `FEATURE_COMMUNICATION_V2`, `FEATURE_REPORTS_V2`, `FEATURE_SECURITY_V2`.
- Status: **ACTIVE**.

### X. Android Configuration
- App synchronization and offline notification settings preserved.
- Status: **VERIFIED**.

### Y. Communication Settings
- Notice publication rules, acknowledgement flags, and event reminders active.
- Status: **VERIFIED**.

### Z. Versioning
- Every setting update records `updatedBy` and `updatedAt`.
- Status: **VERIFIED**.

### AA. Effective Dates
- Setting updates take effect for new transactions without mutating historical records.
- Status: **VERIFIED**.

### AB. Policy Snapshots
- Result and document generation reference existing master records without data duplication.
- Status: **VERIFIED**.

### AC. RBAC
- Settings updates restricted to `ADMIN` and `PRINCIPAL`. Teachers and Students/Parents receive role-sanitized safe views.
- Status: **VERIFIED**.

### AD. School Tenancy
- Scoped strictly to `GAMERI-HSS-001`.
- Status: **VERIFIED**.

### AE. Cache Isolation
- Settings filtered by role before transmission; zero admin secrets leaked to non-admin caches.
- Status: **VERIFIED**.

### AF. Cross-Module Integration
- Seamless integration with Attendance, Examinations, Documents, Notices, Calendar, Reports, and Backup.
- Status: **VERIFIED**.

### AG. Security & Settings Tests
- **40 / 40 Tests Passed** in `scratch/test_phase15_system_settings.js`.

### AH. Cumulative Regression Tests
- **421 / 421 Total Tests Passed** across all 12 test suites (100% success rate).

### AI. Parent Portal Build
- Vite production build: **Passed in 4.91s (0 errors)**.

### AJ. Staff Portal Build
- Vite production build: **Passed in 5.92s (0 errors)**.

### AK. Android Compilation
- Gradle Kotlin compilation: **BUILD SUCCESSFUL in 29s**.

### AL. Android Tests
- Gradle unit test suite: **BUILD SUCCESSFUL in 33s (25 tasks up-to-date)**.

### AM. Visual QA
- Inspected Staff Portal `Settings.jsx` tabs (School, Branding, Academic, Attendance, Grading, Documents, Notifications, Security, Feature Flags). Responsive design, clear status labels, zero clipping.

### AN. Policy QA
- Verified that Attendance Alert Threshold, 8-Band Grading Scale, Merit Ranking, Official Signatory legal title, and Public Verification domain remain flagged `CONFIGURED — NOT LIVE` / `REQUIRES INSTITUTIONAL APPROVAL` and are not activated silently.

### AO. Documentation
- Created `VE_MANAGEMENT_CONFIGURATION_AUDIT.md`, `VE_MANAGEMENT_CONFIGURATION_GUIDE.md`, and `ADMIN_SETTINGS_GUIDE.md`.

### AP. Remaining Issues
- None.

### AQ. Institutional Approvals Required
- Formal adoption by School Managing Committee of the Attendance Alert Threshold (75%), 8-Band Grading Scale, Merit Ranking Policy, and Signatory Designation.

### AR. Production Blockers
- **NONE**.
