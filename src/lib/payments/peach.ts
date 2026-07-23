/**
 * Peach Payments (COPYandPAY / OPPWA) helpers. SERVER-SIDE ONLY — handles the
 * access token. Docs: https://developer.peachpayments.com/docs/checkout-overview
 */
const SUCCESS_RE = /^(000\.000\.|000\.100\.1|000\.[36])/
const PENDING_RE = /^(000\.200)/

function baseHost(entityId: string): { api: string; hosted: string; isSandbox: boolean } {
  const isSandbox = entityId.startsWith('8a8') || process.env.PEACH_ENV === 'test' || process.env.NODE_ENV !== 'production'
  return {
    api: isSandbox ? 'https://eu-test.oppwa.com' : 'https://eu-prod.oppwa.com',
    hosted: isSandbox ? 'https://sandbox.peachpayments.com' : 'https://peachpayments.com',
    isSandbox,
  }
}

interface CreatePeachCheckoutArgs {
  entityId: string
  accessToken: string
  amount: number
  currency?: string
  orderId: string
  orderNumber: string
  shopperResultUrl: string
}

export async function createPeachCheckout(args: CreatePeachCheckoutArgs): Promise<{ redirectUrl: string; checkoutId: string }> {
  const { api, hosted } = baseHost(args.entityId)
  const params = new URLSearchParams({
    entityId: args.entityId,
    amount: Number(args.amount).toFixed(2),
    currency: args.currency ?? 'ZAR',
    paymentType: 'DB',
    merchantTransactionId: args.orderNumber,
    'customParameters[order_id]': args.orderId,
  })
  if (args.shopperResultUrl) params.set('shopperResultUrl', args.shopperResultUrl)

  const res = await fetch(`${api}/v1/checkouts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${args.accessToken}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const data = await res.json()
  const resultCode: string = data?.result?.code ?? ''
  if (!res.ok || !SUCCESS_RE.test(resultCode)) {
    throw new Error(data?.result?.description ?? 'Peach Payments API error')
  }
  const checkoutId: string = data.id
  const redirectUrl = `${hosted}/checkout/initiate?checkoutId=${checkoutId}&merchantTransactionId=${encodeURIComponent(args.orderNumber)}`
  return { redirectUrl, checkoutId }
}

/**
 * Server-side verification: query the payment status for a checkout id and
 * report whether the transaction actually succeeded.
 */
export async function verifyPeachPayment(entityId: string, accessToken: string, checkoutId: string): Promise<{ paid: boolean; code: string }> {
  const { api } = baseHost(entityId)
  const res = await fetch(`${api}/v1/checkouts/${checkoutId}/payment?entityId=${entityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  const code: string = data?.result?.code ?? ''
  return { paid: SUCCESS_RE.test(code), code }
}

export { SUCCESS_RE as PEACH_SUCCESS_RE, PENDING_RE as PEACH_PENDING_RE }
