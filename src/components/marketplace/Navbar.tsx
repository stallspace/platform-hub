'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search, ShoppingCart, Menu, X, ChevronDown, User,
  Heart, GitCompare, LayoutGrid, ChevronRight
} from 'lucide-react'
import { useCartStore } from '@/lib/cart/store'

const NAV_CATEGORIES = [
  { name: 'Electronics',      slug: 'electronics' },
  { name: 'Fashion',          slug: 'fashion-clothing' },
  { name: 'Home & Garden',    slug: 'home-garden' },
  { name: 'Health & Beauty',  slug: 'health-beauty' },
  { name: 'Food & Beverages', slug: 'food-beverages' },
  { name: 'Sports & Outdoor', slug: 'sports-outdoor' },
  { name: 'Arts & Crafts',    slug: 'arts-crafts' },
  { name: 'Pet Supplies',     slug: 'pet-supplies' },
]

export default function Navbar() {
  const router = useRouter()
  const [mobileOpen, setMobileOpen]     = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [searchQuery, setSearchQuery]   = useState('')
  const catRef = useRef<HTMLDivElement>(null)
  const cartCount = useCartStore(s => s.itemCount())
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Close categories dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/marketplace/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (searchQuery.trim()) {
        router.push(`/marketplace/search?q=${encodeURIComponent(searchQuery.trim())}`)
      }
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-brand-navy shadow-lg">
      {/* Announcement bar */}
      <div className="bg-black py-1.5 px-4 text-center text-xs text-gray-400 tracking-wide">
        South Africa&apos;s vetted online marketplace — trusted vendors, direct payments
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">

          {/* Logo */}
          <Link href="/marketplace" className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">MARCRTE</span>
          </Link>

          {/* Search bar — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-4">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products, vendors, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKey}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-white/10 text-white placeholder:text-gray-400
                           border border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-accent
                           focus:bg-white focus:text-gray-900 focus:placeholder:text-gray-400 transition-all text-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-accent text-white text-xs font-semibold
                           px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Categories dropdown */}
            <div className="relative" ref={catRef}>
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center gap-1 text-gray-200 hover:text-white px-3 py-2 rounded-lg
                           hover:bg-white/10 transition-colors text-sm font-medium"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Categories
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoriesOpen && (
                <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                  {NAV_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/marketplace/products?category=${cat.slug}`}
                      className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700
                                 hover:bg-gray-50 hover:text-brand-accent transition-colors"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      {cat.name}
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1 px-2">
                    <Link
                      href="/marketplace/products"
                      className="flex items-center justify-between px-2 py-2 text-sm text-brand-accent
                                 font-semibold hover:bg-blue-50 rounded-lg transition-colors"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      Browse all categories
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/marketplace/vendors"
              className="text-gray-200 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
            >
              Vendors
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Compare */}
            <Link
              href="/marketplace/compare"
              title="Compare products"
              className="relative flex items-center text-gray-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <GitCompare className="w-5 h-5" />
            </Link>

            {/* Favourites */}
            <Link
              href="/marketplace/favourites"
              title="Favourites"
              className="relative flex items-center text-gray-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link
              href="/marketplace/cart"
              title="Cart"
              className="relative flex items-center text-gray-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link
              href="/account"
              className="flex items-center gap-1.5 text-gray-200 hover:text-white px-2 py-2 rounded-lg
                         hover:bg-white/10 transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Account</span>
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-gray-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products, vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKey}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/10 text-white placeholder:text-gray-400
                         border border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm"
            />
          </div>
        </form>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-brand-navy border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/marketplace/products"
              className="block py-2.5 text-gray-200 hover:text-white text-sm border-b border-white/5"
              onClick={() => setMobileOpen(false)}
            >
              All Products
            </Link>
            <Link
              href="/marketplace/vendors"
              className="block py-2.5 text-gray-200 hover:text-white text-sm border-b border-white/5"
              onClick={() => setMobileOpen(false)}
            >
              Vendors
            </Link>
            <Link
              href="/marketplace/compare"
              className="flex items-center gap-2 py-2.5 text-gray-200 hover:text-white text-sm border-b border-white/5"
              onClick={() => setMobileOpen(false)}
            >
              <GitCompare className="w-4 h-4" /> Compare Products
            </Link>
            <Link
              href="/marketplace/favourites"
              className="flex items-center gap-2 py-2.5 text-gray-200 hover:text-white text-sm border-b border-white/5"
              onClick={() => setMobileOpen(false)}
            >
              <Heart className="w-4 h-4" /> Favourites
            </Link>

          </div>
        </div>
      )}
    </header>
  )
}
