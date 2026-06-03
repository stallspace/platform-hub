import { DollarSign, ShoppingBag, Eye, MessageSquare, TrendingUp, Crown, ArrowUpRight } from 'lucide-react'

const STATS = [
  { label: 'Total Revenue', value: 'R 24,850', change: '+12%', icon: DollarSign, color: 'text-green-600 bg-green-50' },
  { label: 'Total Orders', value: '47', change: '+8%', icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
  { label: 'Store Visits', value: '1,234', change: '+23%', icon: Eye, color: 'text-purple-600 bg-purple-50' },
  { label: 'Enquiries', value: '12', change: '3 new', icon: MessageSquare, color: 'text-orange-600 bg-orange-50' },
]

const RECENT_ORDERS = [
  { id: 'MRC-A1B2C3', customer: 'Thabo M.', amount: 'R 1,299', status: 'confirmed', date: '2 Jun 2025' },
  { id: 'MRC-D4E5F6', customer: 'Nomsa K.', amount: 'R 849', status: 'delivered', date: '1 Jun 2025' },
  { id: 'MRC-G7H8I9', customer: 'Jan V.', amount: 'R 299', status: 'pending', date: '31 May 2025' },
]

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'badge-info',
  delivered: 'badge-success',
  pending: 'badge-warning',
}

export default function VendorDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Welcome back! Here&apos;s your store overview.</p>
      </div>

      {/* Subscription Status Banner */}
      <div className="bg-gradient-to-r from-brand-navy to-brand-accent rounded-xl p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-yellow-300" />
          <div>
            <p className="text-white font-semibold">Growth Plan — Active</p>
            <p className="text-blue-200 text-sm">Next billing: 1 July 2025 · R399/month</p>
          </div>
        </div>
        <button className="text-white text-sm font-medium bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
          Manage
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-green-600 font-medium">{stat.change}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Orders</h3>
            <button className="text-brand-accent text-sm flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {RECENT_ORDERS.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.id}</p>
                  <p className="text-xs text-gray-500">{order.customer} · {order.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-gray-900">{order.amount}</span>
                  <span className={`badge ${STATUS_STYLES[order.status]}`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Analytics */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Store Performance</h3>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Store Visits (30d)', value: 1234, max: 2000 },
              { label: 'Product Views (30d)', value: 3421, max: 5000 },
              { label: 'Conversion Rate', value: 38, max: 100, isPercent: true },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{metric.label}</span>
                  <span className="font-semibold text-gray-900">
                    {metric.isPercent ? `${metric.value}%` : metric.value.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-accent rounded-full"
                    style={{ width: `${(metric.value / metric.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
