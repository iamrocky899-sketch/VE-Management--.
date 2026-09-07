package com.itdept.itghss

import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Native ASSEB Academic Calendar 2026–27 Policy & Day-Status Evaluator.
 * Mirrors evaluateAttendanceEligibility from asseb_calendar_2026_27.js for 100% offline native background checks.
 */
object AssebCalendarHelper {

    private val HOLIDAYS = mapOf(
        // April 2026
        "2026-04-03" to "Good Friday",
        "2026-04-14" to "Bohag Bihu",
        "2026-04-15" to "Bohag Bihu",
        "2026-04-16" to "Bohag Bihu",
        "2026-04-18" to "Tithi of Damodardeva",
        "2026-04-21" to "Sati Sadhani Divas",

        // May 2026
        "2026-05-01" to "May Day / Buddha Purnima",
        "2026-05-27" to "Id-ul-Zuha",

        // June 2026
        "2026-06-01" to "Janmashtami of Sri Sri Madhabdeva",

        // August 2026
        "2026-08-15" to "Independence Day",

        // September 2026
        "2026-09-01" to "Tirubhav Tithi of Sri Sri Madhabdeva",
        "2026-09-04" to "Janmashtami",
        "2026-09-12" to "Tithi of Srimanta Sankardeva",
        "2026-09-21" to "Janmashtami of Sri Sri Sankardeva",
        "2026-09-22" to "Karam Puja",

        // October 2026
        "2026-10-02" to "Birth Day of Mahatma Gandhi",
        "2026-10-18" to "Kali Puja & Durga Puja",
        "2026-10-19" to "Durga Puja",
        "2026-10-20" to "Durga Puja",
        "2026-10-21" to "Vijaya Dashami",
        "2026-10-25" to "Lakhi Puja",

        // November 2026
        "2026-11-08" to "Kali Puja & Diwali",
        "2026-11-11" to "Bhatridwitiya / National Education Day",
        "2026-11-15" to "Chhath Puja",
        "2026-11-24" to "Guru Nanak's Birthday / Lachit Divas",

        // December 2026
        "2026-12-02" to "Asom Divas",
        "2026-12-25" to "Christmas Day",

        // January 2027
        "2027-01-14" to "Magh Bihu",
        "2027-01-15" to "Magh Bihu & Tusu Puja",
        "2027-01-17" to "Silpi Divas",
        "2027-01-23" to "Netaji's Birthday",
        "2027-01-24" to "World Girl Child Day",
        "2027-01-26" to "Republic Day",

        // February 2027
        "2027-02-17" to "Ali Aye Ligang",
        "2027-02-20" to "Bir Chilarai Divas",

        // March 2027
        "2027-03-09" to "Id-ul-Fitr",
        "2027-03-22" to "Holi / World Water Day",
        "2027-03-26" to "Good Friday"
    )

    private val EXAMS = mapOf(
        // June 2026: UT-1
        "2026-06-22" to "Unit Test-1", "2026-06-23" to "Unit Test-1", "2026-06-24" to "Unit Test-1",
        "2026-06-25" to "Unit Test-1", "2026-06-26" to "Unit Test-1", "2026-06-27" to "Unit Test-1",

        // September 2026: Half Yearly
        "2026-09-24" to "Half Yearly Examination", "2026-09-25" to "Half Yearly Examination", "2026-09-26" to "Half Yearly Examination",
        "2026-09-28" to "Half Yearly Examination", "2026-09-29" to "Half Yearly Examination", "2026-09-30" to "Half Yearly Examination",

        // November 2026: UT-2
        "2026-11-23" to "Unit Test-2", "2026-11-25" to "Unit Test-2", "2026-11-26" to "Unit Test-2",
        "2026-11-27" to "Unit Test-2", "2026-11-28" to "Unit Test-2", "2026-11-30" to "Unit Test-2",

        // January 2027: Revisionary
        "2027-01-02" to "Revisionary Exam", "2027-01-04" to "Revisionary Exam", "2027-01-05" to "Revisionary Exam",
        "2027-01-06" to "Revisionary Exam", "2027-01-07" to "Revisionary Exam", "2027-01-08" to "Revisionary Exam",
        "2027-01-09" to "Revisionary Exam", "2027-01-11" to "Practical Exam / Revisionary Exam",

        // March 2027: Annual Exam Class IX
        "2027-03-06" to "Annual Exam for Class IX", "2027-03-08" to "Annual Exam for Class IX",
        "2027-03-10" to "Annual Exam for Class IX", "2027-03-11" to "Annual Exam for Class IX",
        "2027-03-12" to "Annual Exam for Class IX", "2027-03-13" to "Annual Exam for Class IX",
        "2027-03-15" to "Practical of Annual Examination"
    )

    private val ACTIVITIES = mapOf(
        "2026-12-08" to "Annual Sports", "2026-12-09" to "Annual Sports", "2026-12-10" to "Annual Sports",
        "2026-12-11" to "Cultural and Literary activities", "2026-12-12" to "Cultural & Literary activities / Prize Distribution",
        "2027-03-17" to "Evaluation", "2027-03-18" to "Evaluation", "2027-03-19" to "Evaluation",
        "2027-03-20" to "Evaluation", "2027-03-23" to "Evaluation", "2027-03-24" to "Evaluation",
        "2027-03-25" to "Evaluation", "2027-03-27" to "Declaration of Results of Class IX",
        "2027-03-29" to "Analysis of Annual Exam Results",
        "2027-03-30" to "Formation of School Routine for 2027–28", "2027-03-31" to "Formation of School Routine for 2027–28"
    )

