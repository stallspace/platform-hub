import { createClient } from '@/lib/supabase/server'
import ContentClient from '@/components/admin/ContentClient'

export const dynamic = 'force-dynamic'

export default async function ContentPage() {
  const supabase = await createClient()

  // Homepage content sections
  const { data: homepageContent } = await supabase
    .from('homepage_content')
    .select('*')
    .order('section', { ascending: true })

  // Approved vendors for featuring
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, business_name, logo_url, slug')
    .eq('status', 'approved')
    .order('business_name', { ascending: true })

  // Featured products (is_featured flag)
  const { data: featuredProducts } = await supabase
    .from('products')
    .select('id, name, images, price, vendor_id, vendors(business_name)')
    .eq('is_featured', true)
    .eq('is_archived', false)
    .limit(20)

  // All available products for the picker
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, price, images, vendor_id, vendors(business_name)')
    .eq('is_archived', false)
    .eq('is_available', true)
    .order('name', { ascending: true })
    .limit(200)

  // Featured vendor IDs from homepage_content
  const featuredVendorSection = homepageContent?.find((s) => s.section === 'featured_vendors')
  const featuredVendorIds: string[] = featuredVendorSection?.content?.vendor_ids ?? []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0D3B2E]">Content Management</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage homepage banners, featured vendors and featured products.</p>
      </div>

      <ContentClient
        homepageContent={homepageContent ?? []}
        vendors={vendors ?? []}
        featuredVendorIds={featuredVendorIds}
        featuredProducts={(featuredProducts as any[]) ?? []}
        allProducts={(allProducts as any[]) ?? []}
      />
    </div>
  )
}
