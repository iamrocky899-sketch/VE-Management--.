# Phase 2 Documentation: Unified Attendance Engine Upgrade

**Application:** VE Management / IT GHSS  
**School:** Gameri Higher Secondary School, Gamiri  
**Package:** `com.itdept.itghss`  
**Version:** `v5.7` (`versionCode = 6`, `versionName = "5.7"`)  
**Phase Status:** Phase 2 Completed & 100% Validated (30/30 Automated Tests Passed)  

---

## 1. Central Attendance Engine Architecture

The Attendance Engine has been upgraded and unified into a single authoritative policy layer implemented in [asseb_calendar_2026_27.js](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/assets/libs/asseb_calendar_2026_27.js).

All attendance-related systems now use this centralized engine:
- **Manual Attendance Entry**
- **Face Recognition Attendance**
- **Month-Wise Attendance Register**
- **Attendance Reports & Exports (Excel/PDF)**
- **Student 360° Portfolio Modal & Timeline**
- **Smart Attendance Reminders (Timetable Engine)**
- **Smart Consecutive Absence Alerts (WhatsApp/SMS)**
- *(Upcoming)* **Parent Portal**

```
┌────────────────────────────────────────────────────────┐
│      Official ASSEB Academic Calendar (365 Days)       │
│  (CLASS / HOLIDAY / VACATION / EXAMINATION / ACTIVITY) │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│         Class-Specific Attendance Policy Layer         │
│  - Sunday: OFF for all classes (IX, X, XI, XII)        │
│  - Normal Saturday: Class IX-X OFF | Class XI-XII WORK │
│  - Special Saturday Exception (EXAM / ACTIVITY):       │
│    Attendance-eligible for ALL classes (including IX-X)│
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│           Teacher Operational Override Layer           │
│   (CLASS_NOT_HELD / HOLIDAY / MANUAL WORKING_DAY)      │
│   *Highest Operational Priority — Overrides Defaults*  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│            Actual Attendance State Layer               │
│  - Unrecorded eligible day ➔ ATTENDANCE_PENDING (—)    │
│  - Recorded Present       ➔ PRESENT (P)                │
│  - Recorded Absent        ➔ ABSENT (A)                 │
└────────────────────────────────────────────────────────┘
```

---

## 2. Policy Rules & Specifications

### Rule 1: Official ASSEB Calendar Source
- Direct integration with `getOfficialCalendarStatus(dateStr)` from Phase 1.
- Provides static, immutable classifications for all 365 days of 2026–27 session.

### Rule 2: Sunday Policy
- Sunday is OFF (`status: "WEEKEND"`, `isWorking: false`, `attendanceEligible: false`) for Class IX, X, XI, and XII.

### Rule 3 & 19: Saturday Policy & Special Academic Exception
- **Normal Saturday:**
  - Class IX–X: `status: "WEEKEND"`, `isWorking: false`, `attendanceEligible: false`
  - Class XI–XII: `status: "WORKING_DAY"`, `isWorking: true`, `attendanceEligible: true`
- **Special Saturday Exception:**
  - If official status is `EXAMINATION` (e.g. 2027-03-06 Class IX Annual Exam) or `ACTIVITY` (e.g. 2026-12-12 Prize Distribution), that Saturday becomes **attendance-eligible for ALL classes**, including IX–X.

### Rule 4 & 5: Holidays & Summer Vacation
- **Official Holidays (80 instances):** `attendanceEligible = false`, `isWorking = false` for all classes.
- **Summer Vacation (July 1–31):** All 31 days `officialStatus: "VACATION"`, `attendanceEligible = false` (Denominator = 0).

### Rule 6 & 7: Examination & Activity Days
- Weekday examinations (Unit Test-1, Half Yearly, Unit Test-2, Revisionary, Annual Exams) and activities (Annual Sports, Cultural Week, Result Analysis) are academic working days (`attendanceEligible = true`).

### Rule 8: Teacher Operational Override Priority
- Teacher manual day overrides (`itd3_day_status`) and legacy class-not-held entries (`itd3_cnh`) retain **highest operational priority**.
- Marking `CLASS_NOT_HELD` on any date (even during exams or normal class days) immediately sets `attendanceEligible = false` for that class.

### Rule 9: Attendance Pending vs Absent Safety
- When `attendanceEligible === true` but attendance has not yet been recorded:
  - `status: "ATTENDANCE_PENDING"`, code: `"—"`.
  - **Never** incremented as Absent.
  - **Never** counted toward consecutive absence streak.
  - **Never** triggers absence alerts.

### Rule 10 & 11: Present and Absent Recording
- Only attendance-eligible dates where attendance was recorded can have `PRESENT` or `ABSENT`.

### Rule 12 & 13: Attendance Denominator & Percentage
$$\text{Attendance \%} = \frac{\text{Present Count}}{\text{Attendance-Eligible Days for that Class}} \times 100$$
- Non-working days (Sundays, regular IX-X Saturdays, holidays, vacation, CNH) are strictly excluded from the denominator.
- Pending days remain in the denominator as eligible class days, preserving mathematical accuracy.

### Rule 14: Consecutive Absence Calculation
- Consecutive absence streak increments **only** on attendance-eligible days where attendance was recorded as `ABSENT`.
- Non-working days (Holidays, Sundays, normal IX-X Saturdays, Summer Vacation, CNH) **reset** the active continuous streak.
- Pending attendance days leave existing streaks intact without adding to the streak.

