# VE MANAGEMENT — ADMINISTRATOR SETTINGS GUIDE (STEP 15)
**Institutional Entity:** Gameri Higher Secondary School, Gamiri (`GAMERI-HSS-001`)  
**Audience:** Head of Institution (`Principal`), System Administrators, Vocational IT Faculty  

---

## 1. Administrative Workflows

### 1.1 Updating School Profile
1. Log in to the Staff Portal as `Principal` or `Admin`.
2. Navigate to **Settings** from the sidebar navigation menu.
3. Select the **School Profile** tab.
4. Update institutional details (Address, District, Email, Phone).
5. Click **Save Profile**. All updates are automatically audited in `AuditLogs`.

### 1.2 Managing Academic Defaults
1. In the **Academic & Sessions** tab, view the active academic year (`2026-2027`).
2. To transition to a new academic year, use the **Academic Years** management module (`/academic-years`), which coordinates data rollover and updates the active session atomically.

### 1.3 Reviewing Institutional Policies Pending Approval
The following policies are pre-configured in the platform but remain in status `CONFIGURED — NOT LIVE` awaiting formal adoption by the School Managing Committee:
1. **Attendance Alert Threshold (75%)**: Defines automated SMS/WhatsApp alerts for attendance deficits.
2. **Provisional 8-Band Grading Scale (`A+` to `E`)**: Requires state board / institutional policy sign-off before official publication.
3. **Merit Ranking Publication**: Disabled by default to protect student privacy until explicit approval is granted.
4. **Public QR Document Verification**: Configured for `https://ve-management.org/verify` but requires custom domain SSL deployment.

---

## 2. Policy Activation Confirmation Invariant

Whenever an administrative user attempts to activate or modify high-impact institutional policies:
- The system presents an explicit confirmation dialog showing the affected scope and effective date.
- The backend validates all inputs server-side.
- Changes are immutably logged with the actor's ID and timestamp.
