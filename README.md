# NeoSapients Enterprise AI Cognition Assessment

Standalone, offline Android assessment kiosk built with Astro and Capacitor. The APK bundles the complete interface and stores completed assessments in an on-device SQLite database. It does not require a Node server or internet connection.

## Ready-to-install APK

The current debug build is:

```text
artifacts/NeoSapients-Cognition-portrait-debug-v1.4.apk
```

It is signed with the standard Android debug certificate and is suitable for sideloading and device testing. Create a separately signed release build before public distribution.

## Install on an Android TV

Enable developer options and USB or wireless debugging on the TV, connect with ADB, then run:

```powershell
adb install -r .\artifacts\NeoSapients-Cognition-portrait-debug-v1.4.apk
```

The app appears in the launcher as **NeoSapients Cognition**. It supports Android 7.0 / API 24 and later, is locked to portrait (including the Android 16 large-screen compatibility mode), and supports touch as well as D-pad, Select, Back and the Android keyboard.

## On-device behavior

- Assessment questions, scoring, results, imagery, fonts and attract-mode video are bundled in the APK.
- Completed submissions are validated in JavaScript and written transactionally to native SQLite.
- A valid work email is required before a result can be displayed or saved.
- The app does not request internet access.
- After 30 seconds of inactivity on any screen, the square attract video starts and loops continuously; any remote or pointer action, including the video CTA, returns to the home screen with a fresh assessment.
- The Android Back button moves backward through the assessment. From the result it clears the session and returns to the start.
- PDF generation is intentionally not included.

### Response dashboard

Hold **Select** on the NeoSapients logo for about two seconds to open the local response dashboard. The dashboard supports search, response details, summary statistics and CSV export.

On Android 10 / API 29 and later, exports are saved to:

```text
Downloads/NeoSapients/
```

Older supported Android versions use the app's external documents directory. The dashboard displays the resulting path.

Assessment records remain private to the installed application. Updating the APK with `adb install -r` retains them; uninstalling the app deletes its SQLite database. Export the CSV before uninstalling or clearing app data.

## Browser development

Requirements: Node.js 22.12 or later.

```powershell
npm install
npm run dev
```

Open `http://localhost:4321`. Browser development uses local storage as a fallback for saved responses. Open `/admin/` for the development dashboard. Add `?preview` to inspect the assessment without saving a response.

## Build the Android project

Requirements:

- Node.js 22.12 or later
- Android Studio with Android SDK 36
- Java 21, including the JDK bundled with Android Studio

Build and copy the web bundle into the Android project:

```powershell
npm install
npm run android:sync
```

Build a debug APK:

```powershell
cd android
.\gradlew.bat assembleDebug
```

The generated APK is written to:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Or open the native project in Android Studio:

```powershell
npm run android:open
```

## Before deployment

- Complete one full scored assessment and confirm it appears in the dashboard.
- Complete the priority-only route and confirm no score is fabricated.
- Restart the app and confirm both records remain available.
- Export a CSV and verify it opens with all expected columns.
- Test every screen using only the TV remote.
- Confirm the Android keyboard works for name and company entry.
- Let the kiosk idle and confirm the attract video starts and exits correctly.
- Create and securely store a release signing key before distributing a production APK.
