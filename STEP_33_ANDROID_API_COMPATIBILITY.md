# STEP 33 — ANDROID API COMPATIBILITY MATRIX
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Canonical API:** `https://ve-management-api.iamrocky899.workers.dev`  
**Date:** September 4, 2026  
**Status:** **AUDIT VERIFIED — PARITY ON READS/AUTH; WRITE/SYNC BLOCKED**

---

## 1. Overview

This matrix evaluates every API action used or required by the Android application (`com.itdept.itghss`), comparing the legacy Google Apps Script backend against the new Cloudflare Worker API backend. Actions not supported by Cloudflare are explicitly flagged as **BLOCKED**.

---

## 2. API Compatibility Matrix

| Action | Current Endpoint | Cloudflare Endpoint | Authentication | Read/Write | Expected Response | Compatibility | Test Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`ping`** | Worker API | `GET /api/ping` or `?action=ping` | None (Public) | Read | `{ status: "ONLINE", environment: "production" }` | Compatible | **PASS** |
| **`auth_login`** / **`login`** | Worker API | `POST /` | Credentials (Identifier + Password) | Read | `{ success: true, data: { token: "...", role: "..." } }` | Compatible | **PASS** |
| **`auth_change_password`** | Apps Script Standby | Not Implemented | Bearer Token / API Key | Write | `{ success: true, data: { changed: true } }` | **BLOCKED** | **UNROUTED (404)** |
| **`get_students`** / **`list_students`** | Worker API | `GET ?action=get_students` | Bearer Token (Staff/Admin) | Read | `{ success: true, data: { students: [...] } }` | Compatible | **PASS** (102 records) |
| **`get_student_profile`** | Worker API | `GET ?action=get_student_profile` | Bearer Token (Self/Parent/Staff) | Read | `{ success: true, data: { student: {...} } }` | Compatible | **PASS** |
| **`get_parent_children`** | Worker API | `GET ?action=get_parent_children` | Bearer Token (Parent) | Read | `{ success: true, data: { children: [...] } }` | Compatible | **PASS** |
| **`get_contacts`** | Worker API | `GET ?action=get_contacts` | Bearer Token | Read | `{ success: true, data: { contacts: [...] } }` | Compatible | **PASS** |
| **`get_staff_profile`** | Worker API | `GET ?action=get_staff_profile` | Bearer Token (Staff) | Read | `{ success: true, data: { staff: {...} } }` | Compatible | **PASS** |
| **`get_teacher_workload`** | Worker API | `GET ?action=get_teacher_workload` | Bearer Token (Teacher) | Read | `{ success: true, data: { scope: {...} } }` | Compatible | **PASS** |
| **`get_staff_list`** | Apps Script Standby | Not Implemented | Admin API Key / Token | Read | `{ success: true, data: { staff: [...] } }` | **BLOCKED** | **UNROUTED (404)** |
| **`register_staff`** | Apps Script Standby | Not Implemented | Admin API Key / Token | Write | `{ success: true, data: { staffId: "..." } }` | **BLOCKED** | **UNROUTED (404)** |
| **`update_staff`** | Apps Script Standby | Not Implemented | Admin API Key / Token | Write | `{ success: true, data: { updated: true } }` | **BLOCKED** | **UNROUTED (404)** |
| **`set_staff_status`** | Apps Script Standby | Not Implemented | Admin API Key / Token | Write | `{ success: true, data: { status: "..." } }` | **BLOCKED** | **UNROUTED (404)** |
| **`auth_reset_user_password`** | Apps Script Standby | Not Implemented | Admin API Key / Token | Write | `{ success: true, data: { reset: true } }` | **BLOCKED** | **UNROUTED (404)** |
| **`get_attendance`** | Worker API | `GET ?action=get_attendance` | Bearer Token (Staff/Admin) | Read | `{ success: true, data: { attendance: [...] } }` | Compatible | **PASS** |
| **`save_attendance`** | Worker API | `POST ?action=save_attendance` | Bearer Token (Teacher/Admin) | Write | `{ success: true, data: { sessionId: "...", ... } }` | Compatible (Direct REST) | **PASS** |
| **`generate_student_attendance_report`** | Worker API | `GET ?action=generate_student_attendance_report` | Bearer Token | Read | `{ success: true, data: { attendancePercentage: ..., ... } }` | Compatible | **PASS** (Authoritative) |
| **`get_examinations`** | Worker API | `GET ?action=get_examinations` | Bearer Token | Read | `{ success: true, data: { examinations: [...] } }` | Compatible | **PASS** |
| **`get_marks`** | Worker API | `GET ?action=get_marks` | Bearer Token | Read | `{ success: true, data: { marks: [...] } }` | Compatible | **PASS** |
| **`get_exam_results`** | Worker API | `GET ?action=get_exam_results` | Bearer Token | Read | `{ success: true, data: { results: [...] } }` | Compatible | **PASS** |
| **`get_notes`** | Worker API | `GET ?action=get_notes` | Bearer Token | Read | `{ success: true, data: { notes: [...] } }` | Compatible | **PASS** |
| **`get_notices`** | Worker API | `GET ?action=get_notices` | Bearer Token | Read | `{ success: true, data: { notices: [...] } }` | Compatible | **PASS** (3,160 notices) |
| **`get_documents`** | Worker API | `GET ?action=get_documents` | Bearer Token | Read | `{ success: true, data: { documents: [...] } }` | Compatible | **PASS** |
| **`verify_document`** | Worker API | `GET ?action=verify_document` | None (Public QR) | Read | `{ success: true, data: { verified: true, ... } }` | Compatible | **PASS** |
| **`get_dashboard_summary`** | Worker API | `GET ?action=get_dashboard_summary` | Bearer Token | Read | `{ success: true, data: { stats: {...} } }` | Compatible | **PASS** |
| **`get_admin_summary`** | Apps Script Standby | Not Implemented | Admin API Key / Token | Read | `{ success: true, data: { stats: {...} } }` | **BLOCKED** | **UNROUTED (404)** |
| **`get_settings`** | Worker API | `GET ?action=get_settings` | Bearer Token | Read | `{ success: true, data: { settings: {...} } }` | Compatible | **PASS** |
| **`get_calendar`** | Worker API | `GET ?action=get_calendar` | None (Public) | Read | `{ success: true, data: { calendar: [...] } }` | Compatible | **PASS** |
| **`sync_upload`** | Apps Script Standby | Not Implemented | Bearer Token / Admin Key | Write | `{ success: true, data: { syncId: "...", ... } }` | **BLOCKED** | **UNROUTED (404)** |
| **`sync_download`** | Apps Script Standby | Not Implemented | Bearer Token / Admin Key | Read | `{ success: true, data: { students: [...], ... } }` | **BLOCKED** | **UNROUTED (404)** |
| **`reset_parent_portal_data`** | Apps Script Standby | Not Implemented | Admin API Key | Write | `{ success: true, data: { reset: true } }` | **BLOCKED** | **UNROUTED (404)** |

