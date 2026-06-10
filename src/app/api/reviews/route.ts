import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await request.json()
    const { vendor_id, product_id, customer_name, rating, comment } = body

    if (!vendor_id || !customer_name || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        vendor_id,
        product_id: product_id ?? null,
        customer_name: customer_name.trim(),
        rating,
        comment: comment?.trim() ?? null,
        is_approved: false,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ data: review })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to submit review' },
      { status: 500 }
    )
  }
}
