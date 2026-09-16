import { createHash } from 'crypto'

/**
 * PayFast REST API client (refunds, and anything else under api.payfast.co.za).
 *
 * IMPORTANT — this signature is NOT the same construction as the ITN/redirect
 * signature in ./payfast.ts, and mixing them up produces a signature mismatch
 * that looks identical to a wrong passphrase:
 *
 *   redirect + ITN : fields in a FIXED ORDER, passphrase appended LAST
 *   REST API       : fields SORTED ALPHABETICALLY, passphrase is just another
 *                    field in that sort, and the auth headers are signed too
 *
 * Values are php-urlencoded in both, so `phpUrlencode` is shared.
 *
 * SERVER-SIDE ONLY — takes raw merchant credentials.
 */

const API_BASE = 'https://api.payfast.co.za'

/**
 * PHP's urlencode(), same as the one in ./payfast.ts.
 *
 * Deliberately duplicated rather than imported: this module is exercised
 * directly by the test runner, which cannot resolve extensionless relative
 * imports under --experimental-strip-types. The duplication is guarded by a
 * test that asserts the two implementations agree on a spread of inputs, so
 * they cannot drift apart silently.
 */
export function phpUrlencode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/[!'()*~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

export interface PayFastApiCredentials {
  merchantId: string
  passphrase: string
}

/**
 * Build the signed headers for a PayFast API request.
 *
 * `body` must be the exact object sent as JSON — every field in it is signed.
 */
export function payFastApiHeaders(
  creds: PayFastApiCredentials,
  body: Record<string, string | number> = {}
): Record<string, string> {
  // Seconds precision, no milliseconds — PayFast rejects the ISO default.
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '')

  const toSign: Record<string, string | number> = {
    ...body,
    'merchant-id': creds.merchantId,
    version: 'v1',
    timestamp,
  }
  // The passphrase participates in the alphabetical sort rather than being
  // appended at the end. It is never transmitted — only the resulting hash is.
  if (creds.passphrase) toSign.passphrase = creds.passphrase

  const signatureBase = Object.keys(toSign)
    .sort()
    .filter((k) => k !== 'signature')
    .map((k) => `${k}=${phpUrlencode(String(toSign[k]).trim())}`)
    .join('&')

  const signature = createHash('md5').update(signatureBase).digest('hex')

  // Field NAMES only. Never log the base string — it contains the passphrase.
  console.log('[payfast-api] signed fields:', Object.keys(toSign).sort().join(','))

  return {
    'merchant-id': creds.merchantId,
    version: 'v1',
    timestamp,
    signature,
    'Content-Type': 'application/json',
  }
}

export interface RefundResult {
  ok: boolean
  /** PayFast's own reference for the refund, when it gives one. */
  reference: string | null
  /** Verbatim response, for the vendor and for diagnosing a rejection. */
  message: string
  raw: unknown
}

/**
 * Refund a payment on the VENDOR's own PayFast account.
 *
 * Money moves from the vendor's PayFast balance back to the customer.
 * Stallspace is not a party to it — we hold the vendor's credentials and make
 * the call on their behalf, exactly as we do when creating a payment.
 *
 * `pfPaymentId` is PayFast's id for the original payment, stored on the order
 * as `payment_reference` when the ITN confirmed it.
 *
 * NOTE: PayFast charges the vendor R2.00 excluding VAT per refund, whatever
 * the amount. Partial refunds are supported.
 */
export async function createPayFastRefund(args: {
  creds: PayFastApiCredentials
  pfPaymentId: string
  /** Rands. Converted to cents for the API. */
  amount: number
  reason?: string
  sandbox?: boolean
}): Promise<RefundResult> {
  const amountCents = Math.round(Number(args.amount) * 100)
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { ok: false, reference: null, message: 'Refund amount must be greater than zero.', raw: null }
  }

  const body: Record<string, string | number> = { amount: amountCents }
  // Keep ASCII-only — non-ASCII in signed fields is a known source of
  // signature mismatches on PayFast.
  if (args.reason) body.reason = args.reason.replace(/[^\x20-\x7E]/g, '').slice(0, 100)

  const url = `${API_BASE}/refunds/${encodeURIComponent(args.pfPaymentId)}${args.sandbox ? '?testing=true' : ''}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: payFastApiHeaders(args.creds, body),
      body: JSON.stringify(body),
    })

    const text = await res.text()
    let parsed: unknown = text
    try {
      parsed = JSON.parse(text)
    } catch {
      // PayFast returns plain text on some errors — keep it as-is.
    }

    if (!res.ok) {
      // Surface PayFast's own words. On the first live refund this is the only
      // thing that will tell us whether the request shape is right.
      const message =
        (parsed as { data?: { response?: string }; message?: string })?.message ??
        (typeof parsed === 'string' ? parsed : JSON.stringify(parsed))
      console.error('[payfast-api] refund rejected', res.status, message)
      return { ok: false, reference: null, message: `PayFast declined the refund: ${message}`, raw: parsed }
    }

    const reference =
      (parsed as { data?: { response?: string | { id?: string } } })?.data &&
      typeof (parsed as { data: { response?: unknown } }).data.response === 'object'
        ? ((parsed as { data: { response: { id?: string } } }).data.response.id ?? null)
        : null

    return { ok: true, reference, message: 'Refund submitted to PayFast.', raw: parsed }
  } catch (err) {
    console.error('[payfast-api] refund request failed', err)
    return {
      ok: false,
      reference: null,
      message: err instanceof Error ? err.message : 'Could not reach PayFast.',
      raw: null,
    }
  }
}
