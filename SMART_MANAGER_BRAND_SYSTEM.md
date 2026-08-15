# Smart Manager Official Brand System

> **Master-artwork rule.** The uploaded Smart Manager image is the only official logo artwork in this system. The exports in the package are deterministic crops, resizes, format conversions, or embedded-source SVG wrappers; they are not a regenerated or substituted mark.

## Identity foundation

The system preserves the original hexagonal **S** shield, Tanzania flag accent, circuit-line motif, upward growth chart, and green enterprise palette. The app uses the source-derived master on marketing and document contexts, and the source-derived icon crop in compact app contexts.

```css
:root{
  --primary:#00A651;
  --secondary:#008A45;
  --dark:#101828;
  --white:#FFFFFF;
}
```

| Token | Value | Purpose |
|---|---:|---|
| `--primary` | `#00A651` | Primary actions, positive states, and brand emphasis. |
| `--secondary` | `#008A45` | Darker green hover, navigation, and supporting surfaces. |
| `--dark` | `#101828` | Enterprise body text and high-contrast interface surfaces. |
| `--white` | `#FFFFFF` | Contrast surface and wordmark support. |

## Responsive logo rules

| Context | Variant | Rule |
|---|---|---|
| Mobile navigation and compact UI | `mobile` | Use the icon only. Do not include the slogan. |
| Tablet navigation | `horizontal` | Use icon plus wordmark; keep the slogan visible only when horizontal space permits. |
| Desktop marketing and presentations | `full` | Use the complete uploaded logo with its original wordmark and slogan. |
| Android, iOS, desktop application icon | `app-icon` | Use the rounded source-derived icon at the native platform size. |
| Browser favicon | `smart-manager-favicon.ico` | Use the supplied multi-size ICO package. |
| Reports and invoices | `full` or organization logo | Use `full` for Smart Manager–branded reports. A customer company logo remains the correct option for a customer’s invoice header. |

## Asset package

| Asset | Intended use | URL |
|---|---|---|
| Official master PNG | Full logo, print-quality internal source | `/manus-storage/smart-manager-official-master_88d60979.png` |
| Full WebP | Marketing and fast web delivery | `/manus-storage/smart-manager-full_a19b3039.webp` |
| Mobile icon PNG | Icon-only navigation and splash use | `/manus-storage/smart-manager-mobile-icon_84bd91d9.png` |
| Mobile icon WebP | Optimized icon delivery in browsers | `/manus-storage/smart-manager-mobile-icon_dc820363.webp` |
| App icon 512 PNG | iOS, Android, desktop packaging source | `/manus-storage/smart-manager-app-icon-512_2c222319.png` |
| Favicon ICO | Browser tabs and bookmarks | `/manus-storage/smart-manager-favicon_a6bf2186.ico` |
| Complete asset package | PNG, WebP, ICO, and SVG exports | `/manus-storage/smart-manager-brand-kit_1a9485ac.zip` |

The package includes `16`, `32`, `48`, `64`, `72`, `96`, `128`, `144`, `180`, `192`, `256`, `512`, and `1024` pixel icon files. Its `SVG` files preserve the original source inside an SVG container; because the approved source is raster artwork, these files are source-preserving SVG wrappers rather than newly traced vector drawings.

## React implementation

The application component is located at `client/src/components/BrandLogo.tsx`. It accepts `full`, `horizontal`, `compact`, `mobile`, and `app-icon` variants and provides `tone="light"` for dark surfaces. The public navbar now switches from icon-only mobile presentation to an icon-and-wordmark desktop presentation.

```tsx
import { BrandLogo } from "@/components/BrandLogo";

<BrandLogo variant="mobile" className="h-10 w-10 md:hidden" priority />
<BrandLogo variant="horizontal" tone="light" className="hidden md:inline-flex" priority />
<BrandLogo variant="full" className="max-w-sm" />
```

The `BrandLoader` component adds the requested 2–3 second motion language: a soft S-mark rotation, sequential circuit illumination, and an upward arrow movement. It respects `prefers-reduced-motion`.

```tsx
import { BrandLoader } from "@/components/BrandLoader";

<BrandLoader label="Preparing your workspace" />
```

## Flutter implementation

Copy the branded raster files from the package into `assets/brand/`, then add the following `pubspec.yaml` declaration:

```yaml
flutter:
  assets:
    - assets/brand/smart-manager-official-master.png
    - assets/brand/smart-manager-app-icon-512.png
```

Use the accompanying `brand-kit/flutter/smart_manager_brand.dart` helper for variant-aware rendering. The Flutter splash screen should use `SmartManagerBrand.icon(size: 128)`, while a tablet or desktop app bar should use `SmartManagerBrand.horizontal()`.

## Browser, Android, iOS, email, and reports

For browser branding, `client/index.html` is already configured with the ICO favicon and 512px Apple touch icon. For native app builds, start from the 1024px PNG in the package and allow the platform toolchain to produce its required density set. Do not enlarge the 16px or 32px files for native production.

For email templates and PDF/HTML reports, use the official master image URL with an explicit, constrained height and descriptive alternative text. Keep `object-fit: contain`; never recolor, stretch, or apply a filter that changes the Tanzania accent.

```html
<img
  src="/manus-storage/smart-manager-official-master_88d60979.png"
  alt="Smart Manager — Simplify. Manage. Grow."
  style="display:block;height:44px;width:auto;max-width:180px;object-fit:contain"
/>
```

## Usage safeguards

Use the icon crop only below `160px` square or where a full lockup would be unreadable. Keep at least `12.5%` of the icon width as clear space. On dark backgrounds, use the original logo or the `horizontal` React variant with `tone="light"`; do not add glow, recolor the emblem, or remove the Tanzania accent. The customer’s own approved logo should remain the leading mark on customer-issued invoices, while the Smart Manager mark can appear in an unobtrusive footer or generated-by line.
