package com.itdept.itghss

import org.junit.Assert.*
import org.junit.Test

class SchoolCloudConfigTest {

    @Test
    fun testDefaultSchoolCloudConfig() {
        val config = SchoolCloudConfigManager.SchoolCloudConfig()
        assertEquals("GAMERI-HSS-001", config.schoolId)
        assertEquals("Gameri Higher Secondary School, Gamiri", config.schoolName)
        assertEquals("Biswanath District, Assam", config.schoolDistrict)
        assertNull(config.boundAccountEmail)
        assertNull(config.boundAccountDisplayName)
        assertEquals(SchoolCloudConfigManager.STATUS_NOT_CONFIGURED, config.connectionStatus)
        assertFalse(config.setupCompleted)
        assertEquals(0L, config.lastConnectedAt)
        assertEquals(1, config.configVersion)
    }

    @Test
    fun testConfigJsonSerializationAndDeserialization() {
        val original = SchoolCloudConfigManager.SchoolCloudConfig(
            schoolId = "GAMERI-HSS-001",
            schoolName = "Gameri Higher Secondary School, Gamiri",
            schoolDistrict = "Biswanath District, Assam",
            boundAccountEmail = "admin@gamerihss.edu.in",
            boundAccountDisplayName = "School Administrator",
            connectionStatus = SchoolCloudConfigManager.STATUS_CONNECTED,
            setupCompleted = true,
            lastConnectedAt = 1756468800000L,
            configVersion = 1
        )

        val jsonString = original.toJsonString()

        val parsed = SchoolCloudConfigManager.SchoolCloudConfig.fromJson(jsonString)

        assertEquals(original.schoolId, parsed.schoolId)
        assertEquals(original.schoolName, parsed.schoolName)
        assertEquals(original.schoolDistrict, parsed.schoolDistrict)
        assertEquals(original.boundAccountEmail, parsed.boundAccountEmail)
        assertEquals(original.boundAccountDisplayName, parsed.boundAccountDisplayName)
        assertEquals(original.connectionStatus, parsed.connectionStatus)
        assertEquals(original.setupCompleted, parsed.setupCompleted)
        assertEquals(original.lastConnectedAt, parsed.lastConnectedAt)
        assertEquals(original.configVersion, parsed.configVersion)
    }

    @Test
    fun testCustomSchoolIdPreservation() {
        val custom = SchoolCloudConfigManager.SchoolCloudConfig(
            schoolId = "CUSTOM-SCH-999",
            schoolName = "Custom Higher Secondary School",
            schoolDistrict = "Sonitpur District, Assam"
        )

        val jsonStr = custom.toJsonString()
        val restored = SchoolCloudConfigManager.SchoolCloudConfig.fromJson(jsonStr)

        assertEquals("CUSTOM-SCH-999", restored.schoolId)
        assertEquals("Custom Higher Secondary School", restored.schoolName)
        assertEquals("Sonitpur District, Assam", restored.schoolDistrict)
    }

    @Test
    fun testInvalidJsonFallbackToDefaults() {
        val fallback = SchoolCloudConfigManager.SchoolCloudConfig.fromJson("invalid_json_string")
        assertEquals(SchoolCloudConfigManager.DEFAULT_SCHOOL_ID, fallback.schoolId)
        assertEquals(SchoolCloudConfigManager.DEFAULT_SCHOOL_NAME, fallback.schoolName)
        assertEquals(SchoolCloudConfigManager.DEFAULT_SCHOOL_DISTRICT, fallback.schoolDistrict)
        assertNull(fallback.boundAccountEmail)
    }

    @Test
    fun testBlankIdAndNameFallbacks() {
        val blankConfig = SchoolCloudConfigManager.SchoolCloudConfig(
            schoolId = "",
            schoolName = "   ",
            schoolDistrict = ""
        )
        val jsonStr = blankConfig.toJsonString()
        val parsed = SchoolCloudConfigManager.SchoolCloudConfig.fromJson(jsonStr)

        assertEquals(SchoolCloudConfigManager.DEFAULT_SCHOOL_ID, parsed.schoolId)
        assertEquals(SchoolCloudConfigManager.DEFAULT_SCHOOL_NAME, parsed.schoolName)
        assertEquals(SchoolCloudConfigManager.DEFAULT_SCHOOL_DISTRICT, parsed.schoolDistrict)
    }

    @Test
    fun testAccountStatusTransitions() {
        var config = SchoolCloudConfigManager.SchoolCloudConfig()
        assertEquals(SchoolCloudConfigManager.STATUS_NOT_CONFIGURED, config.connectionStatus)

        config = config.copy(
            boundAccountEmail = "admin@gamerihss.edu.in",
            connectionStatus = SchoolCloudConfigManager.STATUS_CONNECTED,
            setupCompleted = true
        )
        assertEquals(SchoolCloudConfigManager.STATUS_CONNECTED, config.connectionStatus)
        assertTrue(config.setupCompleted)

        config = config.copy(
            boundAccountEmail = null,
            connectionStatus = SchoolCloudConfigManager.STATUS_DISCONNECTED
        )
        assertEquals(SchoolCloudConfigManager.STATUS_DISCONNECTED, config.connectionStatus)
        assertNull(config.boundAccountEmail)
    }
}
