# Phase 8 Documentation: Google Apps Script Cloud Backend & API

**Application:** VE Management / IT GHSS  
**School:** Gameri Higher Secondary School, Gamiri  
**Package:** `com.itdept.itghss`  
**Current Version:** `5.7` (`versionCode = 6`, `versionName = "5.7"`)  
**Phase Status:** Phase 8 Complete & 100% Validated (28/28 Automated Tests Passed)  

---

## 1. System Architecture

```
                               VE MANAGEMENT
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
           Admin Android                           Parent Website
           (Offline-First)                         (Cloud-Connected)
                 │                                       │
                 │ HTTPS (Action API)                    │ HTTPS (Action API)
                 └───────────────────┬───────────────────┘
                                     │
                                     ▼
                        GOOGLE APPS SCRIPT WEB APP
                      (Authentication, Authorization,
                       Audit Logging, Batch DB Layer)
                                     │
                                     ▼
                            GOOGLE SPREADSHEET
                   (Gameri Higher Secondary School DB)
         ┌──────────────┬──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼              ▼
      Students       Parents     ParentStudents  Attendance        Marks
    (Primary Key:   (Hashed PW    (Strict Auth     (Date-wise      (4-Exam
     studentId)      + Salt)       Mapping)         Records)      Structure)
```

- **Single-School Tenancy:** Tailored exclusively for **Gameri Higher Secondary School, Gamiri**.
- **Offline-First Admin Operations:** The Android app retains local SQLite/localStorage as its offline source of truth; attendance and student management never depend on active internet connectivity.
- **Cloud API Gateway:** Google Apps Script acts as the cloud API layer, persisting data into Google Sheets.

---

## 2. Google Sheets Database Schema

The database consists of 16 structured sheets defined in `backend/Schema.gs`:

| Sheet Name | Primary Key | Description & Key Columns |
| :--- | :--- | :--- |
| **`Students`** | `studentId` | Master student directory (`studentId`, `studentName`, `rollNo`, `class`, `section`, `gender`, `dob`, `fatherName`, `motherName`, `mobile`, `village`, `status`, `createdAt`, `updatedAt`). |
| **`Parents`** | `parentId` | Parent accounts (`parentId`, `mobile`, `passwordHash`, `salt`, `parentName`, `status`, `createdAt`, `updatedAt`). |
| **`ParentStudents`** | `relId` | **Authorization Mapping Table** (`relId`, `parentId`, `studentId`, `relationship`, `active`, `createdAt`, `updatedAt`). |
| **`Attendance`** | `attendanceId` | Authoritative date-wise attendance records (`attendanceId`, `studentId`, `date`, `class`, `section`, `status`, `source`, `updatedAt`). |
| **`Marks`** | `markId` | 4-exam academic marks (`markId`, `studentId`, `exam`, `subject`, `theory`, `practical`, `total`, `updatedAt`). |
| **`Activities`** | `activityId` | Targeted school events & activities (`activityId`, `title`, `description`, `date`, `class`, `section`, `visibility`, `createdAt`, `updatedAt`). |
| **`Notices`** | `noticeId` | School announcements (`noticeId`, `title`, `body`, `date`, `priority`, `visibility`, `class`, `section`, `createdAt`, `updatedAt`). |
| **`AcademicCalendar`** | `date` | Official ASSEB Academic Calendar 2026–27 (`date`, `academicSession`, `officialStatus`, `title`, `description`, `observations`, `note`, `isWorking`, `source`). |
| **`Timetable`** | `timetableId` | Class schedule slots (`timetableId`, `day`, `time`, `class`, `section`, `tolerance`, `reminderEnabled`, `active`, `updatedAt`). |
| **`SchoolContacts`** | `schoolName` | Configurable school contact info (`schoolName`, `principalName`, `mobile`, `email`, `address`, `emergencyContact`, `mapUrl`, `updatedAt`). |
| **`TeacherContacts`** | `teacherId` | Class teacher contact directory (`teacherId`, `teacherName`, `class`, `section`, `mobile`, `whatsapp`, `email`, `active`, `updatedAt`). |
| **`Documents`** | `documentId` | Official documents & syllabi (`documentId`, `title`, `description`, `url`, `class`, `section`, `visibility`, `createdAt`, `updatedAt`). |
| **`Achievements`** | `achievementId` | Student awards & achievements (`achievementId`, `studentId`, `title`, `description`, `date`, `visibility`, `createdAt`, `updatedAt`). |
| **`Settings`** | `key` | Global school configurations (`key`, `value`, `description`, `updatedAt`). |
| **`AuditLog`** | `logId` | Secure access & mutation audit trail (`logId`, `timestamp`, `action`, `actorType`, `actorId`, `details`, `status`, `ipAddress`). |
| **`SyncQueue`** | `syncId` | Admin batch synchronization queue (`syncId`, `clientSyncTimestamp`, `batchSize`, `status`, `processedAt`, `errors`). |

