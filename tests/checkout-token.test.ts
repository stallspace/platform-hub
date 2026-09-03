import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env.PAYMENT_ENCRYPTION_KEY = 'test-signing-key-for-checkout-tokens'

const { createCheckoutToken, verifyCheckoutToken } = await import('../src/lib/payments/checkout-token.ts')

const ORDER = '8f14e45f-ceea-467a-9d4f-1b0f3c2d5a71'

test('a token verifies for the order it was issued for', () => {
  const token = createCheckoutToken(ORDER)
  assert.equal(verifyCheckoutToken(ORDER, token), true)
})

test('a token issued for one order does not verify for another', () => {
  const token = createCheckoutToken(ORDER)
  assert.equal(verifyCheckoutToken('11111111-2222-3333-4444-555555555555', token), false)
})

test('missing, empty and non-string tokens are rejected', () => {
  assert.equal(verifyCheckoutToken(ORDER, undefined), false)
  assert.equal(verifyCheckoutToken(ORDER, null), false)
  assert.equal(verifyCheckoutToken(ORDER, ''), false)
  assert.equal(verifyCheckoutToken(ORDER, 12345), false)
  assert.equal(verifyCheckoutToken(ORDER, {}), false)
})

test('a tampered token is rejected', () => {
  const token = createCheckoutToken(ORDER)
  const flipped = (token[0] === 'a' ? 'b' : 'a') + token.slice(1)
  assert.equal(verifyCheckoutToken(ORDER, flipped), false)
  // Length mismatch must not throw (timingSafeEqual requires equal lengths).
  assert.equal(verifyCheckoutToken(ORDER, token.slice(0, -2)), false)
})

test('tokens are deterministic for the same order', () => {
  assert.equal(createCheckoutToken(ORDER), createCheckoutToken(ORDER))
})
