import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { rateLimit, clientIp } from '@/lib/utils/rate-limit'

/**
 * POST /api/reviews — submit a customer review (held for moderation).
 * Validated and rate-limited; written via the service role. Reviews are created
 * with is_approved = false and only appear after an admin/vendor approves them.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request.headers)
    const { allowed } = rateLimit(`reviews:${ip}`, 5, 60 * 60 * 1000) // 5 per hour
    if (!allowed) {
      return NextResponse.json({ error: 'Too many reviews submitted. Please try again later.' }, { status: 429 })
    }

    const body = await request.json()
    const { vendor_id, product_id, customer_name, rating, comment } = body

    if (!vendor_id || !customer_name || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a whole number between 1 and 5' }, { status: 400 })
    }
    const name = String(customer_name).trim().slice(0, 80)
    const body_comment = comment ? String(comment).trim().slice(0, 1000) : null
    if (name.length < 2) {
      return NextResponse.json({ error: 'Please enter a valid name' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify the vendor exists and is approved.
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, status')
      .eq('id', vendor_id)
      .single()
    if (!vendor || vendor.status !== 'approved') {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // If a product is referenced, it must belong to this vendor.
    if (product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('id, vendor_id')
        .eq('id', product_id)
        .single()
      if (!product || product.vendor_id !== vendor_id) {
        return NextResponse.json({ error: 'Invalid product' }, { status: 400 })
      }
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        vendor_id,
        product_id: product_id ?? null,
        customer_name: name,
        rating,
        comment: body_comment,
        is_approved: false,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
    return NextResponse.json({ data: review })
  } catch {
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