---

## 3. Analysis of Blocked Actions

### 1. `sync_upload` & `sync_download` (Critical Blocker)
- **Used by:** `SyncManager.js` (`uploadPendingQueue` and `downloadCloudDeltas`).
- **Nature:** Encapsulates multi-entity delta synchronization (Students, Attendance, Marks, Notes, Notices).
- **Current Cloudflare Behavior:** Returns HTTP 404 `INVALID_ACTION: Unrecognized or unrouted API action: sync_upload`.
- **Impact:** Any Android device taking attendance offline fails to sync to Cloudflare D1.

### 2. Staff Management Operations (`get_staff_list`, `register_staff`, `update_staff`, `set_staff_status`, `auth_reset_user_password`)
- **Used by:** Android Admin settings panel (`index.html` lines 3865-4355).
- **Nature:** Creation and lifecycle administration of teacher accounts.
- **Current Cloudflare Behavior:** Returns HTTP 404 `INVALID_ACTION`.
- **Impact:** Admin cannot manage or provision staff members directly through the Cloudflare Worker API.

### 3. Action Parity Summary
- **Compatible Actions:** 19
- **Blocked Actions:** 10
- **Total Actions Audited:** 29
- **Conclusion:** Read-only portal functions and single-record reads are compatible; batch offline synchronization and workforce management are blocked on the Cloudflare Worker.
