# Google OAuth & Google Drive Audit Report: VE Management

**Project**: `VE Management (IT GHSS)`  
**Target Package**: `com.itdept.itghss`  
**Date**: August 2026  
**Status**: Diagnostic Audit Complete (Read-Only Mode)

---

## 1. Current OAuth Architecture

The VE Management application employs a **Hybrid Native-Bridge OAuth Architecture**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          WebView (index.html SPA)                           │
│  - User taps "Sign in with Google" / "Sync to Cloud" / "Pull from Cloud"    │
│  - Calls Javascript Interface: window.Android.loginWithGoogle()             │
│  - Listens to callbacks: window.onGoogleSignInSuccess(email),               │
│                          window.onGoogleSignInFailure(err),                 │
│                          window.onCloudDataLoaded(jsonData),                │
│                          window.onFileSyncResult(success, msg)              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                    Javascript Interface Bridge (@JavascriptInterface)
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Native Android Layer (MainActivity.kt)               │
│                                                                             │
│  1. Google Play Services GoogleSignInClient:                                │
│     - Launches native Google Sign-In Account Picker dialog (Intent)         │
│     - Configured with GoogleSignInOptions.DEFAULT_SIGN_IN                   │
│     - Requests Scopes: DriveScopes.DRIVE_APPDATA,                           │
│                        CalendarScopes.CALENDAR_READONLY                     │
│     - Requests ID Token: .requestIdToken(default_web_client_id)             │
│                                                                             │
│  2. GoogleAccountCredential & Drive / Calendar SDKs:                        │
│     - Uses GoogleAccountCredential.usingOAuth2(...)                         │
│     - Sets selected account: account.account (or account.email fallback)   │
│     - Builds com.google.api.services.drive.Drive instance                   │
│     - Executes background backup/restore to appDataFolder via Coroutines    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Characteristics
- **Native Account Picker**: Authentication does **not** take place inside the WebView DOM or via browser redirects. The WebView invokes native Kotlin code, which delegates the authentication ceremony to Google Play Services (`com.google.android.gms.auth.api.signin.GoogleSignInClient`).
- **WebViewAssetLoader Isolation**: The frontend is served via `androidx.webkit.WebViewAssetLoader` under `https://appassets.androidplatform.net/assets/index.html`. Because the OAuth flow is handled natively in Kotlin rather than inside the browser engine, there are zero CORS or redirect intercept issues between WebViewAssetLoader and Google OAuth.
- **Drive AppData Storage**: The app uses `DriveScopes.DRIVE_APPDATA` (`https://www.googleapis.com/auth/drive.appdata`). Data is stored strictly in the hidden, sandboxed `appDataFolder` (`itghss_backup.json`), ensuring that the application cannot read, modify, or delete any personal files in the user's Google Drive.

---

## 2. Files and Functions Involved

