'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Truck, Clock, Package, Loader2, Check, AlertCircle, Eye } from 'lucide-react'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

interface StoreSettings {
  id?: string
  vendor_id: string
  fulfilment_type: string
  delivery_areas: string[]
  delivery_cost: number
  free_delivery_threshold: number
  estimated_delivery_time: string | null
  collection_address: string | null
  collection_hours: string | null
  collection_instructions: string | null
  pay_on_collection?: boolean
  show_email?: boolean
  show_phone?: boolean
  show_address?: boolean
  vat_registered: boolean
  vat_number: string | null
  vat_included: boolean
  track_stock_default: boolean
  allow_backorders: boolean
  operating_hours: Record<string, { open: string; close: string; closed: boolean }>
}

interface Props {
  vendorId: string
  settings: StoreSettings | null
}

const DEFAULT_HOURS: Record<string, { open: string; close: string; closed: boolean }> = {
  monday: { open: '08:00', close: '17:00', closed: false },
  tuesday: { open: '08:00', close: '17:00', closed: false },
  wednesday: { open: '08:00', close: '17:00', closed: false },
  thursday: { open: '08:00', close: '17:00', closed: false },
  friday: { open: '08:00', close: '17:00', closed: false },
  saturday: { open: '09:00', close: '13:00', closed: false },
  sunday: { open: '09:00', close: '13:00', closed: true },
}

