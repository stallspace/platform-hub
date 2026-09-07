import { test } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Mirrors the id validation in src/app/api/track/route.ts.
 * /api/track is public and unauthenticated by necessity, so it used to be the
 * easiest endpoint to abuse: any vendor_id was accepted without checking it
 * existed, letting anyone pad a vendor's analytics with invented traffic.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

test('a real UUID passes', () => {
  assert.equal(UUID.test('8f14e45f-ceea-467a-9d4f-1b0f3c2d5a71'), true)
  assert.equal(UUID.test('8F14E45F-CEEA-467A-9D4F-1B0F3C2D5A71'), true)
})

test('junk is rejected', () => {
  for (const bad of [
    '', 'null', 'undefined', '1',
    'not-a-uuid',
    '8f14e45f-ceea-467a-9d4f',                        // truncated
    '8f14e45f-ceea-467a-9d4f-1b0f3c2d5a71-extra',     // trailing
    "8f14e45f-ceea-467a-9d4f-1b0f3c2d5a71' OR '1'='1",
  ]) {
    assert.equal(UUID.test(bad), false, `${bad} should be rejected`)
  }
})

test('session ids are truncated rather than trusted', () => {
  const truncate = (v: unknown) => String(v).slice(0, 64)
  assert.equal(truncate('x'.repeat(5000)).length, 64)
  assert.equal(truncate(12345), '12345')
})
