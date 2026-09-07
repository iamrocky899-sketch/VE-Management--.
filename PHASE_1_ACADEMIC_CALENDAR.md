# Phase 1 Documentation: Official ASSEB Academic Calendar 2026–27

**Application:** VE Management / IT GHSS  
**School:** Gameri Higher Secondary School, Gamiri  
**Package:** `com.itdept.itghss`  
**Version:** `v5.7` (`versionCode = 6`, `versionName = "5.7"`)  
**Phase Status:** Phase 1 Completed & Validated  

---

## 1. Official Source & Academic Session

- **Official Authority:** Assam State School Education Board (ASSEB), Division-I
- **Official Document:** Academic Calendar : 2026-27
- **Academic Session Period:** April 1, 2026 – March 31, 2027 (12 Months, 365 Days)
- **Official Total Working Days:** **254 Days**
- **School Location & Rules Context:** Gameri Higher Secondary School, Gamiri (Assam)

---

## 2. Official Monthly Working-Day Totals & Validation

All 12 months have been structured and verified against the official ASSEB monthly pages:

| Month | Total Days | Non-Working Days (Holidays/Vacation/Sundays) | Official Working Days | Validation Status |
| :--- | :---: | :---: | :---: | :---: |
| **April 2026** | 30 | 10 (4 Sundays + 6 Holidays) | **20** | **PASS ✅** |
| **May 2026** | 31 | 7 (5 Sundays + 2 Holidays) | **24** | **PASS ✅** |
| **June 2026** | 30 | 5 (4 Sundays + 1 Holiday) | **25** | **PASS ✅** |
| **July 2026** | 31 | 31 (Summer Vacation: all 31 days) | **0** | **PASS ✅** |
| **August 2026** | 31 | 6 (5 Sundays + 1 Holiday) | **25** | **PASS ✅** |
| **September 2026** | 30 | 9 (4 Sundays + 5 Holidays) | **21** | **PASS ✅** |
| **October 2026** | 31 | 8 (4 Sundays + 4 Holidays) | **23** | **PASS ✅** |
| **November 2026** | 30 | 7 (5 Sundays + 2 Holidays) | **23** | **PASS ✅** |
| **December 2026** | 31 | 6 (4 Sundays + 2 Holidays) | **25** | **PASS ✅** |
| **January 2027** | 31 | 9 (5 Sundays + 4 Holidays) | **22** | **PASS ✅** |
| **February 2027** | 28 | 6 (4 Sundays + 2 Holidays) | **22** | **PASS ✅** |
| **March 2027** | 31 | 7 (4 Sundays + 3 Holidays) | **24** | **PASS ✅** |
| **Total Session** | **365** | **111** | **254** | **ALL 12 MONTHS MATCHED (100%) ✅** |

---

## 3. Data Model Architecture

The architecture enforces a strict decoupling between **Official Calendar Status** and **Attendance Eligibility**:

```
Official ASSEB Calendar Data (Static, 365 Days)
                  ↓
          Official Status
  (CLASS / HOLIDAY / VACATION / EXAMINATION / ACTIVITY)
                  ↓
       Class-Specific Policy Layer
  (Class IX–X: Sat/Sun OFF | Class XI–XII: Sun OFF, Sat WORKING)
                  ↓
       Teacher Override Layer
  (itd3_day_status / itd3_cnh: Class Not Held / Holiday / Manual Working)
                  ↓
       Final Attendance Eligibility
  (attendanceEligible: true/false | isWorking: true/false | status)
```

### Calendar Record Schema
Location: [asseb_calendar_2026_27.js](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/assets/libs/asseb_calendar_2026_27.js)

```javascript
{
    "date": "YYYY-MM-DD",
    "academicSession": "2026-27",
    "officialStatus": "CLASS" | "HOLIDAY" | "VACATION" | "EXAMINATION" | "ACTIVITY",
    "title": "Title or Holiday Name",
    "description": "Descriptive context",
    "observations": ["Official Observations e.g. World Health Day"],
    "note": "Official notes e.g. Except Barak Valley",
    "attendanceEligible": null, // Computed dynamically by Policy Engine
    "source": "ASSEB Academic Calendar 2026-27",
    "sourcePage": null,
    "official": true
}
```

---

## 4. Official Holiday, Vacation, Examination & Activity Schedule

### A. Holidays & Vacation
- **April 2026:**
  - 2026-04-03: Good Friday
  - 2026-04-14, 15, 16: Bohag Bihu (3 days)
  - 2026-04-18: Tithi of Damodardeva
  - 2026-04-21: Sati Sadhani Divas
