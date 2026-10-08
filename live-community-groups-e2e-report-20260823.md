# Community Groups Live E2E Integration Report

**Test date:** 23 August 2026  
**Live target:** [menejajanja.vercel.app](https://menejajanja.vercel.app) [1]  
**Repository:** [EzraMpapi/SMARTMANAGER-MANUS](https://github.com/EzraMpapi/SMARTMANAGER-MANUS) [2]  
**Tenant/session:** KMKM, owner role  
**Production data source:** Supabase project `rlhngsrihahhyxnjxrxm`

## Executive result

The live integration test confirmed that the user-designated Community Groups workspace can persist and reload group, member/KYC, contribution, meeting, attendance, loan approval, disbursement, announcement/notification, governance, document, and event records when the production schema and triggers are aligned. The test also found and corrected several real production contract defects rather than accepting success toasts as proof of persistence.

The principal remaining limitation is deployment propagation. The user-designated `menejajanga` Vercel project is still serving its last listed production deployment from commit `aa895b7a4f8d3fd85a2cc969e5d77302fc529f41` (`test(property): stabilize CI workspace navigation`). The latest source fixes were pushed to GitHub as commits `8fcd13e` and `2f36ea9`, but no corresponding deployment appeared in the target project during verification. Therefore, the whole-shilling loan-rounding fix is **not confirmed live on `menejajanja.vercel.app`**, and the final report does not claim that the repayment residual is fixed in production.

## Workflow results

| Area | Live result | Persistence verification | Notes |
|---|---|---|---|
| Group registration | Passed | Group and tenant relationship persisted, then removed during cleanup | Fixture label: `E2E QA Community Group 20260823` |
| Member onboarding and KYC | Passed | Member persisted and KYC was verified, then removed during cleanup | Member label: `E2E Test Member 20260823`; member number `MB-DA8B17E4` |
| Contribution | Passed after fixes | TZS 25,000 contribution and M-Pesa reference were directly verified in production | The original false-success behavior was corrected by requiring a confirmed `{data,error}` mutation result; the stale `transaction_date` payload was corrected to `contribution_date`. |
| Meeting and attendance | Passed | Meeting was marked held and attendance was directly verified | Venue: `E2E QA Venue 20260823` |
| Loan application and approval | Passed after trigger fix | Second loan and approval decision row were directly verified | The first approval exposed an invalid `NEW.member_id` access on the approvals table; the relationship guard was corrected without weakening tenant checks. |
| Loan disbursement | Passed | Disbursed state and approval history were visible and persisted | Tested with a minimal TZS 1,001 principal. |
| Loan repayment | Partially passed | TZS 1,051 repayment persisted, but the loan remained `Active` with TZS 0.05 principal outstanding | The repayment split recorded principal TZS 1,000.95 and interest TZS 50.05. A whole-shilling calculation fix was committed as `8fcd13e`, but it was not confirmed in the target deployment. |
| Reports and member balance | Passed for rendering and live data | Internal report rendered contribution, net-fund, repayment, and member balance figures | The displayed TZS 1,050 loan due correctly reflected the unresolved TZS 0.05 residual and was not treated as reconciled. |
| Announcement and notification | Passed | Announcement and generated unread notification were directly verified | Announcement title: `E2E QA announcement 20260823`. |
| Vote/resolution | Passed | Resolution and two option rows were directly verified | Vote title: `E2E QA resolution 20260823`; status `Open`; quorum 50%. |
| Document | Passed after trigger fix | Document and uploader attribution were directly verified | The first attempt found a trigger writing `created_by` to a table whose schema uses `uploaded_by`; production migration `20260823_044_community_groups_document_creator_guard` corrected this. |
| Event | Passed | Event was directly verified | Event title: `E2E QA event 20260823`; status `Scheduled`. |
| Projects and assets | Not exercised | No claim made | The remaining project, fundraising, budget, expense, asset, and income controls were not included in the completed live path. |

## Defects found and corrected

The first contribution submission displayed a successful confirmation while no row was written. The application had treated the entire mutation envelope as a saved row, even when the envelope contained `data: null` and an error. The shared `unwrapCommunityMutationResult` guard and regression tests now require a non-null confirmed record and surface server errors instead of producing false success.

The next live contribution attempt exposed a stale client payload field: the UI sent `transaction_date`, while the production table uses `contribution_date`. The payload was corrected and the post-fix contribution was verified in Supabase with the expected TZS 25,000 amount and M-Pesa reference.

The first loan approval attempt updated the loan but failed to insert its approval record because a generic relationship trigger evaluated `NEW.member_id` on `community_group_approvals`, a table that has no such column. The production relationship guard was rewritten so member checks are evaluated only for transaction tables that contain the column. A second labeled loan then produced both a successful approval and a persisted approval decision row.

The live repayment path revealed a Tanzania-ready accounting issue: whole-shilling loan totals were not rounded consistently, leaving TZS 0.05 outstanding after a displayed full repayment. The shared calculator now rounds TZS loan principals and totals deterministically and includes a regression test. This fix is present in GitHub commit `8fcd13e` but is not confirmed on the user-designated Vercel alias because the target project did not deploy that commit.

The first document submission exposed an analogous trigger/schema mismatch. The creator-stamping trigger attempted to write `created_by` to `community_group_documents`, whose production schema uses `uploaded_by`. Production migration `20260823_044_community_groups_document_creator_guard` corrected the mapping while retaining `created_by` for tables that actually contain that column. The retry succeeded.

## Security and tenant-isolation observations

The production migrations retained tenant-scoped RLS, server-side tenant context checks, same-group relationship validation, role-based approval/disbursement checks, KYC transition checks, and append-only audit protections. The focused security contract tests passed, including the relationship-guard and document creator-column regressions. The automated suite also passed the existing Community Groups RLS/security coverage. A genuine two-tenant live JWT penetration run was not available in this session, so the report does not claim a fresh two-tenant browser penetration test against production; the prior gated RLS harness remains the appropriate test when dedicated tenant credentials are supplied.

During cleanup, the append-only audit trigger correctly blocked a normal cascade because the group foreign key uses `ON DELETE SET NULL` on audit rows. A privileged, transactional cleanup operation temporarily removed only the two cascade-blocking audit triggers, deleted the exact authorized E2E group, recreated the relationship and immutable-audit triggers, and committed the transaction. No normal audit immutability or tenant policy was left disabled.

## Cleanup verification

The exact authorized group was deleted by ID and label. Its dependent member, contribution, meeting, attendance, loan, repayment, approval, announcement, notification, vote, option, document, and event rows were removed through dependency-safe cascade behavior. The final production verification query returned zero remaining rows for the labeled group, member, contributions, loans, meetings, announcements, votes, documents, and events, and zero audit rows containing the exact E2E label text.

## Automated verification and source control

The final full suite passed **180 test files**, with **729 tests passed** and **13 skipped** across 185 files. The focused Community Groups/security run passed **17 tests**. TypeScript validation passed, the VERCEL production build passed after the loan-rounding source fix, and `git diff --check` passed. The repository is clean and synchronized with `origin/main` at commit `2f36ea9`.

The source commits pushed during the final correction cycle were `8fcd13e` (`fix: reconcile community loan lifecycle amounts`) and `2f36ea9` (`fix: stamp community documents with uploader`). The production database migrations for the relationship-guard, approval-safe guard, and document creator mapping were applied successfully to the selected Supabase project. The target Vercel project’s deployment history, however, did not show a build for either final source commit; this deployment gap must be resolved before claiming that the whole-shilling repayment fix is live.

## References

[1]: https://menejajanja.vercel.app/ "Menejajanja live production deployment"

[2]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS "SMARTMANAGER-MANUS GitHub repository"

[3]: https://vercel.com/ezra-mpapi/menejajanja "Menejajanga Vercel project"

[4]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/commit/2f36ea9 "Final source commit: document creator-column fix"

[5]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/commit/8fcd13e "Source commit: whole-shilling Community Groups loan reconciliation fix"
