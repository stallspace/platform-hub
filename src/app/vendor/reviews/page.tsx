// Reads live data / the user session, so it must never be statically rendered.
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReviewsClient from '@/components/vendor/ReviewsClient'

export default async function VendorReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/join')

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, customer_name, rating, comment, is_approved, created_at, product_id, products(name)')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  // Supabase types the to-one products join as an array; runtime shape matches the client.
  return <ReviewsClient reviews={(reviews ?? []) as unknown as Parameters<typeof ReviewsClient>[0]['reviews']} vendorId={vendor.id} />
}
