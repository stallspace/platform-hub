import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Package, Star } from 'lucide-react'
import type { Vendor } from '@/types'

interface VendorCardProps {
  vendor: Vendor
  productCount?: number
}

export default function VendorCard({ vendor, productCount }: VendorCardProps) {
  return (
    <Link
      href={`/marketplace/store/${vendor.slug}`}
      className="card group overflow-hidden block hover:-translate-y-0.5 transition-transform duration-200"
    >
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-r from-brand-forest to-brand-mint">
        {vendor.banner_url && (
          <Image
            src={vendor.banner_url}
            alt={`${vendor.business_name} banner`}
            fill
            className="object-cover"
          />
        )}
      </div>

      <div className="p-4 pt-0">
        {/* Logo */}
        <div className="relative -mt-8 mb-3">
          <div className="w-16 h-16 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden">
            {vendor.logo_url ? (
              <Image
                src={vendor.logo_url}
                alt={vendor.business_name}
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-brand-forest flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {vendor.business_name[0]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <h3 className="font-bold text-gray-900 group-hover:text-brand-mint transition-colors text-sm">
          {vendor.business_name}
        </h3>

        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
          {vendor.business_description}
        </p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Package className="w-3.5 h-3.5" />
            <span>{productCount ?? 0} products</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-yellow-500">
            <Star className="w-3.5 h-3.5 fill-yellow-400" />
            <span className="text-gray-600 font-medium">4.8</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
