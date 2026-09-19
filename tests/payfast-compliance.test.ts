import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  describeDeliveryCost, deliveryChargeFor, toVendorFulfilment, fulfilmentGaps, contactGaps,
} from '../src/lib/vendors/fulfilment.ts'
import { COMPANY, companyDisclosureLines } from '../src/lib/legal/company.ts'

/**
 * Payfast's onboarding compliance team will not verify a merchant whose
 * website lacks terms covering refund, cancellation and delivery. A vendor
 * selling only through Stallspace gives Payfast a Stallspace storefront URL,
 * so these pages are the merchant's website for that purpose.
 *
 * This file is the re-runnable version of that review. It fails when a policy
 * page, a footer link or a required clause goes missing.
 */

const read = (p: string) => readFileSync(p, 'utf8')

const TOS       = read('src/app/legal/terms-of-service/page.tsx')
const RETURNS   = read('src/app/legal/returns-and-refunds/page.tsx')
const DELIVERY  = read('src/app/legal/delivery/page.tsx')
const FOOTER    = read('src/components/marketplace/Footer.tsx')
const SITEMAP   = read('src/app/sitemap.ts')
const PANEL     = read('src/components/marketplace/FulfilmentPanel.tsx')
const STORE     = read('src/app/marketplace/store/[slug]/page.tsx')
const PRODUCT   = read('src/app/marketplace/products/[slug]/page.tsx')
const ORDERS    = read('src/app/api/orders/route.ts')
const CHECKOUT  = read('src/app/marketplace/checkout/page.tsx')
const PRIVACY   = read('src/app/legal/privacy-policy/page.tsx')
const POPIA     = read('src/app/legal/popia/page.tsx')

test('the footer links every policy a reviewer looks for', () => {
  for (const href of [
    '/legal/terms-of-service',
    '/legal/returns-and-refunds',
    '/legal/delivery',
    '/legal/privacy-policy',
  ]) {
    assert.ok(FOOTER.includes(href), `footer is missing a link to ${href}`)
  }
})

test('the sitemap lists every policy page', () => {
  for (const path of [
    '/legal/terms-of-service',
    '/legal/returns-and-refunds',
    '/legal/delivery',
    '/legal/privacy-policy',
  ]) {
    assert.ok(SITEMAP.includes(path), `sitemap is missing ${path}`)
  }
})

test('the terms incorporate the refund, cancellation and delivery policies', () => {
  assert.ok(TOS.includes('/legal/returns-and-refunds'), 'terms do not link the refunds policy')
  assert.ok(TOS.includes('/legal/delivery'), 'terms do not link the delivery policy')
  assert.match(TOS, /incorporated into these Terms/)
})

test('the refunds policy covers cancellation before dispatch', () => {
  assert.match(RETURNS, /Cancelling an order/)
  assert.match(RETURNS, /before the vendor dispatches it|before it ships/i)
  assert.match(RETURNS, /full refund/i)
})

test('the refunds policy states a refund turnaround', () => {
  assert.match(RETURNS, /five to ten business days/)
  assert.match(RETURNS, /30 days/)
})

test('the delivery policy states areas, cost, timeframe and non-arrival remedy', () => {
  assert.match(DELIVERY, /Delivery areas/)
  assert.match(DELIVERY, /Delivery cost/)
  assert.match(DELIVERY, /Delivery timeframes/)
  assert.match(DELIVERY, /within 30 days/)
  assert.match(DELIVERY, /does not arrive/)
})

test('prices are disclosed as ZAR inclusive of VAT', () => {
  assert.match(TOS, /South African Rand/)
  assert.match(TOS, /includes VAT/)
})

test('the terms publish a prohibited-goods list', () => {
  assert.match(TOS, /Prohibited and Restricted Goods/)
  for (const item of ['Weapons', 'Counterfeit', 'gambling']) {
    assert.ok(TOS.includes(item), `prohibited-goods list is missing ${item}`)
  }
})

// --- ECTA s43 supplier disclosure -------------------------------------------
// These fail until the real values are filled in src/lib/legal/company.ts.
// They are facts about the company, not copy, so no default can stand in.

// --- the pages must not contradict the code ---------------------------------

