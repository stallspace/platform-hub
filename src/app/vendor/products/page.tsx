// Reads live data / the user session, so it must never be statically rendered.
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentVendor } from '@/lib/supabase/session'
import ProductsClient from '@/components/vendor/ProductsClient'

export default async function VendorProductsPage() {
  const vendor = await getCurrentVendor()
  if (!vendor) redirect('/join')

  const supabase = await createClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, price, images, is_available, is_archived, is_featured, stock_quantity, track_inventory, view_count, created_at, categories(name)')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('id, name')
      .order('name'),
  ])

  return (
    <ProductsClient
      products={products ?? []}
      categories={categories ?? []}
      vendorId={vendor.id}
      subscriptionPlan={vendor.subscription_plan}
    />
  )
}
