# Reference top-header image analysis

Source image dimensions are 1443×88 pixels, with an aspect ratio of approximately 16.40:1. It was therefore read as four ordered horizontal crops with overlap.

The first two crops verify the left-to-center structure. At the far left is a compact hamburger/menu icon. It is followed by a green Smart Manager shield mark and the readable wordmark “Smart Manager ERP”. Next is a wide, lightly bordered search field with a magnifying-glass icon, placeholder text beginning “Search anything…” and a visible keyboard hint “Ctrl + K” / “⌘ K”. The company selector follows, showing a building icon, “Acme Group Ltd”, a smaller “Company” label, and a downward chevron. These are visual reference details only; application data must continue to come from the existing authenticated workspace/session.

The third crop verifies the right side of the workspace context: the branch selector reads “Dar es Salaam HQ” with a smaller “Branch” label, location-pin icon, and chevron. After it is a small green connection-status pill, then a bell notification control with a red badge showing “3”, and a messages/chat control with a green badge showing “2”.

The fourth crop verifies the remaining utilities: a sun/theme control, a vertical divider, and a compact profile block with a circular portrait, the readable name “John Mwangi”, a smaller “Administrator” role label, and a chevron. The intended implementation should preserve these visual zones and proportions while binding labels, counts, company/branch names, and user identity to real existing application state rather than hardcoding the reference values.

Implementation direction: use the existing menu trigger and brand asset, retain the current search/command-palette callback, keep current company/workspace and branch navigation callbacks, preserve Notification Center and profile behavior, and present the reference controls in a stable desktop row. At smaller widths, compress or hide secondary labels while retaining accessible 40px touch targets and the existing mobile drawer/bottom navigation behavior.
