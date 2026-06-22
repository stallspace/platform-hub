import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Search, SlidersHorizontal, Package, Star, ChevronRight,
  ShieldCheck, MapPin, X, ArrowUpDown
} from 'lucide-react'
import type { Product, Category, Vendor } from '@/types'
import ProductCard from '@/components/marketplace/ProductCard'

interface PageProps {
  searchParams: {
    q?: string
    category?: string
    vendor?: string
    min_price?: string
    max_price?: string
    in_stock?: string
    sort?: string
    page?: string
  }
}

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular',    label: 'Most Popular' },
]

const PER_PAGE = 24

export const metadata: Metadata = {
  title: 'All Products',
  description: 'Browse thousands of products from trusted local vendors. Compare prices and shop with confidence.',
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const q         = searchParams.q?.trim() ?? ''
  const category  = searchParams.category ?? ''
  const vendorSlug = searchParams.vendor ?? ''
  const minPrice  = searchParams.min_price ? Number(searchParams.min_price) : null
  const maxPrice  = searchParams.max_price ? Number(searchParams.max_price) : null
  const inStock   = searchParams.in_stock === 'true'
  const sort      = searchParams.sort ?? 'newest'
  const page      = Math.max(1, Number(searchParams.page ?? 1))
  const from      = (page - 1) * PER_PAGE
  const to        = from + PER_PAGE - 1

  // Fetch categories for sidebar
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, product_count')
    .order('sort_order')

  // Build products query
  let query = supabase
    .from('products')
    .select(`
      id, name, slug, price, compare_at_price, images,
      is_featured, track_inventory, stock_quantity, is_available,
      view_count, created_at,
      vendor:vendors(id, business_name, slug, city, status),
      category:categories(id, name, slug)
    `, { count: 'exact' })
    .eq('is_available', true)
    .eq('is_archived', false)
    .eq('vendors.status', 'approved')

  // Text search using FTS
  if (q) {
    query = query.textSearch('name', q, { type: 'websearch', config: 'english' })
  }

  // Category filter
  if (category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  // Vendor filter
  if (vendorSlug) {
    const { data: v } = await supabase
      .from('vendors')
      .select('id')
      .eq('slug', vendorSlug)
      .single()
    if (v) query = query.eq('vendor_id', v.id)
  }

  // Price filters
  if (minPrice !== null) query = query.gte('price', minPrice)
  if (maxPrice !== null) query = query.lte('price', maxPrice)

  // Stock filter
  if (inStock) {
    query = query.or('track_inventory.eq.false,stock_quantity.gt.0')
  }

  // Sorting
  if (sort === 'price_asc')  query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else if (sort === 'popular')    query = query.order('view_count', { ascending: false })
  else                            query = query.order('created_at', { ascending: false })

  // Pagination
  query = query.range(from, to)

  const { data: products, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  // Active filter count for badge
  const activeFilters = [
    q, category, vendorSlug,
    minPrice !== null ? 'min' : '', maxPrice !== null ? 'max' : '',
    inStock ? 'stock' : ''
  ].filter(Boolean).length

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = {
      q: q || undefined,
      category: category || undefined,
      vendor: vendorSlug || undefined,
      min_price: minPrice !== null ? String(minPrice) : undefined,
      max_price: maxPrice !== null ? String(maxPrice) : undefined,
      in_stock: inStock ? 'true' : undefined,
      sort: sort !== 'newest' ? sort : undefined,
      ...overrides,
    }
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, v)
    })
    const str = params.toString()
    return str ? `/marketplace/products?${str}` : '/marketplace/products'
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-brand-forest">
                {q ? `Results for "${q}"` : category ? (categories?.find(c => c.slug === category)?.name ?? 'Products') : 'All Products'}
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {count ?? 0} product{(count ?? 0) !== 1 ? 's' : ''} found
              </p>
            </div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm text-gray-400">
              <Link href="/marketplace" className="hover:text-brand-mint">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-600">Products</span>
              {category && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-gray-600">{categories?.find(c => c.slug === category)?.name}</span>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── SIDEBAR ────────────────────────────────────── */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </div>
                {activeFilters > 0 && (
                  <Link
                    href="/marketplace/products"
                    className="text-xs text-red-500 hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear all
                  </Link>
                )}
              </div>

              {/* Search */}
              <form action="/marketplace/products" method="GET" className="mb-5">
                {category && <input type="hidden" name="category" value={category} />}
                {sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    name="q"
                    defaultValue={q}
                    placeholder="Search products..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mint"
                  />
                </div>
              </form>

              {/* Price range */}
              <form action="/marketplace/products" method="GET" className="mb-5">
                {q && <input type="hidden" name="q" value={q} />}
                {category && <input type="hidden" name="category" value={category} />}
                {sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
                {inStock && <input type="hidden" name="in_stock" value="true" />}
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Price Range</h4>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    name="min_price"
                    defaultValue={minPrice ?? ''}
                    placeholder="Min"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mint"
                  />
                  <span className="text-gray-400 text-sm flex-shrink-0">—</span>
                  <input
                    type="number"
                    name="max_price"
                    defaultValue={maxPrice ?? ''}
                    placeholder="Max"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-mint"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-brand-forest text-white text-xs font-semibold rounded-lg hover:bg-blue-900 transition-colors">
                  Apply
                </button>
              </form>

              {/* Categories */}
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Category</h4>
                <div className="space-y-1">
                  <Link
                    href={buildUrl({ category: undefined, page: undefined })}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${!category ? 'bg-brand-mint/10 text-brand-mint font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    All Categories
                  </Link>
                  {(categories ?? []).map((cat) => (
                    <Link
                      key={cat.slug}
                      href={buildUrl({ category: cat.slug, page: undefined })}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${category === cat.slug ? 'bg-brand-mint/10 text-brand-mint font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span>{cat.name}</span>
                      {cat.product_count !== undefined && (
                        <span className="text-xs text-gray-400">{cat.product_count}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Availability</h4>
                <Link
                  href={buildUrl({ in_stock: inStock ? undefined : 'true', page: undefined })}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${inStock ? 'bg-brand-mint/10 text-brand-mint font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${inStock ? 'bg-brand-mint border-brand-mint' : 'border-gray-300'}`}>
                    {inStock && <X className="w-2.5 h-2.5 text-white" />}
                  </div>
                  In Stock Only
                </Link>
              </div>
            </div>
          </aside>

          {/* ── MAIN GRID ──────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-5 bg-white rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-auto">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort by:
              </div>
              <div className="flex items-center gap-1">
                {SORT_OPTIONS.map((opt) => (
                  <Link
                    key={opt.value}
                    href={buildUrl({ sort: opt.value, page: undefined })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sort === opt.value ? 'bg-brand-forest text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilters > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {q && (
                  <Link href={buildUrl({ q: undefined, page: undefined })} className="inline-flex items-center gap-1 bg-blue-50 text-brand-mint text-xs px-3 py-1 rounded-full hover:bg-blue-100">
                    Search: {q} <X className="w-3 h-3" />
                  </Link>
                )}
                {category && (
                  <Link href={buildUrl({ category: undefined, page: undefined })} className="inline-flex items-center gap-1 bg-blue-50 text-brand-mint text-xs px-3 py-1 rounded-full hover:bg-blue-100">
                    {categories?.find(c => c.slug === category)?.name} <X className="w-3 h-3" />
                  </Link>
                )}
                {minPrice !== null && (
                  <Link href={buildUrl({ min_price: undefined, page: undefined })} className="inline-flex items-center gap-1 bg-blue-50 text-brand-mint text-xs px-3 py-1 rounded-full hover:bg-blue-100">
                    From R{minPrice} <X className="w-3 h-3" />
                  </Link>
                )}
                {maxPrice !== null && (
                  <Link href={buildUrl({ max_price: undefined, page: undefined })} className="inline-flex items-center gap-1 bg-blue-50 text-brand-mint text-xs px-3 py-1 rounded-full hover:bg-blue-100">
                    Up to R{maxPrice} <X className="w-3 h-3" />
                  </Link>
                )}
                {inStock && (
                  <Link href={buildUrl({ in_stock: undefined, page: undefined })} className="inline-flex items-center gap-1 bg-blue-50 text-brand-mint text-xs px-3 py-1 rounded-full hover:bg-blue-100">
                    In Stock <X className="w-3 h-3" />
                  </Link>
                )}
              </div>
            )}

            {/* Empty state */}
            {!products || products.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-500 text-sm mb-4">Try adjusting your filters or search terms.</p>
                <Link href="/marketplace/products" className="text-brand-mint text-sm font-medium hover:underline">
                  Clear all filters
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product: any) => {
                    const discount = (product.compare_at_price && Number(product.compare_at_price) > Number(product.price))
                      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                      : null
                    const outOfStock = product.track_inventory && (product.stock_quantity ?? 0) <= 0

                    return (
                      <div key={product.id} className="card group overflow-hidden">
                        <div className="relative aspect-square bg-gray-50 overflow-hidden">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-gray-200" />
                            </div>
                          )}
                          {discount && (
                            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                              -{discount}%
                            </span>
                          )}
                          {product.is_featured && (
                            <span className="absolute top-2 right-2 bg-brand-mint text-white text-xs font-semibold px-2 py-0.5 rounded-md">
                              Featured
                            </span>
                          )}
                          {outOfStock && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          {product.vendor && (
                            <Link
                              href={`/marketplace/store/${product.vendor.slug}`}
                              className="text-xs text-brand-mint font-medium hover:underline"
                            >
                              {product.vendor.business_name}
                            </Link>
                          )}
                          <Link href={`/marketplace/products/${product.slug}`}>
                            <h3 className="text-sm font-semibold text-gray-900 mt-1 mb-2 line-clamp-2 hover:text-brand-mint transition-colors leading-snug">
                              {product.name}
                            </h3>
                          </Link>
                          {product.vendor?.city && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                              <MapPin className="w-3 h-3" />
                              {product.vendor.city}
                            </div>
                          )}
                          <div className="mt-auto pt-2">
                            <div className="mb-2">
                              <span className="font-bold text-brand-forest text-base">
                                R{Number(product.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                              </span>
                              {(product.compare_at_price && Number(product.compare_at_price) > Number(product.price)) && (
                                <span className="text-xs text-gray-400 line-through ml-1.5 block">
                                  Was R{Number(product.compare_at_price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                            <Link
                              href={`/marketplace/products/${product.slug}`}
                              className="w-full flex items-center justify-center text-sm font-semibold bg-brand-mint text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              View Product
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {page > 1 && (
                      <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-brand-mint hover:text-brand-mint transition-colors">
                        Previous
                      </Link>
                    )}
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const p = i + 1
                      return (
                        <Link
                          key={p}
                          href={buildUrl({ page: String(p) })}
                          className={`w-9 h-9 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${p === page ? 'bg-brand-forest text-white' : 'border border-gray-200 text-gray-600 hover:border-brand-mint hover:text-brand-mint'}`}
                        >
                          {p}
                        </Link>
                      )
                    })}
                    {page < totalPages && (
                      <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-brand-mint hover:text-brand-mint transition-colors">
                        Next
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
