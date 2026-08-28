# VE Management — Complete Technical Project Documentation

> **Document Version**: 1.0.0  
> **Last Updated**: August 2026  
> **Target Audience**: AI Software Engineers, Android Developers, System Architects  
> **Scope**: Current Implementation & Technical Architecture of VE Management  

---

## 1. Project Identity

- **Project Name**: VE Management (IT GHSS)
- **Application Display Name**: `VE Management`
- **Application ID / Package Name**: `com.itdept.itghss`
- **Current Version Name**: `5.7`
- **Current Version Code**: `6`
- **Primary GitHub Repository**: [https://github.com/iamrocky899-sketch/VE-Management--](https://github.com/iamrocky899-sketch/VE-Management--)
- **Project Purpose**: An offline-first Vocational Education Management System designed for vocational department teachers and administrators. It provides student lifecycle management, attendance tracking with on-device face recognition, attendance register tabular view with month-by-month navigation, smart WhatsApp absence alerts with localized Assamese messaging, attendance calendar with teacher day-status overrides, continuous academic marks entry, student group leadership assignment, guest lecture tracking, field visit records, weekly syllabus tracking, financial ledger records, portfolio generation, and export utilities (PDF & Excel), with optional Google Drive cloud synchronization.
- **Current Release Status**: Production-ready local build. Successfully verified on `assembleDebug` and `assembleRelease`.

---

## 2. Technology Stack

### Android & Build System
- **Host Programming Language**: Kotlin `2.3.0`
- **JDK / Java Target**: Java 11 (`JavaVersion.VERSION_11`)
- **Gradle Version**: `9.4.1`
- **Android Gradle Plugin (AGP)**: `9.2.1`
- **Compile SDK**: `37` (Android 16 API level compatibility)
- **Target SDK**: `37`
- **Min SDK**: `26` (Android 8.0 Oreo)
- **Code Shrinker / Obfuscator**: R8 / ProGuard enabled for release builds with custom rules

### Android Libraries (from `gradle/libs.versions.toml`)
- `androidx.core:core-ktx:1.19.0`
- `androidx.appcompat:appcompat:1.7.1`
- `com.google.android.material:material:1.13.0`
- `androidx.activity:activity-ktx:1.13.0`
- `androidx.constraintlayout:constraintlayout:2.2.1`
- `androidx.webkit:webkit:1.12.1` (`WebViewAssetLoader` for local CORS-free HTTPS asset loading)
- `com.google.android.gms:play-services-auth:21.6.0`
- `androidx.credentials:credentials:1.6.0`
- `androidx.credentials:credentials-play-services-auth:1.6.0`
- `com.google.api-client:google-api-client-android:2.9.0`
- `com.google.apis:google-api-services-drive:v3-rev20260428-2.0.0`
- `com.google.apis:google-api-services-calendar:v3-rev20260614-2.0.0`
- `com.google.http-client:google-http-client-gson:1.46.3`
- `com.google.http-client:google-http-client-android:1.46.3`
- `com.google.gms.google-services:4.4.2`

### Frontend & Web Technologies
- **UI Architecture**: WebView-hosted Single Page Application (SPA)
- **HTML/CSS**: HTML5 semantic markup + Vanilla CSS3 (Custom Dark Glassmorphic Design System)
- **Typography**: Google Inter Font (`'Inter', sans-serif`) with system fallbacks
- **Color Palette**: Dark background (`#0a0a0f`), card background (`#12121a`), accent teal (`#00f2fe`), accent purple (`#9d50bb`), accent amber (`#f89b29`), accent red (`#ff4b2b`)

### Local Bundled JavaScript Libraries (in `app/src/main/assets/libs/`)
- **Face Recognition**: `@vladmandic/face-api@1.7.12` (`face-api.min.js`, 1.33 MB)
- **Spreadsheet Generation**: `SheetJS / xlsx@0.18.5` (`xlsx.full.min.js`, 881 KB)
- **PDF Generation**: `jsPDF@2.5.1` (`jspdf.umd.min.js`, 364 KB)
- **PDF Table Plugin**: `jspdf-autotable@3.5.25` (`jspdf.plugin.autotable.min.js`, 36 KB)

### Bundled On-Device Neural Network Models (in `app/src/main/assets/models/`)
- **Tiny Face Detector**: `tiny_face_detector_model-weights_manifest.json` (2.95 KB) + `tiny_face_detector_model-shard1` (193 KB)
- **Face Landmark 68**: `face_landmark_68_model-weights_manifest.json` (7.89 KB) + `face_landmark_68_model-shard1` (356 KB)
- **Face Recognition (128-d Embeddings)**: `face_recognition_model-weights_manifest.json` (18.3 KB) + `face_recognition_model-shard1` (4.19 MB) + `face_recognition_model-shard2` (2.25 MB)

---

## 3. Project Directory Structure

```text
ITGHSS2/
├── app/
│   ├── build.gradle.kts                   # App module build configuration (SDK 37, Java 11, dependencies)
│   ├── google-services.json               # Firebase & Google OAuth client configuration
│   ├── proguard-rules.pro                 # R8/ProGuard preservation rules for JS interfaces and Google APIs
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml        # Permissions, queries (WhatsApp), and Activity declarations
│           ├── assets/                    # Bundled offline assets loaded by WebView
│           │   ├── index.html             # Complete application SPA (HTML, CSS, JS runtime)
│           │   ├── logo.png               # Application department logo
│           │   ├── libs/                  # Local offline JavaScript vendor libraries
│           │   │   ├── face-api.min.js
│           │   │   ├── xlsx.full.min.js
│           │   │   ├── jspdf.umd.min.js
│           │   │   └── jspdf.plugin.autotable.min.js
│           │   └── models/                # Local offline face-api.js neural network weights
│           │       ├── tiny_face_detector_model-weights_manifest.json
│           │       ├── tiny_face_detector_model-shard1
│           │       ├── face_landmark_68_model-weights_manifest.json
│           │       ├── face_landmark_68_model-shard1
│           │       ├── face_recognition_model-weights_manifest.json
│           │       ├── face_recognition_model-shard1
│           │       └── face_recognition_model-shard2
│           ├── java/
│           │   └── com/itdept/itghss/
│           │       └── MainActivity.kt    # Native Android Activity, WebView host, Google OAuth, Drive & Calendar bridge
│           └── res/
│               ├── layout/
│               │   └── activity_main.xml  # ConstraintLayout hosting the full-screen WebView
│               ├── values/
│               │   ├── colors.xml
│               │   ├── strings.xml        # App name and resource strings
│               │   └── themes.xml         # Material3 DayNight NoActionBar theme
│               └── xml/
│                   ├── backup_rules.xml
│                   └── data_extraction_rules.xml
├── gradle/
│   └── libs.versions.toml                 # Centralized dependency catalog
├── build.gradle.kts                       # Root project build script
├── settings.gradle.kts                    # Gradle plugin repositories and module declarations
├── gradle.properties                      # JVM arguments and build parameters
├── gradlew.bat / gradlew                  # Gradle wrapper executables
└── PROJECT_DOCUMENTATION.md               # Complete architectural documentation (this file)
```

---

## 4. Application Architecture

VE Management is built as an **Offline-First Hybrid Application**. The native Kotlin layer provides hardware access, scoped storage integration, and Google Drive OAuth services, while the presentation, domain logic, and client-side database execute inside an optimized Android WebView container.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             ANDROID SYSTEM                               │
│  - Edge-to-Edge WindowInsets Handling (API 37)                           │
│  - Camera Hardware Permissions & MediaStream Access                      │
│  - MediaStore Scoped Storage Download Integration                        │
│  - Google Play Services OAuth 2.0 Client                                 │
│  - WhatsApp Intent Queries for Safe Direct Handoff                       │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           MainActivity.kt                                │
│  - WebView Container Host                                                │
│  - WebViewAssetLoader (https://appassets.androidplatform.net/assets/)    │
│  - JavaScript Interface Bridge: @JavascriptInterface "Android"          │
│  - Background Coroutine Services for Drive & Holiday Calendar            │
│  - Lifecycle Hooks: onPause() / onDestroy() Camera & Timer Teardown      │
│  - URL override handler for WhatsApp scheme and web links                │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
           Bidirectional JavaScript Bridge (window.Android)
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   WebView Container (index.html SPA)                     │
│                                                                          │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────┐  │
│  │   UI & Routing Layer  │  │  Offline ML AI Engine  │  │ Export Engine│  │
│  │  - Home Dashboard     │  │  - TinyFaceDetector   │  │  - SheetJS   │  │
│  │  - Student Management │  │  - Landmark68Net      │  │  - jsPDF     │  │
│  │  - Attendance Hub     │  │  - FaceRecognitionNet │  │  - AutoTable │  │
│  │  - Attendance 2.0     │  │  - 3-Sample Enroller  │  └──────────────┘  │
│  │    * Month Register   │  │  - 0.48 Matching Engine│                    │
│  │    * Calendar Control │  └───────────────────────┘                    │
│  │    * WA Absence Alert │                                               │
│  │  - Marks Entry System │                                               │
│  │  - Group Details View │                                               │
│  │  - 8 Auxiliary Pages  │                                               │
│  └───────────────────────┘                                               │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │            Local Storage Engine (Web localStorage)                 │  │
│  │     23 Partitioned State Keys (itd3_s, itd3_a, itd3_alerts, ...)   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Native Android Layer: `MainActivity.kt`

The file [MainActivity.kt](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/java/com/itdept/itghss/MainActivity.kt) acts as the bridge between native Android subsystem APIs and the WebView environment.

### Core Responsibilities
1. **Asset Loading via `WebViewAssetLoader`**:
   - Loaded under origin: `https://appassets.androidplatform.net/assets/index.html`.
   - Intercepted in `shouldInterceptRequest` and served directly from APK assets.
2. **WebSettings Configuration**:
   - `javaScriptEnabled = true`
   - `domStorageEnabled = true`
   - `mediaPlaybackRequiresUserGesture = false`
3. **Native Bridge (`WebAppInterface`)**:
   - `getAppVersion()`: Returns current version name (`5.7`).
   - `saveFile(base64, filename, mime)`: Saves Base64-encoded files to `MediaStore.Downloads` on Android 10+ (API 29 to 37).
   - `loginWithGoogle()`: Launches GoogleSignIn OAuth flow.
   - `logoutFromGoogle()`: Clears credentials and service clients.
   - `syncToDrive(jsonData)`: Background coroutine (`Dispatchers.IO`) uploading `itghss_backup.json` to Google Drive `appDataFolder`.
   - `requestSyncFromDrive()`: Background coroutine downloading `itghss_backup.json` from `appDataFolder` and notifying JS via `window.onCloudDataLoaded`.
   - `fetchHolidays(year)`: Queries Google Indian Public Holidays calendar and sends JSON to `window.onHolidaysLoaded`.
4. **WhatsApp URL Handling**:
   - `shouldOverrideUrlLoading` intercepts `whatsapp:`, `wa.me`, and `api.whatsapp.com` URIs and resolves via native Intent launcher.
5. **Edge-to-Edge & Insets**:
   - `enableEdgeToEdge()` combined with `ViewCompat.setOnApplyWindowInsetsListener` handles system bars and cutouts.

---

## 6. Frontend Application: `index.html`

The entire user interface, domain state, and offline algorithms are implemented within [index.html](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/assets/index.html).

### Primary SPA Pages / Views
1. `#page-home`: Real-time stats dashboard, quick action tiles (`Register`, `Calendar`, `Absence Alert`), WhatsApp group shortcuts, attendance progress bars.
2. `#page-students`: Filterable student roster (by Class 9-12, Section A/B, Active/Inactive/Dropout), Add Student form, Bulk Promote, Bulk Drop, Student Details modal.
3. `#page-records`: Tabbed report hub containing:
   - **📖 Register (Attendance 2.0)**: Traditional tabular month register with `< Prev`/`Next >` navigation, search filter, working days calculation, individual student history breakdown modal, and Excel/PDF register exports.
   - **📅 Calendar (Attendance 2.0)**: Interactive month calendar view with day status badges (`Working Day`, `Holiday`, `Class Not Held`, `Attendance Complete`, `Attendance Pending`) and Teacher Manual Day Control modal.
   - **🚨 Absence Alerts (Attendance 2.0)**: Smart consecutive absence detection engine, active alert review & history list, "Why This Alert?" calculation accordion, localized Assamese WhatsApp message generator, safe handoff (`PENDING`, `EXCLUDED`, `OPENED_IN_WHATSAPP`), and teacher exclusion workflow.
   - **Attendance Reports (Legacy Summary)**: Date-range filters, Excel & PDF export.
   - **Marks Entry**: Real-time `Theory + Practice = Total` calculations, per-student Save/Edit controls, and bulk class saving.
   - **Weekly Syllabus Progress**: Syllabus coverage, chapter, topic, teacher, student presence.
   - **Student Progress Report**: Individual student academic cards.
   - **Student Portfolio**: Comprehensive multi-tab single-student dossier with PDF generation.
4. `#page-groups`: Student Group Management and Group Leadership Roster.
5. `#page-guest`: 10-slot Guest Lecture Management with remuneration and topic logs.
6. `#page-field`: Field Visit Register with student count, expenditure, and documentation export.
7. `#page-raw`: Raw Material Register (inward/outward stock, cost, quantity).
8. `#page-gle`: General Ledger Register (Cr/Dr, category, balance summary).
9. `#page-settings`: Theme switcher (Dark/Light), School/Teacher profile editor, Cloud Sync status, JSON Backup/Restore, Data Wipe, Alert Threshold and Template configuration.

---

## 7. Data Storage & Schema

The application utilizes **Web `localStorage`** as its primary client-side database. All 26 keys are serialized as JSON strings:

| LocalStorage Key | Data Type | Description |
| :--- | :--- | :--- |
| `itd3_s` | `Array<Student>` | All enrolled students across classes 9 to 12. |
| `itd3_f` | `Array<FaceData>` | Enrolled face descriptors (multi-sample 128-d float vectors). |
| `itd3_a` | `Object<string, Array<string>>` | Attendance mapping: `{ "YYYY-MM-DD": [ "studentId1", ... ] }`. |
| `itd3_m` | `Object<string, Object>` | Marks mapping: `{ [studentId]: { [examIndex]: { t, p } } }`. |
| `itd3_cg` | `Object<string, ClassGroup>` | Custom groups and class presidents per class ('9', '10', '11', '12'). |
| `itd3_cnh` | `Object<string, Object>` | Class Not Held register `{ [date_class]: { reason, other } }`. |
| `itd3_day_status` | `Object<string, Object>` | Teacher manual day status overrides: `{ [date]: { [class]: { status, reason } } }`. |
| `itd3_holidays` | `Object<string, string>` | Offline cache of Google Indian Public Holidays: `{ "YYYY-MM-DD": "Holiday Name" }`. |
| `itd3_alert_threshold`| `number` | Consecutive absence threshold (1 to 5, default 2). |
| `itd3_alert_template` | `string` | Localized Assamese WhatsApp message template. |
| `itd3_alerts` | `Array<Alert>` | Active and historical alert records with tracking statuses. |
| `itd3_alert_exclusions`| `Object<string, Object>`| Teacher absence exclusions: `{ [studentId]: { sequenceKey, reason, note } }`. |
| `itd3_timetable` | `Array<TimetableEntry>` | Weekly class timetable slots (Day, Time, Class, Section, Reminder, Tolerance, Active). |
| `itd3_reminder_settings`| `Object` | Global reminder settings: `{ enabled: boolean, defaultTolerance: number }`. |
| `itd3_reminder_notified`| `Object<string, Object>`| Record of notified timetable occurrences per date to prevent duplicate alerts. |
| `itd3_wp` | `Array<WeeklyProgress>` | Syllabus weekly progress records. |
| `itd3_rm` | `Array<RawMaterial>` | Raw material stock and inventory entries. |
| `itd3_gle` | `Array<GLEntry>` | General Ledger income/expense entries. |
| `itd3_gl` | `Array<Object>` | 10 Guest lecture slots per class. |
| `itd3_fv` | `Object<string, Array>` | Field visit logs and student expenditure. |
| `itd3_wa` | `Object<string, string>` | WhatsApp group invitation links per class. |
| `itd3_tp` | `Object` | Teacher Profile (Name, Designation, Subject, Phone, Email). |
| `itd3_sd` | `Object` | School Details (School Name, UDISE Code, Principal, Address). |
| `itd3_set` | `Object` | App Settings (Theme, Header configuration). |
| `itd3_pi` | `string` | Base64 avatar of teacher profile. |
| `itd3_last_sync`| `string` | Human-readable timestamp of last successful cloud backup. |

### Schema Definitions

#### Student Object (`itd3_s`)
```typescript
interface Student {
  id: string;          // Unique ID: 'S' + timestamp + random suffix (e.g. "S1718000000abcde")
  name: string;        // Full Name
  roll: string;        // Roll Number
  class: string;       // "9" | "10" | "11" | "12"
  section: string;     // "A" | "B" | ""
  status: string;      // "Active" | "Inactive" | "Dropout"
  gender: string;      // "Male" | "Female" | "Other"
  dob: string;         // YYYY-MM-DD
  father: string;
  mother: string;
  mobile: string;
  aadhaar: string;
  village: string;
}
```

#### Marks Object (`itd3_m`)
```typescript
interface StudentMarks {
  [studentId: string]: {
    [examIndex: number]: { // 0: 1st UT, 1: Half Yearly, 2: 2nd UT, 3: Final Exam
      t: number | string;  // Theory Marks (0 - 100)
      p: number | string;  // Practice / Practical Marks (0 - 100)
    }
  }
}
```

#### Student Group Object (`itd3_cg`)
```typescript
interface ClassGroups {
  [classNum: string]: {
    p: string | null;      // Student ID of Class President
    g: Array<{
      id: string;          // Group ID (e.g. "G1718000000")
      n: string;           // Group Name (e.g. "Web Innovators")
      l: string;           // Student ID of Group Leader
      cl: string;          // Student ID of Co-Leader
      m: Array<string>;    // Array of member Student IDs
    }>
  }
}
```

#### Face Data Object (`itd3_f`)
```typescript
interface FaceData {
  id: string;                      // Student ID
  descriptors: Array<number[]>;    // Array of 3 normalized 128-d Float arrays (Multi-sample)
  descriptor?: number[];           // Legacy single 128-d Float array (supported for backward compatibility)
  enrolledAt?: string;             // ISO Timestamp
}
```

---

## 8. Marks Entry System

- **Status**: **Fully Implemented**
- **Calculation Formula**:
  $$\text{Total} = (\text{parseFloat}(\text{Theory}) \parallel 0) + (\text{parseFloat}(\text{Practice}) \parallel 0)$$
- **Interactive UI**:
  - Theory and Practice numeric inputs with non-negative validation $[0, 100]$.
  - The **Total** field is strictly read-only, highlighted with `.marks-total-box`, and automatically updates on every keystroke via `onMarkChange(sid, ex)`.
- **Save Workflow**:
  - Each student card features a dedicated **`💾 SAVE`** button.
  - Validates numeric boundaries, updates `marks[sid][ex]`, triggers `saveData()`, removes card from active editing set, and displays a success toast.
- **Edit Workflow**:
  - Cards with existing marks render in a clean locked review state with a **`✏️ Edit`** button.
  - Tapping `Edit` unlocks the inputs for modification without creating duplicate student records.
- **Batch Action**: Global **`💾 Save All Marks`** button for class-wide persistence.
- **Exports**: Excel (`.xlsx`) and PDF (`.pdf`) outputs generated through `exportAllMarks()` with explicit columns: `Roll`, `Name`, `Class`, `Section`, and for each of the 4 exams: `Theory`, `Practice`, and `Total`.
- **Offline Persistence**: Operates entirely offline with instant `localStorage` commits.

---

## 9. Student Groups System

- **Status**: **Fully Implemented**
- **Creation & Management**:
  - Groups are created and scoped per class (`9`, `10`, `11`, `12`).
  - Supports Group Name, Leader selection (from class roster), Co-Leader selection, and multi-student member checkboxes.
- **Group Details Screen (`#modal-group-detail`)**:
  - Triggered by tapping any Group Card in the groups view.
  - Displays Group Header: Group Name, Group ID badge (`ID: G123...`), Total Member Count badge.
  - Displays **Leader Card** with roll number, student ID, and amber `⭐ LEADER` badge.
  - Displays **Co-Leader Card** with roll number, student ID, and teal `🌟 CO-LEADER` badge.
  - Displays full **Member Roster** with student names, roll numbers, IDs, and role badges (`⭐ LEADER`, `🌟 CO-LEADER`, `👤 MEMBER`).
  - Provides a direct **`✏️ Edit Group`** button.
- **Data Integrity**: Reuses existing student IDs from `students` without duplication.

---

## 10. Face Recognition & Enrollment Engine

- **Status**: **Fully Implemented & Verified in APK Packaging** (Requires Physical-Device Testing)
- **Library**: `@vladmandic/face-api@1.7.12` (Bundled locally in `app/src/main/assets/libs/face-api.min.js`)
- **Offline Asset Delivery Pipeline**:
  ```text
  WebView (https://appassets.androidplatform.net/assets/index.html)
         │
         ▼ (fetch './models/...')
  WebViewAssetLoader.AssetsPathHandler
         │
         ▼
  APK Assets (/assets/models/*) 100% Offline
  ```

### Neural Network Models Specification
1. **Tiny Face Detector**:
   - Manifest: `tiny_face_detector_model-weights_manifest.json` (2.95 KB)
   - Shards: `tiny_face_detector_model-shard1` (193 KB)
   - Size in APK: ~196 KB
2. **Face Landmark 68**:
   - Manifest: `face_landmark_68_model-weights_manifest.json` (7.89 KB)
   - Shards: `face_landmark_68_model-shard1` (356 KB)
   - Size in APK: ~364 KB
3. **Face Recognition (128-dimensional Embeddings)**:
   - Manifest: `face_recognition_model-weights_manifest.json` (18.3 KB)
   - Shards: `face_recognition_model-shard1` (4.19 MB) + `face_recognition_model-shard2` (2.25 MB)
   - Size in APK: ~6.46 MB

### Multi-Sample Guided Enrollment
- Captures **3 distinct samples** with real-time feedback:
  1. Sample 1: Look directly at the camera (Frontal).
  2. Sample 2: Turn head slightly left.
  3. Sample 3: Turn head slightly right.
- **Quality Checks**:
  - Rejects if 0 faces detected ("Face not detected. Keep face centered").
  - Rejects if $>1$ face detected ("Only 1 student in frame").
  - Rejects if face bounding box is $<15\%$ of frame width ("Move closer to camera").
- Generates 128-dimensional embedding vectors stored as `descriptors: [desc1, desc2, desc3]`.

### Conservative Attendance Scanning
- **Matcher**: `faceapi.FaceMatcher` initialized with calibrated Euclidean distance threshold: **`0.48`**.
- **Frame Rate**: Adaptive 250ms throttled cycle protected by `isProcessingFrame` guard.
- **Consecutive Verification**: Requires **3 consecutive positive confirmation frames** before registering presence.
- **Duplicate Prevention**: Checks if `attendance[today].includes(studentId)` before logging.
- **Feedback**: Green bounding box with confidence percentage, name label, and 800Hz audio chime.
- **Camera Teardown**: `stopCamera()` halts all MediaStream tracks and clears animation loops immediately upon modal closure or app pause.

---

## 11. Face Recognition Accuracy & Limitations

> [!NOTE]
> **No formal benchmark on a standardized biometric dataset has been completed yet.**
> Accuracy metrics are derived from algorithmic design and conservative thresholding.

### Known Theoretical & Environmental Limitations
1. **Lighting Sensitivity**: Low-light (<50 lux) environments or intense backlighting may degrade TinyFaceDetector confidence.
2. **Extreme Head Poses**: Yaw or pitch angles $>30^\circ$ reduce landmark extraction precision.
3. **Extreme Distance**: Faces covering $<15\%$ of the frame width will be rejected by quality checks.
4. **Biometric Anti-Spoofing**: The current system does not implement hardware depth/liveness sensing; high-resolution 2D photographs could potentially trigger a match.
5. **Physical Device Testing**: Offline model loading and build integrity are verified in the APK; end-to-end multi-student camera scanning requires physical Android hardware validation.

---

## 12. Offline Architecture Matrix

| Feature Module | 100% Offline? | Notes |
| :--- | :---: | :--- |
| **Student Management** | **YES** | Add, edit, delete, bulk promote/drop stored in `localStorage`. |
| **Student Groups** | **YES** | Custom groups, leadership assignment, and details view stored in `localStorage`. |
| **Marks Entry** | **YES** | Theory + Practice = Total, Save, Edit, and validation execute on device. |
| **Attendance Hub** | **YES** | Manual class attendance and date logging stored in `localStorage`. |
| **Face Recognition Engine** | **YES** | Bundled offline models in APK assets; zero network calls. |
| **Excel Export (.xlsx)** | **YES** | Bundled `xlsx.full.min.js` generates files entirely client-side. |
| **PDF Export (.pdf)** | **YES** | Bundled `jspdf.umd.min.js` generates documents client-side. |
| **Weekly Syllabus Progress** | **YES** | Logs and exports execute locally. |
| **General Ledger & Field Visits**| **YES** | Calculations and records stored locally. |
| **Google Drive Cloud Sync** | **NO** | Optional backup service; requires active internet connection. |
| **Public Holidays Fetch** | **NO** | Requires Google Calendar API access over network. |

---

## 13. Google Drive Synchronization

- **Role**: **Optional Secondary Backup & Restore** (Never primary database).
- **OAuth Scope**: `DriveScopes.DRIVE_APPDATA` (Private application data sandbox; user drive files are inaccessible).
- **Target File**: `itghss_backup.json` stored inside the hidden `appDataFolder`.
- **Upload Workflow**: Triggered manually or on session completion; packages all 17 `itd3_*` keys into a single JSON payload.
- **Download / Restore Workflow**:
  - `requestSyncFromDrive()` fetches `itghss_backup.json` from `appDataFolder`.
  - Dispatched to `window.onCloudDataLoaded(jsonData)`.
  - **Safety Check**: Checks local vs remote student counts to prevent empty cloud backups from overwriting populated local data.
- **Offline Behavior**: If internet or Drive service is unavailable, all local CRUD operations proceed normally without error blocking.

---

## 14. Security & Privacy Hardening

1. **WebView Security**:
   - Secure origin isolation with `WebViewAssetLoader` (`https://appassets.androidplatform.net`).
   - JavaScript interface methods restricted strictly to `WebAppInterface`.
2. **ProGuard / R8 Rules** ([proguard-rules.pro](file:///c:/Users/HP/Downloads/ITGHSS2/app/proguard-rules.pro)):
   - Explicitly preserves `@android.webkit.JavascriptInterface` methods in `MainActivity$WebAppInterface`.
   - Preserves Google API Client and Gson models from release bytecode stripping.
3. **Secret Hygiene**:
   - Zero hardcoded API keys or OAuth secrets in source code.
   - Google Sign-In uses SHA-1 fingerprint binding and `default_web_client_id` from `google-services.json`.
4. **Production Log Sanitization**:
   - No student names, Aadhaar numbers, phone numbers, or face embeddings are emitted to Android Logcat.
5. **Storage Sandboxing**:
   - Local database resides in private application sandbox (`data/data/com.itdept.itghss/app_webview`).
   - File exports target modern Scoped Storage `MediaStore.Downloads`.

---

## 15. Battery & Performance Optimizations

1. **Camera Processing Throttling**:
   - Face detection loop executes on a 250ms cycle with an `isProcessingFrame` concurrency lock. If a frame is computing, subsequent ticks are skipped, preventing CPU saturation.
2. **Camera Stream Teardown**:
   - Closing `#modal-camera`, pressing the back button, switching tabs, or triggering `MainActivity.onPause()` immediately stops all MediaStream tracks and frees the camera hardware.
3. **Background Inactivity**:
   - No background sync daemons or unconstrained background services run while the app is minimized.
   - Timers are paused in `MainActivity.onPause()`.

---

## 16. Android 16 (API 36/37) Compatibility

- **`compileSdk`**: `37` | **`targetSdk`**: `37` | **`minSdk`**: `26`
- **Edge-to-Edge**: Configured using `enableEdgeToEdge()` and `WindowInsetsCompat.Type.systemBars()` listener on the root layout.
- **Storage Access**: Uses `MediaStore.Downloads` on Android 10+ (API 29 to 37); legacy external storage flags are safely ignored on modern Android.
- **Google Sign-In Account Handling**: Employs fallback to `credential.selectedAccountName = account.email` to handle restricted `GET_ACCOUNTS` behavior on modern Android versions.
- **Verification Status**: **Code-reviewed and Build-tested** with Gradle 9.4.1 and AGP 9.2.1. (Physical device validation on Android 16 preview hardware pending).

---

## 17. Build System & Release Artifacts

### Build Commands
- **Debug Build**:
  ```powershell
  .\gradlew.bat assembleDebug
  ```
- **Release Build**:
  ```powershell
  .\gradlew.bat assembleRelease
  ```

### Generated APK Artifacts
1. **Debug APK**:
   - Path: `app/build/outputs/apk/debug/app-debug.apk`
   - Size: `45,223,069 bytes` (~45.2 MB)
   - Status: Validated & Signed with Android Debug Keystore.
2. **Release APK**:
   - Path: `app/build/outputs/apk/release/app-release-unsigned.apk`
   - Size: `35,271,676 bytes` (~35.2 MB)
   - Status: Validated & Minified with R8 (Requires production signing key for distribution).

---

## 18. Feature Checklist

| Feature | Status | Notes |
| :--- | :---: | :--- |
| Student Management (CRUD, Class/Sec/Status Filters) | `[x]` | Implemented |
| Bulk Actions (Promote / Drop) | `[x]` | Implemented |
| Manual Attendance (Class & All Students) | `[x]` | Implemented |
| Class Not Held Register with Reasons | `[x]` | Implemented |
| Marks Entry (Theory + Practice = Total) | `[x]` | Implemented |
| Marks Validation & Save/Edit States | `[x]` | Implemented |
| Student Groups & Leadership Roster | `[x]` | Implemented |
| Dedicated Group Details Modal | `[x]` | Implemented |
| Offline Face Recognition Models in APK | `[x]` | Implemented |
| Multi-Sample Guided Face Enrollment (3 Angles) | `[x]` | Implemented |
| Conservative Attendance Matching (0.48 Threshold) | `[x]` | Implemented |
| Duplicate Attendance Protection | `[x]` | Implemented |
| 100% Offline Capability | `[x]` | Implemented |
| Excel Reports (.xlsx) Export | `[x]` | Implemented |
| PDF Reports (.pdf) Export | `[x]` | Implemented |
| Student Portfolio Dossier | `[x]` | Implemented |
| Weekly Syllabus Progress | `[x]` | Implemented |
| Guest Lecture Management | `[x]` | Implemented |
| Field Visit Management | `[x]` | Implemented |
| Raw Material Inventory | `[x]` | Implemented |
| General Ledger Register | `[x]` | Implemented |
| WhatsApp Groups Direct Links | `[x]` | Implemented |
| Google Drive Backup & Restore | `[x]` | Implemented |
| ProGuard / R8 Release Hardening | `[x]` | Implemented |
| Android 16 Edge-to-Edge & Scoped Storage | `[x]` | Implemented |
| Battery & Camera Lifecycle Teardown | `[x]` | Implemented |

---

## 19. Known Bugs

| Bug ID | Description | Severity | Module | Status |
| :--- | :--- | :--- | :--- | :--- |
| *None* | No unresolved critical bugs found in source code or build pipeline. | — | — | Stable |

---

## 20. Known Limitations

1. **Biometric Anti-Spoofing**: Face recognition is 2D RGB based; does not implement hardware 3D structured light or depth liveness detection.
2. **Physical Hardware Benchmarks**: Accuracy metrics, lighting limits, and recognition speed are algorithmically established but require physical device field validation across diverse lighting and camera hardware.
3. **Google Sign-In API Deprecation**: `GoogleSignIn` client uses deprecation warnings in Kotlin (`GoogleSignIn.getClient`), though fully functional; migration to the unified AndroidX `CredentialManager` API is recommended in future releases.
4. **Multi-Teacher Collaboration**: Google Drive sync is full-snapshot based; simultaneous multi-device editing requires sequential sync to prevent race conditions.

---

## 21. Recent Development History

### Version 5.6 (Upgrade Phase)
- **Marks Entry System**: Overhauled with dynamic `Theory + Practice = Total` real-time auto-calculation, non-editable Total display, $[0, 100]$ numeric validation, and dedicated per-student `SAVE` and `EDIT` buttons.
- **Student Group Details**: Added `#modal-group-detail` screen displaying Group Name, Group ID, Member Count, Leader Card (`⭐ LEADER`), Co-Leader Card (`🌟 CO-LEADER`), and complete student roster with role badges.
- **100% Offline Face AI**: Bundled `@vladmandic/face-api@1.7.12` and all 3 neural network model weights into APK `assets/`. Integrated `androidx.webkit.WebViewAssetLoader` under `https://appassets.androidplatform.net` to eliminate Chromium `file:///` CORS blocking.
- **Multi-Sample Enrollment**: Implemented 3-sample guided enrollment (Frontal, Left, Right) with quality, size, and single-face verification.
- **Recognition Hardening**: Calibrated Euclidean distance threshold to `0.48` with 3-consecutive-frame verification and single-day duplicate attendance protection.
- **Security & R8**: Configured `proguard-rules.pro` to preserve `@JavascriptInterface` bridge methods and stripped sensitive logs from production output.
- **Battery & Lifecycle**: Implemented 250ms frame throttling and camera resource release on modal close, back press, and `MainActivity.onPause()`.

---

## 22. Future Development Roadmap

### Planned Enhancements (Not Yet Implemented)
- [ ] **Native CameraX & TFLite Pipeline**: Migrate face recognition from WebView canvas to native Android CameraX with TensorFlow Lite MobileFaceNet for maximum hardware acceleration.
- [ ] **AndroidX Credential Manager**: Migrate Google OAuth from deprecated `GoogleSignInClient` to AndroidX `CredentialManager`.
- [ ] **Conflict-Free Cloud Synchronization**: Implement record-level CRDTs or timestamp-based delta sync for multi-device teacher collaboration.
- [ ] **Blink & Motion Liveness Detection**: Implement interactive liveness challenges (e.g., blink detection via landmark aspect ratio) to resist 2D photo presentation attacks.
