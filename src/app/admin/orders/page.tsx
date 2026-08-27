import { createClient } from '@/lib/supabase/server'
import OrdersClient from '@/components/admin/OrdersClient'

export const dynamic = 'force-dynamic'

export type AdminOrder = {
  id: string
  order_number: string
  vendor_id: string
  vendor_name: string
  customer_id: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  shipping_address: Record<string, string> | null
  items: Array<{ product_id: string; quantity: number; unit_price: number; total_price: number; variant: string | null }> | null
  subtotal: number
  total: number
  status: string
  payment_provider: string | null
  payment_reference: string | null
  notes: string | null
  created_at: string
  updated_at: string | null
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { vendor?: string; status?: string; from?: string; to?: string; search?: string }
}) {
  const supabase = await createClient()

  const vendorFilter = searchParams.vendor ?? 'all'
  const statusFilter = searchParams.status ?? 'all'
  const fromFilter   = searchParams.from ?? ''
  const toFilter     = searchParams.to ?? ''
  const searchQuery  = searchParams.search ?? ''

  let query = supabase
    .from('orders')
    .select(`
      id, order_number, vendor_id, customer_id,
      customer_name, customer_email, customer_phone,
      shipping_address, items, subtotal, total,
      status, payment_provider, payment_reference,
      notes, created_at, updated_at,
      vendors ( business_name )
    `)
    .order('created_at', { ascending: false })

  if (vendorFilter !== 'all') query = query.eq('vendor_id', vendorFilter)
  if (statusFilter !== 'all') query = query.eq('status', statusFilter)
  if (fromFilter) query = query.gte('created_at', fromFilter)
  if (toFilter)   query = query.lte('created_at', toFilter + 'T23:59:59')
  if (searchQuery) query = query.or(`customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%,order_number.ilike.%${searchQuery}%,payment_reference.ilike.%${searchQuery}%`)

  // The filtered orders, the platform totals and the vendor list don't depend
  // on each other, so fetch them concurrently.
  const [
    { data: rows, error },
    { data: allOrders },
    { data: vendorRows },
  ] = await Promise.all([
    query,
    supabase.from('orders').select('status, total'),
    supabase.from('vendors').select('id, business_name').eq('status', 'approved').order('business_name'),
  ])

  const orders: AdminOrder[] = (rows ?? []).map((r: any) => ({
    ...r,
    vendor_name: r.vendors?.business_name ?? 'Unknown',
  }))

  // Collect all unique product_ids across all order items
  const productIds = [...new Set(
    orders.flatMap((o) => (o.items ?? []).map((item) => item.product_id)).filter(Boolean)
  )]

  // Fetch product names in one query
  const productNames: Record<string, string> = {}
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds)
    if (products) {
      for (const p of products) productNames[p.id] = p.name
    }
  }

  const statusCounts: Record<string, number> = {}
  let platformTotal = 0
  if (allOrders) {
    for (const o of allOrders) {
      statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1
      platformTotal += Number(o.total ?? 0)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0D3B2E]">Orders</h1>
        <p className="text-gray-500 mt-1 text-sm">All orders across every vendor on the platform.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: (allOrders?.length ?? 0).toLocaleString('en-ZA'), color: 'text-[#0D3B2E]',   bg: 'bg-white border-gray-100' },
          { label: 'Pending',      value: String(statusCounts['pending'] ?? 0),             color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100' },
          { label: 'Delivered',    value: String(statusCounts['delivered'] ?? 0),           color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Cancelled',    value: String(statusCounts['cancelled'] ?? 0),           color: 'text-red-600',     bg: 'bg-red-50 border-red-100' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <OrdersClient
        orders={orders}
        vendors={vendorRows ?? []}
        statusCounts={statusCounts}
        platformTotal={platformTotal}
        productNames={productNames}
        activeVendor={vendorFilter}
        activeStatus={statusFilter}
        fromFilter={fromFilter}
        toFilter={toFilter}
        searchQuery={searchQuery}
      />

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error loading orders: {error.message}</p>
        </div>
      )}
    </div>
  )
}
