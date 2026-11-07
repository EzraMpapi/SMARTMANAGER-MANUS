# SMART MANAGER v1.0.0 — Announcement Email and Changelog

> **Communication status:** Use this draft only with the release-status language preserved. The current artifacts are suitable for controlled evaluation: Windows is portable and unsigned; Android is debug-signed. Do not describe either as a production-signed installer or Google Play release.

## Announcement Email

**Subject:** SMART MANAGER v1.0.0 is ready for controlled desktop and Android evaluation

**Preheader:** Installable SMART MANAGER packages are available with integrity checks and clear platform guidance.

Hello,

We are pleased to share **SMART MANAGER v1.0.0**, the first installable packaging release for the SMART MANAGER workspace. This release makes the existing application available as a Windows desktop package and an Android package while retaining the same live application experience, existing routes, secure session behavior, responsive workspace, and connected business modules.

The release is designed for **controlled evaluation**. The Windows x64 download is a portable Electron package that can be extracted and started from `Smart Manager.exe`. The Android download is a debug-signed Trusted Web Activity package targeting the SMART MANAGER production origin. Both packages remain online-first and continue to use the established web application, authentication flow, and API behavior.

The v1.0.0 application update also introduces a more focused enterprise dashboard experience for executive users. It brings together data-bound key indicators, financial movement, attention items, approvals, recent activity, and quick actions in a clearer responsive workspace. The supporting dashboard shell improves desktop module navigation while preserving existing role, subscription, authentication, and company-scope controls.

Before installation, please download `SHA256SUMS.txt` and verify the checksum of the selected file. This confirms that the downloaded package matches the published release asset.

Please note the current distribution status. The Windows package is unsigned, so Windows may display a publisher or SmartScreen warning. The Android APK is debug-signed for controlled testing and is not intended for Google Play distribution. Production-signed Windows and Android builds will follow after organization-controlled signing and platform verification are complete.

Thank you for evaluating SMART MANAGER v1.0.0. Please share installation feedback, authentication observations, and workflow feedback through the established support channel.

Regards,
**The SMART MANAGER Team**

## Changelog

## v1.0.0 — Controlled Evaluation Release

### Added

- Added a Windows x64 portable Electron package for the existing SMART MANAGER application. The shell keeps browser storage persistent, uses sandboxed navigation, and opens the established production application rather than introducing a separate data store or backend.
- Added an Android debug APK based on a Trusted Web Activity configuration targeting `menejajanja.vercel.app`.
- Added release integrity materials: a SHA-256 manifest and release instructions for the Windows ZIP and Android APK.
- Added an executive dashboard overview that combines existing workspace inputs into KPI cards, financial movement, attention items, approvals, activity, and quick actions without new backend requests or fabricated business metrics.
- Added focused dashboard contract coverage for executive-role scope, supplied data inputs, existing navigation callbacks, and the no-fabrication boundary.
- Added dashboard audit, validation, architecture, and presentation materials to document the implementation and protected-workspace verification boundary.

### Changed

- Refined the protected workspace shell with a persistent desktop sidebar at large viewports, an overlay sidebar below that breakpoint, a taller desktop header, and preserved existing mobile navigation.
- Improved the executive workspace’s responsive information architecture while retaining role-specific alternative home views for financial, HR, sales, operations, focused, and minimal experiences.
- Preserved existing routes, Supabase authentication/session behavior, tRPC and API contracts, company scoping, subscription restrictions, role-based controls, and offline write-pause behavior.
- Corrected Android wrapper production-origin configuration and added documented desktop and Android packaging workflows.

### Validation

- Verified Windows ZIP and Android APK archive structures before preparing the release checksums.
- Passed focused dashboard and button-action validation: **5 test files / 15 tests**.
- Passed TypeScript validation with `pnpm check`.
- Confirmed the dashboard redesign does not expose the protected workspace without an existing secure session. The authenticated visual-review gate remains intentionally separate from public release packaging.

### Known Limitations and Release Status

- **Windows:** The current package is a portable, unsigned ZIP. It is not a signed Windows installer. Windows may show a SmartScreen or publisher warning.
- **Android:** The current APK is debug-signed for controlled testing. It is not a Play Store or production-signed Android release.
- Both packages are online-first and do not add an independent offline data store.
- Final acceptance testing remains for Windows login/OAuth/notification flows and for production-signed Android Trusted Web Activity/app-link verification.

### Upgrade Path to a Production-Signed Release

- Sign the Windows installer through a protected organization-controlled code-signing process.
- Build Android with an organization-controlled release keystore and publish the final certificate fingerprint through `/.well-known/assetlinks.json` on the production domain.
- Complete representative-device acceptance testing before describing the packages as general-availability production releases.
