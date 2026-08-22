# Repository Change Tracking

BusinessSphere ERP uses the requested GitHub repository as the shared source of truth for project-file history and collaboration:

> `https://github.com/EzraMpapi/SMARTMANAGER-MANUS.git`

The working branch is `main`. At the time this record was created, the local working tree and `github/main` were synchronized at commit `909b987d38745084664c0daf7a9937987aef473b`.

## Required Workflow for Every Project Change

Before beginning a change, retrieve the current repository state with `git fetch github main`, inspect the divergence from `github/main`, and merge any incoming work without destructive reset or rebase. This ensures that files created or changed by other contributors are incorporated before new implementation begins.

For every completed project change, record the work with a focused Git commit, push the commit to `github/main`, and verify that the remote reference matches the local `HEAD`. Relevant regression tests, type checks, schema checks, or production builds must be run according to the scope of the change before publication.

| Tracking step | Required verification |
| --- | --- |
| Retrieve incoming files | `git fetch github main` and inspect `github/main...HEAD` divergence |
| Preserve concurrent work | Merge non-destructively; resolve conflicts without discarding verified project changes |
| Record a completed change | Use a focused commit message that identifies the functional change or verification record |
| Synchronize GitHub | Push to `github/main` and compare `git ls-remote github refs/heads/main` with local `HEAD` |
| Publish managed deployment | Save a checkpoint after completed, validated changes; the project is configured to publish automatically |

This workflow intentionally does not expose credentials, tokens, recipient addresses, or other sensitive values in commits, logs, or project documentation.
