# VE MANAGEMENT — PHASE 6 — STEP 1
# STUDENT & PARENT PORTAL — ARCHITECTURE & SECURITY SPECIFICATION

**School:** Gameri Higher Secondary School, Gamiri  
**Permanent School ID:** `GAMERI-HSS-001`  
**Phase & Step:** **PHASE 6 — STEP 1: STUDENT & PARENT PORTAL ARCHITECTURE & SECURITY INSPECTION**  
**Classification:** Architecture & Security Design Specification  
**Status:** **INSPECTION & PLANNING COMPLETE**

---

## 1. Executive Summary & Objective

Phase 6 designs and delivers the unified **Student Portal** and **Parent Portal** for Gameri Higher Secondary School. The system operates on a zero-trust, server-side authoritative model ensuring that:
1. **STUDENT**: Can access ONLY their own verified academic records, attendance history, marks breakdown, study materials, class activities, assignments, notices, and calendar.
2. **PARENT**: Can access ONLY their server-side linked child's (or children's) verified academic records, attendance history, marks breakdown, study materials, class activities, assignments, notices, calendar, and teacher/principal communication links.
3. **TEACHER**: Continues using the Staff Portal with existing classroom and subject authorization barriers (`user.assignedClasses`, `user.assignedSubjects`).
4. **PRINCIPAL**: Continues using the Staff Portal with existing school-wide oversight across Classes 9, 10, 11, and 12.
5. **ADMIN**: Continues using the authoritative native Android Administration application without public exposure.

---

## 2. Current Architecture Discovered

### A. Authentication & Cryptography Layer (`backend/Auth.gs`)
- **HMAC-SHA256 Signed Web-Safe Session Tokens:** Tokens follow the format `${userId}|${role}|${schoolId}|${identifier}|${expiresAt}|${signature}` signed with `SERVER_SECRET` stored in Script Properties.
- **30-Day Session Lifetime:** Checked on every request; expired sessions are immediately rejected.
- **Brute-Force Protection:** 5 failed attempts per 15-minute window via `CacheService` (`checkBruteForce`, `recordFailedLogin`, `clearFailedLogins`).
- **Common School Password Model:** Default password `GameriHSS#123` stored in `Settings` / Script Properties. Not temporary; users can continue using it or upgrade to a custom personal password.
- **Custom Password Hashing:** When custom passwords are set, `Auth.hashPassword(password, salt)` uses SHA-256 with a 16-character cryptographic salt (`Auth.generateSalt(16)`). Plaintext passwords are never persisted.
- **Admin Reset:** Admin can reset staff/parent/student accounts back to `COMMON` password mode.

### B. Current Student Data Model (`backend/Schema.gs` - `Students` Sheet)
| Column | Field Name | Description |
| :--- | :--- | :--- |
| A | `studentId` | Unique primary key (e.g. `STU_...` or institutional student ID) |
| B | `schoolId` | Permanent School ID (`GAMERI-HSS-001`) |
| C | `studentName` | Full name of the student |
| D | `rollNo` | Class roll number |
| E | `class` | Enrolled class level (`9`, `10`, `11`, `12`) |
| F | `section` | Section identifier (`A`, `B`) |
| G | `gender` | `Male`, `Female`, `Other` |
| H | `dob` | Date of birth (`YYYY-MM-DD`) |
| I | `fatherName` | Father / Primary Guardian name |
| J | `motherName` | Mother name |
| K | `mobile` | Primary parent/student mobile number (10 digits) |
| L | `aadhaar` | Aadhaar number (sanitized/excluded from portal views) |
| M | `village` | Residential village / locality |
| N | `status` | `Active`, `Inactive`, `Dropped` |
| O | `createdAt` | ISO timestamp |
| P | `updatedAt` | ISO timestamp |

