-- Partner lead status updates + admin bootstrap on signup

create or replace function public.connect_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text := 'partner_agent';
begin
  if lower(coalesce(new.email, '')) in ('info@redfacepay.co.za') then
    assigned_role := 'admin';
  end if;

  insert into public.connect_profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    assigned_role
  )
  on conflict (id) do update
    set email = excluded.email,
        role = case
          when lower(excluded.email) in ('info@redfacepay.co.za') then 'admin'
          else public.connect_profiles.role
        end;

  return new;
end;
$$;

-- Partners may update status on leads assigned to them
create policy connect_leads_partner_update on public.connect_leads
  for update using (
    exists (
      select 1 from public.connect_lead_assignments a
      where a.lead_id = connect_leads.id
        and a.partner_id = public.connect_user_partner_id()
    )
  )
  with check (
    exists (
      select 1 from public.connect_lead_assignments a
      where a.lead_id = connect_leads.id
        and a.partner_id = public.connect_user_partner_id()
    )
  );

-- Public can read active lead categories (for future client-side forms)
create policy connect_categories_public on public.connect_lead_categories
  for select to anon, authenticated
  using (active = true or public.connect_is_admin());
