# Smart Manager Installable Packaging Architecture

## Existing Application Inspection

The cloned application is a **React 19 + Vite 7** client with Wouter client-side routes, Tailwind, React Query, tRPC, Supabase Auth, and an Express/Vercel API layer. The Vite build outputs the browser client to `dist/public`, while the server and API bundles are generated under `dist`. The application’s primary routes are `/`, `/app`, and `/patient/sms-preferences`; `/app` selects the existing public authentication gateway or the protected workspace using browser session state.

The client calls same-origin `/api/trpc` with `credentials: include`. When browser cookies are unavailable, it forwards the existing local/session-storage Supabase token through the established authorization headers. Public Supabase configuration is supplied through `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` at build time or the existing same-origin `/api/config/public` fallback. The production deployment is Vercel-based at `https://menejajanja.vercel.app`, whose origin also owns the API, web manifest, routing, and authentication callback surface.

## Packaging Choice

| Platform | Chosen architecture | Why it fits this application |
|---|---|---|
| Windows desktop | **Electron remote-origin shell** | Preserves the current Vercel same-origin application, `/api` behavior, Supabase cookies, local/session storage, and existing React routes without duplicating the UI or packaging a second server. Electron is the practical choice because the codebase is already JavaScript/TypeScript and the wrapper can use the current Node toolchain. |
| Android | **Existing Bubblewrap Trusted Web Activity (TWA)** | The repository already contains a production-oriented Android Browser Helper project. A TWA runs the verified PWA at the Vercel origin rather than introducing a WebView-specific authentication layer. It is more compatible with the existing same-origin API and browser authentication model than an unnecessary Capacitor rewrite. |

> Both wrappers are deliberately thin. They do not copy the web UI, embed Supabase service credentials, modify production data, or change Vercel/Supabase configuration.

## Authentication and Session Handling

Electron uses a persistent Chromium partition named `persist:smart-manager`; this retains normal web cookies, local storage, session storage, and service-worker behavior between launches. Node integration remains disabled, context isolation and sandboxing remain enabled, and application windows are restricted to the Vercel application origin. Supabase OAuth starts in a separate sandboxed Electron window that shares the same persistent browser partition and can return to the existing application callback origin. External non-auth links open in the default system browser.

Android remains a TWA using Chrome/Custom Tabs and the Vercel production origin. It inherits the installed Chrome profile’s authentication behavior. Full Trusted Web Activity mode requires a release certificate fingerprint in `/.well-known/assetlinks.json`; without it, the app’s explicit Custom Tabs fallback is expected.

## Environment Handling

The wrappers require no production secrets. The optional desktop environment variable below can point a test build at an approved HTTPS deployment; it defaults to the verified Vercel production route.

```bash
SMART_MANAGER_APP_URL=https://menejajanja.vercel.app/app
```

Server-side `SUPABASE_SECRET_KEY`, payment-provider credentials, and other secrets remain deployment-only values and must never be embedded in an APK, Electron installer, desktop configuration, or committed environment file.