export default function StoreSettingsClient({ vendorId, settings }: Props) {
  const supabase = createClient()

  const [fulfilment, setFulfilment] = useState(settings?.fulfilment_type ?? 'delivery')
  const [deliveryAreas, setDeliveryAreas] = useState(settings?.delivery_areas?.join(', ') ?? '')
  const [deliveryCost, setDeliveryCost] = useState(String(settings?.delivery_cost ?? 0))
  const [freeThreshold, setFreeThreshold] = useState(String(settings?.free_delivery_threshold ?? 0))
  const [deliveryTime, setDeliveryTime] = useState(settings?.estimated_delivery_time ?? '')
  const [collectionAddress, setCollectionAddress] = useState(settings?.collection_address ?? '')
  const [collectionHours, setCollectionHours] = useState(settings?.collection_hours ?? '')
  const [collectionInstructions, setCollectionInstructions] = useState(settings?.collection_instructions ?? '')
  const [payOnCollection, setPayOnCollection] = useState(settings?.pay_on_collection ?? false)
  const [showEmail, setShowEmail] = useState(settings?.show_email ?? true)
  const [showPhone, setShowPhone] = useState(settings?.show_phone ?? true)
  const [showAddress, setShowAddress] = useState(settings?.show_address ?? true)
  const [vatRegistered, setVatRegistered] = useState(settings?.vat_registered ?? false)
  const [vatNumber, setVatNumber] = useState(settings?.vat_number ?? '')
  const [vatIncluded, setVatIncluded] = useState(settings?.vat_included ?? false)
  const [trackStock, setTrackStock] = useState(settings?.track_stock_default ?? true)
  const [allowBackorders, setAllowBackorders] = useState(settings?.allow_backorders ?? false)
  const [hours, setHours] = useState(settings?.operating_hours && Object.keys(settings.operating_hours).length > 0 ? settings.operating_hours : DEFAULT_HOURS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateHours(day: string, field: string, value: string | boolean) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const settingsPayload = {
        vendor_id: vendorId,
        fulfilment_type: fulfilment,
        delivery_areas: deliveryAreas.split(',').map(s => s.trim()).filter(Boolean),
        delivery_cost: parseFloat(deliveryCost) || 0,
        free_delivery_threshold: parseFloat(freeThreshold) || 0,
        estimated_delivery_time: deliveryTime || null,
        collection_address: collectionAddress || null,
        collection_hours: collectionHours || null,
        collection_instructions: collectionInstructions || null,
        pay_on_collection: payOnCollection,
        show_email: showEmail,
        show_phone: showPhone,
        show_address: showAddress,
        vat_registered: vatRegistered,
        vat_number: vatNumber || null,
        vat_included: vatIncluded,
        track_stock_default: trackStock,
        allow_backorders: allowBackorders,
        operating_hours: hours,
        updated_at: new Date().toISOString(),
      }
      if (settings?.id) {
        const { error: e } = await supabase.from('vendor_store_settings').update(settingsPayload).eq('id', settings.id)
        if (e) throw e
      } else {
        const { error: e } = await supabase.from('vendor_store_settings').insert(settingsPayload)
        if (e) throw e
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { setError('Failed to save settings.') }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Store Settings</h1><p className="text-gray-500 text-sm mt-0.5">Configure fulfilment, hours and VAT</p></div>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      <div className="space-y-5">
        {/* Contact visibility */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-[#2ECC8E]" />
            <h2 className="font-semibold text-gray-900">Contact details on your storefront</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Choose what shoppers can see on your store page. Customers can always reach you through the
            enquiry form, and anything you hide here is still sent to you with every order.
          </p>

          <div className="space-y-3">
            {([
              ['Email address', showEmail, setShowEmail, 'Shown as a mailto link on your store page.'],
              ['Phone number', showPhone, setShowPhone, 'Shown as a tap-to-call link.'],
              ['Business address', showAddress, setShowAddress, 'Hide this if you trade from home.'],
            ] as [string, boolean, (v: boolean) => void, string][]).map(([label, value, setter, hint]) => (
              <label key={label} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={e => setter(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#2ECC8E] flex-shrink-0"
                />
                <span>
                  <span className="text-sm font-medium text-gray-900 block">Show my {label.toLowerCase()}</span>
                  <span className="text-xs text-gray-500">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><Truck className="w-4 h-4 text-brand-mint" /><h2 className="font-semibold text-gray-900">Fulfilment Options</h2></div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {['delivery','collection','both'].map(f => (
              <button key={f} onClick={() => setFulfilment(f)} className={"text-center p-3 rounded-xl border-2 text-sm font-medium transition-all " + (fulfilment === f ? 'border-brand-mint bg-blue-50 text-brand-mint' : 'border-gray-100 text-gray-600 hover:border-gray-200')}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {(fulfilment === 'delivery' || fulfilment === 'both') && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700">Delivery Settings</p>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Delivery Areas <span className="text-gray-400">(comma separated)</span></label>
                <input type="text" value={deliveryAreas} onChange={e => setDeliveryAreas(e.target.value)} placeholder="Cape Town, Stellenbosch, Paarl" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Delivery Cost (R)</label>
                  <input type="number" value={deliveryCost} onChange={e => setDeliveryCost(e.target.value)} min="0" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Free Delivery Over (R)</label>
                  <input type="number" value={freeThreshold} onChange={e => setFreeThreshold(e.target.value)} min="0" placeholder="0 = no free delivery" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Estimated Delivery Time</label>
                <input type="text" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} placeholder="e.g. 2-3 business days" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" />
              </div>
            </div>
          )}
          {(fulfilment === 'collection' || fulfilment === 'both') && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700">Collection Settings</p>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Collection Address</label>
                <input type="text" value={collectionAddress} onChange={e => setCollectionAddress(e.target.value)} placeholder="123 Main Street, Cape Town" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Collection Hours</label>
                <input type="text" value={collectionHours} onChange={e => setCollectionHours(e.target.value)} placeholder="Mon-Fri 08:00-17:00, Sat 09:00-13:00" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Collection Instructions</label>
                <textarea value={collectionInstructions} onChange={e => setCollectionInstructions(e.target.value)} rows={2} placeholder="e.g. Enter via the side gate, ask for reception" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" />
              </div>

              {/* Pay on collection */}
              <div className="pt-3 border-t border-gray-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payOnCollection}
                    onChange={e => setPayOnCollection(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#2ECC8E] flex-shrink-0"
                  />
                  <span>
                    <span className="text-sm font-medium text-gray-900 block">Accept payment on collection</span>
                    <span className="text-xs text-gray-500">
                      Customers can place a collection order and pay you in store (cash, card or EFT — your choice).
                      No online payment gateway needed.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-brand-mint" /><h2 className="font-semibold text-gray-900">Operating Hours</h2></div>
          <div className="space-y-2">
            {DAYS.map(day => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-24 capitalize">{day}</span>
                <label className="flex items-center gap-1.5 text-xs text-gray-500">
                  <input type="checkbox" checked={!hours[day]?.closed} onChange={e => updateHours(day, 'closed', !e.target.checked)} className="rounded" />
                  Open
                </label>
                {!hours[day]?.closed && (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" value={hours[day]?.open ?? '08:00'} onChange={e => updateHours(day, 'open', e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-mint/30" />
                    <span className="text-gray-400 text-xs">to</span>
                    <input type="time" value={hours[day]?.close ?? '17:00'} onChange={e => updateHours(day, 'close', e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-mint/30" />
                  </div>
                )}
                {hours[day]?.closed && <span className="text-xs text-gray-400">Closed</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><Package className="w-4 h-4 text-brand-mint" /><h2 className="font-semibold text-gray-900">Product & Tax Settings</h2></div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={vatRegistered} onChange={e => setVatRegistered(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">VAT Registered</span>
            </label>
            {vatRegistered && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">VAT Number</label>
                  <input type="text" value={vatNumber} onChange={e => setVatNumber(e.target.value)} placeholder="4123456789" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input type="checkbox" checked={vatIncluded} onChange={e => setVatIncluded(e.target.checked)} className="rounded" />
                    <span className="text-sm text-gray-700">Prices include VAT</span>
                  </label>
                </div>
              </div>
            )}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={trackStock} onChange={e => setTrackStock(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">Track inventory by default on new products</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={allowBackorders} onChange={e => setAllowBackorders(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">Allow backorders when out of stock</span>
            </label>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 pb-6">
          <p className="text-xs text-gray-400">Settings apply to your storefront immediately</p>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-brand-forest text-white text-sm font-medium rounded-lg hover:bg-brand-mint transition-colors disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saved && <Check className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
