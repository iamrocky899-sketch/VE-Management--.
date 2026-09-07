# VE MANAGEMENT — Post-Release Smoke Test Plan
**Release Candidate:** `v5.7-RC1`  
**Target:** Live Production Verification  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)

---

## Post-Release Verification Checklist

| # | User Journey / Component | Verification Step | Expected Behavior | Verification |
|---|---|---|---|---|
| 1 | **Admin Login** | Log in via Android Admin app | Dashboard loads with total student/staff counters | [ ] PASS |
| 2 | **Cloud Sync** | Tap "Sync Now" on Admin client | Indicator transitions ⚡ SYNCING -> ✓ SYNCED | [ ] PASS |
| 3 | **Staff Portal Login** | Log in with Teacher credentials | Assigned classes and subjects load | [ ] PASS |
| 4 | **Teacher Attendance** | View attendance register for Class 9/10 | Daily register renders student list | [ ] PASS |
| 5 | **Teacher Marks** | View assessment entry for vocational subject | Evaluation grid renders marks accurately | [ ] PASS |
| 6 | **Principal Oversight** | Log in with Principal credentials | Whole-school roster and circular publisher active | [ ] PASS |
| 7 | **Student Login** | Log in with Student ID / DOB | Student Dashboard renders own profile & attendance | [ ] PASS |
| 8 | **Parent Login** | Log in with registered Parent mobile | Linked children selector renders with verified child | [ ] PASS |
| 9 | **Notices & Circulars** | View school notice board across portals | Published announcements render with priority flags | [ ] PASS |
| 10 | **Academic Calendar** | View ASSEB Academic Calendar 2026–27 | 254 working days and holidays display accurately | [ ] PASS |
| 11 | **Session Termination** | Click Logout on each portal | Session token purged; redirect to login form | [ ] PASS |