### C. Current Parent Data Model & Linking
- **`Parents` Sheet:** Primary key `parentId`, `mobile`, `parentName`, `passwordHash`, `salt`, `isCustomPassword`, `status`.
- **`ParentStudentLinks` Sheet:** Primary key `linkId`, `schoolId`, `parentId`, `studentId`, `relationship` (`Father`, `Mother`, `Guardian`), `active` (`true`/`false`).
- **Mobile Number Binding Discovery:**
  - `Students.mobile` stores the 10-digit guardian/parent contact.
  - Auto-provisioning creates unique `Parents` records indexed by clean 10-digit mobile numbers.
  - Multiple students having the same mobile number (siblings) map to the same `parentId` with multiple rows in `ParentStudentLinks`.

---

## 3. Recommended Account & Identity Binding Models

### A. Student Account Model
1. **Identifier Strategy:** Students log in using their **Student ID** (`studentId`), **Roll Number + Class**, or **Registered Mobile Number**.
2. **Identity Resolution:** Server resolves the exact `studentId`. The session token binds `userId = studentId` and `role = 'STUDENT'`.
3. **Zero Trust Scoping:** Every incoming request extracts `session.userId`. All student queries force `studentId = session.userId`.

### B. Parent Account Model
1. **Identifier Strategy:** Parents log in using their **Registered 10-Digit Mobile Number** or **Parent ID** (`parentId`).
2. **Identity Resolution:** Server resolves `parentId`. Session token binds `userId = parentId` and `role = 'PARENT'`.
3. **Child Resolution:** Backend calls `Security.getAuthorizedStudentIdsForParent(session.userId, session.schoolId)` from `ParentStudentLinks`.
4. **Multi-Child Support:** If a parent has multiple children (e.g. Rahul in Class 9, Priya in Class 10), the server returns the authorized list of children `[{ studentId, studentName, class, section, rollNo }, ...]`. The parent can switch views between their children without requiring re-authentication.

---

## 4. Security & Role Authorization Matrix

| Resource / Endpoint | Student | Parent | Teacher | Principal | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Own Profile** | Read Own | Read Linked Child | Assigned Scope | School-Wide | Full |
| **Attendance 2.0** | Read Own | Read Linked Child | Scoped Classes | School-Wide | Full |
| **4-Exam Marks** | Read Own | Read Linked Child | Scoped Subject/Class | School-Wide | Full |
| **Teacher Study Notes** | Read Class/Subject | Read Child Class/Subject | Manage Assigned Scope | School-Wide | Full |
| **Vocational Activities** | Read Class/Subject | Read Child Class/Subject | Manage Assigned Scope | School-Wide | Full |
| **Assignments & Tasks** | Read Class/Subject | Read Child Class/Subject | Manage Assigned Scope | School-Wide | Full |
| **Notices & Circulars** | Relevant Class/All | Relevant Class/All | Scoped Classes | School-Wide | Full |
| **Academic Calendar** | Read Only | Read Only | Read Only | Read Only | Full |
| **Direct Contact Info** | Assigned Teachers | Assigned Teachers | Staff Roster | School-Wide | Full |
| **Other Students Data** | **BLOCKED (403)** | **BLOCKED (403)** | **BLOCKED (403)** | Allowed | Full |
| **Staff/Admin Management**| **BLOCKED (403)** | **BLOCKED (403)** | **BLOCKED (403)** | Allowed | Full |

---

## 5. IDOR & Zero-Trust Defense Architecture

### Prevention of Insecure Direct Object References (IDOR):
1. **Parent IDOR Attack Scenario:** Parent A (linked to `STU_001`) sends API request `get_student_portfolio` with `studentId = 'STU_002'`.
   - **Mitigation:** Backend checks `Security.canAccessStudent(session, 'STU_002')`. Because `'STU_002'` is not in `getAuthorizedStudentIdsForParent(Parent A)`, the server immediately logs `UNAUTHORIZED_PORTFOLIO_ACCESS` and returns `403 UNAUTHORIZED`.
2. **Student IDOR Attack Scenario:** Student A sends API request with `studentId = 'STU_002'`.
   - **Mitigation:** Backend checks `session.userId === studentId`. Since `'STU_001' !== 'STU_002'`, request is blocked with `403 UNAUTHORIZED`.
3. **Teacher Cross-Class Attack Scenario:** Teacher assigned to Class 9 requests Class 11 data.
   - **Mitigation:** Backend checks `Security.canAccessClass(session, '11')` and rejects with `403 UNAUTHORIZED`.

