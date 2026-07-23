# Stallspace — Test Pack

_Prepared 7 July 2026. Covers everything changed in the security & shipping hardening pass, plus the end-to-end flows you must verify before launch._

This pack has three parts:
- **Part A — What I tested and verified** (automated + static).
- **Part B — What you must test** (manual, especially anything needing a live database or real payment gateways).
- **Part C — Pre-launch go/no-go checklist**.

---

## Part A — What I tested and verified myself

### A1. Automated unit tests (`npm test`) — 13 tests, all passing
Run with `npm test`. Coverage:

| Area | What's asserted |
|---|---|
| Credential encryption (`secrets.ts`) | Encrypt/decrypt round-trips; ciphertext is salted (non-deterministic); envelope detection; transparent read of new-encrypted vs legacy-plaintext rows; secret masking; corrupt-ciphertext throws |
| PayFast URL builder | Required fields present; amount formatted to 2 decimals; sandbox vs live host switches on `PAYFAST_ENV` |
| Ozow URL builder | 128-char SHA512 `HashCheck` present; amount formatting; hash is deterministic for identical inputs |
| HTML escaping (`escapeHtml`) | Neutralises `<script>`, quotes, ampersands; handles null/undefined |
| Rate limiter | Allows up to the limit then blocks; resets after the window |

