import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { orderConfirmationEmail } from '@/lib/email/templates'

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `MRC-${ts}-${rand}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const body = await request.json()
    const { vendor_id, customer_email, customer_name, customer_phone, shipping_address, items, subtotal, delivery_cost, payment_provider } = body

    if (!vendor_id || !customer_email || !customer_name || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const total = Number(subtotal) + Number(delivery_cost ?? 0)
    const order_number = generateOrderNumber()

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_number, vendor_id,
        customer_id: user?.id ?? null,
        customer_email, customer_name,
        customer_phone: customer_phone ?? null,
        shipping_address, items,
        subtotal: Number(subtotal), total,
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
      supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', vendor.user_id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.email) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://Stallspace.co.za'
            sendEmail({
              to: profile.email,
              subject: `New order ${order_number} from ${customer_name}`,
              html: `<p>Hi ${profile.full_name ?? 'there'},</p><p>You have a new order on Stallspace.</p><p><strong>Order:</strong> ${order_number}<br><strong>Customer:</strong> ${customer_name}<br><strong>Total:</strong> R${Number(total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p><p><a href="${appUrl}/vendor/orders">View order</a></p>`,
            }).catch(console.error)
          }
        })
        .catch(console.error)
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
