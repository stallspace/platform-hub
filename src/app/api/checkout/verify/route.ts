import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { readConfigData } from '@/lib/crypto/secrets'
import { verifyYocoCheckout } from '@/lib/payments/yoco'
import { verifyPeachPayment } from '@/lib/payments/peach'
import { verifyCheckoutToken } from '@/lib/payments/checkout-token'
import { settlePaidOrder } from '@/lib/orders/settle'

/**
 * POST /api/checkout/verify
 * Body: { orderId, token }
 *
 * Server-side confirmation of a payment after the customer is redirected back.
 * For Yoco/Peach we call the gateway to confirm the money actually moved before
 * marking the order confirmed. PayFast/Ozow are confirmed by their webhooks
 * (/api/orders/notify); here we just report the current status without trusting
 * the browser redirect.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, token } = await request.json()
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

    // Runs on the service client and can trigger a confirmation email, so it
    // needs the same proof-of-ownership as /initiate. The order id alone is
    // not a secret.
    if (!verifyCheckoutToken(orderId, token)) {
      return NextResponse.json({ error: 'This checkout link is not valid.' }, { status: 403 })
    }

    const supabase = createServiceClient()

    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number, vendor_id, customer_email, customer_name, total, status, payment_provider, payment_reference, items, vendors(business_name, slug)')
      .eq('id', orderId)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Display fields for the confirmation page. Guests have no session, so the
    // page cannot read the order through RLS — it reads it from here instead.
    const vendorRow = Array.isArray(order.vendors) ? order.vendors[0] : order.vendors
    const summary = {
      order_number: order.order_number,
      total: order.total,
      vendor_id: order.vendor_id,
      vendor_name: vendorRow?.business_name ?? '',
      vendor_slug: vendorRow?.slug ?? '',
    }

    // Already settled — nothing to do.
    if (order.status !== 'pending') {
      return NextResponse.json({ status: order.status, verified: true, order: summary })
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
        return NextResponse.json({ status: 'pending', verified: false, order: summary })
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

      if (!paid) return NextResponse.json({ status: 'pending', verified: false, order: summary })

      await settlePaidOrder({ supabase, orderId: order.id })
      return NextResponse.json({ status: 'confirmed', verified: true, order: summary })
    }

    // PayFast / Ozow: rely on the signed webhook. Just report current status.
    return NextResponse.json({ status: order.status, verified: false, order: summary })
  } catch (err: unknown) {
    console.error('[checkout/verify]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500 }
    )
  }
}
