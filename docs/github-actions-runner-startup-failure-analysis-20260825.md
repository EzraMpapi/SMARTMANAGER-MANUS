# GitHub Actions Runner Startup Failure Analysis

**Repository:** `EzraMpapi/SMARTMANAGER-MANUS`
**Analysis date:** 25 August 2026
**Scope:** Workflows triggered around commit `b0af55c` and subsequent repository revisions

## Executive conclusion

The observed failures are **runner/job-startup failures, not reported test, build, dependency, or schema failures**. The affected jobs were marked failed within approximately three to five seconds, had `runner_name = null`, and contained an empty `steps` array. The same pattern occurred across the CI, Daily Production Smoke, and Weekly Dependency Security workflows, across multiple unrelated commit SHAs, and after explicit reruns. No workflow YAML change was present in the staging-safety commit that first exposed the problem.

The repository’s Actions service is enabled, the allowed-actions policy is `all`, all three affected jobs use the standard GitHub-hosted `ubuntu-latest` label, and the referenced `Production – smatimeneja` environment exists with no protection rules or wait timer. These facts make a repository-level workflow syntax error, unavailable environment approval, or a self-hosted-runner label mismatch unlikely. The evidence is most consistent with a transient or account/repository-level GitHub Actions runner-assignment failure. The available status snapshot showed GitHub Actions operational at its update time and did not prove a concurrent public incident, so the exact GitHub-side root cause cannot be established from repository telemetry alone.

## Evidence collected

| Evidence | Observation | Interpretation |
|---|---|---|
| First affected commit | `b0af55c` | Staging benchmark and safety assets were published; no workflow files changed relative to the prior remote revision. |
| CI job | `Unit, Schema, Type and Production Build` | Failed before any step; no runner assigned. |
| Smoke job | `Production authentication and ERP smoke tests` | Failed before any step; no runner assigned. |
| Security job | `Dependency vulnerability audit` | Failed before any step; no runner assigned. |
| Job metadata | `runner_name: null`, `steps: []` | The failure occurred before checkout, setup, install, test, audit, or build execution. |
| Timing | Jobs completed within seconds | Not consistent with the configured 15–25 minute workload timing or a normal command failure. |
| Rerun attempt | Attempt 2 reproduced the same pre-step failure | Not an isolated failed checkout or dependency command. |
| Broader history | Multiple unrelated SHAs around the same period showed the same rapid failure pattern | Strong evidence against the newly committed source being the root cause. |
| Manual low-cost probe | `read-only-schema-health.yml` was dispatched on main at `2026-08-25T18:59:44Z` and failed by `18:59:48Z` | The job again had `runner_name = null` and `steps = []`; the issue persists on the latest main revision. |
| Actions settings | Enabled; allowed actions set to `all` | No repository-wide Actions disablement was found. |
| Environment | `Production – smatimeneja` exists; no protection rules or wait timer | No pending environment approval was found as an explanation. |
| Public status | GitHub status snapshot reported Actions operational and no active incident at the snapshot timestamp | Does not rule out a later, scoped, or short-lived runner-assignment incident. |

## Workflow configuration review

### CI and Quality Gate

`.github/workflows/ci.yml` uses `runs-on: ubuntu-latest` for both jobs. It has a job-level environment named `Production – smatimeneja`, which exists in the repository’s environment list. The job includes checkout, Node.js 22.13.0, pnpm 10.34.2, cache setup, dependency installation, schema verification, type checking, tests, dependency audit, and build. GitHub accepted the workflow and created jobs, so the YAML was parseable and dispatchable. The failure occurred before the first step.

The CI workflow does have two maintainability concerns that are unrelated to runner allocation. It runs the production dependency audit in the same validation job even though a separate weekly workflow performs the same audit, and it uses a production-named environment for a job that also runs ordinary unit and type checks. Neither concern explains `runner_name = null` with no steps.

### Daily Production Smoke

`.github/workflows/daily-production-smoke.yml` uses `ubuntu-latest`, a 15-minute timeout, a read-only public deployment target, and a concurrency group that does not cancel in-progress smoke runs. It contains no self-hosted labels, custom runner groups, or unusual container configuration. Its failure occurred before checkout and before Playwright installation, so the production target URL was not reached by the failed job.

