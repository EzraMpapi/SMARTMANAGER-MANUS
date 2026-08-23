# SMART MANAGER ERP Official Manual

This directory contains the trilingual customer-facing book prepared from the supplied master attachment and the verified SMART MANAGER ERP repository. The manual is written in English, Kiswahili, and French, and it covers the product story, customer value, operating model, module encyclopedia, connected workflows, subscriptions, security, administration, learning paths, troubleshooting, FAQ, glossary, and future roadmap.

The approved logo supplied by the owner is stored at `assets/smart-manager-logo.png`. The owner portrait supplied by the owner is stored at `assets/ezra-mpapi-owner.png`. Both assets are embedded unchanged into the requested editable Word document and print-ready PDF. No logo was generated or redrawn.

`deliverables/SMART_MANAGER_ERP_OFFICIAL_MANUAL.docx` is the editable Word edition. `deliverables/SMART_MANAGER_ERP_OFFICIAL_MANUAL.pdf` is the A4 print-ready edition. The Typst source is in `typst/main.typ`, with the portable theme and local image assets beside it. The source builder is `build_book.py`.

The content distinguishes implementation evidence from configuration requirements, external-service dependencies, partial delivery, UI-only surfaces, planned work, and unverified claims. Subscription facts are aligned to the live Free-15 and monthly-only migrations: `subscription_free_plan_model` version `20260823193058` and `subscription_monthly_constraint_correction` version `20260823193854`.

To rebuild the documents, run `python3 build_book.py`, then compile and verify the PDF with `python3 /home/ubuntu/skills/typst-pdf-maker/scripts/generate_pdf.py typst/main.typ --strict` and `python3 /home/ubuntu/skills/typst-pdf-maker/scripts/verify_pdf.py deliverables/SMART_MANAGER_ERP_OFFICIAL_MANUAL.pdf --profile text-document`.
