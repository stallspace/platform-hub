import { Search, SlidersHorizontal } from 'lucide-react'

export default function ProductsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">All Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">Browse thousands of products from vetted vendors</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4 font-semibold text-gray-900">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </div>

            {/* Price Range */}
            <div className="mb-5">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range</h4>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" className="input text-sm py-2" />
                <span className="text-gray-400">—</span>
                <input type="number" placeholder="Max" className="input text-sm py-2" />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-5">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Category</h4>
              <div className="space-y-2">
                {['Electronics', 'Fashion', 'Home & Garden', 'Health & Beauty', 'Food & Drinks'].map((cat) => (
                  <label key={cat} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                    <input type="checkbox" className="rounded border-gray-300 text-brand-accent" />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Availability</h4>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-brand-accent" />
                In Stock Only
              </label>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {/* Search + Sort bar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="input pl-10 py-2.5 text-sm"
              />
            </div>
            <select className="input py-2.5 text-sm w-40">
              <option>Newest</option>
              <option>Price: Low–High</option>
              <option>Price: High–Low</option>
              <option>Most Popular</option>
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Product cards will be rendered here */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-5 bg-gray-100 rounded w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
