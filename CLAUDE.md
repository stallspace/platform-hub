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

**RLS policies need `WITH CHECK`, not just `USING`.** On UPDATE, Postgres reuses `USING`
as the check, so `USING (auth.uid() = id)` stays true after the row's `role` changes —
that let any user make themselves an admin, and any vendor approve themselves. Migration
008 guards `profiles.role` and `vendors.status`/`subscription_*` with `BEFORE UPDATE`
triggers instead. Use that pattern for any privileged column.

**Never log a PayFast signature base.** It begins `merchant_id=...&merchant_key=...`, so
logging it leaks the vendor's live credentials into Netlify's function logs. Log the field
names and the resulting signature only.

**Order status is a state machine, not a free-text column.** `confirmed` means paid, and
for gateway orders only the signed ITN may set it — a vendor button must never be able to
(it fires the stock trigger and emails the customer). The table lives in
`src/app/api/orders/status/route.ts`, mirrored in `OrdersClient.tsx` and
`tests/order-transitions.test.ts`. Change all three together.

**Payment settlement has one entry point:** `settlePaidOrder()` in `src/lib/orders/settle.ts`.
It is idempotent (compare-and-set on `status = 'pending'`) and sends both the customer
confirmation and the vendor notification. Don't email either side from a webhook directly.

**Checkout tokens.** `/api/checkout/initiate` and `/verify` require an HMAC of the order id
(`src/lib/payments/checkout-token.ts`), issued in the response to `POST /api/orders` and
held in `sessionStorage`. Guests have no session, and the order id travels in URLs, so it
proves nothing on its own. Never put the token in a URL.

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
- `database/migrations/` and `supabase/migrations/` are byte-identical duplicates, both
  tracked. Write to both, or delete one.
- Rate limiting is an in-process Map, so it resets on every Netlify cold start. Applied
  only to `/api/reviews`.

## Still open

- `PAYFAST_ENV=live` is set in Netlify for **all deploy contexts** — deploy previews hit
  live PayFast with real vendor credentials. Split it per-context before testing on a
  preview URL.
- One real transaction against a real vendor's credentials is still untested: a different
  merchant's passphrase through the signature path, and a production ITN actually landing.
- Reconciliation job — nothing catches an order whose ITN never arrived (endpoint down
  mid-deploy, customer closed the tab). Sweep `pending` orders with a `payment_reference`
  older than a few minutes and re-verify.
- Subscription billing: no scheduled reminders, and `subscriptionReminderEmail` has no
  banking details. `subscription_status` gates nothing — unpaid vendors keep selling.
- No `robots.txt`, no `sitemap.xml`, no returns/refunds policy.
- Delete test data and seed real categories.
- Refresh `docs/` — written before the payment model and several flows changed.
- Product grid tuning once real vendor products exist.

## Working style

Direct and concise. Say what changed and why; skip the recap. Push back when a request
would make something worse — that's wanted, not resented. Flag your own mistakes explicitly.
