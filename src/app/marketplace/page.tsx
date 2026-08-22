// Reads live data / the user session, so it must never be statically rendered.
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ArrowRight, ChevronRight, ShieldCheck, Store, CreditCard,
  Search, Laptop, Shirt, Home, Leaf, ShoppingBag, Dumbbell,
  Palette, PawPrint, Zap, TrendingUp, Package, Star,
  MapPin, Truck
} from 'lucide-react'
import type { Category, Vendor, Product } from '@/types'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  electronics:  <Laptop      className="w-5 h-5" />,
  fashion:      <Shirt       className="w-5 h-5" />,
  home:         <Home        className="w-5 h-5" />,
  health:       <Leaf        className="w-5 h-5" />,
  food:         <ShoppingBag className="w-5 h-5" />,
  sports:       <Dumbbell    className="w-5 h-5" />,
  arts:         <Palette     className="w-5 h-5" />,
  pet:          <PawPrint    className="w-5 h-5" />,
}

function getCategoryIcon(slug: string): React.ReactNode {
  const match = Object.keys(CATEGORY_ICONS).find(k => slug.includes(k))
  return match ? CATEGORY_ICONS[match] : <Package className="w-5 h-5" />
}

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'fill-[#2ECC8E] text-[#2ECC8E]' : 'text-gray-200'}`} />
      ))}
      {count !== undefined && <span className="text-xs text-gray-400 ml-0.5">({count})</span>}
    </div>
  )
}

export const metadata: Metadata = {
  title: { absolute: 'Stallspace | Your Marketplace' },
  description: 'Discover trusted local vendors, compare prices, and shop directly from independent businesses. No middlemen — just local sellers you can trust.',
}

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: categories },
    { data: featuredProducts },
    { data: featuredVendors },
    { data: trendingProducts },
    { data: banners },
  ] = await Promise.all([
    supabase.from('categories').select('id, name, slug, icon, product_count').order('sort_order').limit(8),
    supabase.from('products').select(`id, name, slug, price, compare_at_price, images, is_featured, track_inventory, stock_quantity, vendor:vendors(id, business_name, slug, city), category:categories(name, slug)`).eq('is_featured', true).eq('is_available', true).eq('is_archived', false).order('created_at', { ascending: false }).limit(8),
    supabase.from('vendors').select('id, business_name, slug, logo_url, banner_url, business_description, city, province').eq('status', 'approved').order('created_at', { ascending: false }).limit(4),
    supabase.from('products').select('id, name, slug, price, images, vendor:vendors(business_name, slug)').eq('is_available', true).eq('is_archived', false).order('view_count', { ascending: false }).limit(6),
    supabase.from('homepage_content').select('section, content, is_active').in('section', ['hero', 'banner_1', 'banner_2']).eq('is_active', true),
  ])

  const heroBanner = banners?.find((b: any) => b.section === 'hero')

  return (
    <div className="bg-white">

      {/* HERO */}
      <section
        // Background position is left-anchored on mobile so a wide banner
        // doesn't crop to its middle and crowd the headline.
        className={`relative overflow-hidden bg-cover bg-left sm:bg-center ${heroBanner?.content?.image_url ? '' : 'bg-[#F8FAF3]'}`}
        style={
          heroBanner?.content?.image_url
            ? { backgroundImage: `url(${heroBanner.content.image_url})` }
            : undefined
        }
      >
        {heroBanner?.content?.image_url && (
          // Solid, even darkening on mobile for legibility; directional fade on desktop.
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A2A20]/90 to-[#0D3B2E]/80 sm:bg-gradient-to-r sm:from-[#0A2A20]/90 sm:via-[#0D3B2E]/60 sm:to-[#0D3B2E]/20" />
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8 min-h-[420px] sm:min-h-[500px]">
            <div className="py-10 sm:py-16 lg:py-24">
              <span className={`inline-flex items-center gap-2 border text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full mb-6 ${heroBanner?.content?.image_url ? 'bg-white/10 border-white/25 text-white' : 'bg-white border-[#2ECC8E]/25 text-[#0D3B2E]'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC8E]" />
                All vendors vetted &amp; verified
              </span>
              <h1 className={`text-[32px] sm:text-5xl lg:text-[54px] font-bold leading-[1.1] tracking-tight mb-4 sm:mb-5 ${heroBanner?.content?.image_url ? 'text-white' : 'text-[#0D3B2E]'}`}>
                {heroBanner?.content?.title || (<>Your marketplace<br />for <span className="text-[#2ECC8E]">local stalls.</span></>)}
              </h1>
              <p className={`text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-[420px] ${heroBanner?.content?.image_url ? 'text-white/80' : 'text-[#4B5563]'}`}>
                {heroBanner?.content?.subtitle || 'Discover trusted vendors. Compare prices. Support local.'}
              </p>
              <form action="/marketplace/search" method="GET">
                <div className="flex items-center bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden max-w-[500px] mb-5">
                  <Search size={18} className="ml-4 text-[#9CA3AF] flex-shrink-0" />
                  <input type="text" name="q" placeholder="Search products, categories, or vendors..." className="flex-1 px-3 py-4 text-sm text-[#111111] placeholder:text-[#9CA3AF] outline-none bg-transparent" />
                  <button type="submit" className="m-1.5 bg-[#2ECC8E] hover:bg-[#22a370] transition-colors text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex-shrink-0">Search</button>
                </div>
              </form>
              <div className="flex items-center gap-2 flex-wrap mb-8">
                <span className={`text-xs ${heroBanner?.content?.image_url ? 'text-white/60' : 'text-[#9CA3AF]'}`}>Popular:</span>
                {['Electronics', 'Handmade', 'Food & Drink', 'Fashion', 'Skincare'].map(tag => (
                  <Link key={tag} href={`/marketplace/search?q=${encodeURIComponent(tag)}`} className={`text-xs font-medium transition-colors underline underline-offset-2 ${heroBanner?.content?.image_url ? 'text-white hover:text-[#2ECC8E]' : 'text-[#0D3B2E] hover:text-[#2ECC8E]'}`}>{tag}</Link>
                ))}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Link href={heroBanner?.content?.cta_url || '/marketplace'} className="bg-[#0D3B2E] hover:bg-[#081f18] text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors">{heroBanner?.content?.cta_text || 'Shop Now'}</Link>
                <Link href="/marketplace/vendors" className={`text-sm font-semibold px-6 py-3 rounded-lg border transition-colors ${heroBanner?.content?.image_url ? 'bg-white/10 hover:bg-white/20 text-white border-white/30' : 'bg-white hover:bg-[#F8FAF3] text-[#0D3B2E] border-[#E5E7EB]'}`}>Explore Vendors</Link>
              </div>
            </div>
            {!heroBanner?.content?.image_url && (
              <div className="hidden lg:flex items-center justify-center">
                {/* Decorative placeholder shown only until an admin uploads a hero banner in Admin → Content */}
                <div className="relative w-full max-w-[440px] aspect-[4/3]">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#0D3B2E] to-[#2ECC8E] opacity-90" />
                  <div className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center text-center px-8">
                    <span className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-3">Stallspace</span>
                    <p className="text-white text-2xl font-bold leading-snug">Vetted vendors.<br />Direct payments.</p>
                    <p className="text-white/75 text-sm mt-3">Shop local, buy with confidence.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* PROMOTIONAL BANNERS */}
      {banners && banners.filter((b: any) => b.section !== 'hero').length > 0 && (
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            {banners.filter((b: any) => b.section !== 'hero').map((banner: any) => (
              <div key={banner.section} className="relative rounded-2xl overflow-hidden min-h-[140px] flex items-center"
                style={banner.content.image_url ? { backgroundImage: `url(${banner.content.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#0D3B2E' }}>
                <div className="absolute inset-0 bg-[#0D3B2E]/70" />
                <div className="relative z-10 px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                  <div>
                    {banner.content.title && <h3 className="text-xl font-bold text-white mb-1">{banner.content.title}</h3>}
                    {banner.content.subtitle && <p className="text-white/70 text-sm">{banner.content.subtitle}</p>}
                  </div>
                  {banner.content.cta_text && banner.content.cta_url && (
                    <a href={banner.content.cta_url} className="flex-shrink-0 bg-[#2ECC8E] hover:bg-[#22a370] text-[#0D3B2E] font-bold text-sm px-6 py-3 rounded-xl transition-colors whitespace-nowrap">
                      {banner.content.cta_text}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CATEGORIES */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Shop by Category</h2>
              <p className="text-[#6B7280] text-sm mt-1">Find exactly what you&apos;re looking for</p>
            </div>
            <Link href="/marketplace/products" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#2ECC8E] hover:underline">View all <ChevronRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
            {(categories ?? []).map((cat) => (
              <Link key={cat.slug} href={`/marketplace/products?category=${cat.slug}`}
                className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#2ECC8E] hover:shadow-sm transition-all text-center">
                <div className="w-11 h-11 rounded-xl bg-[#F8FAF3] text-[#0D3B2E] flex items-center justify-center group-hover:bg-[#0D3B2E] group-hover:text-white transition-colors">
                  {getCategoryIcon(cat.slug)}
                </div>
                <span className="text-xs font-semibold text-[#374151] group-hover:text-[#0D3B2E] leading-tight transition-colors">{cat.name}</span>
                {cat.product_count !== undefined && <span className="text-[10px] text-[#9CA3AF]">{cat.product_count}</span>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-14 bg-[#F7F5F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-[#2ECC8E]" />
                <span className="text-[#2ECC8E] text-xs font-bold uppercase tracking-wider">Handpicked</span>
              </div>
              <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Featured Products</h2>
            </div>
            <Link href="/marketplace/products?featured=true" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#2ECC8E] hover:underline">View all <ChevronRight className="w-4 h-4" /></Link>
          </div>
          {!featuredProducts || featuredProducts.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-[#E5E7EB] overflow-hidden bg-white">
                  <div className="aspect-square bg-[#F8FAF3] animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-[#F8FAF3] rounded w-1/2 animate-pulse" />
                    <div className="h-4 bg-[#F8FAF3] rounded animate-pulse" />
                    <div className="h-5 bg-[#F8FAF3] rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product: any) => {
                const discount = (product.compare_at_price && Number(product.compare_at_price) > Number(product.price))
                  ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100) : null
                const outOfStock = product.track_inventory && (product.stock_quantity ?? 0) <= 0
                return (
                  <div key={product.id} className="group bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative aspect-square bg-[#F8FAF3] overflow-hidden">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-[#D1D5DB]" /></div>
                      )}
                      {discount && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{discount}%</span>}
                      {outOfStock && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="bg-white text-[#374151] text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span></div>}
                    </div>
                    <div className="p-4">
                      {product.vendor && <Link href={`/marketplace/store/${product.vendor.slug}`} className="text-[11px] text-[#2ECC8E] font-semibold hover:underline uppercase tracking-wide">{product.vendor.business_name}</Link>}
                      <Link href={`/marketplace/products/${product.slug}`}>
                        <h3 className="text-sm font-semibold text-[#111111] mt-1 mb-3 line-clamp-2 leading-snug hover:text-[#0D3B2E] transition-colors">{product.name}</h3>
                      </Link>
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <div className="text-base font-bold text-[#0D3B2E]">R{Number(product.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
                          {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                            <div className="text-xs text-[#9CA3AF] line-through">R{Number(product.compare_at_price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
                          )}
                        </div>
                        <Link href={`/marketplace/products/${product.slug}`} className="flex-shrink-0 bg-[#0D3B2E] hover:bg-[#081f18] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">View</Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="text-center mt-10">
            <Link href="/marketplace/products" className="inline-flex items-center gap-2 border-2 border-[#0D3B2E] text-[#0D3B2E] font-semibold px-8 py-3 rounded-xl hover:bg-[#0D3B2E] hover:text-white transition-all">
              Browse All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED VENDORS */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-[#2ECC8E]" />
                <span className="text-[#2ECC8E] text-xs font-bold uppercase tracking-wider">Verified</span>
              </div>
              <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Featured Vendors</h2>
            </div>
            <Link href="/marketplace/vendors" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#2ECC8E] hover:underline">All vendors <ChevronRight className="w-4 h-4" /></Link>
          </div>
          {!featuredVendors || featuredVendors.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-[#E5E7EB] overflow-hidden animate-pulse">
                  <div className="h-20 bg-[#F8FAF3]" />
                  <div className="p-4 space-y-2">
                    <div className="h-10 w-10 bg-[#F8FAF3] rounded-xl" />
                    <div className="h-4 bg-[#F8FAF3] rounded w-2/3" />
                    <div className="h-3 bg-[#F8FAF3] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredVendors.map((vendor: any) => (
                <Link key={vendor.slug} href={`/marketplace/store/${vendor.slug}`}
                  className="group bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="relative h-20 bg-[#0D3B2E] overflow-hidden">
                    {vendor.banner_url ? <img src={vendor.banner_url} alt="" className="w-full h-full object-cover" /> : (
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(46,204,142,.5) 8px,rgba(46,204,142,.5) 9px)' }} />
                    )}
                  </div>
                  <div className="p-4 pt-0">
                    <div className="relative -mt-6 mb-3">
                      <div className="w-12 h-12 rounded-xl border-2 border-white bg-white shadow-md overflow-hidden">
                        {vendor.logo_url ? <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" /> : (
                          <div className="w-full h-full bg-[#0D3B2E] flex items-center justify-center"><span className="text-white font-bold text-lg">{vendor.business_name[0]}</span></div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-[#111111] group-hover:text-[#0D3B2E] transition-colors leading-snug">{vendor.business_name}</h3>
                      <ShieldCheck className="w-4 h-4 text-[#2ECC8E] flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1 line-clamp-2 leading-relaxed">{vendor.business_description}</p>
                    {(vendor.city || vendor.province) && (
                      <div className="flex items-center gap-1 mt-2.5 text-xs text-[#9CA3AF]">
                        <MapPin className="w-3 h-3" />{[vendor.city, vendor.province].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TRENDING NOW */}
      {trendingProducts && trendingProducts.length > 0 && (
        <section className="py-14 bg-[#F7F5F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-8">
              <TrendingUp className="w-5 h-5 text-[#2ECC8E]" />
              <h2 className="text-2xl font-bold text-[#111111] tracking-tight">Trending Now</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trendingProducts.map((product: any) => (
                <Link key={product.id} href={`/marketplace/products/${product.slug}`}
                  className="flex items-center gap-4 bg-white rounded-2xl p-3 border border-[#E5E7EB] hover:border-[#2ECC8E] hover:shadow-sm transition-all">
                  <div className="w-16 h-16 rounded-xl bg-[#F8FAF3] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-[#D1D5DB]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#9CA3AF] truncate">{(product.vendor as any)?.business_name}</p>
                    <p className="text-sm font-semibold text-[#111111] line-clamp-2 leading-snug mt-0.5">{product.name}</p>
                    <p className="text-[#0D3B2E] font-bold text-sm mt-1">R{Number(product.price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="py-16 bg-[#0D3B2E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white tracking-tight">How Stallspace works</h2>
            <p className="text-white/50 text-sm mt-2">Simple, transparent, and built for South Africa</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Search className="w-5 h-5" />,     title: 'Browse & Discover',        desc: 'Find products from vetted South African vendors.' },
              { icon: <Store className="w-5 h-5" />,      title: 'Visit Vendor Storefronts', desc: 'Explore dedicated stores, read reviews, and compare products.' },
              { icon: <CreditCard className="w-5 h-5" />, title: 'Pay Directly & Securely',  desc: 'Pay the vendor directly via PayFast, or pay on collection.' },
            ].map((step, i) => (
              <div key={step.title} className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/8 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#2ECC8E]/15 text-[#2ECC8E] flex items-center justify-center mb-5">{step.icon}</div>
                <div className="text-[11px] font-bold text-[#2ECC8E]/60 uppercase tracking-wider mb-2">Step {i + 1}</div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="py-12 border-t border-[#E5E7EB] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: <ShieldCheck className="w-6 h-6 mx-auto text-[#2ECC8E]" />, title: 'Secure Payments', desc: 'SSL encrypted. Pay directly to vendors.' },
              { icon: <ShieldCheck className="w-6 h-6 mx-auto text-[#2ECC8E]" />, title: 'Vetted Vendors',  desc: 'All vendors reviewed and approved.' },
              { icon: <MapPin      className="w-6 h-6 mx-auto text-[#2ECC8E]" />, title: 'SA Business',     desc: 'Supporting local South African vendors.' },
              { icon: <Truck       className="w-6 h-6 mx-auto text-[#2ECC8E]" />, title: 'POPIA Compliant', desc: 'Your data is protected by law.' },
            ].map(item => (
              <div key={item.title} className="p-4">
                <div className="mb-3">{item.icon}</div>
                <h4 className="font-bold text-[#111111] text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-[#6B7280] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VENDOR CTA */}
      <section className="py-16 bg-[#F8FAF3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0D3B2E] rounded-3xl px-8 py-12 md:px-14 md:py-14 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-[#2ECC8E]/10 pointer-events-none" />
            <div className="absolute right-8 -bottom-12 w-48 h-48 rounded-full bg-[#2ECC8E]/6 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">
                Sell on Stallspace.<br /><span className="text-[#2ECC8E]">Reach more customers.</span>
              </h3>
              <p className="text-white/55 text-sm max-w-md">Join South Africa&apos;s vetted marketplace. Plans from R250/month.</p>
            </div>
            <Link href="/join" className="relative z-10 flex-shrink-0 inline-flex items-center gap-2 bg-[#2ECC8E] hover:bg-[#22a370] text-[#0D3B2E] font-bold text-sm px-8 py-4 rounded-xl transition-colors whitespace-nowrap">
              Apply as a Vendor <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
