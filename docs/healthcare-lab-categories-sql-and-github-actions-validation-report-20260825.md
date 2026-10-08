# Healthcare Laboratory SQL and GitHub Actions Validation Report

**Repository:** `EzraMpapi/SMARTMANAGER-MANUS`
**Date:** 25 August 2026
**Scope:** `hc_lab_categories` draft SQL and GitHub-hosted runner compatibility

## Executive summary

The `hc_lab_categories` migration draft passed a static PostgreSQL parse using `pgsql-parser` 18.2.6, a Node package backed by the PostgreSQL parser through WebAssembly. The parser returned `parsed: true`; no SQL was executed and no live database was contacted. This validates tokenization and grammar-level parsing, but it does not validate catalog dependencies, permissions, RLS behavior, trigger execution, or migration semantics.

Every repository workflow was accepted by GitHub’s workflow API and uses the standard GitHub-hosted `ubuntu-latest` runner label. No workflow uses `self-hosted`, a custom runner label, a container runner, or a service-container requirement. The relevant workflows also use standard action families such as checkout, setup-node, pnpm setup, cache, artifact upload, and GitHub Script. The runner-startup failures therefore do not match a YAML runner-label mismatch.

The affected jobs failed before any step began, with `runner_name = null` and empty step arrays. The same behavior was reproduced by the manually dispatched read-only health workflow. Repository Actions are enabled, allowed actions are set to `all`, and the referenced environments exist. The current evidence continues to point to GitHub-side or account-level runner assignment rather than a repository workflow configuration error. Account billing/quota information remains unavailable to the current API integration and must be checked by the account owner.

## Static SQL validation

### Method

The draft was parsed in a temporary directory using `pgsql-parser` version 18.2.6. The package documentation states that it uses the actual PostgreSQL parser through WebAssembly [1], and its underlying `libpg_query` project describes parsing outside a running PostgreSQL server [2]. The validator read the file and called the package’s asynchronous `parse()` function.

### Result

```json
{
  "parser": "pgsql-parser/libpg_query",
  "parsed": true
}
```

The draft passed grammar-level parsing as a complete SQL document. It contains `BEGIN`/`COMMIT`, table definitions, composite foreign-key syntax, partial indexes, PL/pgSQL trigger functions, RLS policies, grants, revocations, and comments.

### What this proves and does not prove

| Validation layer | Result | Meaning |
|---|---:|---|
| SQL lexical and grammar parsing | Passed | The parser accepted the SQL document. |
| PL/pgSQL body parse through the outer SQL parser | Accepted as part of the function definition | The function statement was syntactically accepted by the parser. |
| Referenced schemas and functions | Not validated by parser | `public.companies`, `public.current_company_id()`, `public.workforce_has_permission(text)`, `auth.uid()`, and `authenticated` must exist with compatible signatures. |
| Constraint and index interaction | Not executed | PostgreSQL must validate the composite key, index expressions, and constraint behavior. |
| RLS policy execution | Not executed | Tenant isolation and permission helper behavior require authenticated database tests. |
| Trigger behavior | Not executed | Timestamp updates and immutable-event rejection require transaction tests. |
| Migration rerun/idempotency | Not validated | The draft uses plain `CREATE TABLE`, `CREATE INDEX`, `CREATE TRIGGER`, and `CREATE POLICY`; it is intentionally a one-time reviewed migration draft, not rerunnable DDL. |
| Live schema mutation | Not performed | No Supabase or production database was contacted. |

A real PostgreSQL transaction test remains required in a disposable local container or approved staging project. The static parse should be treated as a necessary preflight, not as migration approval.

## Workflow compatibility matrix

