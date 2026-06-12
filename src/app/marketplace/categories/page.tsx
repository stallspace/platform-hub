import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Laptop, Shirt, Home, Leaf, ShoppingBag, Dumbbell,
  Palette, PawPrint, Package, ChevronRight, LayoutGrid
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  electronics: <Laptop    className="w-6 h-6" />,
  fashion:     <Shirt     className="w-6 h-6" />,
  home:        <Home      className="w-6 h-6" />,
  health:      <Leaf      className="w-6 h-6" />,
  food:        <ShoppingBag className="w-6 h-6" />,
  sports:      <Dumbbell  className="w-6 h-6" />,
  arts:        <Palette   className="w-6 h-6" />,
  pet:         <PawPrint  className="w-6 h-6" />,
}

function getCategoryIcon(slug: string): React.ReactNode {
  const match = Object.keys(CATEGORY_ICONS).find(k => slug.includes(k))
  return match ? CATEGORY_ICONS[match] : <Package className="w-6 h-6" />
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, description, product_count')
    .order('sort_order')

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
            <Link href="/marketplace" className="hover:text-brand-mint transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-600">Categories</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-forest flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-forest">All Categories</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {categories?.length ?? 0} categories across the marketplace
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!categories || categories.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No categories found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/marketplace/products?category=${cat.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 p-6
                           hover:border-brand-mint hover:shadow-md transition-all duration-200"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-brand-mint flex items-center justify-center mb-4
                                group-hover:bg-brand-mint group-hover:text-white transition-colors">
                  {getCategoryIcon(cat.slug)}
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-brand-mint transition-colors mb-1">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{cat.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {cat.product_count ?? 0} product{(cat.product_count ?? 0) !== 1 ? 's' : ''}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-mint transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
