'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Globe, Instagram, Facebook, ExternalLink, Loader2, Check, MapPin } from 'lucide-react'

const SA_PROVINCES = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','Northern Cape','North West','Western Cape']

const CATEGORIES = ['Automotive','Beauty & Personal Care','Books & Stationery','Clothing & Apparel','Electronics','Food & Beverage','Furniture & Home','Garden & Outdoor','Health & Wellness','Jewellery & Accessories','Kids & Baby','Pet Supplies','Sports & Fitness','Tools & Hardware','Toys & Games','Other']

interface Vendor {
  id: string
  business_name: string
  slug: string
  business_description: string
  business_category: string | null
  city: string | null
  province: string | null
  logo_url: string | null
  banner_url: string | null
  social_links: Record<string, string> | null
}

interface Props { vendor: Vendor }

export default function StorefrontSettingsClient({ vendor }: Props) {
  const supabase = createClient()
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const [description, setDescription] = useState(vendor.business_description ?? '')
  const [category, setCategory] = useState(vendor.business_category ?? '')
  const [city, setCity] = useState(vendor.city ?? '')
  const [province, setProvince] = useState(vendor.province ?? '')
  const [website, setWebsite] = useState(vendor.social_links?.website ?? '')
  const [instagram, setInstagram] = useState(vendor.social_links?.instagram ?? '')
  const [facebook, setFacebook] = useState(vendor.social_links?.facebook ?? '')
  const [whatsapp, setWhatsapp] = useState(vendor.social_links?.whatsapp ?? '')
  const [tiktok, setTiktok] = useState(vendor.social_links?.tiktok ?? '')
  const [linkedin, setLinkedin] = useState(vendor.social_links?.linkedin ?? '')
  const [logoUrl, setLogoUrl] = useState(vendor.logo_url ?? '')
  const [bannerUrl, setBannerUrl] = useState(vendor.banner_url ?? '')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function uploadImage(file: File, bucket: string, type: string) {
    const ext = file.name.split('.').pop()
    const filePath = vendor.id + '/' + type + '-' + Date.now() + '.' + ext
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true })
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return data.publicUrl
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    setError(null)
    try { const url = await uploadImage(file, 'vendor-logos', 'logo'); setLogoUrl(url) }
    catch { setError('Failed to upload logo.') }
    finally { setUploadingLogo(false) }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    setError(null)
    try { const url = await uploadImage(file, 'vendor-banners', 'banner'); setBannerUrl(url) }
    catch { setError('Failed to upload banner.') }
    finally { setUploadingBanner(false) }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const { error: updateError } = await supabase.from('vendors').update({
        business_description: description,
        business_category: category || null,
        city: city || null,
        province: province || null,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
        social_links: { website: website || undefined, instagram: instagram || undefined, facebook: facebook || undefined, whatsapp: whatsapp || undefined, tiktok: tiktok || undefined, linkedin: linkedin || undefined },
        updated_at: new Date().toISOString(),
      }).eq('id', vendor.id)
      if (updateError) throw updateError
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { setError('Failed to save changes.') }
    finally { setSaving(false) }
  }

  const initials = vendor.business_name.slice(0, 2).toUpperCase()

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Storefront</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your public-facing store profile</p>
        </div>
        <a href={'/marketplace/store/' + vendor.slug} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-mint hover:underline">
          <ExternalLink className="w-4 h-4" /> View storefront
        </a>
      </div>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50"><h2 className="font-semibold text-gray-900">Store Banner</h2><p className="text-xs text-gray-500 mt-0.5">Recommended: 1200 x 300px</p></div>
          <div className="p-5">
            <div className="relative h-36 rounded-xl overflow-hidden bg-gradient-to-r from-brand-forest to-brand-mint cursor-pointer group" onClick={() => bannerRef.current?.click()}>
              {bannerUrl && <img src={bannerUrl} alt="" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingBanner ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Upload className="w-6 h-6 text-white" />}
              </div>
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Store Logo</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer hover:border-brand-mint transition-colors flex-shrink-0 relative group" onClick={() => logoRef.current?.click()}>
              {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-brand-forest flex items-center justify-center"><span className="text-white text-xl font-bold">{initials}</span></div>}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                {uploadingLogo ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Upload className="w-5 h-5 text-white" />}
              </div>
            </div>
            <div>
              <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo} className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">{uploadingLogo ? 'Uploading...' : 'Change Logo'}</button>
              <p className="text-xs text-gray-400 mt-1.5">PNG, JPG or WebP. Max 2MB.</p>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Business Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Business Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint">
                <option value="">Select a category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">About Your Store</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} maxLength={500} placeholder="Tell customers about your business..." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" />
              <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/500</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block"><MapPin className="w-3 h-3 inline mr-1" />City</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Cape Town" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Province</label>
                <select value={province} onChange={e => setProvince(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint">
                  <option value="">Select province...</option>
                  {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Social and Contact Links</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0"><Globe className="w-4 h-4 text-gray-400" /></div>
              <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">Website</label><input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourwebsite.co.za" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" /></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0"><Instagram className="w-4 h-4 text-gray-400" /></div>
              <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">Instagram</label><input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="username (without @)" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" /></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0"><Facebook className="w-4 h-4 text-gray-400" /></div>
              <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">Facebook</label><input type="text" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/yourpage" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" /></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-gray-400">TK</span></div>
              <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">TikTok</label><input type="text" value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="username (without @)" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" /></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-gray-400">in</span></div>
              <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">LinkedIn</label><input type="text" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/yourpage" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" /></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-gray-400">WA</span></div>
              <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">WhatsApp</label><input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="27821234567" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" /></div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 pb-6">
          <p className="text-xs text-gray-400">Changes reflect immediately on your public storefront</p>
          <button onClick={handleSave} disabled={saving || uploadingLogo || uploadingBanner} className="flex items-center gap-2 px-5 py-2.5 bg-brand-forest text-white text-sm font-medium rounded-lg hover:bg-brand-mint transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saved && <Check className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
