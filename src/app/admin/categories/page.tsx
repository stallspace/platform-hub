import { createClient } from '@/lib/supabase/server'
import CategoriesClient from '@/components/admin/CategoriesClient'

export const dynamic = 'force-dynamic'

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  parent_id: string | null
  sort_order: number
  created_at: string
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  // Product counts per category
  const { data: productCounts } = await supabase
    .from('products')
    .select('category_id')

  const countMap: Record<string, number> = {}
  if (productCounts) {
    for (const row of productCounts) {
      countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1F44]">Categories</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage marketplace product categories.</p>
        </div>
      </div>

      <CategoriesClient
        categories={(categories as Category[]) ?? []}
        productCounts={countMap}
      />

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error loading categories: {error.message}</p>
        </div>
      )}
    </div>
  )
}
