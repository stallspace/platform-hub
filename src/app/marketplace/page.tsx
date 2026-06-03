'use client'

import Link from 'next/link'
import {
  Search, ShieldCheck, CreditCard, Store, ArrowRight,
  TrendingUp, Package, Star, ChevronRight, Zap
} from 'lucide-react'

// --- Mock data (replace with Supabase queries) ---

const FEATURED_CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', icon: '💻', count: 234 },
  { name: 'Fashion', slug: 'fashion-clothing', icon: '👗', count: 189 },
  { name: 'Home & Garden', slug: 'home-garden', icon: '🏡', count: 156 },
  { name: 'Health & Beauty', slug: 'health-beauty', icon: '💆', count: 201 },
  { name: 'Food & Drinks', slug: 'food-beverages', icon: '🍎', count: 93 },
  { name: 'Sports', slug: 'sports-outdoor', icon: '🏃', count: 117 },
  { name: 'Arts & Crafts', slug: 'arts-crafts', icon: '🎨', count: 74 },
  { name: 'Pet Supplies', slug: 'pet-supplies', icon: '🐾', count: 65 },
]

const FEATURED_PRODUCTS = [
  { id: '1', name: 'Wireless Noise-Cancelling Headphones', price: 1299, compare_at_price: 1799, vendor: 'TechHub SA', category: 'Electronics', badge: 'Hot', rating: 4.8 },
  { id: '2', name: 'Handmade Leather Crossbody Bag', price: 849, compare_at_price: null, vendor: 'Cape Leather Co', category: 'Fashion', badge: 'New', rating: 5.0 },
  { id: '3', name: 'Premium Rooibos Gift Set', price: 299, compare_at_price: 349, vendor: 'Karoo Harvest', category: 'Food', badge: 'Sale', rating: 4.9 },
  { id: '4', name: 'Resistance Band Training Kit', price: 399, compare_at_price: null, vendor: 'FitCore ZA', category: 'Sports', badge: null, rating: 4.7 },
  { id: '5', name: 'African Art Print — Landscape', price: 599, compare_at_price: null, vendor: 'Ubuntu Gallery', category: 'Arts', badge: 'Featured', rating: 4.9 },
  { id: '6', name: 'Smart LED Desk Lamp', price: 549, compare_at_price: 699, vendor: 'TechHub SA', category: 'Electronics', badge: 'Sale', rating: 4.6 },
  { id: '7', name: 'Natural Baobab Skincare Set', price: 425, compare_at_price: null, vendor: 'Wildcraft SA', category: 'Beauty', badge: 'New', rating: 4.8 },
  { id: '8', name: 'Ceramic Pour-Over Coffee Set', price: 780, compare_at_price: 920, vendor: 'Joburg Roasters', category: 'Food', badge: null, rating: 4.7 },
]

const FEATURED_VENDORS = [
  { slug: 'techhub-sa', name: 'TechHub SA', description: 'Premium electronics and tech accessories', products: 87, rating: 4.8, initial: 'T', color: 'from-blue-600 to-blue-800' },
  { slug: 'cape-leather-co', name: 'Cape Leather Co', description: 'Handcrafted leather goods from the Cape', products: 43, rating: 5.0, initial: 'C', color: 'from-amber-600 to-amber-800' },
  { slug: 'karoo-harvest', name: 'Karoo Harvest', description: 'Artisan food products from the Karoo', products: 56, rating: 4.9, initial: 'K', color: 'from-green-600 to-green-800' },
  { slug: 'wildcraft-sa', name: 'Wildcraft SA', description: 'Natural skincare from indigenous plants', products: 31, rating: 4.8, initial: 'W', color: 'from-emerald-600 to-teal-800' },
]

