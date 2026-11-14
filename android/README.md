# SMART MANAGER Android application

This directory contains the Android Trusted Web Activity (TWA) wrapper for the production SMART MANAGER web application. It deliberately reuses the existing React/Vite frontend, authentication flow, Supabase tenant/RLS boundaries, server APIs, notifications, and module workspaces instead of creating a second mobile data layer.

## Application identity

| Property | Value |
|---|---|
| Application label | SMART MANAGER |
| Launcher label | SMART MGR |
| Package ID | `tz.smartmanager.erp` |
| Production origin | `https://menejajanja.vercel.app` |
| Start path | `/` |
| Supported orientation | Any |
| Minimum Android SDK | 21 |
| Target/compile SDK | 36 |
| Current source version | `2.0.0` by default, overridable with `-PappVersionName` and `-PappVersionCode` |

The launcher and maskable icon use the repository-managed transparent mark at `android/assets/smart-manager-logo.png`, synchronized with the web asset variants under `client/public/brand/`. The source is a square 512 × 512 PNG with real alpha transparency.

## Local test build

The Bubblewrap CLI and Android SDK can be installed on a clean machine with:

```bash
pnpm dlx @bubblewrap/cli@1.23.0 init \
  --manifest=https://menejajanja.vercel.app/manifest.webmanifest
```

For a local test-only signed build, keep the keystore outside the repository and provide the passwords only to the local command. The repository must never contain a keystore, signing password, `local.properties`, or `keystore.properties`.

```bash
export ANDROID_HOME="$HOME/.bubblewrap/android_sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME="$HOME/.bubblewrap/jdk/jdk-17.0.11+9"
export PATH="$JAVA_HOME/bin:$PATH"
export BUBBLEWRAP_KEYSTORE_PASSWORD='use-your-local-test-password'
export BUBBLEWRAP_KEY_PASSWORD='use-your-local-test-password'
pnpm dlx @bubblewrap/cli@1.23.0 build
```

The resulting `app-release-signed.apk` and `app-release-bundle.aab` are test artifacts when signed with a local key. They must not be uploaded to Google Play as the production identity.

## Production CI/CD

`.github/workflows/android-release.yml` runs the web quality gates, configures JDK 17 and Android SDK 36, validates required signing secrets, injects a temporary keystore into the runner, and produces versioned APK/AAB artifacts. It is triggered by a `workflow_dispatch` or a `v*` tag push.

Configure these GitHub Actions secrets before requesting a production-signed release:

| Secret | Purpose |
|---|---|
| `ANDROID_KEYSTORE_B64` | Base64 encoding of the organization-controlled release keystore |
| `ANDROID_KEY_ALIAS` | Release key alias |
| `BUBBLEWRAP_KEYSTORE_PASSWORD` | Keystore password |
| `BUBBLEWRAP_KEY_PASSWORD` | Alias key password |

These values must be stored as organization/repository secrets or an approved environment secret. Never put them in frontend `VITE_*` variables, source files, workflow literals, issue comments, or release notes.

## Digital Asset Links gate

A production TWA is trusted only after the final release certificate is known. Publish the corresponding certificate fingerprint at:

```text
https://menejajanja.vercel.app/.well-known/assetlinks.json
```

Use package ID `tz.smartmanager.erp` and the SHA-256 fingerprint of the organization-controlled release key. Do not publish a placeholder or the local test-key fingerprint. The TWA can still be built for controlled device testing before this association is deployed, but Chrome may use the fallback custom tab until the domain association is valid.

## Version and update check

The web Settings workspace includes an **About SMART MANAGER** panel. It displays the current `VITE_APP_VERSION` value (default `2.0.0` in the current repository integration), package ID, release mode, production origin, and a safe update check against the published Android manifest metadata. The update check is informational; it does not grant access, alter tenant data, or bypass subscription/RLS decisions.

The CI workflow accepts a semantic version name and positive numeric Android version code. Each release must increment the version code. The same version should be used in release notes and the generated Android package.

## Release acceptance checklist

Before production rollout, run the web typecheck and test suite, build both APK and AAB, verify package metadata and signatures, install the APK on a representative Android phone and tablet, check login/logout/recovery, confirm the normal Supabase session and tenant boundary are preserved, test deep links and notification permission behavior, verify the production Digital Asset Links response over HTTPS, and upload the AAB to Google Play internal testing before wider distribution.
