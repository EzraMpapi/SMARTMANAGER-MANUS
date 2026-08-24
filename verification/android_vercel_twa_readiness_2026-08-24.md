# Android TWA and Vercel Origin Readiness

## Verified public web boundary

On 24 August 2026, `https://menejajanja.vercel.app/manifest.webmanifest` returned the Smart Manager PWA manifest directly. Its application identity, root start URL and standalone display mode match the project-owned manifest.

The same Vercel origin responded successfully at `/api/config/public`, confirming that the Android wrapper can use the production application and its server-side runtime configuration boundary from one HTTPS origin. No configuration values are retained in this verification record.

The managed development preview serves the updated manifest with the same-origin `/brand/smart-manager-logo.png` path. Vercel proxies only that path to the verified managed Smart Manager logo object. This prevents the Vercel application shell from being returned where Android expects `image/png`, without committing a local image copy to the repository. The source change is therefore ready for the next verified Vercel deployment; the currently live Vercel manifest will retain its prior icon path until that deployment completes.

## Required release ownership steps

`https://menejajanja.vercel.app/.well-known/assetlinks.json` currently returns the application 404 response. This is expected until the organization provides the final Android signing certificate SHA-256 fingerprint. No placeholder Digital Asset Links file is published because it would not establish a valid Android-to-origin association.

The Android TWA template now targets the Vercel origin. Its normal password and approved-provider flows use the production web app and same-origin API boundary. Passkey enrollment on the Vercel origin remains intentionally disabled until an authorized Supabase operator adds that origin to the configured WebAuthn relying-party settings; existing passkeys are not migrated or invalidated by this packaging change.
