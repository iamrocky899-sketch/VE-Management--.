# STEP 23 — PRODUCTION DOMAIN & DNS ROUTING PLAN
**Project:** VE Management System  
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Status:** **ACTIVE SPECIFICATION (NO DNS CHANGES EXECUTED)**

---

## 1. Production DNS Mapping Architecture

```
Current Production (Active):
  staff.gameri-hss.edu.in  ──► Firebase Hosting (Calls Apps Script Web App URL)
  parent.gameri-hss.edu.in ──► Firebase Hosting (Calls Apps Script Web App URL)

Future Production (Post-Cutover):
  api.gameri-hss.edu.in    ──► Cloudflare Worker (ve-management-api)
  staff.gameri-hss.edu.in  ──► Firebase Hosting (Calls api.gameri-hss.edu.in)
  parent.gameri-hss.edu.in ──► Firebase Hosting (Calls api.gameri-hss.edu.in)
```

---

## 2. TTL Strategy & Rollback DNS
- **Pre-Cutover TTL:** Set DNS TTL to **$300\text{ seconds (5 minutes)}$** 24 hours prior to cutover.
- **Rollback DNS:** In case of emergency, DNS or frontend bundle config can be reverted to Apps Script in $< 5\text{ minutes}$.
