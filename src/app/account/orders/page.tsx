import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, ChevronRight, Clock, CheckCircle2, Truck, XCircle, RefreshCw } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-700', icon: <Clock       className="w-3.5 h-3.5" /> },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-100 text-blue-700',    icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700',    icon: <RefreshCw    className="w-3.5 h-3.5" /> },
  shipped:    { label: 'Shipped',    color: 'bg-purple-100 text-purple-700', icon: <Truck       className="w-3.5 h-3.5" /> },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-700',  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700',      icon: <XCircle      className="w-3.5 h-3.5" /> },
  refunded:   { label: 'Refunded',   color: 'bg-gray-100 text-gray-700',    icon: <RefreshCw    className="w-3.5 h-3.5" /> },
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/account/orders')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, order_number, status, total, created_at,
      items, payment_provider,
      vendor:vendors(business_name, slug)
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">My Orders</h1>
        <p className="text-gray-500 text-sm mt-1">
          {orders?.length ?? 0} order{(orders?.length ?? 0) !== 1 ? 's' : ''} placed
        </p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No orders yet</h3>
          <p className="text-gray-500 text-sm mb-5">When you place orders they will appear here.</p>
          <Link
            href="/marketplace/products"
            className="inline-flex items-center gap-2 bg-brand-accent text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['pending']
            const items = order.items as { product_name: string; quantity: number; unit_price: number; product_image: string | null }[]
            const itemCount = items?.reduce((sum: number, i: any) => sum + i.quantity, 0) ?? 0

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
                {/* Order header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Order #{order.order_number}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {order.vendor && (
                          <> · <Link href={`/marketplace/store/${order.vendor.slug}`} className="hover:text-brand-accent transition-colors">{order.vendor.business_name}</Link></>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                      {status.icon}
                      {status.label}
                    </span>
                    <span className="font-bold text-brand-navy text-sm">
                      R{Number(order.total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Order items preview */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {(items ?? []).slice(0, 3).map((item: any, i: number) => (
                        <div key={i} className="w-10 h-10 rounded-lg border-2 border-white bg-gray-100 overflow-hidden flex-shrink-0">
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-300" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">
                        {items?.[0]?.product_name ?? 'Order items'}
                        {itemCount > 1 && <span className="text-gray-400"> +{itemCount - 1} more</span>}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
