# VE MANAGEMENT — Production Configuration Standard
**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Academic Session:** 2026–27  
**Environment:** Production Release Candidate `v5.7-RC1`

---

## 1. Institutional Context & Identity
* **School Name:** `Gameri Higher Secondary School, Gamiri`
* **School ID:** `GAMERI-HSS-001`
* **Academic Session:** `2026-27`
* **Board / Affiliation:** Assam State School Education Board (ASSEB)

---

## 2. Cloud Backend & Apps Script Configuration
* **Gateway Type:** Google Apps Script Web App HTTPS Gateway (`script.google.com`)
* **Transport Encryption:** 100% Strict HTTPS (TLS 1.3)
* **Script Properties Required:**
  * `SPREADSHEET_ID`: `[CONFIGURED SECURELY — VALUE OMITTED]`
  * `SERVER_SECRET`: `[CONFIGURED SECURELY — VALUE OMITTED]`
  * `ADMIN_API_KEY`: `[CONFIGURED SECURELY — VALUE OMITTED]`
  * `ACADEMIC_SESSION`: `2026-27`
  * `DEFAULT_SCHOOL_ID`: `GAMERI-HSS-001`

---

## 3. Client & Portal Endpoints
* **Parent & Student Portal:** Single-origin web application with hashless routing.
* **Staff Portal:** Multi-role staff single-page application.
* **Android Admin Client:** Native Kotlin container accessing HTTPS Cloud Sync via `sync_manager.js`.

---

## 4. Security & Cryptographic Settings
* **Password Hashing:** SHA-256 with 16-character unique salt.
* **Session Token:** HMAC-SHA256 signature containing `userId|role|schoolId|identifier|expiresAt`.
* **Session TTL:** 30 Days from authentication timestamp.
* **Brute-Force Protection:** 15-minute rate-limit window per identifier.

---

## 5. Offline Sync Parameters
* **Micro-Debounce Window:** `1500ms`
* **Sync Queue Storage:** `itd3_sync_queue` (LocalStorage / SQLite)
* **Retry Policy:** Exponential backoff (`2s`, `4s`, `8s`, `16s`, `32s`, max `60s`)
* **Maximum Batch Size:** 50 records per sync payload.
