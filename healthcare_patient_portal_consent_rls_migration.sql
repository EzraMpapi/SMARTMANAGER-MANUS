-- Restrict direct hc_patients access to internal healthcare workspace roles.
-- Patient portal accounts use the protected server procedure, which reads and
-- writes only SMS preference fields after matching profiles.customer_ref to
-- hc_patients.data.patientPortalReference inside the same company.
DROP POLICY IF EXISTS hc_patients_tenant ON public.hc_patients;

CREATE POLICY hc_patients_internal_tenant ON public.hc_patients
FOR ALL TO authenticated
USING (
  company_id = public.current_company_id()
  AND COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), '') NOT IN ('External Client', 'Patient')
)
WITH CHECK (
  company_id = public.current_company_id()
  AND COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), '') NOT IN ('External Client', 'Patient')
);
