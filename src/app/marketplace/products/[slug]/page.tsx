import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  MapPin, Phone, Mail, Globe, Instagram, Facebook,
  Package, Star, ShieldCheck, Truck, StoreIcon,
  ChevronRight, MessageSquare, Clock, AlertCircle, CheckCircle2, Tag
} from 'lucide-react'
import AddToCartButton from '@/components/marketplace/AddToCartButton'
import TrackView from '@/components/marketplace/TrackView'
import ReviewForm from '@/components/storefront/ReviewForm'

interface PageProps {
  params: { slug: string }
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`${sz} ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('name, description, images, price, vendor:vendors(business_name)')
    .eq('slug', params.slug)
    .eq('is_available', true)
    .eq('is_archived', false)
    .single()

  if (!product) {
    return { title: 'Product Not Found' }
  }

  const vendor = product.vendor as any
  const description = product.description
    ? product.description.slice(0, 155)
    : `Buy ${product.name} from ${vendor?.business_name ?? 'a trusted Stallspace vendor'}. R${Number(product.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}.`

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
      type: 'website',
    },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const supabase = await createClient()

  // Fetch product
  const { data: product } = await supabase
    .from('products')
    .select(`
      id, name, slug, description, price, compare_at_price,
      images, sku, specifications, variants, tags,
      track_inventory, stock_quantity, is_available, is_archived,
      is_featured, view_count, created_at,
      vendor:vendors(
        id, business_name, slug, logo_url, banner_url,
        business_description, email, phone, business_address,
        city, province, social_links, status,
        fulfilment_type, delivery_cost, estimated_delivery_time,
        collection_address, collection_hours
      ),
      category:categories(id, name, slug)
    `)
    .eq('slug', params.slug)
    .eq('is_available', true)
    .eq('is_archived', false)
    .single()

  if (!product) notFound()

  const vendor = product.vendor as any
  const category = product.category as any

  if (!vendor || vendor.status !== 'approved') notFound()

  // Increment view count (fire-and-forget)
  supabase
    .from('products')
    .update({ view_count: (product.view_count ?? 0) + 1 })
    .eq('id', product.id)
    .then(() => {})

  // Fetch reviews for this product
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, customer_name, rating, comment, created_at')
    .eq('vendor_id', vendor.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(10)

  // Related products — same category, different product
  const { data: relatedProducts } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_at_price, images, vendor:vendors(business_name, slug)')
    .eq('category_id', category?.id)
    .eq('is_available', true)
    .eq('is_archived', false)
    .neq('id', product.id)
    .limit(4)

  // More from this vendor
  const { data: vendorProducts } = await supabase
    .from('products')
    .select('id, name, slug, price, images')
    .eq('vendor_id', vendor.id)
    .eq('is_available', true)
    .eq('is_archived', false)
    .neq('id', product.id)
    .limit(4)

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  const hasDiscount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price)
  const discount = hasDiscount
    ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)
    : null

  const outOfStock = product.track_inventory && (product.stock_quantity ?? 0) <= 0
  const social = vendor.social_links as Record<string, string> | null
  const specifications = (product.specifications as { key: string; value: string }[]) ?? []
  const variants = (product.variants as { id: string; name: string; options: { id: string; value: string; price_modifier: number }[] }[]) ?? []

  const deliveryOffered = vendor.fulfilment_type === 'delivery' || vendor.fulfilment_type === 'both'
  const collectionOffered = vendor.fulfilment_type === 'collection' || vendor.fulfilment_type === 'both'

  return (
    <div className="bg-gray-50 min-h-screen">
      <TrackView type="product_view" vendorId={vendor.id} productId={product.id} />

      {/* ── BREADCRUMB ─────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400">
            <Link href="/marketplace" className="hover:text-brand-mint transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/marketplace/products" className="hover:text-brand-mint transition-colors">Products</Link>
            {category && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/marketplace/products?category=${category.slug}`} className="hover:text-brand-mint transition-colors">
                  {category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-600 truncate max-w-xs">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── LEFT — IMAGES ──────────────────────── */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              {/* Main image */}
              <div className="aspect-square rounded-2xl bg-white border border-gray-100 overflow-hidden mb-3 shadow-sm">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-20 h-20 text-gray-200" />
                  </div>
                )}
              </div>
              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img: string, i: number) => (
                    <div
                      key={i}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden cursor-pointer transition-colors ${i === 0 ? 'border-brand-mint' : 'border-gray-200 hover:border-gray-400'}`}
                    >
                      <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── CENTRE — PRODUCT INFO ──────────────── */}
          <div className="lg:col-span-4 space-y-5">
            {/* Category + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {category && (
                <Link
                  href={`/marketplace/products?category=${category.slug}`}
                  className="text-xs text-brand-mint font-medium bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {category.name}
                </Link>
              )}
              {discount && (
                <span className="text-xs font-bold text-white bg-red-500 px-2.5 py-1 rounded-full">
                  -{discount}% OFF
                </span>
              )}
              {product.is_featured && (
                <span className="text-xs font-bold text-white bg-brand-mint px-2.5 py-1 rounded-full">
                  Featured
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {avgRating !== null ? (
              <div className="flex items-center gap-2">
                <StarRating rating={avgRating} size="md" />
                <span className="text-sm font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({reviews?.length} review{reviews?.length !== 1 ? 's' : ''})</span>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No reviews yet</p>
            )}

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-brand-forest">
                  R{Number(product.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </span>
                {hasDiscount && product.compare_at_price && (
                  <div className="flex flex-col mb-0.5">
                    <span className="text-xs text-gray-400 leading-none">Was</span>
                    <span className="text-lg text-gray-400 line-through leading-tight">
                      R{Number(product.compare_at_price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
              {hasDiscount && (
                <p className="text-sm text-green-600 font-medium">
                  You save R{(Number(product.compare_at_price) - Number(product.price)).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} ({discount}% off)
                </p>
              )}
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2">
              {outOfStock ? (
                <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Out of Stock
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  {product.track_inventory && product.stock_quantity !== null
                    ? product.stock_quantity <= 5
                      ? `Only ${product.stock_quantity} left`
                      : 'In Stock'
                    : 'Available'}
                </div>
              )}
              {product.sku && <span className="text-xs text-gray-400 ml-2">SKU: {product.sku}</span>}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>

            {/* Variants */}
            {variants.map((variant) => (
              <div key={variant.id}>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">{variant.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {variant.options.map((opt) => (
                    <button
                      key={opt.id}
                      className="px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700
                                 hover:border-brand-mint hover:text-brand-mint transition-colors"
                    >
                      {opt.value}
                      {opt.price_modifier !== 0 && (
                        <span className="text-xs text-gray-400 ml-1">
                          {opt.price_modifier > 0 ? `+R${opt.price_modifier}` : `-R${Math.abs(opt.price_modifier)}`}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                {product.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/marketplace/search?q=${encodeURIComponent(tag)}`}
                    className="text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Specifications */}
            {specifications.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Specifications</h3>
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                  {specifications.map((spec) => (
                    <div key={spec.key} className="flex items-start px-4 py-2.5 gap-3">
                      <span className="text-xs font-medium text-gray-500 w-32 flex-shrink-0 pt-0.5">{spec.key}</span>
                      <span className="text-xs text-gray-800 font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT — BUY BOX ────────────────────── */}
          <div className="lg:col-span-3">
            <div className="sticky top-24 space-y-4">

              {/* Vendor card */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Sold by</p>
                <Link href={`/marketplace/store/${vendor.slug}`} className="flex items-center gap-3 group mb-3">
                  <div className="w-10 h-10 rounded-lg border border-gray-100 overflow-hidden flex-shrink-0">
                    {vendor.logo_url ? (
                      <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-brand-forest flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{vendor.business_name[0]}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-mint transition-colors">
                      {vendor.business_name}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">Verified Vendor</span>
                    </div>
                  </div>
                </Link>
                {(vendor.city || vendor.province) && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    {[vendor.city, vendor.province].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>

              {/* Delivery info */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Fulfilment</p>
                {deliveryOffered && (
                  <div className="flex items-start gap-2.5">
                    <Truck className="w-4 h-4 text-brand-mint mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Delivery Available</p>
                      {vendor.delivery_cost !== null && (
                        <p className="text-xs text-gray-500">
                          {Number(vendor.delivery_cost) === 0 ? 'Free delivery' : `R${Number(vendor.delivery_cost).toFixed(2)} delivery fee`}
                        </p>
                      )}
                      {vendor.estimated_delivery_time && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {vendor.estimated_delivery_time}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {collectionOffered && (
                  <div className="flex items-start gap-2.5">
                    <StoreIcon className="w-4 h-4 text-brand-mint mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Collection Available</p>
                      {vendor.collection_hours && (
                        <p className="text-xs text-gray-400">{vendor.collection_hours}</p>
                      )}
                    </div>
                  </div>
                )}
                {!deliveryOffered && !collectionOffered && (
                  <p className="text-xs text-gray-400">Contact vendor for delivery details.</p>
                )}
              </div>

              {/* CTA buttons */}
              <AddToCartButton
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: Number(product.price),
                  images: product.images,
                  track_inventory: product.track_inventory,
                  stock_quantity: product.stock_quantity,
                }}
                vendor={{
                  id: vendor.id,
                  business_name: vendor.business_name,
                  slug: vendor.slug,
                }}
                outOfStock={outOfStock}
              />

              {/* Ask vendor */}
              <Link
                href={`/marketplace/store/${vendor.slug}?enquiry=true&product=${product.id}`}
                className="w-full mt-2 py-2.5 rounded-xl border-2 border-brand-forest text-brand-forest font-semibold text-sm
                           hover:bg-brand-forest hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Ask Vendor a Question
              </Link>

              {/* Trust badges */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                {[
                  { icon: <ShieldCheck className="w-3.5 h-3.5 text-green-500" />, text: 'Verified vendor' },
                  { icon: <CheckCircle2 className="w-3.5 h-3.5 text-brand-mint" />, text: 'Secure payment via PayFast, Yoco, or Peach' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
                    {icon}
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── REVIEWS ──────────────────────────────────── */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9 lg:col-start-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
                  {avgRating !== null && (
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={avgRating} size="md" />
                      <span className="text-lg font-bold text-gray-800">{avgRating.toFixed(1)}</span>
                      <span className="text-sm text-gray-400">out of 5</span>
                    </div>
                  )}
                </div>
                <Link
                  href={`/marketplace/store/${vendor.slug}#reviews`}
                  className="text-sm text-brand-mint font-medium hover:underline"
                >
                  View all vendor reviews
                </Link>
              </div>

              {!reviews || reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No reviews yet for this product.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-full bg-brand-forest flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {review.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{review.customer_name}</p>
                          <StarRating rating={review.rating} />
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── WRITE A REVIEW ──────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-9 lg:col-start-1">
            <ReviewForm vendorId={vendor.id} productId={product.id} productName={product.name} />
          </div>
        </div>

        {/* ── RELATED PRODUCTS ────────────────────────── */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map((p: any) => {
                const d = (p.compare_at_price && Number(p.compare_at_price) > Number(p.price))
                  ? Math.round(((Number(p.compare_at_price) - Number(p.price)) / Number(p.compare_at_price)) * 100)
                  : null
                return (
                  <div key={p.id} className="card group overflow-hidden">
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-200" />
                        </div>
                      )}
                      {d && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                          -{d}%
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      {(p.vendor as any) && (
                        <p className="text-xs text-brand-mint font-medium">{(p.vendor as any).business_name}</p>
                      )}
                      <Link href={`/marketplace/products/${p.slug}`}>
                        <h3 className="text-sm font-semibold text-gray-900 mt-1 mb-2 line-clamp-2 hover:text-brand-mint transition-colors">
                          {p.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-forest text-sm">
                          R{Number(p.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                        <Link
                          href={`/marketplace/products/${p.slug}`}
                          className="text-xs font-semibold bg-brand-mint text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── MORE FROM VENDOR ────────────────────────── */}
        {vendorProducts && vendorProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">More from {vendor.business_name}</h2>
              <Link
                href={`/marketplace/store/${vendor.slug}`}
                className="text-sm text-brand-mint font-medium hover:underline flex items-center gap-1"
              >
                View store <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {vendorProducts.map((p: any) => (
                <div key={p.id} className="card group overflow-hidden">
                  <div className="aspect-square bg-gray-50 overflow-hidden">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <Link href={`/marketplace/products/${p.slug}`}>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-brand-mint transition-colors">
                        {p.name}
                      </h3>
                    </Link>
                    <span className="font-bold text-brand-forest text-sm mt-1 block">
                      R{Number(p.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
