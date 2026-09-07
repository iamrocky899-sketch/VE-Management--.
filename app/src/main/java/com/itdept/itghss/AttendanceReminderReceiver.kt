package com.itdept.itghss

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AttendanceReminderReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "ReminderReceiver"
        const val NOTIFICATION_CHANNEL_ID = "attendance_reminders"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val slotId = intent.getStringExtra("slot_id") ?: return
        val classNum = intent.getStringExtra("class_num") ?: "9"
        val section = intent.getStringExtra("section") ?: "All"
        val time = intent.getStringExtra("time") ?: "09:00"

        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val todayStr = sdf.format(Date())

        // 1. Global reminder check
        if (!AttendanceReminderScheduler.isGlobalReminderEnabled(context)) {
            Log.d(TAG, "Global reminders are disabled; skipping reminder for slot $slotId")
            return
        }

        // 2. Check if already notified for this slot occurrence today
        if (AttendanceReminderScheduler.isSlotNotifiedToday(context, todayStr, slotId)) {
            Log.d(TAG, "Slot $slotId was already notified today ($todayStr); skipping")
            return
        }

        val savedData = AttendanceReminderScheduler.getSavedData(context)
        val dayOverrides = savedData["dayOverrides"]
        val cnh = savedData["cnh"]
        val recordedAttendance = savedData["recordedAttendance"]

        // 3. Centralized ASSEB Calendar & Day Policy Eligibility Check
        val dayStat = AssebCalendarHelper.isAttendanceEligible(todayStr, classNum, dayOverrides, cnh)
        if (!dayStat.isWorking || !dayStat.attendanceEligible) {
            Log.d(TAG, "Day $todayStr for Class $classNum is not attendance-eligible (${dayStat.reason}); suppressing reminder")
            // Reschedule for next week
            AttendanceReminderScheduler.scheduleAllReminders(context)
            return
        }

        // 4. Check if Attendance is already recorded today for this class and section
        if (isClassAttendanceRecordedToday(recordedAttendance, todayStr, classNum, section)) {
            Log.d(TAG, "Attendance for Class $classNum ($section) was already recorded today; suppressing reminder")
            AttendanceReminderScheduler.markSlotNotifiedToday(context, todayStr, slotId)
            AttendanceReminderScheduler.scheduleAllReminders(context)
            return
        }

        // 5. Attendance is Pending on an Eligible Day -> Show High-Priority Notification
        showNotification(context, slotId, classNum, section, time)
        AttendanceReminderScheduler.markSlotNotifiedToday(context, todayStr, slotId)

        // 6. Reschedule for next occurrence
        AttendanceReminderScheduler.scheduleAllReminders(context)
    }

    private fun isClassAttendanceRecordedToday(
        recordedAttendanceJson: String?,
        dateStr: String,
        classNum: String,
        section: String
    ): Boolean {
        if (recordedAttendanceJson.isNullOrBlank() || recordedAttendanceJson == "{}") return false
        return try {
            val obj = JSONObject(recordedAttendanceJson)
            if (obj.has(dateStr)) {
                val dateEntry = obj.get(dateStr)
                if (dateEntry is JSONObject) {
                    if (dateEntry.has(classNum)) {
                        val secVal = dateEntry.get(classNum)
                        if (section == "All" || secVal.toString() == "true" || (secVal is JSONObject && secVal.has(section))) {
                            return true
                        }
                    }
                } else if (dateEntry is org.json.JSONArray) {
                    return true
                }
            }
            false
        } catch (_: Exception) {
            false
        }
    }

    private fun formatTime12Hour(time24: String): String {
        val parts = time24.split(":")
        val h = parts.getOrNull(0)?.toIntOrNull() ?: 9
        val m = parts.getOrNull(1) ?: "00"
        val ampm = if (h >= 12) "PM" else "AM"
        val h12 = if (h % 12 == 0) 12 else h % 12
        return String.format(Locale.US, "%02d:%s %s", h12, m, ampm)
    }

    private fun showNotification(
        context: Context,
        slotId: String,
        classNum: String,
        section: String,
        time: String
    ) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Attendance Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Smart reminders for scheduled class attendance"
                enableLights(true)
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val notifId = AttendanceReminderScheduler.getNotificationId(slotId)
        val secLabel = if (section.isNotEmpty() && section != "All") "-$section" else ""
        val title = "🔔 Attendance Reminder"
        val time12 = formatTime12Hour(time)
        val message = "Class $classNum$secLabel attendance is pending.\nScheduled time: $time12"

        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
            putExtra("action", "take_attendance")
            putExtra("classNum", classNum)
            putExtra("section", section)
        }

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val pendingIntent = PendingIntent.getActivity(context, notifId, openIntent, flags)

        val builder = NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher_ghss)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_camera, "Take Attendance", pendingIntent)
            .setAutoCancel(true)
            .setDefaults(NotificationCompat.DEFAULT_ALL)

        try {
            NotificationManagerCompat.from(context).notify(notifId, builder.build())
            Log.d(TAG, "Notification posted for Class $classNum ($slotId)")
        } catch (e: SecurityException) {
            Log.e(TAG, "POST_NOTIFICATIONS permission not granted: ${e.message}")
        }
    }
}
