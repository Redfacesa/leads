# Red Leads

**South Africa's Lead Generation & Lead Marketplace Platform**

> Real Leads. Real People. Real Opportunities.

Red Leads generates, captures, qualifies, manages and distributes high-intent leads to businesses. It is the **Lead Operating System** in the RedFace ecosystem.

**Domain:** [redleads.co.za](https://redleads.co.za) (configure on Vercel)

## Platform sides

| Side | URL | Status |
|------|-----|--------|
| Public website | `/` | Phase 1 |
| Lead capture | `/apply` | Phase 1 |
| Red Leads Admin | `/dashboard` | Phase 1 |
| Client dashboard | `/client` | Phase 1 |
| Lead marketplace | `/client/marketplace` | Phase 2 (foundation live) |
| Lead partner network | — | Phase 4 |

Full product blueprint: [`docs/RED-LEADS-BLUEPRINT.md`](docs/RED-LEADS-BLUEPRINT.md)

## Stack

- Next.js 15 · TypeScript · Tailwind 4
- Supabase (shared RedFace hub `bpzzgilwlkghgfkvkkxx`, tables prefixed `connect_*`)
- Vercel

## Quick start

```bash
git clone https://github.com/Redfacesa/leads.git
cd leads
npm install
cp env/development.env.example .env.local
npm run dev
```

Apply migrations: `npm run db:push` or see `GO-LIVE.md`.

## Key routes

- `/` — Red Leads landing page
- `/apply` — Consumer enquiry funnel
- `/signup` — Client registration
- `/services` — Lead generation as a service
- `/dashboard` — Admin command centre
- `/client` — Client dashboard (leads, marketplace, billing)

## Compliance

- First-party consent-based leads only (POPIA)
- No credit bureau list scraping
- Consent + audit trail on every enquiry
- Marketplace previews hide PII until purchase

## License

Proprietary — RedFace SA
