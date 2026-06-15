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
    const { type, vendor_id, product_id, session_id } = body

    console.log('TRACK:', { type, vendor_id, product_id, session_id })

    if (!type || !vendor_id || !session_id) {
      console.log('TRACK: missing fields')
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    if (type === 'store_view') {
      const { error } = await supabase.from('store_views').insert({ vendor_id, session_id })
      console.log('TRACK store_view error:', error)
    } else if (type === 'product_view' && product_id) {
      const { error } = await supabase.from('product_views').insert({ vendor_id, product_id, session_id })
      console.log('TRACK product_view error:', error)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.log('TRACK exception:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
