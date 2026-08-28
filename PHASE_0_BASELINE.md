# Phase 0 Baseline Report: VE Management v5.7

**Date & Time:** 2026-08-28T16:18:00+05:30  
**Project Path:** `C:\Users\HP\Downloads\ITGHSS2`  
**Application Name:** VE Management / IT GHSS  
**Status:** Stable Baseline Protected & Verified  

---

## 1. Application & Package Metadata

| Property | Value |
| :--- | :--- |
| **Application Name** | VE Management / IT GHSS |
| **Package / Namespace** | `com.itdept.itghss` |
| **Version Name** | `5.7` |
| **Version Code** | `6` |
| **Min SDK** | `26` (Android 8.0 Oreo) |
| **Target / Compile SDK** | `37` |
| **Gradle / AGP Version** | AGP `9.2.1` / Gradle `9.4.1` |
| **Java Compatibility** | Java 11 |

---

## 2. Git Checkpoint & Repository State

| Checkpoint Property | Details |
| :--- | :--- |
| **Baseline Tag Created** | `checkpoint-v5.7-baseline` |
| **Commit SHA** | `91137b956f5b0fb3615d3a6b7c2c44ad5914b990` |
| **Commit Message** | `Checkpoint: Stable VE Management v5.7 release baseline and secret protection` |
| **Branch** | `main` |
| **Working Tree Status** | Clean (All source files committed to baseline checkpoint) |

---

## 3. Build Verification Results

| Build Target | Command | Result | Duration | Actionable Tasks |
| :--- | :--- | :--- | :--- | :--- |
| **Debug Build** | `.\gradlew.bat assembleDebug --no-daemon` | **`BUILD SUCCESSFUL`** (0 errors) | 24s | 35 up-to-date |
| **Release Build** | `.\gradlew.bat assembleRelease --no-daemon` | **`BUILD SUCCESSFUL`** (0 errors) | 27s | 45 actionable tasks |

Both builds compile and assemble without compilation errors, lint errors, or dependency conflicts.

---

## 4. Secret & Configuration Safety Verification

- **`app/google-services.json` Protection:** The file is completely untracked from the Git index (`git rm --cached`) and verified as ignored by `.gitignore`. The physical file remains intact in `app/google-services.json` for local builds.
- **Keystores & Signing Keys:** `*.jks`, `*.keystore`, and `signing.properties` are explicitly ignored in `.gitignore`.
- **IDE & Temporary Caches:** `.idea/`, `.idea_backup/`, `.gradle/`, and `build/` directories are properly ignored.
- **No Tracked Secrets:** A complete audit of all tracked files in Git confirms zero accidental secrets, keys, or passwords.

---

## 5. Existing Major Features & Architecture

### A. Core Architecture
- **Single Page Application (SPA)** rendered inside Android `WebView` via `WebViewAssetLoader` with strict security settings (`allowFileAccess = false`).
- **Data Persistence:** Offline-first web `localStorage` with 26 JSON keys.
- **Bi-directional Native Bridge (`WebAppInterface`)**: Communicates between WebView JavaScript and Kotlin native code for storage, OAuth, notifications, Google Drive, and Google Calendar.

### B. Existing Major Modules Detected
1. **Dashboard (`#page-home`)**:
   - Real-time statistics (total students, active students, classes).
   - Live daily attendance progress indicators per class.
   - Direct shortcuts to WhatsApp groups.
   - Quick action tiles (Register, Calendar, Absence Alert).
2. **Student Management (`#page-students`)**:
   - Class (9–12) and Section (A/B) filterable roster.
   - Active, Inactive, and Dropout status toggling.
   - Add/Edit student modals, bulk promotion, bulk drop.
3. **Student 360° Portfolio Modal**:
   - Comprehensive student view with enrollment info, attendance breakdown, marks summary, and print/export capabilities.
4. **Attendance 2.0 System**:
   - **Month-Wise Attendance Register**: Horizontally scrollable register with sticky Roll & Name columns, status codes (`P`, `A`, `H`, `CNH`, `—`), working-day percentage calculations, and Excel/PDF exports.
   - **Attendance Calendar & Teacher Manual Day Control**: Interactive month view with day badges (`WORKING_DAY`, `HOLIDAY`, `CLASS_NOT_HELD`, `ATTENDANCE_PENDING`, `ATTENDANCE_COMPLETE`) and manual override modal.
5. **Smart Timetable & Attendance Reminders**:
   - Weekly timetable schedule management (`itd3_timetable`) with class, section, time, reminder toggle, and tolerance settings.
   - High-priority Android notification channel (`attendance_reminders`) with `[Take Attendance]` action button.
   - Notification deep link directly opening the attendance interface with class/section pre-selected.
   - Single-notification deduplication (`itd3_reminder_notified`) and offline holiday/weekend awareness.
6. **Smart WhatsApp / SMS Absence Alert Engine**:
   - Consecutive absence streak calculation with configurable threshold (default 2 days).
   - Localized Assamese alert message generator with variable replacement.
   - Teacher exclusion workflow (`Approved Leave`, `Medical Reason`, `Administrative Correction`).
   - Safe handoff tracking status (`PENDING`, `EXCLUDED`, `OPENED_IN_WHATSAPP`).
   - Package visibility queries in `AndroidManifest.xml` and URI intent routing in `MainActivity.kt`.
7. **Offline Face Recognition Attendance**:
   - Bundled offline neural net models (TinyFaceDetector, FaceLandmark68, FaceRecognition) in `assets/models/`.
   - Multi-sample enrollment and instant recognition via HTML5 camera feed.
8. **Examination & Marks Entry (`#page-marks`)**:
   - Theory + Practice = Total calculation.
   - Per-student Save/Edit controls and bulk class saving.
   - Tabular exports to Excel and PDF.
9. **Registers & Logistics**:
   - Weekly Syllabus Progress Register (`#page-syllabus`).
   - Field Visit Register (`#page-field`).
   - Raw Material Inventory Register (`#page-raw`).
   - General Ledger Register (`#page-gle`).
   - Student Groups & Class Presidents (`#page-groups`).
10. **Google Drive Integration**:
    - OAuth 2.0 via `GoogleSignInClient`.
    - Drive API v3 client managing `itghss_backup.json` in `appDataFolder`.
11. **Google Calendar Integration**:
    - Queries Indian Public Holidays (`en.indian#holiday@group.v.calendar.google.com`) and caches offline in `itd3_holidays`.

---

## 6. Pre-Existing Warnings & Observations

1. **Gradle Single-Use Daemon Warning**:
   - Running Gradle with `--no-daemon` displays an informational note about forking a single-use daemon. This is standard behavior for non-daemon command-line builds.
2. **Release Signing**:
   - `assembleRelease` completes without signing errors as standard unsigned/default release build. If a signed release APK/AAB is generated in production, release signing configurations can be supplied via environment variables or secure CI/CD properties.

---

## 7. Phase 0 Completion Verdict

> [!IMPORTANT]
> **VE Management v5.7 Baseline is fully verified and protected.**
> - All source code, Gradle configurations, and existing functionality remain intact.
> - Secrets (`app/google-services.json`, keystores) are untracked and protected by `.gitignore`.
> - Git checkpoint tag `checkpoint-v5.7-baseline` at commit `91137b9` is created.
> - Both Debug and Release builds pass with 0 errors.
> 
> **The project is 100% READY for Phase 1.**
