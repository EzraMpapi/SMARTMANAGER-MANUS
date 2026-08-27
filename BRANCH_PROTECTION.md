# Main-Branch Quality Policy

## Selected Repository Posture

On 2026-08-27, the repository owner explicitly approved changing `EzraMpapi/SMARTMANAGER-MANUS` to **public** after a tracked-file safety scan confirmed that environment files contain placeholders only and flagged code values are non-production test fixtures. This change makes the repository source and history publicly visible; secrets remain deployment- or CI-managed and must never be committed.

Public visibility allows GitHub main-branch protection on the current plan. The `main` policy therefore requires pull-request review and the current CI status checks before merge, including for administrators.

## Active Quality Gate

The **CI & Quality Gate** workflow remains enabled for pushes and pull requests targeting `main`. It validates the Supabase schema contract, TypeScript, automated tests, dependency audit, production build, and the isolated browser dashboard-preference journey. Its result is visible through the repository status badge in [README.md](README.md).

Maintainers must open a pull request and obtain one approval before merging into `main`. The two required checks are **Unit, Schema, Type and Production Build** and **Browser Dashboard Preference Journey**. Stale approvals are dismissed after new commits, administrator bypass is disabled, force pushes and branch deletion are disabled, and conversation resolution is required. The release-notes workflow remains independent of this policy and creates release notes only from a version tag or explicit manual dispatch.

## Enforced Protection Settings

The `main` protection configuration uses the following settings:
| Control | Required setting |
| --------------- | --------------------------------------------- |
| Pull requests | Require a pull request before merging |
| Required checks | `Unit, Schema, Type and Production Build`; `Browser Dashboard Preference Journey` |
| Stale approvals | Dismiss approvals when new commits are pushed |
| Administrators | Include administrators in the policy |
| Force pushes | Disallow |
| Branch deletion | Disallow |
| Conversations | Require resolution before merge |

No application behavior, production data, credentials, or schedules are modified by this policy document.
