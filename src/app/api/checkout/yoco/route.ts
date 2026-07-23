import { NextResponse } from 'next/server'

/**
 * DEPRECATED. This route used to accept the vendor's Yoco secret key from the
 * browser, which exposed credentials to customers. Checkout is now initiated by
 * POST /api/checkout/initiate, which loads and decrypts credentials server-side.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/checkout/initiate.' },
    { status: 410 }
  )
}
