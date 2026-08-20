import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrdersClient from '@/components/vendor/OrdersClient'

export default async function VendorOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/join')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_email, customer_phone, total, status, created_at, items, shipping_address')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  // Collect all unique product_ids across all order items
  const productIds = [...new Set(
    (orders ?? []).flatMap((o) => (o.items ?? []).map((item: any) => item.product_id)).filter(Boolean)
  )]

  const productNames: Record<string, string> = {}
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds)
    if (products) {
      for (const p of products) productNames[p.id] = p.name
    }
  }

  return <OrdersClient orders={orders ?? []} vendorId={vendor.id} productNames={productNames} />
}
