# STEP 18 — CLOUDFLARE R2 BINARY & OBJECT STORAGE PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **READY FOR MIGRATION**

---

## 1. Storage Partitioning Principle (D1 vs. R2)

> [!IMPORTANT]
> **INVIOLABLE STORAGE RULE:**
> - **Cloudflare D1** stores structured relational data, text columns, foreign keys, numeric metrics, timestamps, and R2 object keys.
> - **Cloudflare R2** stores binary objects (PDF files, profile images, institutional crests, signature PNGs).
> - Binary BLOBs are **NEVER** stored directly in D1 table rows.

---

## 2. R2 Object Key Namespace Hierarchy

All binary objects are organized under an immutable school-tenancy prefix (`schools/GAMERI-HSS-001/`):

```
ve-management-storage/
└── schools/
    └── GAMERI-HSS-001/
        ├── branding/
        │   ├── logo.png
        │   ├── crest.png
        │   ├── seal.png
        │   ├── principal_signature.png
        │   └── teacher_signature.png
        ├── students/
        │   └── {studentId}/
        │       └── photo.jpg
        ├── notes/
        │   └── {academicYear}/
        │       └── {class}/
        │           └── {subject}/
        │               ├── main_notes.pdf
        │               └── units/
        │                   └── unit_{unitNumber}.pdf
        ├── documents/
        │   └── {academicYear}/
        │       └── {documentType}/
        │           └── {documentNumber}.pdf
        └── practicals/
            └── {class}/
                └── {subject}/
                    └── exp_{displayOrder}.pdf
```

---

## 3. Access Scoping & Security Rules

| Object Category | Access Mode | Authorization Rule | Direct Public CDN? |
|---|---|---|---|
| **School Logo / Crest** | Public Read | Cacheable across web portals and marksheets | **YES** (`/public/branding/*`) |
| **Official Signatures** | Worker-Mediated | Accessible **only** during authenticated server-side document rendering | **NO** (Strictly Private) |
| **Student Profile Photos** | Scoped Read | Student (Self), Linked Parent, Class Teacher, Admin | **NO** (Pre-signed / Token Header) |
| **Class Notes PDFs** | Scoped Public | Students & Teachers enrolled in targeted Class | **YES** (Class Scoped) |
| **Issued Academic PDFs** | Signed / Verified | Student (Self), Parent (Self), Public QR Verification Endpoint | **Worker-Mediated** |
