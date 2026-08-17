# Customer Relationship Workspace — Score Truthfulness Repair

## Scope

This focused repair addressed the first confirmed data-truthfulness defect found after selecting the customer-relationship workspace as the next high-priority area. The existing client used an arbitrary score of `50` when a lead had no confirmed scoring value. That made a default appear as an operational score in both newly created and imported lead workflows.

## Repair

| Data path | Previous behavior | Current behavior |
| --- | --- | --- |
| Server row mapper | Missing score became `50`. | Missing score becomes `null`. |
| New lead draft | New records began with a client-invented score of `50`. | New records use `null` until a confirmed score exists. |
| Imported lead draft | Imported records began with the same invented default. | Imported records use `null` until a confirmed score exists. |
| Pipeline display | The raw score was rendered without an unavailable state. | The pipeline renders `—` and exposes a `No confirmed lead score` tooltip when no score exists. |

The repair does not create or overwrite a server score, and it does not attempt to generate a score in the browser. It preserves any score actually returned by the server or stored in the approved data envelope.

## Validation

The focused customer-relationship truthfulness test passed. The complete regression suite passed with **88 files / 292 tests**, alongside 5 intentionally gated files and 8 skips. Static type validation passed. No lead, customer, deal, tenant boundary, permission rule, or provider configuration was changed during this verification.

## Follow-up Deployment Verification

The deployed `crm_leads` table uses the generic tenant row contract: `id`, `company_id`, `name`, `status`, `amount`, `notes`, `data`, `created_at`, and `updated_at`. A read-only query for the visible record, **QA Acceptance Lead A2**, returned `data->>'score' = null`. Therefore its displayed `50` cannot be treated as a server-confirmed score.

The published client bundle serving the live CRM page was also inspected after a hard reload. It contained the obsolete `score:50` behavior and did not contain the new neutral-state copy. The source repair exists in the working tree, but a subsequent final CRM release must publish a freshly built bundle and then re-run live acceptance to prove that the displayed score is `—` with the unavailable explanation.

## Completed CRM Workspace Upgrade

The final review found and repaired a second confirmed-data boundary in the Customer 360 interaction timeline. In a configured workspace, an interaction had been inserted into local UI state and announced before Supabase confirmed the write. A failed request could therefore leave a visible, unconfirmed interaction. The repair now awaits the insert, verifies that Supabase returned an identifier, maps the returned generic data-envelope row, and only then adds it to the timeline and clears the draft. On failure, the entered interaction remains available for retry and the user receives the standard persistence error.

The generic interaction mapper now reads `customer_name`, channel, direction, summary, and occurred-at data from the row’s `data` envelope, with `created_at` as a timestamp fallback. This matches the deployed generic-table shape rather than assuming typed top-level interaction columns.

The CRM New Lead drawer also now prevents duplicate submissions while the confirmed server create is pending. A rejected create continues to keep the drawer and entered form values available, because only the confirmed server response closes the drawer and adds a lead to the pipeline.

| Validation | Result |
| --- | --- |
| Focused CRM truthfulness and persistence contracts | 2 files, 5 tests passed |
| Full regression suite | 89 files, 296 tests passed; 5 intentionally gated files, 8 skips |
| Static type validation | Passed |
| Bounded-heap production build | Passed; 2,653 modules transformed |

No CRM records, user records, credentials, provider settings, Resend configuration, RLS policy, or tenant boundary were changed during this workspace upgrade.
