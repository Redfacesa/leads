-- Red Leads — Lead Partner Network (marketers / agencies that submit leads)

create table if not exists public.connect_lead_partners (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text,
  email text not null,
  phone text,
  website text,
  channels text[] not null default array[]::text[],
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'rejected', 'archived')),
  verification_status text not null default 'pending_review'
    check (verification_status in ('unverified', 'pending_review', 'verified', 'rejected')),
  commission_rate numeric(5,4) not null default 0.2000,
  earnings_balance numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists connect_lead_partners_status_idx
  on public.connect_lead_partners (status, created_at desc);

alter table public.connect_profiles
  add column if not exists lead_partner_id uuid references public.connect_lead_partners(id) on delete set null;

create index if not exists connect_profiles_lead_partner_idx
  on public.connect_profiles (lead_partner_id);

create table if not exists public.connect_lead_partner_campaigns (
  id uuid primary key default gen_random_uuid(),
  lead_partner_id uuid not null references public.connect_lead_partners(id) on delete cascade,
  campaign_id uuid references public.connect_campaigns(id) on delete set null,
  name text not null,
  category_id uuid references public.connect_lead_categories(id) on delete set null,
  active boolean not null default true,
  daily_cap int,
  created_at timestamptz not null default now()
);

create table if not exists public.connect_lead_partner_submissions (
  id uuid primary key default gen_random_uuid(),
  lead_partner_id uuid not null references public.connect_lead_partners(id) on delete cascade,
  partner_campaign_id uuid references public.connect_lead_partner_campaigns(id) on delete set null,
  category_id uuid not null references public.connect_lead_categories(id),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  province text not null,
  city text,
  employment_status text,
  income_band text,
  debt_band text,
  enquiry_reason text,
  consent_confirmed boolean not null default false,
  consent_note text,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'accepted', 'rejected', 'duplicate')),
  lead_id uuid references public.connect_leads(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists connect_lps_partner_idx
  on public.connect_lead_partner_submissions (lead_partner_id, created_at desc);
create index if not exists connect_lps_status_idx
  on public.connect_lead_partner_submissions (status, created_at desc);

alter table public.connect_leads
  add column if not exists lead_partner_id uuid references public.connect_lead_partners(id) on delete set null;

alter table public.connect_leads
  add column if not exists submission_id uuid references public.connect_lead_partner_submissions(id) on delete set null;

create table if not exists public.connect_lead_partner_commissions (
  id uuid primary key default gen_random_uuid(),
  lead_partner_id uuid not null references public.connect_lead_partners(id) on delete cascade,
  lead_id uuid not null references public.connect_leads(id) on delete cascade,
  sale_amount numeric(12,2) not null,
  commission_rate numeric(5,4) not null,
  commission_amount numeric(12,2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'cancelled')),
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists connect_lpc_partner_idx
  on public.connect_lead_partner_commissions (lead_partner_id, created_at desc);

-- Helpers
create or replace function public.connect_user_lead_partner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select lead_partner_id from public.connect_profiles where id = auth.uid();
$$;

create or replace function public.connect_is_lead_partner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.connect_profiles p
    where p.id = auth.uid() and p.role = 'lead_partner' and p.lead_partner_id is not null
  );
$$;

-- RLS
alter table public.connect_lead_partners enable row level security;
alter table public.connect_lead_partner_campaigns enable row level security;
alter table public.connect_lead_partner_submissions enable row level security;
alter table public.connect_lead_partner_commissions enable row level security;

create policy connect_lead_partners_admin on public.connect_lead_partners
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_lead_partners_self on public.connect_lead_partners
  for select using (id = public.connect_user_lead_partner_id());

create policy connect_lpcampaigns_admin on public.connect_lead_partner_campaigns
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_lpcampaigns_partner on public.connect_lead_partner_campaigns
  for select using (lead_partner_id = public.connect_user_lead_partner_id());

create policy connect_lpsubmissions_admin on public.connect_lead_partner_submissions
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_lpsubmissions_partner_read on public.connect_lead_partner_submissions
  for select using (lead_partner_id = public.connect_user_lead_partner_id());

create policy connect_lpsubmissions_partner_insert on public.connect_lead_partner_submissions
  for insert with check (lead_partner_id = public.connect_user_lead_partner_id());

create policy connect_lpcommissions_admin on public.connect_lead_partner_commissions
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_lpcommissions_partner on public.connect_lead_partner_commissions
  for select using (lead_partner_id = public.connect_user_lead_partner_id());

-- Credit commission when a partner-sourced lead is sold
create or replace function public.connect_credit_lead_partner_commission(
  p_lead_id uuid,
  p_sale_amount numeric,
  p_reference_type text default null,
  p_reference_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.connect_leads%rowtype;
  v_lp public.connect_lead_partners%rowtype;
  v_commission numeric;
begin
  select * into v_lead from public.connect_leads where id = p_lead_id;
  if not found or v_lead.lead_partner_id is null then
    return jsonb_build_object('ok', false, 'error', 'no_lead_partner');
  end if;

  select * into v_lp from public.connect_lead_partners where id = v_lead.lead_partner_id for update;
  if not found or v_lp.status <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'partner_inactive');
  end if;

  if exists (
    select 1 from public.connect_lead_partner_commissions
    where lead_id = p_lead_id and reference_id = p_reference_id and status <> 'cancelled'
  ) then
    return jsonb_build_object('ok', false, 'error', 'already_credited');
  end if;

  v_commission := round(p_sale_amount * v_lp.commission_rate, 2);

  insert into public.connect_lead_partner_commissions (
    lead_partner_id, lead_id, sale_amount, commission_rate, commission_amount,
    status, reference_type, reference_id
  ) values (
    v_lp.id, p_lead_id, p_sale_amount, v_lp.commission_rate, v_commission,
    'paid', p_reference_type, p_reference_id
  );

  update public.connect_lead_partners
    set earnings_balance = earnings_balance + v_commission, updated_at = now()
    where id = v_lp.id;

  return jsonb_build_object('ok', true, 'commission', v_commission, 'balance', v_lp.earnings_balance + v_commission);
end;
$$;

grant execute on function public.connect_credit_lead_partner_commission(uuid, numeric, text, uuid) to authenticated;
