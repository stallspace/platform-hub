import { createClient } from '@/lib/supabase/server'
import ProductModerationClient from '@/components/admin/ProductModerationClient'

export const dynamic = 'force-dynamic'

export type AdminProduct = {
  id: string
  name: string
  price: number
  images: string[]
  is_available: boolean
  is_archived: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  vendor_id: string
  category_id: string
  view_count: number
  vendors: { business_name: string; status: string } | null
  categories: { name: string } | null
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string }
}) {
  const supabase = await createClient()

  const filter   = searchParams.status ?? 'available'
  const search   = searchParams.search ?? ''

  let query = supabase
    .from('products')
    .select('id, name, price, images, is_available, is_archived, is_featured, created_at, updated_at, vendor_id, category_id, view_count, vendors(business_name, status), categories(name)')
    .order('created_at', { ascending: false })

  if (filter === 'available')   query = query.eq('is_available', true).eq('is_archived', false)
  if (filter === 'unavailable') query = query.eq('is_available', false).eq('is_archived', false)
  if (filter === 'archived')    query = query.eq('is_archived', true)
  if (filter === 'featured')    query = query.eq('is_featured', true)

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data: products, error } = await query.limit(100)

  // Counts for tabs
  const { data: allProducts } = await supabase
    .from('products')
    .select('is_available, is_archived, is_featured')

  const counts = {
    available:   (allProducts ?? []).filter((p) => p.is_available && !p.is_archived).length,
    unavailable: (allProducts ?? []).filter((p) => !p.is_available && !p.is_archived).length,
    archived:    (allProducts ?? []).filter((p) => p.is_archived).length,
    featured:    (allProducts ?? []).filter((p) => p.is_featured).length,
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0A1F44]">Product Management</h1>
        <p className="text-gray-500 mt-1 text-sm">Monitor, moderate and manage all marketplace products.</p>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Available',   key: 'available',   color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Unavailable', key: 'unavailable', color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100' },
          { label: 'Archived',    key: 'archived',    color: 'text-gray-600',    bg: 'bg-gray-50 border-gray-200' },
          { label: 'Featured',    key: 'featured',    color: 'text-[#1D4ED8]',   bg: 'bg-blue-50 border-blue-100' },
        ].map((s) => (
          <div key={s.key} className={`${s.bg} border rounded-xl p-4`}>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.color}`}>{counts[s.key as keyof typeof counts]}</p>
          </div>
        ))}
      </div>

      <ProductModerationClient
        products={(products as AdminProduct[]) ?? []}
        activeFilter={filter}
        counts={counts}
        searchQuery={search}
      />

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error: {error.message}</p>
        </div>
      )}
    </div>
  )
}
