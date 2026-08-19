# Secure Secrets Configuration Guide

To enable automated Slack deployment and CI failure notifications for Smart Manager ERP, the repository requires a repository secret.

## Required Secret

- **Secret Name**: `SLACK_WEBHOOK_URL`
- **Purpose**: Receives JSON payloads from GitHub Actions when `pnpm test` and `pnpm build` succeed or fail.

## How to Add the Secret in GitHub

1. Navigate to your GitHub repository: [EzraMpapi/businesssphere-erp](https://github.com/EzraMpapi/businesssphere-erp).
2. Click on **Settings** in the top repository navigation bar.
3. In the left sidebar, expand **Secrets and variables** and click **Actions**.
4. Click **New repository secret**.
5. Set **Name** to `SLACK_WEBHOOK_URL` and paste your Slack incoming webhook URL into the **Secret** field.
6. Click **Add secret**.
