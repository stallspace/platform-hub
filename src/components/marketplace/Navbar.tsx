'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart, Menu, X, ChevronDown, User } from 'lucide-react'

const categories = [
  'Electronics', 'Fashion & Clothing', 'Home & Garden',
  'Health & Beauty', 'Food & Beverages', 'Sports & Outdoor',
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-brand-navy shadow-lg">
      {/* Top bar */}
      <div className="bg-brand-navy-dark py-1.5 px-4 text-center text-xs text-gray-300">
        🇿🇦 South Africa&apos;s Vetted Online Marketplace — Trusted vendors, direct payments
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">MARCRTE</span>
          </Link>

          {/* Search bar - desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products, vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 rounded-lg bg-white/10 text-white placeholder:text-gray-300 
                           border border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-accent 
                           focus:bg-white focus:text-gray-900 focus:placeholder:text-gray-400 transition-all"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Categories dropdown */}
            <div className="relative">
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center gap-1 text-gray-200 hover:text-white px-3 py-2 rounded-lg 
                           hover:bg-white/10 transition-colors text-sm font-medium"
              >
                Categories <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {categoriesOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
                  {categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/marketplace/categories`}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      {cat}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Link
                      href="/marketplace/categories"
                      className="block px-3 py-2 text-sm text-brand-accent font-medium hover:bg-gray-50 rounded-lg"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      View all categories →
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

            <Link
              href="/marketplace/products"
              className="text-gray-200 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
            >
              Products
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/vendor/register"
              className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-accent 
                         hover:bg-brand-accent-dark px-4 py-2 rounded-lg transition-colors"
            >
              Sell Here
            </Link>

            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 text-gray-200 hover:text-white px-3 py-2 rounded-lg 
                         hover:bg-white/10 transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Account</span>
            </Link>

            <Link
              href="/marketplace/cart"
              className="relative flex items-center text-gray-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                0
              </span>
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-gray-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products, vendors..."
              className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-white/10 text-white placeholder:text-gray-300 
                         border border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-accent text-sm"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-brand-navy-light border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            <Link href="/marketplace/products" className="block py-2 text-gray-200 hover:text-white text-sm">Products</Link>
            <Link href="/marketplace/vendors" className="block py-2 text-gray-200 hover:text-white text-sm">Vendors</Link>
            <Link href="/marketplace/categories" className="block py-2 text-gray-200 hover:text-white text-sm">Categories</Link>
            <div className="pt-2 border-t border-white/10">
              <Link
                href="/vendor/register"
                className="block w-full text-center py-2.5 text-sm font-semibold text-white bg-brand-accent rounded-lg"
              >
                Sell on MARCRTE
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
