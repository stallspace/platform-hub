import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Users, Package, CreditCard, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PLAN_PRICES: Record<string, number> = {
  starter: 199,
  growth:  399,
  premium: 699,
}

function formatCurrency(amount: number) {
  return `R ${amount.toLocaleString('en-ZA')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function ReportsPage() {
  const supabase = await createClient()

  // Active vendors with subscription data
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, business_name, status, subscription_plan, subscription_status, subscription_next_billing, created_at')
    .order('created_at', { ascending: false })

  // Subscription events for billing log
  const { data: events } = await supabase
    .from('subscription_events')
    .select('*, vendors(business_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  // Compute revenue metrics
  const activeVendors = (vendors ?? []).filter((v) => v.status === 'approved' && v.subscription_status === 'active')
  const pastDueVendors = (vendors ?? []).filter((v) => v.subscription_status === 'past_due')
  const suspendedVendors = (vendors ?? []).filter((v) => v.status === 'suspended')

  const planBreakdown: Record<string, { count: number; revenue: number }> = {}
  let mrr = 0
  for (const v of activeVendors) {
    const plan = v.subscription_plan ?? 'starter'
    const price = PLAN_PRICES[plan] ?? 0
    mrr += price
    if (!planBreakdown[plan]) planBreakdown[plan] = { count: 0, revenue: 0 }
    planBreakdown[plan].count++
    planBreakdown[plan].revenue += price
  }

  // Monthly revenue from subscription events (last 6 months)
  const now = new Date()
  const monthlyRevenue: { month: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })
    const monthStart = d.toISOString()
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()

    const monthEvents = (events ?? []).filter((e) =>
      e.event_type === 'charge_success' &&
      e.created_at >= monthStart &&
      e.created_at < monthEnd
    )
    const revenue = monthEvents.reduce((sum, e) => sum + (e.amount ?? 0), 0)
    monthlyRevenue.push({ month: label, revenue })
  }

  const maxMonthly = Math.max(...monthlyRevenue.map((m) => m.revenue), 1)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0D3B2E]">Revenue Reports</h1>
        <p className="text-gray-500 mt-1 text-sm">Subscription revenue, billing activity and vendor financials.</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Monthly Recurring Revenue', value: formatCurrency(mrr), sub: `${activeVendors.length} active subscriptions`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Active Vendors', value: String(activeVendors.length), sub: 'Approved & billing', icon: Users, color: 'text-brand-mint bg-blue-50' },
          { label: 'Past Due', value: String(pastDueVendors.length), sub: 'Require follow-up', icon: AlertCircle, color: 'text-red-600 bg-red-50' },
          { label: 'Suspended', value: String(suspendedVendors.length), sub: 'Inactive accounts', icon: CreditCard, color: 'text-gray-600 bg-gray-100' },
        ].map((stat) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Plan breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-[#0D3B2E] mb-4">Revenue by Plan</h3>
          <div className="space-y-4">
            {(['starter', 'growth', 'premium'] as const).map((plan) => {
              const data = planBreakdown[plan] ?? { count: 0, revenue: 0 }
              const pct = mrr > 0 ? (data.revenue / mrr) * 100 : 0
              const colors: Record<string, string> = {
                starter: 'bg-sky-500',
                growth:  'bg-violet-500',
                premium: 'bg-amber-500',
              }
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-sm font-medium text-gray-800 capitalize">{plan}</span>
                      <span className="text-xs text-gray-400 ml-2">({data.count} vendors · R{PLAN_PRICES[plan]}/mo)</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{formatCurrency(data.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`${colors[plan]} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            <div className="pt-3 border-t border-gray-100 flex justify-between">
              <span className="font-semibold text-gray-800">Total MRR</span>
              <span className="font-black text-emerald-600 text-lg">{formatCurrency(mrr)}</span>
            </div>
          </div>
        </div>

        {/* Revenue trend chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-[#0D3B2E] mb-4">Revenue Trend (Last 6 Months)</h3>
          <div className="flex items-end gap-2 h-36">
            {monthlyRevenue.map((m) => {
              const height = maxMonthly > 0 ? Math.max((m.revenue / maxMonthly) * 100, m.revenue > 0 ? 8 : 4) : 4
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">{m.revenue > 0 ? formatCurrency(m.revenue) : '—'}</span>
                  <div
                    className="w-full rounded-t-lg bg-[#2ECC8E] transition-all"
                    style={{ height: `${height}%` }}
                    title={`${m.month}: ${formatCurrency(m.revenue)}`}
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap">{m.month}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">Based on recorded charge_success events</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor subscription table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-[#0D3B2E]">Active Subscriptions</h3>
            <p className="text-xs text-gray-400 mt-0.5">{activeVendors.length} vendors billing</p>
          </div>
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            {activeVendors.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No active subscriptions</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Vendor</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Plan</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">MRR</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 hidden sm:table-cell">Next Billing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeVendors.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <a href={`/admin/vendors/${v.id}`} className="font-medium text-[#0D3B2E] hover:text-[#2ECC8E] transition-colors">
                          {v.business_name}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-full bg-[#2ECC8E]/10 text-[#2ECC8E]">
                          {v.subscription_plan ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {formatCurrency(PLAN_PRICES[v.subscription_plan ?? 'starter'] ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs hidden sm:table-cell">
                        {v.subscription_next_billing ? formatDate(v.subscription_next_billing) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Billing log */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-[#0D3B2E]">Billing Log</h3>
            <p className="text-xs text-gray-400 mt-0.5">Latest 50 events</p>
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {(!events || events.length === 0) ? (
              <p className="text-sm text-gray-400 text-center py-8">No billing events recorded</p>
            ) : (
              events.map((event) => {
                const isSuccess = event.event_type === 'charge_success'
                const isFailed = event.event_type === 'charge_failed'
                return (
                  <div key={event.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          isFailed  ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {event.event_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{event.vendors?.business_name ?? 'Unknown'} · {formatDate(event.created_at)}</p>
                    </div>
                    {event.amount != null && (
                      <span className={`text-sm font-bold ${isSuccess ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {formatCurrency(event.amount)}
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
