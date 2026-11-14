# Sidebar and Profile Menu Browser Simulation

**Date:** 25 August 2026  
**Target:** `https://menejajanja.vercel.app/app`  
**Method:** Playwright-driven browser captures without entering credentials or performing mutations.

## Desktop and tablet entry observations

| Viewport | Result | Visual observation |
|---|---|---|
| Desktop — 1440×960 | Public authentication entry rendered | Two-column entry layout remained within the viewport; branding, form controls, OAuth options, and language control remained readable with no visible clipping. |
| Tablet — 768×1024 | Public authentication entry rendered | The authentication experience switched to a stacked single-column presentation; form fields, password visibility control, passkey entry, social providers, and language control remained visible and reachable. |

No existing authenticated session was available in the browser. The protected dashboard, and therefore the runtime sidebar/profile controls, were not entered because bypassing the tenant-aware authentication boundary would be unsafe.

## Protected-dashboard evidence available without sign-in

The source-backed `dashboardShellInteraction.contract.test.ts` passed. It confirms the desktop left rail is sticky, the command bar is sticky and labeled, narrow-width nonessential top-bar controls are hidden responsively, and the active profile menu has outside-click and Escape dismissal but no fixed page-covering overlay.

## Mobile entry observation

| Viewport | Result | Visual observation |
|---|---|---|
| Mobile — 375×812 | Public authentication entry rendered | The narrow layout retained readable labels, full-width email/password inputs, password visibility control, Remember Me, recovery, passkey, social-provider, workspace-creation, and language controls. No horizontal clipping was visible in the captured entry state. |

The current authentication gate prevents direct runtime clicking of the protected dashboard sidebar and profile menu without a signed-in test session. The source-backed interaction contract remains the safe evidence for those protected controls in this run.
