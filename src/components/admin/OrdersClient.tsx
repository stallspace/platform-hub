'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { AdminOrder } from '@/app/admin/orders/page'

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  confirmed:  'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-violet-50 text-violet-700 border-violet-200',
  shipped:    'bg-sky-50 text-sky-700 border-sky-200',
  delivered:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled:  'bg-red-50 text-red-700 border-red-200',
  refunded:   'bg-gray-100 text-gray-600 border-gray-200',
}

const STATUS_TABS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

type OrderItem = {
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  variant: string | null
}

type ShippingAddress = {
  line1?: string
  line2?: string
  city?: string
  province?: string
  country?: string
  postal_code?: string
  [key: string]: string | undefined
}

function fmt(n: number) {
  return `R ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatShipping(addr: ShippingAddress | null): string {
  if (!addr) return '—'
  return [addr.line1, addr.line2, addr.city, addr.province, addr.postal_code, addr.country]
    .filter((v) => v && v !== 'true' && v !== 'false')
    .join(', ')
}

type Vendor = { id: string; business_name: string }

type Props = {
  orders: AdminOrder[]
  vendors: Vendor[]
  statusCounts: Record<string, number>
  platformTotal: number
  productNames: Record<string, string>
  activeVendor: string
  activeStatus: string
  fromFilter: string
  toFilter: string
  searchQuery: string
}

export default function OrdersClient({
  orders, vendors, statusCounts, platformTotal, productNames,
  activeVendor, activeStatus, fromFilter, toFilter, searchQuery,
}: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [selected, setSelected] = useState<AdminOrder | null>(null)
  const [search, setSearch] = useState(searchQuery)

  function push(overrides: Record<string, string>) {
    const merged = { vendor: activeVendor, status: activeStatus, from: fromFilter, to: toFilter, search: searchQuery, ...overrides }
    const sp = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => { if (v && v !== 'all') sp.set(k, v) })
    startTransition(() => router.push(`${pathname}?${sp.toString()}`))
  }

  function exportCsv() {
    const header = ['Order #', 'Date', 'Vendor', 'Customer', 'Email', 'Phone', 'Status', 'Subtotal', 'Total', 'Payment Provider', 'Payment Ref']
    const rows = orders.map((o) => [
      o.order_number, fmtDate(o.created_at), o.vendor_name,
      o.customer_name ?? '', o.customer_email ?? '', o.customer_phone ?? '',
      o.status, o.subtotal, o.total,
      o.payment_provider ?? '', o.payment_reference ?? '',
    ])
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `Stallspace-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const shownTotal = orders.reduce((s, o) => s + Number(o.total ?? 0), 0)
  const hasFilters = activeVendor !== 'all' || activeStatus !== 'all' || !!fromFilter || !!toFilter || !!searchQuery

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Search + tabs */}
        <div className="border-b border-gray-100 px-5 pt-5">
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') push({ search }) }}
                placeholder="Order #, customer, email, reference…"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2ECC8E] transition-colors"
              />
              {search && (
                <button onClick={() => { setSearch(''); push({ search: '' }) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            <select value={activeVendor} onChange={(e) => push({ vendor: e.target.value })}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#2ECC8E] bg-white">
              <option value="all">All Vendors</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.business_name}</option>)}
            </select>

            <input type="date" value={fromFilter} onChange={(e) => push({ from: e.target.value })}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#2ECC8E]" />
            <input type="date" value={toFilter} onChange={(e) => push({ to: e.target.value })}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#2ECC8E]" />

            {hasFilters && (
              <button onClick={() => { setSearch(''); push({ vendor: 'all', status: 'all', from: '', to: '', search: '' }) }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Clear
              </button>
            )}

            <button onClick={exportCsv}
              className="ml-auto flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg bg-[#0D3B2E] text-white hover:bg-[#0D3B2E]/90 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export CSV
            </button>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-px">
            {STATUS_TABS.map((s) => {
              const count = s === 'all' ? Object.values(statusCounts).reduce((a, b) => a + b, 0) : (statusCounts[s] ?? 0)
              const active = activeStatus === s
              return (
                <button key={s} onClick={() => push({ status: s })}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap border-b-2 transition-all capitalize ${active ? 'border-[#2ECC8E] text-[#2ECC8E]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {s === 'all' ? 'All' : s}
                  {count > 0 && (
                    <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${active ? 'bg-[#2ECC8E]/10 text-[#2ECC8E]' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Table */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No orders found</p>
            <p className="text-gray-400 text-sm mt-1">{hasFilters ? 'Try adjusting your filters.' : 'No orders have been placed yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Vendor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#0D3B2E]">{o.order_number}</p>
                      {o.payment_reference && <p className="text-xs text-gray-400 mt-0.5">{o.payment_reference}</p>}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-gray-700 font-medium">{o.vendor_name}</td>
                    <td className="px-5 py-4">
                      <p className="text-gray-800">{o.customer_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{o.customer_email ?? ''}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[o.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">{fmt(o.total)}</td>
                    <td className="px-5 py-4 hidden lg:table-cell text-gray-500 text-xs whitespace-nowrap">{fmtDate(o.created_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => setSelected(o)}
                        className="text-gray-400 hover:text-[#2ECC8E] transition-colors p-1.5 rounded-lg hover:bg-blue-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {orders.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <p className="text-xs text-gray-400">{orders.length} order{orders.length !== 1 ? 's' : ''} shown</p>
            <div className="flex items-center gap-4">
              {hasFilters && <span className="text-xs text-gray-400">Filtered: <span className="font-semibold text-gray-700">{fmt(shownTotal)}</span></span>}
              <span className="text-xs text-gray-400">Platform total: <span className="font-semibold text-gray-700">{fmt(platformTotal)}</span></span>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-[#0D3B2E]">Order {selected.order_number}</h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status + date */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border capitalize ${STATUS_STYLES[selected.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {selected.status}
                </span>
                <span className="text-sm text-gray-400">{fmtDateTime(selected.created_at)}</span>
              </div>

              {/* Vendor + Customer */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Vendor</p>
                  <p className="text-sm font-semibold text-gray-800">{selected.vendor_name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer</p>
                  <p className="text-sm font-semibold text-gray-800">{selected.customer_name ?? '—'}</p>
                  {selected.customer_email && <p className="text-xs text-gray-400 mt-0.5">{selected.customer_email}</p>}
                  {selected.customer_phone && <p className="text-xs text-gray-400">{selected.customer_phone}</p>}
                </div>
              </div>

              {/* Items */}
              {selected.items && Array.isArray(selected.items) && selected.items.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Items ({selected.items.length})</p>
                  <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                    {(selected.items as unknown as OrderItem[]).map((item, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{productNames[item.product_id] ?? item.product_id?.slice(0, 8) + '…'}</p>
                          {item.variant && <p className="text-xs text-gray-500 mt-0.5">Variant: {item.variant}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} × {fmt(item.unit_price)}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{fmt(item.total_price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-800">{fmt(selected.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
                  <span className="text-gray-800">Total</span>
                  <span className="text-[#0D3B2E]">{fmt(selected.total)}</span>
                </div>
              </div>

              {/* Payment */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Provider</span>
                    <span className="text-sm font-medium text-gray-800 capitalize">{selected.payment_provider ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Reference</span>
                    <span className="text-sm font-medium text-gray-800 font-mono">{selected.payment_reference ?? '—'}</span>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              {selected.shipping_address && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Shipping Address</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {formatShipping(selected.shipping_address as unknown as ShippingAddress)}
                  </p>
                </div>
              )}

              {/* Notes */}
              {selected.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</p>
                  <p className="text-sm text-gray-700">{selected.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
