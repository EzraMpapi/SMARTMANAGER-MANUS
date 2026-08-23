# Smart Manager — BusinessSphere ERP

[![CI & Quality Gate](https://github.com/EzraMpapi/SMARTMANAGER-MANUS/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/EzraMpapi/SMARTMANAGER-MANUS/actions/workflows/ci.yml)

Smart Manager is a tenant-aware ERP workspace that integrates commercial, financial, operational, healthcare, pharmacy, microfinance, and school-management workflows.

## Repository Quality Controls

The **CI & Quality Gate** badge above reflects the current `main`-branch workflow status. The workflow validates the Supabase contract, TypeScript, automated test suite, dependency audit, production build, and isolated browser signup journey.

Release notes are generated automatically when a version tag matching `v*` is pushed. A maintainer can also open **Actions → Generate Release Notes → Run workflow**, provide a version tag, and publish a GitHub Release with notes generated from repository history. See [RELEASE_NOTES.md](RELEASE_NOTES.md) for the release procedure.

## Collaboration Workflow

All project changes follow the non-destructive retrieval, validation, commit, remote-verification, and publication workflow documented in [REPOSITORY_TRACKING.md](REPOSITORY_TRACKING.md).

## Vercel Deployment Contract

The GitHub production source is the `main` branch of `EzraMpapi/SMARTMANAGER-MANUS`. Vercel must use the repository root as its Root Directory, the Vite framework preset, `pnpm run build` as the Build Command, and `dist/public` as the Output Directory. The repository’s `vercel.json` also bundles `dist/api.js` for the `/api` function and rewrites the application shell to `index.html`. Production builds run `verify:supabase-schema` before bundling, so every repository migration required by the application must be applied to the connected Supabase project before promotion. Keep Git author and committer identity configured as **Ezra Mpapi <ezraincome@gmail.com>**; do not rewrite already-pushed history solely to change older commit metadata.
