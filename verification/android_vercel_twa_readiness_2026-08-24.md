# Android TWA and Vercel Origin Readiness

## Verified public web boundary

On 24 August 2026, `https://menejajanja.vercel.app/manifest.webmanifest` returned the Smart Manager PWA manifest directly. Its application identity, root start URL and standalone display mode match the project-owned manifest.

The same Vercel origin responded successfully at `/api/config/public`, confirming that the Android wrapper can use the production application and its server-side runtime configuration boundary from one HTTPS origin. No configuration values are retained in this verification record.

A subsequent no-body probe of the public Vercel origin returned `200` for `/manifest.webmanifest` with a manifest content type, `200` for `/brand/smart-manager-logo.png` with `image/png`, `200` for `/api/config/public` with JSON, and `200` for `/app` with HTML. The live manifest contains the same-origin `/brand/smart-manager-logo.png` reference. Vercel’s deployment metadata still reports its newest recorded Git deployment as `BLOCKED` and points to an older commit, so these route results are recorded as observed live behavior rather than proof that the latest `main` commit has propagated.

## Required release ownership steps

`https://menejajanja.vercel.app/.well-known/assetlinks.json` currently returns the application 404 response. This is expected until the organization provides the final Android signing certificate SHA-256 fingerprint. No placeholder Digital Asset Links file is published because it would not establish a valid Android-to-origin association.

The Android TWA template now targets the Vercel origin. Its normal password and approved-provider flows use the production web app and same-origin API boundary. Passkey enrollment on the Vercel origin remains intentionally disabled until an authorized Supabase operator adds that origin to the configured WebAuthn relying-party settings; existing passkeys are not migrated or invalidated by this packaging change.
