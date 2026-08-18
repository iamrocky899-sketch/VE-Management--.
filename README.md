🚀 VE Management

Vocational Education Management System

VE Management is an Android-first application designed to simplify the management of vocational education activities, including student management, attendance, groups, marks, courses, performance records, and administrative tasks.

The application is designed with an offline-first philosophy, allowing core educational activities to continue without an internet connection.

---

📱 About the Project

VE Management is built to help vocational education teachers and administrators manage day-to-day academic and student-related activities from a single mobile application.

The goal is simple:

«Less paperwork. Faster data entry. Better student management.»

The application is particularly designed for environments where reliable internet connectivity may not always be available.

---

✨ Core Features

👨‍🎓 Student Management

- Student enrollment
- Student onboarding
- Student profiles
- Student information management
- Student records stored locally
- Easy access to student information

📋 Attendance Management

- Daily student attendance
- Theory attendance
- Practical attendance
- Attendance records
- Offline attendance management
- Face-recognition-assisted attendance

👥 Student Groups

Manage students according to their assigned groups.

Group management includes:

- Group name
- Group members
- Group leader
- Co-leader
- Student list
- Group details

📚 Course & Curriculum Management

Organize vocational education information including:

- Courses
- Curriculum
- Training modules
- Class assignments
- Theory activities
- Practical activities

📝 Marks & Performance

Manage student academic and practical performance.

The planned marks system supports:

Theory + Practice = Total

Example:

Theory    : 35
Practice  : 45
----------------
Total     : 80

Saved marks can be edited when required.

📊 Performance Monitoring

Track:

- Student progress
- Practical assessment
- Academic performance
- Marks
- Attendance
- Student records

---

🤖 Face Recognition

VE Management includes face-recognition-assisted attendance.

The long-term goal is to provide:

Camera
   ↓
Face Detection
   ↓
Face Quality Check
   ↓
Face Alignment
   ↓
Face Embedding
   ↓
Similarity Matching
   ↓
Student Identification
   ↓
Attendance

Offline Face Recognition

Face recognition is planned to operate fully on-device, without requiring an internet connection.

This is important for schools and vocational institutions where internet connectivity may be unreliable.

The application should not depend on a cloud face-recognition API for normal attendance operation.

---

📴 Offline-First Architecture

VE Management is designed around an offline-first architecture.

The following core functions should remain available without internet:

- Student management
- Student groups
- Attendance
- Marks
- Performance records
- Course information
- Reports
- Face recognition
- Local data management

Internet Usage

Internet connectivity is intended primarily for optional services such as:

- Google Drive synchronization
- Backup
- Data synchronization

The local database remains the primary source of application data.

                 VE Management
                       │
             ┌─────────┴─────────┐
             │                   │
       LOCAL DATABASE       OPTIONAL CLOUD
             │                   │
       Primary Data        Google Drive
             │              Synchronization
             │                   │
       Works Offline       Requires Internet

---

☁️ Google Drive Synchronization

Google Drive synchronization is intended as an optional backup/synchronization mechanism.

The application should continue working normally when Google Drive or the internet is unavailable.

Design Principle

LOCAL DATA
    ↓
Primary Source
    ↓
Google Drive
Optional Backup / Sync

The synchronization system should protect against:

- Duplicate records
- Accidental deletion
- Data overwriting
- Synchronization conflicts
- Data corruption
- Loss of attendance records
- Loss of marks

---

🔐 Security

Security is an important part of the VE Management roadmap.

Planned security improvements include:

- Secure local data storage
- Protected authentication/session handling
- Secure Google Drive credentials
- No hardcoded API secrets
- Secure file handling
- Input validation
- Permission minimization
- Production logging controls
- R8/ProGuard protection where appropriate
- Protection against accidental data exposure
- Safer synchronization and backup

Sensitive information should never be unnecessarily exposed through logs, exported files, or application storage.

---

🔋 Battery Optimization

VE Management is designed to minimize unnecessary battery consumption.

Particular attention will be given to:

- Camera processing
- Face recognition
- Background tasks
- Database operations
- Google Drive synchronization
- Timers
- CPU-intensive processing

Face recognition should only consume significant processing resources while the recognition feature is actively being used.

When the recognition screen is closed:

- Camera resources should be released.
- Face-processing resources should stop.
- Unnecessary background work should terminate.

Google Drive synchronization should not continuously run in the background.

---

📱 Android 16 Support

The project roadmap includes full compatibility with Android 16.

The application will be reviewed for:

- Android 16 SDK compatibility
- Target SDK requirements
- Modern Android permissions
- Camera behavior
- Storage APIs
- Background execution restrictions
- Edge-to-edge UI
- Window insets
- Navigation bar handling
- Status bar handling
- Modern Android lifecycle behavior

The application should remain compatible with supported earlier Android versions where practical.

---

🧠 Face Recognition Improvement Roadmap

The current face-recognition implementation requires improvement in reliability and performance.

The recognition system will be evaluated for:

- Detection accuracy
- Recognition accuracy
- False positives
- False negatives
- Lighting conditions
- Face angle
- Face distance
- Camera quality
- Multiple faces
- Processing speed
- CPU usage
- Battery consumption

Face API Evaluation

The current implementation will be reviewed to determine whether face-api.js should:

Option 1 — Be optimized

Improve:

- Face detection
- Face descriptors
- Recognition threshold
- Enrollment process
- Image preprocessing
- Camera processing
- Frame-processing frequency

Option 2 — Be replaced

