# Workspace Branding Implementation Notes

## Verified live data contract

The connected Supabase project is `rlhngsrihahhyxnjxrxm`. The RLS-enabled `public.companies` table already provides a nullable `logo` text field. The migration **`add_company_brand_colors`** was applied successfully on 2026-08-14 and added nullable `brand_primary_color` and `brand_accent_color` text fields, each constrained to a six-digit hexadecimal color.

## Security and storage model

Workspace branding must never rely on a browser-posted company identifier. The server derives the tenant from the authenticated Supabase token using the existing `profiles.company_id` resolution pattern. Only organization-level administrative roles may save branding. Logo bytes are validated as PNG, JPEG, WebP, or SVG and limited to 2 MB before storage. They are saved through the project S3 helper under `workspace-branding/<verified-company-id>/`, which returns a durable `/manus-storage/...` URL. The URL and selected colors are then written to the authenticated user’s RLS-protected company row.

## Interaction model

The Account → Workspace → Modules onboarding flow gains a compact optional branding area in the Workspace step. It captures a logo plus primary and accent colors, previews the organization mark in context, and persists the choices after the server-authorized company creation RPC succeeds. The same saving path is reused from Settings for later self-service updates, including explicit logo removal.

## Validation record

The stable production preview was navigated through Account into the Workspace step without submitting an account. The branding panel rendered successfully with an organization-logo action, accepted-image guidance, primary and accent color pickers, eight keyboard-accessible primary-color presets, and a live workspace preview. An initial missing `Upload` icon reference was corrected to the project’s imported `UploadCloud` icon and covered by a regression assertion.
