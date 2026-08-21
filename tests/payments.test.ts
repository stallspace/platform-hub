import { test } from 'node:test'
import assert from 'node:assert/strict'

const { buildPayFastUrl } = await import('../src/lib/payments/payfast.ts')
const { buildOzowUrl } = await import('../src/lib/payments/ozow.ts')

test('PayFast URL includes required fields and formats amount to 2dp', () => {
  const url = buildPayFastUrl({
    merchantId: '10000100', merchantKey: 'key123', passphrase: 'pass',
    amount: 250, itemName: 'Order MRC-1', orderId: 'order-1',
    returnUrl: 'https://x/return', cancelUrl: 'https://x/cancel', notifyUrl: 'https://x/notify',
    email: 'a@b.com', name: 'Jane Doe',
  })
  assert.match(url, /merchant_id=10000100/)
  assert.match(url, /amount=250\.00/)
  assert.match(url, /m_payment_id=order-1/)
  assert.match(url, /name_first=Jane/)
  assert.match(url, /name_last=Doe/)
  // A signature must be present...
  assert.match(url, /signature=[0-9a-f]{32}/)
  // ...and the passphrase must NEVER be sent to the browser.
  assert.ok(!url.includes('passphrase'), 'passphrase must not appear in the redirect URL')
  assert.ok(!url.includes('pass&') && !url.endsWith('pass'), 'raw passphrase leaked')
})

test('PayFast signature changes when the passphrase changes', () => {
  const base = {
    merchantId: '10000100', merchantKey: 'key123',
    amount: 250, itemName: 'Order MRC-1', orderId: 'order-1',
    returnUrl: 'https://x/return', cancelUrl: 'https://x/cancel', notifyUrl: 'https://x/notify',
    email: 'a@b.com', name: 'Jane Doe',
  }
  const sig = (u: string) => new URL(u).searchParams.get('signature')
  const a = sig(buildPayFastUrl({ ...base, passphrase: 'one' }))
  const b = sig(buildPayFastUrl({ ...base, passphrase: 'two' }))
  assert.notEqual(a, b)
  // Deterministic for identical input
  assert.equal(sig(buildPayFastUrl({ ...base, passphrase: 'one' })), a)
})

test('PayFast defaults to the sandbox host unless PAYFAST_ENV=live', () => {
  delete process.env.PAYFAST_ENV
  const sandbox = buildPayFastUrl({
    merchantId: 'm', merchantKey: 'k', passphrase: '', amount: 1, itemName: 'i', orderId: 'o',
    returnUrl: 'r', cancelUrl: 'c', notifyUrl: 'n', email: 'e@e.com', name: 'A',
  })
  assert.match(sandbox, /^https:\/\/sandbox\.payfast\.co\.za/)

  process.env.PAYFAST_ENV = 'live'
  const live = buildPayFastUrl({
    merchantId: 'm', merchantKey: 'k', passphrase: '', amount: 1, itemName: 'i', orderId: 'o',
    returnUrl: 'r', cancelUrl: 'c', notifyUrl: 'n', email: 'e@e.com', name: 'A',
  })
  assert.match(live, /^https:\/\/www\.payfast\.co\.za/)
  delete process.env.PAYFAST_ENV
})

test('Ozow URL includes a 128-char SHA512 HashCheck', () => {
  const url = buildOzowUrl({
    siteCode: 'ZA-TEST-01', privateKey: 'private-key-value',
    amount: 250, transactionReference: 'MRC-ABC',
    successUrl: 'https://x/s', cancelUrl: 'https://x/c', errorUrl: 'https://x/e', notifyUrl: 'https://x/n',
    isTest: true,
  })
  const hash = new URL(url).searchParams.get('HashCheck') ?? ''
  assert.equal(hash.length, 128)
  assert.match(hash, /^[0-9a-f]+$/)
  assert.equal(new URL(url).searchParams.get('Amount'), '250.00')
})

test('Ozow hash is deterministic for identical inputs', () => {
  const args = {
    siteCode: 'ZA-TEST-01', privateKey: 'private-key-value',
    amount: 99.5, transactionReference: 'MRC-XYZ',
    successUrl: 'https://x/s', cancelUrl: 'https://x/c', errorUrl: 'https://x/e', notifyUrl: 'https://x/n',
    isTest: true,
  }
  const h1 = new URL(buildOzowUrl(args)).searchParams.get('HashCheck')
  const h2 = new URL(buildOzowUrl(args)).searchParams.get('HashCheck')
  assert.equal(h1, h2)
})
