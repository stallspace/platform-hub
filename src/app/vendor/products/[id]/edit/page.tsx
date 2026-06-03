import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductFormClient from '@/components/vendor/ProductFormClient'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/vendor/register')

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
