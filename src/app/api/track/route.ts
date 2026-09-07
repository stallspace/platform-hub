import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { limitRequest } from '@/lib/utils/rate-limit-db'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * POST /api/track — records anonymous store/product views for analytics.
 *
 * Public and unauthenticated by necessity, so it is the easiest endpoint to
 * abuse: it used to accept any vendor_id and product_id without checking they
 * existed, and without a limit. That let anyone inflate a vendor's analytics
 * with invented traffic and pad the row count. Now the ids must be real UUIDs
 * that resolve to real rows, and each IP gets a bounded number of views.
 *
 * Failures here are silent by design — analytics must never break a page.
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
    if (!UUID.test(String(vendor_id))) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    if (type === 'product_view' && !UUID.test(String(product_id ?? ''))) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // Generous — real browsing produces a lot of views — but bounded.
    if (!(await limitRequest(request.headers, { bucket: 'track', limit: 300, windowSeconds: 3600 }))) {
      return NextResponse.json({ ok: false }, { status: 429 })
    }

    const supabase = createServiceClient()
    const sessionId = String(session_id).slice(0, 64)

    if (type === 'store_view') {
      // Confirm the vendor exists and is public before recording a view.
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('id', vendor_id)
        .eq('status', 'approved')
        .maybeSingle()
      if (!vendor) return NextResponse.json({ ok: false }, { status: 400 })

      await supabase.from('store_views').insert({ vendor_id, session_id: sessionId })
    } else {
      // The product must exist AND belong to the vendor being credited.
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('id', product_id)
        .eq('vendor_id', vendor_id)
        .maybeSingle()
      if (!product) return NextResponse.json({ ok: false }, { status: 400 })

      await supabase.from('product_views').insert({ vendor_id, product_id, session_id: sessionId })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
