# Weekly Schema Health Email Summary

The repository includes a scheduled GitHub Actions workflow, **Weekly schema health email summary**, that sends a plain-text weekly digest of the preceding seven days of the daily **Read-only schema and GitHub health verification** workflow.
It runs every Monday at **05:30 UTC**, which is **08:30 GMT+3**. The workflow uses the GitHub Actions API only to read workflow-run metadata, then sends one email through an SMTP provider. It does not connect to Supabase, inspect application data, execute SQL, apply migrations, load seed data, change permissions, commit, push, tag, release, deploy, or remediate failures.

## Report contents

The email contains the reporting window, repository and reporting revision, the number of observed daily health runs, a success/attention/in-progress count, and links to individual GitHub Actions runs. A non-successful run changes the subject to **Action required** but does not trigger an automatic change.

## Required repository secrets

An authorized repository administrator must add these encrypted Actions secrets before the workflow can send mail. Do not place them in workflow YAML, committed files, repository variables, issue comments, or chat messages.
| Secret | Purpose |
| ------------------------------- | ----------------------------------------------------------------- |
| `SCHEMA_HEALTH_WEEKLY_EMAIL_TO` | Recipient address for the weekly summary. |
| `SCHEMA_HEALTH_SMTP_FROM` | Approved sender address. |
| `SCHEMA_HEALTH_SMTP_HOST` | SMTP server hostname. |
| `SCHEMA_HEALTH_SMTP_PORT` | SMTP port, normally `587` for STARTTLS or `465` for implicit TLS. |
| `SCHEMA_HEALTH_SMTP_USERNAME` | SMTP account username. |
| `SCHEMA_HEALTH_SMTP_PASSWORD` | SMTP password or provider-issued app password. |
Configure the secrets in **GitHub repository → Settings → Secrets and variables → Actions**, then use **Actions → Weekly schema health email summary → Run workflow** for a controlled first delivery. The current collaboration token cannot list or write repository secrets, so that step requires a repository administrator.

## Relationship to the daily check

The weekly email summarizes GitHub Actions outcomes only. For completed Supabase verification, the daily workflow also requires the separate `SUPABASE_SCHEMA_HEALTH_DATABASE_URL` secret, using a dedicated least-privilege read-only database role. If that daily secret is absent, the weekly report will surface the resulting blocked run and direct the recipient to the associated Actions log.

## Security and operating boundary

The mail script validates that every required secret is present before it reads report metadata or opens an SMTP connection. It sends a single plain-text summary and exits nonzero on missing credentials, malformed run metadata, or mail-delivery errors so the failure is visible in GitHub Actions. All remediation remains manual and separately approved.
