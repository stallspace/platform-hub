/**
 * Catches orders whose payment webhook never arrived.
 *
 * The happy path is: customer pays, the gateway posts a signed ITN to
 * /api/orders/notify, the order is settled and both sides are emailed. That
 * covers almost everything — but not a webhook that never lands. The endpoint
 * can be mid-deploy, the gateway can exhaust its retries, and Yoco/Peach have
 * no webhook wired at all, so they depend on the customer's browser returning
 * to the success page. On phones it often does not: 3DS bounces the customer
 * into their banking app and they come back to a killed tab.
 *
 * When that happens the customer has paid, the order sits at 'pending', and
 * the vendor never learns they made a sale. This sweep asks the gateway
 * directly about anything that has been pending too long.
 *
 * Idempotent: /api/checkout/verify only settles an order that is still
 * pending, so a duplicate run is harmless.
 */

const GRACE_MINUTES = 3   // don't chase someone still typing their card details
const MAX_AGE_HOURS = 48  // past this the customer has long since given up
const BATCH = 40          // scheduled functions get 30s; stay well inside it
const STALE_HOURS = 1     // past this, a pending order needs a human to look

/**
 * Raise one alert per stuck order.
 *
 * For Yoco and Peach the sweep above can confirm a payment by asking the
 * gateway. For PayFast and Ozow it cannot — /api/checkout/verify only reads
 * our own database for those providers — so a dropped ITN leaves an order at
 * pending with nobody told. Until the PayFast transaction-history API is
 * wired in, the honest fallback is to stop being silent about it: surface the
 * order so a person can check the gateway dashboard and settle it by hand.
 *
 * Alerts once per order (stale_alert_at), so a stuck order doesn't email
 * every five minutes.
 */
async function alertOnStaleOrders(
  supabaseUrl: string,
  serviceKey: string,
  appUrl: string
): Promise<number> {
  const staleBefore = new Date(Date.now() - STALE_HOURS * 3_600_000).toISOString()
  const notTooOld = new Date(Date.now() - MAX_AGE_HOURS * 3_600_000).toISOString()

  const query =
    `${supabaseUrl}/rest/v1/orders` +
    `?select=id,order_number,total,customer_email,payment_provider,created_at` +
    `&status=eq.pending` +
    `&payment_provider=neq.cash_on_collection` +
    `&stale_alert_at=is.null` +
    `&created_at=lt.${staleBefore}` +
    `&created_at=gt.${notTooOld}` +
    `&order=created_at.asc&limit=20`

  const res = await fetch(query, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  })
  if (!res.ok) {
    console.error('[reconcile] stale lookup failed', res.status)
    return 0
  }

  const stale = (await res.json()) as {
    id: string
    order_number: string
    total: string
    customer_email: string
    payment_provider: string
    created_at: string
  }[]
  if (stale.length === 0) return 0

  for (const o of stale) {
    const age = Math.round((Date.now() - new Date(o.created_at).getTime()) / 60_000)
    console.error(
      `[reconcile] STUCK ORDER ${o.order_number} — pending ${age} minutes via ${o.payment_provider}. ` +
      `R${o.total} from ${o.customer_email}. Check the gateway dashboard: if it was paid, the ITN was ` +
      `lost and the order needs settling by hand.`
    )
  }

  // Email the owner. Resend over plain fetch — this is a Netlify function, not
  // the Next app, so there is no SDK here and no need for one.
  const resendKey = process.env.RESEND_API_KEY
  const alertTo = process.env.ALERT_EMAIL ?? 'hello@stallspace.co.za'
  if (resendKey) {
    const rows = stale
      .map(o => {
        const age = Math.round((Date.now() - new Date(o.created_at).getTime()) / 60_000)
        return `<tr><td style="padding:6px 12px 6px 0">${o.order_number}</td>` +
               `<td style="padding:6px 12px 6px 0">R${o.total}</td>` +
               `<td style="padding:6px 12px 6px 0">${o.payment_provider}</td>` +
               `<td style="padding:6px 0">${age} min</td></tr>`
      })
      .join('')

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL ?? 'noreply@stallspace.co.za',
          to: alertTo,
          subject: `${stale.length} order${stale.length === 1 ? '' : 's'} stuck awaiting payment`,
          html:
            `<div style="font-family:system-ui,sans-serif;max-width:600px">` +
            `<h2 style="color:#0D3B2E;font-size:18px">Orders stuck at pending</h2>` +
            `<p style="color:#374151;font-size:14px;line-height:1.6">` +
            `These have been awaiting payment for over ${STALE_HOURS} hour(s). Usually the customer ` +
            `simply abandoned checkout and nothing is wrong. But if the gateway shows the payment as ` +
            `successful, the notification to us was lost and the order needs confirming by hand — the ` +
            `customer has paid and the vendor has not been told.</p>` +
            `<table style="font-size:13px;color:#374151;border-collapse:collapse">` +
            `<tr style="text-align:left;color:#6B7280"><th style="padding:6px 12px 6px 0">Order</th>` +
            `<th style="padding:6px 12px 6px 0">Amount</th><th style="padding:6px 12px 6px 0">Via</th>` +
            `<th style="padding:6px 0">Waiting</th></tr>${rows}</table>` +
            `<p style="margin-top:20px"><a href="${appUrl}/admin/orders" ` +
            `style="background:#0D3B2E;color:#fff;padding:10px 18px;border-radius:6px;` +
            `text-decoration:none;font-size:14px">Open admin orders</a></p>` +
            `<p style="color:#9CA3AF;font-size:12px;margin-top:20px">You will only be told once per ` +
            `order. Sent by the payment reconciliation sweep.</p></div>`,
        }),
      })
    } catch (e) {
      console.error('[reconcile] alert email failed', e)
    }
  } else {
    console.error('[reconcile] RESEND_API_KEY not set — stuck orders logged but nobody emailed')
  }

  // Stamp them so the next run stays quiet about these.
  const ids = stale.map(o => o.id).join(',')
  await fetch(`${supabaseUrl}/rest/v1/orders?id=in.(${ids})`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ stale_alert_at: new Date().toISOString() }),
  }).catch(e => console.error('[reconcile] could not stamp stale_alert_at', e))

  return stale.length
}

