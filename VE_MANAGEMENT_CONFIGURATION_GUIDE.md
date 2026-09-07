# VE MANAGEMENT — CONFIGURATION GUIDE (STEP 15)
**Institutional Entity:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Version:** 2.0  

---

## 1. Introduction

This guide provides technical specifications for managing configuration keys, institutional policies, and feature flags within the VE Management platform.

---

## 2. Configuration Domains & Technical Rules

### 2.1 Domain: `SCHOOL_PROFILE`
- **`SCHOOL_NAME`**: Displayed on marksheets, certificates, notices, and portal headers.
- **`SCHOOL_ID`**: Protected immutable identifier (`GAMERI-HSS-001`). Cannot be changed.
- **`SCHOOL_CODE`**: State educational board identifier (`GHSS-001`).

### 2.2 Domain: `BRANDING`
- **`DOCUMENT_HEADER`**: Official printed header for certificates and marksheets.
- **`DOCUMENT_FOOTER`**: Official institutional signature footer text.
- **`LOGO_URL`** & **`SEAL_URL`**: High-resolution image assets for documents. Currently set to `DEVELOPMENT_PLACEHOLDER` pending physical crest upload.

### 2.3 Domain: `ACADEMIC`
- **`ACADEMIC_YEAR`**: The active school academic session. Directly synced with `AcademicYears.isCurrent`.
- **`YEAR_FORMAT`**: Display string format (`YYYY-YYYY`).

### 2.4 Domain: `ATTENDANCE`
- **`ATTENDANCE_ALERT_THRESHOLD`**: Threshold percentage for triggering low attendance notifications (Default: 75%).
- **`ATTENDANCE_POLICY_STATUS`**: `CONFIGURED — NOT LIVE` (`REQUIRES INSTITUTIONAL APPROVAL`).

### 2.5 Domain: `GRADING` & `EXAMINATION`
- **`GRADING_POLICY`**: Configurable JSON array defining grade codes, minimum/maximum percentage bounds, and grade points.
- **Validation Constraints**: Overlapping bands, gaps, and invalid percentage ranges are strictly rejected by the backend validator.
- **Status**: `CONFIGURED — NOT LIVE` (`REQUIRES INSTITUTIONAL APPROVAL`).

### 2.6 Domain: `DOCUMENTS` & `SIGNATORIES`
- **`DOCUMENT_NUMBER_PREFIX`**: Prefix for generated serial numbers (Default: `GHSS`).
- **`DOCUMENT_NUMBER_FORMAT`**: Template pattern `{PREFIX}/{YEAR}/{TYPE}/{SEQUENCE}`.
- **`DEFAULT_SIGNATORY_TITLE`**: Official designation (Default: `Principal`, Status: `REQUIRES INSTITUTIONAL APPROVAL`).

### 2.7 Domain: `SECURITY` & `BACKUP`
- **`SESSION_TIMEOUT_DAYS`**: Max duration for signed HMAC-SHA256 session tokens.
- **`MAX_LOGIN_ATTEMPTS`**: Brute-force threshold (5 attempts / 15-minute window).
- **`BACKUP_ENABLED`**: Automated full snapshot generation flag.
