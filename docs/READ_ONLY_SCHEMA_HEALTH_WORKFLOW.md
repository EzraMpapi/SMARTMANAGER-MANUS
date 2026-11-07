# Read-Only Supabase Schema and GitHub Health Workflow

The repository includes `.github/workflows/read-only-schema-health.yml`, a scheduled inspection that runs daily at **08:00 Africa/Dar_es_Salaam time**. GitHub schedules use UTC, so the workflow uses `05:00 UTC`. A manual `workflow_dispatch` trigger is also available for an on-demand inspection.

> The workflow is intentionally **not** a deployment, migration, repair, seed, or synchronization mechanism. It can only report health and drift. Any database or repository change requires a separate manually reviewed operation.

## What the workflow checks

| Area                | Read-only baseline                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------- |
| GitHub              | The scheduled revision, current `main`, and runner working-tree cleanliness.                  |
| Session safety      | PostgreSQL reports `transaction_read_only = on`.                                              |
| Property Management | 37 `property_*` tables, all with RLS and at least one policy.                                 |
| Fixed Deposits      | 2 core tables, 16 targeted indexes, 4 RLS policies, and the immutable event trigger/function. |
| Migration access    | The migration ledger is accessible and contains at least one entry.                           |

The workflow never selects application records or customer fields. It queries system catalogs, policy metadata, and the migration ledger only.

## Required secret

Before the first successful scheduled run, add the following GitHub Actions repository secret:

| Secret                                | Purpose                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `SUPABASE_SCHEMA_HEALTH_DATABASE_URL` | A PostgreSQL connection URL for a dedicated read-only health-monitoring role. |

Do **not** place the Supabase service-role key, database owner password, deployment `DATABASE_URL`, or any production write credential in this secret. The monitor must use a distinct role whose only purpose is metadata inspection.

## Least-privilege role setup

An authorized database administrator should create the monitoring role in a protected administrative session, choose a strong unique password, and retain it only as a GitHub Actions secret. The following pattern illustrates the necessary grants; adapt the database name and password outside the repository:

```sql
CREATE ROLE schema_health_reader LOGIN PASSWORD '<store-outside-source-control>';
GRANT CONNECT ON DATABASE postgres TO schema_health_reader;
GRANT pg_monitor TO schema_health_reader;
GRANT USAGE ON SCHEMA supabase_migrations TO schema_health_reader;
GRANT SELECT ON TABLE supabase_migrations.schema_migrations TO schema_health_reader;
```

The role must not receive `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `CREATE`, `ALTER`, `DROP`, ownership, `BYPASSRLS`, `SUPERUSER`, or application-service privileges. Configure its connection URL as the repository secret, then manually dispatch the workflow once to verify the report.

## Interpreting reports

A successful run writes GitHub and Supabase results to the workflow summary. A failure is intentionally non-remediating. Treat a `BLOCKED` result as a missing secret, missing privilege, or unavailable service; treat a schema-baseline failure as `DRIFT` that needs a separate review before any SQL is considered. A GitHub revision mismatch can occur if `main` advances after the scheduled run starts; the next run will inspect the updated revision.

## Monthly evidence review

The pre-existing monthly evidence-reinspection schedule remains unchanged because this collaboration session is not allowed to modify schedules. The repository workflow does not open authenticated browser sessions, capture UI evidence, or update evidence registries.
