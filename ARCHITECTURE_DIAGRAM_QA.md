# Architecture diagram set visual QA

The eight Mermaid diagrams rendered successfully as separate RGB PNG files at 3120 px width. The contact sheet confirms consistent title treatment, color coding, node grouping, and readable directed relationships across the full set. The deployment/runtime diagram was inspected at full resolution and is legible as a wide topology: developer workspace → GitHub main → quality gates → Vercel/MANUS hosting → production HTTPS entrypoint, with OAuth, Supabase PostgreSQL, object storage, and heartbeat callbacks shown as runtime dependencies.

The set is intentionally split into focused views so the user can inspect each concern independently rather than reading a single overcrowded canvas. The next QA pass should inspect a taller workflow and security diagram at full resolution, then generate the multi-page PDF and accompanying senior-level guide.

The security diagram is readable at full resolution and correctly emphasizes the trust chain from authenticated request to verified profile, protected procedure, tenant and role checks, RLS, maker-checker, concurrency/idempotency, AML controls, persistent records, and audit trail. The critical-workflows diagram is readable and separates lending/cooperative, commercial, people, vertical-service, and cross-cutting control flows; dashed links make shared validation, posting, reconciliation, and reporting explicit without collapsing the business flows into one sequence.

The rebuilt PDF now has 9 pages: one compact cover plus one page per focused diagram. The cover contents table fits on a single page, and the final workflow page remains readable with the diagram above a concise senior-developer interpretation. The PDF is unencrypted, landscape A4, and suitable for review or printing.
