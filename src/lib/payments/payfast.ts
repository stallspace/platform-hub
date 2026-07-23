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

export function buildPayFastUrl(p: PayFastParams): string {
  const isSandbox = process.env.PAYFAST_ENV !== 'live'
  const base = isSandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process'

  const data = new URLSearchParams({
    merchant_id: p.merchantId,
    merchant_key: p.merchantKey,
    return_url: p.returnUrl,
    cancel_url: p.cancelUrl,
    notify_url: p.notifyUrl,
    name_first: p.name.split(' ')[0] ?? p.name,
    name_last: p.name.split(' ').slice(1).join(' ') || '-',
    email_address: p.email,
    m_payment_id: p.orderId,
    amount: p.amount.toFixed(2),
    item_name: p.itemName,
  })
  if (p.passphrase) data.set('passphrase', p.passphrase)
  return `${base}?${data.toString()}`
}
