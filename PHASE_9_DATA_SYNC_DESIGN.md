# Phase 9 Design Document: Production Google Sheets Database & Data Sync Architecture

**Application:** VE Management / IT GHSS (`com.itdept.itghss`)  
**School:** Gameri Higher Secondary School, Gamiri  
**Current Version:** `5.7` (`versionCode = 6`, `versionName = "5.7"`)  
**Target Backend:** Google Apps Script Web App API + Google Sheets  
**Phase Status:** Phase 9 Design & Simulation Completed (100% Validated)  

---

## 1. Existing Local Storage Audit

An exhaustive audit of the Android WebView local storage architecture identified 27 active keys:

| Local Key | Type | Description & Local Usage | Cloud Relevance |
| :--- | :--- | :--- | :--- |
| `itd3_s` | Array of Objects | Student master list (`id`, `name`, `roll`, `class`, `section`, `dob`, `gender`, `father`, `mother`, `mobile`, `village`, `status`). | Authoritative for `Students`, `Parents`, `ParentStudents`. |
| `itd3_f` | Array of Objects | 128-dimensional face embedding vectors from face-api.js. | **Local Device Only** (Biometric data is never synced to cloud). |
| `itd3_a` | Map `{ date: [sids] }` | Daily present student IDs map. | Authoritative for `Attendance`. |
| `itd3_m` | Map `{ sid: { 0:{t,p}, 1:{t,p}, ... } }` | Marks breakdown for 4 exams. | Authoritative for `Marks`. |
| `itd3_notes` | Map `{ sid: [ { id, text, author, timestamp } ] }` | Teacher student notes. | Authoritative for `TeacherNotes`. |
| `itd3_timetable` | Array of Objects | Timetable slots (`id`, `day`, `time`, `class`, `section`, `tolerance`, `reminderEnabled`, `active`). | Authoritative for `Timetable`. |
| `itd3_sd` | Object | School contact details (`schoolName`, `principalName`, `mobile`, `email`, `address`). | Authoritative for `SchoolContacts`. |
| `itd3_tp` | Object | Teacher profile & WhatsApp link (`name`, `class`, `section`, `mobile`, `whatsapp`). | Authoritative for `TeacherContacts`. |
| `itd3_day_status` | Map `{ date: { status, note } }` | Manual day status overrides. | Mapped to `Settings` / `AuditLog`. |
| `itd3_cnh` | Map `{ class_date: reason }` | Class not held overrides. | Mapped to `Settings` / `AuditLog`. |
| `itd3_holidays` | Object | Google Calendar holiday cache. | Replaced by authoritative `AcademicCalendar` (ASSEB). |
| `itd3_alert_threshold` | Integer | Consecutive absence alert threshold (e.g. 2 days). | Mapped to `Settings`. |
| `itd3_alert_template` | String | Custom WhatsApp alert message template. | Mapped to `Settings`. |
| `itd3_alerts` | Array of Objects | Generated absence alert records. | Mapped to `AuditLog`. |
| `itd3_alert_exclusions` | Map `{ sid: reason }` | Medical/leave student alert exclusions. | Mapped to `Settings` / `AuditLog`. |
| `itd3_reminder_settings` | Object | Native alarm tolerance & enable state. | Mapped to `Settings`. |
| `itd3_reminder_notified` | Map `{ date_slotId: ts }` | Runtime alarm notification history. | **Local Device Only** (Ephemeral runtime state). |
| `itd3_audit` | Array of Objects | Local mutation audit trail (last 300 entries). | Mapped to `AuditLog`. |
| `itd3_wp` | Array of Objects | Weekly vocational progress log. | Mapped to `Activities`. |
| `itd3_rm` | Array of Objects | Vocational raw materials inventory log. | Mapped to `Activities`. |
| `itd3_gle` / `itd3_gl` | Array / Map | Vocational guest lectures log. | Mapped to `Activities`. |
| `itd3_fv` | Object | Vocational field visits log. | Mapped to `Activities`. |
| `itd3_wa` | Map `{ class: url }` | Class-wise WhatsApp community links. | Mapped to `TeacherContacts`. |
| `itd3_cg` | Map `{ class: { p, g } }` | Class presidents and committee members. | Mapped to `Students` / `Settings`. |
| `itd3_set` | Object | App UI preferences (`theme`, `lang`). | Mapped to `Settings`. |
| `itd3_pi` | String (Base64) | User avatar image. | **Local Device Only**. |

---

## 2. Local → Cloud Mapping Architecture

