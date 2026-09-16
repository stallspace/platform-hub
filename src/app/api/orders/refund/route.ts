import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { readConfigData } from '@/lib/crypto/secrets'
import { createPayFastRefund } from '@/lib/payments/payfast-api'
import { limitRequest, tooManyRequests } from '@/lib/utils/rate-limit-db'
import { sendEmail } from '@/lib/email/resend'
import { refundIssuedEmail } from '@/lib/email/templates'

/**
 * POST /api/orders/refund
 * Body: { order_id, amount?, reason? }
 *
 * A vendor refunds a customer. The refund is made on the VENDOR's own PayFast
 * account using their own stored credentials, so the money goes from them back
 * to the customer and Stallspace is never in the path — the same position as
 * when the payment was taken.
 *
 * Omit `amount` for a full refund. A smaller amount is a partial refund.
 *
 * PayFast charges the vendor R2.00 excluding VAT per refund, regardless of
 * amount. That is on them, and the UI says so before they confirm.
 */
export async function POST(request: NextRequest) {
  try {
    const userClient = await createClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { order_id, amount, reason } = await request.json()
    if (!order_id) return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })

    if (!(await limitRequest(request.headers, { bucket: 'refund', limit: 20, windowSeconds: 3600, subject: user.id }))) {
      return tooManyRequests()
    }

    // The caller must be the vendor who sold this order.
    const { data: vendor } = await userClient
      .from('vendors')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single()
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 403 })

    const admin = createServiceClient()
    const { data: order } = await admin
      .from('orders')
      .select('id, order_number, total, status, paid_at, payment_provider, payment_reference, refund_status, refund_amount, customer_email, customer_name')
      .eq('id', order_id)
      .eq('vendor_id', vendor.id)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (!order.paid_at) {
      return NextResponse.json(
        { error: 'This order was never paid, so there is nothing to refund. Cancel it instead.' },
        { status: 409 }
      )
    }
    if (order.refund_status === 'refunded') {
      return NextResponse.json({ error: 'This order has already been refunded.' }, { status: 409 })
    }
    if (order.refund_status === 'processing') {
      return NextResponse.json({ error: 'A refund is already being processed for this order.' }, { status: 409 })
    }

    const alreadyRefunded = Number(order.refund_amount ?? 0)
    const remaining = Number(order.total) - alreadyRefunded
    const refundAmount = amount != null ? Number(amount) : remaining

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return NextResponse.json({ error: 'Refund amount must be greater than zero.' }, { status: 400 })
    }
    if (refundAmount > remaining + 0.001) {
      return NextResponse.json(
        { error: `You can refund at most R${remaining.toFixed(2)} on this order.` },
        { status: 400 }
      )
    }

    // Cash on collection never went through a gateway — the vendor hands the
    // money back in person and just records it here.
    if (order.payment_provider === 'cash_on_collection') {
      await admin
        .from('orders')
        .update({
          refund_status: 'manual',
          refund_amount: alreadyRefunded + refundAmount,
          refunded_at: new Date().toISOString(),
          status: 'refunded',
        })
        .eq('id', order.id)
      await notifyCustomer(order, vendor.business_name, refundAmount, refundAmount < Number(order.total))
      return NextResponse.json({ ok: true, manual: true })
    }

    if (order.payment_provider !== 'payfast') {
      return NextResponse.json(
        { error: 'Refunds through Stallspace are only available for PayFast orders. Refund from your gateway dashboard and mark it here.' },
        { status: 400 }
      )
    }
    if (!order.payment_reference) {
      return NextResponse.json(
        { error: 'This order has no PayFast payment reference, so we cannot refund it automatically.' },
        { status: 409 }
      )
    }

    const { data: cfg } = await admin
      .from('vendor_payment_configs')
      .select('config_data')
      .eq('vendor_id', vendor.id)
      .eq('provider', 'payfast')
      .single()

    if (!cfg) return NextResponse.json({ error: 'PayFast is not configured for this store.' }, { status: 400 })
    const config = readConfigData(cfg.config_data)
    if (!config.merchant_id) {
      return NextResponse.json({ error: 'PayFast is not fully configured.' }, { status: 400 })
    }

    // Claim it before calling out, so a double-click cannot refund twice.
    const { data: claimed } = await admin
      .from('orders')
      .update({ refund_status: 'processing' })
      .eq('id', order.id)
      .not('refund_status', 'in', '("processing","refunded")')
      .select('id')
      .maybeSingle()
    if (!claimed) {
      return NextResponse.json({ error: 'A refund is already being processed for this order.' }, { status: 409 })
    }

    const result = await createPayFastRefund({
      creds: { merchantId: config.merchant_id, passphrase: config.passphrase ?? '' },
      pfPaymentId: order.payment_reference,
      amount: refundAmount,
      reason: reason ?? `Refund for order ${order.order_number}`,
      sandbox: process.env.PAYFAST_ENV !== 'live',
    })

    if (!result.ok) {
      // Leave the order as owing a refund rather than pretending it is done.
      await admin
        .from('orders')
        .update({ refund_status: 'failed', refund_error: result.message.slice(0, 500) })
        .eq('id', order.id)
      return NextResponse.json({ error: result.message }, { status: 502 })
    }

    const totalRefunded = alreadyRefunded + refundAmount
    const isPartial = totalRefunded < Number(order.total) - 0.001

    await admin
      .from('orders')
      .update({
        refund_status: 'refunded',
        refund_amount: totalRefunded,
        refunded_at: new Date().toISOString(),
        refund_reference: result.reference,
        refund_error: null,
        // A fully refunded order is closed. A partial one carries on.
        ...(isPartial ? {} : { status: 'refunded' }),
      })
      .eq('id', order.id)

    await notifyCustomer(order, vendor.business_name, refundAmount, isPartial)

    return NextResponse.json({ ok: true, partial: isPartial, reference: result.reference })
  } catch (err: unknown) {
    console.error('[orders/refund]', err)
    return NextResponse.json({ error: 'Could not process the refund.' }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function notifyCustomer(order: any, businessName: string, amount: number, partial: boolean) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stallspace.co.za'
    const { subject, html } = refundIssuedEmail({
      customerName: order.customer_name,
      orderNumber: order.order_number,
      businessName,
      amount: `R${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
      partial,
      ordersUrl: `${appUrl}/account/orders`,
    })
    await sendEmail({ to: order.customer_email, subject, html })
  } catch (e) {
    console.error('[orders/refund] customer email failed', e)
  }
}
