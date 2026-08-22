/* Stallspace service worker
 *
 * Deliberately conservative. A marketplace must never show stale prices,
 * stock levels or order statuses, so:
 *   - HTML pages and API calls are ALWAYS network-first (never served stale
 *     unless the device is genuinely offline)
 *   - Only immutable build assets and images are cached aggressively
 *   - Anything under /api, /admin, /vendor or /account is never cached
 */

const VERSION = 'v1'
const STATIC_CACHE = `stallspace-static-${VERSION}`
const IMAGE_CACHE = `stallspace-images-${VERSION}`
const OFFLINE_URL = '/offline.html'

const PRECACHE = [OFFLINE_URL, '/icon-192.png', '/logo.png']

// Never cache anything under these paths — always live.
const NEVER_CACHE = ['/api/', '/admin', '/vendor', '/account', '/auth']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('stallspace-') && !k.endsWith(VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) return

  // Sensitive / always-live paths: straight to the network, no caching.
  if (NEVER_CACHE.some((p) => url.pathname.startsWith(p))) return

  // Immutable Next.js build assets — cache-first (safe: hashed filenames).
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy))
            return res
          })
      )
    )
    return
  }

  // Images — stale-while-revalidate for snappy browsing.
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone())
            return res
          })
          .catch(() => cached)
        return cached || network
      })
    )
    return
  }

  // Pages — network-first, fall back to the offline page when truly offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request)
        return cached || caches.match(OFFLINE_URL)
      })
    )
  }
})
