import { createHash } from 'crypto'

/**
 * PayFast redirect-URL builder. SERVER-SIDE ONLY — takes raw merchant
 * credentials, so it must never be imported into a client component.
 */
export interface PayFastParams {
  merchantId: string
  merchantKey: string
  passphrase: string
  amount: number
  itemName: string
  orderId: string
  returnUrl: string
  cancelUrl: string
  notifyUrl: string
  email: string
  name: string
}

/**
 * PHP's urlencode(), which is what PayFast uses when building signature
 * strings. encodeURIComponent leaves !'()*~ unencoded; PHP encodes them.
 * Mismatching this breaks signature verification.
 */
export function phpUrlencode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/[!'()*~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

export function buildPayFastUrl(p: PayFastParams): string {
  const isSandbox = process.env.PAYFAST_ENV !== 'live'
  const base = isSandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process'

  // Field order matters — PayFast signs the fields in the order they are sent.
  const fields: [string, string][] = [
    ['merchant_id', p.merchantId],
    ['merchant_key', p.merchantKey],
    ['return_url', p.returnUrl],
    ['cancel_url', p.cancelUrl],
    ['notify_url', p.notifyUrl],
    ['name_first', p.name.split(' ')[0] ?? p.name],
    ['name_last', p.name.split(' ').slice(1).join(' ') || '-'],
    ['email_address', p.email],
    ['m_payment_id', p.orderId],
    ['amount', p.amount.toFixed(2)],
    ['item_name', p.itemName],
  ].filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '') as [string, string][]

  // Signature = md5( "k=v&k=v..." [+ "&passphrase=..."] ), values php-urlencoded.
  // The passphrase itself is NEVER sent to PayFast — only the resulting hash.
  const signatureBase =
    fields.map(([k, v]) => `${k}=${phpUrlencode(String(v).trim())}`).join('&') +
    (p.passphrase ? `&passphrase=${phpUrlencode(p.passphrase.trim())}` : '')

  const signature = createHash('md5').update(signatureBase).digest('hex')

  // Diagnostic: shows exactly what was signed, with the passphrase masked.
  // If PayFast reports a signature mismatch, compare this against their expectation.
  console.log('[payfast] signature base:',
    signatureBase.replace(/passphrase=[^&]*/, 'passphrase=***'),
    '| usedPassphrase:', Boolean(p.passphrase),
    '| signature:', signature)

  const data = new URLSearchParams(fields)
  data.set('signature', signature)

  return `${base}?${data.toString()}`
}
