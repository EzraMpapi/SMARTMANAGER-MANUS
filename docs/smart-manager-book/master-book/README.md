# SMART MANAGER ERP — Master System Book

This directory contains the repository-audited English and Tanzanian Swahili master book generated on 24 August 2026. It documents the current Smart Manager source tree, source-versioned Supabase migrations, protected server boundaries, authenticated UI surfaces, saved live Supabase schema metadata, migration ledger, advisor findings, verified screenshots, and managed brand assets.

## Deliverables

| File | Purpose |
|---|---|
| `SMART_MANAGER_MASTER_BOOK_EN_SW.md` | Editable Markdown source containing the complete English reference and Tanzanian Swahili edition. |
| `deliverables/SMART_MANAGER_MASTER_BOOK_EN_SW.docx` | Editable Word deliverable with cover, narrative chapters, tables, and live table appendix. |
| `deliverables/SMART_MANAGER_MASTER_BOOK_EN_SW.pdf` | A4 typeset PDF with automatic contents, running headers, page numbers, images, tables, English chapters, and Swahili reference chapters. |
| `typst-project/main.typ` | Native Typst source used to produce the PDF. |
| `master_book_builder.py` | Reproducible generator for Markdown, DOCX, Typst, and manifest outputs. |
| `deliverables/SMART_MANAGER_MASTER_BOOK_MANIFEST.json` | Version, evidence counts, source commit, and delivery manifest. |
| `evidence/` | Read-only Supabase snapshots, advisor results, visual QA notes, branding provenance, and live audit metrics. |
| `typst-project/assets/` | Curated verified screenshots, diagrams, workflow figures, and recovered official brand assets. |

## Evidence and status rules

The book uses `IMPLEMENTED`, `TESTING`, `PARTIALLY IMPLEMENTED`, `CONFIGURATION REQUIRED`, `EXTERNAL SERVICE REQUIRED`, and `BLOCKED` as evidence labels. A completed source contract or automated test does not prove that a live provider credential, real tenant data walkthrough, production callback, or migration application exists. Live Supabase evidence in this directory was collected read-only; no DDL, payment collection, external message, or secret was invoked while generating the book.

The Supabase inventory snapshot reported 542 tables, including 519 public and 23 auth tables. All 519 public application tables reported RLS enabled. The seven entries without RLS are Supabase-managed auth-schema tables outside the application public schema and auto-generated Data API; they should not be blanket-enabled by an application migration. The live migration ledger snapshot returned 133 records. The saved advisor snapshots returned 119 security lints and 851 performance lints at the audit timestamp. These values are historical evidence for this edition and should be rechecked after schema or deployment changes.

## Rebuild

From this directory, run:

```bash
python3 master_book_builder.py
cd typst-project
 typst compile --font-path /usr/share/fonts main.typ ../deliverables/SMART_MANAGER_MASTER_BOOK_EN_SW.pdf
```

The builder uses the prepared `report-theme.typ` base and does not fetch external data. Keep the `evidence/` directory and asset provenance together with the deliverables when distributing the book.

## Security boundary

Do not add Supabase service keys, HarakaPay keys, TRA/VFD credentials, OAuth secrets, storage credentials, personal identity numbers, passwords, raw patient records, or private customer records to this documentation directory. Use schema metadata, redacted status, source references, and controlled evidence instead.

## Next safe audit cycle

Revalidate the live schema and advisor results, complete controlled authenticated CRUD journeys for the modules marked `TESTING`, apply only reviewed and source-versioned migrations, complete approved provider readiness checks, and update each status only when the new evidence exists.
