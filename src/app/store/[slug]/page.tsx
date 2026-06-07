import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MapPin, Phone, Mail, Globe, Instagram, Facebook, Package, Star } from 'lucide-react'
import EnquiryForm from '@/components/storefront/EnquiryForm'

export default async function StorefrontPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, slug, owner_name, email, phone, business_address, business_description, logo_url, banner_url, social_links, created_at')
    .eq('slug', params.slug)
    .eq('status', 'approved')
    .single()

  if (!vendor) notFound()

  const [{ data: products }, { data: reviews }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, price, compare_at_price, images, is_available, stock_quantity, track_inventory, category:categories(name)')
      .eq('vendor_id', vendor.id)
      .eq('is_available', true)
      .eq('is_archived', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, customer_name, rating, comment, created_at')
      .eq('vendor_id', vendor.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  const social = vendor.social_links as Record<string, string> | null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-navy rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-lg font-bold text-brand-navy">MARCRTE</span>
          </Link>
          <Link href="/marketplace" className="text-sm text-gray-500 hover:text-gray-900">
            ← Back to Marketplace
          </Link>
        </div>
      </header>

      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-brand-navy to-brand-accent overflow-hidden">
        {vendor.banner_url && (
          <img src={vendor.banner_url} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Vendor Info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-12 mb-6 flex items-end gap-4">
          <div className="w-24 h-24 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden flex-shrink-0">
            {vendor.logo_url ? (
              <img src={vendor.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-navy flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {vendor.business_name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="pb-1">
            <h1 className="text-2xl font-bold text-gray-900">{vendor.business_name}</h1>
            {avgRating && (
              <div className="flex items-center gap-1 text-sm text-amber-500 mt-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'fill-current' : 'text-gray-300'}`} />
                ))}
                <span className="text-gray-500 ml-1">{avgRating.toFixed(1)} ({reviews?.length} reviews)</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-12">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            {/* About */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{vendor.business_description}</p>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <h2 className="font-semibold text-gray-900 mb-3">Contact</h2>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                <a href={`mailto:${vendor.email}`} className="hover:text-brand-accent break-all">{vendor.email}</a>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                <a href={`tel:${vendor.phone}`} className="hover:text-brand-accent">{vendor.phone}</a>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                <span>{vendor.business_address}</span>
              </div>
              {social?.website && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Globe className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                  <a href={social.website} target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent break-all">{social.website}</a>
                </div>
              )}
              {social?.instagram && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Instagram className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                  <a href={`https://instagram.com/${social.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent">@{social.instagram}</a>
                </div>
              )}
              {social?.facebook && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Facebook className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent">Facebook</a>
                </div>
              )}
            </div>

            {/* Enquiry Form */}
            <EnquiryForm
              vendorId={vendor.id}
              vendorEmail={vendor.email}
            />
          </aside>

          {/* Products */}
          <main className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Products
                <span className="text-gray-400 font-normal text-sm ml-2">({products?.length ?? 0})</span>
              </h2>
            </div>

            {!products || products.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No products listed yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map(product => {
                  const outOfStock = product.track_inventory && (product.stock_quantity ?? 0) <= 0
                  return (
                    <div key={product.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                      <div className="aspect-square bg-gray-50 overflow-hidden relative">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-10 h-10 text-gray-300" />
                          </div>
                        )}
                        {outOfStock && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-gray-400 mb-1">{(product.category as any)?.name}</p>
                        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">{product.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-bold text-gray-900">
                            R {Number(product.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </span>
                          {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                            <span className="text-xs text-gray-400 line-through">
                              R {Number(product.compare_at_price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                        {/* Enquire about this product */}
                        <div className="mt-3 pt-3 border-t border-gray-50">
                          <EnquiryForm
                            vendorId={vendor.id}
                            vendorEmail={vendor.email}
                            productId={product.id}
                            productName={product.name}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-brand-navy flex items-center justify-center text-white text-xs font-bold">
                          {review.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{review.customer_name}</p>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