### A2. Static verification
- **`npm run type-check` passes with zero errors** across the whole project. (It previously did not even work — the `tsconfig` had no `target` set. That's fixed, so the type-check is now a real gate for you going forward.)
- Full read-through of the payment, order, auth, and admin code paths.

### A3. What A1/A2 do **not** prove
Unit tests and type-checks cannot exercise the live database, real RLS policies, real payment gateways, email delivery, or the browser. Those are in Part B and are the ones that actually gate launch.

---

## Part B — What you must test

Legend: **[CRITICAL]** must pass before launch · **[HIGH]** important · **[MED]** should verify.

### B1. Build & deploy
- [ ] **[CRITICAL]** `npm run build` completes with no errors on a clean checkout.
- [ ] **[CRITICAL]** Apply `002_security_hardening.sql` to your Supabase project (after 001). Confirm it runs cleanly and is idempotent (run it twice — the second run should not error).
- [ ] **[CRITICAL]** Set `PAYMENT_ENCRYPTION_KEY` (≥32 chars) in Netlify and locally. Confirm the app starts.
- [ ] **[HIGH]** Confirm `SUPABASE_SERVICE_ROLE_KEY` and `PAYMENT_ENCRYPTION_KEY` are set as server-side env vars in Netlify and are **not** exposed to the browser.

### B2. Payment credential security (the big one)
- [ ] **[CRITICAL]** As a vendor, save payment credentials at `/vendor/payments`. Then in Supabase, open `vendor_payment_configs` and confirm `config_data` is an encrypted `{ "enc": "..." }` blob — **not** readable plaintext.
- [ ] **[CRITICAL]** Open the checkout page in the browser, open DevTools → Network, and confirm **no vendor secret key** appears in any request/response (only `orderId` goes out; only `redirectUrl` comes back).
- [ ] **[CRITICAL]** Re-open `/vendor/payments` as the vendor and confirm secret fields show masked (`••••••1234`) and that saving without re-typing a secret keeps the old value.
- [ ] **[HIGH]** Confirm a logged-out/other user cannot read `vendor_payment_configs` via the Supabase client (RLS should return nothing).
- [ ] **[HIGH]** Confirm `POST /api/checkout/yoco` and `/api/checkout/peach` return `410`.

### B3. Checkout & payment (per gateway — needs sandbox credentials)
For **each** of PayFast, Ozow, Yoco, Peach, using **sandbox/test** credentials:
- [ ] **[CRITICAL]** Complete a full purchase and confirm you're redirected to the correct gateway.
- [ ] **[CRITICAL]** Pay successfully and confirm the order becomes `confirmed` **only after** real confirmation (PayFast/Ozow via webhook; Yoco/Peach via the server-side verify call).
- [ ] **[CRITICAL]** **Tamper test:** create an order, then visit the success URL **without paying** (Yoco/Peach) — confirm the order stays `pending` (server verification must reject it).
- [ ] **[CRITICAL]** **Price tamper test:** using DevTools, try to submit the order with a lower price/quantity — confirm the server-computed total (from the DB) is used, not your tampered value.
- [ ] **[HIGH]** Cancel/fail a payment and confirm you land on the cancel page and the order is not confirmed.
- [ ] **[HIGH]** Confirm the customer receives an order-confirmation email and the vendor receives a new-order notification (in-app + email).
- [ ] **[MED]** Multi-vendor cart: buy from two vendors in one checkout and confirm each vendor gets a separate order routed to their own gateway.
- [ ] **[MED]** Guest checkout (not logged in) works end-to-end.

> PayFast/Ozow webhooks require a publicly reachable `NEXT_PUBLIC_APP_URL`. Test on a deployed preview, not `localhost`, or use a tunnel (e.g. ngrok).

### B4. Vendor lifecycle & subscription
- [ ] **[HIGH]** Register a new vendor → appears as `pending` in `/admin/vendors`.
- [ ] **[HIGH]** Admin approves → vendor gets email + in-app notification; storefront becomes publicly visible.
- [ ] **[HIGH]** Admin sets plan/status/next-billing and clicks **Record Payment** → `subscription_events` gets a `charge_success` row, status becomes `active`, next billing advances one month.
- [ ] **[HIGH]** Admin suspends a vendor → storefront and products disappear from the marketplace; vendor gets notified.
- [ ] **[MED]** Reject and reactivate flows send the right emails.

### B5. Product limits
- [ ] **[HIGH]** As a Starter vendor, add products up to 20, then attempt a 21st → it must be **blocked** with a clear message (enforced by the DB trigger).
- [ ] **[MED]** Upgrade the vendor to Growth and confirm the limit rises to 50.

### B6. Reviews, enquiries, notifications
- [ ] **[HIGH]** Submit a review → it is created **unapproved** and does not show publicly until approved.
- [ ] **[HIGH]** Submit 6 reviews quickly from the same browser → the 6th is rate-limited (HTTP 429).
- [ ] **[MED]** Submit an enquiry → vendor receives email + in-app notification; vendor reply email arrives and is **not** broken by special characters (test a message containing `<b>` and `&` — it should appear literally, not as HTML).
- [ ] **[HIGH]** Confirm a non-admin cannot trigger vendor approval emails by calling `POST /api/notifications/send` with a `vendor.approved` event (should return 401/403).

### B7. Access control (RLS / routing)
- [ ] **[CRITICAL]** Logged-out user visiting `/admin`, `/vendor/dashboard`, `/account` is redirected to login.
- [ ] **[CRITICAL]** A logged-in **customer** cannot reach `/admin` (admin layout must redirect).
- [ ] **[HIGH]** Vendor A cannot see or edit Vendor B's products, orders, enquiries, or payment config.
- [ ] **[HIGH]** A customer can only see their own orders and addresses.

### B8. Regression sweep (things the refactor touched)
- [ ] **[MED]** Storefront pages, product pages, search, compare, categories all load.
- [ ] **[MED]** Store/product view tracking still records rows in `store_views`/`product_views`.
- [ ] **[MED]** Customer account: favourites, saved addresses, order history work.

---

## Part C — Pre-launch go/no-go checklist

All **[CRITICAL]** items in Part B must be ticked. In addition:

- [ ] Migration 002 applied to production Supabase.
- [ ] `PAYMENT_ENCRYPTION_KEY` set in production and safely backed up (losing it means all vendors must re-enter credentials).
- [ ] At least one full sandbox purchase verified per gateway you intend to launch with.
- [ ] Tamper tests (B2, B3) passed.
- [ ] Supabase automated backups / PITR enabled.
- [ ] Repo no longer tracks `nohup.out`, `*.bak`, `*.old`, or `.DS_Store` (already removed; keep it that way).
- [ ] Decide whether 2FA and audit logging are launch blockers or fast-follows (see System Documentation §11).

---

## Appendix — How to run the automated tests

```bash
npm test          # 13 unit tests (Node built-in runner, no extra deps)
npm run type-check # full TypeScript check, should print nothing and exit 0
```
