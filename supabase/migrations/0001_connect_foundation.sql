-- RedFace Connect v0.1 — foundation schema
-- Enquiry capture, consent, partners, manual assignment, billing skeleton

create extension if not exists pgcrypto;

-- ── Profiles (extends auth.users) ───────────────────────────────────────────

create table if not exists public.connect_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'partner_agent'
    check (role in ('admin', 'connect_staff', 'partner_owner', 'partner_admin', 'partner_agent', 'partner_viewer')),
  partner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists connect_profiles_partner_idx on public.connect_profiles (partner_id);

-- ── Lead categories ───────────────────────────────────────────────────────────

create table if not exists public.connect_lead_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  active boolean not null default true,
  requires_regulated_partner boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.connect_lead_categories (name, slug, description, requires_regulated_partner, sort_order)
values
  ('Personal Finance Enquiry', 'personal_finance', 'General personal finance and loan enquiries', false, 1),
  ('Debt Assistance', 'debt_assistance', 'Help with debt and repayment challenges', true, 2),
  ('Credit-Related Help', 'credit_help', 'Credit profile and rehabilitation enquiries', false, 3),
  ('Business Funding', 'business_funding', 'SME and business funding enquiries', false, 4)
on conflict (slug) do nothing;

-- ── Campaigns & sources ───────────────────────────────────────────────────────

