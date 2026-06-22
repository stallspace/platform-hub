import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  MapPin, Phone, Mail, Globe, Instagram, Facebook,
  Package, Star, ShieldCheck, ChevronRight, Clock
} from 'lucide-react'
import EnquiryForm from '@/components/storefront/EnquiryForm'
import ProductEnquiryToggle from '@/components/storefront/ProductEnquiryToggle'
import TrackView from '@/components/marketplace/TrackView'
import ReviewForm from '@/components/storefront/ReviewForm'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient()

  const { data: vendor } = await supabase
    .from('vendors')
    .select('business_name, business_description, logo_url, banner_url, city, province')
    .eq('slug', params.slug)
    .eq('status', 'approved')
    .single()

  if (!vendor) {
    return { title: 'Vendor Not Found' }
  }

  const locationStr = [vendor.city, vendor.province].filter(Boolean).join(', ')
  const description = vendor.business_description
    ? vendor.business_description.slice(0, 155)
    : (locationStr ? `Shop products from ${vendor.business_name} in ${locationStr} on Stallspace.` : `Shop products from ${vendor.business_name} on Stallspace.`)

  return {
    title: vendor.business_name,
    description,
    openGraph: {
      title: vendor.business_name,
      description,
      images: vendor.banner_url ? [{ url: vendor.banner_url }] : (vendor.logo_url ? [{ url: vendor.logo_url }] : []),
      type: 'website',
    },
  }
}

export default async function MarketplaceStorefrontPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const { data: vendor } = await supabase
    .from('vendors')
    .select(`
      id, business_name, slug, owner_name, email, phone,
      business_address, business_description, logo_url, banner_url,
      social_links, city, province, operating_hours,
      fulfilment_type, estimated_delivery_time, created_at
    `)
    .eq('slug', params.slug)
    .eq('status', 'approved')
    .single()

  if (!vendor) notFound()

  const [{ data: products }, { data: reviews }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, images, is_available, stock_quantity, track_inventory, category:categories(name)')
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
    <div className="bg-[#F7F5F0] min-h-screen">
      <TrackView type="store_view" vendorId={vendor.id} />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-[#9CA3AF]">
            <Link href="/marketplace" className="hover:text-[#2ECC8E] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/marketplace/vendors" className="hover:text-[#2ECC8E] transition-colors">Vendors</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#374151]">{vendor.business_name}</span>
          </nav>
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-[#0D3B2E] overflow-hidden">
        {vendor.banner_url ? (
          <img src={vendor.banner_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(46,204,142,.5) 8px,rgba(46,204,142,.5) 9px)' }}
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Vendor header */}
        <div className="relative -mt-8 mb-6 flex items-end gap-4 pt-2">
          <div className="w-24 h-24 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden flex-shrink-0">
            {vendor.logo_url ? (
              <img src={vendor.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#0D3B2E] flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {vendor.business_name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#111111]">{vendor.business_name}</h1>
              <ShieldCheck className="w-5 h-5 text-[#2ECC8E]" />
            </div>
            {(vendor.city || vendor.province) && (
              <div className="flex items-center gap-1 text-sm text-[#6B7280] mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {[vendor.city, vendor.province].filter(Boolean).join(', ')}
              </div>
            )}
            {avgRating !== null && (
              <div className="flex items-center gap-1 text-sm text-amber-500 mt-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'fill-current' : 'text-gray-200'}`} />
                ))}
                <span className="text-[#6B7280] ml-1">{avgRating.toFixed(1)} ({reviews?.length} review{reviews?.length !== 1 ? 's' : ''})</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-12">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <h2 className="font-semibold text-[#111111] mb-3">About</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed">{vendor.business_description}</p>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 space-y-3">
              <h2 className="font-semibold text-[#111111] mb-3">Contact</h2>
              <div className="flex items-start gap-2 text-sm text-[#6B7280]">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#9CA3AF]" />
                <a href={`mailto:${vendor.email}`} className="hover:text-[#2ECC8E] break-all">{vendor.email}</a>
              </div>
              <div className="flex items-start gap-2 text-sm text-[#6B7280]">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#9CA3AF]" />
                <a href={`tel:${vendor.phone}`} className="hover:text-[#2ECC8E]">{vendor.phone}</a>
              </div>
              <div className="flex items-start gap-2 text-sm text-[#6B7280]">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#9CA3AF]" />
                <span>{vendor.business_address}</span>
              </div>
              {social?.website && (
                <div className="flex items-start gap-2 text-sm text-[#6B7280]">
                  <Globe className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#9CA3AF]" />
                  <a href={social.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#2ECC8E] break-all">{social.website}</a>
                </div>
              )}
              {social?.instagram && (
                <div className="flex items-start gap-2 text-sm text-[#6B7280]">
                  <Instagram className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#9CA3AF]" />
                  <a href={`https://instagram.com/${social.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#2ECC8E]">@{social.instagram}</a>
                </div>
              )}
              {social?.facebook && (
                <div className="flex items-start gap-2 text-sm text-[#6B7280]">
                  <Facebook className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#9CA3AF]" />
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#2ECC8E]">Facebook</a>
                </div>
              )}
            </div>

            {vendor.estimated_delivery_time && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
                <h2 className="font-semibold text-[#111111] mb-3">Fulfilment</h2>
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <Clock className="w-4 h-4 text-[#9CA3AF]" />
                  {vendor.estimated_delivery_time}
                </div>
              </div>
            )}

            <div className="bg-[#0D3B2E] rounded-xl p-5">
              <EnquiryForm vendorId={vendor.id} vendorEmail={vendor.email} />
            </div>
          </aside>

          {/* Products */}
          <main className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#111111]">
                Products
                <span className="text-[#9CA3AF] font-normal text-sm ml-2">({products?.length ?? 0})</span>
              </h2>
            </div>

            {!products || products.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-16 text-center">
                <Package className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
                <p className="text-[#9CA3AF] text-sm">No products listed yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((product: any) => {
                  const outOfStock = product.track_inventory && (product.stock_quantity ?? 0) <= 0
                  const discount = product.compare_at_price
                    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                    : null
                  return (
                    <div key={product.id} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow group">
                      <Link href={`/marketplace/products/${product.slug}`} className="block">
                        <div className="aspect-square bg-[#F8FAF3] overflow-hidden relative">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-[#D1D5DB]" />
                            </div>
                          )}
                          {discount && discount > 0 && (
                            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                              -{discount}%
                            </span>
                          )}
                          {outOfStock && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="bg-white text-[#374151] text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 pb-0">
                          <p className="text-xs text-[#9CA3AF] mb-1">{(product.category as any)?.name}</p>
                          <h3 className="font-medium text-[#111111] line-clamp-2 text-sm group-hover:text-[#0D3B2E] transition-colors">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-bold text-[#111111]">
                              R{Number(product.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                            </span>
                            {product.compare_at_price && (
                              <span className="text-xs text-[#9CA3AF] line-through">
                                R{Number(product.compare_at_price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      <div className="p-4 pt-3">
                        <ProductEnquiryToggle
                          vendorId={vendor.id}
                          vendorEmail={vendor.email}
                          productId={product.id}
                          productName={product.name}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div className="mt-8" id="reviews">
                <h2 className="text-lg font-semibold text-[#111111] mb-4">Reviews</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#0D3B2E] flex items-center justify-center text-white text-xs font-bold">
                          {review.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#111111]">{review.customer_name}</p>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-[#6B7280]">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-8">
              <ReviewForm vendorId={vendor.id} />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
