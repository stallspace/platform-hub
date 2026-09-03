import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Checkout tokens — proof that the caller created this order.
 *
 * /api/checkout/initiate and /api/checkout/verify act on an order id alone.
 * Guests have no session, so we cannot require auth there; but without ANY
 * check, anyone holding an order UUID could pull the vendor's PayFast
 * merchant credentials out of the redirect URL, or trigger a confirmation
 * email at will. The order id travels in URLs (return_url, browser history,
 * referrers) so it is not a secret.
 *
 * A token is an HMAC of the order id. It is handed to the client once, in
 * the response to POST /api/orders, and never appears in a URL.
 *
 * SERVER-SIDE ONLY — reads the signing key.
 */
function signingKey(): string {
  const key = process.env.PAYMENT_ENCRYPTION_KEY
  if (!key) throw new Error('PAYMENT_ENCRYPTION_KEY is not set')
  return key
}

export function createCheckoutToken(orderId: string): string {
  return createHmac('sha256', signingKey()).update(`checkout:${orderId}`).digest('hex')
}

/** Constant-time comparison — never `===` on a MAC. */
export function verifyCheckoutToken(orderId: string, token: unknown): boolean {
  if (typeof token !== 'string' || token.length === 0) return false
  const expected = Buffer.from(createCheckoutToken(orderId), 'utf8')
  const received = Buffer.from(token, 'utf8')
  if (expected.length !== received.length) return false
  return timingSafeEqual(expected, received)
}
