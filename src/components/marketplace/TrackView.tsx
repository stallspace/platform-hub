'use client'

import { useEffect } from 'react'

interface Props {
  type: 'store_view' | 'product_view'
  vendorId: string
  productId?: string
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('ss_session')
  if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('ss_session', id) }
  return id
}

export default function TrackView({ type, vendorId, productId }: Props) {
  useEffect(() => {
    const session_id = getSessionId()
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, vendor_id: vendorId, product_id: productId ?? null, session_id }),
    }).catch(() => {})
  }, [type, vendorId, productId])

  return null
}
