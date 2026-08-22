# Stallspace — Morning Checklist (domain go-live)

Work top to bottom. Stop and investigate if anything marked **STOP** fails.

---

## 1. Update the app URL (5 min) — do this first

Everything below depends on it. `NEXT_PUBLIC_APP_URL` builds payment return URLs,
the PayFast webhook URL, and every link inside your emails.

1. Netlify → **stallspace** → Project configuration → **Environment variables**
2. Find **`NEXT_PUBLIC_APP_URL`** → edit
3. Set the value to exactly:
   ```
   https://stallspace.co.za
   ```
   (no trailing slash, nothing else in the box)
4. Save
5. Netlify → **Deploys** → **Trigger deploy → Deploy site**
   *(env changes only take effect on a new build — this step is not optional)*
6. Wait for the deploy to go green

---

## 2. Site loads on the real domain (2 min)

- [ ] `https://stallspace.co.za` loads the marketplace
- [ ] Padlock shows (valid HTTPS)
- [ ] `https://www.stallspace.co.za` redirects to the apex
- [ ] `https://stallspace.co.za/admin/login` opens

If your Mac still shows the old parking page: flush DNS
(`sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`), restart your
router, or set DNS to `1.1.1.1`. It works elsewhere — this is local cache only.

---

## 3. Email — inbound (5 min) **STOP if this fails**

Your mailbox MX now lives in Netlify DNS. Prove it survived the move.

- [ ] From a personal address, email **hello@stallspace.co.za** → it arrives
- [ ] From a personal address, email **mujahidh@stallspace.co.za** → it arrives
- [ ] Reply from that mailbox → the reply is received

If mail doesn't arrive, the Google MX record is the issue — check
`stallspace.co.za MX 1 SMTP.GOOGLE.COM.` exists in Netlify DNS.

---

## 4. Email — outbound via Resend (5 min)

- [ ] resend.com/domains → **stallspace.co.za** shows **Verified**
- [ ] Send a test (swap in your real key):
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_RESEND_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"from":"Stallspace <hello@stallspace.co.za>","to":"hendricksmujahid@gmail.com","subject":"Domain live test","html":"<p>Sending from the real domain.</p>"}'
```
- [ ] Email arrives, and resend.com/emails shows **delivered**

If the domain shows *unverified*, re-check the DKIM/SPF TXT records in Netlify DNS
against what Resend lists (the DKIM value must be complete, not truncated).

---

## 5. PayFast sandbox order on the new domain (10 min) **STOP if this fails**

The webhook URL changed with the domain. Re-prove it before touching live payments.

Vendor payment config should still be the sandbox values:
`10000100` / `46f0cd694581a` / passphrase `jt7NOE43FZPn`

1. Buy something as a customer on `https://stallspace.co.za`
2. Pay through PayFast sandbox
3. **Do not touch the vendor portal.** Wait ~30 seconds, refresh the order.

Check all of these:
- [ ] You reach the PayFast payment page (no 400 signature error)
- [ ] Order flips to **confirmed on its own**
- [ ] **Stock decremented** on the product
- [ ] Customer confirmation email arrived
- [ ] Vendor "new order" notification arrived
- [ ] Links inside those emails point to **stallspace.co.za** (not netlify.app)
- [ ] Netlify → Logs → Functions shows:
      `[notify] received` then `[notify:payfast] verified OK`

---

## 6. Quick regression sweep (10 min)

- [ ] Search finds a vendor by name, and a product by partial word
- [ ] Vendor portal loads; change an order status → customer gets the email
- [ ] Admin dashboard loads; **Payments Due** panel renders
- [ ] Admin → Content → upload a hero banner → appears on the homepage
- [ ] Pay-on-collection: enable it in vendor Store Settings, then place a
      collection order → "Place Order" (no gateway), success page explains
      payment on collection
- [ ] Check the site on your phone

---

## 7. Only when 1–6 all pass: go live on payments

Do **not** start this until the sandbox test above is green.

1. Remove the sandbox credentials:
   ```sql
   delete from vendor_payment_configs where provider = 'payfast';
   ```
2. Netlify env → **`PAYFAST_ENV=live`** → **redeploy**
3. Each real vendor enters **their own** PayFast Merchant ID, Merchant Key, and
   passphrase (or leaves passphrase blank if they haven't set one in PayFast —
   it must match their PayFast account exactly)
4. Do **one small real transaction** (R5–R10) and confirm:
   - [ ] Order auto-confirms
   - [ ] Money appears in that vendor's PayFast account
   - [ ] Emails fire

---

## Notes / gotchas

- **`jt7NOE43FZPn` is sandbox-only.** Never give it to a real vendor.
- **Passphrase must match PayFast exactly**, or the signature fails. Blank in
  both places also works.
- **Don't change `PAYMENT_ENCRYPTION_KEY`** — stored vendor credentials become
  unreadable and every vendor must re-enter them.
- Vendor payment credentials are encrypted at rest (`{"enc":"..."}` in
  `vendor_payment_configs.config_data`). If you ever see plaintext there, tell Claude.

## Still outstanding (not blocking launch)

- PWA (installable + offline shell)
- Next.js 15/16 upgrade (remaining advisories are DoS-class; fix needs a major upgrade)
- Automated subscription reminders (currently manual via admin → Send Payment Reminder)
- Docs + test pack refresh
