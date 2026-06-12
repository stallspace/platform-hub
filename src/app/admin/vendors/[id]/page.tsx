import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import VendorDetailClient from '@/components/admin/VendorDetailClient'

export const dynamic = 'force-dynamic'

export default async function VendorDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*, vendor_documents(*)')
    .eq('id', params.id)
    .single()

  if (error || !vendor) notFound()

  const [
    { data: events },
    { count: productCount },
    { count: enquiryCount },
    { data: topProducts },
    { data: reviews },
    { data: storeViews },
  ] = await Promise.all([
    supabase
      .from('subscription_events')
      .select('*')
      .eq('vendor_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', params.id)
      .eq('is_archived', false),
    supabase
      .from('enquiries')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', params.id),
    supabase
      .from('products')
      .select('id, name, price, images, view_count, is_available')
      .eq('vendor_id', params.id)
      .eq('is_archived', false)
      .order('view_count', { ascending: false })
      .limit(5),
    supabase
      .from('reviews')
      .select('id, customer_name, rating, comment, is_approved, created_at')
      .eq('vendor_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('store_views')
      .select('id', { count: 'exact', head: false })
      .eq('vendor_id', params.id),
  ])

  const avgRating = reviews && reviews.length > 0
    ? reviews.filter((r) => r.is_approved).reduce((sum, r) => sum + r.rating, 0) / Math.max(reviews.filter((r) => r.is_approved).length, 1)
    : null

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/vendors" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0D3B2E]">{vendor.business_name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Vendor detail &amp; management</p>
        </div>
      </div>

      <VendorDetailClient
        vendor={vendor}
        events={events ?? []}
        productCount={productCount ?? 0}
        enquiryCount={enquiryCount ?? 0}
        topProducts={topProducts ?? []}
        reviews={reviews ?? []}
        storeViewCount={storeViews?.length ?? 0}
        avgRating={avgRating}
      />
    </div>
  )
}
