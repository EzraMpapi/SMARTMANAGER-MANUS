# Smart Manager Mobile Authentication Release Evidence

This evidence log records browser-available acceptance work against the mobile authentication matrix. It is intentionally sanitized: it contains no credentials, access tokens, recovery links, account identifiers, or raw screenshots with user information.

| Date | Environment | Matrix scenario | Result | Evidence summary |
|---|---|---|---|---|
| 2026-08-16 | Browser-based mobile viewport, 375 × 812 | Baseline sign-in composition | Pass | Official uploaded logo, credential form, Remember Me control, recovery link, provider controls, and language selector remain visible and usable in portrait layout. |
| 2026-08-16 | Browser-based mobile viewport, 375 × 812 | M-05 Google cancellation recovery | Pass | Google-specific error and recovery panel display **Try Google again** and **Use email instead** without hiding credential fallback. |
| 2026-08-16 | Browser-based mobile viewport, 375 × 812 | M-06 Microsoft cancellation recovery | Pass | Microsoft-specific error and recovery panel display the correct provider name and matching retry action. |
| 2026-08-16 | Browser-based mobile viewport, 375 × 812 | M-07 Apple cancellation recovery | Pass | Apple-specific error and recovery panel display the correct provider name and matching retry action. |
| 2026-08-16 | Automated regression suite | Session-storage and provider routing contracts | Pass | Regression coverage verifies session-only storage resolution and cleanup, provider-preserving callback routes, retry selection, and email fallback structure. |

## Physical-device acceptance still required

The browser-based viewport checks do not replace physical-device behavior. The following scenarios remain **pending** and must be recorded in `MOBILE_AUTH_TEST_MATRIX.md` with a dedicated test account and sanitized evidence:

| Device category | Required scenarios | Status |
|---|---|---|
| Android Chrome | M-01 through M-11, including closing the entire browser after M-02 | Pending physical device |
| Android manufacturer browser | M-02, M-04 through M-09 | Pending physical device |
| iPhone Safari | M-01 through M-11, including Home Screen web app where installed | Pending physical device |
| iPhone Chrome | M-02, M-04 through M-09 | Pending physical device |

## App-icon release gate

The current horizontal official logo remains unchanged. Android launcher and iOS Home Screen acceptance are blocked until the brand owner supplies the approved **1024 × 1024 square Smart Manager app-icon export** described in `SQUARE_APP_ICON_HANDOFF.md`. No substitute icon has been created, cropped, recoloured, or inferred.
