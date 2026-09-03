"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldCheck, Truck, Store, Loader2,
  ChevronRight, Package, User,
  CreditCard, AlertCircle, CheckCircle2, ShoppingCart,
} from 'lucide-react'
import { useCartStore, groupByVendor } from '@/lib/cart/store'
import { createClient } from '@/lib/supabase/client'

const PROVINCES = [
  'Eastern Cape','Free State','Gauteng','KwaZulu-Natal',
  'Limpopo','Mpumalanga','Northern Cape','North West','Western Cape',
]

interface VendorPaymentMethod {
  provider: string | null
  configured: boolean
  payOnCollection: boolean
}

interface CheckoutForm {
  full_name: string
  email: string
  phone: string
  line1: string
  line2: string
  city: string
  province: string
  postal_code: string
  fulfilment: 'delivery' | 'collection'
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearVendorItems } = useCartStore()
  const byVendor = groupByVendor(items)
  const vendorIds = Object.keys(byVendor)
  const [currentVendorIndex, setCurrentVendorIndex] = useState(0)
  const currentVendorId = vendorIds[currentVendorIndex]
  const currentVendorItems = currentVendorId ? byVendor[currentVendorId] : []

  const [form, setForm] = useState<CheckoutForm>({
    full_name: '', email: '', phone: '',
    line1: '', line2: '', city: '', province: '', postal_code: '',
    fulfilment: 'delivery',
  })
  const [vendorConfig, setVendorConfig] = useState<VendorPaymentMethod | null>(null)
  const [vendorInfo, setVendorInfo] = useState<{
    business_name: string; slug: string; delivery_cost: number; fulfilment_type: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [prefilling, setPrefilling] = useState(true)
  // 'online' = pay now via the vendor's gateway; 'collection' = pay the vendor on collection
  const [payMethod, setPayMethod] = useState<'online' | 'collection'>('online')

  const subtotal = currentVendorItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const deliveryCost = form.fulfilment === 'delivery' ? (vendorInfo?.delivery_cost ?? 0) : 0
  const total = subtotal + deliveryCost

  useEffect(() => {
    async function prefill() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles')
          .select('full_name, email, phone').eq('id', user.id).single()
        if (profile) setForm(prev => ({
          ...prev,
          full_name: profile.full_name ?? '',
          email: profile.email ?? user.email ?? '',
          phone: profile.phone ?? '',
        }))
        const { data: addr } = await supabase.from('customer_addresses')
          .select('*').eq('customer_id', user.id).eq('is_default', true).single()
        if (addr) setForm(prev => ({
          ...prev,
          line1: addr.line1, line2: addr.line2 ?? '',
          city: addr.city, province: addr.province, postal_code: addr.postal_code,
        }))
      }
      setPrefilling(false)
    }
    prefill()
  }, [])

  useEffect(() => {
    if (!currentVendorId) return
    async function loadVendor() {
      const supabase = createClient()
      const [methodRes, { data: vendor }, { data: ss }] = await Promise.all([
        fetch(`/api/checkout/payment-method?vendorId=${currentVendorId}`).then(r => r.json()).catch(() => null),
        supabase.from('vendors').select('business_name, slug').eq('id', currentVendorId).single(),
        supabase.from('vendor_store_settings').select('fulfilment_type, delivery_cost').eq('vendor_id', currentVendorId).single(),
      ])
      setVendorConfig(methodRes
        ? { provider: methodRes.provider ?? null, configured: !!methodRes.configured, payOnCollection: !!methodRes.payOnCollection }
        : null)
      setVendorInfo(vendor ? {
        ...vendor,
        delivery_cost: ss?.delivery_cost ?? 0,
        fulfilment_type: ss?.fulfilment_type ?? 'delivery',
      } : null)
    }
    loadVendor()
  }, [currentVendorId])

  // Which payment routes are available for this vendor + chosen fulfilment.
  const canPayOnline = Boolean(vendorConfig?.configured)
  const canPayOnCollection = Boolean(vendorConfig?.payOnCollection) && form.fulfilment === 'collection'

  // Keep the selected method valid as the customer changes fulfilment.
  useEffect(() => {
    if (payMethod === 'collection' && !canPayOnCollection) setPayMethod('online')
    if (payMethod === 'online' && !canPayOnline && canPayOnCollection) setPayMethod('collection')
  }, [canPayOnline, canPayOnCollection, payMethod])

  function setField(field: keyof CheckoutForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function validate(): string {
    if (!form.full_name.trim()) return 'Full name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Valid email is required'
    if (!form.phone.trim()) return 'Phone number is required'
    if (form.fulfilment === 'delivery') {
      if (!form.line1.trim()) return 'Street address is required'
      if (!form.city.trim()) return 'City is required'
      if (!form.province) return 'Province is required'
      if (!form.postal_code.trim()) return 'Postal code is required'
    }
    return ''
  }

  async function createOrder() {
    // Only identifiers/quantities are sent; the server recomputes all prices.
    const orderItems = currentVendorItems.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
      variant: i.variant ?? null,
    }))
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor_id: currentVendorId,
        customer_email: form.email, customer_name: form.full_name, customer_phone: form.phone,
        shipping_address: form.fulfilment === 'delivery'
          ? { line1: form.line1, line2: form.line2 || undefined, city: form.city, province: form.province, postal_code: form.postal_code, country: 'South Africa' }
          : { collection: true },
        items: orderItems, fulfilment: form.fulfilment,
        payment_provider: payMethod === 'collection' ? 'cash_on_collection' : vendorConfig?.provider,
      }),
    })
    const { data: order, error: orderError, checkoutToken } = await res.json()
    if (orderError) throw new Error(orderError)

    // Proof we created this order. /api/checkout/initiate and /verify need it,
    // and it must never travel in a URL. sessionStorage survives the round trip
    // to the gateway and back in the same tab.
    if (checkoutToken && order?.id) {
      try {
        sessionStorage.setItem(`ss_checkout_${order.id}`, checkoutToken)
      } catch {
        // Private mode or blocked storage — the webhook still settles the order.
      }
    }
    return { order, checkoutToken }
  }

  async function handlePay() {
    const err = validate()
    if (err) { setError(err); return }
    if (!canPayOnline && !canPayOnCollection) {
      setError('This vendor has not set up a way to accept orders yet.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const { order, checkoutToken } = await createOrder()

      // Pay on collection: nothing to charge now — the vendor takes payment
      // when the customer collects. Straight to the confirmation page.
      if (payMethod === 'collection') {
        window.location.href = `/marketplace/checkout/success?order=${order.id}&vendor=${vendorInfo?.slug ?? ''}&collect=true`
        return
      }

      // All gateway logic (and credential handling) runs server-side.
      const res = await fetch('/api/checkout/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, token: checkoutToken }),
      })
      const d = await res.json()
      if (!res.ok || !d.redirectUrl) {
        throw new Error(d.error ?? 'Payment could not be initiated. Please contact the vendor.')
      }
      window.location.href = d.redirectUrl
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-sm">
          <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <Link href="/marketplace/products" className="text-brand-mint text-sm font-medium hover:underline">Browse Products</Link>
        </div>
      </div>
    )
  }

  if (prefilling) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-mint" />
      </div>
    )
  }

  const vendorCount = vendorIds.length

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-3">
            <Link href="/marketplace" className="hover:text-brand-mint">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/marketplace/cart" className="hover:text-brand-mint">Cart</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-600">Checkout</span>
          </nav>
          <h1 className="text-2xl font-bold text-brand-forest">Checkout</h1>
          {vendorCount > 1 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {vendorIds.map((vid, i) => (
                <div key={vid} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${i === currentVendorIndex ? 'bg-brand-mint text-white' : i < currentVendorIndex ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {i < currentVendorIndex && <CheckCircle2 className="w-3 h-3" />}
                    {byVendor[vid][0].vendor_name}
                  </div>
                  {i < vendorCount - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
              </div>
            )}

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-mint" />Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input type="text" className="input" value={form.full_name} onChange={e => setField('full_name', e.target.value)} placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="label">Phone Number *</label>
                  <input type="tel" className="input" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+27 82 000 0000" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Email Address *</label>
                  <input type="email" className="input" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="you@example.com" />
                </div>
              </div>
            </div>

            {/* Fulfilment */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-mint" />Fulfilment Method
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {(['delivery', 'collection'] as const).map(opt => {
                  const available = opt === 'delivery'
                    ? vendorInfo?.fulfilment_type === 'delivery' || vendorInfo?.fulfilment_type === 'both'
                    : vendorInfo?.fulfilment_type === 'collection' || vendorInfo?.fulfilment_type === 'both'
                  return (
                    <button key={opt} onClick={() => available && setField('fulfilment', opt)} disabled={!available}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${form.fulfilment === opt ? 'border-brand-mint bg-blue-50' : 'border-gray-200 hover:border-gray-300'} ${!available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                      {opt === 'delivery' ? <Truck className="w-5 h-5 text-brand-mint flex-shrink-0" /> : <Store className="w-5 h-5 text-brand-mint flex-shrink-0" />}
                      <div>
                        <p className="font-semibold text-gray-900 text-sm capitalize">{opt}</p>
                        <p className="text-xs text-gray-400">{opt === 'delivery' ? (deliveryCost === 0 ? 'Free delivery' : `R${deliveryCost.toFixed(2)}`) : 'Pick up from vendor'}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              {form.fulfilment === 'delivery' && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Street Address *</label>
                    <input type="text" className="input" value={form.line1} onChange={e => setField('line1', e.target.value)} placeholder="123 Main Street" />
                  </div>
                  <div>
                    <label className="label">Apartment / Suite <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input type="text" className="input" value={form.line2} onChange={e => setField('line2', e.target.value)} placeholder="Apt 4B" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">City *</label>
                      <input type="text" className="input" value={form.city} onChange={e => setField('city', e.target.value)} placeholder="Cape Town" />
                    </div>
                    <div>
                      <label className="label">Postal Code *</label>
                      <input type="text" className="input" value={form.postal_code} onChange={e => setField('postal_code', e.target.value)} placeholder="8001" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Province *</label>
                    <select className="input" value={form.province} onChange={e => setField('province', e.target.value)}>
                      <option value="">Select province</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-mint" />Payment
              </h2>
              {(canPayOnline || canPayOnCollection) ? (
                <div className="space-y-3">
                  {canPayOnline && (
                    <button type="button" onClick={() => setPayMethod('online')}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${payMethod === 'online' ? 'border-brand-mint bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Pay now online</p>
                        <p className="text-xs text-gray-400">
                          You&apos;ll be redirected to pay securely. Funds go directly to {vendorInfo?.business_name}.
                        </p>
                      </div>
                    </button>
                  )}

                  {canPayOnCollection && (
                    <button type="button" onClick={() => setPayMethod('collection')}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${payMethod === 'collection' ? 'border-brand-mint bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <Store className="w-5 h-5 text-brand-mint flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Pay on collection</p>
                        <p className="text-xs text-gray-400">
                          Place your order now and pay {vendorInfo?.business_name} when you collect.
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Hint when pay-on-collection exists but delivery is selected */}
                  {!canPayOnCollection && vendorConfig?.payOnCollection && form.fulfilment === 'delivery' && (
                    <p className="text-xs text-gray-400">
                      Tip: choose <strong>Collection</strong> above if you&apos;d prefer to pay when you collect.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Payment not available</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {vendorInfo?.business_name} has not set up a way to accept orders yet. Please contact them directly.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
              <h2 className="font-bold text-gray-900 mb-1 text-sm">Order from {vendorInfo?.business_name ?? currentVendorItems[0]?.vendor_name}</h2>
              {vendorCount > 1 && <p className="text-xs text-gray-400 mb-3">Vendor {currentVendorIndex + 1} of {vendorCount}</p>}
              <div className="space-y-2 mb-4 mt-3">
                {currentVendorItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                      {item.image ? <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-gray-300" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 line-clamp-1">{item.product_name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-900 flex-shrink-0">R{(item.price * item.quantity).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 pt-3 border-t border-gray-100 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>R{subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{form.fulfilment === 'collection' ? 'Free (collection)' : deliveryCost === 0 ? 'Free' : `R${deliveryCost.toFixed(2)}`}</span></div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 mt-2"><span>Total</span><span>R{total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span></div>
              </div>
              <button onClick={handlePay} disabled={loading || (!canPayOnline && !canPayOnCollection)}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-mint text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {loading
                  ? 'Processing...'
                  : payMethod === 'collection'
                    ? 'Place Order'
                    : `Pay R${total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
              </button>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                {payMethod === 'collection'
                  ? `Pay ${vendorInfo?.business_name ?? 'the vendor'} when you collect`
                  : `Paid directly to ${vendorInfo?.business_name ?? 'vendor'}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
