# Red Leads OS — Product Blueprint

**Domain:** `redleads.co.za`  
**Positioning:** South Africa's Lead Generation & Lead Marketplace Platform  
**Tagline:** Real Leads. Real People. Real Opportunities.

> Red Leads generates, captures, qualifies, manages and distributes high-intent leads to businesses.

This document maps the product vision to the implementation in this repository. Internal database tables use the `connect_*` prefix (legacy from RedFace Connect); they are the **Red Leads kernel** until a rename migration is warranted.

---

## Ecosystem placement

```text
                    RED FACE
                       │
         ┌─────────────┼─────────────┐
         │             │             │
     RED LEADS     REDFACE PAY    REDFACE STUDIO
    (this repo)    payments       campaigns/LPs
```

Red Leads **acquires demand**. RedFace Pay handles wallet top-ups and future checkout. RedFace Studio creates campaigns and landing pages.

---

## Four platform sides

| Side | Route prefix | Who | Phase |
|------|--------------|-----|-------|
| **A. Red Leads Admin** | `/dashboard` | Red Leads staff | 1 ✅ |
| **B. Client Dashboard** | `/client` | Lead buyers (debt cos, agencies, etc.) | 1 ✅ |
| **C. Lead Generation** | `/apply`, campaigns | Public funnels | 1 ✅ |
| **D. Lead Partners** | `/partners-network` | External marketers (controlled) | 4 |

---

## Entity mapping (vision → database)

| Vision entity | Implementation | Notes |
|---------------|----------------|-------|
| `users` | `auth.users` + `connect_profiles` | Clerk/Supabase auth |
| `organizations` | `connect_partners` | Client companies buying leads |
| `organization_members` | `connect_profiles.partner_id` + role | Multi-user per org |
| `lead_categories` | `connect_lead_categories` | + `vertical` column |
| `campaigns` | `connect_campaigns` + `connect_sources` | UTM attribution |
| `leads` | `connect_leads` | Central lead record |
| `lead_responses` | `connect_lead_answers` | Flexible Q&A per category |
| `lead_consents` | `connect_lead_consent` | POPIA audit trail |
| `client_accounts` | `connect_billing_accounts` | Wallet / credits |
| `lead_orders` | `connect_lead_orders` | Marketplace purchases (Phase 2) |
| `lead_activity` | `connect_lead_status_history` + `connect_audit_logs` | Full audit trail |
| `marketplace_listings` | `connect_marketplace_listings` | Inventory (Phase 2) |

---

## Lead pipeline

```text
TRAFFIC → CAMPAIGN → LANDING PAGE → FORM → CONSENT
   → VERIFICATION → QUALIFICATION → LEAD SCORE
   → QUALITY CHECK → AVAILABLE INVENTORY
   → CLIENT / MARKETPLACE → CONTACTED → CONVERTED
```

### Status model

| Status | Meaning | Phase |
|--------|---------|-------|
| `new` | Just captured | 1 |
| `verifying` | OTP / fraud check pending | 3 |
| `verified` | Identity/consent confirmed | 1 |
| `qualified` | Passes category rules + score | 1 |
| `available` | Listed in marketplace inventory | 2 |
| `reserved` | Held during checkout | 2 |
| `sold` / `delivered` | Purchased / allocated to client | 1–2 |
| `contacted` … `converted` | Client outcome tracking | 1 |
| `rejected`, `duplicate`, `invalid`, `archived` | Terminal / hygiene | 1 |

---

## Roles

| Role | DB value | Access |
|------|----------|--------|
| Red Leads Owner | `admin` | Everything |
| Red Leads Admin | `connect_staff` | Leads, campaigns, clients, allocation |
| Client Owner | `client_owner` / `partner_owner` | Billing, team, all org leads |
| Client Manager | `client_admin` / `partner_admin` | Leads, reports, no billing admin |
| Client Agent | `client_agent` / `partner_agent` | Assigned leads, status, notes |
| Client Viewer | `client_viewer` / `partner_viewer` | Read-only |
| Lead Partner | `lead_partner` | Phase 4 — submit only |

---

## Admin menu (command centre)

