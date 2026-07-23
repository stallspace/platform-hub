import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'

/**
 * POST /api/track — records anonymous store/product views for analytics.
 * Writes via the service role after validating the payload.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, vendor_id, product_id, session_id } = body

    if (!type || !vendor_id || !session_id) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    if (type !== 'store_view' && type !== 'product_view') {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const supabase = createServiceClient()

    if (type === 'store_view') {
      await supabase.from('store_views').insert({ vendor_id, session_id: String(session_id).slice(0, 64) })
    } else if (type === 'product_view' && product_id) {
      await supabase.from('product_views').insert({ vendor_id, product_id, session_id: String(session_id).slice(0, 64) })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
