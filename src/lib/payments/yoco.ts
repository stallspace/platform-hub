/**
 * Yoco hosted-checkout helpers. SERVER-SIDE ONLY — handles the secret key.
 * Docs: https://developer.yoco.com/online/payment-methods/hosted-payment-page
 * Amounts are sent to Yoco in CENTS (integer).
 */
interface CreateYocoCheckoutArgs {
  secretKey: string
  amount: number // rands
  currency?: string
  orderId: string
  orderNumber: string
  successUrl: string
  cancelUrl: string
  failureUrl?: string
  metadata?: Record<string, string>
}

export async function createYocoCheckout(args: CreateYocoCheckoutArgs): Promise<{ redirectUrl: string; checkoutId: string }> {
  const amountCents = Math.round(Number(args.amount) * 100)
  const res = await fetch('https://payments.yoco.com/api/checkouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.secretKey}`,
    },
    body: JSON.stringify({
      amount: amountCents,
      currency: args.currency ?? 'ZAR',
      successUrl: args.successUrl,
      cancelUrl: args.cancelUrl,
      failureUrl: args.failureUrl ?? args.cancelUrl,
      metadata: { order_id: args.orderId, order_number: args.orderNumber, ...(args.metadata ?? {}) },
    }),
  })
  const data = await res.json()
  if (!res.ok || !data?.redirectUrl) {
    throw new Error(data?.errorMessage ?? data?.message ?? 'Yoco API error')
  }
  return { redirectUrl: data.redirectUrl, checkoutId: data.id }
}

/**
 * Server-side verification: fetch the checkout by id and report whether it was
 * actually paid. Never trust the browser redirect alone.
 */
export async function verifyYocoCheckout(secretKey: string, checkoutId: string): Promise<{ paid: boolean; status: string }> {
  const res = await fetch(`https://payments.yoco.com/api/checkouts/${checkoutId}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message ?? 'Yoco verification failed')
  // Yoco returns status like "created" | "started" | "processing" | "completed" | "expired"
  const status: string = data?.status ?? 'unknown'
  const paid = status === 'completed' || data?.paymentId != null
  return { paid, status }
}
