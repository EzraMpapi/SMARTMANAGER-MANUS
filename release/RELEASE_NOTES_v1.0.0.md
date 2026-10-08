# SMART MANAGER v1.0.0

> **Release status:** Draft packaging release. This publication contains a portable, unsigned Windows x64 package and a debug-signed Android APK for controlled evaluation. It is not yet a production-signed desktop or Android release.

## Overview

SMART MANAGER v1.0.0 packages the existing SMART MANAGER web application as installable desktop and Android shells. The application continues to use the production web origin at `https://menejajanja.vercel.app`, preserving the existing application routes, browser-session behavior, Supabase authentication flow, same-origin API requests, and responsive workspace interface. The packages do not embed, copy, or alter production data.

## Release assets

| Asset | Platform | Size | Distribution status | SHA-256 |
|---|---:|---:|---|---|
| `Smart-Manager-Windows-x64-unsigned.zip` | Windows x64 | 134,217,204 bytes | Portable Electron bundle; unsigned | `2290215bcfb16740ca8f34e3b0540c5891b04a945e55a4866de7af058aa44194` |
| `app-debug.apk` | Android | 7,351,400 bytes | Debug-signed Trusted Web Activity package | `11679197de69a4e2e9d78c1e19ed128eef4dbb335d714a1f93b96054dc6241d8` |
| `SHA256SUMS.txt` | All platforms | — | Integrity manifest for the two release binaries | — |

## What is included

The Windows package is a portable Electron shell with persistent browser storage and sandboxed navigation. Extract the archive on a 64-bit Windows computer and start `Smart Manager.exe` from the extracted folder. The package remains online-first and opens the existing SMART MANAGER production application.

The Android package is a debug-signed Trusted Web Activity that targets the SMART MANAGER production origin. It preserves the installed Chrome profile and the web application’s existing mobile layouts, browser-storage behavior, authentication flow, and API configuration.

## Verify the download

Before installing, compare the SHA-256 value of each downloaded file with `SHA256SUMS.txt`.

On Windows PowerShell:

```powershell
Get-FileHash .\Smart-Manager-Windows-x64-unsigned.zip -Algorithm SHA256
Get-FileHash .\app-debug.apk -Algorithm SHA256
```

On macOS or Linux:

```bash
sha256sum Smart-Manager-Windows-x64-unsigned.zip app-debug.apk
```

The Windows ZIP and Android APK archive structures were checked successfully before this manifest was generated.

## Important installation and signing notices

### Windows

The Windows archive is **unsigned**. Windows may show a SmartScreen or publisher warning because no organization-controlled code-signing certificate has been applied. Install only after independently verifying the checksum and source. A production Windows release requires a code-signing certificate and protected signing configuration; certificate files and passwords must never be committed.

The archive is portable. An NSIS installer is not included in this release because the Linux build environment did not complete the installer-only verification step under Wine. A production installer can be generated on Windows or in a properly configured signing runner.

### Android

The Android APK is **debug-signed** and is intended for controlled testing or sideloaded evaluation, not Google Play distribution. Device installation may require enabling installation from the selected file source. Do not use the debug signing key for a public production release.

A production Android release requires an organization-controlled keystore, a release build, and the final release certificate SHA-256 fingerprint published in `/.well-known/assetlinks.json` on `menejajanja.vercel.app`. Those steps are necessary for full Trusted Web Activity/app-link verification.

## Known limitations

Both packages are online-first shells and do not add an independent offline data store. Existing web authentication, OAuth, notifications, file picking, and browser permissions remain subject to the behavior of the relevant platform and the production web application. Final acceptance testing is still required for login, OAuth, notifications, and Trusted Web Activity verification on representative Windows and Android devices.

## Publishing guidance

Attach only the two distributable binaries and `SHA256SUMS.txt` to the GitHub Release. Do not attach the unpacked Windows directory or Electron builder cache/archive unless there is a specific support reason. The release should be created as a draft first, reviewed, and then published after the signing and distribution status above is accepted.
