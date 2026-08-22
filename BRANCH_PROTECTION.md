# Main-Branch Quality Policy

## Selected Repository Posture

The Smart Manager repository remains **private**. This preserves the existing access boundary and avoids changing repository visibility or authorizing a GitHub billing change without a separate explicit instruction.
GitHub reports that this repository’s current plan does not permit branch protection or repository rulesets for the private `main` branch. Consequently, required status checks cannot be enforced by GitHub at this time. This is a GitHub account-entitlement limitation, not an application or workflow failure.

## Active Quality Gate

The **CI & Quality Gate** workflow remains enabled for pushes and pull requests targeting `main`. It validates the Supabase schema contract, TypeScript, automated tests, dependency audit, production build, and browser signup journey. Its result is visible through the repository status badge in [README.md](README.md).
Until GitHub branch protection becomes available, maintainers must treat a passing **CI & Quality Gate** run as the required pre-merge condition and avoid merging pull requests with a failing or incomplete run. The release-notes workflow is independent of this policy and creates release notes only from a version tag or explicit manual dispatch.

## Future Enforcement Option

If GitHub Pro is later enabled for the private repository, configure branch protection or a repository ruleset for `main` with the following settings:
| Control | Required setting |
| --------------- | --------------------------------------------- |
| Pull requests | Require a pull request before merging |
| Required check | `Unit, Schema, Type and Production Build` |
| Dependent check | `Browser Signup Journey` |
| Stale approvals | Dismiss approvals when new commits are pushed |
| Administrators | Include administrators in the policy |
| Force pushes | Disallow |
No workflow, application behavior, production data, credentials, or schedules are modified by this policy document.
