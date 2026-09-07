# STEP 23 — GOOGLE DRIVE PRODUCTION STORAGE PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Storage Provider:** **GOOGLE DRIVE (NO CLOUDFLARE R2)**  
**Status:** **ACTIVE SPECIFICATION**

---

## 1. Storage Architecture Overview

```
[ FRONTEND / ANDROID CLIENTS ]
             │
             │ HTTPS API Calls (JSON payloads, Auth JWTs)
             ▼
[ CLOUDFLARE WORKERS (ve-management-api) ]
             │                                   │
             │ Relational Metadata & URLs        │ Binary Operations & Sync
             ▼                                   ▼
[ CLOUDFLARE D1 (ve-management-db-prod) ]    [ GOOGLE DRIVE INFRASTRUCTURE ]
  - drive_file_id                             - /Schools/GAMERI-HSS-001/branding/
  - storage_provider = 'GOOGLE_DRIVE'         - /Schools/GAMERI-HSS-001/students/
  - file_name, mime_type, size_bytes          - /Schools/GAMERI-HSS-001/notes/
  - url, verification_id                      - /Schools/GAMERI-HSS-001/documents/
```

---

## 2. Logical Google Drive Directory Hierarchy

```
Gameri HSS Drive Root/
└── GAMERI-HSS-001/
    ├── branding/
    │   ├── crest.png
    │   ├── principal_signature.png
    │   └── teacher_signature.png
    ├── students/
    │   └── {student_id}/
    │       └── photo.jpg
    ├── notes/
    │   └── {academic_year}/
    │       └── {class}/
    │           └── {subject}/
    │               ├── main_notes.pdf
    │               └── units/{unit_id}.pdf
    └── documents/
        └── {academic_year}/
            └── {document_type}/
                └── {verification_id}.pdf
```

---

## 3. Cloudflare D1 Storage Metadata Schema

D1 stores lightweight metadata and Google Drive file references:

```sql
-- Example metadata columns in D1
ALTER TABLE notes ADD COLUMN storage_provider TEXT DEFAULT 'GOOGLE_DRIVE';
ALTER TABLE notes ADD COLUMN drive_file_id TEXT;
ALTER TABLE documents ADD COLUMN storage_provider TEXT DEFAULT 'GOOGLE_DRIVE';
ALTER TABLE documents ADD COLUMN drive_file_id TEXT;
```