Detailed in [DATA_MAPPING.md](file:///c:/Users/HP/Downloads/ITGHSS2/DATA_MAPPING.md).

```
   LOCAL STORAGE                              GOOGLE SHEETS DATABASE
 ┌─────────────────┐                        ┌───────────────────────┐
 │ itd3_s          │ ─────────────────────> │ Students              │
 ├─────────────────┤                        ├───────────────────────┤
 │ itd3_s (Parent) │ ─────────────────────> │ Parents               │
 ├─────────────────┤                        ├───────────────────────┤
 │ itd3_s (Link)   │ ─────────────────────> │ ParentStudents        │
 ├─────────────────┤                        ├───────────────────────┤
 │ itd3_a          │ ─────────────────────> │ Attendance            │
 ├─────────────────┤                        ├───────────────────────┤
 │ itd3_m          │ ─────────────────────> │ Marks                 │
 ├─────────────────┤                        ├───────────────────────┤
 │ itd3_notes      │ ─────────────────────> │ TeacherNotes          │
 ├─────────────────┤                        ├───────────────────────┤
 │ itd3_timetable  │ ─────────────────────> │ Timetable             │
 ├─────────────────┤                        ├───────────────────────┤
 │ itd3_sd / tp    │ ─────────────────────> │ Contacts              │
 └─────────────────┘                        └───────────────────────┘
```

---

## 3. Stable Primary Key Strategy

Primary keys across all sheets use deterministic, unique string formats:
- **`studentId`**: Preserves existing Android ID (e.g. `S17180001` or `STU_...`). Never uses row index.
- **`parentId`**: `PAR_<10_DIGIT_MOBILE>` (e.g. `PAR_9876543210`).
- **`relId`**: `REL_<parentId>_<studentId>` (e.g. `REL_PAR_9876543210_S17180001`).
- **`attendanceId`**: `ATT_<studentId>_<YYYY-MM-DD>` (e.g. `ATT_S17180001_2026-08-03`).
- **`markId`**: `MRK_<studentId>_<examIndex>_IT` (e.g. `MRK_S17180001_0_IT`).
- **`noteId`**: `NOTE_<studentId>_<timestamp>` (e.g. `NOTE_S17180001_1723284000000`).
- **`timetableId`**: `TT_<id>` (e.g. `TT_1`).
- **`activityId`**: `ACT_<timestamp>_<rand>`.
- **`noticeId`**: `NTC_<timestamp>_<rand>`.
- **`logId`**: `LOG_<timestamp>_<rand>`.
- **`syncId`**: `SYNC_<timestamp>_<rand>`.

---

## 4. Synchronization Directionality

1. **`Students`**: `BIDIRECTIONAL` (Admin-controlled).
2. **`Parents` & `ParentStudents`**: `ADMIN CONTROLLED` (Generated from student guardian data or manual admin enrollment).
3. **`Attendance`**: `BIDIRECTIONAL` (Android local is authoritative for daily marking; cloud serves Parent Portal and cross-device sync).
4. **`Marks`**: `BIDIRECTIONAL` (Admin authoritative).
5. **`TeacherNotes`**: `BIDIRECTIONAL` (Admin/Teacher authored).
6. **`AcademicCalendar`**: `OFFICIAL ASSEB SOURCE → CLOUD → LOCAL` (Official ASSEB dataset is authoritative; Google Calendar cannot overwrite).
7. **`Timetable`**: `BIDIRECTIONAL` (Admin-controlled).
8. **`Activities` & `Notices`**: `LOCAL → CLOUD` (Admin published).
9. **`SchoolContacts` & `TeacherContacts`**: `ADMIN CONTROLLED`.
10. **`AuditLog`**: `LOCAL → CLOUD APPEND-ONLY`.

---

## 5. Conflict Resolution Rules

Every synchronized record carries `createdAt` and `updatedAt` ISO 8601 timestamps:
1. **Attendance Conflicts**: Latest valid modification timestamp (`updatedAt`) wins. AuditLog records changes.
2. **Marks Conflicts**: Admin-authoritative. Last modified exam marks by teacher overwrites previous entry.
3. **Student Profile Conflicts**: Last updated record wins. Student ID and historical relations are never overwritten by row index.
4. **Academic Calendar**: Immutable official ASSEB dataset (April 2026 – March 2027). Manual daily overrides stored separately in `Settings`/`AuditLog`.

---

## 6. Idempotency & Duplicate Prevention

All API endpoints (`admin_sync`, `save_attendance`, `save_marks`, `register_parent`) implement **Upsert semantics**:
- Primary key lookup is executed before writing.
- If primary key exists, record is updated in place.
- If primary key is new, row is appended.
- Validated via `scratch/test_phase9_data_sync.js`: Re-syncing the same dataset 5 times results in **0 duplicate rows**.

---

## 7. Offline Sync Queue (`SyncQueue`)

To preserve offline-first operation:
- All mutations when offline are queued locally in `itd3_sync_queue`.
- Structure:
  ```json
  {
    "syncId": "SYNC_1723284000000_a1b2",
    "entity": "Attendance",
    "entityId": "ATT_S17180001_2026-08-03",
    "operation": "UPSERT",
    "payload": { ... },
    "createdAt": "2026-08-03T10:00:00Z",
    "attemptCount": 0,
    "lastAttemptAt": null,
    "status": "PENDING",
    "errorCode": null,
    "errorMessage": null
  }
  ```
- Persisted in localStorage; survives app closures and device reboots.

---

## 8. Retry Strategy

- **Trigger:** On app open, network reconnection (`window.addEventListener('online')`), or manual sync trigger.
- **Backoff:** Exponential backoff (1s, 2s, 4s, 8s, up to max 60s) with max 5 attempts before flagging item for manual review.
- **Non-blocking:** Failed sync items do not block the UI or local attendance marking.

---

## 9. Batch Synchronization Strategy

- **No cell-by-cell or row-by-row HTTP calls.**
- Local changes are aggregated into a single `admin_sync` JSON payload containing arrays of students, attendance, marks, notes, and timetable.
- Google Apps Script processes the batch in a single atomic execution using batch `getValues()` and `setValues()`.

---

## 10. Delete & Archive Policy

- **Soft Delete Policy:** Local deletes mark the entity as `status = "Inactive"` or record `deletedAt` timestamp.
- Historical attendance records and examination marks are **never hard deleted** to maintain academic records integrity.

---

## 11. Derived Data Policy

Calculated metrics are computed dynamically on-demand and **never stored as duplicate static columns**:
- Attendance percentage: `(presentDays / totalWorkingDays) * 100` (derived from `Attendance` + `AcademicCalendar`).
- Consecutive absence streaks: Derived by `AttendanceEngine.evaluateStreak()`.
- Marks totals: `theory + practical` (validated dynamically).

---

## 12. Cloud Data Validation Rules

Automated validation checks:
1. Every `ParentStudents` row must map to an existing `studentId` in `Students`.
2. Every `Attendance` row must reference a valid `studentId` and `YYYY-MM-DD` date.
3. Every `Marks` record must have a valid `studentId` and one of 4 exam names.
4. Class values must be in `['9', '10', '11', '12']`.
5. Mobile numbers must be exactly 10 digits.

---

## 13. Data Migration & Initial Load Plan (Phase 10 Readiness)

Safe 5-step migration procedure:
1. **Extract:** Read current `localStorage` state into memory.
2. **Transform:** Map keys to cloud schema format via `transformLocalToCloudPayload()`.
3. **Validate:** Run integrity checks (`validateDatabaseIntegrity()`).
4. **Dry-Run:** Execute test sync in simulation to confirm 0 orphan records.
5. **Execute Batch Upload:** Invoke `POST /exec` with `action=admin_sync`.

---

## 14. Test Suite Validation (10/10 Passed)

Executed via `scratch/test_phase9_data_sync.js`:
- ✅ 27 Local Storage partitions audited.
- ✅ Student ID stability confirmed (`S17180001` preserved).
- ✅ Parent deduplication and sibling linking verified.
- ✅ Batch admin sync executed in single round-trips.
- ✅ Zero orphan records in `ParentStudents`, `Attendance`, `Marks`, `TeacherNotes`.
- ✅ Idempotency verified: 5x duplicate sync generated 0 duplicate records.
- ✅ Offline SyncQueue enqueuing and flush simulation passed.
- ✅ Conflict resolution timestamp rule validated.

---

## 15. Security & Secret Protection

- `ADMIN_API_KEY` and `SERVER_SECRET` are never stored in client code, test fixtures, or documentation.
- Parent passwords use SHA-256 with 16-char cryptographic salt.
- Parent authorization enforced at the server level via `ParentStudents` sheet.

---

## 16. Build Verification

- **Debug Build:** `.\gradlew.bat assembleDebug --no-daemon` ➔ `BUILD SUCCESSFUL in 34s`
- **Release Build:** `.\gradlew.bat assembleRelease --no-daemon` ➔ `BUILD SUCCESSFUL in 32s`
- **Version:** `versionName = "5.7"`, `versionCode = 6` (Unchanged).
- **Isolation:** No production Android network connection was added in this phase.
