# GitHub Workflow & Deployment Guide

This document defines the standard procedure for committing and pushing updates for Smart Manager ERP (`businesssphere-erp`) to the GitHub repository [`EzraMpapi/businesssphere-erp`](https://github.com/EzraMpapi/businesssphere-erp).

## Repository Remote Configuration

- **GitHub Remote (`github`)**: `https://github.com/EzraMpapi/businesssphere-erp.git`
- **Primary Branch**: `main`

## Standard Push Procedure

Whenever new features, bug fixes, or governance enhancements are completed and verified via automated tests and build checks, execute the following shell commands in the project root:

```bash
cd /home/ubuntu/businesssphere-erp
git add -A
git commit -m "feat(erp): describe your changes clearly"
git push github main
```

## Safety Checklist Before Pushing

1. **Test Suite**: Run `pnpm test` to verify that all automated regression tests pass successfully.
2. **Production Build**: Run `pnpm build` to verify that TypeScript compilation and esbuild bundling complete without errors.
3. **Sensitive Secrets**: Ensure no API keys, tokens, or credentials are hardcoded in source files; use `webdev_request_secrets` and environment variables.
