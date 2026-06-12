'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  vendorId: string
  categories: { id: string; name: string }[]
  product: {
    id: string
    name: string
    description: string
    price: number
    compare_at_price: number | null
    category_id: string
    images: string[]
    stock_quantity: number | null
    track_inventory: boolean
    is_available: boolean
    sku: string | null
    tags: string[]
    specifications: { key: string; value: string }[]
  } | null
}

export default function ProductFormClient({ vendorId, categories, product }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEdit = !!product

  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price?.toString() ?? '',
    compare_at_price: product?.compare_at_price?.toString() ?? '',
    category_id: product?.category_id ?? (categories[0]?.id ?? ''),
    stock_quantity: product?.stock_quantity?.toString() ?? '',
    track_inventory: product?.track_inventory ?? false,
    is_available: product?.is_available ?? true,
    sku: product?.sku ?? '',
    tags: product?.tags?.join(', ') ?? '',
  })

  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(
    product?.specifications ?? []
  )
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    const uploaded: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${vendorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: false })
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(data.path)
        uploaded.push(publicUrl)
      }
    }
    setImages(prev => [...prev, ...uploaded])
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function removeImage(url: string) {
    setImages(prev => prev.filter(i => i !== url))
  }

  function addSpec() {
    setSpecs(prev => [...prev, { key: '', value: '' }])
  }

  function updateSpec(index: number, field: 'key' | 'value', value: string) {
    setSpecs(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function removeSpec(index: number) {
    setSpecs(prev => prev.filter((_, i) => i !== index))
  }

  function slugify(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.category_id) {
      setError('Please select a category. You may need to ask your admin to add categories first.')
      return
    }

    setSaving(true)

    const payload = {
      vendor_id: vendorId,
      name: form.name.trim(),
      slug: slugify(form.name.trim()),
      description: form.description.trim(),
      price: parseFloat(form.price),
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      category_id: form.category_id,
      images,
      stock_quantity: form.track_inventory ? parseInt(form.stock_quantity) : null,
      track_inventory: form.track_inventory,
      is_available: form.is_available,
      sku: form.sku.trim() || null,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      specifications: specs.filter(s => s.key && s.value),
    }

    let dbError
    if (isEdit) {
      const { error } = await supabase.from('products').update(payload).eq('id', product.id)
      dbError = error
    } else {
      const { error } = await supabase.from('products').insert(payload)
      dbError = error
    }

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    router.push('/vendor/products')
    router.refresh()
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{isEdit ? 'Update product details' : 'Fill in the details below'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="label">Product Name *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea
              className="input min-h-[120px] resize-y"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Category *</label>
            {categories.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                No categories available. Ask your admin to add categories before creating products.
              </p>
            ) : (
              <select className="input" value={form.category_id} onChange={e => set('category_id', e.target.value)} required>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Discounted Price (R)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required />
            </div>
            <div>
              <label className="label">Original Price (R)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.compare_at_price} onChange={e => set('compare_at_price', e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className="label">SKU</label>
            <input className="input" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Optional" />
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Inventory</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-brand-mint"
              checked={form.track_inventory}
              onChange={e => set('track_inventory', e.target.checked)}
            />
            <span className="text-sm text-gray-700">Track stock quantity</span>
          </label>
          {form.track_inventory && (
            <div>
              <label className="label">Stock Quantity</label>
              <input className="input w-40" type="number" min="0" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} />
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-brand-mint"
              checked={form.is_available}
              onChange={e => set('is_available', e.target.checked)}
            />
            <span className="text-sm text-gray-700">Available for purchase</span>
          </label>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Images</h2>
          <div className="flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 text-center bg-black/60 text-white text-xs py-0.5">Main</span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand-mint hover:text-brand-mint transition-colors"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              <span className="text-xs mt-1">{uploading ? 'Uploading' : 'Upload'}</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
          <p className="text-xs text-gray-400">First image will be the main product image. JPG, PNG, WebP supported.</p>
        </div>

        {/* Specifications */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Specifications</h2>
            <button type="button" onClick={addSpec} className="text-brand-mint text-sm flex items-center gap-1 hover:underline">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {specs.length === 0 && (
            <p className="text-sm text-gray-400">No specifications added yet.</p>
          )}
          {specs.map((spec, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input className="input flex-1" placeholder="e.g. Material" value={spec.key} onChange={e => updateSpec(i, 'key', e.target.value)} />
              <input className="input flex-1" placeholder="e.g. Cotton" value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)} />
              <button type="button" onClick={() => removeSpec(i)} className="p-2 text-red-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Tags</h2>
          <div>
            <label className="label">Tags (comma separated)</label>
            <input className="input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. handmade, local, gifts" />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
