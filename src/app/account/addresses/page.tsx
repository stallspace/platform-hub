'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Plus, Trash2, CheckCircle2, Loader2, X, Edit2 } from 'lucide-react'

interface Address {
  id: string
  label: string
  line1: string
  line2: string
  city: string
  province: string
  postal_code: string
  is_default: boolean
}

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
]

function AddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Address>
  onSave: (a: Omit<Address, 'id'>) => void
  onCancel: () => void
}) {
  const [label, setLabel]           = useState(initial?.label ?? 'Home')
  const [line1, setLine1]           = useState(initial?.line1 ?? '')
  const [line2, setLine2]           = useState(initial?.line2 ?? '')
  const [city, setCity]             = useState(initial?.city ?? '')
  const [province, setProvince]     = useState(initial?.province ?? '')
  const [postalCode, setPostalCode] = useState(initial?.postal_code ?? '')
  const [isDefault, setIsDefault]   = useState(initial?.is_default ?? false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ label, line1, line2, city, province, postal_code: postalCode, is_default: isDefault })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">{initial?.id ? 'Edit Address' : 'New Address'}</h3>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Label</label>
          <input type="text" className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Home, Work, etc." required />
        </div>
        <div className="col-span-2">
          <label className="label">Street Address</label>
          <input type="text" className="input" value={line1} onChange={e => setLine1(e.target.value)} placeholder="123 Main Street" required />
        </div>
        <div className="col-span-2">
          <label className="label">Apartment / Suite <span className="text-gray-400 font-normal">(Optional)</span></label>
          <input type="text" className="input" value={line2} onChange={e => setLine2(e.target.value)} placeholder="Apt 4B" />
        </div>
        <div>
          <label className="label">City</label>
          <input type="text" className="input" value={city} onChange={e => setCity(e.target.value)} placeholder="Cape Town" required />
        </div>
        <div>
          <label className="label">Postal Code</label>
          <input type="text" className="input" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="8001" required />
        </div>
        <div className="col-span-2">
          <label className="label">Province</label>
          <select className="input" value={province} onChange={e => setProvince(e.target.value)} required>
            <option value="">Select province</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="rounded border-gray-300 text-brand-accent" />
        <span className="text-sm text-gray-600">Set as default address</span>
      </label>

      <div className="flex gap-3 pt-1">
        <button type="submit" className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <CheckCircle2 className="w-4 h-4" /> Save Address
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [userId, setUserId]       = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', user.id)
        .order('is_default', { ascending: false })

      setAddresses(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(values: Omit<Address, 'id'>) {
    if (!userId) return
    const supabase = createClient()

    if (values.is_default) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', userId)
    }

    if (editId) {
      const { data } = await supabase
        .from('customer_addresses')
        .update({ ...values })
        .eq('id', editId)
        .select()
        .single()
      if (data) setAddresses(prev => prev.map(a => a.id === editId ? data : a))
      setEditId(null)
    } else {
      const { data } = await supabase
        .from('customer_addresses')
        .insert({ ...values, customer_id: userId })
        .select()
        .single()
      if (data) setAddresses(prev => [...prev, data])
    }
    setShowForm(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('customer_addresses').delete().eq('id', id)
    setAddresses(prev => prev.filter(a => a.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-brand-accent" />
      </div>
    )
  }

  const editAddress = addresses.find(a => a.id === editId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Addresses</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your saved delivery addresses</p>
        </div>
        {!showForm && !editId && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-brand-accent text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Address
          </button>
        )}
      </div>

      {showForm && (
        <AddressForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No addresses saved</h3>
          <p className="text-gray-500 text-sm mb-5">Add a delivery address to speed up checkout.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-brand-accent text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map(address => (
            editId === address.id ? (
              <div key={address.id} className="sm:col-span-2">
                <AddressForm initial={address} onSave={handleSave} onCancel={() => setEditId(null)} />
              </div>
            ) : (
              <div key={address.id} className={`bg-white rounded-xl border-2 p-5 ${address.is_default ? 'border-brand-accent' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-accent flex-shrink-0" />
                    <span className="font-semibold text-gray-900 text-sm">{address.label}</span>
                    {address.is_default && (
                      <span className="text-xs bg-brand-accent/10 text-brand-accent font-medium px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditId(address.id); setShowForm(false) }}
                      className="p-1.5 text-gray-400 hover:text-brand-accent rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {address.line1}
                  {address.line2 && <>, {address.line2}</>}
                  <br />
                  {address.city}, {address.province} {address.postal_code}
                  <br />
                  South Africa
                </p>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
