import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { readConfigData } from '@/lib/crypto/secrets'
import { createHmac, createHash } from 'crypto'
import { sendEmail } from '@/lib/email/resend'
import { orderConfirmationEmail } from '@/lib/email/templates'

/**
 * POST /api/orders/notify
 *
 * Unified ITN webhook for PayFast (?provider=payfast) and Ozow (?provider=ozow).
 * Yoco / Peach use redirect URLs handled on the success page.
 */

// Supabase can type a to-one join as an array; normalise it.
function bizName(vendors: unknown): string {
  if (Array.isArray(vendors)) return vendors[0]?.business_name ?? ''
  return (vendors as { business_name?: string } | null)?.business_name ?? ''
}

/**
 * PHP's urlencode(), which is what PayFast uses to build the signature string.
 * encodeURIComponent leaves !'()*~ unencoded; PHP encodes them. Without this,
 * any order containing those characters fails signature verification.
 */
function phpUrlencode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/[!'()*~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

// Verify the PayFast ITN signature using THIS vendor's passphrase (each vendor
// has their own PayFast account, so the passphrase is per-vendor, not global).
function verifyPayFast(rawBody: string, passphrase: string): boolean {
  const params = new URLSearchParams(rawBody)
  const signature = params.get('signature') ?? ''
  params.delete('signature')
  const paramString =
    [...params.entries()]
      .map(([k, v]) => `${k}=${phpUrlencode(v.trim())}`)
      .join('&') +
    (passphrase ? `&passphrase=${phpUrlencode(passphrase.trim())}` : '')
  const hash = createHash('md5').update(paramString).digest('hex')
  if (hash !== signature) {
    console.error('[notify:payfast] signature mismatch', {
      expected: hash,
      received: signature,
      usedPassphrase: Boolean(passphrase),
    })
    return false
  }
  return true
}

function verifyOzow(params: URLSearchParams, privateKey: string): boolean {
  const fields = [
    'SiteCode','TransactionId','TransactionReference','Amount',
    'Status','Optional1','Optional2','Optional3','Optional4','Optional5',
    'CurrencyCode','IsTest',
  ]
  const concat = fields.map(f => params.get(f) ?? '').join('') + privateKey
  const hash = createHmac('sha512', privateKey).update(concat.toLowerCase()).digest('hex')
  return hash.toLowerCase() === (params.get('Hash') ?? '').toLowerCase()
}

export async function POST(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider') ?? 'payfast'
  const rawBody = await request.text()
  const params = new URLSearchParams(rawBody)

  // Always log arrival so we can confirm the gateway is reaching us at all.
  console.log('[notify] received', {
    provider,
    payment_status: params.get('payment_status'),
    m_payment_id: params.get('m_payment_id'),
    amount_gross: params.get('amount_gross'),
  })

  try {
    // Webhooks have no user session — use the service role (with signature checks below).
    const supabase = createServiceClient()

    if (provider === 'payfast') {
      const orderId = params.get('m_payment_id')
      if (!orderId) return NextResponse.json({ error: 'Missing order id' }, { status: 400 })

      // Load the order and the paying vendor's PayFast passphrase to verify the signature.
      const { data: pending } = await supabase
        .from('orders')
        .select('id, vendor_id, total, status')
        .eq('id', orderId)
        .single()
      if (!pending) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

      const { data: cfg } = await supabase
        .from('vendor_payment_configs')
        .select('config_data')
        .eq('vendor_id', pending.vendor_id)
        .eq('provider', 'payfast')
        .single()
      const passphrase = cfg ? (readConfigData(cfg.config_data).passphrase ?? '') : ''

      if (!verifyPayFast(rawBody, passphrase)) {
        return NextResponse.json({ error: 'Invalid PayFast signature' }, { status: 400 })
      }

      // Guard against amount tampering — the paid amount must match the order total.
      const amountGross = Number(params.get('amount_gross') ?? '0')
      if (Math.abs(amountGross - Number(pending.total)) > 0.01) {
        console.error('[notify:payfast] amount mismatch', { amountGross, orderTotal: pending.total })
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
      }
      console.log('[notify:payfast] verified OK, status =', params.get('payment_status'))

      if (params.get('payment_status') === 'COMPLETE') {
        const { data: order } = await supabase
          .from('orders')
          .update({ status: 'confirmed', payment_reference: params.get('pf_payment_id') })
          .eq('id', orderId)
          .eq('status', 'pending')
          .select('*, vendors(business_name)')
          .single()

        if (order) {
          const { subject, html } = orderConfirmationEmail({
            customerName: order.customer_name,
            orderNumber: order.order_number,
            businessName: bizName(order.vendors),
            total: `R${Number(order.total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
            items: order.items ?? [],
            ordersUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account/orders`,
          })
          await sendEmail({ to: order.customer_email, subject, html })
        }
      }
    }

    if (provider === 'ozow') {
      const reference = params.get('TransactionReference')
      const { data: order } = await supabase
        .from('orders')
        .select('id, vendor_id, customer_email, customer_name, order_number, total, items, vendors(business_name)')
        .eq('order_number', reference)
        .single()

      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

      const { data: config } = await supabase
        .from('vendor_payment_configs')
        .select('config_data')
        .eq('vendor_id', order.vendor_id)
        .eq('provider', 'ozow')
        .single()

      const privateKey: string = config?.config_data?.private_key ?? ''
      if (!verifyOzow(params, privateKey)) {
        return NextResponse.json({ error: 'Invalid Ozow hash' }, { status: 400 })
      }

      if (params.get('Status') === 'Complete') {
        const { data: updated } = await supabase
          .from('orders')
          .update({ status: 'confirmed', payment_reference: params.get('TransactionId') })
          .eq('id', order.id)
          .eq('status', 'pending')
          .select('id')
          .single()

        if (!updated) return NextResponse.json({ ok: true }) // already processed

        const { subject, html } = orderConfirmationEmail({
          customerName: order.customer_name,
          orderNumber: order.order_number,
          businessName: bizName(order.vendors),
          total: `R${Number(order.total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
          items: order.items ?? [],
          ordersUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account/orders`,
        })
        await sendEmail({ to: order.customer_email, subject, html })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('[notify]', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
