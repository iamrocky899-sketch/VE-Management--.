package com.itdept.itghss

import android.content.Context
import android.util.Log
import com.google.gson.Gson

/**
 * Manages permanent School Cloud Identity and Google Account binding for Gameri Higher Secondary School.
 * Ensures that school ownership is strictly controlled and not automatically overridden
 * by arbitrary Google accounts present on the device.
 */
object SchoolCloudConfigManager {

    private const val TAG = "SchoolCloudConfig"
    private const val PREFS_NAME = "ve_school_cloud_config"
    private val gson by lazy { Gson() }

    // Default configuration for Gameri Higher Secondary School, Gamiri
    const val DEFAULT_SCHOOL_ID = "GAMERI-HSS-001"
    const val DEFAULT_SCHOOL_NAME = "Gameri Higher Secondary School, Gamiri"
    const val DEFAULT_SCHOOL_DISTRICT = "Biswanath District, Assam"

    // Keys
    private const val KEY_SCHOOL_ID = "school_id"
    private const val KEY_SCHOOL_NAME = "school_name"
    private const val KEY_SCHOOL_DISTRICT = "school_district"
    private const val KEY_BOUND_ACCOUNT_EMAIL = "bound_account_email"
    private const val KEY_BOUND_ACCOUNT_NAME = "bound_account_name"
    private const val KEY_CONNECTION_STATUS = "connection_status"
    private const val KEY_SETUP_COMPLETED = "setup_completed"
    private const val KEY_LAST_CONNECTED_AT = "last_connected_at"
    private const val KEY_CONFIG_VERSION = "config_version"

    // Status Constants
    const val STATUS_NOT_CONFIGURED = "NOT_CONFIGURED"
    const val STATUS_CONNECTED = "CONNECTED"
    const val STATUS_DISCONNECTED = "DISCONNECTED"
    const val STATUS_AUTH_ERROR = "AUTH_ERROR"

    data class SchoolCloudConfig(
        val schoolId: String = DEFAULT_SCHOOL_ID,
        val schoolName: String = DEFAULT_SCHOOL_NAME,
        val schoolDistrict: String = DEFAULT_SCHOOL_DISTRICT,
        val boundAccountEmail: String? = null,
        val boundAccountDisplayName: String? = null,
        val connectionStatus: String = STATUS_NOT_CONFIGURED,
        val setupCompleted: Boolean = false,
        val lastConnectedAt: Long = 0L,
        val configVersion: Int = 1
    ) {
        fun toJsonString(): String {
            return gson.toJson(this)
        }

        companion object {
            fun fromJson(jsonStr: String): SchoolCloudConfig {
                return try {
                    if (jsonStr.isBlank()) return SchoolCloudConfig()
                    val parsed = gson.fromJson(jsonStr, SchoolCloudConfig::class.java)
                    if (parsed != null) {
                        parsed.copy(
                            schoolId = parsed.schoolId.ifBlank { DEFAULT_SCHOOL_ID },
                            schoolName = parsed.schoolName.ifBlank { DEFAULT_SCHOOL_NAME },
                            schoolDistrict = parsed.schoolDistrict.ifBlank { DEFAULT_SCHOOL_DISTRICT }
                        )
                    } else {
                        SchoolCloudConfig()
                    }
                } catch (e: Exception) {
                    logError("Failed to parse SchoolCloudConfig from JSON: ${e.message}")
                    SchoolCloudConfig()
                }
            }
        }
    }

    private fun logError(message: String) {
        try {
            Log.e(TAG, message)
        } catch (_: Throwable) {
            System.err.println("[$TAG] $message")
        }
    }

    /**
     * Retrieves the current School Cloud Configuration.
     */
    fun getConfig(context: Context): SchoolCloudConfig {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val boundEmail = prefs.getString(KEY_BOUND_ACCOUNT_EMAIL, null)
        val boundName = prefs.getString(KEY_BOUND_ACCOUNT_NAME, null)
        val status = prefs.getString(KEY_CONNECTION_STATUS, STATUS_NOT_CONFIGURED) ?: STATUS_NOT_CONFIGURED
        val setupCompleted = prefs.getBoolean(KEY_SETUP_COMPLETED, false)

        return SchoolCloudConfig(
            schoolId = prefs.getString(KEY_SCHOOL_ID, DEFAULT_SCHOOL_ID) ?: DEFAULT_SCHOOL_ID,
            schoolName = prefs.getString(KEY_SCHOOL_NAME, DEFAULT_SCHOOL_NAME) ?: DEFAULT_SCHOOL_NAME,
            schoolDistrict = prefs.getString(KEY_SCHOOL_DISTRICT, DEFAULT_SCHOOL_DISTRICT) ?: DEFAULT_SCHOOL_DISTRICT,
            boundAccountEmail = boundEmail,
            boundAccountDisplayName = boundName,
            connectionStatus = status,
            setupCompleted = setupCompleted,
            lastConnectedAt = prefs.getLong(KEY_LAST_CONNECTED_AT, 0L),
            configVersion = prefs.getInt(KEY_CONFIG_VERSION, 1)
        )
    }

