"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Package, ShoppingBag, Loader2, AlertCircle } from 'lucide-react'
import { useCartStore } from '@/lib/cart/store'
import { createClient } from '@/lib/supabase/client'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId    = searchParams.get('order')
  const provider   = searchParams.get('provider')
  const isManual   = searchParams.get('manual') === 'true'

  const clearVendorItems = useCartStore(s => s.clearVendorItems)
  const clearCart        = useCartStore(s => s.clearCart)

  const [order, setOrder]     = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    async function confirm() {
      if (!orderId) { setLoading(false); return }
      try {
        const supabase = createClient()

        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', orderId)
          .eq('status', 'pending')

        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('id, order_number, total, status, vendor_id, vendor:vendors(business_name, slug)')
          .eq('id', orderId)
          .single()

        if (fetchError) throw new Error(fetchError.message)
        setOrder(data)

        if (data?.vendor_id) {
          clearVendorItems(data.vendor_id)
        } else {
          clearCart()
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not confirm order')
      } finally {
        setLoading(false)
      }
    }
    confirm()
  }, [orderId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 className="w-8 h-8 text-green-500" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {isManual ? 'Order Created' : 'Payment Successful'}
      </h1>

      {order ? (
        <>
          <p className="text-gray-500 text-sm mb-1">
            Order <strong className="text-gray-800">#{order.order_number}</strong>
          </p>
          <p className="text-gray-500 text-sm mb-5">
            from <strong className="text-gray-800">{(order.vendor as any)?.business_name}</strong>
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold text-gray-900">
                R{Number(order.total).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1.5">
              <span className="text-gray-500">Status</span>
              <span className="font-semibold text-green-600 capitalize">{order.status}</span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-500 text-sm mb-6">Your order has been received.</p>
      )}

      {error && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5 flex items-start gap-2 text-left">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Payment was received but we could not update your order status automatically.
            Your order reference is <strong>{orderId}</strong>. Contact support if needed.
          </p>
        </div>
      )}

      {isManual && provider === 'yoco' && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5 text-left flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Complete payment with vendor</p>
            <p className="text-xs text-amber-600 mt-0.5">
              This vendor uses Yoco. Contact them directly to complete your payment.
            </p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">What happens next?</h3>
        <ol className="space-y-1.5">
          {[
            'The vendor receives your order notification',
            'They confirm and begin processing your order',
            "You'll receive updates on your order status",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
              <span className="w-4 h-4 bg-brand-accent text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-bold">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href="/account/orders"
          className="w-full flex items-center justify-center gap-2 bg-brand-accent text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Package className="w-4 h-4" /> View My Orders
        </Link>
        <Link
          href="/marketplace/products"
          className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
        >
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Suspense fallback={
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  )
}
