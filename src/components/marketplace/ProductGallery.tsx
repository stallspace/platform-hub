'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'

interface ProductGalleryProps {
  images: string[] | null
  productName: string
}

/**
 * Product image gallery.
 *
 * The product page is a server component, so its thumbnails were markup only
 * — they looked clickable and did nothing, and only the first image was ever
 * visible. Selecting an image needs client state, so the gallery lives here.
 */
export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const gallery = (images ?? []).filter(Boolean)
  const [active, setActive] = useState(0)

  // Guard against an index left over if the product's images change.
  const current = gallery[active] ?? gallery[0]

  return (
    <div>
      <div className="aspect-square rounded-2xl bg-white border border-gray-100 overflow-hidden mb-3 shadow-sm">
        {current ? (
          <img
            src={current}
            alt={gallery.length > 1 ? `${productName} — image ${active + 1} of ${gallery.length}` : productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-20 h-20 text-gray-200" />
          </div>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Product images">
          {gallery.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${gallery.length}`}
              aria-current={i === active}
              className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-mint focus-visible:ring-offset-2 ${
                i === active ? 'border-brand-mint' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
