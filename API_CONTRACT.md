# VE Management — HTTPS API Specification & Contract
**School:** Gameri Higher Secondary School, Gamiri  
**Version:** `5.7` (Backend API v1.0)  
**Target Consumers:** VE Management Android App (Admin) & Future Parent Portal Web App  

---

## 1. General API Protocol & Envelope

### Request Protocol
- **Endpoint:** Google Apps Script Web App URL (`https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec`)
- **HTTP Methods:** `POST` (preferred for all state mutations & secured reads), `GET` (supported for public reads/calendar)
- **Headers:** `Content-Type: application/json`

### Standard Response Envelope
All API responses return a standardized JSON envelope:

```json
{
  "success": true,
  "action": "parent_dashboard",
  "data": { ... },
  "error": null,
  "timestamp": "2026-08-28T17:30:00Z"
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "action": "parent_attendance",
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Access denied: You are not authorized to view this student's attendance."
  },
  "timestamp": "2026-08-28T17:30:00Z"
}
```

---

## 2. Authentication Models

### A. Admin Authentication
- **Mechanism:** Secret API Key passed in payload `apiKey` or HTTP header `Authorization: Bearer <API_KEY>`.
- **Configured via:** `PropertiesService.getScriptProperties().getProperty('ADMIN_API_KEY')`.

### B. Parent Authentication
- **Mechanism:** Mobile Number + Common Password (stored securely as SHA-256 hash with cryptographic salt).
- **Session:** Signed HMAC-SHA256 session token returned on `parent_login`. Passed as `token` in subsequent requests.

---

## 3. API Action Endpoints

---

### `POST` `action=ping`
Health check and server time sync.

**Request:**
```json
{
  "action": "ping"
}
```

**Response:**
```json
{
  "success": true,
  "action": "ping",
  "data": {
    "status": "ONLINE",
    "school": "Gameri Higher Secondary School, Gamiri",
    "version": "5.7",
    "serverTime": "2026-08-28 17:30:00"
  },
  "error": null,
  "timestamp": "2026-08-28T17:30:00Z"
}
```

---

### `POST` `action=parent_login`
Authenticates a parent and returns a signed session token with their authorized children.

**Request:**
```json
{
  "action": "parent_login",
  "mobile": "9876543210",
  "password": "ParentPassword@123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "action": "parent_login",
  "data": {
    "parent": {
      "parentId": "PAR_9876543210",
      "parentName": "Biren Borah",
      "mobile": "9876543210"
    },
    "token": "UEFSXzk4NzY1NDMyMTB8OTg3NjU0MzIxMHwxNzI3NTA1ODAwMDAwfDFlMmY...",
    "expiresAt": "2026-09-27T17:30:00.000Z",
    "children": [
      {
        "studentId": "STU_RAHUL",
        "studentName": "Rahul Borah",
        "rollNo": "101",
        "class": "9",
        "section": "A",
        "status": "Active"
      },
      {
        "studentId": "STU_PRIYA",
        "studentName": "Priya Saikia",
        "rollNo": "102",
        "class": "9",
        "section": "A",
        "status": "Active"
      }
    ]
  },
  "error": null,
  "timestamp": "2026-08-28T17:30:00Z"
}
```

---

### `POST` `action=parent_dashboard`
Aggregated dashboard endpoint returning full portfolio, attendance percentage, 4-exam marks, activities, notices, class teacher, and school details for all authorized children.

**Request:**
```json
{
  "action": "parent_dashboard",
  "token": "SESSION_TOKEN"
}
```

