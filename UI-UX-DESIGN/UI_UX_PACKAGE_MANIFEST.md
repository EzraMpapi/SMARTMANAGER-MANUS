# SMART MANAGER ERP — UI/UX Package Manifest

## Scope

This package is a source-aligned UI/UX visual design reference for the existing SMART MANAGER ERP application. It preserves the current product direction, module vocabulary, role model, responsive behavior, and design-token system. It is not a replacement application and does not modify production frontend or backend source code.

## Verified source basis

The package was derived from the repository’s React/Vite client, the authoritative `BusinessSphereDashboard.jsx` module registry and role model, `SettingsPage`, `DashboardPreferencesContext`, shared UI components, `index.css` design tokens, server tRPC composition, backend feature services, and Supabase/Drizzle persistence boundaries.

## Included coverage

| Asset class | Count | Notes |
|---|---:|---|
| Dedicated module and cross-cutting surface mockups | 40 | Each has its own standalone PNG and gallery specification. |
| Critical workflow diagrams | 18 | Editable Mermaid source and rendered PNG for each workflow. |
| Design-system references | 1 | Color, typography, spacing, and component-state sheet. |
| Navigation/role/responsive documents | 3 | Information architecture, role experience, and responsive/accessibility guidance. |
| Master report | 1 | Native Typst PDF, 107 landscape A4 pages, 59 embedded images. |

## Visual truthfulness

The mockups are high-fidelity implementation references. Their records and KPI values are explicitly illustrative design-reference data, not production database values. They show the intended information hierarchy, state taxonomy, action placement, permission communication, evidence affordances, and desktop-to-mobile composition.

## Quality gates

- The 40 module mockups were visually checked through a clean contact sheet.
- The 18 workflow diagrams were visually checked through a contact sheet.
- The master PDF compiled in strict mode with no warnings.
- The image-bearing PDF verifier passed all checks: valid signature, parseable PDF, 107 pages, text present, no placeholders, fonts present, and 59 images embedded.
- Representative PDF pages were reviewed for cover, contents, navigation, module gallery, workflow, responsive, Settings, and handoff layout.
- ZIP integrity and expected asset counts are verified during final packaging.