| Workflow | Jobs / runner declarations | Environment | Permissions | Compatibility assessment |
|---|---:|---|---|---|
| `android-release.yml` | 2 × `ubuntu-latest` | None shown | `contents: write` | Standard hosted runner; release write scope is intentional for artifact/release publication. |
| `apply-migrations-production.yml` | 1 × `ubuntu-latest` | `production` | `contents: read` | Standard hosted runner; production environment is a deployment gate, not a runner label. |
| `ci.yml` | 2 × `ubuntu-latest` | `Production – smatimeneja` on validation job | Repository default read; browser job explicitly `contents: read` | Standard hosted runners; environment name exists. No label mismatch. |
| `daily-production-smoke.yml` | 1 × `ubuntu-latest` | None shown | `contents: read`, `issues: write` | Standard hosted runner; issue permission is used only for failure alerting. |
| `feature-branch-ci.yml` | 2 × `ubuntu-latest` | None | `contents: read` | Standard comparison workflow; no environment gate or custom runner. |
| `live-tenant-fixtures.yml` | 1 × `ubuntu-latest` | `live-e2e` | `contents: read` | Standard hosted runner; live-E2E environment should remain separately protected. |
| `read-only-schema-health.yml` | 1 × `ubuntu-latest` | None | `contents: read` | Lowest-cost read-only runner probe; it reproduced the startup failure. |
| `release-notes.yml` | 1 × `ubuntu-latest` | None shown | `contents: write` | Standard hosted runner; release write scope is expected for release notes. |
| `verify-migrations.yml` | 1 × `ubuntu-latest` | None | `contents: read` | Standard hosted runner; pull-request migration preflight. |
| `weekly-dependency-security.yml` | 1 × `ubuntu-latest` | None | `contents: read`, `issues: write` | Standard hosted runner; issue permission is used only for vulnerability alerting. |
| `weekly-health-email-summary.yml` | 1 × `ubuntu-latest` | None shown | `actions: read`, `contents: read` | Standard hosted runner; read-only Actions metadata and repository access. |

GitHub’s workflow syntax supports `runs-on` labels for selecting hosted or self-hosted execution environments [3]. Every workflow inspected uses the same hosted label, `ubuntu-latest`; none requests `self-hosted`, a private runner group, or an unavailable custom label.

## Permission and environment findings

The repository Actions API reported `enabled: true`, `allowed_actions: all`, and default workflow permissions of `read`. The repository self-hosted runner endpoint returned zero registered runners. This is not a restriction on GitHub-hosted `ubuntu-latest` runners; it only confirms that the repository has no self-hosted runner fallback.

The referenced environments include `production`, `Production – smatimeneja`, and `live-e2e`. The inspected environment records had no protection rules or wait timers. A protected environment could pause a job after runner allocation, but it would not explain a job that fails with no runner and no steps.

The three affected workflows are structurally valid enough for GitHub to create the expected named jobs. Their failed jobs completed in seconds, had no assigned runner, and recorded no steps. The read-only manual probe reproduced the same behavior. Repository-level workflow permissions and job-level scopes are evaluated as part of workflow execution and cannot explain a failure before checkout or setup.

## Billing and quota limitation

The account owner is a personal GitHub user account rather than a GitHub organization. Organization-level Actions permission, runner, hosted-runner, and billing endpoints returned `404 Not Found` because there is no organization endpoint for this owner. The user Actions billing endpoint returned `403 Resource not accessible by integration`. GitHub’s billing API is permission-restricted [5], so the current integration cannot confirm included minutes, overage status, payment status, or spending limits.

The account-level billing UI remains the authoritative next check: **GitHub Settings → Billing and licensing → Plans and usage**. Do not interpret the API’s 403 as proof of exhausted quota. The available API rate-limit resources were healthy and do not represent Actions-minute quota.

## Troubleshooting conclusion

No runner-label or workflow-permission mismatch was found. The evidence hierarchy is:

1. All workflow definitions were accepted by GitHub.
2. Every workflow uses `ubuntu-latest` rather than a missing self-hosted label.
3. Actions is enabled and all actions are allowed.
4. The referenced environment exists and has no configured wait rule.
5. Multiple unrelated commits and workflow types failed before any step.
6. A manually dispatched read-only workflow reproduced the same pre-run failure.
7. The current token cannot inspect account billing limits.

The highest-value next action is account-owner verification of Actions billing and repository/organization policy in the GitHub UI, followed by a single low-cost manual dispatch after the account is confirmed in good standing. If billing is clear and the job still fails with `runner_name = null`, escalate the run IDs to GitHub Support as a runner-assignment incident. No speculative change to `runs-on`, permissions, or environments is recommended.

## References

[1]: https://www.npmjs.com/package/pgsql-parser "pgsql-parser — PostgreSQL parser for Node.js"

[2]: https://github.com/pganalyze/libpg_query "pganalyze/libpg_query — PostgreSQL parser outside the server"

[3]: https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions "GitHub Actions workflow syntax"

[4]: https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication "GitHub Actions token permissions"

[5]: https://docs.github.com/en/rest/billing/billing "GitHub billing REST API documentation"
