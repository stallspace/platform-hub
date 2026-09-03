import { test } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Mirrors the transition table in src/app/api/orders/status/route.ts.
 * The rule that matters: a vendor must never be able to mark an unpaid
 * gateway order as confirmed — that fires the stock trigger and emails the
 * customer that a payment succeeded.
 */
const VENDOR_TRANSITIONS: Record<string, string[]> = {
  pending:    ['cancelled'],
  confirmed:  ['processing', 'shipped', 'delivered', 'completed', 'cancelled'],
  processing: ['shipped', 'delivered', 'completed', 'cancelled'],
  shipped:    ['delivered', 'completed'],
  delivered:  ['completed'],
  completed:  [],
  cancelled:  [],
  refunded:   [],
}

function allowedNext(current: string, provider: string | null): string[] {
  const base = VENDOR_TRANSITIONS[current] ?? []
  if (current === 'pending' && provider === 'cash_on_collection') {
    return [...base, 'confirmed']
  }
  return base
}

test('a vendor cannot confirm an unpaid gateway order', () => {
  assert.equal(allowedNext('pending', 'payfast').includes('confirmed'), false)
  assert.equal(allowedNext('pending', null).includes('confirmed'), false)
})

test('a vendor can confirm a pay-on-collection order once cash changes hands', () => {
  assert.equal(allowedNext('pending', 'cash_on_collection').includes('confirmed'), true)
})

test('statuses never move backwards', () => {
  assert.equal(allowedNext('completed', 'payfast').length, 0)
  assert.equal(allowedNext('shipped', 'payfast').includes('pending'), false)
  assert.equal(allowedNext('confirmed', 'payfast').includes('pending'), false)
  assert.equal(allowedNext('cancelled', 'payfast').includes('confirmed'), false)
})

test('terminal states accept nothing', () => {
  for (const terminal of ['completed', 'cancelled', 'refunded']) {
    assert.deepEqual(allowedNext(terminal, 'payfast'), [], `${terminal} should be terminal`)
  }
})

test('an unknown status grants no transitions', () => {
  assert.deepEqual(allowedNext('not-a-status', 'payfast'), [])
})
