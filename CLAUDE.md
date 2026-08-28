# Stallspace — Working Context

Read this first. It captures decisions and traps that aren't obvious from the code.

Owner: Mujahid (hendricksmujahid@gmail.com)
Repo: https://github.com/stallspace/platform-hub · branch `main`
Live: https://stallspace.co.za (Netlify, auto-deploys on push to `main`)
Instagram: https://www.instagram.com/stallspace_ (only social account — no Facebook or Twitter)

## What this is

A South African subscription marketplace. Vendors pay Stallspace a flat monthly fee; customers buy
from vendors. Stallspace takes **no commission** and never touches customer money.

## The rule that shapes everything

**Stallspace is never in the payment path, and never stores customer card details.**

Money goes customer → vendor directly. Each vendor connects **their own PayFast account**
(their merchant ID, key, passphrase). Vendors without PayFast can accept **pay on collection**.
Vendor payment credentials are stored AES-encrypted (`src/lib/crypto/secrets.ts`).

This was an explicit decision after considering and rejecting split payments. If a future
change would route customer funds through a Stallspace account or store card data, stop and
raise it rather than implementing it.

Vendor subscriptions are billed by **manual EFT** with emailed reminders. No debit orders.
First 3 months are free for launch vendors.

## Stack

- Next.js 14.2.35, App Router, React Server Components
- Supabase (Postgres + Auth + Storage + RLS) — **hosted in Germany**, ~200ms RTT from SA
- Resend for transactional email, sender `hello@stallspace.co.za`
- Netlify hosting + DNS; Google Workspace MX
- PWA: `public/manifest.webmanifest`, `public/sw.js`, installable to home screen

## Commands

```bash
npm run dev          # localhost:4000 — NOT 3000, PayFast return URLs depend on this
npm run build
npm run type-check   # tsc --noEmit
npm test             # node --test over tests/*.test.ts
```

Verify changes with `npm run type-check && npm test`. A full `next build` is slow; Netlify
runs the real one on push.

## Layout

```
src/app/           marketplace/ (public) · vendor/ · admin/ · account/ · join/ · auth/ · api/
src/lib/payments/  payfast.ts is the live one. ozow/peach/yoco are scaffolding, NOT in use.
src/lib/crypto/    secrets.ts — AES encryption of vendor payment credentials
src/lib/supabase/  server.ts, client.ts, session.ts (request-cached auth helpers)
src/middleware.ts  HTTPS redirect + auth guards
supabase/migrations/  001–007, mirrored to database/migrations/
docs/              system documentation + test pack (written pre-launch, partly stale)
```

## Traps that have already bitten

**Every page reading cookies needs `export const dynamic = 'force-dynamic'`.** Without it the
build fails with "couldn't be rendered statically". Applies to ~23 pages.

**RLS policies must never query their own table.** A `profiles` policy that selected from
`profiles` caused infinite recursion and hung every login. Migration 006 fixed it with a
`SECURITY DEFINER is_admin()` function. Use that pattern for any new admin-gated policy.

**PayFast signatures**: MD5 over URL-encoded fields using PHP-style encoding (`phpUrlencode`
in `src/lib/payments/payfast.ts` — spaces become `+`, not `%20`). The **passphrase is used to
compute the signature but must never be transmitted**. It leaked in a redirect URL once.

**Never bulk find-and-replace Tailwind classes.** Replacing `mb-8` also matches inside
`sm:mb-8`, producing broken duplicates like `sm:mb-5 sm:mb-8`. Bitten twice. Edit deliberately.

**Auth lookups**: use the cached helpers in `src/lib/supabase/session.ts`
(`getCurrentUser` / `getCurrentVendor` / `getCurrentProfile`) rather than re-querying.
They're wrapped in React `cache()` so a request hits the DB once. This matters a lot given
the Germany latency.

**Admin and vendor portals are separate.** An admin account has no vendor portal access.

## Mobile / PWA conventions

The app is used mostly on phones and should feel native, not like a shrunk website.
Mobile spacing is roughly half the desktop value — `py-8 sm:py-14`, `p-5 sm:p-8`,
`gap-4 sm:gap-6`. Multi-item sections go 2-up on phones rather than a single long column.
FAQs use native `<details>` accordions (no JS needed). Desktop layouts stay generous.

Stated preference: *"compact like an app, not a website — I don't want people to have to
scroll endlessly."*

## Known and accepted

- Supabase in Germany adds ~200ms per round trip. Migration considered and deferred.
- Netlify free tier cold starts, ~1.5–2.5s.
- Next.js 15/16 upgrade deferred; remaining advisories are DoS-class and need a major bump.
- `src/app/auth/login/page.tsx.bak` and `src/app/marketplace/store/[slug]/page.tsx.bak`
  are dead files, safe to delete.

## Still open

- Switch PayFast from sandbox to live: delete sandbox config, set `PAYFAST_ENV=live`,
  have vendors enter their own credentials, then run one small real transaction.
- Delete test data and seed real categories.
- Refresh `docs/` — written before the payment model and several flows changed.
- Product grid tuning once real vendor products exist.

## Working style

Direct and concise. Say what changed and why; skip the recap. Push back when a request
would make something worse — that's wanted, not resented. Flag your own mistakes explicitly.
