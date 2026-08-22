import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { newOrderVendorEmail } from '@/lib/email/templates'

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `MRC-${ts}-${rand}`
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

const VALID_PROVIDERS = new Set(['payfast', 'peach', 'yoco', 'ozow', 'cash_on_collection'])

export async function POST(request: NextRequest) {
  try {
    // Identify the logged-in customer (if any) from their own session.
    const userClient = await createClient()
    const { data: { user } } = await userClient.auth.getUser()

    // All writes use the service role after server-side validation & pricing.
    const supabase = createServiceClient()

    const body = await request.json()
    const { vendor_id, customer_email, customer_name, customer_phone, shipping_address, items, fulfilment, payment_provider } = body

    if (!vendor_id || !customer_email || !customer_name || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!isEmail(String(customer_email))) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    if (!payment_provider || !VALID_PROVIDERS.has(String(payment_provider))) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }
    // Pay-on-collection must be genuinely offered by the vendor, and only for
    // collection orders — never trust the client on this.
    if (payment_provider === 'cash_on_collection') {
      const { data: ss } = await supabase
        .from('vendor_store_settings')
        .select('pay_on_collection, fulfilment_type')
        .eq('vendor_id', vendor_id)
        .maybeSingle()
      const offersCollection = ss?.fulfilment_type === 'collection' || ss?.fulfilment_type === 'both'
      if (!ss?.pay_on_collection || !offersCollection || fulfilment !== 'collection') {
        return NextResponse.json({ error: 'Pay on collection is not available for this vendor' }, { status: 400 })
      }
    }

    // Recompute prices SERVER-SIDE from the database. Never trust client prices.
    const productIds = [...new Set(items.map((i: { product_id: string }) => i.product_id))]
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, name, price, images, vendor_id, is_available, is_archived, track_inventory, stock_quantity')
      .in('id', productIds)

    if (prodErr) throw new Error(prodErr.message)

    const priceMap = new Map((products ?? []).map(p => [p.id, p]))
    const validatedItems: Array<Record<string, unknown>> = []
    let subtotal = 0

    for (const item of items) {
      const p = priceMap.get(item.product_id)
      if (!p) return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400 })
      if (p.vendor_id !== vendor_id) return NextResponse.json({ error: 'Product does not belong to this vendor' }, { status: 400 })
      if (!p.is_available || p.is_archived) return NextResponse.json({ error: `Product unavailable: ${p.name}` }, { status: 400 })

      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1))

      // Prevent overselling when the vendor tracks inventory.
      if (p.track_inventory && p.stock_quantity != null && p.stock_quantity < qty) {
        return NextResponse.json(
          { error: p.stock_quantity <= 0 ? `${p.name} is out of stock` : `Only ${p.stock_quantity} of ${p.name} left in stock` },
          { status: 409 }
        )
      }

      const unit = Number(p.price)
      const lineTotal = unit * qty
      subtotal += lineTotal
      validatedItems.push({
        product_id: p.id,
        product_name: p.name,
        product_image: p.images?.[0] ?? null,
        quantity: qty,
        unit_price: unit,
        total_price: lineTotal,
        variant: item.variant ?? null,
      })
    }

    // Delivery cost comes from the vendor's store settings, not the client.
    let deliveryCost = 0
    if (fulfilment === 'delivery') {
      const { data: ss } = await supabase
        .from('vendor_store_settings')
        .select('delivery_cost')
        .eq('vendor_id', vendor_id)
        .single()
      deliveryCost = Number(ss?.delivery_cost ?? 0)
    }

    const total = subtotal + deliveryCost
    const order_number = generateOrderNumber()

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_number, vendor_id,
        customer_id: user?.id ?? null,
        customer_email, customer_name,
        customer_phone: customer_phone ?? null,
        shipping_address, items: validatedItems,
        subtotal, total,
        status: 'pending', payment_provider,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // In-app notification to vendor
    const { data: vendor } = await supabase
      .from('vendors')
      .select('user_id, business_name')
      .eq('id', vendor_id)
      .single()

    if (vendor?.user_id) {
      await supabase.from('notifications').insert({
        user_id: vendor.user_id,
        type: 'order',
        title: `New order from ${customer_name}`,
        message: `Order ${order_number} · R${Number(total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
        action_url: '/vendor/orders',
      })
    }

    // Email vendor notification (non-blocking)
    if (vendor?.user_id) {
      void (async () => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', vendor.user_id)
            .single()
          if (profile?.email) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stallspace.co.za'
            const tpl = newOrderVendorEmail({
              vendorName: profile.full_name ?? vendor.business_name ?? 'there',
              orderNumber: order_number,
              customerName: customer_name,
              customerEmail: customer_email,
              customerPhone: customer_phone ?? null,
              total: `R${Number(total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
              items: validatedItems as unknown as { product_name: string; quantity: number; total_price: number }[],
              fulfilment: fulfilment ?? null,
              paymentMethod: payment_provider === 'cash_on_collection' ? 'Pay on collection' : 'PayFast',
              ordersUrl: `${appUrl}/vendor/orders`,
            })
            await sendEmail({ to: profile.email, ...tpl })
          }
        } catch (e) {
          console.error('[orders] vendor email failed', e)
        }
      })()
    }

    return NextResponse.json({ data: order })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create order' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_number, status, total, subtotal, created_at, items, payment_provider, vendor:vendors(business_name, slug)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return NextResponse.json({ data: orders })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to fetch orders' }, { status: 500 })
  }
}
