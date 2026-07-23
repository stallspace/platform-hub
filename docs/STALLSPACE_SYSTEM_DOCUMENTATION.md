# Stallspace — System Documentation

_Last updated: 7 July 2026. This supersedes the original MARCRTE MVP BRS where they differ (pricing, billing model, payment architecture, and security)._

---

## 1. What Stallspace is

Stallspace is a **vetted, subscription-based marketplace platform**. Independent vendors pay Stallspace a monthly subscription to run a professional storefront. Customers browse the marketplace and buy **directly from vendors** using each vendor's own payment gateway.

Stallspace is **not a payment intermediary**: it never holds, processes, or distributes customer funds. Customer money flows straight from the customer to the vendor's own merchant account. Stallspace only records the transaction for reporting. Stallspace's revenue is the vendor subscription.

Launch targets: ~20 vendors, ~1,000 customers, up to ~5,000 products.

---

## 2. Technology stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS |
| Database / Auth / Storage | Supabase (PostgreSQL, Auth, Storage, Row-Level Security) |
| Email | Resend |
| Customer payment gateways | PayFast, Ozow, Yoco, Peach Payments (each vendor-configured) |
| Hosting | Netlify (frontend) |
| Credential encryption | AES via `crypto-js`, server-side only |

The app runs on port 4000 in development (`npm run dev`).

---

## 3. User roles

There are three roles, stored on `profiles.role`:

- **customer** — browses, buys (guest checkout supported), and can optionally create an account for favourites, saved addresses, and order history.
- **vendor** — manages a storefront, products, orders, enquiries, reviews, analytics, payment configuration, and subscription.
- **admin** — approves/suspends vendors, manages plans and billing, moderates products and reviews, manages categories and homepage content.

A profile row is created automatically on signup by the `handle_new_user()` trigger. Route protection is enforced by `src/middleware.ts` (redirects unauthenticated users away from `/vendor/*`, `/admin/*`, `/account/*`) **and** by per-layout server checks (e.g. the admin layout re-checks `role === 'admin'`).

---

## 4. Vendor lifecycle

Vendor status (`vendors.status`) moves through: **pending → under_review → approved / rejected**, and an approved vendor can later be **suspended** and **reactivated**.

1. A prospective vendor registers (`/join/register`), which creates an auth user with `role: 'vendor'` and a `vendors` row with status `pending`.
2. An admin reviews the application in `/admin/vendors/[id]`, checks documents, and approves, rejects, or marks it under review.
3. On approval the admin sets the vendor's **subscription plan, status, and next-billing date** (see §7). Approval fires an email + in-app notification to the vendor.
4. A suspended vendor's storefront and products are hidden from the marketplace (enforced by RLS: only `status = 'approved'` vendors are publicly visible).

---

## 5. Payment architecture (customer purchases) — IMPORTANT

This is the most security-sensitive part of the system and was re-architected. **Vendor payment credentials never reach the browser.**

### How credentials are stored
- Vendors enter their gateway credentials at `/vendor/payments`.
- The client sends them to `POST /api/vendor/payment-config`, which **encrypts** them with AES (`src/lib/crypto/secrets.ts`) using the server-only `PAYMENT_ENCRYPTION_KEY`, then stores the ciphertext in `vendor_payment_configs.config_data` as an envelope `{ enc: "<ciphertext>" }`.
- `GET /api/vendor/payment-config` returns credentials **masked** (only the last 4 characters of secrets). Vendors can leave a secret blank when editing to keep the stored value.

