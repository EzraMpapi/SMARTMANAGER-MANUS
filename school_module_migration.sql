-- School Management Module: tenant-safe academic, learner, assessment, fee, service, portal, and governance workflows.
-- Every table follows the established BusinessSphere generic tenant envelope.

create table if not exists public.sch_academic_years (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Draft', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_terms (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Draft', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_departments (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_subjects (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_streams (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_grading_scales (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Draft', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_timetables (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Scheduled', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_admissions (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Submitted', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_guardians (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_student_guardians (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_enrollments (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_documents (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_teacher_assignments (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_attendance_sessions (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Open', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_attendance_records (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Present', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_assessments (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Draft', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_assessment_scores (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Draft', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_report_cards (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Draft', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_assignments (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Published', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_assignment_submissions (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Submitted', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_fee_structures (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_fee_invoices (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Open', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_fee_invoice_lines (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Posted', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_payments (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Recorded', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_scholarships (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Requested', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_transport_assignments (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_hostels (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_hostel_allocations (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_library_loans (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'On loan', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_inventory_items (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_inventory_movements (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Posted', amount numeric not null default 0, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_disciplinary_records (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Draft', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_announcements (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Published', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_messages (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Sent', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_portal_links (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Active', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_notifications (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Unread', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_approval_requests (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Pending', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.sch_audit_logs (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, status text not null default 'Recorded', amount numeric null, notes text null, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create unique index if not exists sch_academic_years_company_name_idx on public.sch_academic_years (company_id, lower(name));
create unique index if not exists sch_terms_company_year_name_idx on public.sch_terms (company_id, (data ->> 'academicYearId'), lower(name));
create unique index if not exists sch_departments_company_name_idx on public.sch_departments (company_id, lower(name));
create unique index if not exists sch_subjects_company_code_idx on public.sch_subjects (company_id, (data ->> 'code')) where coalesce(data ->> 'code', '') <> '';
create unique index if not exists sch_streams_company_class_name_idx on public.sch_streams (company_id, (data ->> 'classId'), lower(name));
create unique index if not exists sch_students_company_admission_no_idx on public.sch_students (company_id, (data ->> 'admissionNo')) where coalesce(data ->> 'admissionNo', '') <> '';
create unique index if not exists sch_enrollments_company_student_term_idx on public.sch_enrollments (company_id, (data ->> 'studentId'), (data ->> 'termId')) where coalesce(data ->> 'studentId', '') <> '' and coalesce(data ->> 'termId', '') <> '';
create unique index if not exists sch_student_guardians_company_pair_idx on public.sch_student_guardians (company_id, (data ->> 'studentId'), (data ->> 'guardianId'));
create unique index if not exists sch_teacher_assignments_company_term_assignment_idx on public.sch_teacher_assignments (company_id, (data ->> 'teacherId'), (data ->> 'classId'), (data ->> 'subjectId'), (data ->> 'termId'));
create unique index if not exists sch_attendance_records_company_session_student_idx on public.sch_attendance_records (company_id, (data ->> 'sessionId'), (data ->> 'studentId'));
create unique index if not exists sch_assessment_scores_company_assessment_student_idx on public.sch_assessment_scores (company_id, (data ->> 'assessmentId'), (data ->> 'studentId'));
create unique index if not exists sch_report_cards_company_student_term_idx on public.sch_report_cards (company_id, (data ->> 'studentId'), (data ->> 'termId'));
create unique index if not exists sch_fee_invoices_company_invoice_no_idx on public.sch_fee_invoices (company_id, (data ->> 'invoiceNo')) where coalesce(data ->> 'invoiceNo', '') <> '';
create unique index if not exists sch_library_loans_company_book_student_open_idx on public.sch_library_loans (company_id, (data ->> 'bookId'), (data ->> 'studentId')) where status = 'On loan';
create unique index if not exists sch_portal_links_company_profile_scope_idx on public.sch_portal_links (company_id, (data ->> 'profileId'), (data ->> 'scope'), (data ->> 'recordId'));
create index if not exists sch_admissions_company_status_idx on public.sch_admissions (company_id, status, created_at desc);
create index if not exists sch_timetables_company_class_idx on public.sch_timetables (company_id, (data ->> 'classId'), (data ->> 'termId'));
create index if not exists sch_attendance_sessions_company_date_idx on public.sch_attendance_sessions (company_id, (data ->> 'attendanceDate'), created_at desc);
create index if not exists sch_assessments_company_term_class_idx on public.sch_assessments (company_id, (data ->> 'termId'), (data ->> 'classId'), created_at desc);
create index if not exists sch_assignments_company_class_due_idx on public.sch_assignments (company_id, (data ->> 'classId'), (data ->> 'dueAt'));
create index if not exists sch_payments_company_invoice_idx on public.sch_payments (company_id, (data ->> 'invoiceId'), created_at desc);
create index if not exists sch_notifications_company_status_idx on public.sch_notifications (company_id, status, created_at desc);
create index if not exists sch_approval_requests_company_status_idx on public.sch_approval_requests (company_id, status, created_at desc);
create index if not exists sch_audit_logs_company_created_idx on public.sch_audit_logs (company_id, created_at desc);

do $$
declare school_table text;
begin
  foreach school_table in array array[
    'sch_academic_years','sch_terms','sch_departments','sch_subjects','sch_streams','sch_grading_scales','sch_timetables',
    'sch_admissions','sch_students','sch_guardians','sch_student_guardians','sch_enrollments','sch_documents','sch_teachers','sch_teacher_assignments',
    'sch_classes','sch_attendance_sessions','sch_attendance_records','sch_exams','sch_assessments','sch_assessment_scores','sch_report_cards','sch_assignments','sch_assignment_submissions',
    'sch_fees','sch_fee_structures','sch_fee_invoices','sch_fee_invoice_lines','sch_payments','sch_scholarships',
    'sch_transport','sch_transport_assignments','sch_hostels','sch_hostel_allocations','sch_books','sch_library_loans','sch_inventory_items','sch_inventory_movements',
    'sch_disciplinary_records','sch_announcements','sch_messages','sch_portal_links','sch_notifications','sch_approval_requests','sch_audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', school_table);
    execute format('drop policy if exists %I on public.%I', school_table || '_company_scope', school_table);
    execute format('create policy %I on public.%I for all using (company_id = current_company_id()) with check (company_id = current_company_id())', school_table || '_company_scope', school_table);
  end loop;
end $$;