    data class DayEligibilityResult(
        val isWorking: Boolean,
        val attendanceEligible: Boolean,
        val status: String,
        val reason: String
    )

    /**
     * Evaluates attendance eligibility for a class on a given date string (YYYY-MM-DD).
     */
    fun isAttendanceEligible(
        dateStr: String,
        classNum: String,
        dayOverridesJson: String? = null,
        cnhJson: String? = null
    ): DayEligibilityResult {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val date: Date = try {
            sdf.parse(dateStr) ?: return DayEligibilityResult(true, true, "WORKING_DAY", "Working Day")
        } catch (e: Exception) {
            return DayEligibilityResult(true, true, "WORKING_DAY", "Working Day")
        }

        val cal = Calendar.getInstance().apply { time = date }
        val dayOfWeek = cal.get(Calendar.DAY_OF_WEEK) // 1 = Sunday, 7 = Saturday

        // 1. Teacher Manual Overrides (Highest Operational Priority)
        if (!dayOverridesJson.isNullOrBlank() && dayOverridesJson != "{}") {
            try {
                val overridesObj = JSONObject(dayOverridesJson)
                if (overridesObj.has(dateStr)) {
                    val dateOverrides = overridesObj.getJSONObject(dateStr)
                    val key = if (dateOverrides.has(classNum)) classNum else if (dateOverrides.has("All")) "All" else null
                    if (key != null) {
                        val entry = dateOverrides.getJSONObject(key)
                        val status = entry.optString("status", "")
                        val reason = entry.optString("reason", status)
                        if (status == "HOLIDAY") {
                            return DayEligibilityResult(false, false, "HOLIDAY", if (reason.isNotEmpty()) reason else "Teacher Marked Holiday")
                        } else if (status == "CLASS_NOT_HELD") {
                            return DayEligibilityResult(false, false, "CLASS_NOT_HELD", if (reason.isNotEmpty()) reason else "Class Not Held")
                        } else if (status == "WORKING_DAY") {
                            return DayEligibilityResult(true, true, "WORKING_DAY", if (reason.isNotEmpty()) reason else "Teacher Marked Working Day")
                        }
                    }
                }
            } catch (_: Exception) {}
        }

        // 1b. Legacy Class Not Held
        if (!cnhJson.isNullOrBlank() && cnhJson != "{}") {
            try {
                val cnhObj = JSONObject(cnhJson)
                if (cnhObj.has(dateStr)) {
                    val classObj = cnhObj.getJSONObject(dateStr)
                    if (classObj.has(classNum)) {
                        val reason = classObj.optString(classNum, "Class Not Held")
                        return DayEligibilityResult(false, false, "CLASS_NOT_HELD", reason)
                    }
                }
            } catch (_: Exception) {}
        }

        // 2. Summer Vacation (July 2026: all 31 days)
        if (dateStr.startsWith("2026-07")) {
            return DayEligibilityResult(false, false, "HOLIDAY", "Summer Vacation")
        }

        // 3. Official Holiday
        if (HOLIDAYS.containsKey(dateStr)) {
            val title = HOLIDAYS[dateStr] ?: "Official Holiday"
            val status = if (dayOfWeek == Calendar.SUNDAY) "WEEKEND" else "HOLIDAY"
            return DayEligibilityResult(false, false, status, title)
        }

        // 4. Sunday Policy: OFF for all classes
        if (dayOfWeek == Calendar.SUNDAY) {
            return DayEligibilityResult(false, false, "WEEKEND", "Sunday Off")
        }

        // 5. Saturday Policy & Special Exam/Activity Exception
        if (dayOfWeek == Calendar.SATURDAY) {
            // Special Exam Exception (Rule 3 & 19): If Saturday is marked EXAMINATION or ACTIVITY, it is attendance-eligible for all classes (including IX-X)
            if (EXAMS.containsKey(dateStr)) {
                val title = EXAMS[dateStr] ?: "Examination"
                return DayEligibilityResult(true, true, "WORKING_DAY", title)
            }
            if (ACTIVITIES.containsKey(dateStr)) {
                val title = ACTIVITIES[dateStr] ?: "Activity"
                return DayEligibilityResult(true, true, "WORKING_DAY", title)
            }

            // Normal Saturday: Class IX-X OFF, Class XI-XII Working
            val isJunior = (classNum == "9" || classNum == "10" || classNum == "IX" || classNum == "X")
            if (isJunior) {
                return DayEligibilityResult(false, false, "WEEKEND", "Saturday Off (Class IX-X)")
            } else {
                return DayEligibilityResult(true, true, "WORKING_DAY", "Saturday Working (Class XI-XII)")
            }
        }

        // 6. Weekday Examinations & Activities
        if (EXAMS.containsKey(dateStr)) {
            val title = EXAMS[dateStr] ?: "Examination"
            return DayEligibilityResult(true, true, "WORKING_DAY", title)
        }
        if (ACTIVITIES.containsKey(dateStr)) {
            val title = ACTIVITIES[dateStr] ?: "Activity"
            return DayEligibilityResult(true, true, "WORKING_DAY", title)
        }

        // 7. Normal Class Day
        return DayEligibilityResult(true, true, "WORKING_DAY", "Class Day")
    }
}
