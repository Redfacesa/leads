# RedFace Connect

**Financial lead capture, qualification, consent, and partner distribution for South Africa.**

RedFace Connect is a standalone application in the RedFace ecosystem. It operates enquiry infrastructure only: it does **not** approve credit, debt review, or lending decisions.

## v0.1 scope

- Public multi-step enquiry form (`/apply`)
- Lead quality scoring (not a credit score)
- POPIA-ready consent recording
- Duplicate detection (7-day phone window)
- Admin dashboard: leads, partners, manual assignment, revenue view
- Partner billing skeleton (assignment price tracking)

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL, Auth, RLS, Edge-ready)
- **Vercel** deployment target

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/Redfacesa/leads.git
cd leads
npm install
cp .env.example .env.local
```

### 2. Create Supabase project

1. Create a new project at [supabase.com](https://supabase.com) (recommended: dedicated Connect project)
2. Copy project URL, anon key, and service role key into `.env.local`
3. Set `CONNECT_ADMIN_EMAILS=your@email.com`

### 3. Apply database migrations

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or run `supabase/migrations/0001_connect_foundation.sql` and `0002_connect_auth_profiles.sql` in the SQL editor.

### 4. Create admin user

1. Supabase Dashboard → Authentication → Add user (email + password)
2. Ensure email is listed in `CONNECT_ADMIN_EMAILS`
3. Profile row is auto-created via `connect_handle_new_user` trigger

Or manually:

```sql
insert into public.connect_profiles (id, email, role)
select id, email, 'admin' from auth.users where email = 'admin@redfacepay.co.za'
on conflict (id) do update set role = 'admin';
```

### 5. Run locally

```bash
npm run dev
```

- Public site: [http://localhost:3000](http://localhost:3000)
- Apply form: [http://localhost:3000/apply](http://localhost:3000/apply)
- Admin: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## Repository structure

```text
src/
  app/
    apply/          Public enquiry form
    dashboard/      RedFace admin
    partner/        Partner portal (v0.2)
    api/            Lead submit + admin actions
  components/
  lib/
    scoring.ts      Lead quality score
    supabase/       Clients
supabase/
  migrations/       PostgreSQL schema + RLS
```

## Lead flow (v0.1)

```text
Consumer submits /apply
  → consent recorded
  → duplicate check
  → quality score
  → status: new / verified / qualified
Admin reviews in /dashboard/leads
  → assign partner manually
  → status: delivered
Partner contacts consumer (off-platform v0.1)
```

## Compliance notes

- Consent text version: `v0.1` (legal review required before ads)
- No guaranteed approval marketing
- Regulated categories (debt assistance) require verified partners before lead delivery
- First-party leads only (no scraped lists)

## Roadmap

| Version | Features |
|---------|----------|
| **v0.1** | Public form, admin dashboard, manual assignment |
| **v0.2** | Partner login, auto-matching rules, campaigns UI, wallet billing |
| **v0.3** | API/webhooks, white-label forms, RedFace Pay integration |

## Deploy to Vercel

1. Import `Redfacesa/leads` in Vercel
2. Add environment variables from `.env.example`
3. Set production URL in Supabase Auth redirect URLs
4. Apply migrations to production Supabase

## License

Proprietary — RedFace SA
