import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductFormClient from '@/components/vendor/ProductFormClient'

export default async function NewProductPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/join')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  return (
    <ProductFormClient
      vendorId={vendor.id}
      categories={categories ?? []}
      product={null}
    />
  )
}
