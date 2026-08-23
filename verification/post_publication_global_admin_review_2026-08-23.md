# Post-Publication Global Admin Review

## Scope

This review checked the managed application route and the authorization boundary without changing roles, tenant data, control-plane records, or configuration.

## Result

The managed `/app` route loaded successfully and presented the secure workspace sign-in gate. The current browser session is not authenticated to a Platform Administrator account, so no Global Admin snapshot or cross-tenant data was requested. This is the expected least-privilege outcome for an unauthenticated session.

The focused Global Admin contract suite separately verifies that unauthenticated callers are rejected before the verification boundary is invoked, legacy application-admin status alone is insufficient, and the additional Supabase Platform Administrator role remains required.

## Follow-up

A real-role, read-only review remains ready once a user signs in with an authorized Platform Administrator account. The review should confirm only that the control center loads its bounded live snapshot and that non-mutating sections render; do not use the controlled-action flow during acceptance review.

## CI Evidence

The repository’s latest observed successful CI & Quality Gate run completed on the current `main` branch after a push. Its two completed jobs were **Unit, Schema, Type and Production Build** and **Browser Signup Journey**. The Actions summary reports that the full quality-gate workflow and the isolated browser journey completed successfully, while also noting platform warnings about Node 20 compatibility in upstream actions.

The GitHub Actions summary does not identify a higher-memory runner class. No runner configuration was changed during this review.

## Confirmed Rerun

With user approval, all jobs were re-run on the repository’s GitHub-hosted `ubuntu-latest` workflow. The confirmed rerun completed successfully in **5 minutes 32 seconds**: **Unit, Schema, Type and Production Build** completed in **3 minutes 17 seconds**, followed by **Browser Signup Journey** in **2 minutes 8 seconds**. The same upstream Node 20 deprecation annotations remained warnings only; neither job failed.

Subsequent concurrent commits advanced `main` after this rerun. Their history was preserved through a non-destructive merge; this rerun should therefore be read as verification of the exercised commit, not as a claim about later concurrent changes. Those later commits retain their own push-triggered CI evidence.

## Release-Tag Readiness

The verified CI rerun satisfies the repository validation prerequisite for a release tag. No release tag was created because explicit stakeholder acceptance has not yet been provided. The remaining acceptance action is a read-only Global Admin review by an authenticated Platform Administrator; it must not change a role, tenant, or control-plane record.

## Specified Vercel Deployment

The requested `https://menejajanja.vercel.com` address returned Vercel’s `DEPLOYMENT_NOT_FOUND` response at the root path. It therefore cannot currently serve the Global Admin experience or reach a protected application data path. No Vercel configuration, custom domain, deployment, user role, tenant data, or control-plane record was changed during this read-only availability check.

The corrected `https://menejajanja.vercel.app` deployment serves both the public landing page and the `/app` sign-in route. An unauthenticated request to the protected `globalAdmin.snapshot` tRPC endpoint returned **401**, which confirms that the Vercel deployment reaches the protected server boundary and does not disclose Global Admin data before authentication. A real-role review remains pending because the current browser session is not signed in as a Platform Administrator.

An authenticated Vercel session was then reviewed without changing any state. The active account identified as a tenant **owner**, not a Platform Administrator, and the workspace presented its subscription-required gate. The Global Admin control center was therefore not available to that account, which is consistent with the separate Platform Administrator requirement. No role, subscription, tenant record, or controlled action was changed. A real Platform Administrator session remains required for the final read-only control-center snapshot review.
