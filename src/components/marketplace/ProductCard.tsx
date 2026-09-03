import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  // A "was" price is only a discount if it is actually higher than the price.
  // Vendors routinely enter the same number in both fields, which rendered as
  // "R325,00 R325,00" with the second struck through.
  const hasDiscount =
    product.compare_at_price != null &&
    Number(product.compare_at_price) > Number(product.price)

  const discount = hasDiscount
    ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)
    : null

  return (
    <div className="card group cursor-pointer overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl text-gray-200">📦</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount && (
            <span className="badge bg-red-500 text-white text-xs">-{discount}%</span>
          )}
          {product.is_featured && (
            <span className="badge bg-brand-mint text-white text-xs">Featured</span>
          )}
          {!product.is_available || (product.track_inventory && (product.stock_quantity ?? 0) === 0) ? (
            <span className="badge bg-gray-500 text-white text-xs">Out of Stock</span>
          ) : null}
        </div>

        {/* Quick actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Heart className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Vendor */}
        {product.vendor && (
          <Link
            href={`/marketplace/store/${product.vendor.slug}`}
            className="text-xs text-brand-mint font-medium hover:underline"
          >
            {product.vendor.business_name}
          </Link>
        )}

        {/* Name */}
        <Link href={`/marketplace/products/${product.id}`}>
          <h3 className="text-sm font-semibold text-gray-900 mt-1 mb-2 line-clamp-2 hover:text-brand-mint transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating placeholder */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="text-xs text-gray-400 ml-1">(24)</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-brand-forest">
              {formatCurrency(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through ml-1.5">
                {formatCurrency(product.compare_at_price as number)}
              </span>
            )}
          </div>

          <Link
            href={`/marketplace/products/${product.id}`}
            className="flex items-center gap-1.5 bg-brand-mint text-white text-xs font-semibold 
                       px-3 py-2 rounded-lg hover:bg-brand-mint-dark transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Buy
          </Link>
        </div>
      </div>
    </div>
  )
}