**Response:**
```json
{
  "success": true,
  "action": "parent_dashboard",
  "data": {
    "parent": {
      "parentId": "PAR_9876543210",
      "mobile": "9876543210"
    },
    "children": [
      {
        "student": {
          "studentId": "STU_RAHUL",
          "studentName": "Rahul Borah",
          "rollNo": "101",
          "class": "9",
          "section": "A",
          "gender": "Male",
          "village": "Gamiri",
          "status": "Active"
        },
        "attendanceSummary": {
          "presentDays": 22,
          "absentDays": 2,
          "totalRecordedDays": 24,
          "attendancePercentage": "91.7",
          "recentRecords": [ ... ]
        },
        "marks": [
          {
            "markId": "MRK_STU_RAHUL_0_IT",
            "exam": "1st Unit Test",
            "subject": "Information Technology (IT/ITeS)",
            "theory": 42,
            "practical": 48,
            "total": 90
          }
        ],
        "recentActivities": [ ... ],
        "classTeacher": {
          "teacherName": "IT Teacher",
          "class": "9",
          "section": "A",
          "mobile": "9876543210",
          "whatsapp": "https://wa.me/919876543210"
        }
      }
    ],
    "schoolContacts": {
      "schoolName": "Gameri Higher Secondary School, Gamiri",
      "principalName": "Sanjiv Gogoi",
      "mobile": "9876543210",
      "address": "Gamiri, Biswanath, Assam"
    },
    "notices": [ ... ]
  },
  "error": null,
  "timestamp": "2026-08-28T17:30:00Z"
}
```

---

### `POST` `action=parent_attendance`
Retrieves detailed date-wise attendance records for an authorized child.

**Request:**
```json
{
  "action": "parent_attendance",
  "token": "SESSION_TOKEN",
  "studentId": "STU_RAHUL",
  "month": "2026-08"
}
```

---

### `POST` `action=parent_marks`
Retrieves the 4-exam marks breakdown for an authorized child.

**Request:**
```json
{
  "action": "parent_marks",
  "token": "SESSION_TOKEN",
  "studentId": "STU_RAHUL"
}
```

---

### `POST` `action=change_password`
Updates the parent password.

**Request:**
```json
{
  "action": "change_password",
  "token": "SESSION_TOKEN",
  "oldPassword": "CurrentPassword@123",
  "newPassword": "NewSecurePassword@2026"
}
```

---

### `POST` `action=admin_sync`
Batch synchronization from Android Admin App to cloud Google Sheets.

**Request:**
```json
{
  "action": "admin_sync",
  "apiKey": "ADMIN_API_KEY",
  "students": [
    {
      "id": "STU_RAHUL",
      "name": "Rahul Borah",
      "roll": "101",
      "class": "9",
      "section": "A",
      "father": "Biren Borah",
      "mobile": "9876543210"
    }
  ],
  "attendance": {
    "2026-08-03": ["STU_RAHUL", "STU_PRIYA"],
    "2026-08-04": ["STU_RAHUL"]
  },
  "marks": {
    "STU_RAHUL": {
      "0": { "t": 42, "p": 48 },
      "1": { "t": 45, "p": 50 }
    }
  },
  "timetable": [ ... ],
  "schoolDetails": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "action": "admin_sync",
  "data": {
    "message": "Sync completed successfully",
    "results": {
      "students": { "inserted": 0, "updated": 1 },
      "attendance": { "inserted": 0, "updated": 3 },
      "marks": { "inserted": 0, "updated": 2 }
    }
  },
  "error": null,
  "timestamp": "2026-08-28T17:30:00Z"
}
```

---

### `POST` `action=register_parent`
Registers a parent account and establishes authorization relationships in `ParentStudentLinks`.

**Request:**
```json
{
  "action": "register_parent",
  "token": "ADMIN_OR_PRINCIPAL_TOKEN",
  "mobile": "9876543210",
  "parentName": "Biren Borah",
  "studentIds": ["STU_RAHUL", "STU_PRIYA"],
  "relationship": "Father"
}
```

---

### `POST` `action=get_staff_list`
Lists all registered staff members with sanitized profile details and passwordMode (`COMMON` / `CUSTOM`).
**Required Role:** `ADMIN` or `PRINCIPAL`

**Request:**
```json
{
  "action": "get_staff_list",
  "token": "ADMIN_SESSION_TOKEN"
}
```

**Response:**
```json
{
  "success": true,
  "action": "get_staff_list",
  "data": {
    "staff": [
      {
        "staffId": "STF_12345",
        "staffName": "Anil Sarmah",
        "role": "TEACHER",
        "mobile": "9876543210",
        "email": "anil@gamerihss.edu.in",
        "assignedClasses": ["9", "10"],
        "assignedSubjects": ["IT"],
        "status": "Active",
        "active": true,
        "passwordMode": "COMMON"
      }
    ],
    "total": 1
  }
}
```

---

### `POST` `action=register_staff`
Registers a new Teacher, Principal, or Admin staff account.
**Required Role:** `ADMIN` or `PRINCIPAL`

