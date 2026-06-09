import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ArrowRight, ChevronRight, ShieldCheck, Store, CreditCard,
  Search, Laptop, Shirt, Home, Leaf, ShoppingBag, Dumbbell,
  Palette, PawPrint, Zap, TrendingUp, Package, Star,
  MapPin, Clock, Truck
} from 'lucide-react'
import type { Category, Vendor, Product } from '@/types'

// Icon map for categories — keyed by slug fragment
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  electronics:  <Laptop  className="w-5 h-5" />,
  fashion:      <Shirt   className="w-5 h-5" />,
  home:         <Home    className="w-5 h-5" />,
  health:       <Leaf    className="w-5 h-5" />,
  food:         <ShoppingBag className="w-5 h-5" />,
  sports:       <Dumbbell className="w-5 h-5" />,
  arts:         <Palette className="w-5 h-5" />,
  pet:          <PawPrint className="w-5 h-5" />,
}

function getCategoryIcon(slug: string): React.ReactNode {
  const match = Object.keys(CATEGORY_ICONS).find(k => slug.includes(k))
  return match ? CATEGORY_ICONS[match] : <Package className="w-5 h-5" />
}

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <Star
          key={s}
          className={`w-3 h-3 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
      {count !== undefined && <span className="text-xs text-gray-400 ml-0.5">({count})</span>}
    </div>
  )
}

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: categories },
    { data: featuredProducts },
    { data: featuredVendors },
    { data: trendingProducts },
  ] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, icon, product_count')
      .order('sort_order')
      .limit(8),

    supabase
      .from('products')
      .select(`
        id, name, slug, price, compare_at_price, images,
        is_featured, track_inventory, stock_quantity,
        vendor:vendors(id, business_name, slug, city),
        category:categories(name, slug)
      `)
      .eq('is_featured', true)
      .eq('is_available', true)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(8),

    supabase
      .from('vendors')
      .select('id, business_name, slug, logo_url, banner_url, business_description, city, province')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(4),

    supabase
      .from('products')
      .select('id, name, slug, price, images, vendor:vendors(business_name, slug)')
      .eq('is_available', true)
      .eq('is_archived', false)
      .order('view_count', { ascending: false })
      .limit(6),
  ])

  return (
    <div className="bg-white">

      {/* ================================================================
          HERO
      ================================================================ */}
      <section className="relative bg-brand-navy overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }}
        />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span className="text-white/90 text-sm font-medium">All vendors vetted and verified</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-5">
              South Africa&apos;s <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500">
                Trusted Marketplace
              </span>
            </h1>

            <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-xl">
              Discover verified local vendors. Browse thousands of products. Pay securely, directly to the seller.
            </p>

            {/* Search */}
            <form action="/marketplace/search" method="GET" className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search products, categories, or vendors..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 placeholder:text-gray-400
                             focus:outline-none focus:ring-2 focus:ring-brand-accent shadow-lg text-sm"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 bg-brand-accent hover:bg-blue-700
                           text-white font-semibold px-6 py-4 rounded-xl transition-colors shadow-lg text-sm whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </form>

            {/* Quick search tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-400 text-sm">Popular:</span>
              {['Electronics', 'Handmade', 'Food & Drink', 'Fashion', 'Skincare'].map((tag) => (
                <Link
                  key={tag}
                  href={`/marketplace/search?q=${encodeURIComponent(tag)}`}
                  className="text-sm text-blue-300 hover:text-white underline underline-offset-2 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { value: '20+',    label: 'Vetted Vendors' },
                { value: '5,000+', label: 'Products Listed' },
                { value: '1,000+', label: 'Happy Customers' },
                { value: '100%',   label: 'Secure Payments' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          CATEGORIES
      ================================================================ */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-brand-navy">Shop by Category</h2>
              <p className="text-gray-500 text-sm mt-1">Find exactly what you&apos;re looking for</p>
            </div>
            <Link
              href="/marketplace/products"
              className="hidden sm:flex items-center gap-1 text-brand-accent font-medium text-sm hover:underline"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {(categories ?? []).map((cat) => (
              <Link
                key={cat.slug}
                href={`/marketplace/products?category=${cat.slug}`}
                className="group bg-white rounded-xl p-4 text-center border border-gray-100
                           hover:border-brand-accent hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-blue-50 text-brand-accent flex items-center justify-center
                                group-hover:bg-brand-accent group-hover:text-white transition-colors">
                  {getCategoryIcon(cat.slug)}
                </div>
                <div className="text-xs font-semibold text-gray-800 group-hover:text-brand-accent transition-colors leading-tight">
                  {cat.name}
                </div>
                {cat.product_count !== undefined && (
                  <div className="text-xs text-gray-400 mt-0.5">{cat.product_count}</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURED PRODUCTS
      ================================================================ */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-brand-accent" />
                <span className="text-brand-accent text-sm font-semibold uppercase tracking-wider">Handpicked</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-brand-navy">Featured Products</h2>
            </div>
            <Link
              href="/marketplace/products?featured=true"
              className="hidden sm:flex items-center gap-1 text-brand-accent font-medium text-sm hover:underline"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {!featuredProducts || featuredProducts.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="aspect-square bg-gray-100 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-5 bg-gray-100 rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {featuredProducts.map((product: any) => {
                const discount = (product.compare_at_price && Number(product.compare_at_price) > Number(product.price))
                  ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)
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
                          <Package className="w-12 h-12 text-gray-200" />
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
                    </div>
                    <div className="p-3">
                      {product.vendor && (
                        <Link
                          href={`/marketplace/store/${product.vendor.slug}`}
                          className="text-xs text-brand-accent font-medium hover:underline"
                        >
                          {product.vendor.business_name}
                        </Link>
                      )}
                      <Link href={`/marketplace/products/${product.slug}`}>
                        <h3 className="text-sm font-semibold text-gray-900 mt-1 mb-2 line-clamp-2 hover:text-brand-accent transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="mt-2 pt-2">
                        <div className="mb-2">
                          <span className="font-bold text-brand-navy text-base">
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
                          className="w-full flex items-center justify-center text-sm font-semibold bg-brand-accent text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Product
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              href="/marketplace/products"
              className="inline-flex items-center gap-2 border-2 border-brand-navy text-brand-navy font-semibold
                         px-8 py-3 rounded-xl hover:bg-brand-navy hover:text-white transition-all duration-200"
            >
              Browse All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURED VENDORS
      ================================================================ */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-brand-accent" />
                <span className="text-brand-accent text-sm font-semibold uppercase tracking-wider">Verified</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-brand-navy">Featured Vendors</h2>
            </div>
            <Link
              href="/marketplace/vendors"
              className="hidden sm:flex items-center gap-1 text-brand-accent font-medium text-sm hover:underline"
            >
              All vendors <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {!featuredVendors || featuredVendors.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-20 bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-10 w-10 bg-gray-200 rounded-xl" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredVendors.map((vendor: any) => (
                <Link
                  key={vendor.slug}
                  href={`/marketplace/store/${vendor.slug}`}
                  className="card group overflow-hidden hover:-translate-y-0.5 transition-transform duration-200"
                >
                  <div className="relative h-20 bg-gradient-to-r from-brand-navy to-brand-accent overflow-hidden">
                    {vendor.banner_url && (
                      <img src={vendor.banner_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-4 pt-0">
                    <div className="relative -mt-8 mb-3">
                      <div className="w-16 h-16 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden">
                        {vendor.logo_url ? (
                          <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-brand-navy flex items-center justify-center">
                            <span className="text-white font-bold text-xl">{vendor.business_name[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 group-hover:text-brand-accent transition-colors text-sm leading-snug">
                        {vendor.business_name}
                      </h3>
                      <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{vendor.business_description}</p>
                    {(vendor.city || vendor.province) && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />
                        {[vendor.city, vendor.province].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================================================================
          TRENDING NOW
      ================================================================ */}
      {trendingProducts && trendingProducts.length > 0 && (
        <section className="py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-8">
              <TrendingUp className="w-6 h-6 text-brand-accent" />
              <h2 className="text-2xl md:text-3xl font-bold text-brand-navy">Trending Now</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingProducts.map((product: any) => (
                <Link
                  key={product.id}
                  href={`/marketplace/products/${product.slug}`}
                  className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 hover:border-brand-accent hover:shadow-md transition-all"
                >
                  <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 truncate">{(product.vendor as any)?.business_name}</p>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mt-0.5">{product.name}</p>
                    <p className="text-brand-accent font-bold text-sm mt-1">
                      R{Number(product.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================
          HOW IT WORKS
      ================================================================ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-navy">How MARCRTE Works</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">
              A simple, secure way to shop from trusted South African vendors
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Search className="w-6 h-6" />,    title: 'Browse & Discover',          desc: 'Search thousands of products from vetted South African vendors.' },
              { icon: <Store className="w-6 h-6" />,     title: 'Visit Vendor Storefronts',   desc: 'Explore dedicated stores, read reviews, and compare products.' },
              { icon: <CreditCard className="w-6 h-6" />, title: 'Pay Directly & Securely',   desc: 'Purchase directly from the vendor via PayFast, Peach, Yoco, or Ozow.' },
            ].map((step, i) => (
              <div key={step.title} className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gray-200 -z-0" />
                )}
                <div className="relative z-10 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-navy text-white mb-5 shadow-lg">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-brand-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          TRUST BADGES
      ================================================================ */}
      <section className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: <ShieldCheck className="w-7 h-7 mx-auto text-brand-accent" />, title: 'Secure Payments',  desc: 'SSL encrypted. Pay directly to vendors.' },
              { icon: <ShieldCheck className="w-7 h-7 mx-auto text-green-500" />,    title: 'Vetted Vendors',   desc: 'All vendors reviewed and approved.' },
              { icon: <MapPin      className="w-7 h-7 mx-auto text-brand-accent" />, title: 'SA Business',      desc: 'Supporting local South African vendors.' },
              { icon: <Truck       className="w-7 h-7 mx-auto text-brand-accent" />, title: 'POPIA Compliant',  desc: 'Your data is protected by law.' },
            ].map((item) => (
              <div key={item.title} className="p-4">
                <div className="mb-3">{item.icon}</div>
                <h4 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
