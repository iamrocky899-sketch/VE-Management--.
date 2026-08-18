# ProGuard / R8 rules for VE Management

# Keep JavaScript Interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keepclassmembers class com.itdept.itghss.MainActivity$WebAppInterface {
    public *;
}

# Keep Google API Client and models
-keep class com.google.api.services.drive.** { *; }
-keep class com.google.api.services.calendar.** { *; }
-keep class com.google.api.client.** { *; }
-keep class com.google.gson.** { *; }

# Preserve line number information for debugging stack traces
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod