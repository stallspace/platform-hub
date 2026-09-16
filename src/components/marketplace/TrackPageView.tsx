'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Records a marketplace page view.
 *
 * Mounted once in the marketplace layout, so it fires on the first load and on
 * every client-side navigation after it.
 *
 * Deliberately sends the PATH only. The query string can contain a shopper's
 * search terms, and an anonymous visit counter should not quietly become a log
 * of what individual people were looking for.
 *
 * The session id is a random value in sessionStorage — no cookie, no IP, gone
 * when the tab closes. That is also why the admin numbers say "visitors"
 * meaning sessions, not identified people.
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = sessionStorage.getItem('ss_session')
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem('ss_session', id)
    }
    return id
  } catch {
    // Private mode or blocked storage — the visit just goes uncounted.
    return ''
  }
}

// Private areas are not part of "how many people are visiting the shop".
const IGNORED = ['/admin', '/vendor', '/account', '/auth', '/api']

export default function TrackPageView() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    if (IGNORED.some(prefix => pathname.startsWith(prefix))) return

    const session_id = getSessionId()
    if (!session_id) return

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'page_view', path: pathname, session_id }),
    }).catch(() => {})
  }, [pathname])

  return null
}
