package com.itdept.itghss

import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

object AttendanceReminderScheduler {

    private const val TAG = "ReminderScheduler"
    private const val PREFS_NAME = "ve_native_reminders"
    private const val KEY_TIMETABLE = "timetable_data"
    private const val KEY_SETTINGS = "reminder_settings"
    private const val KEY_RECORDED_ATTENDANCE = "recorded_attendance"
    private const val KEY_DAY_OVERRIDES = "day_overrides"
    private const val KEY_CNH = "class_not_held"
    private const val KEY_NOTIFIED_DATES = "notified_dates"

    data class TimetableSlot(
        val id: String,
        val day: String,
        val time: String,
        val classNum: String,
        val section: String,
        val tolerance: Int,
        val reminderEnabled: Boolean,
        val active: Boolean
    )

    fun saveNativeState(
        context: Context,
        timetableJson: String,
        settingsJson: String,
        recordedAttendanceJson: String,
        dayOverridesJson: String,
        cnhJson: String
    ) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString(KEY_TIMETABLE, timetableJson)
            putString(KEY_SETTINGS, settingsJson)
            putString(KEY_RECORDED_ATTENDANCE, recordedAttendanceJson)
            putString(KEY_DAY_OVERRIDES, dayOverridesJson)
            putString(KEY_CNH, cnhJson)
            apply()
        }
        scheduleAllReminders(context)
    }

    fun getTimetableSlots(context: Context): List<TimetableSlot> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val jsonStr = prefs.getString(KEY_TIMETABLE, "[]") ?: "[]"
        val list = mutableListOf<TimetableSlot>()
        try {
            val arr = JSONArray(jsonStr)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val id = obj.optString("id", "")
                val day = obj.optString("day", "")
                val time = obj.optString("time", "09:00")
                val classNum = obj.optString("class", "9")
                val section = obj.optString("section", "All")
                val tol = obj.optInt("tolerance", 10)
                val remEnabled = obj.optBoolean("reminderEnabled", true)
                val active = obj.optBoolean("active", true)

                if (id.isNotEmpty() && day.isNotEmpty()) {
                    list.add(TimetableSlot(id, day, time, classNum, section, tol, remEnabled, active))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing timetable JSON: ${e.message}")
        }
        return list
    }

    fun isGlobalReminderEnabled(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val settingsStr = prefs.getString(KEY_SETTINGS, "{}") ?: "{}"
        return try {
            val obj = JSONObject(settingsStr)
            obj.optBoolean("enabled", true)
        } catch (_: Exception) {
            true
        }
    }

    fun getSavedData(context: Context): Map<String, String> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return mapOf(
            "recordedAttendance" to (prefs.getString(KEY_RECORDED_ATTENDANCE, "{}") ?: "{}"),
            "dayOverrides" to (prefs.getString(KEY_DAY_OVERRIDES, "{}") ?: "{}"),
            "cnh" to (prefs.getString(KEY_CNH, "{}") ?: "{}"),
            "notifiedDates" to (prefs.getString(KEY_NOTIFIED_DATES, "{}") ?: "{}")
        )
    }

    fun markSlotNotifiedToday(context: Context, dateStr: String, slotId: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val notifiedStr = prefs.getString(KEY_NOTIFIED_DATES, "{}") ?: "{}"
        try {
            val obj = JSONObject(notifiedStr)
            val dateObj = if (obj.has(dateStr)) obj.getJSONObject(dateStr) else JSONObject()
            dateObj.put(slotId, System.currentTimeMillis())
            obj.put(dateStr, dateObj)
            prefs.edit().putString(KEY_NOTIFIED_DATES, obj.toString()).apply()
        } catch (_: Exception) {}
    }

    fun isSlotNotifiedToday(context: Context, dateStr: String, slotId: String): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val notifiedStr = prefs.getString(KEY_NOTIFIED_DATES, "{}") ?: "{}"
        return try {
            val obj = JSONObject(notifiedStr)
            if (obj.has(dateStr)) {
                obj.getJSONObject(dateStr).has(slotId)
            } else false
        } catch (_: Exception) {
            false
        }
    }

    fun getNotificationId(slotId: String): Int {
        var hash = 0
        for (ch in slotId) {
            hash = ((hash shl 5) - hash) + ch.code
        }
        return Math.abs(hash % 100000) + 1000
    }

    private fun getDayOfWeekInt(dayName: String): Int {
        return when (dayName.trim().lowercase()) {
            "sunday" -> Calendar.SUNDAY
            "monday" -> Calendar.MONDAY
            "tuesday" -> Calendar.TUESDAY
            "wednesday" -> Calendar.WEDNESDAY
            "thursday" -> Calendar.THURSDAY
            "friday" -> Calendar.FRIDAY
            "saturday" -> Calendar.SATURDAY
            else -> Calendar.MONDAY
        }
    }

    /**
     * Calculates the exact next trigger time for a timetable slot.
     */
    fun calculateNextTriggerTime(dayName: String, timeStr: String, toleranceMinutes: Int): Long {
        val targetDayOfWeek = getDayOfWeekInt(dayName)
        val parts = timeStr.split(":")
        val hour = parts.getOrNull(0)?.toIntOrNull() ?: 9
        val minute = parts.getOrNull(1)?.toIntOrNull() ?: 0

        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            add(Calendar.MINUTE, toleranceMinutes)
        }

        val now = Calendar.getInstance()
        val currentDayOfWeek = now.get(Calendar.DAY_OF_WEEK)

        var daysUntilTarget = (targetDayOfWeek - currentDayOfWeek + 7) % 7

        if (daysUntilTarget == 0) {
            // Target day is today; check if trigger time has already passed
            if (cal.timeInMillis <= now.timeInMillis) {
                daysUntilTarget = 7 // Move to next week's occurrence
            }
        }

        cal.add(Calendar.DAY_OF_YEAR, daysUntilTarget)
        return cal.timeInMillis
    }

    /**
     * Schedules native alarms for all active timetable slots.
     */
    @SuppressLint("ScheduleExactAlarm")
    fun scheduleAllReminders(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val globalEnabled = isGlobalReminderEnabled(context)
        val slots = getTimetableSlots(context)

        for (slot in slots) {
            val notifId = getNotificationId(slot.id)
            val intent = Intent(context, AttendanceReminderReceiver::class.java).apply {
                putExtra("slot_id", slot.id)
                putExtra("class_num", slot.classNum)
                putExtra("section", slot.section)
                putExtra("time", slot.time)
                putExtra("day", slot.day)
                putExtra("tolerance", slot.tolerance)
            }

            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val pendingIntent = PendingIntent.getBroadcast(context, notifId, intent, flags)

            // If global reminders disabled or slot disabled/inactive, cancel alarm
            if (!globalEnabled || !slot.active || !slot.reminderEnabled) {
                alarmManager.cancel(pendingIntent)
                continue
            }

            val triggerTime = calculateNextTriggerTime(slot.day, slot.time, slot.tolerance)

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (alarmManager.canScheduleExactAlarms()) {
                        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
                    } else {
                        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
                    }
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error scheduling alarm for slot ${slot.id}: ${e.message}")
            }
        }
    }

    fun cancelReminder(context: Context, slotId: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val notifId = getNotificationId(slotId)
        val intent = Intent(context, AttendanceReminderReceiver::class.java)
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_NO_CREATE
        }
        val pendingIntent = PendingIntent.getBroadcast(context, notifId, intent, flags)
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
        }
    }
}
