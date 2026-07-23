import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'

/**
 * GET /api/checkout/payment-method?vendorId=...
 *
 * Returns ONLY non-secret info the checkout page needs to render: which provider
 * the vendor uses and whether it is configured. No credentials are ever returned.
 */
export async function GET(request: NextRequest) {
  const vendorId = request.nextUrl.searchParams.get('vendorId')
  if (!vendorId) return NextResponse.json({ error: 'Missing vendorId' }, { status: 400 })

  try {
    const supabase = createServiceClient()
    const { data: cfg } = await supabase
      .from('vendor_payment_configs')
      .select('provider, is_active')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .limit(1)
      .single()

    return NextResponse.json({
      provider: cfg?.provider ?? null,
      configured: !!cfg,
    })
  } catch {
    return NextResponse.json({ provider: null, configured: false })
  }
}
