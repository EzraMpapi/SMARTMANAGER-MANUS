# SMART MANAGER ERP — Security and Database Compliance Report

This directory contains a focused extraction of the Smart Manager master book’s security risk register and live Supabase schema dictionary.

## Scope

The report documents six security and operational risks, their evidence, severity, triage priority, recommended remediation, and closure gates. It also records the canonical identity and tenancy contract, the canonical subscription contract, and the 519 public tables observed in the read-only Supabase metadata snapshot, including observed columns, primary keys, reported RLS state, and reported row estimates.

The report is evidence-bound to **24 August 2026**, Supabase project `rlhngsrihahhyxnjxrxm`, and source commit `d20a9b922e8596d54f3c7538b6389f71f4aef869`. The live inspection was read-only. No DDL, data mutation, payment, provider call, external message, or credential was invoked to produce this report.

## Outputs

| File | Purpose |
|---|---|
| `SMART_MANAGER_COMPLIANCE_REPORT.md` | Editable Markdown report with risk register, schema dictionary, interpretation rules, conclusion, and references. |
| `deliverables/SMART_MANAGER_COMPLIANCE_REPORT.docx` | Editable Word version with formatted tables and narrative sections. |
| `deliverables/SMART_MANAGER_COMPLIANCE_REPORT.pdf` | A4 typeset PDF; 48 pages. |
| `main.typ` | Typst source used for the PDF. |
| `build_compliance_report.py` | Reproducible builder using saved evidence snapshots. |
| `deliverables/SMART_MANAGER_COMPLIANCE_REPORT_MANIFEST.json` | Evidence and output manifest. |
| `evidence/` | Deterministic PDF verification and visual-review artifacts. |

## Current evidence snapshot

The saved inventory reports 542 total tables: 519 public and 23 auth. It reports 535 tables with RLS enabled and 7 requiring table-specific review in the returned metadata. The saved migration ledger contains 133 records. The advisor summary contains 119 security lints and 851 performance lints. These values are historical audit evidence and must be rechecked after schema or deployment changes.

## Safe-use boundary

Do not treat the table dictionary as a data export, the advisor totals as equal-severity vulnerabilities, or a source contract as proof that a provider or tenant workflow is production-ready. Do not apply bulk RLS rewrites, blanket `SECURITY DEFINER` revocations, destructive policy drops, or duplicate auth/subscription tables based on this report. Remediation should remain signature-specific, command-specific, tenant-scoped, source-versioned, and tested.

## Rebuild and verify

From the repository root:

```bash
python3 docs/smart-manager-book/compliance-report/build_compliance_report.py
cd docs/smart-manager-book/compliance-report
typst compile --font-path /usr/share/fonts main.typ deliverables/SMART_MANAGER_COMPLIANCE_REPORT.pdf
python3 /home/ubuntu/skills/typst-pdf-maker/scripts/verify_pdf.py deliverables/SMART_MANAGER_COMPLIANCE_REPORT.pdf --profile text-document
```

The builder reads only the committed master-book source and saved read-only evidence files. It does not fetch live data or require production credentials.

## Security notice

The report intentionally excludes service-role keys, provider tokens, passwords, private customer records, raw business payloads, and other secrets. Keep the evidence date and source commit with copies distributed outside the repository.
