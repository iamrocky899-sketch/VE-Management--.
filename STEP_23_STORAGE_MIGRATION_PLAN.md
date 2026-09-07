# STEP 23 — BINARY STORAGE MIGRATION PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Storage Provider:** **GOOGLE DRIVE (CLOUDFLARE R2 REJECTED)**  
**Status:** **ACTIVE MIGRATION PLAN**

---

## 1. Storage Migration Strategy

1. **Zero Cloudflare R2 Dependency:**
   - Cloudflare R2 is excluded from all build steps, Wrangler configurations, and runtime bindings.
   - User does NOT need to add payment methods or activate R2 in Cloudflare dashboard.
2. **Existing Google Drive Data Continuity:**
   - Existing student photos, branding assets, and notes PDFs on Google Drive remain in place.
   - D1 stores the Google Drive file URL and `drive_file_id`.
3. **Data Integrity Check:**
   - Document verification and marksheets dynamically link to Drive URLs without breaking QR codes or verification endpoints.
