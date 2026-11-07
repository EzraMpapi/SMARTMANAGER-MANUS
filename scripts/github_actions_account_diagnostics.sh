#!/usr/bin/env bash
# Read-only GitHub Actions/account diagnostics.
# This script never prints the token and does not mutate repositories, workflows,
# billing, runners, secrets, or environments.
set -Eeuo pipefail

REPOSITORY="${GITHUB_REPOSITORY:-EzraMpapi/SMARTMANAGER-MANUS}"
OWNER="${REPOSITORY%%/*}"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required." >&2
  exit 2
fi

if ! gh auth status >/tmp/github-actions-diagnostics-auth.txt 2>&1; then
  echo "gh is not authenticated. Run 'gh auth login' outside this script." >&2
  exit 3
fi
rm -f /tmp/github-actions-diagnostics-auth.txt

print_json() {
  local label="$1"
  local endpoint="$2"
  echo "--- ${label} ---"
  if ! gh api "$endpoint" --jq '.' 2>/tmp/github-actions-diagnostics-error.txt; then
    sed -E 's/(token|authorization|password|secret)[=:][^ ,}]+/\1=[REDACTED]/Ig' \
      /tmp/github-actions-diagnostics-error.txt >&2 || true
    echo "unavailable"
  fi
  rm -f /tmp/github-actions-diagnostics-error.txt
}

print_headers() {
  local endpoint="$1"
  echo "--- token scope headers ---"
  # gh --include prints response headers and body; stop at the first blank line
  # so no profile JSON is emitted and no request authorization header is shown.
  gh api --include "$endpoint" 2>/dev/null | awk '
    BEGIN { IGNORECASE=1 }
    /^x-oauth-scopes:/ || /^x-accepted-oauth-scopes:/ || /^x-ratelimit-limit:/ || /^x-ratelimit-remaining:/ || /^x-ratelimit-reset:/ { print }
    /^$/ { exit }
  ' || echo "scope headers unavailable"
}

print_headers "user"
print_json "account identity (non-sensitive fields)" "user"
print_json "repository Actions permissions" "repos/${REPOSITORY}/actions/permissions"
print_json "repository workflow permissions" "repos/${REPOSITORY}/actions/permissions/workflow"
print_json "repository self-hosted runners" "repos/${REPOSITORY}/actions/runners?per_page=100"
print_json "recent Actions runs" "repos/${REPOSITORY}/actions/runs?per_page=10"
print_json "API rate-limit resources" "rate_limit"

# GitHub exposes user billing through a permission-restricted endpoint. Preserve
# the HTTP status without treating a 403 as evidence of a quota exhaustion.
echo "--- user Actions billing endpoint ---"
if gh api --include "users/${OWNER}/settings/billing/actions" >/tmp/github-actions-diagnostics-billing.txt 2>&1; then
  sed -n '1,/^$/p' /tmp/github-actions-diagnostics-billing.txt | grep -Ei '^(HTTP/|x-ratelimit-|content-type:)' || true
  echo "billing payload available to current token"
else
  sed -n '1,/^$/p' /tmp/github-actions-diagnostics-billing.txt | grep -Ei '^(HTTP/|x-ratelimit-|content-type:)' || true
  echo "billing payload unavailable to current token; verify in GitHub Settings > Billing and licensing > Plans and usage"
fi
rm -f /tmp/github-actions-diagnostics-billing.txt

echo "--- interpretation ---"
echo "An empty self-hosted-runner list does not restrict ubuntu-latest GitHub-hosted jobs."
echo "A 403 from the billing endpoint means the token cannot inspect billing; it is not proof of quota exhaustion."
echo "Runner startup failures with runner_name=null and steps=[] require GitHub Actions/account telemetry beyond this read-only API surface."
