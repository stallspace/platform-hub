'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, ShoppingCart } from 'lucide-react'

/**
 * Checkout is the most expensive place to look broken, and the one place a
 * customer needs to be told plainly whether their money moved.
 */
export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[checkout error]', error)
  }, [error])

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout hit a problem</h1>
          <p className="text-gray-500 text-sm mb-6">
            No payment has been taken. Your cart is still saved, so you can try again — and if you
            had already been sent to the payment page, check your email before retrying.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 bg-brand-mint text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <Link
              href="/marketplace/cart"
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Back to cart
            </Link>
          </div>

          <p className="text-xs text-gray-400 mt-6">
            Need help? <a href="mailto:hello@stallspace.co.za" className="underline">hello@stallspace.co.za</a>
          </p>
        </div>
      </div>
    </div>
  )
}
