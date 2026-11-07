# Smart Manager Android Debug APK — Physical Device Validation Protocol

## Scope and Safety

This protocol tests the existing debug APK against `https://menejajanja.vercel.app` without creating, editing, or deleting production records. Use an approved test account or an existing account only for **sign-in, navigation, and read-only verification**. Do not submit forms, create invoices, send notifications, upload files, make payments, or change profile, subscription, tenant, or company settings during this test.

## Install on Your Windows Computer

The phone must be connected to the same computer running the following commands. Install Android Platform Tools from the Android developer site, enable **Developer options → USB debugging**, select **File transfer** if prompted, and accept the RSA key prompt on the phone.[1]

```powershell
adb devices -l
# Expected: one device ending in "device", not "unauthorized" or "offline".

adb install -r "C:\path\to\app-debug.apk"
adb shell monkey -p tz.smartmanager.erp 1
```

If a previous build uses the same package ID but cannot be replaced, remove only the local debug app from the test phone and reinstall it:

```powershell
adb uninstall tz.smartmanager.erp
adb install "C:\path\to\app-debug.apk"
```

Uninstalling the debug wrapper does not change the Smart Manager production database, users, or Vercel deployment. It can remove the device-local Chrome/TWA wrapper state, so do this only on the approved test phone.

## Authentication and Session Test

1. Open **SMART MANAGER** and confirm it reaches the Vercel production route, not the former Manus host.
2. Sign in yourself using an approved test account. Do **not** send credentials, OTPs, passkeys, recovery links, or session tokens in chat.
3. Confirm that `/app` reaches the expected authenticated workspace and that safe read-only navigation works.
4. Close the app completely, reopen it, and confirm the intended session behavior. Record whether the user remains signed in or is returned to the normal sign-in flow.
5. If OAuth or passkey sign-in is enabled, test only with the approved account and note whether the browser callback returns to the application. Do not enroll, remove, or modify passkeys.

## Offline Transition Test

1. While on a non-sensitive, read-only workspace screen, enable **Airplane mode** or turn off both Wi-Fi and mobile data.
2. Reopen the app and navigate only to previously loaded, read-only screens. Observe the message, cached content, and retry behavior.
3. Do not attempt any write, payment, file, data-export, or external integration workflow while offline.
4. Restore network connectivity and confirm that the app returns to the normal authenticated route without retrying a transaction.

The wrapper is online-first: it loads the Vercel application and does not add a native offline database. The expected result is either browser/PWA cache for previously loaded resources or a clear network/retry state, not guaranteed offline access to the ERP workspace.

## Evidence to Return

Return the following non-sensitive evidence for analysis: Android version and phone model; `adb devices -l` output with serial number redacted; app launch screenshot; sign-in completion or expected authentication screen screenshot; post-relaunch session result; offline screen screenshot; and the output below.

```powershell
adb logcat -d | Select-String -Pattern "Smart Manager|TrustedWebActivity|chromium|net::ERR|Supabase" | Select-Object -Last 120
```

Before sharing screenshots or logs, remove any email address, phone number, customer/patient data, authorization header, token, tenant identifier, or other personal or confidential information.

## Pass Criteria

| Test | Pass condition |
|---|---|
| Installation | APK installs and launches as package `tz.smartmanager.erp`. |
| Production routing | Wrapper opens `https://menejajanja.vercel.app` and retains current PWA/API behavior. |
| Authentication | Approved user completes the existing flow without credentials entering the build or chat. |
| Session | Restart behavior matches the existing web application’s intended session policy. |
| Offline | App behaves safely, shows a clear offline/network state or cache behavior, and performs no unintended writes. |
| Recovery | Restoring connectivity returns the user to the normal authenticated path without duplicate activity. |

## Reference

[1]: https://developer.android.com/tools/adb "Android Developers: Android Debug Bridge"
