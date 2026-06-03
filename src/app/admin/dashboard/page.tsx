import { Users, Package, CreditCard, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react'

const STATS = [
  { label: 'Total Vendors', value: '18', sub: '3 pending approval', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { label: 'Total Products', value: '1,247', sub: 'across all vendors', icon: Package, color: 'text-purple-600 bg-purple-50' },
  { label: 'Active Subscriptions', value: '15', sub: 'R 5,985/month revenue', icon: CreditCard, color: 'text-green-600 bg-green-50' },
  { label: 'Pending Approvals', value: '5', sub: 'Require review', icon: AlertCircle, color: 'text-orange-600 bg-orange-50' },
]

const PENDING_VENDORS = [
  { name: 'Sunshine Crafts', email: 'hello@sunshinecrafts.co.za', submitted: '1 Jun 2025', plan: 'Starter' },
  { name: 'Urban Threads', email: 'info@urbanthreads.co.za', submitted: '31 May 2025', plan: 'Growth' },
  { name: 'Coastal Kitchen', email: 'chef@coastalkitchen.co.za', submitted: '30 May 2025', plan: 'Starter' },
]

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform overview and pending actions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">{stat.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending vendor approvals */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-gray-900">Pending Approvals</h3>
            </div>
            <span className="badge badge-warning">5 pending</span>
          </div>
          <div className="divide-y divide-gray-50">
            {PENDING_VENDORS.map((vendor) => (
              <div key={vendor.name} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                  <p className="text-xs text-gray-500">{vendor.email} · {vendor.submitted}</p>
                  <span className="badge badge-info mt-1">{vendor.plan}</span>
                </div>
                <div className="flex gap-2">
                  <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <h3 className="font-semibold text-gray-900">Subscription Revenue</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {[
                { plan: 'Starter (R199)', count: 8, revenue: 'R 1,592' },
                { plan: 'Growth (R399)', count: 5, revenue: 'R 1,995' },
                { plan: 'Premium (R699)', count: 2, revenue: 'R 1,398' },
              ].map((row) => (
                <div key={row.plan} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{row.plan}</p>
                    <p className="text-xs text-gray-500">{row.count} active vendors</p>
                  </div>
                  <span className="font-bold text-gray-900">{row.revenue}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total MRR</span>
                <span className="text-xl font-bold text-green-600">R 4,985</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
