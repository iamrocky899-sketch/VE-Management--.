# VE Management

Advanced Vocational Education Management System with Offline Face Recognition.

## Latest Release: v5.7

### Key Features
- **Student Management**: Comprehensive student records and roster management.
- **Marks Management**: (v5.7) Theory + Practice = Total automatic calculation, save, and edit functionality.
- **Attendance**: Manual and Face Recognition based attendance.
- **Offline Face Recognition**: (v5.7) Fully offline face-api.js integration using `WebViewAssetLoader`. Models and libraries are bundled within the app.
- **Student Groups**: (v5.7) Group details including Leader and Co-Leader identification.
- **Cloud Sync**: Secure Google Drive synchronization for data persistence.
- **Security**: Hardened WebView configuration, R8/ProGuard obfuscation, and sanitized logging.
- **Modern Android**: Optimized for Android 16, edge-to-edge UI, and battery efficiency.

## Release v5.7 Improvements
- **Improved Marks**: Integrated theory and practice marks with automatic totals.
- **Enhanced Groups**: Better visibility for group leadership and membership.
- **Offline Reliability**: Verified `WebViewAssetLoader` implementation for local asset serving.
- **Security Hardening**: Disabled unnecessary WebView file access flags.
- **Performance**: Camera frame throttling and lifecycle-aware resource management.

## Technical Details
- **Min SDK**: 26
- **Target SDK**: 37 (Android 16 compatibility)
- **UI**: Hybrid (Native Android + WebView)
- **Face AI**: face-api.js (Tiny Face Detector, Face Landmark 68, Face Recognition)
