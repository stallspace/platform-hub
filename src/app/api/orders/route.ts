import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Generate a short order number
function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `MRC-${ts}-${rand}`
}

// POST /api/orders — create a new order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const {
      vendor_id,
      customer_email,
      customer_name,
      customer_phone,
      shipping_address,
      items,
      subtotal,
      delivery_cost,
      payment_provider,
    } = body

    if (!vendor_id || !customer_email || !customer_name || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const total = Number(subtotal) + Number(delivery_cost ?? 0)
    const order_number = generateOrderNumber()

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_number,
        vendor_id,
        customer_id: user?.id ?? null,
        customer_email,
        customer_name,
        customer_phone: customer_phone ?? null,
        shipping_address,
        items,
        subtotal: Number(subtotal),
        total,
        status: 'pending',
        payment_provider,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ data: order })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create order' },
      { status: 500 }
    )
  }
}

// GET /api/orders — fetch orders for current customer
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id, order_number, status, total, subtotal, created_at,
        items, payment_provider,
        vendor:vendors(business_name, slug)
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    return NextResponse.json({ data: orders })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
