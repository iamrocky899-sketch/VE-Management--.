# VE MANAGEMENT — CONFIGURATION AUDIT & INVENTORY (STEP 15)
**Institutional Entity:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Audit Date:** September 2, 2026  
**Status:** COMPLETE & CONSOLIDATED  

---

## 1. Executive Summary

This document establishes the authoritative inventory of all institutional settings, operational constants, and policy parameters in the VE Management platform for Gameri Higher Secondary School (`GAMERI-HSS-001`). It consolidates scattered settings into a centralized, validated, and role-protected configuration engine (`SettingsApi.gs` & `Settings.jsx`).

---

## 2. Configuration Inventory Matrix Across Domains

| Configuration Domain | Key / Setting Name | Value / Format | Default | Status | RBAC / Authority |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **1. SCHOOL_PROFILE** | `SCHOOL_NAME` | String | `Gameri Higher Secondary School, Gamiri` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **1. SCHOOL_PROFILE** | `SCHOOL_SHORT_NAME` | String | `Gameri HSS` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **1. SCHOOL_PROFILE** | `SCHOOL_CODE` | String | `GHSS-001` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **1. SCHOOL_PROFILE** | `SCHOOL_ID` | String | `GAMERI-HSS-001` | `VERIFIED` | `IMMUTABLE` |
| **1. SCHOOL_PROFILE** | `SCHOOL_ADDRESS` | String | `Gamiri, P.O. Gamiri` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **1. SCHOOL_PROFILE** | `SCHOOL_DISTRICT` | String | `Biswanath` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **1. SCHOOL_PROFILE** | `SCHOOL_STATE` | String | `Assam` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **1. SCHOOL_PROFILE** | `SCHOOL_PINCODE` | String | `784172` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **1. SCHOOL_PROFILE** | `SCHOOL_PHONE` | String | `+91-9876543210` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **1. SCHOOL_PROFILE** | `SCHOOL_EMAIL` | String | `gameri.hss@assam.gov.in` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **1. SCHOOL_PROFILE** | `SCHOOL_WEBSITE` | String | `https://gamerihss.assam.gov.in` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **2. BRANDING** | `LOGO_URL` | URL / String | `DEVELOPMENT_PLACEHOLDER` | `DEVELOPMENT PLACEHOLDER` | `ADMIN`, `PRINCIPAL` |
| **2. BRANDING** | `SEAL_URL` | URL / String | `DEVELOPMENT_PLACEHOLDER` | `DEVELOPMENT PLACEHOLDER` | `ADMIN`, `PRINCIPAL` |
| **2. BRANDING** | `DOCUMENT_HEADER` | String | `GAMERI HIGHER SECONDARY SCHOOL, GAMIRI` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **2. BRANDING** | `DOCUMENT_FOOTER` | String | `GAMIRI, BISWANATH, ASSAM - 784172` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **3. ACADEMIC** | `ACADEMIC_YEAR` | String | `2026-2027` | `VERIFIED` | Synced with `AcademicYears.isCurrent` |
| **3. ACADEMIC** | `DEFAULT_CLASS` | String | `10` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **3. ACADEMIC** | `DEFAULT_SECTION` | String | `A` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **3. ACADEMIC** | `YEAR_FORMAT` | String | `YYYY-YYYY` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **4. ATTENDANCE** | `ATTENDANCE_ALERT_THRESHOLD` | Number (%) | `75` | `CONFIGURED — NOT LIVE` | `REQUIRES INSTITUTIONAL APPROVAL` |
| **4. ATTENDANCE** | `LATE_COUNTS_AS_PRESENT` | Boolean | `true` | `VERIFIED` | `(Present + Late) / Total * 100` |
| **4. ATTENDANCE** | `LEAVE_REQUIRES_REASON` | Boolean | `true` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **4. ATTENDANCE** | `ATTENDANCE_POLICY_STATUS` | Enum | `CONFIGURED — NOT LIVE` | `CONFIGURED — NOT LIVE` | `REQUIRES INSTITUTIONAL APPROVAL` |
| **5. GRADING** | `GRADING_POLICY` | JSON Array (Bands) | 8-Band Scale (`A+` to `E`) | `CONFIGURED — NOT LIVE` | `REQUIRES INSTITUTIONAL APPROVAL` |
| **5. GRADING** | `PASS_SUBJECT_MINIMUM` | Number (%) | `30` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **5. GRADING** | `OVERALL_PASS_RULE` | String | `ALL_SUBJECTS_PASS` | `CONFIGURED — NOT LIVE` | `REQUIRES INSTITUTIONAL APPROVAL` |
| **5. GRADING** | `GRADING_POLICY_STATUS` | Enum | `CONFIGURED — NOT LIVE` | `CONFIGURED — NOT LIVE` | `REQUIRES INSTITUTIONAL APPROVAL` |
| **6. RANKING** | `RANKING_ENABLED` | Boolean | `false` | `CONFIGURED — NOT LIVE` | `REQUIRES INSTITUTIONAL APPROVAL` |
| **6. RANKING** | `RANKING_SCOPE` | Enum | `CLASS` | `CONFIGURED — NOT LIVE` | `REQUIRES INSTITUTIONAL APPROVAL` |
| **7. DOCUMENTS** | `DOCUMENT_NUMBER_PREFIX` | String | `GHSS` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **7. DOCUMENTS** | `DOCUMENT_NUMBER_FORMAT` | String | `{PREFIX}/{YEAR}/{TYPE}/{SEQUENCE}` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **7. DOCUMENTS** | `SEQUENCE_PADDING` | Number | `4` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **8. SIGNATORIES** | `DEFAULT_SIGNATORY_TITLE` | String | `Principal` | `REQUIRES INSTITUTIONAL APPROVAL` | `ADMIN`, `PRINCIPAL` |
| **8. SIGNATORIES** | `DEFAULT_SIGNATORY_NAME` | String | `Dr. B. K. Sarmah` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **9. VERIFICATION** | `VERIFICATION_BASE_URL` | URL | `https://ve-management.org/verify` | `CONFIGURED — NOT LIVE` | `ADMIN` Only |
| **10. NOTIFICATIONS**| `IN_APP_NOTIFICATIONS_ENABLED`| Boolean | `true` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **10. NOTIFICATIONS**| `ANDROID_NOTIFICATIONS_ENABLED`| Boolean | `true` | `VERIFIED` | `ADMIN`, `PRINCIPAL` |
| **10. NOTIFICATIONS**| `WHATSAPP_NOTIFICATIONS_ENABLED`| Boolean | `false` | `CONFIGURED — NOT LIVE` | Gateway setup pending |
| **11. SECURITY** | `SESSION_TIMEOUT_DAYS` | Number (Days) | `30` | `VERIFIED` | `ADMIN` Only |
| **11. SECURITY** | `MAX_LOGIN_ATTEMPTS` | Number | `5` | `VERIFIED` | `ADMIN` Only |
| **11. SECURITY** | `LOCKOUT_WINDOW_MINUTES` | Number (Min) | `15` | `VERIFIED` | `ADMIN` Only |
| **12. AUDIT** | `AUDIT_RETENTION_DAYS` | Number (Days) | `365` | `REQUIRES INSTITUTIONAL APPROVAL` | `ADMIN` Only |
| **13. BACKUP** | `BACKUP_ENABLED` | Boolean | `true` | `VERIFIED` | `ADMIN` Only |
| **13. BACKUP** | `BACKUP_FREQUENCY` | Enum | `WEEKLY` | `VERIFIED` | `ADMIN` Only |
| **14. DISASTER_RECOVERY**| `DISASTER_RECOVERY_RPO_HOURS`| Number | `24` | `REQUIRES INSTITUTIONAL APPROVAL` | `ADMIN` Only |
| **14. DISASTER_RECOVERY**| `DISASTER_RECOVERY_RTO_HOURS`| Number | `2` | `REQUIRES INSTITUTIONAL APPROVAL` | `ADMIN` Only |
| **15. FEATURE_FLAGS**| `FEATURE_ATTENDANCE_V2` | Boolean | `true` | `ACTIVE` | `ADMIN` Only |
| **15. FEATURE_FLAGS**| `FEATURE_EXAM_V2` | Boolean | `true` | `ACTIVE` | `ADMIN` Only |
| **15. FEATURE_FLAGS**| `FEATURE_DOCUMENTS_V2` | Boolean | `true` | `ACTIVE` | `ADMIN` Only |
| **15. FEATURE_FLAGS**| `FEATURE_COMMUNICATION_V2` | Boolean | `true` | `ACTIVE` | `ADMIN` Only |
| **15. FEATURE_FLAGS**| `FEATURE_REPORTS_V2` | Boolean | `true` | `ACTIVE` | `ADMIN` Only |
| **15. FEATURE_FLAGS**| `FEATURE_SECURITY_V2` | Boolean | `true` | `ACTIVE` | `ADMIN` Only |

---

## 3. Policy & Immutability Rules

1. **School ID Immutability:** `SCHOOL_ID: GAMERI-HSS-001` cannot be modified via API or UI as it serves as the core tenancy isolation key.
2. **Notes Invariant Preserved:** The structure of Notes remains strictly:
   $$\text{Class} \longrightarrow \text{Subject} \longrightarrow \text{Unit} \longrightarrow \text{Q\&A}$$
3. **No Retroactive Recalculation:** Changing grading scale or pass rules never recalculates existing published exam results (`ExamResults`) or issued marksheet documents (`OfficialDocuments`).
