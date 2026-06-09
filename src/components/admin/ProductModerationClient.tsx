'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AdminProduct } from '@/app/admin/products/page'

const FILTER_TABS = [
  { key: 'available',   label: 'Available' },
  { key: 'unavailable', label: 'Unavailable' },
  { key: 'archived',    label: 'Archived' },
  { key: 'featured',    label: 'Featured' },
  { key: 'all',         label: 'All' },
]

interface Props {
  products: AdminProduct[]
  activeFilter: string
  counts: Record<string, number>
  searchQuery: string
}

export default function ProductModerationClient({ products, activeFilter, counts, searchQuery }: Props) {
  const router     = useRouter()
  const pathname   = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [search, setSearch]   = useState(searchQuery)
  const [actionId, setActionId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [selected, setSelected] = useState<AdminProduct | null>(null)

  function showToast(text: string, type: 'success' | 'error') {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3500)
  }

  function navigate(params: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => v ? next.set(k, v) : next.delete(k))
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  async function toggleField(productId: string, field: 'is_available' | 'is_archived' | 'is_featured', value: boolean, label: string) {
    setActionId(productId + field)
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', productId)

    if (error) {
      showToast(`Failed: ${error.message}`, 'error')
    } else {
      showToast(label, 'success')
      setSelected(null)
      startTransition(() => router.refresh())
    }
    setActionId(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success'
            ? <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          }
          {toast.text}
        </div>
      )}

      {/* Product detail modal */}
      {selected && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-[#0A1F44] truncate">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {selected.images?.[0] && (
                <img src={selected.images[0]} alt={selected.name} className="w-full h-40 object-cover rounded-xl" />
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Price',    value: `R ${selected.price.toFixed(2)}` },
                  { label: 'Vendor',   value: selected.vendors?.business_name ?? '—' },
                  { label: 'Category', value: selected.categories?.name ?? '—' },
                  { label: 'Views',    value: String(selected.view_count) },
                  { label: 'Added',    value: formatDate(selected.created_at) },
                  { label: 'Updated',  value: formatDate(selected.updated_at) },
                ].map((f) => (
                  <div key={f.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">{f.label}</p>
                    <p className="text-sm font-medium text-gray-800">{f.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => toggleField(selected.id, 'is_available', !selected.is_available, selected.is_available ? 'Product hidden' : 'Product made available')}
                  disabled={!!actionId}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors disabled:opacity-50 ${
                    selected.is_available
                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {selected.is_available ? 'Hide Product' : 'Make Available'}
                </button>
                <button
                  onClick={() => toggleField(selected.id, 'is_featured', !selected.is_featured, selected.is_featured ? 'Removed from featured' : 'Product featured')}
                  disabled={!!actionId}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors disabled:opacity-50 ${
                    selected.is_featured
                      ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                      : 'bg-[#1D4ED8]/10 text-[#1D4ED8] border-[#1D4ED8]/20 hover:bg-[#1D4ED8]/20'
                  }`}
                >
                  {selected.is_featured ? '★ Unfeature' : '☆ Feature'}
                </button>
                <button
                  onClick={() => toggleField(selected.id, 'is_archived', !selected.is_archived, selected.is_archived ? 'Product restored' : 'Product archived')}
                  disabled={!!actionId}
                  className="py-2.5 px-4 text-sm font-semibold rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {selected.is_archived ? 'Restore' : 'Archive'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Search + filter tabs */}
        <div className="border-b border-gray-100 px-5 pt-5">
          <div className="relative mb-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigate({ search, status: activeFilter })}
              placeholder="Search by product name…"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1D4ED8] transition-colors"
            />
            {search && (
              <button onClick={() => { setSearch(''); navigate({ search: '', status: activeFilter }) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <div className="flex gap-1 overflow-x-auto pb-px">
            {FILTER_TABS.map((tab) => {
              const count = tab.key === 'all' ? totalCount : (counts[tab.key] ?? 0)
              const active = activeFilter === tab.key
              return (
                <button key={tab.key} onClick={() => navigate({ status: tab.key, search })}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap border-b-2 transition-all ${
                    active ? 'border-[#1D4ED8] text-[#1D4ED8]' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${active ? 'bg-[#1D4ED8]/10 text-[#1D4ED8]' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">📦</div>
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-gray-400 text-sm mt-1">{searchQuery ? 'Try adjusting your search.' : 'No products in this category yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Vendor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Views</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                          {product.images?.[0]
                            ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-[#0A1F44] line-clamp-1">{product.name}</p>
                          <p className="text-gray-400 text-xs">R {product.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-gray-600 text-sm">{product.vendors?.business_name ?? '—'}</td>
                    <td className="px-5 py-4 hidden lg:table-cell text-gray-500 text-xs">{product.categories?.name ?? '—'}</td>
                    <td className="px-5 py-4 hidden lg:table-cell text-gray-500 text-xs">{product.view_count}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {product.is_archived && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-semibold">Archived</span>}
                        {!product.is_archived && product.is_available && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold">Available</span>}
                        {!product.is_archived && !product.is_available && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-semibold">Hidden</span>}
                        {product.is_featured && <span className="text-xs px-2 py-0.5 rounded-full bg-[#1D4ED8]/10 text-[#1D4ED8] border border-[#1D4ED8]/20 font-semibold">★ Featured</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSelected(product)}
                          className="text-gray-400 hover:text-[#1D4ED8] transition-colors p-1.5 rounded-lg hover:bg-blue-50" title="View & manage">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => toggleField(product.id, 'is_available', !product.is_available, product.is_available ? 'Product hidden' : 'Product made available')}
                          disabled={!!actionId || product.is_archived}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                            product.is_available
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {actionId === product.id + 'is_available' ? '...' : product.is_available ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => toggleField(product.id, 'is_archived', !product.is_archived, product.is_archived ? 'Product restored' : 'Product archived')}
                          disabled={!!actionId}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-colors disabled:opacity-40"
                        >
                          {actionId === product.id + 'is_archived' ? '...' : product.is_archived ? 'Restore' : 'Archive'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {products.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-right">
            <p className="text-xs text-gray-400">Showing {products.length} product{products.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>
    </>
  )
}
