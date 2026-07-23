import { test } from 'node:test'
import assert from 'node:assert/strict'

const { escapeHtml } = await import('../src/lib/utils/index.ts')
const { rateLimit } = await import('../src/lib/utils/rate-limit.ts')

test('escapeHtml neutralises HTML/script injection', () => {
  assert.equal(
    escapeHtml('<script>alert("x")</script>'),
    '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
  )
  assert.equal(escapeHtml("O'Brien & Co <b>"), 'O&#39;Brien &amp; Co &lt;b&gt;')
  assert.equal(escapeHtml(null), '')
  assert.equal(escapeHtml(undefined), '')
})

test('rateLimit allows up to the limit then blocks within the window', () => {
  const key = 'test:' + Math.random()
  assert.equal(rateLimit(key, 3, 10_000).allowed, true)
  assert.equal(rateLimit(key, 3, 10_000).allowed, true)
  assert.equal(rateLimit(key, 3, 10_000).allowed, true)
  assert.equal(rateLimit(key, 3, 10_000).allowed, false)
})

test('rateLimit resets after the window elapses', async () => {
  const key = 'test-window:' + Math.random()
  assert.equal(rateLimit(key, 1, 20).allowed, true)
  assert.equal(rateLimit(key, 1, 20).allowed, false)
  await new Promise(r => setTimeout(r, 30))
  assert.equal(rateLimit(key, 1, 20).allowed, true)
})
