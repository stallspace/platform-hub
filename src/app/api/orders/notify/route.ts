import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { readConfigData } from '@/lib/crypto/secrets'
import { phpUrlencode } from '@/lib/payments/payfast'
import { createHmac, createHash } from 'crypto'
import { settlePaidOrder, recordFailedPayment } from '@/lib/orders/settle'

/**
 * POST /api/orders/notify
 *
 * Unified ITN webhook for PayFast (?provider=payfast) and Ozow (?provider=ozow).
 * Yoco / Peach use redirect URLs handled on the success page.
 *
 * PayFast sends an ITN for every outcome, not just success: COMPLETE, FAILED,
 * PENDING and CANCELLED. Acting only on COMPLETE left declined payments stuck
 * at 'pending' forever with nobody told.
 */

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

      const status = params.get('payment_status')

      if (status === 'COMPLETE') {
        await settlePaidOrder({
          supabase,
          orderId,
          paymentReference: params.get('pf_payment_id'),
        })
      } else if (status === 'FAILED' || status === 'CANCELLED') {
        // Leave 'PENDING' alone — PayFast will send a further ITN for it.
        await recordFailedPayment(supabase, orderId, `payfast:${status.toLowerCase()}`)
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

      const ozowStatus = params.get('Status')

      if (ozowStatus === 'Complete') {
        await settlePaidOrder({
          supabase,
          orderId: order.id,
          paymentReference: params.get('TransactionId'),
        })
      } else if (ozowStatus === 'Cancelled' || ozowStatus === 'Error' || ozowStatus === 'Abandoned') {
        await recordFailedPayment(supabase, order.id, `ozow:${String(ozowStatus).toLowerCase()}`)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('[notify]', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
