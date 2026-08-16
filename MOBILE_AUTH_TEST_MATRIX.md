# Smart Manager Mobile Authentication Test Matrix

This matrix is the release-acceptance checklist for Smart Manager authentication on physical mobile devices. It covers the real credential and OAuth return paths, the deliberate distinction between a remembered device and a session-only login, and the recovery experience for cancelled provider authorization.

> Use dedicated test accounts. Do not record passwords, access tokens, recovery links, or session identifiers in the evidence log.

## Test environments

| Environment | Minimum coverage | Notes |
|---|---|---|
| Android Chrome | One current Android device in portrait mode | Verify browser and installed-PWA behavior separately when available. |
| Android manufacturer browser | One current Samsung Internet or equivalent device | Confirm redirect handling and persistent versus session-only storage. |
| iPhone Safari | One current iPhone in portrait mode | Verify the web route and the Home Screen web app if installed. |
| iPhone Chrome | One current iPhone browser session | Confirm the same provider return and recovery actions are readable. |
| Network | Wi-Fi and one cellular-network run | Do not expect the app to preserve an incomplete OAuth attempt through an offline interruption. |

## Core end-to-end scenarios

| ID | Scenario | Steps | Expected result | Evidence |
|---|---|---|---|---|
| M-01 | Password login with Remember Me | Select **Remember me**, sign in with a dedicated password account, reload the app. | The dashboard opens after reload with the authenticated tenant-aware workspace. | Device, browser, result, timestamp. |
| M-02 | Session-only password login | Clear the checkbox, sign in, reload in the same browser tab, then close the browser completely and reopen `/app`. | Reload in the same tab remains authenticated; reopening after the browser closes returns to the sign-in page. | Device, browser, both outcomes, timestamp. |
| M-03 | Sign out cleanup | Sign in in either mode, use the application sign-out control, then reopen `/app`. | The sign-in page appears; neither remembered nor session-only tokens leave the dashboard reachable. | Device, mode, result, timestamp. |
| M-04 | Google success | Select **Google**, complete consent with a test account, and wait for the callback. | Google returns through Supabase to Smart Manager; the tenant-aware dashboard loads. | Provider, account alias, callback result. |
| M-05 | Google cancellation | Select **Google**, cancel or decline at the provider, and return to Smart Manager. | The Google-specific recovery panel shows **Try Google again** and **Use email instead**. | Screenshot with no personal data. |
| M-06 | Microsoft cancellation | Select **Microsoft**, cancel or decline at the provider, and return. | The Microsoft-specific recovery panel names Microsoft and preserves the email-password fallback. | Screenshot with no personal data. |
| M-07 | Apple cancellation | Select **Apple**, cancel or decline at the provider, and return. | The Apple-specific recovery panel names Apple and preserves the email-password fallback. | Screenshot with no personal data. |
| M-08 | Provider retry | From each provider recovery panel, select the retry action. | The browser starts the same provider authorization route again; it does not switch providers. | Provider and destination domain. |
| M-09 | Email fallback | From each provider recovery panel, select **Use email instead**. | The panel dismisses, credential fields remain usable, and no account data is changed. | Provider and result. |
| M-10 | Kiswahili UI | Set the sign-in language selector to Kiswahili, then repeat one provider cancellation. | The recovery title, action labels, and fallback guidance are displayed in Kiswahili. | Screenshot with no personal data. |
| M-11 | Password recovery | Open password recovery, submit a dedicated test address, and return to sign-in. | The neutral recovery confirmation appears without revealing whether the address exists. | Result only; do not retain the recovery link. |

## App-icon acceptance gate

The existing horizontal official logo remains unchanged. Before testing Android launcher or iOS Home Screen icon quality, obtain the approved **1024 × 1024 square Smart Manager app-icon export** described in `SQUARE_APP_ICON_HANDOFF.md`. Do not crop, recolour, recreate, or infer an icon from the horizontal uploaded artwork.

| Gate | Pass condition |
|---|---|
| Brand asset | The brand owner supplies an approved square export with transparent background and approved mark safe area. |
| PWA manifest | The managed icon URL, 1024×1024 size, and `any maskable` purpose are verified after deployment. |
| Android | The icon is clear on both circular and rounded-square launcher masks. |
| iOS | The icon is clear when installed to the Home Screen and retains adequate contrast. |

## Evidence and release decision

Record only the device model, operating-system version, browser version, scenario ID, pass/fail result, timestamp, and sanitized screenshot reference. A release is ready for mobile authentication when all applicable core scenarios pass on Android Chrome and iPhone Safari, provider cancellation scenarios show the correct named recovery panel, and no session-only login survives closing the browser.
