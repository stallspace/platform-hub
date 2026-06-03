'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Archive, Trash2, Eye, EyeOff, Star, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  is_available: boolean
  is_archived: boolean
  is_featured: boolean
  stock_quantity: number | null
  track_inventory: boolean
  view_count: number
  created_at: string
  categories: { name: string }[] | null
}

interface Props {
  products: Product[]
  categories: { id: string; name: string }[]
  vendorId: string
  subscriptionPlan: string | null
}

const PLAN_LIMITS: Record<string, number> = { starter: 100, growth: 500, premium: Infinity }

export default function ProductsClient({ products: initial, vendorId, subscriptionPlan }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [products, setProducts] = useState(initial)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all')
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const limit = subscriptionPlan ? PLAN_LIMITS[subscriptionPlan] ?? Infinity : Infinity
  const activeCount = products.filter(p => !p.is_archived).length
  const atLimit = activeCount >= limit

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    if (filter === 'active') return matchSearch && !p.is_archived
    if (filter === 'archived') return matchSearch && p.is_archived
    return matchSearch
  })

  async function toggleAvailable(product: Product) {
    setActionId(product.id)
    const { error } = await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id)
    if (!error) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p))
    }
    setActionId(null)
  }

  async function toggleArchive(product: Product) {
    setActionId(product.id)
    const { error } = await supabase
      .from('products')
      .update({ is_archived: !product.is_archived })
      .eq('id', product.id)
    if (!error) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_archived: !p.is_archived } : p))
    }
    setActionId(null)
  }

  async function deleteProduct(id: string) {
    setActionId(id)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id))
    }
    setConfirmDelete(null)
    setActionId(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {activeCount} active
            {limit !== Infinity && ` / ${limit} allowed`}
          </p>
        </div>
        <button
          onClick={() => router.push('/vendor/products/new')}
          disabled={atLimit}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={atLimit ? `You've reached your ${subscriptionPlan} plan limit` : ''}
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {atLimit && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 mb-4">
          You've reached your {subscriptionPlan} plan limit of {limit} products.{' '}
          <a href="/vendor/subscription" className="underline font-medium">Upgrade your plan</a> to add more.
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products…"
            className="input pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'archived'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-brand-navy text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try a different search term' : 'Add your first product to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Views</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(product => (
                  <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${product.is_archived ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                          {product.is_featured && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                              <Star className="w-3 h-3" /> Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{product.categories?.[0]?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      R {Number(product.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.track_inventory ? (product.stock_quantity ?? 0) : '∞'}
                    </td>
                    <td className="px-4 py-3">
                      {product.is_archived ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Archived</span>
                      ) : product.is_available ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Active</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Hidden</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{product.view_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/vendor/products/${product.id}/edit`)}
                          className="p-1.5 text-gray-400 hover:text-brand-accent hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleAvailable(product)}
                          disabled={actionId === product.id || product.is_archived}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
                          title={product.is_available ? 'Hide' : 'Show'}
                        >
                          {product.is_available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => toggleArchive(product)}
                          disabled={actionId === product.id}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-40"
                          title={product.is_archived ? 'Unarchive' : 'Archive'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(product.id)}
                          disabled={actionId === product.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Delete product?</h3>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone. The product will be permanently removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteProduct(confirmDelete)}
                disabled={actionId === confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {actionId === confirmDelete ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
