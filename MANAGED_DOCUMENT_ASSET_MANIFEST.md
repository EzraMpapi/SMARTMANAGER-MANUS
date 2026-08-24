# Managed Documentation Asset Manifest

The oversized documentation images previously stored in the project were preserved outside the repository at `/home/ubuntu/webdev-static-assets/businesssphere-doc-assets/` and uploaded to managed project storage. The source files are not committed to the application repository.

| Former project-local paths | Managed storage path |
| --- | --- |
| `docs/smart-manager-book/assets/smart-manager-logo.png` and `docs/smart-manager-book/typst/assets/smart-manager-logo.png` | `/manus-storage/smart-manager-logo_b5445e35.png` |
| `docs/smart-manager-book/assets/ezra-mpapi-owner.png` and `docs/smart-manager-book/typst/assets/ezra-mpapi-owner.png` | `/manus-storage/ezra-mpapi-owner_19c8cae1.png` |

These are two unique assets represented by four duplicate project-local files. Documentation rebuilds that need the original image bytes must use the preserved external source copies or the managed paths above; they must not restore large media inside the project.

The source builder defaults to `/home/ubuntu/webdev-static-assets/businesssphere-doc-assets/` and supports an explicit `SMART_MANAGER_BOOK_ASSET_ROOT` override for controlled documentation rebuilds.