**Request:**
```json
{
  "action": "register_staff",
  "token": "ADMIN_SESSION_TOKEN",
  "staffName": "Pankaj Bora",
  "role": "TEACHER",
  "mobile": "9435123456",
  "email": "pankaj@gamerihss.edu.in",
  "assignedClasses": ["9", "10"],
  "assignedSubjects": ["IT/ITeS"]
}
```

---

### `POST` `action=update_staff`
Updates staff profile, roles, assigned classes, or subjects.
**Required Role:** `ADMIN` or `PRINCIPAL`

**Request:**
```json
{
  "action": "update_staff",
  "token": "ADMIN_SESSION_TOKEN",
  "staffId": "STF_12345",
  "assignedClasses": ["9", "10", "11"],
  "assignedSubjects": ["IT/ITeS"]
}
```

---

### `POST` `action=set_staff_status`
Activates or deactivates a staff member account.
**Required Role:** `ADMIN` or `PRINCIPAL`

**Request:**
```json
{
  "action": "set_staff_status",
  "token": "ADMIN_SESSION_TOKEN",
  "staffId": "STF_12345",
  "status": "Inactive"
}
```

---

### `POST` `action=auth_reset_user_password`
Resets a staff or parent user back to the Common School Password.
**Required Role:** `ADMIN` or `PRINCIPAL`

**Request:**
```json
{
  "action": "auth_reset_user_password",
  "token": "ADMIN_SESSION_TOKEN",
  "targetUserId": "STF_12345",
  "targetRole": "TEACHER"
}
```

---

## 4. Phase 5 — Staff Portal Endpoints

---

### `POST` `action=staff_dashboard`
Returns an aggregated KPI overview and operational dashboard payload.
**Required Role:** `TEACHER`, `PRINCIPAL`, or `ADMIN`

**Request:**
```json
{
  "action": "staff_dashboard",
  "token": "STAFF_SESSION_TOKEN"
}
```

**Response (Teacher):**
```json
{
  "success": true,
  "action": "staff_dashboard",
  "data": {
    "role": "TEACHER",
    "userId": "STF_12345",
    "teacherName": "Pankaj Bora",
    "assignedClasses": ["9", "10"],
    "assignedSubjects": ["IT/ITeS"],
    "today": "2026-08-29",
    "studentTotals": {
      "total": 45,
      "byClass": { "9": 25, "10": 20 }
    },
    "todayAttendance": {
      "present": 42,
      "totalStudents": 45,
      "percentage": 93,
      "pendingClasses": []
    },
    "recentNotices": [ ... ],
    "upcomingCalendar": [ ... ],
    "recentAssignments": [ ... ],
    "recentActivities": [ ... ],
    "alerts": []
  }
}
```

---

### `POST` `action=get_student_portfolio`
Returns an aggregated Student 360° profile including attendance streak, 4-exam marks history, assignments, activities, and achievements.
**Required Role:** `ADMIN`, `PRINCIPAL`, `TEACHER` (scoped to assigned class), `PARENT` (scoped to linked child), `STUDENT` (own record).

**Request:**
```json
{
  "action": "get_student_portfolio",
  "token": "SESSION_TOKEN",
  "studentId": "STU_101"
}
```

**Response (Success):**
```json
{
  "success": true,
  "action": "get_student_portfolio",
  "data": {
    "student": {
      "studentId": "STU_101",
      "studentName": "Rahul Borah",
      "rollNo": "1",
      "class": "9",
      "section": "A",
      "gender": "Male",
      "mobile": "9876543210",
      "status": "Active"
    },
    "attendanceSummary": {
      "totalWorkingDays": 40,
      "presentDays": 38,
      "absentDays": 2,
      "percentage": 95,
      "consecutiveAbsenceStreak": 0,
      "recentRecords": [ ... ]
    },
    "marks": [ ... ],
    "assignments": [ ... ],
    "activities": [ ... ],
    "achievements": [ ... ]
  }
}
```

