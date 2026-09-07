# Phase 8.1 Deployment Documentation: Google Apps Script Backend & Cloud API

**Application:** VE Management / IT GHSS (`com.itdept.itghss`)  
**School:** Gameri Higher Secondary School, Gamiri (Single-School System)  
**Apps Script Project:** `VE Management Backend API` (`scriptId: 1pN0F056WG6fVoRW5uEkDT-OSNlx8KAvjbajZ2zjznoD6LHXcAvxehUgJ`)  
**Database:** `VE Management Database` (Google Spreadsheet)  
**Backend Version:** `v1.2`  
**Android Application Version:** `v5.7` (`versionCode: 6`, `versionName: "5.7"`)  
**Deployment Status:** Successfully Configured, Deployed & 100% Validated (28/28 Automated Tests Passed)  

---

## 1. Cloud Architecture Overview

```
                               VE MANAGEMENT
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
           Admin Android                           Parent Website
           (Offline-First)                         (Cloud-Connected)
                 │                                       │
                 │ HTTPS Action API                      │ HTTPS Action API
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
```

---

## 2. Google Sheets Database Schema (16 Sheets)

All sheets are automatically initialized by `Database.initializeAllSheets()` in `backend/Schema.gs`:

| Sheet Name | Primary Key | Description & Columns |
| :--- | :--- | :--- |
| **`Students`** | `studentId` | Master student directory (`studentId`, `studentName`, `rollNo`, `class`, `section`, `gender`, `dob`, `fatherName`, `motherName`, `mobile`, `aadhaar`, `village`, `status`, `createdAt`, `updatedAt`). |
| **`Parents`** | `parentId` | Parent accounts (`parentId`, `mobile`, `passwordHash`, `salt`, `parentName`, `status`, `createdAt`, `updatedAt`). |
| **`ParentStudents`** | `relId` | **Parent-Child Authorization link table** (`relId`, `parentId`, `studentId`, `relationship`, `active`, `createdAt`, `updatedAt`). |
| **`Attendance`** | `attendanceId` | Authoritative date-wise attendance records (`attendanceId`, `studentId`, `date`, `class`, `section`, `status`, `source`, `updatedAt`). |
| **`Marks`** | `markId` | 4-exam academic marks (`markId`, `studentId`, `exam`, `subject`, `theory`, `practical`, `total`, `updatedAt`). |
| **`Activities`** | `activityId` | School events with class/section targeting (`activityId`, `title`, `description`, `date`, `class`, `section`, `visibility`, `createdAt`, `updatedAt`). |
| **`Notices`** | `noticeId` | Announcements (`noticeId`, `title`, `body`, `date`, `priority`, `visibility`, `class`, `section`, `createdAt`, `updatedAt`). |
| **`AcademicCalendar`** | `date` | Official ASSEB Academic Calendar 2026–27 dataset (`date`, `academicSession`, `officialStatus`, `title`, `description`, `observations`, `note`, `isWorking`, `source`). |
| **`Timetable`** | `timetableId` | Class schedule slots (`timetableId`, `day`, `time`, `class`, `section`, `tolerance`, `reminderEnabled`, `active`, `updatedAt`). |
| **`SchoolContacts`** | `schoolName` | Configurable school contact info (`schoolName`, `principalName`, `mobile`, `email`, `address`, `emergencyContact`, `mapUrl`, `updatedAt`). |
| **`TeacherContacts`** | `teacherId` | Class teacher directory (`teacherId`, `teacherName`, `class`, `section`, `mobile`, `whatsapp`, `email`, `active`, `updatedAt`). |
| **`Documents`** | `documentId` | Syllabi & official documents (`documentId`, `title`, `description`, `url`, `class`, `section`, `visibility`, `createdAt`, `updatedAt`). |
| **`Achievements`** | `achievementId` | Student awards & recognitions (`achievementId`, `studentId`, `title`, `description`, `date`, `visibility`, `createdAt`, `updatedAt`). |
| **`Settings`** | `key` | Global school configurations (`key`, `value`, `description`, `updatedAt`). |
| **`AuditLog`** | `logId` | Security audit trail (`logId`, `timestamp`, `action`, `actorType`, `actorId`, `details`, `status`, `ipAddress`). |
| **`SyncQueue`** | `syncId` | Admin batch synchronization queue (`syncId`, `clientSyncTimestamp`, `batchSize`, `status`, `processedAt`, `errors`). |

---

## 3. Required Script Properties Configuration

The backend relies on the following Script Properties configured in **Google Apps Script > Project Settings > Script Properties**:

| Property Name | Purpose | Value Management |
| :--- | :--- | :--- |
| `SPREADSHEET_ID` | Target Google Spreadsheet identifier | Configured in Apps Script Script Properties |
| `ADMIN_API_KEY` | Secret key for Admin Android App write endpoints | Configured in Apps Script Script Properties |
| `SERVER_SECRET` | Secret HMAC-SHA256 key for signing parent session tokens | Automatically created & managed by `Auth.getSecret()` in `Auth.gs` if not preset |

