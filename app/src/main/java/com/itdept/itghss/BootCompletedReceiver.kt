package com.itdept.itghss

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootCompletedReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.htc.intent.action.QUICKBOOT_POWERON"
        ) {
            Log.d("BootReceiver", "Boot / Package replacement detected ($action); restoring timetable alarms...")
            try {
                AttendanceReminderScheduler.scheduleAllReminders(context)
                Log.d("BootReceiver", "Timetable alarms successfully restored.")
            } catch (e: Exception) {
                Log.e("BootReceiver", "Failed to restore timetable alarms: ${e.message}")
            }
        }
    }
}
