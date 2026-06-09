"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Zap, Heart, GitCompare, Share2, CheckCircle2 } from 'lucide-react'
import { useCartStore } from '@/lib/cart/store'

interface Props {
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: string[]
    track_inventory: boolean
    stock_quantity: number | null
  }
  vendor: {
    id: string
    business_name: string
    slug: string
  }
  outOfStock: boolean
}

export default function AddToCartButton({ product, vendor, outOfStock }: Props) {
  const router = useRouter()
  const addItem = useCartStore(s => s.addItem)
  const [added, setAdded] = useState(false)

  function handleAddToCart() {
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      vendor_id: vendor.id,
      vendor_name: vendor.business_name,
      vendor_slug: vendor.slug,
      price: product.price,
      quantity: 1,
      image: product.images?.[0] ?? null,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleBuyNow() {
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      vendor_id: vendor.id,
      vendor_name: vendor.business_name,
      vendor_slug: vendor.slug,
      price: product.price,
      quantity: 1,
      image: product.images?.[0] ?? null,
    })
    router.push('/marketplace/checkout')
  }

  if (outOfStock) {
    return (
      <button disabled className="w-full py-3 rounded-xl bg-gray-200 text-gray-500 font-semibold text-sm cursor-not-allowed">
        Out of Stock
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleAddToCart}
        className="w-full py-3 rounded-xl bg-brand-navy text-white font-semibold text-sm hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
      >
        {added ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Added to Cart
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </>
        )}
      </button>

      <button
        onClick={handleBuyNow}
        className="w-full py-3 rounded-xl bg-brand-accent text-white font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <Zap className="w-4 h-4" />
        Buy Now
      </button>

      <div className="grid grid-cols-3 gap-2">
        <button className="flex flex-col items-center gap-1 py-2 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-brand-accent hover:text-brand-accent transition-colors">
          <Heart className="w-4 h-4" />
          Save
        </button>
        <button className="flex flex-col items-center gap-1 py-2 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-brand-accent hover:text-brand-accent transition-colors">
          <GitCompare className="w-4 h-4" />
          Compare
        </button>
        <button
          onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
          className="flex flex-col items-center gap-1 py-2 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-brand-accent hover:text-brand-accent transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
    </div>
  )
}