test('no page claims Stallspace cannot refund, because /api/orders/refund does', () => {
  // The refund route signs a PayFast API call with the vendor's own merchant
  // credentials. Saying we cannot refund is false, and a gateway reviewer who
  // finds the button after reading the sentence draws the worse conclusion.
  const REFUND_ROUTE = read('src/app/api/orders/refund/route.ts')
  assert.match(REFUND_ROUTE, /createPayFastRefund/)

  for (const [name, src] of [['returns', RETURNS], ['terms', TOS], ['delivery', DELIVERY]] as const) {
    assert.ok(
      !/cannot issue a refund on a vendor|cannot refund on a vendor|cannot refund you itself/.test(src),
      `${name} claims Stallspace cannot refund, which the refund route disproves`,
    )
  }
  assert.match(RETURNS, /cannot decide to refund you/)
})

test('the privacy policy does not claim we hold vendor bank accounts', () => {
  assert.ok(!/banking details/.test(PRIVACY), 'privacy policy still says we collect banking details')
  assert.match(PRIVACY, /does not collect or hold vendor bank account numbers/)
})

test('the privacy policy states a POPIA lawful basis', () => {
  assert.match(PRIVACY, /Lawful Basis/)
  assert.match(PRIVACY, /Performance of a contract/)
  assert.match(PRIVACY, /Legitimate interests/)
})

test('the privacy policy names where data actually lives', () => {
  assert.match(PRIVACY, /Frankfurt, Germany/)
  // The source is wrapped, so collapse whitespace before matching a phrase.
  assert.match(PRIVACY.replace(/\s+/g, ' '), /section 72 of POPIA/)
})

test('the privacy policy covers cookies and gives real retention periods', () => {
  assert.match(PRIVACY, /Cookies and Similar Technologies/)
  assert.match(PRIVACY, /no advertising cookies/)
  assert.match(PRIVACY, /five years/)
  assert.match(PRIVACY, /seven years/)
})

test('the cooling-off exclusions are the ECTA s42(2) list, not the EU one', () => {
  assert.match(RETURNS, /Section 42\(2\)/)
  assert.ok(!/hygiene/.test(RETURNS), 'the hygiene-seal exclusion is EU law and does not exist in ECTA')
})

test('a dispute-resolution body is named either way', () => {
  assert.match(TOS, /Consumer Goods and Services Ombud/)
  assert.match(TOS, /subscribes to no other self-regulatory body/)
})

test('POPIA pages carry the company disclosure block', () => {
  assert.match(POPIA, /companyDisclosureLines/)
  assert.match(PRIVACY, /companyDisclosureLines/)
})

// --- storefront readiness, surfaced to the admin ----------------------------

test('a vendor who never saved Store Settings is flagged', () => {
  assert.deepEqual(fulfilmentGaps(toVendorFulfilment(null)), ['Store Settings have never been saved'])
})

test('a collection-only vendor is not faulted for having no delivery terms', () => {
  const f = toVendorFulfilment({ fulfilment_type: 'collection', collection_address: '12 Main Rd' })
  assert.deepEqual(fulfilmentGaps(f), [])
})

test('a collection-only vendor with no address is flagged', () => {
  const f = toVendorFulfilment({ fulfilment_type: 'collection' })
  assert.deepEqual(fulfilmentGaps(f), ['No collection address published'])
})

test('a delivering vendor with no areas and no timeframe is flagged twice', () => {
  const f = toVendorFulfilment({ fulfilment_type: 'delivery', delivery_cost: 50 })
  assert.deepEqual(fulfilmentGaps(f), ['No delivery areas listed', 'No delivery timeframe published'])
})

test('a fully set-up delivering vendor is clean', () => {
  const f = toVendorFulfilment({
    fulfilment_type: 'both',
    delivery_areas: ['Cape Town', 'Stellenbosch'],
    delivery_cost: 60,
    estimated_delivery_time: '2 to 4 business days',
    collection_address: '12 Main Rd',
  })
  assert.deepEqual(fulfilmentGaps(f), [])
})

test('hidden vendor contact details are flagged, because the vendor owes the s43 duty', () => {
  const vendor = { email: 'a@b.co.za', phone: '+27 21 000 0000', business_address: '12 Main Rd' }
  assert.deepEqual(contactGaps(vendor, { show_email: true, show_phone: true, show_address: true }), [])
  assert.deepEqual(contactGaps(vendor, { show_email: true, show_phone: false, show_address: true }),
    ['Phone hidden on storefront'])
  assert.deepEqual(contactGaps({ email: 'a@b.co.za', phone: null, business_address: null }, null),
    ['Phone hidden on storefront', 'Address hidden on storefront'])
})

