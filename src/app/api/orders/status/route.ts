import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { orderStatusUpdateEmail } from '@/lib/email/templates'
import { createNotification } from '@/lib/notifications/create'

const ALLOWED_STATUSES = new Set([
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded',
])

/**
 * Which statuses a VENDOR may move an order to, from each current status.
 *
 * Two rules this encodes:
 *  - 'confirmed' means paid. For gateway orders only the signed webhook may
 *    set it; a vendor pressing a button must not be able to mark an unpaid
 *    order as paid (it also fires the stock trigger and emails the customer).
 *  - Statuses only move forward. The old route accepted any value from any
 *    state, so completed -> pending -> confirmed walked stock down repeatedly.
 */
const VENDOR_TRANSITIONS: Record<string, string[]> = {
  pending:    ['cancelled'],
  confirmed:  ['processing', 'shipped', 'delivered', 'completed', 'cancelled'],
  processing: ['shipped', 'delivered', 'completed', 'cancelled'],
  shipped:    ['delivered', 'completed'],
  delivered:  ['completed'],
  completed:  [],
  cancelled:  [],
  refunded:   [],
}

/**
 * Pay-on-collection has no gateway, so the vendor IS the payment confirmation.
 * They may move their own collection order from pending to confirmed once the
 * customer has paid in person.
 */
function allowedNext(current: string, provider: string | null): string[] {
  const base = VENDOR_TRANSITIONS[current] ?? []
  if (current === 'pending' && provider === 'cash_on_collection') {
    return [...base, 'confirmed']
  }
  return base
}

/**
 * PATCH /api/orders/status
 * Vendor updates an order's status. Notifies the customer by email (and in-app
 * if they have an account). Authorises via the vendor's session, then writes
 * with the service role so it isn't blocked by RLS.
 * Body: { order_id, status, message? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const userClient = await createClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { order_id, status, message } = await request.json()
    if (!order_id || !status) return NextResponse.json({ error: 'Missing order_id or status' }, { status: 400 })
    if (!ALLOWED_STATUSES.has(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

    // Verify this vendor owns the order.
    const { data: vendor } = await userClient
      .from('vendors')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single()
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 403 })

    const admin = createServiceClient()

    // Read the current state before writing — the transition has to be legal.
    const { data: current } = await admin
      .from('orders')
      .select('id, status, payment_provider')
      .eq('id', order_id)
      .eq('vendor_id', vendor.id)
      .single()

    if (!current) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
    }

    if (current.status === status) {
      return NextResponse.json({ error: `This order is already ${status}.` }, { status: 409 })
    }

    const permitted = allowedNext(current.status as string, current.payment_provider as string | null)
    if (!permitted.includes(status)) {
      return NextResponse.json(
        {
          error:
            current.status === 'pending' && status === 'confirmed'
              ? 'This order has not been paid yet. It will confirm itself when payment comes through.'
              : `An order that is ${current.status} cannot be marked ${status}.`,
        },
        { status: 409 }
      )
    }

    // A collection order confirmed by the vendor IS the record of cash received.
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (status === 'confirmed' && current.payment_provider === 'cash_on_collection') {
      patch.paid_at = new Date().toISOString()
    }

    const { data: order, error } = await admin
      .from('orders')
      .update(patch)
      .eq('id', order_id)
      .eq('vendor_id', vendor.id)
      .eq('status', current.status)
      .select('id, order_number, customer_email, customer_name, customer_id, total, items')
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order was changed by someone else. Refresh and try again.' }, { status: 409 })
    }

    // Notify the customer by email.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stallspace.co.za'
    const { subject, html } = orderStatusUpdateEmail({
      customerName: order.customer_name,
      orderNumber: order.order_number,
      businessName: vendor.business_name,
      newStatus: status,
      statusMessage: message,
      ordersUrl: `${appUrl}/account/orders`,
    })
    await sendEmail({ to: order.customer_email, subject, html }).catch(() => {})

    // In-app notification for registered customers (guests only get the email).
    if (order.customer_id) {
      await createNotification({
        userId: order.customer_id,
        type: 'order',
        title: `Order ${order.order_number} — ${status}`,
        message: `Your order from ${vendor.business_name} is now "${status}".`,
        actionUrl: '/account/orders',
      }).catch(() => {})
    }

    return NextResponse.json({ data: order })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to update order' }, { status: 500 })
  }
}
