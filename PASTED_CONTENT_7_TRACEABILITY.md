# Pasted Content 7: Browser Download and File Management Traceability

This document maps the file-management request in `pasted_content_7.txt` to the capabilities available in a web application. Smart Manager can create and request browser downloads for confirmed documents, but it cannot silently write to `~/Downloads`, create folders on a user’s device, inspect a browser download folder, or truthfully retain a file merely because browser-local metadata exists.

| Attached directive | Result | Boundary |
| --- | --- | --- |
| Automatic save to `~/Downloads/SmartManager/...` | **Not implemented.** | Browser security does not grant a website unconditional filesystem access or a predictable user download path. The browser and operating system control the save location. |
| Categorized folders and automatic organization | **Partially supported through suggested filenames only.** | `buildBrowserDownloadFilename` produces predictable `smart-manager-{category}-{reference}-{date}.{ext}` names for manual organization. It does not claim a folder was created or selected. |
| Receipt print/PDF download | **Improved.** | POS receipts present a suggested filename in the print document and explain that the browser/system print dialog controls the printer or save location. |
| Dashboard CSV download | **Improved.** | The export helper requests a browser download and reports the requested filename and save-location boundary. It does not report a completed filesystem write. |
| IndexedDB or localStorage file catalog, hashes, logs, delete, or ZIP backup | **Deferred.** | Browser-local metadata is not durable source-of-truth storage, object URLs expire, local deletion cannot remove a downloaded file, and metadata must not be mistaken for tenant audit evidence. |
| Cloud backup and sync | **Deferred.** | The application uses server/S3 storage for durable file bytes. A user-facing backup or sync workflow needs a tenant-scoped metadata contract, authorization, retention policy, and confirmed server responses. |
| Open download folder | **Not claimed.** | A web page cannot reliably open the user’s file explorer or Downloads directory. |
| Simulated download progress or “saved successfully” state | **Not implemented.** | Browser download initiation does not confirm completion, save location, or write success; the UI uses truthful wording such as **Browser download requested**. |

## Future safe implementation path

A full document center should retain authorized metadata in the tenant database and bytes in S3, issue presigned download URLs, and show only confirmed server-side retention states. A user-consented File System Access API workflow could optionally write to a directory the user explicitly selects, with a browser-compatibility fallback. It must remain an opt-in convenience, not a hidden local persistence path.
