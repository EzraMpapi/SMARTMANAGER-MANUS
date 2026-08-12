# Webhook Delivery Operations

## Delivery History and Retries

BusinessSphere records webhook attempts in the `webhook_deliveries` table when the platform database is reachable. The service keeps an in-memory fallback only to prevent an outbound notification failure from interrupting operational workflows. The Compliance Audit area shows recent successful and failed deliveries, and administrators can retry an individual failed delivery without re-entering the webhook configuration.

The database migration `drizzle/0002_tiresome_spot.sql` defines the durable table and its query indexes. The table has been created through the managed database connection. If the database DNS endpoint is temporarily unavailable, the committed migration remains the source of truth and can be applied by the protected production workflow.

## Migration Workflows

The pull-request workflow at `.github/workflows/verify-migrations.yml` runs type checks, the local regression suite, and `server/runMigrations.mjs --verify`. It never mutates a database.

The manual production workflow at `.github/workflows/apply-migrations-production.yml` requires a GitHub environment called `production`. Configure required reviewers for that environment and add `DATABASE_URL` as an environment secret. A release manager starts the workflow with an approved change-ticket reference; only then does the runner execute `server/runMigrations.mjs --apply`.

## Administrator Checks

An administrator should first use **Send Test Ping** to confirm an endpoint is reachable. Failed events appear as **FAILED** in the delivery activity drawer, together with their attempt count, HTTP status or error summary. Selecting **Retry delivery** sends a new, tracked attempt and creates a fresh delivery record.