---

## 3. Feature Integrations

1. **Manual & Face Recognition Attendance:**
   - Evaluates `getAttendanceDayState(dateStr, cls)` before recording.
   - Header badge indicates official status (`🌴 HOLIDAY`, `🌴 VACATION`, `📝 EXAM`, `🎯 ACTIVITY`).
2. **Month-Wise Register (`renderRegister`, Excel/PDF Exports):**
   - Each cell resolved via `getStudentAttendanceState()`.
   - Denominators match class-specific working days.
3. **Student 360° Portfolio (`openStudentPortfolioView`):**
   - Directly calls `calculateStudentConsecutiveAbsences()` and `calculateCurrentConsecutiveAbsences()`, eliminating duplicate calculation logic.
4. **Smart Attendance Reminders (`checkAttendanceReminders`):**
   - Suppresses reminder if `!dayStat.isWorking || !dayStat.attendanceEligible`.
   - Suppresses reminder if attendance for that class/section is already recorded.
   - Triggers high-priority native notification with `[Take Attendance]` action when eligible and pending.
5. **Absence Alert System (`refreshAlertsEngine`):**
   - Centralized streak calculation feeds into localized Assamese WhatsApp/SMS message generator.

---

## 4. Automated Test Results (30/30 Passed)

Executed via `scratch/test_phase2_attendance_engine.js`:

```
=================================================================
PHASE 2 — UNIFIED ATTENDANCE ENGINE AUTOMATED TEST SUITE (30/30)
=================================================================

[PASS] ✅ Test 1: Normal Monday — IX (2026-04-06 is attendance-eligible)
[PASS] ✅ Test 2: Normal Monday — XI (2026-04-06 is attendance-eligible)
[PASS] ✅ Test 3: Sunday — IX (2026-04-05 is OFF / non-working)
[PASS] ✅ Test 4: Sunday — XI (2026-04-05 is OFF / non-working)
[PASS] ✅ Test 5: Normal Saturday — IX (2026-04-04 is Saturday OFF)
[PASS] ✅ Test 6: Normal Saturday — X (2026-04-04 is Saturday OFF)
[PASS] ✅ Test 7: Normal Saturday — XI (2026-04-04 is Saturday WORKING)
[PASS] ✅ Test 8: Normal Saturday — XII (2026-04-04 is Saturday WORKING)
[PASS] ✅ Test 9: Official holiday — IX (Good Friday 2026-04-03 is non-working)
[PASS] ✅ Test 10: Official holiday — XI (Good Friday 2026-04-03 is non-working)
[PASS] ✅ Test 11: Summer Vacation (July dates are completely non-working for all classes)
[PASS] ✅ Test 12: Examination weekday (Unit Test-1 2026-06-22 is attendance-eligible)
[PASS] ✅ Test 13: Examination Saturday — IX (Annual Exam 2027-03-06 triggers special Saturday exam exception for Class IX)
[PASS] ✅ Test 14: Examination Saturday — XI (Unit Test-1 2026-06-27 is attendance-eligible)
[PASS] ✅ Test 15: Activity weekday (Annual Sports 2026-12-08 is attendance-eligible)
[PASS] ✅ Test 16: Activity Saturday — IX (Prize Distribution 2026-12-12 triggers special Saturday activity exception for Class IX)
[PASS] ✅ Test 17: Activity Saturday — XI (Prize Distribution 2026-12-12 is attendance-eligible)
[PASS] ✅ Test 18: CLASS_NOT_HELD (Teacher override suppresses attendance eligibility for Class 9)
[PASS] ✅ Test 19: Attendance Pending (Eligible day with unrecorded attendance yields ATTENDANCE_PENDING and 0 absence count)
[PASS] ✅ Test 20: Present (Recorded present student yields PRESENT, code 'P')
[PASS] ✅ Test 21: Absent (Recorded absent student yields ABSENT, code 'A', isCountedAbsent=true)
[PASS] ✅ Test 22: Holiday between two absences (Mon absent, Tue holiday, Wed absent -> streak = 1, got 1)
[PASS] ✅ Test 23: Pending between two absences (Mon absent, Tue absent, Wed pending -> streak = 2, got 2)
[PASS] ✅ Test 24: Monthly denominator (August 2026 Class IX = 21, Class XI = 25)
[PASS] ✅ Test 25: Percentage calculation (18/20 * 100 = 90.0%)
[PASS] ✅ Test 26: Reminder suppression after attendance complete
[PASS] ✅ Test 27: Reminder suppression on official holiday (Independence Day)
[PASS] ✅ Test 28: Reminder suppression during Summer Vacation
[PASS] ✅ Test 29: Reminder suppression on teacher CLASS_NOT_HELD override
[PASS] ✅ Test 30: Absence alert threshold calculation (Present on Aug 5 correctly reset streak; Aug 6 gives streak 1, got 1)

=================================================================
TOTAL PHASE 2 TESTS: 30 | PASSED: 30 | FAILED: 0
=================================================================
```

---

## 5. Build Safety Verification

- **Debug Build:** `.\gradlew.bat assembleDebug --no-daemon` → **`BUILD SUCCESSFUL in 31s`** (0 errors)
- **Release Build:** `.\gradlew.bat assembleRelease --no-daemon` → **`BUILD SUCCESSFUL in 44s`** (0 errors)
- **Metadata Integrity:** `versionName = "5.7"`, `versionCode = 6` (Unchanged)