- **May 2026:**
  - 2026-05-01: May Day / Buddha Purnima
  - 2026-05-27: Id-ul-Zuha
- **June 2026:**
  - 2026-06-01: Janmashtami of Sri Sri Madhabdeva
- **July 2026 (Summer Vacation):**
  - 2026-07-01 through 2026-07-31 (Entire month = 0 working days)
- **August 2026:**
  - 2026-08-15: Independence Day
- **September 2026:**
  - 2026-09-01: Tirubhav Tithi of Sri Sri Madhabdeva
  - 2026-09-04: Janmashtami
  - 2026-09-12: Tithi of Srimanta Sankardeva
  - 2026-09-21: Janmashtami of Sri Sri Sankardeva
  - 2026-09-22: Karam Puja
- **October 2026:**
  - 2026-10-02: Birth Day of Mahatma Gandhi
  - 2026-10-18: Kali Puja & Durga Puja (Sunday)
  - 2026-10-19, 20: Durga Puja
  - 2026-10-21: Vijaya Dashami
  - 2026-10-25: Lakhi Puja (Sunday)
  - *(Note: 2026-10-22, 23, 24, 26 are Class days with "Except Barak Valley" note)*
- **November 2026:**
  - 2026-11-08: Kali Puja & Diwali (Sunday)
  - 2026-11-11: Bhatridwitiya / National Education Day
  - 2026-11-15: Chhath Puja (Sunday)
  - 2026-11-24: Guru Nanak's Birthday / Lachit Divas
- **December 2026:**
  - 2026-12-02: Asom Divas
  - 2026-12-25: Christmas Day
- **January 2027:**
  - 2027-01-14: Magh Bihu
  - 2027-01-15: Magh Bihu & Tusu Puja
  - 2027-01-17: Silpi Divas (Sunday)
  - 2027-01-23: Netaji's Birthday
  - 2027-01-24: World Girl Child Day (Sunday)
  - 2027-01-26: Republic Day
- **February 2027:**
  - 2027-02-17: Ali Aye Ligang
  - 2027-02-20: Bir Chilarai Divas
  - 2027-02-21: International Mother Language Day (Sunday)
  - 2027-02-28: National Science Day (Sunday)
- **March 2027:**
  - 2027-03-09: Id-ul-Fitr
  - 2027-03-22: Holi / World Water Day
  - 2027-03-26: Good Friday

### B. Examination Periods (Official Status = `EXAMINATION`, Attendance Eligible)
- **Unit Test-1:** 2026-06-22 through 2026-06-27 (6 days)
- **Half Yearly Examination:** 2026-09-24 through 2026-09-30 (excluding 2026-09-27 Sunday)
- **Unit Test-2:** 2026-11-23 through 2026-11-30 (excluding 2026-11-24 Holiday & 2026-11-29 Sunday)
- **Revisionary & Practical Exams:** 2027-01-02 through 2027-01-09, 2027-01-11 (excluding 2027-01-03 Sunday)
- **Annual Examination (Class IX):** 2027-03-06, 2027-03-08, 2027-03-10 through 2027-03-13, 2027-03-15

### C. Activities & Observations (Official Status = `ACTIVITY` / `CLASS`, Attendance Eligible)
- **Annual Sports & Cultural Week:** 2026-12-08 through 2026-12-12
- **Result Evaluation & Declarations:** 2027-03-17 through 2027-03-20, 2027-03-23 through 2027-03-25, 2027-03-27 (Results), 2027-03-29 (Analysis), 2027-03-30 to 31 (Routine Formation)
- **32 Official Observations Recorded:** World Health Day, Earth Day, Rabindra Jayanti, Environment Day, Bishnu Rabha Divas, Yoga Day, Teachers' Day, Lachit Divas, Mathematics Day, Silpi Divas, Republic Day, Saraswati Puja, etc.

---

## 5. Class Policy & Teacher Override Layer

### Class Policy Specification
- **Classes IX and X:**
  - Sunday: OFF (`WEEKEND`, `isWorking: false`, `attendanceEligible: false`)
  - Saturday: Normally OFF according to existing school operating rule (`WEEKEND`, `isWorking: false`, `attendanceEligible: false`)
- **Classes XI and XII:**
  - Sunday: OFF (`WEEKEND`, `isWorking: false`, `attendanceEligible: false`)
  - Saturday: Normally WORKING (`WORKING_DAY`, `isWorking: true`, `attendanceEligible: true`)

