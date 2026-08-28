package com.itdept.itghss

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ContentValues
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.Scope
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential
import com.google.api.client.json.gson.GsonFactory
import com.google.api.services.drive.Drive
import com.google.api.services.drive.DriveScopes
import com.google.api.services.calendar.Calendar
import com.google.api.services.calendar.CalendarScopes
import com.google.api.services.drive.model.File
import com.google.api.client.http.ByteArrayContent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Collections

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val CAMERA_PERMISSION_CODE = 101
    private val NOTIFICATION_PERMISSION_CODE = 102
    private val NOTIFICATION_CHANNEL_ID = "attendance_reminders"
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    private lateinit var googleSignInClient: GoogleSignInClient
    private var googleAccount: GoogleSignInAccount? = null
    private var driveService: Drive? = null
    private var calendarService: Calendar? = null
    private var hasAutoSynced = false

    private val fileChooserLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (filePathCallback == null) return@registerForActivityResult
        val data = if (result.resultCode == RESULT_OK) result.data else null
        val results = WebChromeClient.FileChooserParams.parseResult(result.resultCode, data)
        filePathCallback?.onReceiveValue(results)
        filePathCallback = null
    }

    private val googleSignInLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(com.google.android.gms.common.api.ApiException::class.java)
            if (account != null) {
                googleAccount = account
                initializeGoogleServices(account)
                notifyJsSignInSuccess(account.email ?: "")
            }
        } catch (e: com.google.android.gms.common.api.ApiException) {
            val errorMsg = when (e.statusCode) {
                12500 -> "Sign-in failed: Sign-in configuration is incorrect (Check SHA-1/Package Name/Support Email in Firebase). Error Code: ${e.statusCode}"
                12501 -> "Sign-in cancelled by user."
                10 -> "Sign-in failed: Developer error (likely Web Client ID mismatch or SHA-1 not registered). Error Code: ${e.statusCode}"
                7 -> "Sign-in failed: Network error. Please check your internet. Error Code: ${e.statusCode}"
                8 -> "Sign-in failed: Internal error. Error Code: ${e.statusCode}"
                12502 -> "Sign-in failed: Sign-in in progress. Error Code: ${e.statusCode}"
                else -> "Sign-in failed: ${e.message}. Status Code: ${e.statusCode}"
            }
            android.util.Log.e("MainActivity", "Google Sign-In Error: $errorMsg", e)
            Toast.makeText(this, errorMsg, Toast.LENGTH_LONG).show()
            notifyJsSignInFailure(errorMsg)
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Unexpected Sign-In Error: ${e.message}", e)
            Toast.makeText(this, "Sign-in failed: ${e.message}", Toast.LENGTH_LONG).show()
            notifyJsSignInFailure(e.message ?: "Unknown error")
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        createNotificationChannel()
        setupGoogleSignIn()
        setupWebView()
        checkPermissions()
        handleNotificationIntent(intent)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // Try to let JS handle back first
                webView.evaluateJavascript("if(window.onBackPressed) window.onBackPressed(); else 'false';") { result ->
                    if (result == "false" || result == "null") {
                        if (webView.canGoBack()) {
                            webView.goBack()
                        } else {
                            isEnabled = false
                            onBackPressedDispatcher.onBackPressed()
                            isEnabled = true
                        }
                    }
                }
            }
        })
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleNotificationIntent(intent)
    }

    private fun handleNotificationIntent(intent: Intent?) {
        val action = intent?.getStringExtra("action")
        if (action == "take_attendance") {
            val classNum = intent.getStringExtra("classNum") ?: "9"
            val section = intent.getStringExtra("section") ?: "A"
            webView.postDelayed({
                webView.evaluateJavascript("if (typeof openAttendanceForClass === 'function') openAttendanceForClass('$classNum', '$section');", null)
            }, 500)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Attendance Reminders"
            val descriptionText = "Smart reminders for scheduled class attendance"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(NOTIFICATION_CHANNEL_ID, name, importance).apply {
                description = descriptionText
                enableLights(true)
                enableVibration(true)
            }
            val notificationManager: NotificationManager =
                getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun setupGoogleSignIn() {
        val webClientId = getString(R.string.default_web_client_id)
        android.util.Log.d("MainActivity", "Using Web Client ID: $webClientId")

        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(webClientId)
            .requestEmail()
            .requestScopes(Scope(DriveScopes.DRIVE_APPDATA), Scope(CalendarScopes.CALENDAR_READONLY))
            .build()
        googleSignInClient = GoogleSignIn.getClient(this, gso)
        
        // Check for existing account
        googleAccount = GoogleSignIn.getLastSignedInAccount(this)
        googleAccount?.let {
            initializeGoogleServices(it)
        }
    }

    private fun initializeGoogleServices(account: GoogleSignInAccount) {
        try {
            val credential = GoogleAccountCredential.usingOAuth2(
                this, listOf(DriveScopes.DRIVE_APPDATA, CalendarScopes.CALENDAR_READONLY)
            )
            // Prioritize the Account object for older APIs, fallback to email for Android 16+
            if (account.account != null) {
                credential.selectedAccount = account.account
            } else {
                credential.selectedAccountName = account.email
            }
            
            driveService = Drive.Builder(
                NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                credential
            ).setApplicationName("VE Management").build()

            calendarService = Calendar.Builder(
                NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                credential
            ).setApplicationName("VE Management").build()

            android.util.Log.d("MainActivity", "Google Services Initialized for ${account.email}")
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Services Initialization Failed: ${e.message}")
            Toast.makeText(this, "Cloud Sync Error: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = false
        settings.allowContentAccess = true
        @Suppress("DEPRECATION")
        settings.allowFileAccessFromFileURLs = false
        @Suppress("DEPRECATION")
        settings.allowUniversalAccessFromFileURLs = false
        settings.mediaPlaybackRequiresUserGesture = false

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.addJavascriptInterface(WebAppInterface(), "Android")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
                val url = request?.url ?: return null
                val response = assetLoader.shouldInterceptRequest(url)
                if (response != null) return response
                return super.shouldInterceptRequest(view, request)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Notify JS of current login status
                googleAccount?.let {
                    notifyJsSignInSuccess(it.email ?: "")
                    // Auto-load data from drive on startup if logged in (once per session)
                    if (!hasAutoSynced) {
                        requestSyncFromDriveInternal()
                        hasAutoSynced = true
                    }
                }
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString()
                if (url != null && (url.startsWith("whatsapp:") || url.contains("chat.whatsapp.com") || url.contains("wa.me") || url.contains("api.whatsapp.com") || url.startsWith("sms:") || url.startsWith("tel:") || url.startsWith("mailto:"))) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        return true
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "Application not found", Toast.LENGTH_SHORT).show()
                        return true
                    }
                }
                return false
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    request.grant(request.resources)
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: WebChromeClient.FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback = filePathCallback
                val intent = fileChooserParams?.createIntent()
                try {
                    if (intent != null) {
                        fileChooserLauncher.launch(intent)
                    } else {
                        this@MainActivity.filePathCallback = null
                        return false
                    }
                } catch (e: Exception) {
                    this@MainActivity.filePathCallback = null
                    return false
                }
                return true
            }
        }

        webView.setDownloadListener { url, userAgent, contentDisposition, mimetype, _ ->
            try {
                if (url.startsWith("data:")) {
                    saveBase64ToDownloads(url, contentDisposition, mimetype)
                } else {
                    val request = android.app.DownloadManager.Request(Uri.parse(url))
                    request.setMimeType(mimetype)
                    request.addRequestHeader("User-Agent", userAgent)
                    val fileName = android.webkit.URLUtil.guessFileName(url, contentDisposition, mimetype)
                    request.setTitle(fileName)
                    request.setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
                    val dm = getSystemService(DOWNLOAD_SERVICE) as android.app.DownloadManager
                    dm.enqueue(request)
                    Toast.makeText(applicationContext, "Downloading File...", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(applicationContext, "Download Failed: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }

        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
    }

    private fun notifyJsSignInSuccess(email: String) {
        webView.evaluateJavascript("if(window.onGoogleSignInSuccess) window.onGoogleSignInSuccess('$email');", null)
    }

    private fun notifyJsSignInFailure(error: String) {
        webView.evaluateJavascript("if(window.onGoogleSignInFailure) window.onGoogleSignInFailure('$error');", null)
    }

    private fun notifyJsSyncResult(success: Boolean, message: String) {
        webView.evaluateJavascript("if(window.onFileSyncResult) window.onFileSyncResult($success, '$message');", null)
    }

    private fun notifyJsDataLoaded(jsonData: String) {
        // Robust escaping for large JSON strings passed to JS
        val escapedData = jsonData
            .replace("\\", "\\\\") // Escape backslashes first
            .replace("'", "\\'")   // Escape single quotes (used as string delimiter)
            .replace("\n", "\\n")  // Escape real newlines
            .replace("\r", "\\r")  // Escape carriage returns
        
        webView.evaluateJavascript("if(window.onCloudDataLoaded) window.onCloudDataLoaded('$escapedData');", null)
    }

    private fun saveBase64ToDownloads(url: String, contentDisposition: String, mimetype: String) {
        try {
            val base64Data = url.substringAfter(",")
            val decodedData = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
            val fileName = android.webkit.URLUtil.guessFileName(url, contentDisposition, mimetype)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val resolver = contentResolver
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, mimetype)
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }
                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                uri?.let {
                    resolver.openOutputStream(it).use { outputStream ->
                        outputStream?.write(decodedData)
                    }
                    Toast.makeText(this, "File Saved to Downloads", Toast.LENGTH_SHORT).show()
                } ?: run {
                    Toast.makeText(this, "Failed to create file in Downloads", Toast.LENGTH_SHORT).show()
                }
            } else {
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val file = java.io.File(downloadsDir, fileName)
                java.io.FileOutputStream(file).use { outputStream ->
                    outputStream.write(decodedData)
                }
                Toast.makeText(this, "File Saved to Downloads: ${file.absolutePath}", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Save Error: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun checkPermissions() {
        val perms = mutableListOf(Manifest.permission.CAMERA)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            perms.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            perms.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        val needed = perms.filter { ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED }
        if (needed.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), CAMERA_PERMISSION_CODE)
        }
    }

    private fun showAttendanceNotificationInternal(id: Int, title: String, message: String, classNum: String, section: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), NOTIFICATION_PERMISSION_CODE)
                return
            }
        }

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("action", "take_attendance")
            putExtra("classNum", classNum)
            putExtra("section", section)
        }

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val pendingIntent = PendingIntent.getActivity(this, id, intent, flags)

        val builder = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher_ghss)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .addAction(android.R.drawable.ic_menu_camera, "Take Attendance", pendingIntent)
            .setAutoCancel(true)
            .setDefaults(NotificationCompat.DEFAULT_ALL)

        val notificationManager = NotificationManagerCompat.from(this)
        try {
            notificationManager.notify(id, builder.build())
        } catch (e: SecurityException) {
            android.util.Log.e("MainActivity", "Notification permission not granted: ${e.message}")
        }
    }

    private fun cancelAttendanceNotificationInternal(id: Int) {
        val notificationManager = NotificationManagerCompat.from(this)
        if (id == 0) {
            notificationManager.cancelAll()
        } else {
            notificationManager.cancel(id)
        }
    }

    inner class WebAppInterface {
        @android.webkit.JavascriptInterface
        fun getAppVersion(): String {
            return try {
                val pInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    packageManager.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0))
                } else {
                    @Suppress("DEPRECATION")
                    packageManager.getPackageInfo(packageName, 0)
                }
                pInfo.versionName ?: "5.7"
            } catch (e: Exception) {
                "5.7"
            }
        }

        @android.webkit.JavascriptInterface
        fun showAttendanceNotification(id: Int, title: String, message: String, classNum: String, section: String) {
            runOnUiThread {
                showAttendanceNotificationInternal(id, title, message, classNum, section)
            }
        }

        @android.webkit.JavascriptInterface
        fun cancelAttendanceNotification(id: Int) {
            runOnUiThread {
                cancelAttendanceNotificationInternal(id)
            }
        }

        @android.webkit.JavascriptInterface
        fun saveFile(base64: String, filename: String, mime: String) {
            runOnUiThread {
                saveDecodedFileData(base64, filename, mime)
            }
        }

        @android.webkit.JavascriptInterface
        fun loginWithGoogle() {
            runOnUiThread {
                if (!::googleSignInClient.isInitialized) {
                    setupGoogleSignIn()
                }
                val signInIntent = googleSignInClient.signInIntent
                googleSignInLauncher.launch(signInIntent)
            }
        }

        @android.webkit.JavascriptInterface
        fun logoutFromGoogle() {
            runOnUiThread {
                googleSignInClient.signOut().addOnCompleteListener {
                    googleAccount = null
                    driveService = null
                    calendarService = null
                    webView.evaluateJavascript("if(window.onGoogleSignOut) window.onGoogleSignOut();", null)
                }
            }
        }

        @android.webkit.JavascriptInterface
        fun fetchHolidays(year: Int) {
            fetchHolidaysInternal(year)
        }

        @android.webkit.JavascriptInterface
        fun syncToDrive(jsonData: String) {
            syncToDriveInternal(jsonData)
        }

        @android.webkit.JavascriptInterface
        fun requestSyncFromDrive() {
            requestSyncFromDriveInternal()
        }
    }

    private fun syncToDriveInternal(jsonData: String) {
        if (driveService == null) {
            runOnUiThread { Toast.makeText(this@MainActivity, "Not logged in to Google", Toast.LENGTH_SHORT).show() }
            return
        }
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val fileName = "itghss_backup.json"
                val query = "name = '$fileName' and 'appDataFolder' in parents"
                val files = driveService!!.files().list().setSpaces("appDataFolder").setQ(query).execute().files
                
                val contentStream = ByteArrayContent.fromString("application/json", jsonData)
                
                if (files.isNullOrEmpty()) {
                    // Create
                    val fileMetadata = File()
                    fileMetadata.name = fileName
                    fileMetadata.parents = Collections.singletonList("appDataFolder")
                    driveService!!.files().create(fileMetadata, contentStream).execute()
                } else {
                    // Update
                    val fileId = files[0].id
                    driveService!!.files().update(fileId, null, contentStream).execute()
                }
                withContext(Dispatchers.Main) {
                    notifyJsSyncResult(true, "Auto-Sync Success")
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    notifyJsSyncResult(false, "Auto-Sync Error: ${e.message}")
                }
            }
        }
    }

    private fun fetchHolidaysInternal(year: Int) {
        if (calendarService == null) return
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Public Holiday Calendar ID for India
                val calendarId = "en.indian#holiday@group.v.calendar.google.com"
                val timeMin = com.google.api.client.util.DateTime("${year}-01-01T00:00:00Z")
                val timeMax = com.google.api.client.util.DateTime("${year}-12-31T23:59:59Z")
                
                val events = calendarService!!.events().list(calendarId)
                    .setTimeMin(timeMin)
                    .setTimeMax(timeMax)
                    .execute()
                
                val holidays = mutableMapOf<String, String>()
                events.items?.forEach { event ->
                    val date = event.start.date ?: event.start.dateTime
                    if (date != null) {
                        val dateStr = date.toString().substring(0, 10) // YYYY-MM-DD
                        holidays[dateStr] = event.summary ?: "Holiday"
                    }
                }
                
                val json = com.google.gson.Gson().toJson(holidays)
                withContext(Dispatchers.Main) {
                    webView.evaluateJavascript("if(window.onHolidaysLoaded) window.onHolidaysLoaded('$json');", null)
                }
            } catch (e: Exception) {
                android.util.Log.e("MainActivity", "Fetch Holidays Error: ${e.message}")
            }
        }
    }

    private fun requestSyncFromDriveInternal() {
        if (driveService == null) {
            android.util.Log.e("MainActivity", "Pull from Cloud failed: Drive Service is null")
            return
        }
        hasAutoSynced = true
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val fileName = "itghss_backup.json"
                val query = "name = '$fileName' and 'appDataFolder' in parents"
                val files = driveService!!.files().list().setSpaces("appDataFolder").setQ(query).execute().files
                
                if (!files.isNullOrEmpty()) {
                    val fileId = files[0].id
                    val outputStream = java.io.ByteArrayOutputStream()
                    driveService!!.files().get(fileId).executeMediaAndDownloadTo(outputStream)
                    val content = outputStream.toString("UTF-8")
                    withContext(Dispatchers.Main) {
                        notifyJsDataLoaded(content)
                        // Toast.makeText(this@MainActivity, "Data pulled from Cloud successfully", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        // Toast.makeText(this@MainActivity, "No backup found in Cloud", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("MainActivity", "Pull from Cloud Error: ${e.message}", e)
                withContext(Dispatchers.Main) {
                    // Show error only if it's likely a manual pull or a serious auth issue
                    if (!e.message.isNullOrEmpty() && (e.message!!.contains("403") || e.message!!.contains("401"))) {
                        Toast.makeText(this@MainActivity, "Cloud Access Error: ${e.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }
    }

    private fun saveDecodedFileData(base64Data: String, fileName: String, mimetype: String) {
        try {
            val decodedData = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val resolver = contentResolver
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, mimetype)
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }
                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                uri?.let {
                    resolver.openOutputStream(it).use { outputStream ->
                        outputStream?.write(decodedData)
                    }
                    Toast.makeText(this, "File Saved: $fileName", Toast.LENGTH_SHORT).show()
                } ?: run {
                    Toast.makeText(this, "Failed to create file", Toast.LENGTH_SHORT).show()
                }
            } else {
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val file = java.io.File(downloadsDir, fileName)
                java.io.FileOutputStream(file).use { outputStream ->
                    outputStream.write(decodedData)
                }
                Toast.makeText(this, "File Saved to Downloads: ${file.absolutePath}", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Save Error: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == CAMERA_PERMISSION_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                webView.reload()
            }
        }
    }

    override fun onPause() {
        super.onPause()
        webView.evaluateJavascript("if(typeof stopCamera === 'function') stopCamera();", null)
        webView.onPause()
        webView.pauseTimers()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        webView.resumeTimers()
    }

    override fun onDestroy() {
        webView.evaluateJavascript("if(typeof stopCamera === 'function') stopCamera();", null)
        webView.destroy()
        super.onDestroy()
    }
}
