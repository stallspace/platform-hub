"use client"

import Link from 'next/link'
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowRight,
  Package, ShieldCheck, Truck, Tag, ArrowLeft
} from 'lucide-react'
import { useCartStore, groupByVendor } from '@/lib/cart/store'

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCartStore()
  const byVendor = groupByVendor(items)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-brand-forest">Your Cart</h1>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-white rounded-2xl border border-gray-100 p-16 inline-block">
            <ShoppingCart className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 text-sm mb-6">Browse the marketplace and add products to your cart.</p>
            <Link
              href="/marketplace/products"
              className="inline-flex items-center gap-2 bg-brand-mint text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Browse Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-brand-forest">
              Your Cart
              <span className="text-gray-400 font-normal text-lg ml-3">
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
            </h1>
            <Link href="/marketplace/products" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-mint transition-colors">
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {Object.values(byVendor).map((vendorItems) => (
              <div key={vendorItems[0].vendor_id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <Link
                    href={`/marketplace/store/${vendorItems[0].vendor_slug}`}
                    className="text-sm font-semibold text-gray-800 hover:text-brand-mint transition-colors"
                  >
                    {vendorItems[0].vendor_name}
                  </Link>
                </div>

                {vendorItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 border-b border-gray-50 last:border-0">
                    <div className="w-16 h-16 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/marketplace/products/${item.product_slug}`}
                        className="text-sm font-semibold text-gray-900 hover:text-brand-mint transition-colors line-clamp-2"
                      >
                        {item.product_name}
                      </Link>
                      {item.variant && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Tag className="w-3 h-3" /> {item.variant}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:border-brand-mint hover:text-brand-mint transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:border-brand-mint hover:text-brand-mint transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-brand-forest text-sm">
                            R{(item.price * item.quantity).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
              <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
                  <span>R{subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Delivery</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-100 mb-5">
                <span>Total</span>
                <span>R{subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
              </div>
              <Link
                href="/marketplace/checkout"
                className="w-full flex items-center justify-center gap-2 bg-brand-mint text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                  Payments go directly to verified vendors
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Truck className="w-3.5 h-3.5 text-brand-mint" />
                  Delivery arranged by each vendor
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
