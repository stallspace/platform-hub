import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'

/**
 * GET /api/checkout/payment-method?vendorId=...
 *
 * Returns ONLY non-secret info the checkout page needs: whether the vendor has
 * an online gateway configured, and whether they accept payment on collection.
 * No credentials are ever returned.
 */
export async function GET(request: NextRequest) {
  const vendorId = request.nextUrl.searchParams.get('vendorId')
  if (!vendorId) return NextResponse.json({ error: 'Missing vendorId' }, { status: 400 })

  try {
    const supabase = createServiceClient()

    const [{ data: cfg }, { data: settings }] = await Promise.all([
      supabase
        .from('vendor_payment_configs')
        .select('provider, is_active')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
      supabase
        .from('vendor_store_settings')
        .select('pay_on_collection, fulfilment_type')
        .eq('vendor_id', vendorId)
        .maybeSingle(),
    ])

    const offersCollection =
      settings?.fulfilment_type === 'collection' || settings?.fulfilment_type === 'both'

    return NextResponse.json({
      provider: cfg?.provider ?? null,
      configured: !!cfg,
      // Pay on collection is only offered when the vendor opted in AND actually
      // offers collection as a fulfilment method.
      payOnCollection: Boolean(settings?.pay_on_collection) && offersCollection,
    })
  } catch {
    return NextResponse.json({ provider: null, configured: false, payOnCollection: false })
  }
}