export default async (req: Request) => {
  // Log on every run, including the quiet ones. Without this a healthy sweep
  // that finds nothing writes no output at all, so an empty log pane is
  // indistinguishable from the function never firing — which is exactly the
  // failure this job exists to prevent someone missing.
  const startedAt = new Date().toISOString()
  console.log(`[reconcile] run started ${startedAt}`)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stallspace.co.za'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const secret = process.env.RECONCILE_SECRET

  if (!supabaseUrl || !serviceKey || !secret) {
    console.error('[reconcile] MISCONFIGURED — this sweep is not protecting anything.', {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasServiceKey: Boolean(serviceKey),
      hasReconcileSecret: Boolean(secret),
    })
    return new Response('misconfigured', { status: 500 })
  }

  const now = Date.now()
  const before = new Date(now - GRACE_MINUTES * 60_000).toISOString()
  const after = new Date(now - MAX_AGE_HOURS * 3_600_000).toISOString()

  // Only orders that actually reached a gateway are worth asking about.
  const query =
    `${supabaseUrl}/rest/v1/orders` +
    `?select=id,order_number,payment_provider,created_at` +
    `&status=eq.pending` +
    `&payment_provider=neq.cash_on_collection` +
    `&created_at=lt.${before}` +
    `&created_at=gt.${after}` +
    `&order=created_at.asc&limit=${BATCH}`

  const res = await fetch(query, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  })

  if (!res.ok) {
    console.error('[reconcile] order lookup failed', res.status, await res.text())
    return new Response('lookup failed', { status: 502 })
  }

  const orders = (await res.json()) as { id: string; order_number: string }[]
  if (orders.length === 0) {
    console.log('[reconcile] nothing pending — no orders awaiting a late webhook')
    const alerted = await alertOnStaleOrders(supabaseUrl, serviceKey, appUrl)
    return new Response(`nothing pending, alerted ${alerted}`)
  }

  console.log(`[reconcile] ${orders.length} order(s) pending longer than ${GRACE_MINUTES}m — checking each with the gateway`)

  let settled = 0
  for (const order of orders) {
    try {
      // Reuse the normal verification path so settlement, stock and both
      // emails behave exactly as they would on the customer's return.
      const r = await fetch(`${appUrl}/api/checkout/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-reconcile-secret': secret },
        body: JSON.stringify({ orderId: order.id }),
      })
      const d = await r.json().catch(() => ({}))
      if (d?.status === 'confirmed') {
        settled++
        console.log(`[reconcile] settled ${order.order_number} — its webhook never arrived`)
      }
    } catch (e) {
      console.error(`[reconcile] ${order.order_number} failed`, e)
    }
  }

  const alerted = await alertOnStaleOrders(supabaseUrl, serviceKey, appUrl)

  const summary = `checked ${orders.length}, settled ${settled}, alerted ${alerted}`
  console.log('[reconcile]', summary)
  return new Response(summary)
}

/**
 * Netlify reads `schedule` off this export at build time. Deliberately an
 * untyped literal rather than `import type { Config } from '@netlify/functions'`
 * — that package is not a dependency of this project, and adding an import for
 * a type alone is a build-time failure waiting to happen for no benefit.
 */
export const config = {
  schedule: '*/5 * * * *',
}
