import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { readConfigData } from '@/lib/crypto/secrets'
import { buildPayFastUrl } from '@/lib/payments/payfast'
import { buildOzowUrl } from '@/lib/payments/ozow'
import { createYocoCheckout } from '@/lib/payments/yoco'
import { createPeachCheckout } from '@/lib/payments/peach'

/**
 * POST /api/checkout/initiate
 * Body: { orderId }
 *
 * Looks up the order and the vendor's ACTIVE payment config server-side,
 * decrypts the credentials, builds the gateway redirect, and returns it.
 * Payment secrets never leave the server.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

    const supabase = createServiceClient()

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, order_number, vendor_id, customer_email, customer_name, total, status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order is not awaiting payment' }, { status: 409 })
    }

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, business_name, slug')
      .eq('id', order.vendor_id)
      .single()

    const { data: cfg } = await supabase
      .from('vendor_payment_configs')
      .select('provider, config_data, is_active')
      .eq('vendor_id', order.vendor_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!cfg) return NextResponse.json({ error: 'Vendor has not configured a payment method' }, { status: 400 })

    const config = readConfigData(cfg.config_data)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stallspace.co.za'
    const provider = cfg.provider as string

    // Stallspace only supports PayFast for customer payments.
    if (provider !== 'payfast') {
      return NextResponse.json({ error: 'This vendor has not configured PayFast.' }, { status: 400 })
    }

    // Keep these URLs as simple as possible — extra query parameters get
    // double-encoded inside the gateway URL and are a common cause of
    // signature mismatches.
    const returnUrl = `${appUrl}/marketplace/checkout/success?order=${order.id}`
    const cancelUrl = `${appUrl}/marketplace/checkout/cancel?order=${order.id}`
    const notifyBase = `${appUrl}/api/orders/notify`
    const amount = Number(order.total)

    if (provider === 'payfast') {
      if (!config.merchant_id || !config.merchant_key) {
        return NextResponse.json({ error: 'PayFast is not fully configured' }, { status: 400 })
      }
      const url = buildPayFastUrl({
        merchantId: config.merchant_id,
        merchantKey: config.merchant_key,
        passphrase: config.passphrase ?? '',
        amount,
        // Keep this ASCII-only: non-ASCII characters (e.g. em dashes) are a
        // common source of PayFast signature mismatches.
        itemName: `Order ${order.order_number}`.replace(/[^\x20-\x7E]/g, ''),
        orderId: order.id,
        returnUrl,
        cancelUrl,
        // No query string — some gateways mishandle it, and the route defaults to payfast.
        notifyUrl: notifyBase,
        email: order.customer_email,
        name: order.customer_name,
      })
      return NextResponse.json({ redirectUrl: url })
    }

    if (provider === 'ozow') {
      if (!config.site_code || !config.private_key) {
        return NextResponse.json({ error: 'Ozow is not fully configured' }, { status: 400 })
      }
      const url = buildOzowUrl({
        siteCode: config.site_code,
        privateKey: config.private_key,
        amount,
        transactionReference: order.order_number,
        optional1: order.id,
        successUrl: returnUrl,
        cancelUrl,
        errorUrl: cancelUrl,
        notifyUrl: `${notifyBase}?provider=ozow`,
        isTest: process.env.OZOW_ENV !== 'live',
      })
      return NextResponse.json({ redirectUrl: url })
    }

    if (provider === 'yoco') {
      if (!config.secret_key) return NextResponse.json({ error: 'Yoco is not fully configured' }, { status: 400 })
      const { redirectUrl, checkoutId } = await createYocoCheckout({
        secretKey: config.secret_key,
        amount,
        orderId: order.id,
        orderNumber: order.order_number,
        successUrl: returnUrl,
        cancelUrl,
      })
      // Store the gateway reference so we can verify the payment server-side later.
      await supabase.from('orders').update({ payment_reference: checkoutId }).eq('id', order.id)
      return NextResponse.json({ redirectUrl })
    }

    if (provider === 'peach') {
      if (!config.entity_id || !config.access_token) {
        return NextResponse.json({ error: 'Peach Payments is not fully configured' }, { status: 400 })
      }
      const { redirectUrl, checkoutId } = await createPeachCheckout({
        entityId: config.entity_id,
        accessToken: config.access_token,
        amount,
        orderId: order.id,
        orderNumber: order.order_number,
        shopperResultUrl: returnUrl,
      })
      await supabase.from('orders').update({ payment_reference: checkoutId }).eq('id', order.id)
      return NextResponse.json({ redirectUrl })
    }

    return NextResponse.json({ error: `Unsupported payment provider: ${provider}` }, { status: 400 })
  } catch (err: unknown) {
    console.error('[checkout/initiate]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to initiate checkout' },
      { status: 500 }
    )
  }
}
