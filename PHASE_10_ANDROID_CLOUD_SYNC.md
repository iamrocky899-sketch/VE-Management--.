# Phase 10 Documentation: Android App → Google Apps Script Production Sync

**Application:** VE Management / IT GHSS (`com.itdept.itghss`)  
**School:** Gameri Higher Secondary School, Gamiri  
**Current Version:** `5.7` (`versionCode = 6`, `versionName = "5.7"`)  
**Backend:** Google Apps Script Web App API + Google Sheets  
**Phase Status:** Phase 10 Completed & 100% Validated (31/31 Automated Tests Passed)  

---

## 1. Synchronization Architecture

```
                      ANDROID ADMIN APP (VE MANAGEMENT)
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           │                                                   │
     LOCAL STORAGE                                    GOOGLE DRIVE BACKUP
 (Immediate Local Writes &                         (Manual / Full Snapshot)
  Instant UI Responsiveness)                                   │
           │                                                   │
           ▼                                                   │
      SYNC QUEUE                                               │
 (itd3_sync_queue in localStorage)                             │
           │                                                   │
           ▼ (Asynchronous Batch HTTP)                         │
  SYNCMANAGER CLIENT (libs/sync_manager.js)                    │
           │                                                   │
           │ HTTPS action=admin_sync                           │
           ▼                                                   │
 GOOGLE APPS SCRIPT WEB APP                                    │
           │                                                   │
           ▼ (Batch getValues/setValues)                       │
  GOOGLE SPREADSHEET (17 Sheets)                               │
 (Students, Attendance, Marks, Notes, etc.)                    │
           │                                                   │
           ▼                                                   ▼
 FUTURE PARENT PORTAL                                 FULL JSON RESTORE
```

---

## 2. Centralized Sync Client (`SyncManager`)

The sync architecture is encapsulated within [`app/src/main/assets/libs/sync_manager.js`](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/assets/libs/sync_manager.js):
- **Non-blocking Execution:** Local mutations complete in memory and `localStorage` before `SyncManager.enqueue()` is called.
- **Single HTTP Channel:** All entity updates (`Students`, `Attendance`, `Marks`, `TeacherNotes`, `Timetable`, `SchoolContacts`) are consolidated into a single structured `admin_sync` batch payload.
- **Biometric Protection:** Face recognition descriptors (`itd3_f`) and avatar images (`itd3_pi`) are strictly filtered out and never leave the local device.

---

## 3. Offline-First Flow & Local Storage Guarantee

1. **Teacher Action:** Takes attendance, enters marks, or edits a student profile.
2. **Local Commit:** `saveData()` commits to `localStorage` immediately; UI updates in 0ms.
3. **Queue Item Created:** `SyncManager.enqueue(entity, entityId, operation, payload)` adds an item with `status: 'PENDING'`.
4. **Network Detection:**
   - **If Online:** `SyncManager.scheduleFlush(500)` triggers an asynchronous batch HTTP POST.
   - **If Offline:** Item remains safely in `localStorage`. No errors or blocking spinners are shown to the user.
5. **Network Restoration:** When `window.addEventListener('online')` fires, `SyncManager.flush()` automatically drains the queue.

---

## 4. Persistent SyncQueue Structure

Stored in `localStorage.getItem('itd3_sync_queue')`:

```json
{
  "syncId": "SYNC_1723284000000_a1b2",
  "entity": "Attendance",
  "entityId": "ATT_S17180001_2026-08-03",
  "operation": "UPSERT",
  "payload": {
    "2026-08-03": ["S17180001"]
  },
  "createdAt": "2026-08-03T10:00:00Z",
  "attemptCount": 0,
  "lastAttemptAt": null,
  "status": "PENDING",
  "errorCode": null,
  "errorMessage": null
}
```

---

## 5. Exponential Backoff & Retry Strategy

When a network request times out or encounters a server error:
- `attemptCount` increments.
- Status is updated to `FAILED`.
- Next retry delay is calculated using bounded exponential backoff:
  $$\text{delay} = \min(60000\text{ ms}, 1500\text{ ms} \times 2^{\text{attemptCount}})$$
- Max attempts: 5. If max attempts are reached, item remains safely stored locally until the next network reconnect or manual sync trigger.

---

## 6. Coexistence with Existing Systems

1. **Google Drive Backup:**
   - Full JSON snapshot backup/restore via `window.Android.syncToDrive` and `requestSyncFromDrive` remains completely intact in `saveData()`.
