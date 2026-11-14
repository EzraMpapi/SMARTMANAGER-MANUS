# BusinessSphere ERP
## Customer Onboarding Guide: Owner Audit Log and Permissions

**Audience:** Organization owners, platform administrators, implementation teams, and security reviewers  
**Feature:** Immutable Owner Record History  
**Product:** BusinessSphere ERP / Smart Manager

---

## 1. What this feature provides

The Owner Audit Log gives authorized owners a permanent history of important workspace changes. It records who performed an action, what changed, when it happened, and which workspace record was affected.

The history remains available even when the original record is later deleted. For updates, the system preserves both the previous and new record snapshots so an owner can investigate the exact change.

The audit log is designed for:

- Operational accountability
- Investigation of incorrect or unexpected changes
- Financial and administrative review
- Compliance evidence
- Recovery planning and dispute resolution

The feature does not replace backups. It is an audit and accountability layer, not a mechanism for restoring deleted business records.

---

## 2. Before you begin

Confirm the following before onboarding:

1. The organization has an active BusinessSphere ERP workspace.
2. At least one trusted person is assigned as the organization owner or equivalent highest-privilege administrator.
3. The owner has completed sign-in and can open the authenticated dashboard.
4. The implementation team has confirmed that the immutable history migration is applied to the production database.
5. The organization has agreed which administrators may review audit records and which users may only operate business modules.
6. A secure support or escalation contact is available for suspected unauthorized changes.

Do not share owner credentials with staff. Each person should use an individual account so every action is attributable to a named actor.

---

## 3. Recommended permission model

Use the least-privilege model below as the default configuration.

| Role | View owner history | Export CSV/PDF | Modify history | Delete history |
|---|---:|---:|---:|---:|
| Organization Owner / CEO | Yes | Yes | No | No |
| Super Administrator | Yes, if explicitly assigned | Yes, if explicitly assigned | No | No |
| Platform Administrator | Only within platform scope | Only within platform scope | No | No |
| Department Administrator | No by default | No by default | No | No |
| Manager / Supervisor | No by default | No by default | No | No |
| Staff / Operator | No | No | No | No |
| Auditor / Compliance Reviewer | Grant only when required | Grant only when required | No | No |

The audit history is append-only. No role should be able to edit or delete historical entries through the application. If a correction is needed, create a new business record or corrective transaction rather than altering the audit trail.

### Recommended owner setup

- Assign one primary owner.
- Assign one backup owner or approved compliance reviewer.
- Avoid giving audit visibility to every administrator.
- Review owner access whenever a senior employee leaves the organization.
- Never use a shared generic account such as `admin@company` for audit-sensitive actions.

---

## 4. Initial setup procedure

### Step 1: Confirm the organization owner

Sign in with the account that owns the workspace. Confirm that the account identity, organization, and workspace shown in the dashboard are correct.

If the wrong workspace opens, stop the setup and contact the implementation administrator. Do not continue while the tenant or organization context is incorrect.

### Step 2: Confirm role assignment

Open the organization’s user or administration area and verify that the intended owner has the highest approved organization role.

Confirm that:

- The owner account uses a unique email address.
- Multi-factor authentication is enabled where available.
- The owner can access the Activity or Compliance area.
- Regular staff do not inherit owner permissions through a broad department role.

### Step 3: Open the audit history

From the authenticated dashboard, open the Activity, Compliance, or equivalent governance area. Locate **Owner Record History**.

The panel should show a history list or an empty state. An empty state means no captured entries are available for the current tenant or filter; it does not mean the audit system is disabled.

### Step 4: Verify the tenant boundary

Confirm that the owner sees records from the current organization only. The owner must not see data belonging to another company, workspace, or tenant.

If records from another organization appear, stop immediately and report the issue to the implementation team. Do not export or distribute the data.

### Step 5: Perform a controlled test change

Use a non-sensitive test record in an approved module:

1. Create or update the test record.
2. Note the exact time and actor account.
3. Return to Owner Record History.
4. Refresh the history panel.
5. Confirm that the event identifies the correct actor, operation, table or module, record ID, and timestamp.
6. Confirm that the previous and new snapshots are available for an update.

If approved by the organization, delete the test record and confirm that the delete event remains visible in history. Do not use production customer, patient, payroll, or financial data for the initial test.

---

## 5. Understanding a history entry

A history entry may include the following information:

- **Operation:** INSERT, UPDATE, or DELETE
- **Table or module:** The source business area
- **Record ID:** The affected record identifier
- **Actor:** The user who performed the action
- **Actor role:** The role held at the time of the action
- **Timestamp:** Server-recorded event time
- **Previous snapshot:** The record state before an update or delete
- **New snapshot:** The record state after an insert or update
- **Changed fields:** The fields that changed, when available

Interpret timestamps using the organization’s configured timezone. For formal investigations, preserve the exported report and record the timezone used in the investigation notes.

