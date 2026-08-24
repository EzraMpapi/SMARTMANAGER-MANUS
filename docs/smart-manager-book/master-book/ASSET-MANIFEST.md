# Master-Book Managed Asset Manifest

The master-book work contained two identical oversized project-local copies of the approved master-book logo. The original is preserved outside the repository and available through managed project storage.

| Former project-local paths | Managed storage path | Preserved source path |
| --- | --- | --- |
| `assets/branding/extracted-000.png` and `typst-project/assets/branding/smart-manager-logo.png` | `/manus-storage/smart-manager-logo_b1db8065.png` | `/home/ubuntu/webdev-static-assets/smart-manager-master-book/branding/smart-manager-logo.png` |

The builder defaults to the preserved source path and accepts `SMART_MANAGER_MASTER_BOOK_BRANDING_ROOT` for a controlled rebuild. It must not restore these image bytes inside the repository.