---

## 6. Data Minimization & Privacy Enforcement

The backend sanitization layer (`AcademicApi.sanitizeStudent`) strictly purges the following sensitive fields before returning any response to the frontend:
- ❌ `faceEmbedding` / `faces` (Biometric vectors)
- ❌ `descriptor` / `descriptors` / `landmarks` (Biometric landmarks)
- ❌ `passwordHash` & `salt` (Authentication credentials)
- ❌ `aadhaar` (National identity numbers)
- ❌ `SERVER_SECRET` & `ADMIN_API_KEY` (Signing keys)
- ❌ Internal sync metadata & debug dumps

---

## 7. Study Materials, Notices & Calendar Scoping

1. **Study Materials Scoping:**
   - Student in Class 9 can only fetch notes where `class == '9'` and `visibility != 'STAFF_ONLY'`.
   - Parent of Class 9 student can only fetch notes where `class == '9'` and `visibility != 'STAFF_ONLY'`.
   - Materials for other classes (e.g. Class 10, 11, 12) are filtered out server-side.
2. **Notices & Circulars Scoping:**
   - School-Wide notices (`class == ''` or `visibility == 'ALL'`) are delivered to all students and parents.
   - Class-specific circulars are filtered to match the student's enrolled class.
3. **Academic Calendar Scoping:**
   - Uses Attendance 2.0 authoritative calendar rules (`getDayStatus`).
   - Class 9 & 10 observe Saturday Off; Class 11 & 12 observe Saturday Working.
   - Read-only for Student and Parent roles.

---

## 8. Threat Model & Security Mitigations

| Threat | Risk Level | Description | Architectural Mitigation |
| :--- | :---: | :--- | :--- |
| **1. IDOR on Student Records** | **CRITICAL** | Attacker tampers `studentId` parameter in API calls to view another student. | Server-side verification via `Security.canAccessStudent(session, studentId)`. Never trusts client-supplied parameters. |
| **2. Account Enumeration** | **MEDIUM** | Malicious actor queries mobile numbers to check student/parent existence. | Generic error messages (`Invalid credentials or inactive account`) and brute-force rate limiting. |
| **3. Common Password Abuse** | **HIGH** | Unauthenticated user logs in using default school password. | Brute-force lockout (5 attempts/15 min), optional custom password upgrade, audit logging of login events. |
| **4. Session Token Forgery** | **CRITICAL** | Attacker creates fake session token with elevated role (e.g. `ADMIN`). | Cryptographic HMAC-SHA256 token verification using `SERVER_SECRET`. Invalid signature immediately returns `null`. |
| **5. Role Escalation** | **CRITICAL** | Student attempts calling teacher/admin management endpoints. | `Security.enforceRole(session, ['TEACHER', 'PRINCIPAL', 'ADMIN'])` guards every mutating endpoint. |
| **6. Deactivated Account Access** | **HIGH** | Dropped student or deactivated parent uses existing session. | Real-time session validation via `Security.isAccountActive(session)` queries live database status. |
| **7. Biometric Data Leakage** | **CRITICAL** | Facial embeddings or face descriptors exposed in API responses. | Mandatory `AcademicApi.sanitizeStudent` filters biometrics out before serializing JSON. |
| **8. Parent-Child Mismatch** | **HIGH** | Sibling data exposed to unrelated parent account. | Strict relational binding in `ParentStudentLinks` verified on every data fetch. |
| **9. Teacher Scope Bypass** | **HIGH** | Teacher mutates or views records outside assigned class or subject. | `Security.canAccessClass` and `Security.canTeacherManageSubject` enforced on backend. |
| **10. Script Secret Exposure** | **CRITICAL** | `SERVER_SECRET` or `ADMIN_API_KEY` returned to client. | Kept strictly in `PropertiesService.getScriptProperties()` and never included in API outputs. |
| **11. XSS in Notes Q&A** | **MEDIUM** | Teacher enters malicious HTML in question/answer text. | React DOM auto-escaping on frontend; plain-text sanitization on backend. |
| **12. URL Parameter Injection** | **LOW** | Malicious parameters passed in query strings. | URL parameters are only used as lookup keys, followed by full server-side authorization check. |
| **13. Direct Apps Script Invocations**| **HIGH**| Attacker executes raw HTTP POST to Apps Script URL. | `Code.gs` API gateway forces session token validation on all non-login endpoints. |

