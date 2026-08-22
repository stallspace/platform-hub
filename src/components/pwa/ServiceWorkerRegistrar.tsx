'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker (production only) and keeps it fresh.
 *
 * When a new version is deployed we activate it immediately and reload once,
 * so users never sit on a stale build — important for a site where prices and
 * checkout behaviour change.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    let reloading = false

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Check for updates when the tab regains focus.
        const onFocus = () => reg.update().catch(() => {})
        window.addEventListener('focus', onFocus)

        reg.addEventListener('updatefound', () => {
          const next = reg.installing
          if (!next) return
          next.addEventListener('statechange', () => {
            if (next.state === 'installed' && navigator.serviceWorker.controller) {
              // A newer version is ready — take over straight away.
              next.postMessage('SKIP_WAITING')
            }
          })
        })
      })
      .catch(() => {
        /* Service worker is a progressive enhancement — ignore failures. */
      })

    const onControllerChange = () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return null
}
