import { sendEmail } from '@/lib/email/resend'
import { orderConfirmationEmail, newOrderVendorEmail } from '@/lib/email/templates'

/**
 * One place where an order becomes paid.
 *
 * Called by the PayFast/Ozow webhooks and by the Yoco/Peach return-URL
 * verification. Everything here is idempotent: the status update is a
 * compare-and-set on `status = 'pending'`, so a retried webhook (PayFast
 * retries) or a double page-load settles the order exactly once and sends
 * exactly one pair of emails.
 *
 * The vendor is notified HERE rather than when the order row is created.
 * Notifying at creation meant vendors were emailed for every abandoned
 * checkout and never told when money actually arrived.
 */

function rands(v: unknown): string {
  return `R${Number(v ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://stallspace.co.za'
}

interface SettleArgs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
  orderId: string
  /** Gateway's own reference, stored for reconciliation. */
  paymentReference?: string | null
}

/**
 * Move a pending order to confirmed and notify both sides.
 * Returns true if THIS call settled it, false if it was already settled.
 */
export async function settlePaidOrder({ supabase, orderId, paymentReference }: SettleArgs): Promise<boolean> {
  const update: Record<string, unknown> = {
    status: 'confirmed',
    paid_at: new Date().toISOString(),
  }
  if (paymentReference) update.payment_reference = paymentReference

  // Compare-and-set: only one caller can win this.
  const { data: order } = await supabase
    .from('orders')
    .update(update)
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('*, vendors(id, user_id, business_name)')
    .single()

  if (!order) return false // already settled, or no longer pending

  const vendor = Array.isArray(order.vendors) ? order.vendors[0] : order.vendors
  const businessName: string = vendor?.business_name ?? ''

  try {
    const { subject, html } = orderConfirmationEmail({
      customerName: order.customer_name,
      orderNumber: order.order_number,
      businessName,
      total: rands(order.total),
      items: order.items ?? [],
      ordersUrl: `${appUrl()}/account/orders`,
    })
    await sendEmail({ to: order.customer_email, subject, html })
  } catch (e) {
    console.error('[settle] customer email failed', e)
  }

  try {
    await notifyVendorOfOrder(supabase, order, vendor, businessName, true)
  } catch (e) {
    console.error('[settle] vendor notification failed', e)
  }

  return true
}

/**
 * Email + in-app notification to the vendor that an order needs their action.
 * Exported so the pay-on-collection path can call it at order creation, where
 * the vendor must act now even though no money has moved yet.
 */
export async function notifyVendorOfOrder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vendor: any,
  businessName: string,
  paid: boolean
): Promise<void> {
  if (!vendor?.user_id) return

  await supabase.from('notifications').insert({
    user_id: vendor.user_id,
    type: 'order',
    title: paid
      ? `Paid order from ${order.customer_name}`
      : `New collection order from ${order.customer_name}`,
    message: `Order ${order.order_number} · ${rands(order.total)}`,
    action_url: '/vendor/orders',
  })

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', vendor.user_id)
    .single()

  if (!profile?.email) return

  const tpl = newOrderVendorEmail({
    vendorName: profile.full_name ?? businessName ?? 'there',
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone ?? null,
    total: rands(order.total),
    items: (order.items ?? []) as { product_name: string; quantity: number; total_price: number }[],
    fulfilment: order.fulfilment ?? null,
    paymentMethod: order.payment_provider === 'cash_on_collection' ? 'Pay on collection' : 'PayFast',
    ordersUrl: `${appUrl()}/vendor/orders`,
  })
  await sendEmail({ to: profile.email, ...tpl })
}

/**
 * Record a payment that did not succeed. The order leaves `pending` so the
 * vendor's list stops showing it as a sale that might still land.
 */
export async function recordFailedPayment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orderId: string,
  reason: string
): Promise<void> {
  await supabase
    .from('orders')
    .update({ status: 'cancelled', payment_failure: reason })
    .eq('id', orderId)
    .eq('status', 'pending')
}
