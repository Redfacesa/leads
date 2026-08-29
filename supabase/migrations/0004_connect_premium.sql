-- RedFace Connect premium — notifications, webhooks, analytics RPC, wallet charge

create table if not exists public.connect_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references auth.users(id) on delete cascade,
  partner_id uuid references public.connect_partners(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists connect_notifications_user_idx
  on public.connect_notifications (recipient_user_id, created_at desc);
create index if not exists connect_notifications_partner_idx
  on public.connect_notifications (partner_id, created_at desc);

create table if not exists public.connect_webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.connect_partners(id) on delete cascade,
  url text not null,
  secret text not null,
  events text[] not null default array['lead.delivered'],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connect_webhook_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.connect_webhook_subscriptions(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'delivered', 'failed')),
  attempts int not null default 0,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.connect_notifications enable row level security;
alter table public.connect_webhook_subscriptions enable row level security;
alter table public.connect_webhook_events enable row level security;

create policy connect_notifications_user on public.connect_notifications
  for select using (recipient_user_id = auth.uid() or public.connect_is_admin());

create policy connect_notifications_admin on public.connect_notifications
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_webhooks_admin on public.connect_webhook_subscriptions
  for all using (public.connect_is_admin()) with check (public.connect_is_admin());

create policy connect_webhooks_partner on public.connect_webhook_subscriptions
  for select using (partner_id = public.connect_user_partner_id());

create policy connect_webhooks_partner_manage on public.connect_webhook_subscriptions
  for insert with check (partner_id = public.connect_user_partner_id());

create policy connect_webhooks_partner_update on public.connect_webhook_subscriptions
  for update using (partner_id = public.connect_user_partner_id())
  with check (partner_id = public.connect_user_partner_id());

create policy connect_webhook_events_admin on public.connect_webhook_events
  for select using (public.connect_is_admin());

-- Wallet charge on lead delivery (service role / security definer)
create or replace function public.connect_charge_lead_delivery(
  p_partner_id uuid,
  p_lead_id uuid,
  p_assignment_id uuid,
  p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.connect_billing_accounts%rowtype;
  v_new_balance numeric;
begin
  select * into v_account from public.connect_billing_accounts where partner_id = p_partner_id for update;
  if not found then
    insert into public.connect_billing_accounts (partner_id, balance) values (p_partner_id, 0)
    returning * into v_account;
  end if;

  if v_account.status <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'billing_suspended');
  end if;

  if v_account.balance + v_account.credit_limit < p_amount then
    return jsonb_build_object('ok', false, 'error', 'insufficient_balance', 'balance', v_account.balance);
  end if;

  v_new_balance := v_account.balance - p_amount;

  update public.connect_billing_accounts
    set balance = v_new_balance, updated_at = now()
    where id = v_account.id;

  insert into public.connect_billing_transactions (
    billing_account_id, type, amount, currency, reference, lead_id, assignment_id, status
  ) values (
    v_account.id, 'lead_charge', p_amount, 'ZAR',
    'lead-delivery', p_lead_id, p_assignment_id, 'completed'
  );

  return jsonb_build_object('ok', true, 'balance', v_new_balance, 'charged', p_amount);
end;
$$;

create or replace function public.connect_deposit_wallet(
  p_partner_id uuid,
  p_amount numeric,
  p_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.connect_billing_accounts%rowtype;
begin
  if not public.connect_is_admin() then
    raise exception 'Unauthorized';
  end if;

  select * into v_account from public.connect_billing_accounts where partner_id = p_partner_id for update;
  if not found then
    insert into public.connect_billing_accounts (partner_id, balance) values (p_partner_id, 0)
    returning * into v_account;
  end if;

  update public.connect_billing_accounts
    set balance = balance + p_amount, updated_at = now()
    where id = v_account.id;

  insert into public.connect_billing_transactions (
    billing_account_id, type, amount, currency, reference, status
  ) values (
    v_account.id, 'deposit', p_amount, 'ZAR', coalesce(p_reference, 'admin-deposit'), 'completed'
  );

  return jsonb_build_object('ok', true, 'balance', v_account.balance + p_amount);
end;
$$;

create or replace function public.connect_analytics_funnel()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.connect_is_admin() then
    raise exception 'Unauthorized';
  end if;

  return jsonb_build_object(
    'funnel', jsonb_build_object(
      'total', (select count(*) from public.connect_leads),
      'new', (select count(*) from public.connect_leads where status = 'new'),
      'verified', (select count(*) from public.connect_leads where status = 'verified'),
      'qualified', (select count(*) from public.connect_leads where status = 'qualified'),
      'delivered', (select count(*) from public.connect_leads where status in ('delivered', 'matched')),
      'contacted', (select count(*) from public.connect_leads where status in ('contacted', 'in_progress')),
      'converted', (select count(*) from public.connect_leads where status = 'converted'),
      'rejected', (select count(*) from public.connect_leads where status in ('rejected', 'duplicate', 'invalid'))
    ),
    'by_category', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', c.name,
        'count', cnt
      ) order by cnt desc), '[]'::jsonb)
      from (
        select category_id, count(*) cnt from public.connect_leads group by category_id
      ) x
      join public.connect_lead_categories c on c.id = x.category_id
    ),
    'by_province', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'province', province,
        'count', cnt
      ) order by cnt desc), '[]'::jsonb)
      from (
        select province, count(*) cnt from public.connect_leads group by province
      ) p
    ),
    'last_7_days', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', day,
        'count', cnt
      ) order by day), '[]'::jsonb)
      from (
        select date_trunc('day', created_at)::date as day, count(*) cnt
        from public.connect_leads
        where created_at >= now() - interval '7 days'
        group by 1
      ) d
    ),
    'revenue', jsonb_build_object(
      'total_charged', (select coalesce(sum(amount), 0) from public.connect_billing_transactions where type = 'lead_charge'),
      'total_deposits', (select coalesce(sum(amount), 0) from public.connect_billing_transactions where type = 'deposit')
    )
  );
end;
$$;

grant execute on function public.connect_analytics_funnel() to authenticated;
grant execute on function public.connect_deposit_wallet(uuid, numeric, text) to authenticated;
