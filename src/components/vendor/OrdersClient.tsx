'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag, Search, X, Check } from 'lucide-react'

interface OrderItem {
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  variant: string | null
}

interface ShippingAddress {
  line1?: string
  line2?: string
  city?: string
  province?: string
  postal_code?: string
  country?: string
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  total: number
  status: string
  created_at: string
  items: OrderItem[] | null
  shipping_address: ShippingAddress | null
}

interface Props {
  orders: Order[]
  vendorId: string
  productNames: Record<string, string>
}

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-violet-100 text-violet-700',
  shipped:    'bg-sky-100 text-sky-700',
  delivered:  'bg-emerald-100 text-emerald-700',
  cancelled:  'bg-red-100 text-red-700',
}

const STATUS_NEXT: Record<string, string> = {
  pending:    'Confirm order',
  confirmed:  'Mark processing',
  processing: 'Mark shipped',
  shipped:    'Mark delivered',
  delivered:  '',
  cancelled:  '',
}

const STATUS_FLOW: Record<string, string> = {
  pending:    'confirmed',
  confirmed:  'processing',
  processing: 'shipped',
  shipped:    'delivered',
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

export default function OrdersClient({ orders: initial, vendorId, productNames }: Props) {
  const supabase = createClient()
  const [orders, setOrders] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null)

  function showToast(text: string, ok = true) {
    setToast({ text, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = orders.filter((o) => {
    const matchSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) || o.customer_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  async function updateStatus(orderId: string, status: string) {
    setUpdating(true)
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId)
    if (error) { showToast('Failed to update status', false); setUpdating(false); return }
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o))
    setSelected((prev) => prev?.id === orderId ? { ...prev, status } : prev)
    showToast('Status updated successfully')
    setUpdating(false)
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${toast.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {toast.ok
            ? <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            : <X className="w-4 h-4 text-red-500 flex-shrink-0" />}
          {toast.text}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} total order{orders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by order # or customer…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2ECC8E] transition-colors" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#2ECC8E] bg-white">
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Orders table */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
          {filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
              <ShoppingBag className="w-10 h-10 opacity-30" />
              <p className="text-sm">No orders found</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Order</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Customer</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Total</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((order) => (
                    <tr key={order.id} onClick={() => setSelected(order)}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === order.id ? 'bg-blue-50/60' : ''}`}>
                      <td className="px-4 py-3 text-sm font-semibold text-[#2ECC8E]">{order.order_number}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-800">{order.customer_name}</p>
                        <p className="text-xs text-gray-400">{order.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{fmt(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order detail panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selected.order_number}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(selected.created_at)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Status badge */}
              <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_STYLES[selected.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {selected.status}
              </span>

              {/* Customer */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Customer</p>
                <p className="text-sm font-medium text-gray-900">{selected.customer_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{selected.customer_email}</p>
                {selected.customer_phone && <p className="text-xs text-gray-500">{selected.customer_phone}</p>}
              </div>

              {/* Shipping */}
              {selected.shipping_address && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Shipping Address</p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {[selected.shipping_address.line1, selected.shipping_address.line2, selected.shipping_address.city, selected.shipping_address.province, selected.shipping_address.postal_code, selected.shipping_address.country]
                      .filter((v) => v && v !== 'true' && v !== 'false').join(', ')}
                  </p>
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Items</p>
                <div className="space-y-2">
                  {(selected.items ?? []).map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-gray-800 font-medium">{productNames[item.product_id] ?? 'Unknown product'}</p>
                        {item.variant && <p className="text-xs text-gray-400">Variant: {item.variant}</p>}
                        <p className="text-xs text-gray-400">Qty: {item.quantity} × {fmt(item.unit_price)}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 flex-shrink-0">{fmt(item.total_price)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-sm font-bold text-[#0D3B2E]">{fmt(selected.total)}</span>
                </div>
              </div>

              {/* Quick advance button */}
              {STATUS_FLOW[selected.status] && (
                <button
                  onClick={() => updateStatus(selected.id, STATUS_FLOW[selected.status])}
                  disabled={updating}
                  className="w-full py-2.5 rounded-lg bg-[#0D3B2E] text-white text-sm font-semibold hover:bg-[#0D3B2E]/90 transition-colors disabled:opacity-50">
                  {updating ? 'Updating…' : STATUS_NEXT[selected.status]}
                </button>
              )}

              {/* All status options */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Set Status</p>
                <div className="space-y-1">
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)} disabled={updating || selected.status === s}
                      className={`w-full text-left text-xs px-3 py-2 rounded-lg flex items-center justify-between transition-colors capitalize ${selected.status === s ? 'bg-[#0D3B2E] text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-40'}`}>
                      {s}
                      {selected.status === s && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
