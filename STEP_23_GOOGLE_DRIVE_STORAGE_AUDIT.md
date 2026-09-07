# STEP 23 — GOOGLE DRIVE STORAGE ARCHITECTURE AUDIT
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Storage Architecture Decision:** **GOOGLE DRIVE (CLOUDFLARE R2 REJECTED / NOT USED)**  
**Status:** **AUTHORITATIVE STORAGE AUDIT**

---

## 1. Executive Summary

This audit catalogs all file, binary, and document storage mechanisms across the VE Management codebase to establish Google Drive as the permanent, single storage authority for binary objects in the future Cloudflare Worker + D1 architecture.

### Key Decisions:
- **Cloudflare Workers:** API Gateway and Edge compute.
- **Cloudflare D1 (`ve-management-db-prod`):** Relational database storing file metadata, Drive File IDs, and URLs.
- **Google Drive:** Dedicated storage for all binary assets (PDFs, photos, crest, signatures, backups).
- **Cloudflare R2:** **REJECTED / NOT USED**. No R2 bucket, subscription, or payment method is required.

---

## 2. Existing File Types & Storage Invariants

| Category | Description | Existing Apps Script / Client Storage | Proposed D1 Metadata Fields |
|---|---|---|---|
| **Student Photos** | Profile pictures for enrolled students | `Students.photoUrl` (base64 DataURL or Drive URL) | `photo_url`, `drive_file_id`, `storage_provider='GOOGLE_DRIVE'` |
| **School Branding** | Official Crest, Seal, and Signatures | `Settings` keys (`LOGO_URL`, `SEAL_URL`, `PRINCIPAL_SIGNATURE_URL`, `TEACHER_SIGNATURE_URL`) | `value` (Drive/CDN URL) in `settings` table |
| **Notes & Materials** | Class-wise subject PDF study materials | `Notes.attachmentUrl`, `NoteUnits.attachmentUrl` | `attachment_url`, `drive_file_id`, `storage_provider='GOOGLE_DRIVE'` |
| **Official Documents**| Generated Marksheets, Certificates, Reports | `Documents.fileReference`, `Documents.url` | `file_reference`, `url`, `drive_file_id`, `verification_id` |
| **Android Backups** | Local device offline-sync cloud backups | Google Drive `appDataFolder` (`itghss_backup.json`) | Managed via native Google Sign-In in Android app |

---

## 3. Notes Storage Invariant (Non-Negotiable)

```
Class (e.g. 9)
  └── Subject (e.g. IT/ITeS)
        └── Unit (e.g. Unit 1: Digital Documentation)
              ├── Q&A Questions
              └── PDF / Drive Attachment (Google Drive Reference)
```

> [!IMPORTANT]
> **Notes MUST ALWAYS remain Class-wise.** Notes are never student-centric.

---

## 4. Security & Access Control Model

- **Private Files:** Student photos, signatures, and unissued documents are protected by server-side RBAC.
- **Public / Verified Files:** Document QR verification (`verify_document`) returns sanitized verification metadata without exposing raw private Drive links or student PII.
- **Zero Secret Exposure:** Google service account keys or OAuth tokens are never exposed to the frontend, Android APK, or GitHub repository.
