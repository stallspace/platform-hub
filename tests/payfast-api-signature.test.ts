import { test } from 'node:test'
import assert from 'node:assert/strict'

const { payFastApiHeaders, phpUrlencode: apiEncode } = await import('../src/lib/payments/payfast-api.ts')
const { buildPayFastUrl, phpUrlencode: itnEncode } = await import('../src/lib/payments/payfast.ts')

const CREDS = { merchantId: '10000100', passphrase: 'test-passphrase' }

test('API headers carry the four required fields plus content type', () => {
  const h = payFastApiHeaders(CREDS, { amount: 1000 })
  assert.equal(h['merchant-id'], '10000100')
  assert.equal(h.version, 'v1')
  assert.equal(h['Content-Type'], 'application/json')
  assert.match(h.signature, /^[a-f0-9]{32}$/)
})

test('timestamp has no milliseconds — PayFast rejects the ISO default', () => {
  const h = payFastApiHeaders(CREDS, {})
  assert.match(h.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
  assert.equal(h.timestamp.includes('.'), false)
})

test('the passphrase is never transmitted, only hashed', () => {
  const h = payFastApiHeaders(CREDS, { amount: 500 })
  for (const v of Object.values(h)) {
    assert.equal(String(v).includes('test-passphrase'), false)
  }
})

test('changing the passphrase changes the signature', () => {
  const a = payFastApiHeaders(CREDS, { amount: 500 })
  const b = payFastApiHeaders({ ...CREDS, passphrase: 'different' }, { amount: 500 })
  assert.notEqual(a.signature, b.signature)
})

test('changing the body changes the signature', () => {
  const a = payFastApiHeaders(CREDS, { amount: 500 })
  const b = payFastApiHeaders(CREDS, { amount: 501 })
  assert.notEqual(a.signature, b.signature)
})

test('the API signature is a DIFFERENT construction from the redirect signature', () => {
  // The redirect/ITN signature signs fields in a fixed order with the
  // passphrase appended last; the REST API sorts alphabetically and treats the
  // passphrase as just another field. Conflating them produces a mismatch that
  // looks exactly like a wrong passphrase, so assert they are not the same.
  process.env.PAYFAST_ENV = 'live'
  const url = buildPayFastUrl({
    merchantId: CREDS.merchantId, merchantKey: 'key123', passphrase: CREDS.passphrase,
    amount: 10, itemName: 'Order X', orderId: 'order-1',
    returnUrl: 'https://x/r', cancelUrl: 'https://x/c', notifyUrl: 'https://x/n',
    email: 'a@b.com', name: 'Jane Doe',
  })
  const redirectSig = new URL(url).searchParams.get('signature')
  const apiSig = payFastApiHeaders(CREDS, { amount: 1000 }).signature
  assert.notEqual(redirectSig, apiSig)
  delete process.env.PAYFAST_ENV
})

test('the duplicated php urlencode has not drifted from the original', () => {
  // payfast-api.ts carries its own copy so the test runner can import it.
  // If someone fixes one encoder and not the other, signatures start failing
  // in a way that looks like a wrong passphrase. Catch it here instead.
  const cases = [
    'plain', 'with space', "quote'apostrophe", 'brack(et)s', 'tilde~and*star',
    'excl!amation', 'sym+bols&equals=', 'accented-é', 'slash/colon:', '',
    'a b!c(d)e*f~g', 'R325,00', '2026-09-16T10:10:13',
  ]
  for (const c of cases) {
    assert.equal(apiEncode(c), itnEncode(c), `encoders disagree on ${JSON.stringify(c)}`)
  }
})
