# School Management Module Design Contract

## Scope and tenant boundary

The School Management Module will replace the legacy client-managed school workspace with protected, tenant-scoped workflows. Every `sch_*` record uses the established generic envelope: `id`, `company_id`, `name`, `status`, `amount`, `notes`, `data`, `created_at`, and `updated_at`. Every protected operation will resolve the authenticated workspace profile before reads or writes and will reject references that do not belong to the same `company_id`. All School Management tables will be protected with Supabase row-level security against `current_company_id()`.

The existing legacy `sch_students`, `sch_teachers`, `sch_classes`, `sch_exams`, `sch_fees`, `sch_books`, and `sch_transport` tables will be retained as the operational record foundations. Their prior client-only seed fallbacks and direct browser writes will be removed from the School workspace. The production module will not populate synthetic student, guardian, financial, attendance, academic, or communication records.

## Domain records

| Area | Records | Primary responsibility |
| --- | --- | --- |
| Academic configuration | `sch_academic_years`, `sch_terms`, `sch_departments`, `sch_subjects`, `sch_classes`, `sch_streams`, `sch_grading_scales`, `sch_timetables` | Academic calendars, courses, class capacity, streams, grading bands, and scheduled instruction. |
| Admissions and learner records | `sch_admissions`, `sch_students`, `sch_guardians`, `sch_student_guardians`, `sch_enrollments`, `sch_documents` | Admissions approval, unique admission numbers, guardian relationships, enrollment history, and secure document references. |
| School workforce | `sch_teachers`, `sch_teacher_assignments` | Teacher-directory links, departments, subject/class assignment, and workload context. |
| Attendance and assessment | `sch_attendance_sessions`, `sch_attendance_records`, `sch_exams`, `sch_assessments`, `sch_assessment_scores`, `sch_report_cards`, `sch_assignments`, `sch_assignment_submissions` | Daily attendance, assessment setup, score capture, grading, reports, assignments, submission lifecycle, and calculation traceability. |
| Fees and financial services | `sch_fee_structures`, `sch_fee_invoices`, `sch_fee_invoice_lines`, `sch_payments`, `sch_scholarships` | Tanzania-ready TZS billing, invoice/receipt references, scholarships, balances, payment allocation, approval and Finance handoff. |
| Student services and resources | `sch_transport`, `sch_transport_assignments`, `sch_hostels`, `sch_hostel_allocations`, `sch_books`, `sch_library_loans`, `sch_inventory_items`, `sch_inventory_movements` | Transport route assignments, hostel capacity, library catalog and lending, school-resource movements, and Inventory cross-references. |
| Welfare, communications, and governance | `sch_disciplinary_records`, `sch_announcements`, `sch_messages`, `sch_portal_links`, `sch_notifications`, `sch_approval_requests`, `sch_audit_logs` | Discipline, role-targeted announcements, portal linkage, communication read states, protected approvals, notifications, and audit evidence. |

## Permission model

| Role group | Supported workspace roles | Authorised operations |
| --- | --- | --- |
| School administration | Super Administrator, Organization Owner, CEO, School Administrator, Academic Director, Principal | Full tenant-scoped configuration, admissions approval, academic governance, finance oversight, audit review, portal-link governance, and operational reporting. |
| Academic operations | Deputy Principal, Academic Master, Head of Department, Examination Officer, Registrar | Academic calendars, classes, subjects, enrollment, timetable, assessment setup, report-card review, and limited operational reporting. |
| Teaching staff | Teacher, Class Teacher | Assigned class and subject rosters, attendance, assignment, score-entry, learner-status visibility, and their own communication workflows. |
| Student welfare and services | Admissions Officer, Librarian, Transport Officer, Hostel Warden, Discipline Officer | Their assigned operational records only; no unrestricted academic, payment, or audit access. |
| Finance and administration | Bursar, Cashier, Billing Officer, Finance Manager, CFO | Fee structures, invoices, payments, scholarship settlement, receipt visibility, finance reports, and safe Finance handoffs. |
| Portal users | Parent, Guardian, Student | Only explicitly linked learner records, their attendance, invoices, approved report cards, assignments, and communications. Portal users cannot access another learner, classroom-wide data, staff data, payment configuration, or audit records. |

## Safeguards and calculation rules

Admissions issue unique per-company admission numbers only after required applicant and guardian validation succeeds. An admission cannot be approved unless its target academic year, class, and stream are active and tenant-scoped. Enrollment capacity checks use the active enrollment count and cannot exceed the configured class capacity.

Attendance is posted by server-side session and learner records. A learner can receive at most one attendance record per class session; a teacher can only record classes to which they are assigned, while academic administrators may correct an attendance record with a reasoned immutable audit record.

Assessment scores are bounded from zero to the assessment maximum. Grade derivation is server-side against the active tenant grading scale, captures the scale revision used, and only permits finalized report cards after the required score and approval conditions are met. Report cards remain immutable once published; a corrected result follows a versioned review and approval pathway rather than overwriting a released document.

Financial values are stored as decimal TZS values. An invoice is the source of the student balance; payments are positive, cannot exceed the remaining invoice balance, and are allocated to existing tenant invoices. Scholarship awards require an approval record before they reduce a balance. Receipts and Finance cross-references are created server-side without mutating unrelated Finance entries.

Library and inventory availability are never changed in the client. A loan cannot exceed the available copy count or duplicate an open loan for the same copy; an inventory issue cannot create a negative balance. Transport and hostel assignments validate active route/bed capacity before confirming placement. Every service allocation, financial settlement, result publication, and disciplinary action creates an audit event.

## Integration boundaries

The module cross-references existing HR and Employee records for teacher and staff identity; Payroll receives only approved staff-workload or allowance references where configured. Finance receives immutable invoice, payment, scholarship, and receipt references. Inventory records are cross-referenced for school resources rather than silently mutating unrelated stock. Healthcare can be referenced only for an explicitly authorised student welfare or medication note, never displayed in parent, teacher, or student portals without the required clinical permissions. Pharmacy is not given learner or guardian access through the School module. Microfinance is not coupled to a student account unless an explicitly approved fee-financing workflow is later configured.

Documents use server-side object storage. The database stores only a tenant-scoped storage key, document type, metadata, and access classification; file bytes, provider credentials, and unscoped URLs are never persisted in database fields or returned to unauthorised portal users.

## Product and quality acceptance criteria

Every visible action in the new School Management Command Center must call a protected procedure or display a clear permission, validation, loading, empty, or error state. No School Management action may rely on legacy seed data, silent catch blocks, client-side balance mutation, or direct browser writes. The release requires schema verification, tenant-isolation and role tests, calculation tests, responsive browser flows for School Administrator and restricted portal/teacher views, TypeScript validation, a production build, and a published checkpoint.
