// Reads live data / the user session, so it must never be statically rendered.
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Heart, Package, ShoppingCart } from 'lucide-react'

export default async function FavouritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/account/favourites')

  // Favourites stored in customer_favourites table
  // Falls back gracefully if table doesn't exist yet
  const { data: favourites } = await supabase
    .from('customer_favourites')
    .select(`
      id, created_at,
      product:products(
        id, name, slug, price, compare_at_price, images,
        track_inventory, stock_quantity, is_available,
        vendor:vendors(business_name, slug)
      )
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-forest">Favourites</h1>
        <p className="text-gray-500 text-sm mt-1">
          {favourites?.length ?? 0} saved product{(favourites?.length ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {!favourites || favourites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No saved products yet</h3>
          <p className="text-gray-500 text-sm mb-5">
            Tap the heart icon on any product to save it here.
          </p>
          <Link
            href="/marketplace/products"
            className="inline-flex items-center gap-2 bg-brand-mint text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {favourites.map((fav: any) => {
            const product = fav.product
            if (!product) return null
            const discount = product.compare_at_price
              ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
              : null
            const outOfStock = product.track_inventory && (product.stock_quantity ?? 0) <= 0

            return (
              <div key={fav.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
                  {outOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span>
                    </div>
                  )}
                  {/* Remove favourite button */}
                  <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors">
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </button>
                </div>
                <div className="p-4">
                  {product.vendor && (
                    <Link href={`/marketplace/store/${product.vendor.slug}`} className="text-xs text-brand-mint font-medium hover:underline">
                      {product.vendor.business_name}
                    </Link>
                  )}
                  <Link href={`/marketplace/products/${product.slug}`}>
                    <h3 className="text-sm font-semibold text-gray-900 mt-1 mb-3 line-clamp-2 hover:text-brand-mint transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-brand-forest">
                        R{Number(product.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </span>
                      {product.compare_at_price && (
                        <span className="text-xs text-gray-400 line-through ml-1.5">
                          R{Number(product.compare_at_price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/marketplace/products/${product.slug}`}
                      className="flex items-center gap-1.5 bg-brand-mint text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      View
                    </Link>
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
