import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Package, CreditCard, AlertCircle, Clock, TrendingUp, ShoppingBag } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PLAN_PRICES: Record<string, number> = { starter: 199, growth: 399, premium: 699 }

function formatCurrency(n: number) {
  return `R ${n.toLocaleString('en-ZA')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Vendor counts by status
  const { data: vendorRows } = await supabase
    .from('vendors')
    .select('id, business_name, email, status, subscription_plan, subscription_status, created_at, logo_url')
    .order('created_at', { ascending: false })

  const vendors = vendorRows ?? []
  const totalVendors     = vendors.length
  const pendingVendors   = vendors.filter((v) => v.status === 'pending')
  const approvedVendors  = vendors.filter((v) => v.status === 'approved')
  const suspendedCount   = vendors.filter((v) => v.status === 'suspended').length
  const activeSubVendors = vendors.filter((v) => v.subscription_status === 'active')

  const mrr = activeSubVendors.reduce((sum, v) => sum + (PLAN_PRICES[v.subscription_plan ?? 'starter'] ?? 0), 0)

  // Product count
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_archived', false)

  // Enquiry count (unread)
  const { count: unreadEnquiries } = await supabase
    .from('enquiries')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  // Recent audit log
  const { data: auditRows } = await supabase
    .from('audit_logs')
    .select('id, action, resource_type, created_at, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(8)

  const STATS = [
    {
      label: 'Total Vendors',
      value: String(totalVendors),
      sub: `${pendingVendors.length} pending approval`,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
      href: '/admin/vendors',
    },
    {
      label: 'Total Products',
      value: (totalProducts ?? 0).toLocaleString('en-ZA'),
      sub: 'across all vendors',
      icon: Package,
      color: 'text-purple-600 bg-purple-50',
      href: '/admin/products',
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(mrr),
      sub: `${activeSubVendors.length} active subscriptions`,
      icon: CreditCard,
      color: 'text-emerald-600 bg-emerald-50',
      href: '/admin/reports',
    },
    {
      label: 'Pending Approvals',
      value: String(pendingVendors.length),
      sub: 'Require review',
      icon: AlertCircle,
      color: 'text-orange-600 bg-orange-50',
      href: '/admin/vendors?status=pending',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A1F44]">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform overview and pending actions</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => (
          <Link key={stat.label} href={stat.href} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow group">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">{stat.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pending approvals */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-gray-900">Pending Approvals</h3>
            </div>
            <Link href="/admin/vendors?status=pending" className="text-xs text-[#1D4ED8] hover:underline">View all</Link>
          </div>
          {pendingVendors.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No pending applications</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingVendors.slice(0, 5).map((vendor) => (
                <div key={vendor.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0A1F44]/5 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {vendor.logo_url
                        ? <img src={vendor.logo_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-[#0A1F44] font-bold text-xs">{vendor.business_name.charAt(0)}</span>
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{vendor.business_name}</p>
                      <p className="text-xs text-gray-400">{vendor.email} · {formatDate(vendor.created_at)}</p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/vendors/${vendor.id}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1D4ED8]/10 text-[#1D4ED8] hover:bg-[#1D4ED8]/20 transition-colors"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue by plan */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h3 className="font-semibold text-gray-900">Subscription Revenue</h3>
            </div>
            <Link href="/admin/reports" className="text-xs text-[#1D4ED8] hover:underline">Full report</Link>
          </div>
          <div className="p-5 space-y-4">
            {(['starter', 'growth', 'premium'] as const).map((plan) => {
              const count = activeSubVendors.filter((v) => v.subscription_plan === plan).length
              const revenue = count * PLAN_PRICES[plan]
              const pct = mrr > 0 ? (revenue / mrr) * 100 : 0
              const colors: Record<string, string> = { starter: 'bg-sky-500', growth: 'bg-violet-500', premium: 'bg-amber-500' }
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium text-gray-800 capitalize">{plan}</span>
                      <span className="text-xs text-gray-400 ml-2">({count} vendors)</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{formatCurrency(revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`${colors[plan]} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            <div className="pt-3 border-t border-gray-100 flex justify-between">
              <span className="font-semibold text-gray-800">Total MRR</span>
              <span className="text-xl font-black text-emerald-600">{formatCurrency(mrr)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick stats row */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Platform Snapshot</h3>
          {[
            { label: 'Approved Vendors',  value: approvedVendors.length,      color: 'text-emerald-600' },
            { label: 'Suspended Vendors', value: suspendedCount,               color: 'text-red-500' },
            { label: 'Unread Enquiries',  value: unreadEnquiries ?? 0,         color: 'text-amber-600' },
            { label: 'Active Billing',    value: activeSubVendors.length,      color: 'text-blue-600' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{row.label}</span>
              <span className={`text-lg font-bold ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Recent activity from audit log */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <Link href="/admin/audit" className="text-xs text-[#1D4ED8] hover:underline">View audit log</Link>
          </div>
          {(!auditRows || auditRows.length === 0) ? (
            <div className="p-8 text-center text-gray-400 text-sm">No activity recorded yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {auditRows.map((row) => {
                const profile = row.profiles as any
                return (
                  <div key={row.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">{profile?.full_name ?? profile?.email ?? 'Admin'}</span>
                        {' · '}
                        <span className="capitalize">{row.action.replace(/_/g, ' ')}</span>
                        {' '}
                        <span className="text-gray-400 capitalize">{row.resource_type}</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-3">{formatDate(row.created_at)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
