# SMART MANAGER Responsive Visual QA — 26 August 2026

## Scope

This review uses the built Vite preview served locally from `http://127.0.0.1:4174/`. It is a visual inspection of the public SMART MANAGER entry surface at representative viewport sizes. It does not claim that Vercel production is updated; production deployment remains a separate external gate.

## Desktop — 1440 × 900

The public landing surface presents a clear asymmetric command-center composition: navigation and actions remain in the header, the primary value proposition is left aligned, and the business overview illustration occupies the right side. Typography remains high contrast and the primary/secondary actions are visually distinct. The screenshot capture showed a blank white rounded square at the far-left brand position, while the responsive tablet capture below showed the actual Smart Manager mark. This is recorded as a **capture-timing or desktop asset-rendering anomaly requiring a delayed-load confirmation**, not as a confirmed production defect.

## Tablet — 768 × 1024

The actual green Smart Manager mark is visible in the rounded white brand container at the upper left. Header actions remain in one row without clipping, the headline wraps into a readable three-line hierarchy, and the three primary actions remain visible with adequate spacing. The business overview preview moves below the main content without creating horizontal overflow. The lower portion continues below the viewport naturally, which is appropriate for a tall tablet composition.

## Next visual checks

The mobile and small-mobile captures must confirm that the logo remains visible, that header controls do not clip, and that the primary action remains reachable. A delayed desktop capture should be taken to distinguish image-loading timing from a real viewport-specific asset issue. The checks should also include keyboard focus visibility and reduced-motion behavior where feasible.

**Evidence files:**

- `/tmp/smartmanager-desktop-mandate.png`
- `/tmp/smartmanager-tablet-mandate.png`

## Mobile — 390 × 844

The local mobile capture shows the actual logo clearly in the compact header container. The language, theme, passkey, and launch controls remain visible; the launch action is preserved as the dominant gold button. The headline, supporting copy, and actions stack in a readable order with generous touch spacing and no horizontal clipping. The screenshot ends before the lower illustration, so no assertion is made about the off-screen continuation.

## Small mobile — 360 × 800

The actual logo remains visible and the header continues to fit. The headline wraps into a denser but still legible composition, and the primary launch action remains full-width and reachable. The passkey action begins below it and remains visible. No horizontal page overflow or clipped button label is apparent in the captured viewport.

## Interim conclusion

Responsive behavior is visually acceptable at tablet, mobile, and small-mobile sizes. The desktop blank-square observation should be rechecked with an intentional delayed capture; all other inspected viewports show the real transparent Smart Manager mark rather than a broken or missing image.

## Delayed desktop confirmation — 1440 × 900

A second desktop capture taken after an 8-second virtual-time budget shows the actual green Smart Manager mark in the white brand container. The earlier blank square was therefore a capture-timing artifact rather than a persistent desktop rendering defect. The landing page composition remains aligned and the logo is visible after the page settles.

**Additional evidence file:** `/tmp/smartmanager-desktop-mandate-delayed.png`
