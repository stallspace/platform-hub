import Link from 'next/link'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export interface StorefrontGap {
  vendorId: string
  businessName: string
  slug: string
  gaps: string[]
}

interface Props {
  incomplete: StorefrontGap[]
  checked: number
}

/**
 * Approved storefronts that do not publish the terms a payment gateway looks
 * for. Payfast reviews the storefront URL a vendor gives them, so a live
 * storefront with no delivery terms and hidden contact details is how a
 * vendor's merchant application gets declined.
 */
export default function StorefrontGapsPanel({ incomplete, checked }: Props) {
  if (incomplete.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-8 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">
            All {checked} approved storefronts publish complete trading terms.
          </p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Delivery or collection terms and public contact details are set on every one.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900">
            {incomplete.length} of {checked} approved storefront{checked === 1 ? '' : 's'} is missing
            trading terms
          </p>
          <p className="text-xs text-amber-800 mt-0.5 mb-3">
            Payfast reviews the storefront URL a vendor gives them. A storefront with no delivery terms or
            hidden contact details is a reason to decline their merchant application.
          </p>

          <ul className="space-y-2">
            {incomplete.map(v => (
              <li key={v.vendorId} className="text-sm">
                <Link
                  href={`/marketplace/store/${v.slug}`}
                  target="_blank"
                  className="font-medium text-amber-900 underline decoration-amber-300 hover:decoration-amber-600"
                >
                  {v.businessName}
                </Link>
                <span className="text-amber-800"> {v.gaps.join('. ')}.</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
