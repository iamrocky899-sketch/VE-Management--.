# 🎓 VE Management

### Advanced Vocational Education Management System

**VE Management** is a modern, offline-first Android application designed for vocational education and school attendance management.

It combines **Face Recognition, Manual Attendance, Student 360° Profiles, Marks Management, Smart Attendance Reminders, WhatsApp/SMS Parent Alerts, Google Calendar, Google Drive Backup, Student Groups, and detailed reporting** into one application.

---

<p align="center">

  <img src="app/src/main/assets/logo.png" width="120" alt="VE Management Logo">

  <br><br>

  <strong>VE Management</strong>

  <br>

  <em>Smart • Offline • Secure • School Ready</em>

</p>

---

## 🚀 Latest Release — v5.7

**Version Code:** `6`

**Release Status:** ✅ Stable

**Platform:** Android

**Target:** Android 16

---

# ✨ Highlights

| Feature | Status |
|---|---|
| 👨‍🎓 Student Management | ✅ |
| 👤 Student 360° Portfolio | ✅ |
| 📊 Attendance Management | ✅ |
| 🤖 Offline Face Recognition | ✅ |
| 📖 Month-wise Attendance Register | ✅ |
| 🚨 Smart Absence Alerts | ✅ |
| 📲 WhatsApp Parent Alerts | ✅ |
| 💬 SMS Parent Alerts | ✅ |
| ⏰ Smart Attendance Reminders | ✅ |
| 🗓️ Manual Class Timetable | ✅ |
| 📅 Google Calendar Integration | ✅ |
| ☁️ Google Drive Backup | ✅ |
| 📝 Teacher Notes | ✅ |
| 🔎 Global Student Search | ✅ |
| 🔐 Audit Trail | ✅ |
| 📊 Attendance Health | ✅ |
| 📚 Marks Management | ✅ |
| 👥 Student Groups | ✅ |
| 📄 PDF Export | ✅ |
| 📊 Excel Export | ✅ |
| 📴 Offline-first Operation | ✅ |

---

# 🎯 Core Features

## 👨‍🎓 Student Management

Comprehensive student record management with support for:

- Student registration
- Student profile editing
- Class and section management
- Roll number
- Parent/guardian information
- Contact information
- Address information
- Student promotion
- Student withdrawal/drop
- Student search
- Student portfolio
- Individual PDF portfolio export

---

# 👤 Student 360° Portfolio

Every student can now have a complete centralized portfolio.

Simply **tap the student card/row** to open the portfolio.

### Portfolio includes

- 👤 Student profile
- 📊 Attendance health
- 📅 Attendance timeline
- 📚 Academic marks
- 👥 Group membership
- ⭐ Leadership role
- 📱 Parent communication history
- 📝 Teacher notes
- 📞 Parent contact
- 📄 Student portfolio PDF

### Attendance Health

Students can be categorized as:

🟢 **GOOD**

🟠 **ATTENTION**

🔴 **AT RISK**

The system uses the existing attendance engine and consecutive absence calculation.

---

# 📖 Month-wise Attendance Register

A traditional school-register style attendance view.

### Features

- Month navigation
- Class filtering
- Section filtering
- Student search
- Daily attendance
- Present/Absent status
- Attendance percentage
- Student attendance history
- Register-style layout
- Excel export
- PDF export

The system correctly distinguishes:

- ✅ Present
- ❌ Absent
- ⏳ Attendance Pending
- 🏖️ Holiday
- 🚫 Class Not Held
- ⛔ Weekend

Non-working days are not incorrectly counted as student absences.

---

# 🤖 Offline Face Recognition

VE Management includes a fully offline face-recognition engine.

Powered by:

**face-api.js**

Bundled models:

- Tiny Face Detector
- Face Landmark 68
- Face Recognition Network

### Enrollment

Students can be enrolled using multiple face samples.

### Recognition

Face recognition runs locally on the device without requiring cloud AI processing.

### Benefits

- 📴 Works offline
- ⚡ Fast local processing
- 🔒 Student face data stays on the device
- 🌐 No AI API required

---

# ⏰ Smart Attendance Reminder

VE Management includes a manual weekly timetable and smart attendance reminder system.

Teachers can define:

- Day
- Time
- Class
- Section
- Reminder ON/OFF
- Reminder tolerance

Example:

```text
Monday
09:00 AM
Class IX-A