2. **Native AlarmManager Reminders:**
   - `AttendanceReminderScheduler`, `AttendanceReminderReceiver`, and `BootCompletedReceiver` operate independently on native Android background alarms.
3. **Face Recognition Attendance Engine:**
   - 128-d face descriptors remain local to the device and are never sent over the network.

---

## 7. Automated Test Suite Results (31/31 Passed)

Executed via [`scratch/test_phase10_sync_manager.js`](file:///c:/Users/HP/Downloads/ITGHSS2/scratch/test_phase10_sync_manager.js):

| # | Test Scenario | Status |
| :-: | :--- | :-: |
| **1** | API Ping returns ONLINE status | **PASS ✅** |
| **2** | Network unavailable: Enqueues locally with PENDING status (0 data loss) | **PASS ✅** |
| **3** | Queue creation verified in localStorage | **PASS ✅** |
| **4** | Queue persistence across app restarts | **PASS ✅** |
| **5** | Queue flush empties queue upon successful synchronization | **PASS ✅** |
| **6** | Retry mechanism records attemptCount and sets status to FAILED on network drop | **PASS ✅** |
| **7** | Bounded exponential backoff calculated properly | **PASS ✅** |
| **8** | Successful sync clears queue once online | **PASS ✅** |
| **9** | Duplicate sync produces exactly 1 cloud attendance record (0 duplicates) | **PASS ✅** |
| **10** | Student sync writes student details to cloud | **PASS ✅** |
| **11** | Attendance sync writes date-wise status | **PASS ✅** |
| **12** | Marks sync writes 4-exam theory/practical/total breakdown | **PASS ✅** |
| **13** | Teacher notes sync writes note record | **PASS ✅** |
| **14** | Timetable sync writes schedule slot | **PASS ✅** |
| **15** | Activity sync writes school activity | **PASS ✅** |
| **16** | Notice sync writes announcement | **PASS ✅** |
| **17** | School contacts sync writes contact directory | **PASS ✅** |
| **18** | Academic calendar preserved as official ASSEB dataset | **PASS ✅** |
| **19** | Parent registration & ParentStudents links strictly admin-controlled | **PASS ✅** |
| **20** | Unauthorized API key call rejected with 401 UNAUTHORIZED | **PASS ✅** |
| **21** | Conflict detection timestamp comparison verified | **PASS ✅** |
| **22** | Conflict resolution preserves latest valid attendance state | **PASS ✅** |
| **23** | App restart seamlessly recovers pending sync queue | **PASS ✅** |
| **24** | Network restoration triggers auto-flush successfully | **PASS ✅** |
| **25** | Batch sync consolidates multiple entity mutations | **PASS ✅** |
| **25b**| Batch sync executes in single consolidated HTTP request | **PASS ✅** |
| **26** | Google Drive backup functions remain intact in index.html | **PASS ✅** |
| **27** | Native AlarmManager reminders and AssebCalendarHelper remain intact in MainActivity.kt | **PASS ✅** |
| **28** | Biometric face descriptors (`itd3_f`) are strictly EXCLUDED from cloud sync | **PASS ✅** |
| **29** | Local attendance operation completes immediately when offline | **PASS ✅** |
| **30** | Application version preserved (`versionCode = 6`, `versionName = '5.7'`) | **PASS ✅** |

---

## 8. Physical Device Testing Procedure

1. **Step 1 (Offline Mode):** Turn off Wi-Fi and Mobile Data on the Android device.
2. **Step 2 (Local Operation):** Take morning attendance for Class 9A, edit a student profile, and enter 1st Unit Test marks. Observe that the app functions instantly with 0 lag.
3. **Step 3 (Queue Inspection):** In Settings > Sync Status, verify that the indicator displays `⏳ 3 Pending Sync`.
4. **Step 4 (Online Mode):** Turn on Wi-Fi or Mobile Data.
5. **Step 5 (Auto-Flush):** Observe that the sync indicator automatically transitions to `⚡ Syncing...` then `☁ Synced`.
6. **Step 6 (Verification):** Open the Google Spreadsheet (`VE Management Database`) and verify that the `Students`, `Attendance`, and `Marks` sheets contain the exact records.

---

## 9. Build Verification Results

- **Debug Build:** `.\gradlew.bat assembleDebug --no-daemon` ➔ **`BUILD SUCCESSFUL in 36s`** (0 errors).
- **Release Build:** `.\gradlew.bat assembleRelease --no-daemon` ➔ **`BUILD SUCCESSFUL in 58s`** (0 errors).
- **Version Integrity:** `versionName = "5.7"`, `versionCode = 6` (Unchanged).