---

## 3. Entity ID Formats & Primary Keys

All primary keys use stable, unique prefixed string identifiers:
- `STU_xxxxx` — Student ID (Primary relationship key across all tables)
- `PAR_xxxxx` — Parent ID (`PAR_<mobile>`)
- `REL_xxxxx` — Parent-Student Authorization Link ID (`REL_<parentId>_<studentId>`)
- `ATT_xxxxx` — Attendance Record ID (`ATT_<studentId>_<date>`)
- `MRK_xxxxx` — Marks Record ID (`MRK_<studentId>_<exam>_<subject>`)
- `ACT_xxxxx` — Activity ID (`ACT_<timestamp>_<rand>`)
- `NTC_xxxxx` — Notice ID (`NTC_<timestamp>_<rand>`)
- `TT_xxxxx` — Timetable Slot ID
- `LOG_xxxxx` — Audit Log ID

---

## 4. Security & Authorization Architecture

### A. Server-Side Parent Authorization (Zero Trust)
- The backend **never** trusts client-supplied `studentId`s.
- On every protected parent request (`parent_dashboard`, `parent_attendance`, `parent_marks`), the backend retrieves authorized `studentId`s from `ParentStudents` where `parentId === session.parentId && active === true`.
- If a parent attempts to supply or query a `studentId` not in their authorized list, the server immediately rejects the request with **`403 UNAUTHORIZED`** and logs an `UNAUTHORIZED_ACCESS_ATTEMPT` audit event.

### B. Cryptographic Password Storage
- Passwords are **never stored as plain text**.
- Each parent record has a unique 16-character cryptographic `salt`.
- Password verification uses `SHA-256(password + salt)`.
- Session tokens are stateless, time-limited (30 days), and signed using **HMAC-SHA256** with a server-side secret stored in Google Apps Script `PropertiesService`.

### C. Admin Security
- All write/sync operations (`admin_sync`, `register_parent`, `save_activity`, etc.) require a secure `ADMIN_API_KEY` stored in `PropertiesService`.
- Parent accounts cannot invoke Admin actions.

---

## 5. Performance & Batch Quota Strategy

Google Apps Script execution limits are protected using batch operations:
- **`Database.readAll(sheetName)`:** Reads the entire sheet in **one single `getValues()` call**.
- **`Database.upsertBatch(sheetName, records)`:** Performs in-memory primary key matching, in-place updates, appends, and writes the entire dataset back in **one single `setValues()` call**.
- **No cell-by-cell loops (`getValue()`/`setValue()`)** anywhere in the backend codebase.

---

## 6. Timezone Handling
- All timestamp generation and formatting strictly uses **`Asia/Kolkata`** (`GMT+05:30`).
- Configured in `backend/appsscript.json` (`"timeZone": "Asia/Kolkata"`).

---

## 7. Automated Test Suite Results (28/28 Passed)

Executed via `scratch/test_phase8_api.js`:

