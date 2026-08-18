# TRA Portal Enhancement Contracts

## Scope

This change extends the existing tenant-scoped TRA VFD module without fabricating fiscal transactions or altering the receipt submission path.

## Daily Z-report reconciliation archive

The `tra_z_report_archive_schedules` table owns one schedule per company and branch. It stores the Heartbeat task UID, six-field UTC cron expression, active state, last-run state, and the last archive reference. The schedule is created and managed through protected tRPC procedures after `resolveVerifiedProfile` confirms company access and an authorized role.

The `/api/scheduled/traZReportArchive` handler authenticates only cron callers and resolves the owning schedule by `user.taskUid`. The handler is idempotent for a company/branch/business-date key: it creates or updates one `z_reports` row, serializes the reconciled Z-report summary as JSON, uploads the archive bytes using `storagePut`, and records the S3 key and URL in `tra_z_report_archives`. No receipt data is invented; totals are derived from real `fiscal_receipts` rows for the selected business date and branch. The archive may be marked `empty` when the date has no receipts, and the run is still recorded for auditability.

## Multi-branch tax-liability comparison

`getBranchTaxLiabilitySummary` is a protected, tenant-scoped query accepting a company and date range. Branch identities are derived from the company’s `fiscal_profiles` and receipt rows; no cross-company rows are returned. For each branch, it reports gross sales, taxable sales, VAT, receipt count, verified receipt count, and VAT-to-gross ratio. The UI presents a comparison table and a compact bar visualization with a date-range selector. Empty branches remain explicit and are labeled as having no recorded fiscal activity.

## Gateway timeout push alerts

`tra_gateway_alert_settings` stores one tenant-level configuration: enabled state, timeout threshold in milliseconds, cooldown in minutes, last alert timestamp, and last delivery state. A protected mutation allows authorized roles to enable/disable alerts and adjust thresholds. `getConnectionStatus` evaluates the provider response; if it is unavailable or latency exceeds the configured threshold and the cooldown has elapsed, it dispatches a notification through the existing owner-notification abstraction, persists the delivery result, updates the cooldown timestamp, and writes an audit event. The notification is truthful and explicitly states when the alert was not delivered. The mock provider remains deterministic and does not simulate failures in production UI.

## Security and operations

All reads and writes enforce company isolation through `resolveVerifiedProfile`. Scheduled work is deterministic and uses Heartbeat rather than an in-process timer. Archive files are stored in S3 and only metadata is held in MySQL. New procedures expose explicit loading, empty, and failure states. All schema changes are generated through Drizzle and applied through the managed SQL execution path before runtime validation.