create table if not exists public.connect_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  platform text,
  campaign_external_id text,
  budget numeric(12,2),
  spend numeric(12,2) not null default 0,
  start_date date,
  end_date date,
  status text not null default 'active' check (status in ('draft', 'active', 'paused', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connect_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'organic'
    check (type in ('organic', 'facebook', 'google', 'tiktok', 'whatsapp', 'referral', 'partner', 'other')),
  campaign_id uuid references public.connect_campaigns(id) on delete set null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.connect_sources (name, type)
select 'Organic — Website', 'organic'
where not exists (
  select 1 from public.connect_sources where name = 'Organic — Website' and type = 'organic'
);

-- ── Partners ──────────────────────────────────────────────────────────────────

create table if not exists public.connect_partners (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  trading_name text,
  registration_number text,
  partner_type text not null default 'financial_services'
    check (partner_type in ('credit_provider', 'debt_counselling', 'financial_services', 'business_funding', 'insurance', 'other')),
  website text,
  email text not null,
  phone text,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'archived')),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending_review', 'verified', 'rejected', 'expired')),
  verification_date timestamptz,
  verification_expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connect_partner_categories (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.connect_partners(id) on delete cascade,
  category_id uuid not null references public.connect_lead_categories(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (partner_id, category_id)
);

create table if not exists public.connect_partner_coverage (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.connect_partners(id) on delete cascade,
  province text not null,
  city text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.connect_partner_rules (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.connect_partners(id) on delete cascade,
  category_id uuid references public.connect_lead_categories(id) on delete set null,
  name text not null,
  priority int not null default 100,
  min_income numeric(12,2),
  max_income numeric(12,2),
  lead_price numeric(12,2) not null default 100,
  daily_limit int,
  conditions jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Leads ─────────────────────────────────────────────────────────────────────

create sequence if not exists connect_lead_ref_seq start 1;

create table if not exists public.connect_leads (
  id uuid primary key default gen_random_uuid(),
  lead_reference text not null unique,
  first_name text not null,
  last_name text not null,
  email text,
  phone text not null,
  province text not null,
  city text,
  employment_status text,
  income_band text,
  debt_band text,
  under_debt_review boolean,
  preferred_contact text default 'phone' check (preferred_contact in ('phone', 'email', 'whatsapp')),
  category_id uuid not null references public.connect_lead_categories(id),
  source_id uuid references public.connect_sources(id) on delete set null,
  campaign_id uuid references public.connect_campaigns(id) on delete set null,
  enquiry_reason text,
  lead_score int not null default 0 check (lead_score >= 0 and lead_score <= 100),
  status text not null default 'new'
    check (status in (
      'new', 'verifying', 'verified', 'qualified', 'matched', 'delivered',
      'contacted', 'in_progress', 'converted',
      'rejected', 'duplicate', 'invalid', 'uncontactable', 'not_interested', 'not_eligible', 'expired'
    )),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists connect_leads_status_idx on public.connect_leads (status, created_at desc);
create index if not exists connect_leads_category_idx on public.connect_leads (category_id, created_at desc);
create index if not exists connect_leads_phone_idx on public.connect_leads (phone);

create or replace function public.connect_next_lead_reference()
returns text
language plpgsql
as $$
declare
  n bigint;
begin
  n := nextval('connect_lead_ref_seq');
  return 'RF-LD-' || lpad(n::text, 5, '0');
end;
$$;

create or replace function public.connect_leads_set_reference()
returns trigger
language plpgsql
as $$
begin
  if new.lead_reference is null or new.lead_reference = '' then
    new.lead_reference := public.connect_next_lead_reference();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists connect_leads_set_reference_trg on public.connect_leads;
create trigger connect_leads_set_reference_trg
  before insert or update on public.connect_leads
  for each row execute function public.connect_leads_set_reference();

create table if not exists public.connect_lead_answers (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.connect_leads(id) on delete cascade,
  question_key text not null,
  answer_text text,
  answer_numeric numeric,
  answer_boolean boolean,
  created_at timestamptz not null default now()
);

create index if not exists connect_lead_answers_lead_idx on public.connect_lead_answers (lead_id);

-- ── Consent ───────────────────────────────────────────────────────────────────

create table if not exists public.connect_lead_consent (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.connect_leads(id) on delete cascade,
  consent_type text not null default 'enquiry_and_contact',
  purpose text not null,
  consent_given boolean not null,
  policy_version text not null default 'v0.1',
  consent_text_hash text,
  source text not null default 'web_form',
  ip_address inet,
  user_agent text,
  withdrawn_at timestamptz,
  withdrawal_reason text,
  created_at timestamptz not null default now()
);

create index if not exists connect_lead_consent_lead_idx on public.connect_lead_consent (lead_id);

-- ── Assignments & status history ──────────────────────────────────────────────

create table if not exists public.connect_lead_assignments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.connect_leads(id) on delete cascade,
  partner_id uuid not null references public.connect_partners(id) on delete restrict,
  rule_id uuid references public.connect_partner_rules(id) on delete set null,
  status text not null default 'assigned'
    check (status in ('assigned', 'delivered', 'accepted', 'rejected', 'refunded')),
  price numeric(12,2),
  assigned_at timestamptz not null default now(),
  delivered_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create index if not exists connect_lead_assignments_lead_idx on public.connect_lead_assignments (lead_id);
create index if not exists connect_lead_assignments_partner_idx on public.connect_lead_assignments (partner_id, created_at desc);

create table if not exists public.connect_lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.connect_leads(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists connect_lead_status_history_lead_idx on public.connect_lead_status_history (lead_id, created_at desc);

-- ── Billing skeleton ──────────────────────────────────────────────────────────

create table if not exists public.connect_billing_accounts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null unique references public.connect_partners(id) on delete cascade,
  currency text not null default 'ZAR',
  balance numeric(12,2) not null default 0,
  credit_limit numeric(12,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connect_billing_transactions (
  id uuid primary key default gen_random_uuid(),
  billing_account_id uuid not null references public.connect_billing_accounts(id) on delete cascade,
  type text not null check (type in ('deposit', 'lead_charge', 'refund', 'credit', 'adjustment')),
  amount numeric(12,2) not null,
  currency text not null default 'ZAR',
  reference text,
  lead_id uuid references public.connect_leads(id) on delete set null,
  assignment_id uuid references public.connect_lead_assignments(id) on delete set null,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed', 'reversed')),
  created_at timestamptz not null default now()
);

-- ── Audit ─────────────────────────────────────────────────────────────────────

create table if not exists public.connect_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

-- ── Status history trigger ────────────────────────────────────────────────────

create or replace function public.connect_lead_status_history_trg()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.connect_lead_status_history (lead_id, old_status, new_status)
    values (new.id, old.status, new.status);
  elsif tg_op = 'INSERT' then
    insert into public.connect_lead_status_history (lead_id, old_status, new_status)
    values (new.id, null, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists connect_leads_status_history_trg on public.connect_leads;
create trigger connect_leads_status_history_trg
  after insert or update of status on public.connect_leads
  for each row execute function public.connect_lead_status_history_trg();

-- ── FK: profiles.partner_id ───────────────────────────────────────────────────

alter table public.connect_profiles
  drop constraint if exists connect_profiles_partner_id_fkey;
alter table public.connect_profiles
  add constraint connect_profiles_partner_id_fkey
  foreign key (partner_id) references public.connect_partners(id) on delete set null;

-- ── Helper: admin check ─────────────────────────────────────────────────────────

create or replace function public.connect_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.connect_profiles p
    where p.id = auth.uid() and p.role in ('admin', 'connect_staff')
  );
$$;

create or replace function public.connect_user_partner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select partner_id from public.connect_profiles where id = auth.uid();
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────────

alter table public.connect_profiles enable row level security;
alter table public.connect_lead_categories enable row level security;
alter table public.connect_campaigns enable row level security;
alter table public.connect_sources enable row level security;
alter table public.connect_partners enable row level security;
alter table public.connect_partner_categories enable row level security;
alter table public.connect_partner_coverage enable row level security;
alter table public.connect_partner_rules enable row level security;
alter table public.connect_leads enable row level security;
alter table public.connect_lead_answers enable row level security;
alter table public.connect_lead_consent enable row level security;
alter table public.connect_lead_assignments enable row level security;
alter table public.connect_lead_status_history enable row level security;
alter table public.connect_billing_accounts enable row level security;
alter table public.connect_billing_transactions enable row level security;
alter table public.connect_audit_logs enable row level security;

-- Profiles
create policy connect_profiles_self on public.connect_profiles
  for select using (id = auth.uid() or public.connect_is_admin());
create policy connect_profiles_admin_write on public.connect_profiles
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

-- Categories: public read
create policy connect_categories_read on public.connect_lead_categories
  for select using (active = true or public.connect_is_admin());

-- Leads: admin full; partners see assigned only
create policy connect_leads_admin on public.connect_leads
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_leads_partner_read on public.connect_leads
  for select using (
    exists (
      select 1 from public.connect_lead_assignments a
      where a.lead_id = connect_leads.id
        and a.partner_id = public.connect_user_partner_id()
    )
  );

-- Lead answers & consent: admin; partner via lead assignment
create policy connect_lead_answers_admin on public.connect_lead_answers
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_lead_answers_partner on public.connect_lead_answers
  for select using (
    exists (
      select 1 from public.connect_lead_assignments a
      where a.lead_id = connect_lead_answers.lead_id
        and a.partner_id = public.connect_user_partner_id()
    )
  );

create policy connect_lead_consent_admin on public.connect_lead_consent
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

-- Assignments
create policy connect_assignments_admin on public.connect_lead_assignments
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_assignments_partner on public.connect_lead_assignments
  for select using (partner_id = public.connect_user_partner_id());

create policy connect_assignments_partner_update on public.connect_lead_assignments
  for update using (partner_id = public.connect_user_partner_id())
  with check (partner_id = public.connect_user_partner_id());

-- Partners
create policy connect_partners_admin on public.connect_partners
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_partners_self on public.connect_partners
  for select using (id = public.connect_user_partner_id());

-- Status history
create policy connect_status_history_admin on public.connect_lead_status_history
  for select using (public.connect_is_admin());

create policy connect_status_history_partner on public.connect_lead_status_history
  for select using (
    exists (
      select 1 from public.connect_lead_assignments a
      where a.lead_id = connect_lead_status_history.lead_id
        and a.partner_id = public.connect_user_partner_id()
    )
  );

-- Billing
create policy connect_billing_admin on public.connect_billing_accounts
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_billing_partner on public.connect_billing_accounts
  for select using (partner_id = public.connect_user_partner_id());

create policy connect_billing_tx_admin on public.connect_billing_transactions
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_billing_tx_partner on public.connect_billing_transactions
  for select using (
    billing_account_id in (
      select id from public.connect_billing_accounts where partner_id = public.connect_user_partner_id()
    )
  );

-- Campaigns, sources, rules: admin only (v0.1)
create policy connect_campaigns_admin on public.connect_campaigns
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_sources_admin on public.connect_sources
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_partner_categories_admin on public.connect_partner_categories
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_partner_coverage_admin on public.connect_partner_coverage
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_partner_rules_admin on public.connect_partner_rules
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_audit_admin on public.connect_audit_logs
  for select using (public.connect_is_admin());

-- ── Dashboard stats RPC ─────────────────────────────────────────────────────────

create or replace function public.connect_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.connect_is_admin() then
    raise exception 'Unauthorized';
  end if;

  select jsonb_build_object(
    'total_leads', (select count(*) from public.connect_leads),
    'new_today', (select count(*) from public.connect_leads where created_at >= date_trunc('day', now())),
    'qualified', (select count(*) from public.connect_leads where status in ('qualified', 'matched', 'delivered', 'contacted', 'in_progress', 'converted')),
    'partners', (select count(*) from public.connect_partners where status = 'active'),
    'converted', (select count(*) from public.connect_leads where status = 'converted')
  ) into result;

  return result;
end;
$$;

grant execute on function public.connect_dashboard_stats() to authenticated;
