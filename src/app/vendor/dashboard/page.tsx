import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DollarSign, ShoppingBag, Eye, MessageSquare, TrendingUp, Crown, ArrowUpRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
  shipped: 'bg-indigo-100 text-indigo-700',
}

const LOW_STOCK_THRESHOLD = 5

export default async function VendorDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, subscription_plan, subscription_status, subscription_next_billing')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/vendor/register')

  const [
    { count: productCount },
    { count: enquiryCount },
    { count: unreadEnquiries },
    { data: recentOrders },
    { data: orderTotals },
    { count: storeViews },
    { count: productViews },
    { data: lowStockProducts },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('vendor_id', vendor.id).eq('is_archived', false),
    supabase.from('enquiries').select('*', { count: 'exact', head: true }).eq('vendor_id', vendor.id),
    supabase.from('enquiries').select('*', { count: 'exact', head: true }).eq('vendor_id', vendor.id).eq('is_read', false),
    supabase.from('orders').select('id, order_number, customer_name, total, status, created_at').eq('vendor_id', vendor.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('orders').select('total').eq('vendor_id', vendor.id).in('status', ['confirmed', 'processing', 'shipped', 'delivered']),
    supabase.from('store_views').select('*', { count: 'exact', head: true }).eq('vendor_id', vendor.id),
    supabase.from('product_views').select('*', { count: 'exact', head: true }).eq('vendor_id', vendor.id),
    supabase.from('products').select('id, name, stock_quantity').eq('vendor_id', vendor.id).eq('track_inventory', true).eq('is_archived', false).lte('stock_quantity', LOW_STOCK_THRESHOLD).order('stock_quantity', { ascending: true }).limit(10),
  ])

  const totalRevenue = orderTotals?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0
  const orderCount = recentOrders?.length ?? 0

  const planLabel = vendor.subscription_plan
    ? vendor.subscription_plan.charAt(0).toUpperCase() + vendor.subscription_plan.slice(1)
    : null

  const nextBilling = vendor.subscription_next_billing
    ? new Date(vendor.subscription_next_billing).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const PLAN_PRICE: Record<string, number> = { starter: 199, growth: 399, premium: 699 }
  const planPrice = vendor.subscription_plan ? PLAN_PRICE[vendor.subscription_plan] : null

  const STATS = [
    { label: 'Total Revenue', value: `R ${totalRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, sub: 'Confirmed orders', icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { label: 'Total Orders', value: String(orderCount), sub: 'All time', icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
    { label: 'Store Visits', value: (storeViews ?? 0).toLocaleString(), sub: 'All time', icon: Eye, color: 'text-purple-600 bg-purple-50' },
    { label: 'Enquiries', value: String(enquiryCount ?? 0), sub: unreadEnquiries ? `${unreadEnquiries} unread` : 'None unread', icon: MessageSquare, color: 'text-orange-600 bg-orange-50' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Welcome back, {vendor.business_name}!</p>
      </div>

      {planLabel && (
        <div className="bg-gradient-to-r from-brand-navy to-brand-accent rounded-xl p-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-yellow-300" />
            <div>
              <p className="text-white font-semibold">
                {planLabel} Plan — {vendor.subscription_status === 'active' ? 'Active' : vendor.subscription_status}
              </p>
              {nextBilling && planPrice && (
                <p className="text-blue-200 text-sm">Next billing: {nextBilling} · R{planPrice}/month</p>
              )}
            </div>
          </div>
          <a href="/vendor/subscription" className="text-white text-sm font-medium bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
            Manage
          </a>
        </div>
      )}

      {lowStockProducts && lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-800">
              {lowStockProducts.length === 1 ? '1 product is' : `${lowStockProducts.length} products are`} running low on stock
            </p>
          </div>
          <div className="space-y-1.5">
            {lowStockProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between">
                <Link href={`/vendor/products/${product.id}/edit`} className="text-sm text-amber-900 hover:text-amber-700 hover:underline truncate max-w-xs">
                  {product.name}
                </Link>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-3 ${product.stock_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {product.stock_quantity === 0 ? 'Out of stock' : `${product.stock_quantity} left`}
                </span>
              </div>
            ))}
          </div>
          <Link href="/vendor/products" className="inline-flex items-center gap-1 text-xs text-amber-700 hover:underline mt-3">
            Manage products <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Orders</h3>
            <a href="/vendor/orders" className="text-brand-accent text-sm flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.order_number}</p>
                    <p className="text-xs text-gray-500">{order.customer_name} · {new Date(order.created_at).toLocaleDateString('en-ZA')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm text-gray-900">R {Number(order.total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">No orders yet</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Store Performance</h3>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Store Visits', value: storeViews ?? 0, max: Math.max(storeViews ?? 0, 100) },
              { label: 'Product Views', value: productViews ?? 0, max: Math.max(productViews ?? 0, 100) },
              { label: 'Products Listed', value: productCount ?? 0, max: Math.max(productCount ?? 0, 10) },
              { label: 'Enquiries', value: enquiryCount ?? 0, max: Math.max(enquiryCount ?? 0, 10) },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{metric.label}</span>
                  <span className="font-semibold text-gray-900">{metric.value.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-accent rounded-full transition-all" style={{ width: metric.max > 0 ? `${(metric.value / metric.max) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
