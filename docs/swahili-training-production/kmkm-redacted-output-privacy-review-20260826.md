# Controlled Redacted Output Privacy Review — 26 August 2026

## Purpose

This record validates only the **external, redacted, non-record-bearing** training outputs produced by `scripts/redact_kmkm_training_captures.py`. It is not a record of private KMKM source screenshots, which remain outside the repository and must never be attached, committed, or reused.

## Corrective action recorded

The first Finance review found that the generic caption disclosed the demonstration tenant acronym. Although the owner authorized controlled use of the KMKM tenant, the course requirement excludes tenant identifiers from final training media. The utility was corrected to use the tenant-neutral phrase **“Redacted owner-approved demonstration capture”** and all four outputs were regenerated before this review continued.

| Frame | Dimensions | Result | Privacy review finding | Permitted use |
|---|---:|---|---|---|
| Finance orientation | 893×768 | **Pass after correction and hardening** | Header, profile/workspace identity, content workspace, record details, values, dates, and alert counts are covered. Retained sidebar is generic navigation orientation only; no tenant name or account information is visible. | Redacted Finance orientation only, paired with the Finance conceptual workflow plate. |
| Inventory orientation | 893×768 | **Pass after correction and hardening** | Header, profile/workspace identity, content workspace, record details, values, dates, and alert counts are covered. Retained sidebar has generic module labels only; no SKU, item, location, quantity, user, or tenant information is visible. | Redacted Inventory orientation only, paired with the Inventory conceptual workflow plate. |
| Dashboard orientation | 893×768 | **Pass after correction and hardening** | Header, profile/workspace identity, content workspace, record details, values, dates, alerts, tenant labels, and sidebar state badges are covered. Retained sidebar is generic navigation orientation only. | Redacted Dashboard orientation only; may be used for controlled course orientation. |
| Sales orientation | 893×768 | **Pass after correction and hardening** | Header, profile/workspace identity, content workspace, customer/transaction data, amounts, dates, tenant labels, and the initially observed Sales dynamic badge are covered. Retained sidebar is generic navigation orientation only. | Redacted Sales orientation only, paired with the Sales conceptual workflow plate. |

> Passing a frame means it may show **module-shell orientation only**. It never proves an operational result, permission level, integration status, analytics result, or completed business workflow.

## Final hardening result

During Sales review, a dynamic badge in the retained sidebar edge was detected. The utility was hardened to mask the full right-hand sidebar region from 13% to 24.5% of the source width, and all four outputs were regenerated. The final Sales and Dashboard rechecks confirm the badge is no longer visible. This documents a successful privacy remediation, not a relaxation of the release gate.

## Release gate

No redacted frame may be copied into Git, distributed outside the approved production workspace, or added to a chapter assembly list until this record identifies it as a pass and the chapter repeats the required explanatory-only qualifier.
