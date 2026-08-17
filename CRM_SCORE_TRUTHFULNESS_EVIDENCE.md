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