    /**
     * Retrieves the current School Cloud Configuration serialized as a JSON string.
     */
    fun getConfigJson(context: Context): String {
        return getConfig(context).toJsonString()
    }

    /**
     * Updates the school information (School ID, School Name, District) without modifying account binding.
     */
    fun updateSchoolDetails(
        context: Context,
        schoolId: String,
        schoolName: String,
        schoolDistrict: String
    ): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val validId = schoolId.trim().ifBlank { DEFAULT_SCHOOL_ID }
        val validName = schoolName.trim().ifBlank { DEFAULT_SCHOOL_NAME }
        val validDistrict = schoolDistrict.trim().ifBlank { DEFAULT_SCHOOL_DISTRICT }

        return prefs.edit().apply {
            putString(KEY_SCHOOL_ID, validId)
            putString(KEY_SCHOOL_NAME, validName)
            putString(KEY_SCHOOL_DISTRICT, validDistrict)
        }.commit()
    }

    /**
     * Binds the school's official Google account.
     * This establishes the permanent ownership of the school cloud instance.
     */
    fun bindSchoolAccount(
        context: Context,
        email: String,
        displayName: String? = null
    ): Boolean {
        val cleanEmail = email.trim().lowercase()
        if (cleanEmail.isBlank()) return false

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val now = System.currentTimeMillis()

        return prefs.edit().apply {
            putString(KEY_BOUND_ACCOUNT_EMAIL, cleanEmail)
            putString(KEY_BOUND_ACCOUNT_NAME, displayName?.trim() ?: cleanEmail)
            putString(KEY_CONNECTION_STATUS, STATUS_CONNECTED)
            putBoolean(KEY_SETUP_COMPLETED, true)
            putLong(KEY_LAST_CONNECTED_AT, now)
        }.commit()
    }

    /**
     * Explicitly unbinds the school Google account (Admin action).
     */
    fun unbindSchoolAccount(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.edit().apply {
            remove(KEY_BOUND_ACCOUNT_EMAIL)
            remove(KEY_BOUND_ACCOUNT_NAME)
            putString(KEY_CONNECTION_STATUS, STATUS_DISCONNECTED)
        }.commit()
    }

    /**
     * Marks first-time setup as completed (even if offline / skipped).
     */
    fun setSetupCompleted(context: Context, completed: Boolean): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.edit().apply {
            putBoolean(KEY_SETUP_COMPLETED, completed)
        }.commit()
    }

    /**
     * Checks if first-time setup has been completed.
     */
    fun isSetupCompleted(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(KEY_SETUP_COMPLETED, false)
    }

    /**
     * Gets the currently bound Google Account email, or null if none bound.
     */
    fun getBoundAccountEmail(context: Context): String? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_BOUND_ACCOUNT_EMAIL, null)
    }

    /**
     * Gets the permanent School ID.
     */
    fun getSchoolId(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_SCHOOL_ID, DEFAULT_SCHOOL_ID) ?: DEFAULT_SCHOOL_ID
    }

    /**
     * Gets the School Name.
     */
    fun getSchoolName(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_SCHOOL_NAME, DEFAULT_SCHOOL_NAME) ?: DEFAULT_SCHOOL_NAME
    }

    /**
     * Verifies if a given email is the authorized bound school account.
     */
    fun isAccountAuthorized(context: Context, email: String?): Boolean {
        if (email == null) return false
        val boundEmail = getBoundAccountEmail(context) ?: return true // If no account bound yet, any account can be authorized for first-time binding
        return boundEmail.equals(email.trim(), ignoreCase = true)
    }

    /**
     * Updates connection status (e.g. CONNECTED, DISCONNECTED, AUTH_ERROR).
     */
    fun setConnectionStatus(context: Context, status: String): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.edit().apply {
            putString(KEY_CONNECTION_STATUS, status)
        }.commit()
    }
}
