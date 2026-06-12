'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Truck, MapPin, Clock, Package, CreditCard, Building, Loader2, Check, AlertCircle } from 'lucide-react'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const BANKS = ['ABSA','Capitec Bank','FNB','Nedbank','Standard Bank','Investec','African Bank','Bidvest Bank','Discovery Bank','TymeBank']

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
  vat_registered: boolean
  vat_number: string | null
  vat_included: boolean
  track_stock_default: boolean
  allow_backorders: boolean
  operating_hours: Record<string, { open: string; close: string; closed: boolean }>
}

interface Banking {
  id?: string
  vendor_id: string
  bank_name: string
  account_holder: string
  account_type: string
  account_number: string
}

interface Props {
  vendorId: string
  settings: StoreSettings | null
  banking: Banking | null
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

export default function StoreSettingsClient({ vendorId, settings, banking }: Props) {
  const supabase = createClient()

  const [fulfilment, setFulfilment] = useState(settings?.fulfilment_type ?? 'delivery')
  const [deliveryAreas, setDeliveryAreas] = useState(settings?.delivery_areas?.join(', ') ?? '')
  const [deliveryCost, setDeliveryCost] = useState(String(settings?.delivery_cost ?? 0))
  const [freeThreshold, setFreeThreshold] = useState(String(settings?.free_delivery_threshold ?? 0))
  const [deliveryTime, setDeliveryTime] = useState(settings?.estimated_delivery_time ?? '')
  const [collectionAddress, setCollectionAddress] = useState(settings?.collection_address ?? '')
  const [collectionHours, setCollectionHours] = useState(settings?.collection_hours ?? '')
  const [collectionInstructions, setCollectionInstructions] = useState(settings?.collection_instructions ?? '')
  const [vatRegistered, setVatRegistered] = useState(settings?.vat_registered ?? false)
  const [vatNumber, setVatNumber] = useState(settings?.vat_number ?? '')
  const [vatIncluded, setVatIncluded] = useState(settings?.vat_included ?? false)
  const [trackStock, setTrackStock] = useState(settings?.track_stock_default ?? true)
  const [allowBackorders, setAllowBackorders] = useState(settings?.allow_backorders ?? false)
  const [hours, setHours] = useState(settings?.operating_hours && Object.keys(settings.operating_hours).length > 0 ? settings.operating_hours : DEFAULT_HOURS)

  const [bankName, setBankName] = useState(banking?.bank_name ?? '')
  const [accountHolder, setAccountHolder] = useState(banking?.account_holder ?? '')
  const [accountType, setAccountType] = useState(banking?.account_type ?? 'cheque')
  const [accountNumber, setAccountNumber] = useState(banking?.account_number ?? '')

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
      if (bankName && accountNumber) {
        const bankPayload = { vendor_id: vendorId, bank_name: bankName, account_holder: accountHolder, account_type: accountType, account_number: accountNumber, updated_at: new Date().toISOString() }
        if (banking?.id) {
          const { error: e } = await supabase.from('vendor_banking').update(bankPayload).eq('id', banking.id)
          if (e) throw e
        } else {
          const { error: e } = await supabase.from('vendor_banking').insert(bankPayload)
          if (e) throw e
        }
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { setError('Failed to save settings.') }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Store Settings</h1><p className="text-gray-500 text-sm mt-0.5">Configure fulfilment, hours, VAT and banking</p></div>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      <div className="space-y-5">
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
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4"><Building className="w-4 h-4 text-brand-mint" /><h2 className="font-semibold text-gray-900">Banking Details</h2></div>
          <p className="text-xs text-gray-500 mb-4">Used for verification and subscription refunds only. Not shared publicly.</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Bank Name</label>
                <select value={bankName} onChange={e => setBankName(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint">
                  <option value="">Select bank...</option>
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Account Type</label>
                <select value={accountType} onChange={e => setAccountType(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint">
                  <option value="cheque">Cheque / Current</option>
                  <option value="savings">Savings</option>
                  <option value="transmission">Transmission</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Account Holder Name</label>
              <input type="text" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="As it appears on your bank account" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Account Number</label>
              <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Your bank account number" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" />
            </div>
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
