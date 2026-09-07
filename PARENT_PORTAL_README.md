# VE Management — Parent Portal Web Application

**School:** Gameri Higher Secondary School, Gamiri (Assam)  
**Target Audience:** Parents & Legal Guardians Only  
**Application Architecture:** Lightweight Mobile-First React + Vite Static Web App  
**Cloud Backend:** Google Apps Script Web App API (`v1.2`) + Google Sheets Database  
**Phase Status:** Phase 15 Verified, Built & Ready for Static Deployment (165/165 Automated Tests Passed)  

---

## 1. Project Overview

The **VE Management Parent Portal** is a dedicated, secure, read-only web application designed for parents and legal guardians of students enrolled at **Gameri Higher Secondary School, Gamiri**. 

Parents can monitor real-time school records without requiring an Android device, including:
- **Daily Attendance & Monthly Calendar** (Official ASSEB 2026–27 Academic Calendar)
- **Academic Performance & Marks** (4-Exam structure: Unit Test 1, Half Yearly, Unit Test 2, Final Exam)
- **Classroom & Vocational Activities** (Computer practicals, workshops, guest lectures)
- **Official Notices & Circulars** (Announcements from Principal Sanjiv Gogoi and Administration)
- **Official School & Teacher Contact Directory** (Direct WhatsApp, Phone, and Email shortcuts)

---

## 2. Technology Stack

- **Framework:** React 18 + Vite
- **Icons:** `lucide-react`
- **Styling:** Vanilla Modern CSS with Glassmorphism, soft pastel visual language, responsive mobile bottom navigation & desktop top navigation.
- **Languages:** Bilingual (English + Assamese `অসমীয়া`), with persistent locale toggle.
- **Hosting Target:** Free static hosting (GitHub Pages, Cloudflare Pages, Netlify, Vercel). No persistent Node server or paid cloud backend required.

---

## 3. Security & Zero-Trust Authorization Model

1. **Authentication:**
   - Parent Mobile Number + Common Password.
   - Handled server-side by `ParentApi.login()` in Google Apps Script.
   - Generates an HMAC-SHA256 signed session token (30-day validity).
   - Never exposes passwords, hashes, `ADMIN_API_KEY`, or `SERVER_SECRET` to the client.

2. **Parent → Child Authorization:**
   - Server-side zero-trust isolation enforced via the `ParentStudents` sheet.
   - Parents can **only** retrieve data for students explicitly linked to their verified mobile number.
   - Direct `studentId` manipulation in API calls or URL parameters is strictly rejected with `401/403 UNAUTHORIZED`.

3. **Multi-Child Support:**
   - If a parent has multiple children enrolled (e.g. Rahul in Class 9 and Priya in Class 11), a multi-child switcher card allows instant switching.
   - Single-child parents are taken directly to their child's dashboard without unnecessary clicks.

---

## 4. Local Development & Build

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# Navigate to the project directory
cd C:\Users\HP\Downloads\VE-Management-Parent

# Install dependencies
npm install

# Start local development server (port 3000)
npm run dev
```

### Production Static Build
```bash
npm run build
```
Output static assets are generated in `dist/` (~63 kB gzipped).

---

## 5. Directory Structure

```
VE-Management-Parent/
├── dist/                      # Production static output
├── node_modules/              # Dependencies
├── public/                    # Static assets & icons
├── src/
│   ├── components/
│   │   ├── AttendanceCalendar.jsx  # Monthly calendar with ASSEB chips
│   │   ├── BottomNav.jsx           # Mobile bottom navigation bar
│   │   ├── ChildSelector.jsx       # Multi-child switching card
│   │   └── Navbar.jsx              # Brand header & desktop tabs
│   ├── pages/
│   │   ├── ActivitiesPage.jsx      # Class activities & workshops
│   │   ├── AttendancePage.jsx      # Detailed attendance metrics & calendar
│   │   ├── CalendarPage.jsx        # Official ASSEB academic calendar
│   │   ├── ContactPage.jsx         # School, Principal & Teacher directory
│   │   ├── DashboardPage.jsx       # Summary dashboard & quick actions
│   │   ├── LoginPage.jsx           # Parent login form
│   │   ├── MarksPage.jsx           # 4-Exam marks & subject breakdown
│   │   ├── NoticesPage.jsx         # Official school circulars
│   │   └── ProfilePage.jsx         # Student details & password change
│   ├── services/
│   │   └── api.js                  # Centralized Google Apps Script API client
│   ├── state/
│   │   └── AuthContext.jsx         # Authentication & child context state
│   ├── styles/                     # CSS & tokens
│   ├── utils/
│   │   └── i18n.js                 # English & Assamese translations
│   ├── App.jsx                     # Route controller & layout
│   ├── index.css                   # Modern CSS design system
│   └── main.jsx                    # Application entry point
├── index.html
├── package.json
└── vite.config.js
```
