# Smart Manager authentication visual audit

## Desktop verification (1280px)

The active login route renders the official Smart Manager logo without distortion, a dark enterprise brand panel, the data-driven module showcase, and a white authentication card with appropriate hierarchy. The module showcase remains decorative and the form remains the primary action surface.

The active signup route retains the legacy green split layout and still uses the compact logo/wordmark treatment. It is functional and responsive but does not yet match the new full-logo authentication composition and module showcase used by the login route. The next implementation step is to bring the signup/workspace onboarding shell into the same reusable design system while preserving its existing three-step data flow.

## Functional notes

No console or TypeScript errors were reported by the preview health status after the new login showcase and enterprise column customizer changes. The production build and full test suite have been run separately; the initial regression assertion was updated to reflect the intentional full-logo auth change.

## Reference alignment

The provided mobile reference emphasizes a centered full brand anchor, compact mint/white authentication card, bilingual presentation, 44px-friendly controls, and a restrained green/gold palette. The login route now has the correct brand and module hierarchy; signup requires the same shell treatment.

## Directive audit

The attached directives require the exact uploaded logo, a reusable full/compact/symbol presentation, a responsive desktop visual area plus compact mobile module strip, actual ERP module names with Lucide icons, transform/opacity-only motion, reduced-motion support, accessible keyboard/focus behavior, and a unified authentication composition. The implementation now includes the reusable `AuthModuleShowcase`, official `BrandLogo` usage on login and signup, compact/mobile variants, keyboard-driven enterprise tabs, accessible column visibility menus, and a server-confirmed Workspace Settings pending state.

The authentication bootstrap retains OAuth hash capture, refresh-token recovery, tenant-aware profile resolution, invitation acceptance, and retryable workspace-resolution failures. It only clears stored auth on explicit 401/403 failures. The Settings path still persists the known company columns and protected workspace branding through the server; the new spinner prevents duplicate submits and the success toast follows server completion.

Validation checkpoint: full Vitest suite currently passes with 103 tests passed and 7 gated skips. Production build passed before the latest settings/test-only changes and will be rerun for the final checkpoint.

## Responsive verification update

The first mobile screenshot exposed a real failure: `/app?auth=signup` loaded the oversized `BusinessSphereDashboard` route and could fail with `TypeError: Failed to fetch dynamically imported module`. The fix was architectural rather than cosmetic: signup now uses a lightweight `PublicSignupGateway`, and explicit login/forgot/reset/verify screens remain on the lightweight `PublicAuthGateway` even if stale browser auth storage exists. The development service was restarted after the route correction.

A fresh 390px signup capture now renders the official full logo, compact module strip, create/join switcher, three-step progress indicator, and responsive account form without overflow or dynamic-import errors. The new signup boundary retains confirmed-account creation, tenant-safe workspace RPCs, optional company setup, module selection, success state, and direct return to sign-in.
