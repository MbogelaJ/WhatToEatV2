# Add project specific ProGuard rules here.
# For more details, see http://developer.android.com/guide/developing/tools/proguard.html

# Capacitor
-keep class com.getcapacitor.** { *; }
-keep class com.google.android.gms.** { *; }
-keep class com.google.android.gms.auth.** { *; }

# Keep Cordova
-keep class org.apache.cordova.** { *; }

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep the BuildConfig
-keep class com.whattoeat.penx.app.BuildConfig { *; }

# Keep native methods
-keepclassmembers class * {
    native <methods>;
}

# Preserve line numbers for debugging
-keepattributes SourceFile,LineNumberTable

# Hide original source file name
-renamesourcefileattribute SourceFile

# Remove logging in release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
}
