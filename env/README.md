# Vercel environment setup — RedFace Connect

Copy the right template, fill in Supabase keys, then add to Vercel or use locally.

| File | Vercel scope | Use |
|------|--------------|-----|
| `env/development.env.example` | Development | Local `.env.local` |
| `env/preview.env.example` | Preview | PR / branch deploys |
| `env/production.env.example` | Production | `connect.redfacepay.co.za` or `leads-ten-steel.vercel.app` |

## Variables (all environments)

| Variable | Public | Required | Notes |
|----------|--------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **No** | Yes | Server API routes only |
| `CONNECT_ADMIN_EMAILS` | No | Yes | `info@redfacepay.co.za` |
| `NEXT_PUBLIC_APP_URL` | Yes | Yes | Auth redirect base URL |

## Local

```bash
cp env/development.env.example .env.local
# Edit .env.local with your Supabase keys
npm run dev
```

## Vercel Dashboard

1. Import [Redfacesa/leads](https://github.com/Redfacesa/leads) in Vercel
2. **Settings → Environment Variables**
3. Add each variable from `env/production.env.example` (Production scope)
4. Repeat for Preview using `env/preview.env.example`
5. Add domain: `connect.redfacepay.co.za`

## Vercel CLI

```bash
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add CONNECT_ADMIN_EMAILS production
vercel env add NEXT_PUBLIC_APP_URL production
```

Pull back to local:

```bash
npm run env:pull:production
```

## Supabase Auth redirects

Add to Supabase → Authentication → URL configuration:

- **Site URL:** `https://connect.redfacepay.co.za` (or `https://leads-ten-steel.vercel.app` until domain is live)
- **Redirect URLs:**
  - `https://connect.redfacepay.co.za/auth/callback`
  - `https://leads-ten-steel.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`
  - `https://*.vercel.app/auth/callback` (preview)
