# VE MANAGEMENT — Security Authorization Matrix
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Academic Session:** 2026–27  
**Module:** Enterprise Role-Based Access Control (RBAC) & IDOR Protection Matrix

---

## 1. Role Definitions & Hierarchy

1. **`STUDENT`**: Authenticated enrolled student. Scoped strictly to own academic records, notices, study materials, and personal attendance.
2. **`PARENT`**: Authenticated parent/guardian. Scoped strictly to verified linked children via `ParentStudentLinks`.
3. **`TEACHER`**: Authorized academic faculty. Scoped strictly to assigned classes (`assignedClasses`) and assigned subjects (`assignedSubjects`).
4. **`PRINCIPAL`**: School executive head. Full read and reporting oversight across all school classes and subjects; administrative notice publication.
5. **`ADMIN`**: Root system administrator. Full configuration, staff roster management, synchronization, and system settings oversight.

---

## 2. Resource Access & Authorization Matrix

| Resource / Endpoint | Student (`STUDENT`) | Parent (`PARENT`) | Teacher (`TEACHER`) | Principal (`PRINCIPAL`) | Admin (`ADMIN`) | Server Enforcement Handler |
|---|---|---|---|---|---|---|
| **Student Profile (Own)** | ✅ Read Only | ✅ Linked Child Only | ✅ Assigned Class | ✅ School-wide Read | ✅ Full CRUD | `Security.canAccessStudent` |
| **Student Profile (Other)** | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ School-wide Read | ✅ Full CRUD | `Security.canAccessStudent` |
| **Attendance (View)** | ✅ Own Records | ✅ Linked Child | ✅ Assigned Class | ✅ School-wide Read | ✅ Full Access | `Security.canAccessStudent` |
| **Attendance (Mark/Edit)** | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Assigned Class | ✅ School-wide Write | ✅ Full Access | `AcademicApi.saveAttendance` |
| **Marks & Report Cards (View)** | ✅ Own Marks | ✅ Linked Child | ✅ Assigned Subject | ✅ School-wide Read | ✅ Full Access | `Security.canAccessStudent` |
| **Marks Entry & Grading** | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Assigned Subject | ✅ Audit / Review | ✅ Full Access | `AcademicApi.saveMarks` |
| **Study Notes & Curriculum** | ✅ Enrolled Class | ✅ Enrolled Class | ✅ Assigned Subject | ✅ Full Access | ✅ Full Access | `Security.filterNotesForSession` |
| **Vocational Activities** | ✅ Enrolled Class | ✅ Enrolled Class | ✅ Assigned Class | ✅ Full Access | ✅ Full Access | `Security.filterActivitiesForSession` |
| **Homework & Assignments** | ✅ Enrolled Class | ✅ Enrolled Class | ✅ Assigned Class | ✅ Full Access | ✅ Full Access | `AcademicApi.saveAssignments` |
| **Notices & Circulars (View)** | ✅ Targeted (All/Student) | ✅ Targeted (All/Parent) | ✅ Targeted (All/Staff) | ✅ All Circulars | ✅ All Circulars | `Security.filterNoticesForSession` |
| **Notices (Publish/Manage)** | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Class-Level Notice | ✅ School-wide Notice | ✅ Full Access | `AcademicApi.saveNotices` |
| **Academic Calendar 2026–27** | ✅ Read Only (254 Days) | ✅ Read Only (254 Days) | ✅ Read Only | ✅ Read Only | ✅ Full Admin | `AcademicApi.getCalendar` |
| **Staff Directory & Profiles** | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Read Colleagues | ✅ School-wide Read | ✅ Full CRUD | `AdminApi.getStaff` |
| **Parent-Student Link Mappings**| ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ School-wide Read | ✅ Full CRUD | `AdminApi.provisionParentsFromStudents` |
| **School Configuration & Settings**| ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Full Access | `Security.enforceRole(..., ['ADMIN'])` |
| **Cloud Synchronization Engine** | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Full Access | `SyncApi.sync` |
| **Audit Logs** | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ School-wide Audit | ✅ Full Access | `Database.findBy('Audit', ...)` |

---

## 3. Core Multi-Tenant & Security Invariants
1. **School ID Constraint:** Every incoming request is strictly locked to `schoolId === 'GAMERI-HSS-001'`. Foreign school ID injections are intercepted and rejected with `403 INVALID_SCHOOL_ID`.
2. **Cryptographic Token Verification:** All authenticated routes validate HMAC-SHA256 session signatures. Unsigned or expired sessions return `401 UNAUTHORIZED`.
3. **Sensitive Attribute Stripping:** Backend APIs automatically purge `passwordHash`, `salt`, `SERVER_SECRET`, `ADMIN_API_KEY`, and `faceEmbedding` before serializing JSON responses.