### How a customer pays
1. Customer completes the checkout form (`/marketplace/checkout`). The page fetches only **non-secret** info via `GET /api/checkout/payment-method?vendorId=` (which provider, and whether it's configured).
2. On "Pay", the client calls `POST /api/orders` to create the order. **The server recomputes every price from the database** — client-submitted prices are ignored — and computes delivery from the vendor's store settings. The order is created with status `pending`.
3. The client calls `POST /api/checkout/initiate` with just the `orderId`. The server loads the order and the vendor's active config, **decrypts** the credentials, builds the gateway redirect (PayFast/Ozow URL) or creates a hosted checkout (Yoco/Peach), and returns only the `redirectUrl`.
4. The customer is redirected to the gateway and pays the vendor directly.

### How payment is confirmed (never trusted from the browser)
- **PayFast & Ozow** send a signed server-to-server webhook to `POST /api/orders/notify`. The signature/hash is verified server-side before the order is marked `confirmed` and a confirmation email is sent.
- **Yoco & Peach** return the customer to the success page. The success page calls `POST /api/checkout/verify`, which **queries the gateway API server-side** (using the decrypted credentials and the stored checkout reference) to confirm the money actually moved before marking the order `confirmed`.
- Marking an order `confirmed` is guarded to a single `pending → confirmed` transition, so duplicate webhooks/redirects don't double-send emails.

### Order status vocabulary
`pending → confirmed → processing → shipped → delivered` (plus `cancelled`, `refunded`). `confirmed` is the "paid / received" state. (The earlier code wrote an invalid `paid` status that wasn't in the DB enum — this was corrected.)

### Deprecated endpoints
`POST /api/checkout/yoco` and `POST /api/checkout/peach` used to accept the vendor's secret key from the browser. They now return `410 Gone`. All gateway logic lives in `POST /api/checkout/initiate` and `POST /api/checkout/verify`.

---

## 6. Product limits by plan

Enforced at the **database level** (a `BEFORE INSERT` trigger, `enforce_product_limit()`), so it cannot be bypassed by the client:

| Plan | Monthly price | Product limit |
|---|---|---|
| Starter | R250 | 20 |
| Growth | R500 | 50 |
| Premium | R1000 | Unlimited |

A vendor with no plan is capped at the Starter limit. Attempting to exceed the cap raises a database error the UI surfaces to the vendor.

---

## 7. Subscription billing (admin-managed for launch)

For launch, subscription billing is **admin-managed** rather than fully automated. In `/admin/vendors/[id]` → Subscription tab, an admin can:

- Set the vendor's **plan**, **status** (`active` / `past_due` / `suspended` / `cancelled`), and **next-billing date**.
- **Record a payment**, which logs a `charge_success` event to `subscription_events`, sets status `active`, and advances next billing by one month.

Vendors see their plan and status at `/vendor/subscription` and request plan changes by email. The email templates and notification events for automated billing (payment-failed reminders, cancellation notices) already exist and can be wired to a scheduled job later.

**Fast-follow (not built yet):** true recurring billing via PayFast/Peach subscription APIs plus a scheduled job runner (e.g. Netlify scheduled functions or Railway cron) to auto-charge, retry, suspend, and reactivate. See §11.

---

## 8. Security model

- **Row-Level Security (RLS)** is enabled on all tables. Public users can only read approved vendors, available products, approved reviews, categories, homepage content, and store settings. Vendors can only read/write their own data; customers only their own orders/addresses/favourites; admins manage everything. Payment credentials are readable/writable **only** by the owning vendor (and the server's service role) — never publicly.
- **Service role** (`SUPABASE_SERVICE_ROLE_KEY`) is used only by trusted server routes (`src/lib/supabase/admin.ts`) that do their own authorisation and validation. It is never exposed to the browser.
- **Credential encryption at rest** — see §5.
- **Server-side price integrity** — order totals are always recomputed from the DB.
- **HTML escaping** — all user-supplied values injected into emails are escaped (`escapeHtml`) to prevent HTML/script injection.
- **Endpoint hardening** — the reviews endpoint is validated and rate-limited; the notifications endpoint requires an authenticated admin for vendor/subscription events; the analytics endpoint validates input.
- **POPIA** compliance pages and Terms/Privacy exist under `/legal/*`.

### Known items still to do (see §11)
2-factor authentication, automated database backups, and writing to the `audit_logs` table are listed as requirements but are **not yet implemented**.

---

## 9. Database

Schema is defined by two migrations in `supabase/migrations/`:

- **`001_initial_schema.sql`** — core tables, enums, indexes, triggers, and the original RLS policies.
- **`002_security_hardening.sql`** — reconciles three tables that had been added directly to the live database (`customer_addresses`, `customer_favourites`, `vendor_store_settings`), locks down payment-credential RLS, adds admin/vendor policies for previously unprotected tables, and adds the product-limit trigger. It is **idempotent** (safe to run more than once).

> **Schema drift note:** the live database had diverged from the migration files (tables and RLS changes made in the Supabase dashboard were never committed). Migration 002 brings the repo back in sync. From now on, **every schema/RLS change must be a committed migration** so the database can always be rebuilt from source.

Key tables: `profiles`, `vendors`, `vendor_payment_configs`, `vendor_store_settings`, `products`, `categories`, `orders`, `enquiries`, `reviews`, `notifications`, `subscription_events`, `audit_logs`, `homepage_content`, `product_views`, `store_views`, `customer_addresses`, `customer_favourites`.

---

## 10. Environment variables

Set these in `.env.local` (dev) and in Netlify (production). See `.env.example` for the full list.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only.** Service role for trusted routes |
| `PAYMENT_ENCRYPTION_KEY` | **Server-only.** ≥32 chars; encrypts vendor credentials. Generate: `openssl rand -base64 48` |
| `NEXT_PUBLIC_APP_URL` | Base URL, used to build gateway return/notify URLs |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME` | Email sending |
| `PAYFAST_ENV`, `PEACH_ENV`, `OZOW_ENV` | `test`/`sandbox` vs `live`/`prod` per gateway |

> If `PAYMENT_ENCRYPTION_KEY` ever changes, previously stored credentials can no longer be decrypted and vendors must re-enter them. Keep it stable and backed up securely.

---

## 11. Not yet built / recommended next

1. **Automated recurring billing** (PayFast/Peach subscriptions + scheduled charge/retry/suspend jobs).
2. **Two-factor authentication** for admin (and optionally vendor) accounts.
3. **Automated database backups** (enable Supabase scheduled backups / PITR).
4. **Audit logging** — the `audit_logs` table exists; wire admin actions (approve/suspend/plan changes) to write to it.
5. **Durable rate limiting** — the current limiter is in-memory (per instance). Back it with Upstash Redis for production.
6. **Variant-level pricing** — orders currently price from the base product price; if variants change price, extend `POST /api/orders` to price per variant.

---

## 12. Local development

```bash
npm install
cp .env.example .env.local   # fill in real values, incl. PAYMENT_ENCRYPTION_KEY
npm run dev                  # http://localhost:4000
npm run type-check           # tsc --noEmit (now passes cleanly)
npm test                     # unit tests
```

Apply migrations to your Supabase project via the Supabase SQL editor or CLI, in order (001 then 002).
