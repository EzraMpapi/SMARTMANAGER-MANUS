# Smart Manager Desktop and Android Packaging

Smart Manager remains the existing React/Vite application at `https://menejajanja.vercel.app`. The packages in this repository are intentionally thin installable shells: the desktop application is an Electron browser shell and Android is the existing Bubblewrap Trusted Web Activity (TWA). Both preserve the original routes, deployed assets, same-origin `/api` calls, Supabase Auth behavior, browser storage, and responsive UI rather than copying or rebuilding the web application.

## Build Outputs

| Platform | Current artifact | Status |
|---|---|---|
| Windows x64 | `release/desktop/Smart-Manager-Windows-x64-unsigned.zip` | Built and structurally validated. Extract and run `Smart Manager.exe` on Windows. It is unsigned. |
| Android | `android/app/build/outputs/apk/debug/app-debug.apk` | Built successfully as a debug APK. It targets the Vercel production origin. |

The Electron Builder NSIS installer stage was attempted from Linux. The executable bundle was produced, but the local Wine environment lacked the 32-bit runtime required to complete the installer-only verification step. The portable archive is therefore the delivered Windows artifact. On Windows, or a Linux runner with complete Wine support, `pnpm desktop:build` generates `release/desktop/Smart-Manager-Setup-1.0.0.exe`.

## Development and Build

```bash
pnpm install
pnpm check

# Launch the desktop shell against the production app.
pnpm desktop:dev

# Optional: point a test shell only at an approved HTTPS deployment.
SMART_MANAGER_APP_URL=https://menejajanja.vercel.app/app pnpm desktop:dev

# Build a Windows x64 NSIS installer (run on Windows or a configured Linux CI runner).
pnpm desktop:build

# Build Android debug APK. An Android SDK and JDK are required.
ANDROID_HOME=/path/to/android-sdk ANDROID_SDK_ROOT=/path/to/android-sdk pnpm android:debug
```

The full `pnpm build` includes the application’s existing live Supabase-schema gate. It deliberately refuses to run without deployment-only Supabase credentials. This packaging work does not add those secrets. Use the existing protected deployment environment for that full server build; the client-only Vite compile and the Android packaging regression test remain suitable local checks.

## Release Signing

### Windows

The current Windows artifact is intentionally **unsigned**. A release-signed installer requires an organization-controlled code-signing certificate and private-key access through the approved signing process. For a PFX-based build, configure Electron Builder’s documented signing environment such as `CSC_LINK` and `CSC_KEY_PASSWORD` only in the protected CI/signing environment; never commit a certificate, password, or token.

### Android

The delivered APK is **debug-signed**. To create a release-signed APK, generate or obtain an organization-controlled Android keystore, then place these values in an untracked `android/gradle.properties` or protected CI secret store:

```properties
releaseStoreFile=/absolute/path/to/smart-manager-release.jks
releaseStorePassword=replace-in-secret-store
releaseKeyAlias=smartmanager
releaseKeyPassword=replace-in-secret-store
```

Run `pnpm android:release`. For full TWA presentation rather than Custom Tabs fallback, publish the SHA-256 fingerprint of the final release certificate in the Vercel-hosted `/.well-known/assetlinks.json` file for `menejajanja.vercel.app`. The repository’s Android template intentionally contains no key material or certificate fingerprint.[1] [2]

## Platform Limitations and Validation

| Area | Desktop Electron | Android TWA |
|---|---|---|
| Connectivity and offline use | Online-first; it loads the Vercel application and does not add an offline data store. | Online-first; Chrome displays the Vercel PWA/TWA. |
| Authentication and OAuth | Persistent Chromium partition preserves cookies and web storage. OAuth starts in a sandboxed popup and must be acceptance-tested with each enabled provider. | Uses the installed Chrome profile. TWA verification and passkey/WebAuthn origin approval remain deployment tasks. |
| Notifications | Uses browser notifications when user permission is granted. Native background delivery is not added. | Notification delegation is configured but requires verified Chrome/TWA behavior and the existing web push capability. |
| Deep links | No custom `smartmanager://` protocol is added; app-origin navigation stays in the shell and external HTTPS links use the system browser. | HTTP(S) app-link ownership needs the final release certificate asset link. |
| Files | Existing browser upload/download flows remain in force. No unrestricted native filesystem API is exposed. | Existing Android/Chrome picker permissions apply; no new storage permission is requested. |
| Runtime verification | Syntax, packaging structure, and production-origin configuration were checked. Final login/OAuth/notification acceptance requires a Windows machine. | Debug APK and packaging regression test passed. Final release and TWA verification require a signed install on Android with Digital Asset Links deployed. |

## Files Changed

| File or directory | Purpose |
|---|---|
| `desktop/main.mjs` | Sandboxed Electron browser shell with persistent storage and origin-aware navigation. |
| `desktop/preload.mjs` | Minimal, context-isolated desktop capability marker. |
| `desktop/electron-builder.yml` | Windows x64 NSIS installer configuration. |
| `android/app/build.gradle` | Corrected existing Android wrapper to `menejajanja.vercel.app`. |
| `twa-manifest.json` | Corrected Android host, icon, manifest, and scope URLs. |
| `package.json`, `pnpm-workspace.yaml` | Adds packaging commands and Electron dependencies with a limited lifecycle allowlist. |
| `.env.example` | Documents the non-secret optional desktop target URL. |
| `docs/INSTALLABLE_PACKAGING_ARCHITECTURE.md` | Architecture and auth/session rationale. |

## References

[1]: https://developer.chrome.com/docs/android/trusted-web-activity/quick-start "Chrome for Developers: Trusted Web Activity quick start"

[2]: https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2 "Android Developers: Trusted Web Activities"
