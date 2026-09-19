import Link from 'next/link'
import { Truck, StoreIcon, Clock, MapPin, Banknote } from 'lucide-react'
import {
  type VendorFulfilment,
  describeDeliveryCost,
  describeDeliveryAreas,
} from '@/lib/vendors/fulfilment'

interface Props {
  fulfilment: VendorFulfilment
  className?: string
}

/**
 * The vendor's published delivery and collection terms. One component so the
 * storefront and the product page cannot state different terms for the same
 * vendor, and so both stay tied to the row checkout bills from.
 */
export default function FulfilmentPanel({ fulfilment: f, className = '' }: Props) {
  const areas = describeDeliveryAreas(f)

  return (
    <div className={`bg-white rounded-xl border border-[#E5E7EB] p-5 ${className}`}>
      <h2 className="font-semibold text-[#111111] mb-3">Delivery &amp; Collection</h2>

      <div className="space-y-3">
        {f.offersDelivery && (
          <div className="flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-[#2ECC8E] mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#374151]">Delivery available</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{describeDeliveryCost(f)}</p>
              {f.estimatedDeliveryTime && (
                <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  {f.estimatedDeliveryTime}
                </p>
              )}
              {areas && (
                <p className="text-xs text-[#6B7280] flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>Delivers to {areas}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {f.offersCollection && (
          <div className="flex items-start gap-2.5">
            <StoreIcon className="w-4 h-4 text-[#2ECC8E] mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#374151]">Collection available</p>
              {f.collectionAddress && (
                <p className="text-xs text-[#6B7280] mt-0.5">{f.collectionAddress}</p>
              )}
              {f.collectionHours && (
                <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  {f.collectionHours}
                </p>
              )}
              {f.collectionInstructions && (
                <p className="text-xs text-[#6B7280] mt-0.5">{f.collectionInstructions}</p>
              )}
            </div>
          </div>
        )}

        {f.payOnCollection && (
          <div className="flex items-start gap-2.5">
            <Banknote className="w-4 h-4 text-[#2ECC8E] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#374151]">
              You may pay this vendor when you collect.
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-[#9CA3AF] mt-4 pt-3 border-t border-[#E5E7EB]">
        Full terms in our{' '}
        <Link href="/legal/delivery" className="text-[#2ECC8E] hover:underline">
          Delivery Policy
        </Link>{' '}
        and{' '}
        <Link href="/legal/returns-and-refunds" className="text-[#2ECC8E] hover:underline">
          Returns, Refunds &amp; Cancellations
        </Link>
        .
      </p>
    </div>
  )
}