test('the information officer is named', () => {
  assert.notEqual(COMPANY.informationOfficer, '', 'set COMPANY.informationOfficer in src/lib/legal/company.ts')
})

test('the company registration number is published', () => {
  assert.notEqual(COMPANY.registrationNumber, '', 'set COMPANY.registrationNumber in src/lib/legal/company.ts')
})

test('a physical address is published', () => {
  assert.notEqual(COMPANY.physicalAddress, '', 'set COMPANY.physicalAddress in src/lib/legal/company.ts')
})

test('a telephone number is published', () => {
  assert.notEqual(COMPANY.telephone, '', 'set COMPANY.telephone in src/lib/legal/company.ts')
})

test('the disclosure block skips a field rather than printing a placeholder', () => {
  const lines = companyDisclosureLines()
  assert.ok(lines.every(l => l.trim().length > 0))
  assert.ok(lines[0].includes('Kwry'))
})

// --- published terms match billed terms --------------------------------------

test('storefront and product pages read delivery terms from vendor_store_settings', () => {
  for (const [name, src] of [['storefront', STORE], ['product page', PRODUCT]] as const) {
    assert.ok(src.includes('FULFILMENT_SELECT'), `${name} does not use the shared fulfilment select`)
    assert.ok(
      !/vendor\.delivery_cost|vendor\.estimated_delivery_time|vendor\.fulfilment_type/.test(src),
      `${name} reads delivery terms off vendors.*, which is not the row checkout bills from`,
    )
  }
})

test('the quoted total and the billed total come from one function', () => {
  // The checkout summary used to read delivery_cost alone while the order API
  // applied the free-delivery threshold, so a customer over the threshold was
  // quoted a total the gateway was never asked for.
  for (const [name, src] of [['order API', ORDERS], ['checkout', CHECKOUT]] as const) {
    assert.ok(src.includes('deliveryChargeFor'), `${name} does not use the shared delivery rule`)
    assert.ok(src.includes('FULFILMENT_SELECT'), `${name} does not use the shared fulfilment select`)
  }
})

test('the shared delivery rule applies the free-delivery threshold', () => {
  const f = toVendorFulfilment({ delivery_cost: 60, free_delivery_threshold: 500 })
  assert.equal(deliveryChargeFor(f, 300, 'delivery'), 60)
  assert.equal(deliveryChargeFor(f, 500, 'delivery'), 0)
  assert.equal(deliveryChargeFor(f, 900, 'delivery'), 0)
  assert.equal(deliveryChargeFor(f, 300, 'collection'), 0)

  const noThreshold = toVendorFulfilment({ delivery_cost: 60, free_delivery_threshold: 0 })
  assert.equal(deliveryChargeFor(noThreshold, 10000, 'delivery'), 60)
})

test('the published delivery fee describes the rule checkout applies', () => {
  const paid = toVendorFulfilment({ delivery_cost: 60, free_delivery_threshold: 500 })
  assert.equal(describeDeliveryCost(paid), 'R60,00 delivery, free on orders over R500,00')

  const flat = toVendorFulfilment({ delivery_cost: 60, free_delivery_threshold: 0 })
  assert.equal(describeDeliveryCost(flat), 'R60,00 delivery on every order')

  const free = toVendorFulfilment({ delivery_cost: 0, free_delivery_threshold: 0 })
  assert.equal(describeDeliveryCost(free), 'Free delivery on every order')
})

test('a missing settings row falls back to delivery with no fee', () => {
  const f = toVendorFulfilment(null)
  assert.equal(f.offersDelivery, true)
  assert.equal(f.offersCollection, false)
  assert.equal(f.deliveryCost, 0)
  assert.equal(f.freeDeliveryThreshold, null)
})

test('collection-only vendors do not advertise delivery', () => {
  const f = toVendorFulfilment({ fulfilment_type: 'collection', collection_address: '12 Main Rd' })
  assert.equal(f.offersDelivery, false)
  assert.equal(f.offersCollection, true)
  assert.equal(f.collectionAddress, '12 Main Rd')
})

test('the fulfilment panel links both policies', () => {
  assert.ok(PANEL.includes('/legal/delivery'))
  assert.ok(PANEL.includes('/legal/returns-and-refunds'))
})
