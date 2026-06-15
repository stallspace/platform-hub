import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AnalyticsClient from '@/components/vendor/AnalyticsClient'

export default async function VendorAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/vendor/register')

  const [
    { count: storeViews },
    { count: productViews },
    { count: totalOrders },
    { count: pendingEnquiries },
    { data: orderTotals },
    { data: recentOrders },
    { data: topProducts },
    { data: enquiries },
  ] = await Promise.all([
    supabase.from('store_views').select('*', { count: 'exact', head: true }).eq('vendor_id', vendor.id),
    supabase.from('product_views').select('*', { count: 'exact', head: true }).eq('vendor_id', vendor.id),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('vendor_id', vendor.id),
    supabase.from('enquiries').select('*', { count: 'exact', head: true }).eq('vendor_id', vendor.id).eq('is_read', false),
    supabase.from('orders').select('total, created_at').eq('vendor_id', vendor.id).in('status', ['confirmed', 'processing', 'shipped', 'delivered']),
    supabase.from('orders').select('id, order_number, customer_name, total, status, created_at').eq('vendor_id', vendor.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('products').select('id, name, view_count, is_available').eq('vendor_id', vendor.id).eq('is_archived', false).order('view_count', { ascending: false }).limit(5),
    supabase.from('enquiries').select('created_at').eq('vendor_id', vendor.id).order('created_at', { ascending: false }).limit(30),
  ])

  const totalRevenue = orderTotals?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0

  return (
    <AnalyticsClient
      vendorName={vendor.business_name}
      storeViews={storeViews ?? 0}
      productViews={productViews ?? 0}
      totalOrders={totalOrders ?? 0}
      pendingEnquiries={pendingEnquiries ?? 0}
      totalRevenue={totalRevenue}
      confirmedOrderCount={orderTotals?.length ?? 0}
      recentOrders={recentOrders ?? []}
      topProducts={topProducts ?? []}
      enquiries={enquiries ?? []}
    />
  )
}
