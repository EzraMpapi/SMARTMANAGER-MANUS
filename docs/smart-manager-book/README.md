# SMART MANAGER ERP Official Manual

This directory contains the trilingual customer-facing book prepared from the supplied master attachment and the verified SMART MANAGER ERP repository. The manual is written in English, Kiswahili, and French, and it covers the product story, customer value, operating model, module encyclopedia, connected workflows, subscriptions, security, administration, learning paths, troubleshooting, FAQ, glossary, and future roadmap.

The approved logo and owner portrait are preserved outside the project and served from managed storage. Their non-sensitive location record is maintained in `../../MANAGED_DOCUMENT_ASSET_MANIFEST.md`. The editable Word document and print-ready PDF retain the approved source imagery; no logo was generated or redrawn.

`deliverables/SMART_MANAGER_ERP_OFFICIAL_MANUAL.docx` is the editable Word edition. `deliverables/SMART_MANAGER_ERP_OFFICIAL_MANUAL.pdf` is the A4 print-ready edition. The Typst source is in `typst/main.typ`, with the portable theme beside it. The source builder is `build_book.py` and resolves the approved logo and portrait from `/home/ubuntu/webdev-static-assets/businesssphere-doc-assets/` by default, or from `SMART_MANAGER_BOOK_ASSET_ROOT` when explicitly supplied.

The content distinguishes implementation evidence from configuration requirements, external-service dependencies, partial delivery, UI-only surfaces, planned work, and unverified claims. Subscription facts are aligned to the live Free-15 and monthly-only migrations: `subscription_free_plan_model` version `20260823193058` and `subscription_monthly_constraint_correction` version `20260823193854`.

To rebuild the documents, run `python3 build_book.py`, then compile and verify the PDF with `python3 /home/ubuntu/skills/typst-pdf-maker/scripts/generate_pdf.py typst/main.typ --strict` and `python3 /home/ubuntu/skills/typst-pdf-maker/scripts/verify_pdf.py deliverables/SMART_MANAGER_ERP_OFFICIAL_MANUAL.pdf --profile text-document`.
