// Reads live data / the user session, so it must never be statically rendered.
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react'

interface PageProps {
  searchParams: { order?: string }
}

export default async function CheckoutCancelPage({ searchParams }: PageProps) {

  // Deliberately does NOT change the order. This is a GET: link prefetchers,
  // chat-app URL previews and email scanners all follow it, and any of them
  // would have cancelled a live order. The gateway's signed webhook is what
  // marks a cancellation (see /api/orders/notify).

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          <p className="text-gray-500 text-sm mb-6">
            No payment was taken. Your cart is still saved — you can try again whenever you&apos;re ready.
          </p>

          <div className="flex flex-col gap-2">
            <Link
              href="/marketplace/cart"
              className="w-full flex items-center justify-center gap-2 bg-brand-mint text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" /> Return to Cart
            </Link>
            <Link
              href="/marketplace/products"
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
