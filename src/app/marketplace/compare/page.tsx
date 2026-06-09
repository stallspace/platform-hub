"use client"

import { useState } from 'react'
import Link from 'next/link'
import {
  GitCompare, Search, Package, X, Plus,
  Star, MapPin, ShieldCheck, ArrowRight, Info
} from 'lucide-react'

// Compare engine — customers add up to 3 products, see side-by-side specs.
// Product search + add is client-side via Supabase JS client (Phase 2 will wire this).
// For now renders the structure and empty state so the route works.

interface CompareProduct {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  image: string | null
  vendor_name: string
  vendor_slug: string
  rating: number | null
  specifications: { key: string; value: string }[]
  city: string | null
}

const MAX_PRODUCTS = 3

export default function ComparePage() {
  const [products, setProducts] = useState<CompareProduct[]>([])

  function removeProduct(id: string) {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  // Collect all unique spec keys across compared products
  const allSpecKeys = [...new Set(
    products.flatMap(p => p.specifications.map(s => s.key))
  )]

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-navy flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-navy">Compare Products</h1>
              <p className="text-gray-500 text-sm mt-0.5">Compare up to {MAX_PRODUCTS} products side-by-side</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl border border-gray-100 p-12 inline-block max-w-md">
              <GitCompare className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">No products to compare</h2>
              <p className="text-gray-500 text-sm mb-2">
                Browse the marketplace and use the <strong>Compare</strong> button on any product to add it here.
              </p>
              <p className="text-gray-400 text-xs mb-6">You can compare up to {MAX_PRODUCTS} products at once.</p>
              <Link
                href="/marketplace/products"
                className="inline-flex items-center gap-2 bg-brand-accent text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Browse Products <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {/* Label column */}
                  <th className="w-40 text-left pr-4" />

                  {/* Product columns */}
                  {products.map((product) => (
                    <th key={product.id} className="px-4 pb-4 align-top">
                      <div className="bg-white rounded-2xl border border-gray-100 p-4 relative">
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="w-full aspect-square rounded-xl bg-gray-50 overflow-hidden mb-3">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-gray-200" />
                            </div>
                          )}
                        </div>
                        <Link href={`/marketplace/store/${product.vendor_slug}`} className="text-xs text-brand-accent font-medium hover:underline block">
                          {product.vendor_name}
                        </Link>
                        <Link href={`/marketplace/products/${product.slug}`}>
                          <h3 className="text-sm font-bold text-gray-900 mt-1 hover:text-brand-accent transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="mt-2">
                          <span className="text-lg font-bold text-brand-navy">
                            R{product.price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </span>
                          {product.compare_at_price && (
                            <span className="text-xs text-gray-400 line-through ml-1.5">
                              R{product.compare_at_price.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/marketplace/products/${product.slug}`}
                          className="mt-3 w-full flex items-center justify-center py-2 bg-brand-accent text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Product
                        </Link>
                      </div>
                    </th>
                  ))}

                  {/* Add slot */}
                  {products.length < MAX_PRODUCTS && (
                    <th className="px-4 pb-4 align-top">
                      <Link
                        href="/marketplace/products"
                        className="flex flex-col items-center justify-center h-full min-h-[200px] bg-white rounded-2xl border-2 border-dashed border-gray-200
                                   hover:border-brand-accent hover:bg-blue-50 transition-all p-6 group"
                      >
                        <Plus className="w-8 h-8 text-gray-300 group-hover:text-brand-accent transition-colors mb-2" />
                        <span className="text-sm text-gray-400 group-hover:text-brand-accent font-medium transition-colors">
                          Add product
                        </span>
                      </Link>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {/* Vendor */}
                <tr className="bg-white">
                  <td className="py-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</td>
                  {products.map((p) => (
                    <td key={p.id} className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm text-gray-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                        {p.vendor_name}
                      </div>
                    </td>
                  ))}
                  {products.length < MAX_PRODUCTS && <td />}
                </tr>

                {/* Rating */}
                <tr>
                  <td className="py-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</td>
                  {products.map((p) => (
                    <td key={p.id} className="px-4 py-3 text-center">
                      {p.rating !== null ? (
                        <div className="flex items-center justify-center gap-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(p.rating!) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                          ))}
                          <span className="text-xs text-gray-500 ml-1">{p.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No reviews</span>
                      )}
                    </td>
                  ))}
                  {products.length < MAX_PRODUCTS && <td />}
                </tr>

                {/* Location */}
                <tr className="bg-white">
                  <td className="py-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</td>
                  {products.map((p) => (
                    <td key={p.id} className="px-4 py-3 text-center">
                      {p.city ? (
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {p.city}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                  {products.length < MAX_PRODUCTS && <td />}
                </tr>

                {/* Dynamic specs */}
                {allSpecKeys.map((key, i) => (
                  <tr key={key} className={i % 2 === 0 ? '' : 'bg-white'}>
                    <td className="py-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{key}</td>
                    {products.map((p) => {
                      const spec = p.specifications.find(s => s.key === key)
                      return (
                        <td key={p.id} className="px-4 py-3 text-center text-sm text-gray-700">
                          {spec ? spec.value : <span className="text-gray-300">—</span>}
                        </td>
                      )
                    })}
                    {products.length < MAX_PRODUCTS && <td />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info note */}
        <div className="mt-8 flex items-start gap-2 text-xs text-gray-400 bg-white rounded-xl border border-gray-100 p-4">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-brand-accent" />
          Use the <strong className="text-gray-600">Compare</strong> button on any product page or product card to add it to this comparison. Products are stored in your browser session.
        </div>
      </div>
    </div>
  )
}
