'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface HomepageSection {
  id: string
  section: string
  content: Record<string, any>
  is_active: boolean
  updated_at: string
}

interface Vendor {
  id: string
  business_name: string
  logo_url: string | null
  slug: string
}

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  vendor_id: string
  vendors: { business_name: string } | null
}

interface Props {
  homepageContent: HomepageSection[]
  vendors: Vendor[]
  featuredVendorIds: string[]
  featuredProducts: Product[]
  allProducts: Product[]
}

type ActiveTab = 'banners' | 'vendors' | 'products'

const BANNER_SECTIONS = ['hero', 'banner_1', 'banner_2']
const BANNER_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  banner_1: 'Promotional Banner 1',
  banner_2: 'Promotional Banner 2',
}

export default function ContentClient({ homepageContent, vendors, featuredVendorIds, featuredProducts, allProducts }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<ActiveTab>('banners')
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  // Banner state — one form per section
  const [banners, setBanners] = useState<Record<string, any>>(() => {
    const map: Record<string, any> = {}
    for (const section of BANNER_SECTIONS) {
      const existing = homepageContent.find((s) => s.section === section)
      map[section] = {
        title: existing?.content?.title ?? '',
        subtitle: existing?.content?.subtitle ?? '',
        cta_text: existing?.content?.cta_text ?? '',
        cta_url: existing?.content?.cta_url ?? '',
        image_url: existing?.content?.image_url ?? '',
        is_active: existing?.is_active ?? false,
      }
    }
    return map
  })

  // Featured vendors state
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>(featuredVendorIds)
  const [vendorSearch, setVendorSearch] = useState('')

  // Featured products state
  const [productSearch, setProductSearch] = useState('')

  function showToast(text: string, type: 'success' | 'error') {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function saveBanner(section: string) {
    setSaving(section)
    const supabase = createClient()
    const content = banners[section]

    // Upsert by section
    const { error } = await supabase
      .from('homepage_content')
      .upsert({ section, content, is_active: content.is_active, updated_at: new Date().toISOString() }, { onConflict: 'section' })

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast(`${BANNER_LABELS[section]} saved.`, 'success')
      startTransition(() => router.refresh())
    }
    setSaving(null)
  }

  async function saveFeaturedVendors() {
    setSaving('vendors')
    const supabase = createClient()
    const { error } = await supabase
      .from('homepage_content')
      .upsert({
        section: 'featured_vendors',
        content: { vendor_ids: selectedVendorIds },
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'section' })

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Featured vendors saved.', 'success')
      startTransition(() => router.refresh())
    }
    setSaving(null)
  }

  async function toggleFeaturedProduct(productId: string, isFeatured: boolean) {
    setSaving(productId)
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({ is_featured: isFeatured })
      .eq('id', productId)

    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast(isFeatured ? 'Product featured.' : 'Product removed from featured.', 'success')
      startTransition(() => router.refresh())
    }
    setSaving(null)
  }

  function updateBanner(section: string, field: string, value: any) {
    setBanners((b) => ({ ...b, [section]: { ...b[section], [field]: value } }))
  }

  function toggleVendor(id: string) {
    setSelectedVendorIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id])
  }

  const filteredVendors = vendors.filter((v) => v.business_name.toLowerCase().includes(vendorSearch.toLowerCase()))
  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.vendors?.business_name ?? '').toLowerCase().includes(productSearch.toLowerCase())
  )
  const featuredProductIds = new Set(featuredProducts.map((p) => p.id))

  const TABS: { key: ActiveTab; label: string }[] = [
    { key: 'banners', label: 'Banners' },
    { key: 'vendors', label: 'Featured Vendors' },
    { key: 'products', label: 'Featured Products' },
  ]

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success'
            ? <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          }
          {toast.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.key ? 'border-[#2ECC8E] text-[#2ECC8E]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Banners */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          {BANNER_SECTIONS.map((section) => {
            const b = banners[section]
            return (
              <div key={section} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-[#0D3B2E]">{BANNER_LABELS[section]}</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-gray-500">{b.is_active ? 'Active' : 'Inactive'}</span>
                    <div
                      onClick={() => updateBanner(section, 'is_active', !b.is_active)}
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${b.is_active ? 'bg-[#2ECC8E]' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${b.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { field: 'title', label: 'Headline', placeholder: 'e.g. Shop South African Vendors' },
                    { field: 'subtitle', label: 'Subheading', placeholder: 'e.g. Discover unique products...' },
                    { field: 'cta_text', label: 'Button Text', placeholder: 'e.g. Shop Now' },
                    { field: 'cta_url', label: 'Button URL', placeholder: 'e.g. /marketplace' },
                    { field: 'image_url', label: 'Background Image URL', placeholder: 'https://...' },
                  ].map(({ field, label, placeholder }) => (
                    <div key={field} className={field === 'image_url' ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
                      <input
                        type="text"
                        value={b[field]}
                        onChange={(e) => updateBanner(section, field, e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2ECC8E] transition-colors"
                      />
                    </div>
                  ))}
                </div>
                <div className="px-5 pb-5 flex justify-end">
                  <button
                    onClick={() => saveBanner(section)}
                    disabled={saving === section}
                    className="px-5 py-2.5 bg-[#0D3B2E] hover:bg-[#0d2a5e] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {saving === section ? 'Saving...' : 'Save Banner'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Featured Vendors */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#0D3B2E]">Featured Vendors</h3>
              <p className="text-xs text-gray-400 mt-0.5">{selectedVendorIds.length} selected — shown on the homepage</p>
            </div>
            <button
              onClick={saveFeaturedVendors}
              disabled={saving === 'vendors'}
              className="px-5 py-2 bg-[#0D3B2E] hover:bg-[#0d2a5e] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving === 'vendors' ? 'Saving...' : 'Save Selection'}
            </button>
          </div>

          <div className="p-4 border-b border-gray-100">
            <input
              type="text"
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
              placeholder="Search vendors..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2ECC8E]"
            />
          </div>

          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {filteredVendors.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No approved vendors found</p>
            )}
            {filteredVendors.map((vendor) => {
              const selected = selectedVendorIds.includes(vendor.id)
              return (
                <div
                  key={vendor.id}
                  onClick={() => toggleVendor(vendor.id)}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${selected ? 'bg-[#2ECC8E]/5' : 'hover:bg-gray-50'}`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'bg-[#2ECC8E] border-[#2ECC8E]' : 'border-gray-300'}`}>
                    {selected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {vendor.logo_url
                      ? <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
                      : <span className="text-xs font-bold text-gray-500">{vendor.business_name.charAt(0)}</span>
                    }
                  </div>
                  <p className="text-sm font-medium text-gray-800">{vendor.business_name}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Featured Products */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-[#0D3B2E]">Featured Products</h3>
            <p className="text-xs text-gray-400 mt-0.5">{featuredProducts.length} products currently featured</p>
          </div>

          <div className="p-4 border-b border-gray-100">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products or vendors..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2ECC8E]"
            />
          </div>

          <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
            {filteredProducts.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No products found</p>
            )}
            {filteredProducts.map((product) => {
              const isFeatured = featuredProductIds.has(product.id)
              const thumb = product.images?.[0]
              return (
                <div key={product.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {thumb
                      ? <img src={thumb} alt={product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.vendors?.business_name ?? 'Unknown vendor'} · R {product.price.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => toggleFeaturedProduct(product.id, !isFeatured)}
                    disabled={saving === product.id}
                    className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                      isFeatured
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {saving === product.id ? '...' : isFeatured ? '★ Featured' : '☆ Feature'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
