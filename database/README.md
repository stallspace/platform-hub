# Stallspace — Database

All database SQL for the platform lives here. The backend is **Supabase (PostgreSQL)**.

## Folder layout

```
database/
├── migrations/   Ordered schema migrations — the source of truth for the schema
│   ├── 001_initial_schema.sql        Core tables, enums, indexes, triggers, base RLS
│   └── 002_security_hardening.sql    RLS lockdown, reconciled tables, product-limit trigger
├── seed/         Optional seed data for a fresh environment
│   └── 001_seed.sql
└── queries/      Handy operational / reporting queries (run ad-hoc, not migrations)
```

> The same migration files are mirrored in `supabase/migrations/` so the Supabase CLI can pick them up. If you change the schema, update **both** (or standardise on one). Treat `database/migrations/` as the readable source of truth.

## Applying migrations

**Option A — Supabase dashboard:** open the SQL Editor, paste each migration in order (001, then 002), run.

**Option B — Supabase CLI:**
```bash
supabase db push        # applies migrations in supabase/migrations
```

Migration `002` is **idempotent** — safe to run more than once.

## Rules going forward

- **Every schema or RLS change must be a new numbered migration** (e.g. `003_*.sql`). Never edit the live database directly in the dashboard without capturing it here — that's how the schema drifted before.
- Keep migrations additive where possible; don't rewrite old ones once they've been applied to production.

## Key tables

`profiles`, `vendors`, `vendor_payment_configs`, `vendor_store_settings`, `products`, `categories`,
`orders`, `enquiries`, `reviews`, `notifications`, `subscription_events`, `audit_logs`,
`homepage_content`, `product_views`, `store_views`, `customer_addresses`, `customer_favourites`.

See `../docs/STALLSPACE_SYSTEM_DOCUMENTATION.md` for how the schema maps to the app.
