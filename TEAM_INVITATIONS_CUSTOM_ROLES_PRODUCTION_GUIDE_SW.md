# Mwongozo wa Production: Team Invitations na Custom Roles

## 1. Lengo

Mwongozo huu unaeleza namna ya kupeleka mfumo wa **multi-user workspace access** kwenye production bila kutegemea browser role switching. Mfumo hutumia:

- Invitations zinazothibitishwa na server na tenant scope.
- **Custom role profiles** zenye modules na access level maalumu.
- Role-change requests zinazohitaji independent approval.
- Arifa za ndani ya app kwa ombi lililoidhinishwa au kukataliwa.
- RLS na server-confirmed identity hydration kuzuia cross-tenant access.

> **Muhimu:** UI haipaswi kutumika kama chanzo cha mwisho cha ruhusa. Server procedures, Supabase RLS na verified workspace identity ndizo mamlaka.

## 2. Mahitaji kabla ya deployment

1. Supabase project ya production iwe imechaguliwa na migrations zote ziwe kwenye repository.
2. `SUPABASE_URL` na `SUPABASE_ANON_KEY` ziwe secrets za server/Vercel; usiziweke kwenye Git.
3. Email provider (Resend au provider iliyothibitishwa) iwe na domain iliyoverify na `RESEND_API_KEY` iwe secret ya server.
4. Callback/redirect URLs za production ziwe zimeongezwa kwenye Supabase Auth.
5. Backup ya database ifanywe kabla ya migrations.
6. Angalau akaunti mbili za majaribio ziwe kwenye workspace moja: owner/admin na member wa kawaida.

## 3. Database migrations

Tekeleza migrations kwa mpangilio wa repository, kisha hakiki kwa SQL kwamba vitu vifuatavyo vipo:

- `workforce_roles`
- `workforce_permissions`
- `workforce_role_permissions`
- `workforce_member_roles`
- `workforce_module_access`
- `workforce_data_scopes`
- `workforce_approval_limits`
- approval request/notification tables zinazotumiwa na role-change flow

Migrations za workforce lazima ziwe na:

- `company_id` kwenye kila record ya authorization.
- Unique constraints za tenant + code/id.
- RLS ya tenant select/write.
- `workforce_request_role_assignment(...)` na `workforce_decide_role_assignment(...)` zilizo na signatures moja tu.
- `GRANT EXECUTE` kwa `authenticated`, na `REVOKE` kwa `anon`/`PUBLIC` inapohitajika.

Baada ya migration, kagua overloads:

```sql
select n.nspname as schema_name, p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('workforce_request_role_assignment', 'workforce_decide_role_assignment', 'platform_admin_control_action')
order by p.proname, args;
```

Kila procedure ya public authorization inayotarajiwa kutumiwa na API inapaswa kuwa na **signature moja inayotumika**. Usitumie `DROP FUNCTION` bila identity arguments kamili.

## 4. Server configuration

Weka environment variables kwenye Vercel Production, si `.env` iliyocommitwa:

```text
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=notifications@verified-domain.tld
VITE_TEAM_WORKFORCE_CENTER=true
```

`VITE_TEAM_WORKFORCE_CENTER=false` ni emergency rollback ya UI pekee. Haitakiwi kutumika kama njia ya kuzima server authorization au RLS.

Baada ya kubadilisha environment variables, fanya redeploy mpya. Usitumie preview build kama uthibitisho wa production.

## 5. Seed ya roles na permissions

Anzisha role profiles za biashara kwa kila company kupitia migration/controlled admin job. Mfano wa role profile:

| Role profile | Modules za msingi | Access |
|---|---|---|
| Finance Officer | finance, reports, documents | Operational |
| Sales Agent | crm, sales, notifications | Limited operational |
| HR Manager | hr, documents, notifications | Operational |
| Read-only Auditor | dashboard, reports, documents | Read only |

- Tumia codes ndogo (`finance-officer`, `sales-agent`) zilizo lowercase.
- Usimpe kila mtu `Super Administrator`.
- Tenganisha `Allow` na `Deny`; `Deny` lazima ishinde `Allow` pale evaluator anapokutana na conflict.
- Role assignment iwe na effective dates na audit metadata.

## 6. Team invitations

1. Admin afungue **Settings → Team & Workforce → Pending Invitations**.
2. Invitation itume email yenye token ya one-time na expiry.
3. Accept flow ithibitishe token, email/user identity na `company_id` upande wa server.
4. User mpya apewe role profile iliyochaguliwa, si string ya browser pekee.
5. Invitation ikikataa, expired au delivery ikashindikana, ionekane kama state halisi; UI isidai kwamba member ameongezwa.
6. Rudia invitation kwa kutumia idempotency/expiry rules za server, si insert ya duplicate.

## 7. Custom Roles na approval flow

- **Settings → Team & Workforce → Custom Roles** huonyesha role catalog iliyopo kwenye `ROLES` na module mappings.
- Invitation inaweza kupewa role profile.
- Role change ya member iende kupitia `requestRoleChangeApproval` au workforce assignment procedure.
- Requester hawezi kuji-approve.
- Reviewer awe na role ya server inayoruhusiwa.
- Approve/reject itengeneze audit event na notification record.
- UI ifanye refetch baada ya decision; usibadilishe `currentUser.role` kwa local state kabla server haijathibitisha.

## 8. Arifa za ndani ya app

Notification center itumie record yenye aina ya `role_change_approval`, target user na status ya decision. Hakikisha:

- Arifa inaonekana kwa requester/reviewer anayestahili tu.
- `Mark Read` na `Dismiss` haviwezi kubadili approval state.
- Approval ikikubaliwa/kukataliwa, UI ifanye refresh ya approvals na notification list.
- Email failure isizuie database decision; ionekane kama delivery failure inayoweza kuretry.
- Usitumie localStorage kama chanzo cha permission au approval status.

## 9. Smoke test ya production

Fanya kwa workspace ya majaribio:

- [ ] Owner anatengeneza invitation yenye Custom Role.
- [ ] Member asiye admin haoni Team & Workforce administration.
- [ ] Member mmoja hawezi ku-approve ombi lake mwenyewe.
- [ ] Reviewer anaona request na anaweza approve/reject.
- [ ] Requester anaona notification ya decision.
- [ ] Refresh/browser mpya bado inaonyesha role na access kutoka server.
- [ ] User wa Company A hawezi kusoma members/roles za Company B.
- [ ] Expired invitation haiwezi kukubaliwa mara ya pili.
- [ ] Feature ikiwekewa `VITE_TEAM_WORKFORCE_CENTER=false`, Settings/HR invitation flow ya zamani inabaki salama.

## 10. Monitoring na rollback

Fuatilia:

- failed invitation deliveries;
- `401`, `403` na RLS errors kwenye tRPC logs;
- duplicate/overload RPC errors;
- pending approvals zinazozidi SLA;
- notification delivery failures.

Rollback ya haraka ya UI: weka `VITE_TEAM_WORKFORCE_CENTER=false` na redeploy. Usifute role/permission tables wakati production ina data. Ikiwa migration inahitaji kurekebishwa, tengeneza forward migration yenye audit trail.

## 11. Definition of Done

Deployment inachukuliwa imekamilika pale ambapo migrations zimeapply, RLS/tenant isolation imepita smoke tests, invitations zimetuma na kukubaliwa, custom role assignment imepitia approval, notification imeonekana kwa mtumiaji sahihi, na production build haina conflict markers au TypeScript/JSX errors.
