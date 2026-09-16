import { test } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Mirrors the delivery pricing in src/app/api/orders/route.ts.
 *
 * Vendors can set a free-delivery threshold in Store Settings. It was
 * collected by the form and never read when pricing an order, so a vendor
 * advertising "free delivery over R500" was silently still charging.
 */
function deliveryCost(subtotal: number, cost: number, threshold: number): number {
  if (threshold > 0 && subtotal >= threshold) return 0
  return cost
}

test('under the threshold, delivery is charged', () => {
  assert.equal(deliveryCost(300, 60, 500), 60)
})

test('at or over the threshold, delivery is free', () => {
  assert.equal(deliveryCost(500, 60, 500), 0)
  assert.equal(deliveryCost(750, 60, 500), 0)
})

test('a threshold of zero means no threshold, not everything free', () => {
  // The column defaults to 0. Treating that as "free over R0" would make all
  // delivery free for every vendor who never set one.
  assert.equal(deliveryCost(10, 60, 0), 60)
  assert.equal(deliveryCost(10_000, 60, 0), 60)
})

test('a vendor charging nothing for delivery stays free regardless', () => {
  assert.equal(deliveryCost(50, 0, 500), 0)
})
