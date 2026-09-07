# STEP 22 — BUSINESS RULE & INVARIANT PARITY REPORT
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **100% INVARIANT COMPLIANCE (ZERO REGRESSION)**

---

## 1. Core Institutional Invariants Scorecard

| Institutional Invariant | Specification & Baseline | Measured Execution | Evaluation |
|---|---|---|---|
| **Attendance Roster Stability** | Enrolled Class 9A roster has $40$ students; marking attendance (partial or full) must never shrink roster count ($40 \rightarrow 40$) | 40 students before $\rightarrow$ 40 students after attendance | **100% PRESERVED** |
| **Notes Hierarchy** | Notes strictly class-wise: `Class -> Subject -> Unit -> Q&A + R2 PDF key` (never student-centric) | Notes scoped to Class 9 IT; PDF attached via R2 key | **100% PRESERVED** |
| **Assamese Unicode** | Exact byte-level UTF-8 preservation for `ৰাহুল বৰা (Rahul Bora)` across Auth, DB, and API | Exact character string match | **100% PRESERVED** |
| **Certificate Level Mapping** | Class 9 = Level 1, Class 10 = Level 2, Class 11 = Level 3, Class 12 = Level 4 | Verified across Academic & Document APIs | **100% PRESERVED** |
| **Document Immutability** | Issued document (`STATUS: ISSUED`) cannot be edited in place without new revision | Verification ID `VRF_MS_001` intact | **100% PRESERVED** |
| **Highlighted Notice Priority** | Notices with `is_highlighted: 1` pinned at top of feed with ⭐ badge | Top item has `is_highlighted: 1` | **100% PRESERVED** |
| **Multi-Child Privacy** | Parent `PAR_01` accesses only linked children (`STU_9A_01`, `STU_9A_02`); unlinked `STU_9A_03` denied | 403 Forbidden on unlinked child | **100% PRESERVED** |
| **Teacher Academic Scope** | Teacher `TCH_01` accesses assigned classes (9, 10); unassigned Class 12 denied | 403 Forbidden on unassigned class | **100% PRESERVED** |
