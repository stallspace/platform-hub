'use client'

import { BarChart2, Eye, ShoppingBag, MessageSquare, TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react'

interface Order {
  id: string
  order_number: string
  customer_name: string
  total: number
  status: string
  created_at: string
}

interface Product {
  id: string
  name: string
  view_count: number
  is_available: boolean
}

interface Enquiry {
  created_at: string
}

interface Props {
  vendorName: string
  storeViews: number
  productViews: number
  totalOrders: number
  confirmedOrderCount: number
  pendingEnquiries: number
  totalRevenue: number
  recentOrders: Order[]
  topProducts: Product[]
  enquiries: Enquiry[]
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
  shipped: 'bg-indigo-100 text-indigo-700',
}

export default function AnalyticsClient({ vendorName, storeViews, productViews, totalOrders, confirmedOrderCount, pendingEnquiries, totalRevenue, recentOrders, topProducts, enquiries }: Props) {
  const stats = [
    { label: 'Store Visits', value: storeViews.toLocaleString(), icon: Eye, color: 'text-purple-600 bg-purple-50' },
    { label: 'Product Views', value: productViews.toLocaleString(), icon: BarChart2, color: 'text-brand-mint bg-blue-50' },
    { label: 'Total Orders', value: totalOrders.toLocaleString(), icon: ShoppingBag, color: 'text-green-600 bg-green-50' },
    { label: 'Total Revenue', value: 'R ' + totalRevenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 }), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Unread Enquiries', value: pendingEnquiries.toLocaleString(), icon: MessageSquare, color: 'text-orange-600 bg-orange-50' },
  ]

  const maxViews = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.view_count), 1) : 1

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Performance overview for {vendorName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className={"w-10 h-10 rounded-lg flex items-center justify-center mb-3 " + stat.color}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Top Products by Views</h2>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No product views yet</div>
          ) : (
            <div className="p-5 space-y-4">
              {topProducts.map((product, i) => (
                <div key={product.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-400 text-xs w-4">{i + 1}</span>
                      <span className="text-gray-700 font-medium truncate">{product.name}</span>
                      {!product.is_available && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Unavailable</span>}
                    </div>
                    <span className="font-semibold text-gray-900 flex-shrink-0 ml-2">{product.view_count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-mint rounded-full transition-all" style={{ width: (product.view_count / maxViews * 100) + '%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <a href="/vendor/orders" className="text-brand-mint text-sm flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No orders yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map(order => (
                <div key={order.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.order_number}</p>
                    <p className="text-xs text-gray-500">{order.customer_name} · {new Date(order.created_at).toLocaleDateString('en-ZA')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">R {Number(order.total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                    <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600')}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Avg. Order Value', value: confirmedOrderCount > 0 ? 'R ' + (totalRevenue / confirmedOrderCount).toLocaleString('en-ZA', { minimumFractionDigits: 2 }) : '—' },
            { label: 'Enquiry Rate', value: storeViews > 0 ? ((enquiries.length / storeViews) * 100).toFixed(1) + '%' : '—' },
            { label: 'Views per Order', value: totalOrders > 0 ? Math.round(storeViews / totalOrders).toLocaleString() : '—' },
            { label: 'Products Tracked', value: topProducts.length.toString() },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className="text-lg font-bold text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