---

## 6. Filtering and investigation workflow

Use the history filters to reduce a large audit stream to the relevant activity.

### Recommended investigation sequence

1. Start with the approximate incident date and time.
2. Search by actor name or account if a user is known.
3. Filter by operation:
   - **INSERT** for newly created records
   - **UPDATE** for modified records
   - **DELETE** for removed records
4. Narrow the search by table, module, or record ID.
5. Open the entry and compare the previous and new snapshots.
6. Record the finding without modifying the original history entry.
7. Export the filtered results when evidence needs to be shared with management or compliance.

Keep investigation notes separate from the immutable audit record. Never put passwords, access tokens, or unnecessary sensitive personal information into investigation notes.

---

## 7. Exporting audit reports

The Owner Record History panel supports two export formats.

### CSV export

Use CSV when the recipient needs to filter, sort, or analyze records in spreadsheet software.

1. Apply the required search and operation filters.
2. Select **CSV**.
3. Save the generated file in the approved secure location.
4. Use the generated date-based filename when filing the report.
5. Restrict access to the report because it may contain record snapshots and personal or financial data.

The CSV export applies safe escaping to reduce spreadsheet formula-injection risk. This protects the report format, but it does not remove confidential data from the file.

### PDF export

Use PDF when the recipient needs a fixed, reviewable evidence packet.

1. Apply the required history filters.
2. Select **PDF**.
3. The system opens a print-ready report.
4. In the browser print dialog, choose **Save as PDF**.
5. Verify the page count, timestamp, organization context, and filtered record count.
6. Store the PDF in the approved audit archive.

The PDF report includes the filtered entries, event metadata, actor information, and retained before/after snapshots where available.

### Export handling rules

- Export only the minimum records required for the business purpose.
- Do not send audit exports through public chat or unsecured email.
- Encrypt or access-control archived reports.
- Record who requested and received each formal report.
- Delete temporary downloads according to the organization’s retention policy.

---

## 8. Security and access review checklist

Review these items during onboarding and at least quarterly:

- [ ] Every owner or auditor uses an individual account.
- [ ] Former employees no longer have owner or audit-review access.
- [ ] Backup owner details are current.
- [ ] Staff roles do not inherit owner history visibility unexpectedly.
- [ ] Tenant isolation was tested with an approved test account.
- [ ] Owner history cannot be edited or deleted through the UI.
- [ ] CSV and PDF exports are stored in an access-controlled location.
- [ ] Export recipients are documented for regulated or sensitive reports.
- [ ] Sign-in recovery and session timeout procedures are known to the owner.
- [ ] The organization has a documented incident escalation contact.

---

## 9. Troubleshooting

### The Owner Record History panel is not visible

Confirm that the signed-in account has the approved owner or audit-review role and that the user is in the correct organization workspace. If access is still missing, ask the platform administrator to verify role assignment and tenant membership.

### The history list is empty

Clear all filters and refresh. Then perform a controlled test update on a non-sensitive record. If the test event does not appear, contact the implementation team with the workspace identifier, approximate time, module, and actor account. Do not include passwords or session tokens.

### A record appears under the wrong organization

Stop reviewing and exporting immediately. Capture only the minimum diagnostic information needed for support, and report a possible tenant-isolation incident through the approved security channel.

### CSV export does not download

Confirm that at least one filtered record is available, allow downloads for the application, and retry with a smaller date or operation filter. If the issue continues, use the PDF workflow as a temporary review format and report the browser, time, and filter used.

### PDF print window does not open

Check whether the browser blocked a new window. Allow pop-ups for the trusted BusinessSphere ERP domain and retry. Never allow pop-ups for an unverified domain.

---

## 10. Customer acceptance checklist

The onboarding is complete when the customer confirms all of the following:

- [ ] The correct organization owner is identified.
- [ ] Owner and backup owner permissions are approved.
- [ ] Staff and department permissions follow least privilege.
- [ ] A controlled INSERT or UPDATE test was captured.
- [ ] A controlled DELETE retention test was completed where approved.
- [ ] The owner can filter history by actor and operation.
- [ ] The owner can export a filtered CSV report.
- [ ] The owner can create a print-ready PDF report.
- [ ] Tenant isolation was verified.
- [ ] Export storage and retention rules were documented.
- [ ] The customer knows how to report suspected unauthorized changes.

**Customer sign-off:** ______________________________  
**Organization:** ___________________________________  
**Primary owner:** __________________________________  
**Implementation date:** _____________________________  
**Implementation contact:** ___________________________

---

## 11. Important operating principle

The audit log is most valuable when it is treated as a trusted system of record for accountability. Give access sparingly, use individual accounts, export only what is necessary, and never attempt to rewrite history to correct a business mistake. Corrective business activity should create a new traceable event so the full story remains available to the owner.
