import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { readConfigData } from '@/lib/crypto/secrets'
import { verifyYocoCheckout } from '@/lib/payments/yoco'
import { verifyPeachPayment } from '@/lib/payments/peach'
import { sendEmail } from '@/lib/email/resend'
import { orderConfirmationEmail } from '@/lib/email/templates'

/**
 * POST /api/checkout/verify
 * Body: { orderId }
 *
 * Server-side confirmation of a payment after the customer is redirected back.
 * For Yoco/Peach we call the gateway to confirm the money actually moved before
 * marking the order confirmed. PayFast/Ozow are confirmed by their webhooks
 * (/api/orders/notify); here we just report the current status without trusting
 * the browser redirect.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

    const supabase = createServiceClient()

    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number, vendor_id, customer_email, customer_name, total, status, payment_provider, payment_reference, items')
      .eq('id', orderId)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Already settled — nothing to do.
    if (order.status !== 'pending') {
      return NextResponse.json({ status: order.status, verified: true })
    }

    const provider = order.payment_provider as string

    // Redirect-verified providers: confirm with the gateway.
    if (provider === 'yoco' || provider === 'peach') {
      const { data: cfg } = await supabase
        .from('vendor_payment_configs')
        .select('config_data')
        .eq('vendor_id', order.vendor_id)
        .eq('provider', provider)
        .single()

      if (!cfg || !order.payment_reference) {
        return NextResponse.json({ status: 'pending', verified: false, error: 'Missing gateway reference' })
      }

      const config = readConfigData(cfg.config_data)
      let paid = false
      if (provider === 'yoco') {
        const r = await verifyYocoCheckout(config.secret_key, order.payment_reference)
        paid = r.paid
      } else {
        const r = await verifyPeachPayment(config.entity_id, config.access_token, order.payment_reference)
        paid = r.paid
      }

      if (!paid) return NextResponse.json({ status: 'pending', verified: false })

      await markConfirmed(supabase, order)
      return NextResponse.json({ status: 'confirmed', verified: true })
    }

    // PayFast / Ozow: rely on the signed webhook. Just report current status.
    return NextResponse.json({ status: order.status, verified: false })
  } catch (err: unknown) {
    console.error('[checkout/verify]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500 }
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function markConfirmed(supabase: any, order: any) {
  // Only transition from pending -> confirmed once (guards against double emails).
  const { data: updated } = await supabase
    .from('orders')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', order.id)
    .eq('status', 'pending')
    .select('id')
    .single()

  if (!updated) return // someone else already confirmed it

  const { data: vendor } = await supabase
    .from('vendors')
    .select('business_name')
    .eq('id', order.vendor_id)
    .single()

  const { subject, html } = orderConfirmationEmail({
    customerName: order.customer_name,
    orderNumber: order.order_number,
    businessName: vendor?.business_name ?? '',
    total: `R${Number(order.total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
    items: order.items ?? [],
    ordersUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/account/orders`,
  })
  await sendEmail({ to: order.customer_email, subject, html }).catch(() => {})
}