> [!IMPORTANT]
> Actual secret values are never logged, committed to version control, or exposed to parent API responses.

---

## 4. Production Web App Deployment

- **Deployment ID:** `AKfycbwbIVJsHp6w1Md0RW5XEVDJN2Tahna_APwv3CCvzTtHdTtlDrPcZSc0eb8xJ1wNon7Q` (`@3`, v1.2)
- **Production `/exec` Endpoint:**
  `https://script.google.com/macros/s/AKfycbwbIVJsHp6w1Md0RW5XEVDJN2Tahna_APwv3CCvzTtHdTtlDrPcZSc0eb8xJ1wNon7Q/exec`
- **Execution Identity:** Configured Backend Owner Account (`executeAs: USER_DEPLOYING`)
- **Access Level:** `ANYONE_ANONYMOUS` (Access control is strictly enforced server-side via `ADMIN_API_KEY` and HMAC-signed session tokens)
- **Timezone:** `Asia/Kolkata` (`GMT+05:30`) configured in `appsscript.json`

---

## 5. Security & Authorization Model

### A. Zero-Trust Parent Authorization
- The backend **never** trusts client-supplied `studentId`s.
- On every protected parent request (`parent_dashboard`, `parent_attendance`, `parent_marks`), the backend retrieves authorized `studentId`s from `ParentStudents` where `parentId === session.parentId && active === true`.
- If a parent attempts to query data for another parent's child (e.g. Parent A requesting Student B), the request is immediately rejected with **`403 UNAUTHORIZED`** at the server level.

### B. Cryptographic Password Security
- Passwords are **never stored as plain text**.
- Each parent record has a unique 16-character cryptographic `salt`.
- Password verification uses `SHA-256(password + salt)`.
- Session tokens are stateless, time-limited (30 days), and signed using **HMAC-SHA256** with `SERVER_SECRET`.

---

## 6. Automated Test Suite Results (28/28 Passed)

Executed via `scratch/test_phase8_api.js`:

| # | Test Case Description | Status |
| :-: | :--- | :-: |
| **1** | Admin Authentication (Rejects invalid key, accepts valid key) | **PASS ✅** |
| **2** | Admin student batch creation | **PASS ✅** |
| **3** | Register Parent accounts and establish ParentStudents authorization mapping | **PASS ✅** |
| **4** | Parent login with valid mobile and password | **PASS ✅** |
| **5** | Parent login with wrong password rejected | **PASS ✅** |
| **6** | Unknown parent mobile rejected | **PASS ✅** |
| **7** | Parent with one child logged in with correct single child linkage | **PASS ✅** |
| **8** | Parent with two children logged in with both children linked | **PASS ✅** |
| **9** | **[SECURITY TEST] Parent A attempting to view Parent B's child is STRICTLY DENIED (403)** | **PASS ✅** |
| **10** | Parent A accessing authorized child (Rahul) succeeds | **PASS ✅** |
| **11** | Admin attendance write | **PASS ✅** |
| **12** | Duplicate attendance write is idempotent (updates in place, 0 duplicate rows) | **PASS ✅** |
| **13** | Marks write with 4-exam structure | **PASS ✅** |
| **14** | Activity write with class targeting | **PASS ✅** |
| **15** | Notice write | **PASS ✅** |
| **16** | Parent Dashboard aggregates child portfolio, attendance, marks, activities in 1 call | **PASS ✅** |
| **17** | Parent attendance read for authorized child | **PASS ✅** |
| **18** | Parent marks read returns 4-exam breakdown | **PASS ✅** |
| **19** | Parent activity read filtered by child class | **PASS ✅** |
| **20** | Parent notice read returns relevant announcements | **PASS ✅** |
| **21** | Calendar read returns structured events | **PASS ✅** |
| **22** | Parent contact read returns school details | **PASS ✅** |
| **23** | Parent password change | **PASS ✅** |
| **23b** | Login with new password succeeds and old password rejected | **PASS ✅** |
| **24** | Invalid action cleanly handled without leaking stack trace | **PASS ✅** |
| **25** | Missing required parameter (`studentId`) returns 400 error | **PASS ✅** |
| **26** | Malformed JSON handled gracefully | **PASS ✅** |
| **27** | Audit logs recorded securely with 0 credential leaks | **PASS ✅** |

---

## 7. Android Project Safety & Integrity

- **Debug Build:** `.\gradlew.bat assembleDebug --no-daemon` ➔ **`BUILD SUCCESSFUL in 34s`** (0 errors)
- **Release Build:** `.\gradlew.bat assembleRelease --no-daemon` ➔ **`BUILD SUCCESSFUL in 32s`** (0 errors)
- **Version Integrity:** `versionName = "5.7"`, `versionCode = 6` (Unchanged)
- **Production Isolation Confirmation:** **No production Android code was modified to connect to the API in this phase.** Android local offline operation, Google Drive backup, Attendance Engine, Face Recognition, Smart Reminders, and Timetable remain 100% intact.
