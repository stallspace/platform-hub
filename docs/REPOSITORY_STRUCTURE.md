# Stallspace — Repository Structure (`platform-hub`)

Stallspace is a **single Next.js application**. The three "portals" are sections
(route groups) within the one codebase — they share the same database, auth
session, and component library.

```
platform-hub/
├── src/
│   ├── app/
│   │   ├── marketplace/     ── CUSTOMER MARKETPLACE (public storefront, cart, checkout)
│   │   ├── vendor/          ── VENDOR PORTAL (dashboard, products, orders, payments, subscription)
│   │   ├── admin/           ── ADMIN PORTAL (vendor approval, billing, moderation, content)
│   │   ├── account/         ── customer accounts (orders, addresses, favourites)
│   │   ├── join/            ── vendor registration
│   │   ├── auth/            ── login / register
│   │   ├── legal/           ── privacy, terms, POPIA
│   │   └── api/             ── server routes (orders, checkout, payments, notifications, reviews)
│   ├── components/
│   │   ├── marketplace/     ── UI for the customer marketplace
│   │   ├── vendor/          ── UI for the vendor portal
│   │   ├── admin/           ── UI for the admin portal
│   │   └── storefront/      ── shared storefront widgets (reviews, enquiries)
│   ├── lib/
│   │   ├── supabase/        ── DB clients (browser, server, service-role)
│   │   ├── payments/        ── PayFast (+ inert Yoco/Peach/Ozow) gateway helpers
│   │   ├── crypto/          ── credential encryption
│   │   ├── email/           ── Resend + email templates
│   │   └── utils/           ── helpers, HTML escaping, rate limiting
│   └── middleware.ts        ── route protection (vendor/admin/account)
├── database/                ── all SQL: migrations, seed, operational queries
├── docs/                    ── system documentation, test pack, this file
├── public/                  ── static assets
└── supabase/                ── Supabase CLI config + mirrored migrations
```

## The three sections at a glance

| Section | Routes | Who uses it |
|---|---|---|
| **Marketplace** | `/marketplace/*`, `/account/*` | Customers (public + optional accounts) |
| **Vendor Portal** | `/vendor/*`, `/join/*` | Vendors |
| **Admin Portal** | `/admin/*` | Stallspace admins |

Access to each is enforced by `src/middleware.ts` plus per-layout role checks.

## Why one app (not three)

The portals share one Supabase database, one auth session, and the same
components and payment/email libraries. Keeping them in a single app means one
deployment, no duplicated auth, and no shared-code packaging overhead. If the
product ever needs independent scaling or separate teams, this can be split into
a monorepo later — but that isn't necessary for launch.
