-- Allow explicitly shared presets to be discovered by profiles in the same company.
drop policy if exists user_theme_presets_select_own on public.user_theme_presets;
create policy user_theme_presets_select_own_or_shared
  on public.user_theme_presets for select
  using (
    profile_id = auth.uid()
    or (
      is_shared = true
      and company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
    )
  );
