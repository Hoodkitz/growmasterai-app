import type { ExpoConfig } from "expo/config";
// Environment variables are loaded automatically by Expo

const env = {
  appName: "GrowMaster AI",
  appSlug: "growmaster-app",
  scheme: "growmasterai",
  iosBundleId: "com.growmaster.app",
  androidPackage: "com.growmaster.app",
};

// Monoton steigender versionCode je Build (Minuten seit Epoch, ca. 29 Mio.),
// ueberschreibbar per ANDROID_VERSION_CODE.
const androidVersionCode =
  Number(process.env.ANDROID_VERSION_CODE) || Math.floor(Date.now() / 60000);

// Store build (EXPO_PUBLIC_STORE_MODE=1): no radar, so no location; no voice input, no recording.
// Fewer permissions keep the Play Data safety form and the permission review simple.
const storeMode =
  process.env.EXPO_PUBLIC_STORE_MODE === "1" ||
  process.env.EXPO_PUBLIC_STORE_MODE?.toLowerCase() === "true";
const STORE_BLOCKED_PERMISSIONS = [
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.RECORD_AUDIO",
  "android.permission.SYSTEM_ALERT_WINDOW",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  // No audio or video playback features, so no media foreground service (needs a Play declaration).
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
  "android.permission.MODIFY_AUDIO_SETTINGS",
];

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  runtimeVersion: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  owner: "growmasterai",
  extra: {
    eas: {
      projectId: "107675ed-cb12-4ace-a851-8113f28add85",
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#0A0F0D",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    versionCode: androidVersionCode,
    permissions: ["POST_NOTIFICATIONS"],
    ...(storeMode ? { blockedPermissions: STORE_BLOCKED_PERMISSIONS } : {}),
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-camera",
      {
        cameraPermission:
          "Allow $(PRODUCT_NAME) to access your camera for plant diagnosis.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Allow $(PRODUCT_NAME) to access your photos for plant diagnosis.",
        cameraPermission:
          "Allow $(PRODUCT_NAME) to access your camera for plant diagnosis.",
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Allow $(PRODUCT_NAME) to use your location to find growshops near you.",
      },
    ],
    [
      "expo-audio",
      {
        microphonePermission:
          "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#0A0F0D",
        dark: {
          backgroundColor: "#0A0F0D",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 24,
        },
      },
    ],
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme:
          "com.googleusercontent.apps.824654272024-pamt0fdjln1o6imm97sttuflf0secn89",
        webClientId:
          "824654272024-v2aqku5lr4t7ldqqsrdtr1n9bn60g6hn.apps.googleusercontent.com",
        android: {
          googleServicesFile: "./android/app/google-services.json",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
