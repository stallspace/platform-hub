'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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
  const [mobileOpen, setMobileOpen]         = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [searchQuery, setSearchQuery]       = useState('')
  const catRef = useRef<HTMLDivElement>(null)
  const cartCount = useCartStore(s => s.itemCount())
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

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
    <header className="sticky top-0 z-50">

      {/* Announcement bar — forest green */}
      <div className="bg-[#0D3B2E] py-1.5 px-4 text-center text-xs text-white/70 tracking-wide">
        Your Marketplace | Proudly South African
      </div>

      {/* Main nav — white */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 h-16">

            {/* Logo — fixed height, auto width so it doesn't stretch */}
            <Link href="/marketplace" className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Stallspace"
                width={55}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>

            {/* Search bar — desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search products, vendors, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKey}
                  className="w-full pl-11 pr-24 py-2.5 rounded-lg bg-[#F8FAF3] text-[#111111]
                             placeholder:text-[#9CA3AF] border border-[#E5E7EB]
                             focus:outline-none focus:ring-2 focus:ring-[#2ECC8E] focus:border-transparent
                             transition-all text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#2ECC8E] hover:bg-[#22a370]
                             text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-1">
              <div className="relative" ref={catRef}>
                <button
                  onClick={() => setCategoriesOpen(!categoriesOpen)}
                  className="flex items-center gap-1.5 text-[#374151] hover:text-[#0D3B2E] px-3 py-2 rounded-lg
                             hover:bg-[#F8FAF3] transition-colors text-sm font-medium"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Categories
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                </button>

                {categoriesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-2xl border border-[#E5E7EB] py-2 z-50">
                    {NAV_CATEGORIES.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/marketplace/products?category=${cat.slug}`}
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-[#374151]
                                   hover:bg-[#F8FAF3] hover:text-[#0D3B2E] transition-colors"
                        onClick={() => setCategoriesOpen(false)}
                      >
                        {cat.name}
                        <ChevronRight className="w-3.5 h-3.5 text-[#D1D5DB]" />
                      </Link>
                    ))}
                    <div className="border-t border-[#E5E7EB] mt-1 pt-1 px-2">
                      <Link
                        href="/marketplace/products"
                        className="flex items-center justify-between px-2 py-2 text-sm text-[#2ECC8E]
                                   font-semibold hover:bg-[#F8FAF3] rounded-lg transition-colors"
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
                className="text-[#374151] hover:text-[#0D3B2E] px-3 py-2 rounded-lg
                           hover:bg-[#F8FAF3] transition-colors text-sm font-medium"
              >
                Vendors
              </Link>
            </nav>

            {/* Right actions — plain icons, no box backgrounds */}
            <div className="flex items-center gap-4 ml-auto">

              <Link href="/marketplace/compare" className="hidden sm:flex flex-col items-center gap-0.5 text-[#6B7280] hover:text-[#0D3B2E] transition-colors">
                <GitCompare className="w-5 h-5" />
                <span className="text-[10px] font-medium">Compare</span>
              </Link>

              <Link href="/account/favourites" className="hidden sm:flex flex-col items-center gap-0.5 text-[#6B7280] hover:text-[#0D3B2E] transition-colors">
                <Heart className="w-5 h-5" />
                <span className="text-[10px] font-medium">Favourites</span>
              </Link>

              <Link href="/marketplace/cart" className="relative flex flex-col items-center gap-0.5 text-[#6B7280] hover:text-[#0D3B2E] transition-colors">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-[10px] font-medium hidden sm:block">Cart</span>
                {mounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[10px]
                                   rounded-full flex items-center justify-center font-bold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              <Link href="/account" className="flex flex-col items-center gap-0.5 text-[#6B7280] hover:text-[#0D3B2E] transition-colors">
                <User className="w-5 h-5" />
                <span className="text-[10px] font-medium hidden sm:block">Account</span>
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden text-[#6B7280] hover:text-[#0D3B2E] transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <form onSubmit={handleSearch} className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
              <input
                type="text"
                placeholder="Search products, vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKey}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#F8FAF3] text-[#111111]
                           placeholder:text-[#9CA3AF] border border-[#E5E7EB]
                           focus:outline-none focus:ring-2 focus:ring-[#2ECC8E] text-sm"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-[#E5E7EB]">
          <div className="px-4 py-3 space-y-1">
            <Link href="/marketplace/products"  className="block py-2.5 text-[#374151] hover:text-[#0D3B2E] text-sm border-b border-[#F3F4F6]" onClick={() => setMobileOpen(false)}>All Products</Link>
            <Link href="/marketplace/vendors"   className="block py-2.5 text-[#374151] hover:text-[#0D3B2E] text-sm border-b border-[#F3F4F6]" onClick={() => setMobileOpen(false)}>Vendors</Link>
            <Link href="/marketplace/compare"   className="flex items-center gap-2 py-2.5 text-[#374151] hover:text-[#0D3B2E] text-sm border-b border-[#F3F4F6]" onClick={() => setMobileOpen(false)}><GitCompare className="w-4 h-4" /> Compare</Link>
            <Link href="/account/favourites" className="flex items-center gap-2 py-2.5 text-[#374151] hover:text-[#0D3B2E] text-sm" onClick={() => setMobileOpen(false)}><Heart className="w-4 h-4" /> Favourites</Link>
          </div>
        </div>
      )}
    </header>
  )
}