### Teacher Override Precedence
1. **Teacher Manual Override (`itd3_day_status`):** If a teacher explicitly marks a date as `HOLIDAY`, `CLASS_NOT_HELD`, or `WORKING_DAY`, this override takes top priority.
2. **Legacy Class Not Held Register (`itd3_cnh`):** Suppresses attendance eligibility for specific classes.
3. **Official ASSEB Calendar (`ASSEB_CALENDAR_MAP`):** Official holidays and Summer Vacation override class schedules and are never attendance-eligible.
4. **Class Weekend Policy:** Applies Saturday rules based on class number (9/10 vs 11/12).
5. **Pending Attendance Rule:** Unrecorded or pending attendance days remain pending and are **never** treated as Absent.

---

## 6. Google Calendar Dependency Audit

As required, existing Google Calendar code has been analyzed and documented:

| Location | Usage | Current Status | Replacement Plan |
| :--- | :--- | :--- | :--- |
| **`MainActivity.kt` (`fetchHolidays`)** | Calls Google Calendar API v3 to fetch Indian Public Holidays | Retained (Inactive for working-day calculations) | Transition to ASSEB calendar offline feed |
| **`index.html` (`window.onHolidaysLoaded`)** | Receives JSON from native bridge and writes to `itd3_holidays` | Retained for backward compatibility | Deprecate in Phase 4/5 |
| **`index.html` (`getDayStatus`)** | Previously checked `holidays[dateStr]` | **Replaced with ASSEB Calendar Policy Engine** | Completed in Phase 1 |
| **`index.html` (`renderManualAttendanceList`)** | Displayed `holidays[selectedDate]` | **Replaced with ASSEB Official Status** | Completed in Phase 1 |
| **`index.html` (`localStorage` key `itd3_holidays`)** | Stored Google Calendar holiday cache | Retained in backup/restore payload | Safe to persist |

> [!NOTE]
> Google Calendar code is preserved in `MainActivity.kt` and `index.html` without causing any interference. All holiday detection, working-day calculations, register computations, and absence alerts now derive strictly from the official ASSEB Academic Calendar 2026–27.

---

## 7. Comprehensive Automated Validation Results

Executed via automated test suite `scratch/test_calendar_validation.js`:

```
==========================================
ASSEB ACADEMIC CALENDAR 2026-27 VALIDATION
==========================================

[PASS] ✅ Test 1: All 12 months exist (April 2026 - March 2027)
[PASS] ✅ Test 2: All dates have academicSession = '2026-27'
[PASS] ✅ Test 3: No duplicate dates (exactly 365 unique days)
[PASS] ✅ Test 4: All dates are valid ISO format YYYY-MM-DD
[PASS] ✅ Test 5: July 2026 has 0 official working days (all 31 days VACATION or Sunday HOLIDAY)
[PASS] ✅ Test 6: Monthly working-day totals match official calendar exactly across all 12 months
[PASS] ✅ Test 7: Total official working days across 2026-27 is exactly 254 (got 254)
[PASS] ✅ Test 8: Official holidays are never attendance-eligible for any class (verified 80 holiday instances)
[PASS] ✅ Test 9: Summer Vacation days are never attendance-eligible (verified 31 days in July)
[PASS] ✅ Test 10: Examination days are official EXAMS and attendance-eligible on class session days
[PASS] ✅ Test 11: Activities are official ACTIVITIES and attendance-eligible on class session days
[PASS] ✅ Test 12: Teacher Class Not Held override suppresses attendance specifically for the overridden class
[PASS] ✅ Test 13: Saturday policy correctly gives Weekend OFF for Class 9/10 and Working Day for Class 11/12

==========================================
TOTAL TESTS: 13 | PASSED: 13 | FAILED: 0
==========================================
```

---

## 8. Build Safety Verification

- **Debug Build:** `.\gradlew.bat assembleDebug --no-daemon` → **`BUILD SUCCESSFUL in 54s`** (0 errors)
- **Release Build:** `.\gradlew.bat assembleRelease --no-daemon` → **`BUILD SUCCESSFUL in 1m 13s`** (0 errors)
- **Version Integrity:** `versionName = 5.7`, `versionCode = 6` preserved without modification.
- **UI Integrity:** 0 regressions to existing UI, Face Recognition, Marks, WhatsApp, or Student Portfolio components.
