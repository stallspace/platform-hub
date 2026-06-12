import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { orderStatusUpdateEmail } from '@/lib/email/templates'

/**
 * PATCH /api/orders/status
 * Vendor updates order status. Notifies customer by email.
 * Body: { order_id, status, message? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { order_id, status, message } = await request.json()
    if (!order_id || !status) return NextResponse.json({ error: 'Missing order_id or status' }, { status: 400 })

    // Verify this vendor owns the order
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single()

    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 403 })

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', order_id)
      .eq('vendor_id', vendor.id)
      .select('id, order_number, customer_email, customer_name, total, items')
      .single()

    if (error || !order) return NextResponse.json({ error: error?.message ?? 'Order not found or access denied' }, { status: 404 })

    // Notify customer
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://Stallspace.co.za'
    const { subject, html } = orderStatusUpdateEmail({
      customerName: order.customer_name,
      orderNumber: order.order_number,
      businessName: vendor.business_name,
      newStatus: status,
      statusMessage: message,
      ordersUrl: `${appUrl}/account/orders`,
    })
    await sendEmail({ to: order.customer_email, subject, html })

    return NextResponse.json({ data: order })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to update order' }, { status: 500 })
  }
}
