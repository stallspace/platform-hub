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
    const { data: order, error } = await admin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', order_id)
      .eq('vendor_id', vendor.id)
      .select('id, order_number, customer_email, customer_name, customer_id, total, items')
      .single()

    if (error || !order) {
      return NextResponse.json({ error: error?.message ?? 'Order not found or access denied' }, { status: 404 })
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
