'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag, Search, ChevronDown, Check, X, Loader2 } from 'lucide-react'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  total: number
  status: string
  created_at: string
  items: Array<{ product_name: string; quantity: number; unit_price: number }>
  shipping_address: { line1: string; city: string; province: string; postal_code: string } | null
}

interface Props {
  orders: Order[]
  vendorId: string
}

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
  shipped: 'bg-indigo-100 text-indigo-700',
}

export default function OrdersClient({ orders: initial, vendorId }: Props) {
  const supabase = createClient()
  const [orders, setOrders] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = orders.filter(o => {
    const matchSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) || o.customer_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  async function updateStatus(orderId: string, status: string) {
    setUpdating(true)
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId)
    if (error) { showToast('Failed to update status'); setUpdating(false); return }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    if (selected?.id === orderId) setSelected(prev => prev ? { ...prev, status } : prev)
    showToast('Order status updated')
    setUpdating(false)
  }

  return (
    <div>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg">{toast}</div>}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} total orders</p>
        </div>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent/30">
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      <div className="flex gap-6 h-[calc(100vh-220px)]">
        <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
          {filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
              <ShoppingBag className="w-10 h-10 opacity-30" />
              <p className="text-sm">No orders found</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Order</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Customer</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Total</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(order => (
                    <tr key={order.id} onClick={() => setSelected(order)} className={"cursor-pointer hover:bg-gray-50 transition-colors " + (selected?.id === order.id ? 'bg-blue-50' : '')}>
                      <td className="px-4 py-3 text-sm font-medium text-brand-accent">{order.order_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{order.customer_name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">R {Number(order.total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3"><span className={"text-xs px-2 py-1 rounded-full font-medium " + (STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600')}>{order.status}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('en-ZA')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {selected && (
          <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{selected.order_number}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Customer</p>
                <p className="text-sm font-medium text-gray-900">{selected.customer_name}</p>
                <p className="text-xs text-gray-500">{selected.customer_email}</p>
                {selected.customer_phone && <p className="text-xs text-gray-500">{selected.customer_phone}</p>}
              </div>
              {selected.shipping_address && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Shipping Address</p>
                  <p className="text-xs text-gray-700">{selected.shipping_address.line1}, {selected.shipping_address.city}, {selected.shipping_address.province} {selected.shipping_address.postal_code}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-2">Items</p>
                <div className="space-y-1">
                  {selected.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{item.product_name} x{item.quantity}</span>
                      <span className="font-medium text-gray-900">R {Number(item.unit_price * item.quantity).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between text-sm">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">R {Number(selected.total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Update Status</p>
                <div className="space-y-1">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)} disabled={updating || selected.status === s} className={"w-full text-left text-xs px-3 py-2 rounded-lg flex items-center justify-between transition-colors " + (selected.status === s ? 'bg-brand-navy text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100')}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
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
