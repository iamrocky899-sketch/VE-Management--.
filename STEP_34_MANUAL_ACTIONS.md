# STEP 34: MANUAL ACTIONS & PILOT EXECUTION RUNBOOK

**Institution:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Evaluation Status:** READY FOR HUMAN SUPERVISION  
**Mandatory Restraint:** DO NOT DISTRIBUTE TO WIDER STAFF UNTIL CONTROLLED PILOT IS SIGNED OFF  

---

## 1. Safety Guardrails & Prohibitions

> [!WARNING]
> **ABSOLUTE OPERATIONAL CONSTRAINTS:**
> - **DO NOT** sign a production release APK with the production release keystore until the controlled pilot is validated.
> - **DO NOT** distribute the APK file via WhatsApp, Drive, or Telegram to general teaching staff.
> - **DO NOT** disable or delete the Google Apps Script deployment (`AKfycbyNsz3P6vJcQi5TNGFItptiDxG6bX-yaw-lIlPpOVq-tFCuBcDEC2EBVAHPVq-DQVMm`).
> - **DO NOT** modify the canonical 2,680 attendance records or 200 attendance sessions in Cloudflare D1.

---

## 2. Action Item 1: Physical Handset Test (Single Device)

When a physical Android phone is available for testing:
1. Enable **Developer Options** and **USB Debugging** on the handset.
2. Connect the phone via USB to the workstation.
3. Verify connection by running:
   ```bash
   adb devices
   ```
4. Install the compiled debug APK:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```
5. Launch the app **IT GHSS** and log in with Teacher credentials:
   - **Mobile:** `9101004032`
   - **Password:** `12345`
6. Verify student roster loads for Classes 9, 10, 11, 12.
7. Disconnect Wi-Fi and mobile data (Airplane Mode).
8. Record test attendance for Class 9 GP and save locally.
9. Re-enable Wi-Fi / data and tap **Sync Now**.
10. Verify on the Firebase Staff Portal (`https://ghss-75f48.web.app`) that attendance has updated.

---

## 3. Action Item 2: Controlled Pilot with Rakibul Islam

Once Action Item 1 passes:
1. Provide the debug APK exclusively to Vocational Teacher Rakibul Islam.
2. Supervise daily attendance recording for 1 full school day.
3. Check Cloudflare D1 transaction logs periodically using:
   ```bash
   npx wrangler d1 execute ve-management-db-prod --remote --command="SELECT * FROM sync_metadata ORDER BY processed_at DESC LIMIT 5" --config cloudflare/wrangler.toml
   ```
4. Ensure zero error notices or duplicate discrepancies occur.

---

## 4. Action Item 3: Release Signing (Post-Pilot Sign-off Only)

When the controlled pilot is officially approved by the School Principal / IT Administrator:
1. Generate the signed release bundle:
   ```bash
   ./gradlew assembleRelease
   ```
2. Distribute the signed release APK to authorized vocational teaching staff.
3. Maintain Google Apps Script standby for 14 days following full migration.