const TRUST_STATS = [
  { value: '20+', label: 'Vetted Vendors' },
  { value: '5,000+', label: 'Products Listed' },
  { value: '1,000+', label: 'Happy Customers' },
  { value: '100%', label: 'Secure Payments' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: <Search className="w-6 h-6" />,
    title: 'Browse & Discover',
    description: 'Search thousands of products from vetted South African vendors.',
  },
  {
    step: '02',
    icon: <Store className="w-6 h-6" />,
    title: 'Visit Vendor Storefronts',
    description: 'Explore dedicated vendor stores. Read reviews, compare products.',
  },
  {
    step: '03',
    icon: <CreditCard className="w-6 h-6" />,
    title: 'Pay Directly & Securely',
    description: 'Purchase directly from the vendor via PayFast, Peach, Yoco, or Ozow.',
  },
]

const BADGE_COLORS: Record<string, string> = {
  Hot: 'bg-red-500 text-white',
  New: 'bg-green-500 text-white',
  Sale: 'bg-orange-500 text-white',
  Featured: 'bg-brand-accent text-white',
}

export default function HomePage() {
  return (
    <div className="bg-white">

      {/* ======================================================
          HERO SECTION
      ====================================================== */}
      <section className="relative bg-brand-navy overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            {/* Pill tag */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span className="text-white/90 text-sm font-medium">All vendors are vetted & verified</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-5">
              Your Own <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500">
                Marketplace
              </span>
            </h1>

            <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
              Discover trusted local vendors. Browse thousands of products. Pay securely, directly to the seller.
            </p>

            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for products, categories, or vendors..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 placeholder:text-gray-400
                             focus:outline-none focus:ring-2 focus:ring-brand-accent shadow-lg text-sm"
                />
              </div>
              <Link
                href="/marketplace/products"
                className="inline-flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent-dark 
                           text-white font-semibold px-6 py-4 rounded-xl transition-colors shadow-lg text-sm whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                Search
              </Link>
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap gap-2">
              <span className="text-gray-400 text-sm">Popular:</span>
              {['Electronics', 'Handmade', 'Food & Drink', 'Fashion', 'Skincare'].map((tag) => (
                <Link
                  key={tag}
                  href={`/marketplace/search?q=${tag.toLowerCase()}`}
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
              {TRUST_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          CATEGORIES SECTION
      ====================================================== */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-brand-navy">Shop by Category</h2>
              <p className="text-gray-500 text-sm mt-1">Find exactly what you&apos;re looking for</p>
            </div>
            <Link
              href="/marketplace/categories"
              className="hidden sm:flex items-center gap-1 text-brand-accent font-medium text-sm hover:underline"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {FEATURED_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/marketplace/categories`}
                className="group bg-white rounded-xl p-4 text-center border border-gray-100 
                           hover:border-brand-accent hover:shadow-md transition-all duration-200"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <div className="text-xs font-semibold text-gray-800 group-hover:text-brand-accent transition-colors leading-tight">
                  {cat.name}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{cat.count}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          FEATURED PRODUCTS SECTION
      ====================================================== */}
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
              href="/marketplace/products"
              className="hidden sm:flex items-center gap-1 text-brand-accent font-medium text-sm hover:underline"
            >
              View all products <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {FEATURED_PRODUCTS.map((product) => (
              <div key={product.id} className="card group cursor-pointer overflow-hidden">
                {/* Image placeholder */}
                <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300" />
                  </div>
                  {product.badge && (
                    <span className={`absolute top-2 left-2 badge text-xs ${BADGE_COLORS[product.badge] ?? 'bg-gray-200 text-gray-700'}`}>
                      {product.badge}
                    </span>
                  )}
                  {product.compare_at_price && (
                    <span className="absolute top-2 right-2 badge bg-red-500 text-white text-xs">
                      -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <Link
                    href={`/marketplace/store/${product.vendor.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-xs text-brand-accent font-medium hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {product.vendor}
                  </Link>
                  <Link href={`/marketplace/products/${product.id}`}>
                    <h3 className="text-sm font-semibold text-gray-900 mt-1 mb-2 line-clamp-2 hover:text-brand-accent transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${s <= Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">{product.rating}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-brand-navy text-base">
                        R{product.price.toLocaleString('en-ZA')}
                      </span>
                      {product.compare_at_price && (
                        <span className="text-xs text-gray-400 line-through ml-1.5">
                          R{product.compare_at_price.toLocaleString('en-ZA')}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/marketplace/products/${product.id}`}
                      className="text-xs font-semibold bg-brand-accent text-white px-3 py-1.5 rounded-lg hover:bg-brand-accent-dark transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

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

      {/* ======================================================
          FEATURED VENDORS
      ====================================================== */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURED_VENDORS.map((vendor) => (
              <Link
                key={vendor.slug}
                href={`/marketplace/store/${vendor.slug}`}
                className="card group overflow-hidden hover:-translate-y-0.5 transition-transform duration-200"
              >
                {/* Banner */}
                <div className={`h-20 bg-gradient-to-r ${vendor.color}`} />

                <div className="p-4 pt-0">
                  {/* Logo */}
                  <div className="relative -mt-8 mb-3">
                    <div className="w-16 h-16 rounded-xl border-4 border-white bg-brand-navy flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-xl">{vendor.initial}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 group-hover:text-brand-accent transition-colors">
                    {vendor.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{vendor.description}</p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Package className="w-3.5 h-3.5" />
                      {vendor.products} products
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-gray-700">{vendor.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          HOW IT WORKS
      ====================================================== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-navy">How MARCRTE Works</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">
              A simple, secure way to shop from trusted South African vendors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative text-center">
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gray-100 -z-0" />
                )}

                <div className="relative z-10 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-navy text-white mb-5 shadow-lg">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-brand-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          TRENDING / POPULAR PRODUCTS
      ====================================================== */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="w-6 h-6 text-brand-accent" />
            <h2 className="text-2xl md:text-3xl font-bold text-brand-navy">Trending Now</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURED_PRODUCTS.slice(0, 4).map((product) => (
              <Link
                key={product.id}
                href={`/marketplace/products/${product.id}`}
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 hover:border-brand-accent hover:shadow-md transition-all"
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-gray-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">{product.name}</p>
                  <p className="text-brand-accent font-bold text-sm mt-1">R{product.price.toLocaleString('en-ZA')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          VENDOR CTA BANNER
      ====================================================== */}
      <section className="py-16 bg-brand-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <Store className="w-4 h-4 text-blue-300" />
              <span className="text-white/90 text-sm font-medium">For Business Owners</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Grow Your Business on MARCRTE
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Join South Africa&apos;s fastest-growing vetted marketplace. Set up your storefront, list your products, and reach thousands of customers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/vendor/register"
                className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-accent-dark text-white font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg"
              >
                Start Selling Today <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:border-white transition-colors"
              >
                View Pricing Plans
              </Link>
            </div>

            {/* Plan previews */}
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { name: 'Starter', price: 'R199', limit: '100 products' },
                { name: 'Growth', price: 'R399', limit: '500 products' },
                { name: 'Premium', price: 'R699', limit: 'Unlimited' },
              ].map((plan) => (
                <div key={plan.name} className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <div className="text-xs text-gray-400">{plan.name}</div>
                  <div className="text-white font-bold text-lg">{plan.price}</div>
                  <div className="text-xs text-gray-400">{plan.limit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          TRUST / SECURITY SECTION
      ====================================================== */}
      <section className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: '🔒', title: 'Secure Payments', desc: 'SSL encrypted. Pay directly to vendors.' },
              { icon: '✅', title: 'Vetted Vendors', desc: 'All vendors reviewed and approved.' },
              { icon: '🇿🇦', title: 'SA Business', desc: 'Supporting local South African vendors.' },
              { icon: '📋', title: 'POPIA Compliant', desc: 'Your data is protected by law.' },
            ].map((item) => (
              <div key={item.title} className="p-4">
                <div className="text-3xl mb-3">{item.icon}</div>
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
