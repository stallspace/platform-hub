import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env.PAYMENT_ENCRYPTION_KEY = 'test-key-that-is-definitely-long-enough-1234567890'

const {
  encryptJson, decryptJson, isEncryptedEnvelope,
  toEncryptedEnvelope, readConfigData, maskSecret,
} = await import('../src/lib/crypto/secrets.ts')

test('encrypt/decrypt round-trips an object', () => {
  const original = { secret_key: 'sk_live_abc123', merchant_id: '10000100' }
  const cipher = encryptJson(original)
  assert.notEqual(cipher, JSON.stringify(original))
  assert.deepEqual(decryptJson(cipher), original)
})

test('ciphertext is non-deterministic (salted)', () => {
  const a = encryptJson({ x: '1' })
  const b = encryptJson({ x: '1' })
  assert.notEqual(a, b)
})

test('envelope helpers detect encrypted vs plaintext config', () => {
  const env = toEncryptedEnvelope({ secret_key: 'sk_test' })
  assert.equal(isEncryptedEnvelope(env), true)
  assert.equal(isEncryptedEnvelope({ secret_key: 'plain' }), false)
})

test('readConfigData transparently reads new envelope and legacy plaintext', () => {
  const env = toEncryptedEnvelope({ secret_key: 'sk_secret', merchant_id: '999' })
  assert.deepEqual(readConfigData(env), { secret_key: 'sk_secret', merchant_id: '999' })
  // Legacy plaintext row is returned unchanged
  assert.deepEqual(readConfigData({ merchant_id: '123' }), { merchant_id: '123' })
  assert.deepEqual(readConfigData(null), {})
})

test('maskSecret only reveals the last 4 chars', () => {
  assert.equal(maskSecret('sk_live_supersecret9999'), '••••••9999')
  assert.equal(maskSecret('abc'), '••••')
  assert.equal(maskSecret(''), '')
})

test('decrypt throws on corrupt ciphertext', () => {
  assert.throws(() => decryptJson('not-valid-ciphertext'))
})
