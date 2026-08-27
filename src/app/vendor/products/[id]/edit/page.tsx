// Reads live data / the user session, so it must never be statically rendered.
export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentVendor } from '@/lib/supabase/session'
import ProductFormClient from '@/components/vendor/ProductFormClient'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const vendor = await getCurrentVendor()
  if (!vendor) redirect('/join')

  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('id, name, description, price, compare_at_price, category_id, images, stock_quantity, track_inventory, is_available, sku, tags, specifications')
    .eq('id', params.id)
    .eq('vendor_id', vendor.id)
    .single()

  if (!product) notFound()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  return (
    <ProductFormClient
      vendorId={vendor.id}
      categories={categories ?? []}
      product={product}
    />
  )
}
