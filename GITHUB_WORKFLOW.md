# GitHub Workflow & Deployment Guide

This document defines the standard procedure for committing and pushing verified Smart Manager ERP updates (`businesssphere-erp`) to the canonical repository [`EzraMpapi/SMARTMANAGER-MANUS`](https://github.com/EzraMpapi/SMARTMANAGER-MANUS).

## Repository remote configuration

The local `github` remote must point to:

```text
https://github.com/EzraMpapi/SMARTMANAGER-MANUS.git
```

The primary branch is `main`. The managed WebDev `origin` remote remains the project checkpoint remote; do not replace it with the public GitHub remote.

## Standard verified push procedure

Run from the project root after the change is implemented and reviewed:

```bash
cd /home/ubuntu/businesssphere-erp
pnpm exec tsc --noEmit --pretty false
pnpm exec vitest run --maxWorkers=1 --minWorkers=1 --reporter=dot
pnpm exec vite build --minify=false
pnpm exec esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
git add -A
git commit -m "feat(erp): describe the verified change"
git push github main --force-with-lease
```

The low-memory Vite command is intentional for the monolithic dashboard bundle. The regular `pnpm build` script remains the canonical package script; if the sandbox terminates it during chunk rendering, run the equivalent two build commands above and record the resource limitation rather than treating it as a code failure.

## Safety checklist before pushing

Before pushing, confirm that the full automated suite passes, TypeScript has no errors, the frontend and server bundles build successfully, no unresolved conflict markers remain, no secrets are staged, and the current `github` remote resolves to `EzraMpapi/SMARTMANAGER-MANUS`.

Do not commit API keys, passwords, access tokens, certificates, private keys, portal sessions, or tenant secrets. Use managed environment variables and server-side secret storage for external integrations.

## TRA-specific release boundary

A TRA UI or internal ERP preparation flow may be pushed after tests and build validation. Direct TRA production submission, tax payment, receipt fiscalization, or recurring external notification schedules require approved official TRA documentation, credentials, and explicit authorization. Do not create or activate those external actions from a development session without the required evidence and user confirmation.
