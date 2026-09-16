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

export default async (req: Request) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stallspace.co.za'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const secret = process.env.RECONCILE_SECRET

  if (!supabaseUrl || !serviceKey || !secret) {
    console.error('[reconcile] missing env — need SUPABASE creds and RECONCILE_SECRET')
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
  if (orders.length === 0) return new Response('nothing pending')

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

  const summary = `checked ${orders.length}, settled ${settled}`
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
