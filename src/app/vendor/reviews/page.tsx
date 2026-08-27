// Reads live data / the user session, so it must never be statically rendered.
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentVendor } from '@/lib/supabase/session'
import ReviewsClient from '@/components/vendor/ReviewsClient'

export default async function VendorReviewsPage() {
  const vendor = await getCurrentVendor()
  if (!vendor) redirect('/join')

  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, customer_name, rating, comment, is_approved, created_at, product_id, products(name)')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  // Supabase types the to-one products join as an array; runtime shape matches the client.
  return <ReviewsClient reviews={(reviews ?? []) as unknown as Parameters<typeof ReviewsClient>[0]['reviews']} vendorId={vendor.id} />
}
