# RedFace Connect — Go live checklist

Backend uses the **RedFace Pay Supabase hub** (`bpzzgilwlkghgfkvkkxx`). All Connect tables are prefixed `connect_`.

## 1. Vercel environment (Production)

Set in Vercel → Settings → Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://bpzzgilwlkghgfkvkkxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase Dashboard → Project Settings → API>
SUPABASE_SERVICE_ROLE_KEY=<service role key — server only, never commit>
CONNECT_ADMIN_EMAILS=info@redfacepay.co.za
NEXT_PUBLIC_APP_URL=https://leads-ten-steel.vercel.app
```

Redeploy after saving env vars.

## 2. Supabase Auth redirects

Supabase Dashboard → Authentication → URL configuration:

- Site URL: `https://leads-ten-steel.vercel.app`
- Redirect URLs:
  - `https://leads-ten-steel.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

## 3. Admin user

Supabase Dashboard → Authentication → Users → Add user:

- Email: `info@redfacepay.co.za`
- Password: (secure password)

The `connect_handle_new_user` trigger auto-creates an admin `connect_profiles` row.

Or run manually:

```sql
insert into public.connect_profiles (id, email, role)
select id, email, 'admin' from auth.users where email = 'info@redfacepay.co.za'
on conflict (id) do update set role = 'admin';
```

## 4. Smoke test (2 minutes)

1. Open `/` — homepage loads
2. Open `/apply` — submit a test enquiry
3. Sign in at `/login` with `info@redfacepay.co.za`
4. Open `/admin` → redirects to `/dashboard` — see the new lead
5. Add a partner in `/dashboard/partners` → Approve
6. Open lead detail → Assign partner
7. Partner user (future): link `connect_profiles.partner_id` to partner org

## 5. Campaigns (v0.2)

1. Open `/dashboard/campaigns` → **New campaign**
2. Set platform + UTM tags (source, medium, campaign)
3. Copy the generated `/apply?...` tracking URL into Facebook/Google ads
4. Update **Spend** on each campaign row as ads run
5. Review leads, qualified count, conversion rate, and cost per lead

## 6. Auto-matching (v0.2)

1. Approve a partner in `/dashboard/partners`
2. Open `/dashboard/matching` → **Add rule**
3. Set partner, category, province, min score (default 70), price
4. Submit a test lead at `/apply`
5. If a rule matches, lead status becomes **delivered** automatically

Debt assistance rules only match **verified** partners.

## 7. Premium features (v0.3)

1. **Analytics** — `/dashboard/analytics` funnel, category, province, 7-day chart
2. **Wallet billing** — `/dashboard/revenue` deposit to partner wallets; auto-charge on delivery
3. **Lead export** — `/dashboard/leads` search, filter, CSV export
4. **Notifications** — bell icon in admin dashboard header
5. **Partner onboarding** — `/partner/apply` self-service application
6. **Partner portal** — `/partner/billing`, `/partner/webhooks`
7. **Webhooks** — HMAC-signed `lead.delivered` events to partner endpoints

Migration `0004_connect_premium` applied to production.

## 8. Health check

`GET /api/health` should return `{ ok: true, supabaseConfigured: true }`

## Database status

Connect schema applied to production (migrations `0001`–`0004`).

Categories seeded: Personal Finance, Debt Assistance, Credit Help, Business Funding.
