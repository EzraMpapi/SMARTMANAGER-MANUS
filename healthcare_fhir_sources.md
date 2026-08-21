# Healthcare FHIR Export Sources

The Healthcare Module exports a **FHIR R4 (`4.0.1`) Bundle** as a portable, tenant-scoped clinical collection. The implementation uses a `collection` Bundle rather than a document Bundle because it exports independently addressable records and does not create a clinical attestation document. Each entry must use a unique `fullUrl`.

| Smart Manager clinical data | FHIR R4 resource | Mapping rationale |
| --- | --- | --- |
| Patient registry | `Patient` | Demographic and administrative information about a person receiving care. |
| Clinician directory | `Practitioner` | The clinician who delivers or records care. |
| Clinical visit | `Encounter` and `Condition` | The actual care interaction belongs in `Encounter`; the recorded diagnosis is represented as `Condition`, not an observation. |
| Vitals | `Observation` | Point-in-time measurements including blood pressure, temperature, pulse, oxygen saturation, and weight. |
| Prescription medication lines | `MedicationRequest` | FHIR R4 requires one medication request per medication order. |
| Laboratory and radiology results | `DiagnosticReport` | Diagnostic report carries the completed diagnostic context, narrative results, and interpretation. |

## Official references

1. [HL7 FHIR R4 Bundle](https://hl7.org/fhir/R4/bundle.html) — a Bundle is a collection of resources; `collection` is appropriate for transport and persistence of independently addressable records.
2. [HL7 FHIR R4 Patient](https://hl7.org/fhir/R4/patient.html) — demographic and administrative details for individuals receiving care.
3. [HL7 FHIR R4 Encounter](https://hl7.org/fhir/R4/encounter.html) — documents actual care interaction; Appointment is for planned care, while Encounter reflects the care event.
4. [HL7 FHIR R4 Observation](https://hl7.org/fhir/R4/observation.html) — supports vital signs and other point-in-time clinical measurements; not used for diagnoses.
5. [HL7 FHIR R4 MedicationRequest](https://hl7.org/fhir/R4/medicationrequest.html) — records medication orders and administration instructions; one resource per medication.
6. [HL7 FHIR R4 DiagnosticReport](https://hl7.org/fhir/R4/diagnosticreport.html) — carries diagnostic context and findings for laboratory and imaging investigations.
