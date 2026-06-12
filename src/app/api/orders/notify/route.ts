import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHmac, createHash } from 'crypto'
import { sendEmail } from '@/lib/email/resend'
import { orderConfirmationEmail } from '@/lib/email/templates'

/**
 * POST /api/orders/notify
 *
 * Unified ITN webhook for PayFast (?provider=payfast) and Ozow (?provider=ozow).
 * Yoco / Peach use redirect URLs handled on the success page.
 */

async function verifyPayFast(rawBody: string): Promise<boolean> {
  const params = new URLSearchParams(rawBody)
  const signature = params.get('signature') ?? ''
  params.delete('signature')
  const passphrase = process.env.PAYFAST_PASSPHRASE ?? ''
  const paramString =
    [...params.entries()]
      .map(([k, v]) => `${k}=${encodeURIComponent(v.trim()).replace(/%20/g, '+')}`)
      .join('&') +
    (passphrase
      ? `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`
      : '')
  const hash = createHash('md5').update(paramString).digest('hex')
  return hash === signature
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

  try {
    const supabase = await createClient()

    if (provider === 'payfast') {
      const valid = await verifyPayFast(rawBody)
      if (!valid) return NextResponse.json({ error: 'Invalid PayFast signature' }, { status: 400 })

      const orderId = params.get('m_payment_id')
      if (!orderId) return NextResponse.json({ error: 'Missing order id' }, { status: 400 })

      if (params.get('payment_status') === 'COMPLETE') {
        const { data: order } = await supabase
          .from('orders')
          .update({ status: 'paid', payment_reference: params.get('pf_payment_id') })
          .eq('id', orderId)
          .select('*, vendors(business_name)')
          .single()

        if (order) {
          const { subject, html } = orderConfirmationEmail({
            customerName: order.customer_name,
            orderNumber: order.order_number,
            businessName: order.vendors?.business_name ?? '',
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
        await supabase
          .from('orders')
          .update({ status: 'paid', payment_reference: params.get('TransactionId') })
          .eq('id', order.id)

        const { subject, html } = orderConfirmationEmail({
          customerName: order.customer_name,
          orderNumber: order.order_number,
          businessName: order.vendors?.business_name ?? '',
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
