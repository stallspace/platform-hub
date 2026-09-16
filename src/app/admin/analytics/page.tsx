// Reads live traffic data, so it must never be statically rendered.
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TrafficChart from '@/components/admin/TrafficChart'
import { Eye, Users, Store, Package } from 'lucide-react'

export const metadata = { title: 'Analytics | Stallspace Admin' }

interface DailyRow { day: string; visitors: number; views: number }
interface StoreRow {
  vendor_id: string
  business_name: string
  slug: string
  store_views: number
  product_views: number
  visitors: number
}

const RANGES = [7, 30, 90]

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: { days?: string }
}) {
  const days = RANGES.includes(Number(searchParams.days)) ? Number(searchParams.days) : 30
  const supabase = await createClient()

  const since = new Date(Date.now() - days * 86_400_000).toISOString()

  const [
    { data: daily },
    { data: stores },
    { count: totalViews },
    { data: sessionRows },
    { data: topProducts },
  ] = await Promise.all([
    supabase.rpc('admin_daily_traffic', { p_days: days }),
    supabase.rpc('admin_store_traffic', { p_days: days }),
    supabase.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('page_views').select('session_id').gte('created_at', since).limit(50_000),
    supabase
      .from('product_views')
      .select('product_id, products(name, slug)')
      .gte('created_at', since)
      .limit(10_000),
  ])

  const dailyRows = (daily ?? []) as DailyRow[]
  const storeRows = (stores ?? []) as StoreRow[]

  const uniqueVisitors = new Set((sessionRows ?? []).map(r => r.session_id)).size

  // Count product views per product in the app — there is no RPC for it and
  // the volume at this stage is small.
  const productTally = new Map<string, { name: string; slug: string; views: number }>()
  for (const row of (topProducts ?? []) as { product_id: string; products: { name: string; slug: string } | { name: string; slug: string }[] | null }[]) {
    const p = Array.isArray(row.products) ? row.products[0] : row.products
    if (!p) continue
    const existing = productTally.get(row.product_id)
    if (existing) existing.views++
    else productTally.set(row.product_id, { name: p.name, slug: p.slug, views: 1 })
  }
  const topProductRows = [...productTally.values()].sort((a, b) => b.views - a.views).slice(0, 8)

  const storesWithVisits = storeRows.filter(s => s.visitors > 0)
  const totalStoreVisits = storeRows.reduce((sum, s) => sum + Number(s.store_views) + Number(s.product_views), 0)

  const tiles = [
    { label: 'Visitors', value: uniqueVisitors, sub: 'unique sessions', icon: Users },
    { label: 'Page views', value: totalViews ?? 0, sub: 'across the marketplace', icon: Eye },
    { label: 'Stores visited', value: `${storesWithVisits.length} of ${storeRows.length}`, sub: 'had at least one visit', icon: Store },
    { label: 'Store visits', value: totalStoreVisits, sub: 'storefront + product pages', icon: Package },
  ]

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Anonymous session counts — no cookies, no IP addresses, nothing that identifies a person.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {RANGES.map(r => (
            <Link
              key={r}
              href={`/admin/analytics?days=${r}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                days === r ? 'bg-white text-[#0D3B2E] shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {r} days
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {tiles.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
            <Icon className="w-4 h-4 text-[#2ECC8E] mb-2.5" />
            <div className="text-2xl font-bold text-gray-900 tabular-nums">
              {typeof value === 'number' ? value.toLocaleString('en-ZA') : value}
            </div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
            <div className="text-xs text-gray-400">{sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Visitors per day</h2>
        <TrafficChart data={dailyRows} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Stores by visits</h2>
            <p className="text-xs text-gray-400 mt-0.5">Storefront and product pages together</p>
          </div>
          {storeRows.length === 0 ? (
            <p className="text-sm text-gray-400 p-5">No approved stores yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-400 text-left">
                  <tr className="border-b border-gray-50">
                    <th className="px-5 py-2 font-medium">Store</th>
                    <th className="px-3 py-2 font-medium text-right">Visitors</th>
                    <th className="px-3 py-2 font-medium text-right">Store</th>
                    <th className="px-5 py-2 font-medium text-right">Products</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {storeRows.map(s => (
                    <tr key={s.vendor_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                      <td className="px-5 py-2.5">
                        <Link href={`/marketplace/store/${s.slug}`} className="font-medium text-[#0D3B2E] hover:text-[#2ECC8E]">
                          {s.business_name}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{s.visitors}</td>
                      <td className="px-3 py-2.5 text-right text-gray-500">{s.store_views}</td>
                      <td className="px-5 py-2.5 text-right text-gray-500">{s.product_views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Most viewed products</h2>
            <p className="text-xs text-gray-400 mt-0.5">Last {days} days</p>
          </div>
          {topProductRows.length === 0 ? (
            <p className="text-sm text-gray-400 p-5">No product views in this period.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {topProductRows.map(p => (
                <div key={p.slug} className="px-5 py-2.5 flex items-center justify-between gap-3">
                  <Link href={`/marketplace/products/${p.slug}`} className="text-sm font-medium text-[#0D3B2E] hover:text-[#2ECC8E] truncate">
                    {p.name}
                  </Link>
                  <span className="text-sm font-semibold text-gray-900 tabular-nums flex-shrink-0">{p.views}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
