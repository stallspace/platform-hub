// The delivery terms a storefront publishes have to be the same numbers
// checkout charges. They were not: the storefront and product pages read
// vendors.delivery_cost, while /api/orders/route.ts charges
// vendor_store_settings.delivery_cost, which is the row Store Settings
// actually writes. A vendor could set R60 delivery, see "Free delivery" on
// their own product page, and bill the customer R60 at checkout.
//
// vendor_store_settings is the single source. Everything that displays
// fulfilment terms goes through this module.

export type FulfilmentType = 'delivery' | 'collection' | 'both'

export interface VendorFulfilment {
  /** False when the vendor has never saved Store Settings at all. */
  configured: boolean
  type: FulfilmentType
  offersDelivery: boolean
  offersCollection: boolean
  deliveryAreas: string[]
  deliveryCost: number
  /** null means the vendor set no threshold, not "everything is free". */
  freeDeliveryThreshold: number | null
  estimatedDeliveryTime: string | null
  collectionAddress: string | null
  collectionHours: string | null
  collectionInstructions: string | null
  payOnCollection: boolean
}

/** Column list for a vendor_store_settings select. Shared so no caller drifts. */
export const FULFILMENT_SELECT =
  'fulfilment_type, delivery_areas, delivery_cost, free_delivery_threshold, ' +
  'estimated_delivery_time, collection_address, collection_hours, ' +
  'collection_instructions, pay_on_collection'

const DEFAULT_FULFILMENT: VendorFulfilment = {
  configured: false,
  type: 'delivery',
  offersDelivery: true,
  offersCollection: false,
  deliveryAreas: [],
  deliveryCost: 0,
  freeDeliveryThreshold: null,
  estimatedDeliveryTime: null,
  collectionAddress: null,
  collectionHours: null,
  collectionInstructions: null,
  payOnCollection: false,
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function toVendorFulfilment(row: unknown): VendorFulfilment {
  if (!row || typeof row !== 'object') return DEFAULT_FULFILMENT
  const r = row as Record<string, unknown>

  const raw = asString(r.fulfilment_type)
  const type: FulfilmentType =
    raw === 'collection' || raw === 'both' || raw === 'delivery' ? raw : 'delivery'

  const threshold = Number(r.free_delivery_threshold ?? 0)

  return {
    configured: true,
    type,
    offersDelivery: type === 'delivery' || type === 'both',
    offersCollection: type === 'collection' || type === 'both',
    deliveryAreas: Array.isArray(r.delivery_areas)
      ? r.delivery_areas.map(a => String(a).trim()).filter(Boolean)
      : [],
    deliveryCost: Number.isFinite(Number(r.delivery_cost)) ? Number(r.delivery_cost) : 0,
    freeDeliveryThreshold: Number.isFinite(threshold) && threshold > 0 ? threshold : null,
    estimatedDeliveryTime: asString(r.estimated_delivery_time),
    collectionAddress: asString(r.collection_address),
    collectionHours: asString(r.collection_hours),
    collectionInstructions: asString(r.collection_instructions),
    payOnCollection: r.pay_on_collection === true,
  }
}

export function formatRand(amount: number): string {
  return 'R' + amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * The delivery-fee sentence a customer reads before paying. It has to describe
 * the same rule /api/orders/route.ts applies, threshold included.
 */
export function describeDeliveryCost(f: VendorFulfilment): string {
  if (f.deliveryCost <= 0) return 'Free delivery on every order'
  if (f.freeDeliveryThreshold !== null) {
    return formatRand(f.deliveryCost) + ' delivery, free on orders over ' +
      formatRand(f.freeDeliveryThreshold)
  }
  return formatRand(f.deliveryCost) + ' delivery on every order'
}

export function describeDeliveryAreas(f: VendorFulfilment): string | null {
  if (f.deliveryAreas.length === 0) return null
  return f.deliveryAreas.join(', ')
}

/**
 * The delivery charge for one order. This is the rule of record: the checkout
 * summary, the order API and the storefront copy all call it, so the amount a
 * customer is quoted is the amount their gateway is asked for.
 *
 * A threshold of 0 means the vendor set none, not that everything is free.
 */
export function deliveryChargeFor(
  f: VendorFulfilment,
  subtotal: number,
  choice: 'delivery' | 'collection',
): number {
  if (choice !== 'delivery') return 0
  if (f.freeDeliveryThreshold !== null && subtotal >= f.freeDeliveryThreshold) return 0
  return f.deliveryCost
}

/**
 * What a storefront is missing before it reads as a real trading website.
 *
 * A vendor who only collects is not incomplete for having no delivery terms,
 * so each rule is scoped to what that vendor actually offers. Empty means the
 * storefront publishes terms a payment gateway reviewer would accept.
 */
export function fulfilmentGaps(f: VendorFulfilment): string[] {
  if (!f.configured) return ['Store Settings have never been saved']

  const gaps: string[] = []

  if (f.offersDelivery) {
    if (f.deliveryAreas.length === 0) gaps.push('No delivery areas listed')
    if (!f.estimatedDeliveryTime) gaps.push('No delivery timeframe published')
  }

  if (f.offersCollection && !f.collectionAddress) {
    gaps.push('No collection address published')
  }

  if (!f.offersDelivery && !f.offersCollection) {
    gaps.push('Offers neither delivery nor collection')
  }

  return gaps
}

/**
 * Section 43 of the ECT Act puts the disclosure duty on the supplier, and on
 * this marketplace the supplier is the vendor. A vendor who has switched their
 * contact details off is not disclosing, whatever the marketplace publishes.
 */
export function contactGaps(
  vendor: { email?: string | null; phone?: string | null; business_address?: string | null },
  settings: { show_email?: boolean | null; show_phone?: boolean | null; show_address?: boolean | null } | null,
): string[] {
  const gaps: string[] = []
  if (settings?.show_email === false || !vendor.email) gaps.push('Email hidden on storefront')
  if (settings?.show_phone === false || !vendor.phone) gaps.push('Phone hidden on storefront')
  if (settings?.show_address === false || !vendor.business_address) gaps.push('Address hidden on storefront')
  return gaps
}
