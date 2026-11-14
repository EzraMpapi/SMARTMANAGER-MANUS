# Smart Manager Square App-Icon Handoff

A square transparent Smart Manager mark is now prepared from the trusted source artwork and stored in the repository-managed public asset path. It preserves the recognizable interlocking S-shaped shield, removes the decorative background effects, and is exported at practical website, favicon, PWA, and Android sizes.

| Requirement | Delivered value |
|---|---|
| Primary web asset | `client/public/brand/smart-manager-logo.png` |
| PWA assets | `smart-manager-logo-192.png` and `smart-manager-logo-512.png` |
| Browser assets | `smart-manager-logo-32.png` and `smart-manager-logo-64.png` |
| Apple touch asset | `smart-manager-logo-180.png` |
| Canvas | Square PNGs with real transparent alpha |
| Content | Simplified Smart Manager mark only; no wordmark or slogan |
| Safe area | Central padding retained around the mark |
| Android source | `android/assets/smart-manager-logo.png` synchronized to the 512 × 512 primary mark |

## Integration status

The shared `BrandLogo` component now uses the local `/brand/smart-manager-logo.png` path for both full and compact variants. The browser document head declares optimized 32px, 64px, and 180px assets. The PWA manifest declares 192 × 192 and 512 × 512 PNG entries with `any` and `any maskable` purposes. The embedded Android web-app manifest declares the actual 512 × 512 dimensions.

## Release checks

Before store distribution, verify the logo on light and dark navigation surfaces, an Android rounded launcher mask, a square launcher mask, Chrome’s install prompt, and the iOS Home Screen. Keep the Android release keystore and final Digital Asset Links fingerprint outside the repository until the release owner approves them.

The asset package contains no credentials, signing material, or external storage dependency. The source PNGs were checked for valid PNG headers, expected dimensions, and transparent alpha channels.