If a stronger solution is technically more appropriate, the application may move to a modern on-device Android face-embedding/recognition solution.

The replacement must satisfy the following requirements:

- Offline operation
- Fast inference
- Good recognition accuracy
- Low CPU usage
- Reasonable battery consumption
- Android compatibility
- No mandatory cloud API
- Suitable for classroom attendance

The final technology choice should be based on testing rather than assumptions.

---

📝 Marks Management Roadmap

The marks module will support:

Theory Marks
      +
Practice Marks
      =
Total Marks

Required functionality

- Theory entry
- Practice entry
- Automatic total calculation
- Save button
- Edit button
- Input validation
- Offline persistence
- Existing-record editing
- Duplicate prevention

---

👥 Student Group Details Roadmap

When a teacher taps a student group, the application should open a detailed group screen.

The screen should display:

Group Information

- Group name
- Group ID, where applicable
- Total students
- Leader
- Co-leader

Students

- Student name
- Roll number/student ID
- Group membership

The interface should clearly identify:

LEADER
CO-LEADER
OTHER STUDENTS

---

🏗️ Development Principles

VE Management follows these principles:

1. Offline First

Core functionality should not depend on the internet.

2. Local Data First

The local database is the primary source of application data.

3. Cloud as Backup

Google Drive is used for optional synchronization/backup rather than being the core database.

4. Privacy

Student information should remain protected.

5. Reliability

Attendance and academic records should not be easily lost.

6. Performance

The application should remain fast on modern Android devices.

7. Battery Efficiency

Background processing should be minimized.

8. Maintainability

New functionality should be added without unnecessarily breaking existing modules.

---

📦 Current Release

v5.6 — Initial APK Release

The initial release introduced the VE Management application with core functionality for vocational student management, attendance, course/curriculum management, performance monitoring, and a mobile-first interface.

Installation

1. Download the latest APK from the GitHub Releases page.
2. If Android asks for permission, allow installation from the relevant browser/file manager.
3. Open the APK.
4. Install VE Management.
5. Launch the application.

Latest Releases

"Download VE Management from GitHub Releases" (https://github.com/iamrocky899-sketch/itdept-ghss/releases)

---

🛣️ Roadmap

Phase 1 — Stability

- [ ] Fix existing bugs
- [ ] Improve data reliability
- [ ] Improve error handling
- [ ] Verify offline operation

Phase 2 — Marks

- [ ] Theory + Practice = Total
- [ ] Save marks
- [ ] Edit marks
- [ ] Marks validation
- [ ] Offline persistence

Phase 3 — Student Groups

- [ ] Group details screen
- [ ] Leader display
- [ ] Co-leader display
- [ ] Student list
- [ ] Group statistics

Phase 4 — Face Recognition

- [ ] Audit current face-recognition system
- [ ] Improve enrollment
- [ ] Improve recognition accuracy
- [ ] Improve face detection
- [ ] Optimize processing
- [ ] Reduce false positives
- [ ] Reduce false negatives
- [ ] Evaluate replacement for face-api.js
- [ ] Implement offline face recognition

Phase 5 — Security

- [ ] Secure local storage
- [ ] Secure authentication
- [ ] Secure synchronization
- [ ] Remove sensitive production logs
- [ ] Review permissions
- [ ] Add release obfuscation

Phase 6 — Performance

- [ ] Battery optimization
- [ ] Camera optimization
- [ ] Memory optimization
- [ ] Database optimization
- [ ] Background-task optimization

Phase 7 — Android 16

- [ ] Android 16 compatibility
- [ ] Modern SDK configuration
- [ ] Edge-to-edge support
- [ ] WindowInsets support
- [ ] Permission review
- [ ] Camera compatibility testing
- [ ] Storage compatibility testing

---

🧪 Testing Strategy

Before every major release, test:

Student Management

- Student creation
- Student editing
- Student deletion
- Student search
- Data persistence

Attendance

- Manual attendance
- Face recognition
- Duplicate attendance prevention
- Offline attendance
- Attendance persistence

Marks

- Theory marks
- Practice marks
- Automatic total
- Save
- Edit
- Data persistence

Groups

- Group creation
- Group details
- Leader
- Co-leader
- Student list

Offline Mode

Disable internet completely and verify that all core functions continue working.

Synchronization

Test:

- Upload
- Download
- Conflict handling
- Duplicate prevention
- Data recovery
- Offline → Online synchronization

Android

Test on:

- Android 14
- Android 15
- Android 16

where supported by the project.

---

🐛 Bug Reports & Suggestions

If you discover a problem or have a feature suggestion, please open an issue in the GitHub repository.

When reporting a bug, include:

- App version
- Android version
- Device model
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshot/video if useful

---

🔒 Privacy

VE Management is designed with an offline-first approach.

Student and academic information should remain stored locally unless the user explicitly uses synchronization or backup functionality.

Do not upload student information to external services without an intentional synchronization/backup action.

---

👨‍💻 Project

Project: VE Management
Purpose: Vocational Education Management
Platform: Android / Mobile-first
Architecture: Offline-first
Cloud Sync: Optional Google Drive synchronization
Face Recognition: On-device/offline target
Latest Release: v5.6

---

📄 License

Add the project's applicable license here.

If this project is intended for private/institutional use, clearly specify the usage and redistribution terms before publishing a license.

---

❤️ Built for Vocational Education

VE Management is built with one goal:

«Make vocational education management simpler, faster, more reliable, and less dependent on paperwork and internet connectivity.»

VE Management — Manage. Track. Teach.
