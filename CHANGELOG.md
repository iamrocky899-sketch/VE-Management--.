# Changelog

## v5.7 — Attendance 2.0 & Smart Timetable Reminders

### Added
- **Feature: Smart Attendance Reminder using Manual Timetable**:
  - Weekly class timetable management (Monday–Saturday) with Day, Time, Class (9–12), Section (All, A, B), Reminder toggle, Tolerance selector (5, 10, 15, 20, 30 min, default: 10 min), and active status.
  - CRUD operations: Add, Edit, Delete, and Temporarily Disable timetable entries.
  - Global Smart Reminder toggle (ON/OFF) and master tolerance setting.
  - Periodic reminder evaluation engine checking pending attendance at `scheduled_time + tolerance`.
  - Android high-priority notification channel (`attendance_reminders`) with `[Take Attendance]` action button.
  - Direct deep-link navigation from notification to the existing attendance taking interface with Class and Section pre-selected.
  - Automatic reminder cancellation when attendance for that class session is recorded.
  - Respects school weekend rules (Class IX–X Sat/Sun OFF; Class XI–XII Sun OFF), cached Google Calendar holidays, and teacher manual overrides (`CLASS_NOT_HELD`).
  - Guaranteed single notification per scheduled class occurrence (no notification spam).
  - 100% offline capability with local storage persistence (`itd3_timetable`, `itd3_reminder_settings`, `itd3_reminder_notified`).
- **Feature 1: Month-Wise Attendance Register**:
  - Traditional register-book tabular view with month navigation (`< Prev`, `Next >`), student search by name/roll, class selector (9, 10, 11, 12), and section selector (All, A, B).
  - Horizontally scrollable register grid with sticky Roll and Student Name columns.
  - Date columns 1..28/29/30/31 with status codes (`P`, `A`, `H`, `CNH`, `—`), total `P`, total `A`, and Attendance `%`.
  - Accurate denominator calculation strictly based on class-held working days.
  - Interactive student row opening the Student Attendance History modal with month breakdown and percentage pill.
  - Excel and PDF exports formatted as official attendance registers.
- **Feature 2: Smart WhatsApp Absence Alert System**:
  - Centralized consecutive absence calculation engine with configurable threshold (1–5 days, default 2).
  - Accurate multi-day streak calculation honoring Class IX–X (Sat/Sun OFF) and Class XI–XII (Sun OFF) rules, public holidays, and manual overrides.
  - Non-working days and unrecorded attendance do not count as absent and do not break the sequence.
  - Localized default Assamese WhatsApp message template with dynamic variable replacements (`{student_name}`, `{roll_no}`, `{class}`, `{section}`, `{absent_days}`, `{from_date}`, `{to_date}`, `{school_name}`, `{teacher_name}`).
  - Message Preview modal featuring interactive "Why This Alert?" data breakdown.
  - Safe WhatsApp handoff tracking status: `PENDING`, `EXCLUDED`, `OPENED_IN_WHATSAPP` (never false `SENT`).
  - Teacher exclusion workflow (`Approved Leave`, `Medical Reason`, `Administrative Correction`, `Other`) with notes to suppress duplicate alerts for the same absence sequence.
  - Alert Settings modal to configure threshold and customize Assamese template.
  - Dedicated Alert Dashboard and Home Screen quick alert badge.
- **Feature 3: Attendance Calendar & Teacher Manual Day Control**:
  - Centralized Day-Status Engine (`WORKING_DAY`, `WEEKEND`, `HOLIDAY`, `CLASS_NOT_HELD`, `ATTENDANCE_PENDING`, `ATTENDANCE_COMPLETE`).
  - Month calendar grid view with day status badges and month breakdown summary.
  - Teacher Manual Day Control modal to mark dates as Working Day, Holiday, or Class Not Held with reasons.
  - Offline Google Calendar holidays caching in `itd3_holidays`.
- Theory + Practice = Total marks calculation
- Save and Edit marks functionality
- Student Group Details view & Leader/Co-Leader badges
- Offline face-recognition assets (fully bundled) & multi-sample enrollment

### Improved
- WhatsApp intent queries added to `AndroidManifest.xml` for Android 11+ (API 30+) package visibility.
- URL loading bridge in `MainActivity.kt` updated to handle `wa.me` and `api.whatsapp.com` URL schemes.
- Google Drive synchronization updated to backup/restore `itd3_day_status`, `itd3_holidays`, `itd3_alert_threshold`, `itd3_alert_template`, `itd3_alerts`, and `itd3_alert_exclusions`.
- Face-recognition initialization and reliability.
- Camera processing efficiency and battery optimization.
- Android 16 compatibility and Edge-to-edge support.
- WebView security by adopting `WebViewAssetLoader`.

### Security
- Package visibility declarations for WhatsApp communication.
- Disabled `allowFileAccess` and related flags in WebView.
- Safe WhatsApp handoff without external network or credential exposure.

### Build
- Updated version to **v5.7**
- Incremented `versionCode` to **6**