### Weekly Dependency Security

`.github/workflows/weekly-dependency-security.yml` also uses `ubuntu-latest`, a 15-minute timeout, standard checkout/setup actions, and a bounded production dependency audit. Its permissions are `contents: read` and `issues: write`, which are appropriate for the final alert step. Its failure occurred before checkout and before `pnpm audit`, so the dependency graph was not evaluated by the failed run.

### Comparison workflow

`.github/workflows/feature-branch-ci.yml` uses the same `ubuntu-latest` runner family and the same checkout, Node.js, pnpm, and cache action families. It has no environment gate. This is a useful configuration comparison, but the available evidence does not establish a successful run at the exact failure timestamp, so it should not be treated as proof that the runner pool was healthy for this repository.

## Ruled-out causes

The failure was not caused by the benchmark source or documentation because no workflow step reached checkout or source evaluation. It was not caused by the `Production – smatimeneja` environment being absent or waiting for approval because the environment exists and has no configured protection rules. It was not caused by a `self-hosted` runner label, because all affected jobs request `ubuntu-latest`. It was not caused by a workflow syntax rejection, because GitHub created the expected named jobs for all three workflows. It was not caused by a failing test, `pnpm install`, Playwright, `pnpm audit`, or production build command, because no steps were recorded.

The public status snapshot is also not sufficient to prove a GitHub outage. GitHub’s status API showed Actions operational at `2026-08-25T18:16:42Z`, while the failed runs began later. The manually dispatched read-only probe at 18:59 UTC reproduced the same failure before runner assignment, which strengthens the repository/account-level or GitHub-side runner-assignment hypothesis but still does not expose the underlying service telemetry. The incident history does contain a resolved Actions incident titled **“Actions delays in starting runs”**, but its published resolution preceded the affected runs. It is therefore evidence that the symptom class exists, not proof of the specific root cause in this repository.

## Recommended actions

The first operational action is to wait for a stable GitHub Actions period and dispatch a single low-cost `Feature Branch CI` or read-only verification run. Do not repeatedly rerun all production smoke and full CI jobs during a suspected runner-assignment incident because that creates noise and unnecessary external work.

If the issue persists, inspect the repository’s **Actions → Runners** and **Actions → General** settings in the GitHub web UI, confirm that GitHub-hosted runners are enabled for the repository, and check organization-level Actions policy and concurrency limits. The failed API records show no assigned runner, so repository administrators or GitHub Support may need to inspect runner-assignment service telemetry that is not exposed in the job log API.

Once a runner reaches the first step, rerun the normal validation sequence. If a real step-level failure then appears, diagnose that failure separately; it would be a new and more actionable signal than the current pre-run failure.

No workflow YAML modification is recommended solely to address the observed startup failure. Changing `ubuntu-latest`, removing the environment, reducing test scope, or weakening permissions would not repair a failure that occurs before a runner is assigned. A future hardening change could separate ordinary CI validation from production environment access, but that should be a deliberate workflow design change rather than a speculative incident fix.

## Reproduction and verification checklist

| Check | Expected healthy result |
|---|---|
| `gh workflow view ci.yml --yaml` | Workflow YAML renders successfully. |
| `gh api repos/{owner}/{repo}/actions/permissions` | Actions enabled and allowed policy confirmed. |
| `gh api repos/{owner}/{repo}/environments` | Referenced environment exists; protection state is understood. |
| `gh run view <run> --json jobs` | A healthy job has a runner or completed steps. |
| `gh run view <run> --log-failed` | Step logs are available after runner allocation. |
| Manual low-cost workflow dispatch | Job reaches checkout and setup rather than failing with empty steps. |
| CI rerun after runner recovery | Typecheck, tests, schema verification, audit, and build produce normal step-level results. |

## References

[1]: https://www.githubstatus.com/api/v2/summary.json "GitHub Status API — current component summary"

[2]: https://www.githubstatus.com/api/v2/incidents.json "GitHub Status API — incident history"

[3]: https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions "GitHub Actions workflow syntax documentation"