| File | Component / Function | Role in OAuth / Drive Implementation |
| :--- | :--- | :--- |
| [`MainActivity.kt`](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/java/com/itdept/itghss/MainActivity.kt) | `setupGoogleSignIn()` (lines 136–152) | Configures `GoogleSignInOptions`, loads Web Client ID from resources, registers scopes (`DRIVE_APPDATA`, `CALENDAR_READONLY`), and creates `GoogleSignInClient`. |
| [`MainActivity.kt`](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/java/com/itdept/itghss/MainActivity.kt) | `googleSignInLauncher` (lines 71–98) | `ActivityResultLauncher` handling Google Sign-In intent result; catches `ApiException` and reports Error Code 10 / 12500 / 12501 to JS and Logcat. |
| [`MainActivity.kt`](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/java/com/itdept/itghss/MainActivity.kt) | `initializeGoogleServices()` (lines 154–183) | Instantiates `GoogleAccountCredential` with OAuth2 scopes and initializes native `Drive` and `Calendar` service builders. |
| [`MainActivity.kt`](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/java/com/itdept/itghss/MainActivity.kt) | `WebAppInterface.loginWithGoogle()` (lines 386–394) | `@JavascriptInterface` invoked by WebView button to launch native sign-in intent on UI thread. |
| [`MainActivity.kt`](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/java/com/itdept/itghss/MainActivity.kt) | `syncToDriveInternal()` (lines 424–457) | Uploads / creates `itghss_backup.json` inside Google Drive `appDataFolder` via coroutine (`Dispatchers.IO`). |
| [`MainActivity.kt`](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/java/com/itdept/itghss/MainActivity.kt) | `requestSyncFromDriveInternal()` (lines 492–528) | Queries and downloads `itghss_backup.json` from `appDataFolder` and dispatches content to `notifyJsDataLoaded()`. |
| [`index.html`](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/assets/index.html) | `loginWithGoogle()` / `logoutFromGoogle()` (lines 1513–1514) | Frontend trigger functions invoking `window.Android.loginWithGoogle()`. |
| [`index.html`](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/assets/index.html) | `window.onGoogleSignInSuccess` / `Failure` (lines 1410–1436) | JS callbacks updating UI login state and displaying status/error messages. |
| [`index.html`](file:///c:/Users/HP/Downloads/ITGHSS2/app/src/main/assets/index.html) | `window.onCloudDataLoaded` (lines 1460–1511) | Parses cloud JSON snapshot and restores local state across all 17 storage keys. |
| [`google-services.json`](file:///c:/Users/HP/Downloads/ITGHSS2/app/google-services.json) | Configuration JSON | Processed by `com.google.gms.google-services` plugin at build time to generate string resources like `default_web_client_id`. |
| [`build.gradle.kts`](file:///c:/Users/HP/Downloads/ITGHSS2/app/build.gradle.kts) | App Build Script (lines 1–67) | Defines `namespace = "com.itdept.itghss"`, `applicationId = "com.itdept.itghss"`, dependencies (`play-services-auth`, `google-api-services-drive`, `google-api-services-calendar`). |
| [`proguard-rules.pro`](file:///c:/Users/HP/Downloads/ITGHSS2/app/proguard-rules.pro) | ProGuard / R8 Rules | Preserves `@JavascriptInterface` methods and Google API Client / GSON reflection models from obfuscation/shrinking. |

---

## 3. Detected Google Project & Client Configuration

*(All sensitive keys and tokens are masked per security policy)*

- **Google Cloud / Firebase Project Number**: `1016776650952`
- **Google Cloud / Firebase Project ID**: `ghss-75f48`
- **Firebase Storage Bucket**: `ghss-75f48.firebasestorage.app`
- **Mobile SDK App ID**: `1:1016776650952:android:f31f719f2fbd149b15b5fd`
- **Package Name**: `com.itdept.itghss`

### Detected OAuth 2.0 Clients in `google-services.json`

| Client ID (Masked) | Client Type | Package Name | Certificate Hash (SHA-1) |
| :--- | :---: | :--- | :--- |
| `1016776650952-6m5f162b*************************.apps.googleusercontent.com` | `1` (Android) | `com.itdept.itghss` | `69e9916da49c15eba015886a3828fb80e5c964a3` |
| `1016776650952-845b20ko*************************.apps.googleusercontent.com` | `1` (Android) | `com.itdept.itghss` | `c74da807c448db2b6083389a3a0d127667b74f4d` |
| `1016776650952-gcofr8pu*************************.apps.googleusercontent.com` | `3` (Web) | — | — |

---

## 4. Debug Package & SHA-1 Requirements

### Signing Verification (`./gradlew.bat signingReport`)
- **Variant**: `debug` & `debugAndroidTest`
- **Keystore**: `C:\Users\HP\.android\debug.keystore`
- **Alias**: `AndroidDebugKey`
- **Package / Application ID**: `com.itdept.itghss`
- **Active Debug SHA-1**: `69:E9:91:6D:A4:9C:15:EB:A0:15:88:6A:38:28:FB:80:E5:C9:64:A3`
- **Active Debug SHA-256**: `D3:2F:5F:01:B8:08:0B:8A:4A:55:D7:1B:54:09:27:8F:DF:76:F2:FC:E6:F3:E4:15:40:C3:DA:A7:C8:08:FA:24`

### Release Variant Status
- **Variant**: `release`
- **Config / Store / Alias**: `null` (No signing config configured in `app/build.gradle.kts` for release; unsigned APK produced).

> [!IMPORTANT]
> The active debug certificate SHA-1 (`69:E9:91:6D:A4:9C:15:EB:A0:15:88:6A:38:28:FB:80:E5:C9:64:A3`) **must be registered** in the live Firebase Console / Google Cloud Console under project `ghss-75f48`. Even though the hash is present in the static `google-services.json`, Google Play Services verifies the certificate fingerprint against Google's servers in real-time.

---

## 5. Web Client ID Requirements

1. **Client ID Injected at Build Time**:
   - The string resource `R.string.default_web_client_id` is automatically synthesized by the Google Services Gradle plugin from `oauth_client` with `client_type: 3`.
   - Generated Value: `1016776650952-gcofr8pu*************************.apps.googleusercontent.com`
2. **Usage in Kotlin**:
   ```kotlin
   val webClientId = getString(R.string.default_web_client_id)
   val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
       .requestIdToken(webClientId)
       .requestEmail()
       .requestScopes(Scope(DriveScopes.DRIVE_APPDATA), Scope(CalendarScopes.CALENDAR_READONLY))
       .build()
   ```
3. **Requirement**:
   - The Web Client ID **must exist** in the same Google Cloud Console project (`1016776650952` / `ghss-75f48`) as an "OAuth 2.0 Client ID" with Application type "Web application".
   - If `.requestIdToken(webClientId)` is passed a Web Client ID that does not exist in the project or belongs to a different project, Google Play Services throws `DEVELOPER_ERROR` (Error Code 10).

---

## 6. Exact Likely Cause of Error Code 10

In Google Play Services, **Error Code 10** corresponds to:
`com.google.android.gms.common.api.CommonStatusCodes.DEVELOPER_ERROR` (`10`).

This error strictly indicates a configuration mismatch between the calling Android application and Google's backend authentication servers. Based on the codebase analysis, the exact causes are:

### Primary Root Causes (in order of probability)

1. **Google Cloud Console OAuth Consent Screen in "Testing" mode without Test Users**:
   - When a Google Cloud project's OAuth Consent Screen is set to "External" and Publishing Status is "Testing", Google blocks all accounts except those explicitly listed under **Test Users**.
   - If the user attempting to log in on Android is not added under **Test Users** in the Google Cloud Console for project `ghss-75f48`, Google rejects the token exchange with Error Code 10.
2. **Missing or Incomplete OAuth Consent Screen Configuration**:
   - If the OAuth Consent Screen has not been completed (missing App Name, User Support Email, or Developer Contact Email) in Google Cloud Console (`ghss-75f48`), Google Play Services returns Error 10 immediately upon sign-in launch.
3. **Backend Certificate Fingerprint Missing or Out-of-Sync in Google Cloud Console**:
   - While `google-services.json` contains `69e9916da49c15eba015886a3828fb80e5c964a3`, the Android OAuth 2.0 Client ID in the Google Cloud Console credentials dashboard may have been deleted, modified, or never created directly in Google Cloud.
4. **Unnecessary `requestIdToken(webClientId)` in `GoogleSignInOptions`**:
   - The application calls `.requestIdToken(webClientId)`. However, the app **never validates or uses the OpenID Connect ID token on any backend server**.
   - Instead, the app uses `GoogleAccountCredential.usingOAuth2` directly on Android to obtain OAuth access tokens for the Google Drive and Google Calendar REST APIs.
   - Forcing `.requestIdToken(webClientId)` forces Google Play Services to perform cross-client ID validation with the Web Client ID. If the Web Client ID has any discrepancy, Error 10 is triggered unnecessarily.
5. **Required Google APIs Not Enabled**:
   - If **Google Drive API** (`drive.googleapis.com`) or **Google Calendar API** (`calendar-json.googleapis.com`) are not enabled in the Google Cloud Console for project `ghss-75f48`, requesting their scopes during sign-in can trigger configuration rejections.

---

## 7. Google Cloud Console & Firebase Configuration Required

To resolve Error Code 10 on the Google backend, the following configurations must be verified in the [Google Cloud Console](https://console.cloud.google.com/) / [Firebase Console](https://console.firebase.google.com/) for project **`ghss-75f48`** (Project Number `1016776650952`):

### A. Firebase Console
1. Open **Project Settings** -> **General** -> **Your apps** -> Select Android app (`com.itdept.itghss`).
2. Verify **SHA certificate fingerprints**:
   - Add SHA-1: `69:E9:91:6D:A4:9C:15:EB:A0:15:88:6A:38:28:FB:80:E5:C9:64:A3`
   - Add SHA-256: `D3:2F:5F:01:B8:08:0B:8A:4A:55:D7:1B:54:09:27:8F:DF:76:F2:FC:E6:F3:E4:15:40:C3:DA:A7:C8:08:FA:24`
3. Verify **Support Email**: Under Project Settings -> Public settings, ensure a valid support email is selected.

### B. Google Cloud Console: APIs & Services
1. **Enabled APIs**:
   - Go to **APIs & Services** -> **Library**.
   - Search for **Google Drive API** -> Ensure it is **Enabled**.
   - Search for **Google Calendar API** -> Ensure it is **Enabled**.
2. **OAuth Consent Screen**:
   - Go to **APIs & Services** -> **OAuth consent screen**.
   - User Type: `External`.
   - App Information: Set App Name (`VE Management`), User Support Email, Developer Contact Email.
   - Scopes: Add `.../auth/drive.appdata` and `.../auth/calendar.readonly`.
   - **Test Users**: Under Test Users, click **+ ADD USERS** and add the exact Gmail address(es) that will log in during testing.
3. **Credentials Dashboard**:
   - Go to **APIs & Services** -> **Credentials**.
   - Verify that an **Android Client ID** exists with:
     - Package name: `com.itdept.itghss`
     - SHA-1: `69:E9:91:6D:A4:9C:15:EB:A0:15:88:6A:38:28:FB:80:E5:C9:64:A3`
   - Verify that a **Web Application Client ID** exists whose client ID matches `1016776650952-gcofr8pu*************************.apps.googleusercontent.com`.

---

## 8. Code & Architecture Review

### Does `MainActivity.kt` require code changes?
1. **Remove Unneeded `.requestIdToken(webClientId)`**:
   - In `MainActivity.kt` (lines 140–145):
     ```kotlin
     // CURRENT:
     val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
         .requestIdToken(webClientId)
         .requestEmail()
         .requestScopes(Scope(DriveScopes.DRIVE_APPDATA), Scope(CalendarScopes.CALENDAR_READONLY))
         .build()
     ```
   - Since `GoogleAccountCredential.usingOAuth2` handles API token acquisition directly via `account.account` / `account.email`, `requestIdToken` is redundant for this architecture.
   - Removing `.requestIdToken(webClientId)` (or making it fallback-safe) eliminates the Web Client ID mismatch failure mode and allows Google Play Services to rely purely on the Android package name + SHA-1 certificate binding.
2. **Release Signing Configuration**:
   - In `app/build.gradle.kts`, `buildTypes.release` currently has `signingConfig = null`. When building a release APK, a release keystore and its corresponding SHA-1 fingerprint must be configured in `build.gradle.kts` and registered in Google Cloud Console.

---

## 9. Required `google-services.json` Changes

- If any credentials or SHA-1 fingerprints are updated or re-created in the Firebase Console / Google Cloud Console, a fresh `google-services.json` should be downloaded from the Firebase Console and placed into `app/google-services.json`.
- If the project IDs and SHA-1 values already match, no structural changes to `google-services.json` are necessary.

---

## 10. Security Risks & Assessment

| Risk Category | Severity | Analysis & Mitigation |
| :--- | :---: | :--- |
| **API Key Exposure** | Low | The API key in `google-services.json` is restricted to Android client identification. However, standard Google Cloud API restrictions (restricting key usage to Android apps with package `com.itdept.itghss` + SHA-1) should be enforced in Cloud Console. |
| **Drive Scope Overreach** | **NONE (Well Designed)** | The app uses `DriveScopes.DRIVE_APPDATA` instead of `DriveScopes.DRIVE` or `DRIVE_FILE`. It can only access its own sandbox directory (`appDataFolder`), protecting the user's personal documents. |
| **WebView Origin Isolation** | **NONE (Well Designed)** | The app uses `WebViewAssetLoader` with domain `https://appassets.androidplatform.net`, avoiding insecure `file:///` scheme origins. |
| **Bridge Injection Vulnerabilities** | Low | `WebAppInterface` methods are restricted to file saving, Google sign-in/out, and Drive sync. No dynamic JavaScript execution is accepted directly from untrusted external URLs. |
| **Hardcoded Secrets** | **NONE (Clean)** | No client secrets or private tokens are embedded in source code or assets. |

---

## 11. Step-by-Step Fix Plan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STEP-BY-STEP REMEDIATION PLAN                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Google Cloud / Firebase Console Configuration                       │
│ 1. Navigate to Google Cloud Console (Project: ghss-75f48 / 1016776650952).  │
│ 2. In "APIs & Services" -> "OAuth consent screen":                          │
│    - Ensure App name & Support Email are populated.                         │
│    - Under "Test users", ADD the tester's Gmail address.                    │
│ 3. In "APIs & Services" -> "Library":                                       │
│    - Enable "Google Drive API" and "Google Calendar API".                   │
│ 4. In Firebase Console -> Project Settings -> Android App (com.itdept.itghss):│
│    - Ensure SHA-1 is registered:                                            │
│      69:E9:91:6D:A4:9C:15:EB:A0:15:88:6A:38:28:FB:80:E5:C9:64:A3          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Code Simplification in MainActivity.kt                              │
│ 1. Update setupGoogleSignIn() in MainActivity.kt:                           │
│    - Configure GoogleSignInOptions with .requestEmail() and                 │
│      .requestScopes(Scope(DriveScopes.DRIVE_APPDATA),                       │
│                     Scope(CalendarScopes.CALENDAR_READONLY))                │
│    - Remove or safely guard .requestIdToken(webClientId).                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Verification & Device Testing                                       │
│ 1. Run gradlew assembleDebug to compile the APK with the debug keystore.    │
│ 2. Install app-debug.apk on the physical test device.                       │
│ 3. Tap "Sign in with Google" inside Settings -> Cloud Sync.                 │
│ 4. Confirm Google Play Services Account Picker appears without Error 10.    │
│ 5. Perform "Sync Now (to Cloud)" and verify itghss_backup.json in AppData.  │
└─────────────────────────────────────────────────────────────────────────────┘
```