| Screen | Route | Phase |
|--------|-------|-------|
| Dashboard | `/dashboard` | 1 ✅ |
| Leads | `/dashboard/leads` | 1 ✅ |
| Campaigns | `/dashboard/campaigns` | 1 ✅ |
| Categories | `/dashboard/categories` | 1 |
| Clients | `/dashboard/clients` | 1 (alias partners) |
| Matching rules | `/dashboard/matching` | 1 ✅ |
| Marketplace | `/dashboard/marketplace` | 2 |
| Orders | `/dashboard/orders` | 2 |
| Revenue & billing | `/dashboard/revenue` | 1 ✅ |
| Analytics | `/dashboard/analytics` | 1 ✅ |
| Team | `/dashboard/team` | 3 |
| Settings | `/dashboard/settings` | 3 |

---

## Client dashboard

| Screen | Route | Phase |
|--------|-------|-------|
| Overview | `/client` | 1 ✅ |
| My Leads | `/client/leads` | 1 ✅ |
| Marketplace | `/client/marketplace` | 2 |
| Billing | `/client/billing` | 1 ✅ |
| Webhooks | `/client/webhooks` | 1 ✅ |
| Team | `/client/team` | 3 |
| Reports | `/client/reports` | 2 |

**Dashboard widgets:** New leads, Contacted, Qualified, Converted, Lead balance (wallet).

---

## Public website (`redleads.co.za`)

| Section | Purpose |
|---------|---------|
| Hero | Get Leads / Generate Leads CTAs |
| How it works | 5-step funnel explanation |
| Categories | Financial, Business, Home, Automotive, Insurance |
| For businesses | Client signup |
| For partners | Phase 4 teaser |
| Footer | Legal, contact |

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/apply` | Consumer lead capture |
| `/signup` | Client registration |
| `/services` | Lead generation as a service (Model 4) |
| `/login` | Admin + client sign in |

---

## Revenue models

1. **Pay per lead** — wallet charge on delivery/purchase (R50–R300+)
2. **Lead packages** — monthly credit bundles (Phase 2)
3. **Marketplace** — browse inventory, purchase individually (Phase 2)
4. **Lead gen as a service** — setup + management + CPL (Phase 2–3)

---

## Compliance (non-negotiable)

- First-party leads only — no scraped credit bureau lists
- Explicit consent before sharing with clients ([POPIA direct marketing guidance](https://popia.co.za))
- Consent version + hash stored per lead
- Regulated categories (debt review) → verified clients only
- Lead preview in marketplace hides PII until purchase + consent allows

---

## Build phases

### Phase 1 — Red Leads Core (current)

- [x] Landing page + branding
- [x] Auth (admin + client)
- [x] Admin dashboard
- [x] Client dashboard
- [x] Lead DB + categories + forms
- [x] Campaign tracking + UTM
- [x] Consent records
- [x] Lead assignment + auto-match
- [x] Status tracking + audit
- [ ] Categories admin UI
- [ ] Client role aliases in DB

### Phase 2 — Marketplace

- [ ] `connect_marketplace_listings`
- [ ] Lead preview (masked PII)
- [ ] Purchase flow + orders
- [ ] Exclusive lead locking
- [ ] Invoices / packages

### Phase 3 — Automation

- [ ] OTP phone verification
- [ ] WhatsApp / SMS / email (via RedFace notification outbox pattern)
- [ ] AI qualification assist (explain, never invent)
- [ ] CRM webhooks (started)

### Phase 4 — Lead Partner Network

- [ ] Partner campaign approval
- [ ] Commission rules
- [ ] Quality gate before inventory

---

## Technical stack

- **Next.js 15** App Router, TypeScript, Tailwind 4
- **Supabase** PostgreSQL + Auth + RLS (shared RedFace hub `bpzzgilwlkghgfkvkkxx`)
- **Vercel** — `redleads.co.za` (configure when domain ready)

---

## Master implementation prompt

When extending Red Leads, always ask:

1. **Which side?** Admin, Client, Public funnel, or Partner network?
2. **Which phase?** Do not ship Phase 2 marketplace UX without listing + order tables.
3. **POPIA?** Consent, purpose, and sharing must be recorded before PII reaches a client.
4. **Audit?** Every state change → `connect_lead_status_history` or `connect_audit_logs`.
5. **Money?** Wallet charge via `connect_charge_lead_delivery` or order RPC — never duplicate billing logic.

---

*Version 1.0 — August 2026. Update when Phase gates pass.*