```
=================================================================
PHASE 8 — GOOGLE APPS SCRIPT BACKEND & API TEST SUITE (28/28)
=================================================================

[PASS] ✅ Test 1: Admin authentication (Rejects invalid key, accepts valid key)
[PASS] ✅ Test 2: Admin student batch creation
[PASS] ✅ Test 3: Register Parent accounts and establish ParentStudents authorization mapping
[PASS] ✅ Test 4: Parent login with valid mobile and password
[PASS] ✅ Test 5: Parent login with wrong password rejected
[PASS] ✅ Test 6: Unknown parent mobile rejected
[PASS] ✅ Test 7: Parent with one child logged in with correct single child linkage
[PASS] ✅ Test 8: Parent with two children logged in with both children linked
[PASS] ✅ Test 9: [SECURITY TEST] Parent A attempting to view Parent B's child is STRICTLY DENIED (403 UNAUTHORIZED)
[PASS] ✅ Test 10: Parent A accessing authorized child (Rahul) succeeds
[PASS] ✅ Test 11: Admin attendance write
[PASS] ✅ Test 12: Duplicate attendance write is idempotent (updates existing, creates 0 duplicates)
[PASS] ✅ Test 13: Marks write with 4-exam structure
[PASS] ✅ Test 14: Activity write with class targeting
[PASS] ✅ Test 15: Notice write
[PASS] ✅ Test 16: Parent Dashboard aggregates child portfolio, attendance, marks, activities in 1 call
[PASS] ✅ Test 17: Parent attendance read for authorized child
[PASS] ✅ Test 18: Parent marks read returns 4-exam breakdown
[PASS] ✅ Test 19: Parent activity read filtered by child class
[PASS] ✅ Test 20: Parent notice read returns relevant announcements
[PASS] ✅ Test 21: Calendar read returns structured events
[PASS] ✅ Test 22: Parent contact read returns school details
[PASS] ✅ Test 23: Parent password change
[PASS] ✅ Test 23b: Login with new password succeeds and old password rejected
[PASS] ✅ Test 24: Invalid action cleanly handled without leaking stack trace
[PASS] ✅ Test 25: Missing required parameter (studentId) returns 400 error
[PASS] ✅ Test 26: Malformed JSON handled gracefully
[PASS] ✅ Test 27: Audit logs recorded securely with 0 credential leaks

=================================================================
TOTAL PHASE 8 TESTS: 28 | PASSED: 28 | FAILED: 0
=================================================================
```

---

## 8. Deployment Instructions

### Step 1: Create Google Spreadsheet
1. Open [Google Sheets](https://sheets.google.com) and create a new Spreadsheet named **`VE Management - Gameri Higher Secondary School`**.
2. Copy the Spreadsheet ID from the URL (`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`).

### Step 2: Create Apps Script Project
1. In the Spreadsheet, click **Extensions > Apps Script**.
2. Rename the project to **`VE_Management_API`**.
3. Create the script files and copy the code from `backend/`:
   - `appsscript.json` (Project Settings > Check "Show 'appsscript.json' manifest file in editor")
   - `Schema.gs`
   - `Database.gs`
   - `Auth.gs`
   - `Authorization.gs`
   - `Audit.gs`
   - `AdminApi.gs`
   - `ParentApi.gs`
   - `Code.gs`

### Step 3: Configure Script Properties (Secrets)
1. Go to **Project Settings (⚙️) > Script Properties**.
2. Add the following properties:
   - `SPREADSHEET_ID`: `<YOUR_SPREADSHEET_ID>`
   - `ADMIN_API_KEY`: `<GENERATE_STRONG_RANDOM_KEY>`
   - `SERVER_SECRET`: `<GENERATE_STRONG_RANDOM_SECRET>`

### Step 4: Deploy as Web App
1. Click **Deploy > New deployment**.
2. Select type: **Web app**.
3. Description: `VE Management API v1.0`.
4. Execute as: **Me (your Google Account)**.
5. Who has access: **Anyone** (Requests are authenticated via API Key / Session Tokens).
6. Click **Deploy** and copy the **Web App URL**.

---

## 9. Android Build Safety & Regression Verification

- **Debug Build:** `.\gradlew.bat assembleDebug --no-daemon` → **`BUILD SUCCESSFUL in 50s`** (0 errors)
- **Release Build:** `.\gradlew.bat assembleRelease --no-daemon` → **`BUILD SUCCESSFUL in 1m 14s`** (0 errors)
- **Metadata:** `versionName = "5.7"`, `versionCode = 6` (Unchanged)
- **Production Isolation:** Zero production Android code was modified to connect to the API.
