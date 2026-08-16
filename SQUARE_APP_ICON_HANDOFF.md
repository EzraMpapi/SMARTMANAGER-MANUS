# Smart Manager Square App-Icon Handoff

The current uploaded official Smart Manager logo is intentionally used **unchanged** throughout the application. Its 3:2 horizontal composition is appropriate for authentication branding, browser sharing metadata, and the current standard PWA icon surface; it is not appropriate to crop, stretch, or mask into a square launcher icon.

> Provide one approved square Smart Manager app-icon export before replacing the PWA icon. The export must be supplied as an official brand asset, not generated or reconstructed from the current horizontal artwork.

| Requirement | Handoff specification |
|---|---|
| File type | Transparent PNG or WebP |
| Canvas | 1024 × 1024 pixels; square, with no added coloured frame |
| Content | The approved simplified Smart Manager mark only; no cropped wordmark or slogan |
| Safe area | Keep the mark within the central 72% of the canvas to support Android adaptive-icon masking |
| Colour | Preserve the approved Tanzania flag accent, green mark, circuit detail, and upward-growth concept exactly as delivered by the brand owner |
| Naming | `smart-manager-app-icon-1024.png` |

## Safe replacement procedure

1. Store the supplied square export in `/home/ubuntu/webdev-static-assets/` and upload it through managed web asset storage.
2. Update the `icons[0]` entry in `client/public/manifest.webmanifest` to the new managed URL, with `sizes` set to `1024x1024` and `purpose` set to `any maskable`.
3. Update the browser favicon and Apple touch icon references in `client/index.html` only if the supplied square export is approved for those uses.
4. Rebuild the web application, refresh the Android Trusted Web Activity project, and regenerate its launcher assets before signing a production Android App Bundle.
5. Verify the result on a rounded Android launcher mask, a square Android launcher mask, Chrome install prompt, and iOS Home Screen.

No square asset has been fabricated, cropped, recoloured, or inferred from the uploaded horizontal logo.
