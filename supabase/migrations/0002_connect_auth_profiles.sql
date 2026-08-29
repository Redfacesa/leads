-- Bootstrap helper: promote a user to Connect admin after they sign up in Supabase Auth
-- Run once in SQL editor after creating your first auth user:
--
-- insert into public.connect_profiles (id, email, full_name, role)
-- select id, email, raw_user_meta_data->>'full_name', 'admin'
-- from auth.users where email = 'info@redfacepay.co.za'
-- on conflict (id) do update set role = 'admin';

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

drop trigger if exists connect_on_auth_user_created on auth.users;
create trigger connect_on_auth_user_created
  after insert on auth.users
  for each row execute function public.connect_handle_new_user();
