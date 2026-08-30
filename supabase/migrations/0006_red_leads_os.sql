-- Red Leads OS — expanded categories, marketplace skeleton, client roles, RL-LD references

-- Lead reference prefix: RL-LD-00001
create or replace function public.connect_next_lead_reference()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('connect_lead_ref_seq');
  return 'RL-LD-' || lpad(n::text, 5, '0');
end;
$$;

-- Category vertical grouping
alter table public.connect_lead_categories
  add column if not exists vertical text not null default 'financial'
    check (vertical in ('financial', 'business', 'home', 'automotive', 'insurance', 'other'));

alter table public.connect_lead_categories
  add column if not exists icon text;

-- Expand lead statuses for marketplace pipeline
alter table public.connect_leads drop constraint if exists connect_leads_status_check;
alter table public.connect_leads add constraint connect_leads_status_check
  check (status in (
    'new', 'verifying', 'verified', 'qualified',
    'available', 'reserved', 'sold', 'matched', 'delivered',
    'contacted', 'in_progress', 'converted',
    'rejected', 'duplicate', 'invalid', 'uncontactable',
    'not_interested', 'not_eligible', 'expired', 'archived'
  ));

-- Client role aliases (alongside legacy partner_* roles)
alter table public.connect_profiles drop constraint if exists connect_profiles_role_check;
alter table public.connect_profiles add constraint connect_profiles_role_check
  check (role in (
    'admin', 'connect_staff',
    'partner_owner', 'partner_admin', 'partner_agent', 'partner_viewer',
    'client_owner', 'client_admin', 'client_agent', 'client_viewer',
    'lead_partner'
  ));

-- Seed expanded categories
insert into public.connect_lead_categories (name, slug, description, requires_regulated_partner, sort_order, vertical, icon)
values
  ('Debt Review', 'debt_review', 'Formal debt review and rehabilitation enquiries', true, 10, 'financial', 'credit-card'),
  ('Debt Consolidation', 'debt_consolidation', 'Consolidation and repayment plan enquiries', true, 11, 'financial', 'layers'),
  ('Credit Repair', 'credit_repair', 'Credit profile improvement enquiries', false, 12, 'financial', 'trending-up'),
  ('Bad Credit Assistance', 'bad_credit', 'Options for consumers with impaired credit', false, 13, 'financial', 'alert-circle'),
  ('Insurance Quotes', 'insurance', 'Personal and business insurance enquiries', false, 14, 'insurance', 'shield'),
  ('Website Design', 'website_design', 'Businesses needing a website or redesign', false, 20, 'business', 'globe'),
  ('Digital Marketing', 'digital_marketing', 'SEO, ads, and social media services', false, 21, 'business', 'megaphone'),
  ('POS Systems', 'pos_systems', 'Point of sale and retail systems', false, 22, 'business', 'monitor'),
  ('Payment Solutions', 'payment_solutions', 'Merchant payments and card acceptance', false, 23, 'business', 'wallet'),
  ('Business Loans', 'business_loans', 'SME funding and business finance', false, 24, 'business', 'briefcase'),
  ('Accounting Services', 'accounting', 'Bookkeeping, tax, and accounting', false, 25, 'business', 'calculator'),
  ('Business Insurance', 'business_insurance', 'Commercial insurance quotes', false, 26, 'business', 'building'),
  ('Solar Quotes', 'solar', 'Residential and commercial solar enquiries', false, 30, 'home', 'sun'),
  ('Home Security', 'home_security', 'Alarm and security system quotes', false, 31, 'home', 'lock'),
  ('Fibre / Internet', 'fibre_internet', 'Home and business connectivity', false, 32, 'home', 'wifi'),
  ('Home Loans', 'home_loans', 'Bond and home finance enquiries', false, 33, 'home', 'home'),
  ('Car Finance', 'car_finance', 'Vehicle finance enquiries', false, 40, 'automotive', 'car')
on conflict (slug) do update set
  vertical = excluded.vertical,
  icon = excluded.icon,
  description = excluded.description;

update public.connect_lead_categories set vertical = 'financial', icon = 'wallet' where slug = 'personal_finance';
update public.connect_lead_categories set vertical = 'financial', icon = 'help-circle' where slug = 'debt_assistance';
update public.connect_lead_categories set vertical = 'financial', icon = 'bar-chart' where slug = 'credit_help';
update public.connect_lead_categories set vertical = 'business', icon = 'trending-up' where slug = 'business_funding';

-- Phase 2: marketplace inventory
create table if not exists public.connect_marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.connect_leads(id) on delete cascade,
  category_id uuid not null references public.connect_lead_categories(id),
  price numeric(12,2) not null default 100,
  exclusive boolean not null default false,
  preview_province text,
  preview_income_band text,
  preview_debt_band text,
  preview_score int,
  verified boolean not null default false,
  status text not null default 'available'
    check (status in ('available', 'reserved', 'sold', 'withdrawn', 'expired')),
  listed_at timestamptz not null default now(),
  reserved_at timestamptz,
  sold_at timestamptz,
  buyer_partner_id uuid references public.connect_partners(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists connect_marketplace_status_idx
  on public.connect_marketplace_listings (status, listed_at desc);

create table if not exists public.connect_lead_orders (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.connect_partners(id) on delete restrict,
  lead_id uuid not null references public.connect_leads(id) on delete restrict,
  listing_id uuid references public.connect_marketplace_listings(id) on delete set null,
  price numeric(12,2) not null,
  exclusive boolean not null default false,
  payment_status text not null default 'completed'
    check (payment_status in ('pending', 'completed', 'failed', 'refunded')),
  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists connect_lead_orders_partner_idx
  on public.connect_lead_orders (partner_id, purchased_at desc);

alter table public.connect_marketplace_listings enable row level security;
alter table public.connect_lead_orders enable row level security;

create policy connect_marketplace_admin on public.connect_marketplace_listings
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_marketplace_client_read on public.connect_marketplace_listings
  for select using (
    status = 'available'
    or buyer_partner_id = public.connect_user_partner_id()
    or public.connect_is_admin()
  );

create policy connect_orders_admin on public.connect_lead_orders
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_orders_client on public.connect_lead_orders
  for select using (partner_id = public.connect_user_partner_id());

-- List qualified lead into marketplace (admin / service)
create or replace function public.connect_list_lead_on_marketplace(
  p_lead_id uuid,
  p_price numeric default 100,
  p_exclusive boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.connect_leads%rowtype;
  v_listing_id uuid;
begin
  if not public.connect_is_admin() then
    raise exception 'Unauthorized';
  end if;

  select * into v_lead from public.connect_leads where id = p_lead_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'lead_not_found');
  end if;

  insert into public.connect_marketplace_listings (
    lead_id, category_id, price, exclusive,
    preview_province, preview_income_band, preview_debt_band, preview_score,
    verified, status
  ) values (
    v_lead.id, v_lead.category_id, p_price, p_exclusive,
    v_lead.province, v_lead.income_band, v_lead.debt_band, v_lead.lead_score,
    v_lead.status in ('verified', 'qualified'), 'available'
  )
  on conflict (lead_id) do update set
    price = excluded.price,
    exclusive = excluded.exclusive,
    status = 'available',
    updated_at = now()
  returning id into v_listing_id;

  update public.connect_leads set status = 'available' where id = p_lead_id;

  return jsonb_build_object('ok', true, 'listing_id', v_listing_id);
end;
$$;

grant execute on function public.connect_list_lead_on_marketplace(uuid, numeric, boolean) to authenticated;
