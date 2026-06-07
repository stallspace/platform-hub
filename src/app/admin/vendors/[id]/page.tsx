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

  // Subscription events for this vendor
  const { data: events } = await supabase
    .from('subscription_events')
    .select('*')
    .eq('vendor_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Product count
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', params.id)

  // Enquiry count
  const { count: enquiryCount } = await supabase
    .from('enquiries')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', params.id)

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/vendors"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0A1F44]">{vendor.business_name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Vendor detail &amp; management</p>
        </div>
      </div>

      <VendorDetailClient
        vendor={vendor}
        events={events ?? []}
        productCount={productCount ?? 0}
        enquiryCount={enquiryCount ?? 0}
      />
    </div>
  )
}