---

## 9. Frontend Project Architecture Recommendation

### Recommendation:
- Maintain **`staff-portal/`** for Teachers, Principals, and Administrators.
- Upgrade **`parent-portal/`** into a clean, modern **Unified Student & Parent Portal** (`parent-portal/` or `student-parent-portal/`).
- **Rationale:**
  - `parent-portal/` already exists in the repository with modular pages for attendance, marks, activities, notices, calendar, achievements, documents, and contacts.
  - Reusing and refining `parent-portal/` avoids redundant project proliferation while allowing seamless role-based routing for `STUDENT` and `PARENT` users.
  - Architecture: React 18 + Vite + Lucide icons + modern CSS design matching the Gameri HSS aesthetic.

---

## 10. Phase 6 Implementation Sequence

1. **Step 1 (Current):** Architecture & Security Inspection (Complete).
2. **Step 2:** Backend API Polish for Student & Parent Endpoints (`student_dashboard`, `parent_dashboard`, child switching, scoped notes/activities/assignments).
3. **Step 3:** Student & Parent Portal Project Setup, Authentication & Session Binding.
4. **Step 4:** Unified Dashboard (Student View & Parent Multi-Child Switcher View).
5. **Step 5:** Attendance 2.0 Viewer & Calendar Timeline.
6. **Step 6:** 4-Exam Marks Performance & Grade Card.
7. **Step 7:** Teacher Notes, Study Materials & Q&A Browser.
8. **Step 8:** Class Activities, Assignments & Submissions.
9. **Step 9:** Notices, Circulars & WhatsApp Alerts.
10. **Step 10:** Academic Calendar & School Events.
11. **Step 11:** Teacher & School Contact Directory.
12. **Step 12:** Student Profile & Custom Password Management.
13. **Step 13:** End-to-End Verification, Security Audit & Build.

---

## 11. Open Questions & Confirmation

- **Initial Common Password:** Confirmed as `GameriHSS#123` across all roles (Staff, Parent, Student).
- **Multi-Child Linking:** Confirmed supported via `ParentStudentLinks` relational model.
- **Biometric Protection:** Confirmed 100% stripped from all public and portal API endpoints.

---

## 12. PHASE 6 STEP 2 API IMPLEMENTATION

The backend APIs for the Student and Parent portals have been fully implemented in `backend/AcademicApi.gs`, `backend/Security.gs`, and `backend/Code.gs`:

1. **`student_dashboard` (`AcademicApi.studentDashboard`):**
   - Strictly derives student ID from `session.userId`.
   - Returns sanitized student profile, attendance summary, 4-exam marks, class-scoped notes, activities, assignments, notices, and upcoming calendar events.
2. **`parent_dashboard` (`AcademicApi.parentDashboard`):**
   - Strictly resolves authorized children through `Security.getAuthorizedChildren(session.userId, session.schoolId)`.
   - Supports 1-to-many multi-child relationships; returns full attendance, marks, assignments, activities, and notices for each child.
3. **`get_parent_children` (`AcademicApi.getParentChildren`):**
   - Returns safe list of authorized children for the logged-in parent.
4. **`get_student_profile` (`AcademicApi.getStudentProfile`):**
   - Enforces `Security.canAccessStudent` barrier.
   - Purges all biometrics, password hashes, salts, and Aadhaar numbers.
5. **Mutation Barrier:**
   - All mutations (`saveStudents`, `saveAttendance`, `saveMarks`, `saveNotes`, `saveActivities`, `saveAssignments`, `saveNotices`) strictly reject `STUDENT` and `PARENT` sessions with `403 UNAUTHORIZED`.
6. **Class-Scoped Filtering:**
   - `filterNotesForSession`, `filterActivitiesForSession`, `filterAssignmentsForSession`, and `filterNoticesForSession` enforce class-level isolation for both students and parents.