**Security & Scoping:**
- If unauthorized (e.g. Teacher accessing unassigned class student, or Parent accessing unlinked student), returns:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Access forbidden: You are not authorized to view this student portfolio"
  }
}
```

---

### Teacher Scoped Mutations:
- `save_activities`: Teachers may only save activities for classes listed in `assignedClasses` (returns `403 UNAUTHORIZED` if class is not assigned).
- `save_assignments`: Teachers may only save assignments for classes listed in `assignedClasses` (returns `403 UNAUTHORIZED` if class is not assigned).
- `save_notices`: Teachers may only publish notices targeted to classes in `assignedClasses` (returns `403 UNAUTHORIZED` if class is unauthorized or untargeted).

---

## 5. Phase 6 — Student & Parent Portal APIs

### `POST` `action=student_dashboard`
Aggregated dashboard endpoint for the authenticated student. Identity is derived strictly from `session.userId`.
**Required Role:** `STUDENT` (or `TEACHER`/`PRINCIPAL`/`ADMIN`)

**Request:**
```json
{
  "action": "student_dashboard",
  "token": "STUDENT_SESSION_TOKEN"
}
```

**Response:**
```json
{
  "success": true,
  "action": "student_dashboard",
  "data": {
    "student": {
      "studentId": "STU_101",
      "studentName": "Rahul Borah",
      "rollNo": "1",
      "class": "9",
      "section": "A",
      "status": "Active"
    },
    "attendanceSummary": {
      "totalWorkingDays": 40,
      "presentDays": 38,
      "absentDays": 2,
      "percentage": 95,
      "consecutiveAbsenceStreak": 0,
      "recentRecords": [ ... ]
    },
    "marks": [ ... ],
    "notes": [ ... ],
    "activities": [ ... ],
    "assignments": [ ... ],
    "notices": [ ... ],
    "upcomingCalendar": [ ... ]
  }
}
```

---

### `POST` `action=parent_dashboard`
Aggregated dashboard endpoint for authenticated parent. Resolves all authorized children via `ParentStudentLinks`. Supports 1 or multiple children.
**Required Role:** `PARENT` (or `PRINCIPAL`/`ADMIN`)

**Request:**
```json
{
  "action": "parent_dashboard",
  "token": "PARENT_SESSION_TOKEN"
}
```

**Response:**
```json
{
  "success": true,
  "action": "parent_dashboard",
  "data": {
    "parent": {
      "parentId": "PAR_9876543210",
      "parentName": "Biren Borah",
      "mobile": "9876543210"
    },
    "children": [
      {
        "student": {
          "studentId": "STU_101",
          "studentName": "Rahul Borah",
          "class": "9",
          "section": "A",
          "rollNo": "1"
        },
        "attendanceSummary": { ... },
        "marks": [ ... ],
        "recentAssignments": [ ... ],
        "recentActivities": [ ... ],
        "recentNotices": [ ... ]
      }
    ],
    "upcomingCalendar": [ ... ]
  }
}
```

---

### `POST` `action=get_parent_children`
Retrieves list of all authorized children linked to authenticated parent.
**Required Role:** `PARENT` (or `PRINCIPAL`/`ADMIN`)

**Request:**
```json
{
  "action": "get_parent_children",
  "token": "PARENT_SESSION_TOKEN"
}
```

**Response:**
```json
{
  "success": true,
  "action": "get_parent_children",
  "data": {
    "children": [
      {
        "studentId": "STU_101",
        "studentName": "Rahul Borah",
        "rollNo": "1",
        "class": "9",
        "section": "A",
        "status": "Active"
      }
    ],
    "total": 1
  }
}
```

---

### `POST` `action=get_student_profile`
Retrieves sanitized student profile. For `STUDENT`, `studentId` is strictly `session.userId`. For `PARENT`, `studentId` must be in authorized children list.
**Required Role:** `STUDENT`, `PARENT`, `TEACHER`, `PRINCIPAL`, or `ADMIN`

**Request:**
```json
{
  "action": "get_student_profile",
  "token": "PORTAL_SESSION_TOKEN",
  "studentId": "STU_101"
}
```

**Response:**
```json
{
  "success": true,
  "action": "get_student_profile",
  "data": {
    "student": {
      "studentId": "STU_101",
      "studentName": "Rahul Borah",
      "rollNo": "1",
      "class": "9",
      "section": "A",
      "gender": "Male",
      "dob": "2010-05-15",
      "fatherName": "Biren Borah",
      "motherName": "Rina Borah",
      "village": "Gamiri",
      "mobile": "9876543210",
      "status": "Active"
    }
  }
}
```



