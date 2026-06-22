import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Search, MapPin, Package, ShieldCheck, ChevronRight,
  Store, SlidersHorizontal, X, ArrowRight
} from 'lucide-react'

interface PageProps {
  searchParams: {
    q?: string
    city?: string
  }
}

export const metadata: Metadata = {
  title: 'All Vendors',
  description: 'Discover trusted local vendors. Browse storefronts and shop directly from independent businesses near you.',
}

export default async function VendorsPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const q = searchParams.q?.trim() ?? ''
  const cityFilter = searchParams.city ?? ''

  let query = supabase
    .from('vendors')
    .select('id, business_name, slug, logo_url, banner_url, business_description, city, province, business_category')
    .eq('status', 'approved')
    .order('business_name')

  if (q) query = query.ilike('business_name', `%${q}%`)
  if (cityFilter) query = query.eq('city', cityFilter)

  const { data: vendors } = await query

  const { data: allVendors } = await supabase
    .from('vendors')
    .select('city')
    .eq('status', 'approved')
    .not('city', 'is', null)

  const rawCities = (allVendors ?? []).map((v: any) => v.city).filter(Boolean) as string[]
  const cities = [...new Set(rawCities)].sort()

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="bg-brand-forest">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vendor Directory</h1>
              <p className="text-white/60 text-sm">
                {vendors?.length ?? 0} verified vendor{(vendors?.length ?? 0) !== 1 ? 's' : ''} on Stallspace
              </p>
            </div>
          </div>

          <form action="/marketplace/vendors" method="GET" className="flex gap-2 max-w-xl">
            {cityFilter && <input type="hidden" name="city" value={cityFilter} />}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search vendors by name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-gray-900 placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-brand-mint text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-mint hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Search
            </button>
            {(q || cityFilter) && (
              <Link
                href="/marketplace/vendors"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Clear
              </Link>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          {cities.length > 0 && (
            <aside className="w-full lg:w-56 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filter by City
                </div>
                <div className="space-y-1">
                  <Link
                    href={q ? `/marketplace/vendors?q=${encodeURIComponent(q)}` : '/marketplace/vendors'}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${!cityFilter ? 'bg-brand-mint/10 text-brand-mint font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    All Cities
                  </Link>
                  {cities.map((city) => (
                    <Link
                      key={city}
                      href={`/marketplace/vendors?${q ? `q=${encodeURIComponent(q)}&` : ''}city=${encodeURIComponent(city)}`}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors ${cityFilter === city ? 'bg-brand-mint/10 text-brand-mint font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <MapPin className="w-3 h-3" />
                      {city}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Vendor grid */}
          <div className="flex-1 min-w-0">
            {!vendors || vendors.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
                <Store className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No vendors found</h3>
                <p className="text-gray-500 text-sm mb-4">Try a different search or remove the city filter.</p>
                <Link href="/marketplace/vendors" className="text-brand-mint text-sm font-medium hover:underline">
                  Clear filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {vendors.map((vendor: any) => (
                  <Link
                    key={vendor.slug}
                    href={`/marketplace/store/${vendor.slug}`}
                    className="card group overflow-hidden hover:-translate-y-0.5 transition-transform duration-200"
                  >
                    <div className="relative h-24 bg-gradient-to-r from-brand-forest to-brand-mint overflow-hidden">
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
                            <div className="w-full h-full bg-brand-forest flex items-center justify-center">
                              <span className="text-white font-bold text-xl">{vendor.business_name[0]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 group-hover:text-brand-mint transition-colors text-sm leading-snug">
                          {vendor.business_name}
                        </h3>
                        <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      </div>
                      {vendor.business_description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{vendor.business_description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        {(vendor.city || vendor.province) ? (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />
                            {[vendor.city, vendor.province].filter(Boolean).join(', ')}
                          </div>
                        ) : (
                          <span />
                        )}
                        <span className="text-xs text-brand-mint font-medium">View store</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Become a Vendor banner */}
            <div className="mt-12 bg-brand-forest rounded-2xl overflow-hidden relative">
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }}
              />
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-mint opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
              <div className="relative px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="w-5 h-5 text-brand-mint" />
                    <span className="text-brand-mint text-sm font-semibold uppercase tracking-wider">For Business Owners</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">Want to be listed here?</h3>
                  <p className="text-gray-300 text-sm max-w-md">
                    Join South Africa&apos;s vetted marketplace. Flat monthly subscription, no commission fees,
                    your own storefront, and thousands of customers.
                  </p>
                </div>
                <Link
                  href="/join"
                  className="flex-shrink-0 inline-flex items-center gap-2 bg-brand-mint hover:bg-blue-700
                             text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg whitespace-nowrap"
                >
                  Become a Vendor <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
