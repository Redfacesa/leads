-- Bootstrap helper: promote a user to Connect admin after they sign up in Supabase Auth
-- Run once in SQL editor after creating your first auth user:
--
-- insert into public.connect_profiles (id, email, full_name, role)
-- select id, email, raw_user_meta_data->>'full_name', 'admin'
-- from auth.users where email = 'admin@redfacepay.co.za'
-- on conflict (id) do update set role = 'admin';

create or replace function public.connect_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_emails text[];
  assigned_role text := 'partner_agent';
begin
  admin_emails := string_to_array(coalesce(current_setting('app.connect_admin_emails', true), ''), ',');

  if new.email is not null and new.email = any (
    select lower(trim(v)) from unnest(admin_emails) as t(v) where trim(v) <> ''
  ) then
    assigned_role := 'admin';
  end if;

  insert into public.connect_profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    assigned_role
  )
  on conflict (id) do update set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists connect_on_auth_user_created on auth.users;
create trigger connect_on_auth_user_created
  after insert on auth.users
  for each row execute function public.connect_handle_new_user();
