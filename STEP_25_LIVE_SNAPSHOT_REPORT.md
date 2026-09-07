# STEP 25 — LIVE PRODUCTION DATA SNAPSHOT REPORT
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Source Endpoint:** `https://script.google.com/macros/s/AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm/exec`  
**Snapshot File:** [`scratch/production_sheets_snapshot_2026-09-03T10-44-31-091Z.json`](file:///c:/Users/HP/Downloads/ITGHSS2/scratch/production_sheets_snapshot_2026-09-03T10-44-31-091Z.json)  
**Export Timestamp:** `2026-09-03T10:44:31.091Z` (16:14 IST)  
**Status:** **LIVE READ-ONLY SNAPSHOT ACQUIRED**  

---

## 1. Executive Summary

A real-time, non-destructive read-only extraction was executed against the authoritative production Google Apps Script backend using `sync_download` and entity-level APIs with Admin authorization.

---

## 2. Live Extraction Verification & Table Metrics

| Entity / Table Name | Live Extracted Rows | Verification Scope & Notes |
|---|---|---|
| **Students** | **102** | Full multi-class student directory (Class 9, 10, 11, 12) |
| **Attendance Records** | **5,275** | Historical & current academic daily attendance |
| **Attendance Sessions** | **200** | Derived from live session dates across sections |
| **Activities** | **492** | Vocational education and lab experiments |
| **Notices** | **3,160** | Complete school broadcast and parent notice history |
| **Staff Workforce** | **4** | Active teachers and administrative personnel |
| **Parents & Links** | **99 / 100** | Dynamically derived & linked via authoritative phone mapping |
| **Study Notes** | **1 (Multi-Unit)** | Full Class 9 IT/ITeS Unit 1 curriculum Q&A |
| **Examinations / Results**| **1 / 40** | Unit Test 1 examination baseline |
| **Documents** | **1** | Official Marksheet QR Document (`VRF_MS_001`) |
| **Calendar** | **1** | Teachers Day and official schedule events |

---

## 3. Data Integrity & Safety

- **Google Sheets Mutation:** **ZERO WRITES** (100% Read-Only extraction).
- **Google Sheets Uptime:** **100% UNTOUCHED & OPERATIONAL**.
- **Storage Strategy:** All media and documents maintain Google Drive URL references. Cloudflare R2 is NOT USED.
