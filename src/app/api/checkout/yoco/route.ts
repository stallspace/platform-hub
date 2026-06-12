import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/checkout/yoco
 *
 * Creates a Yoco hosted-payment-page charge and returns the redirect URL.
 * Yoco docs: https://developer.yoco.com/online/payment-methods/hosted-payment-page
 *
 * Body:
 *   { secretKey, amount, currency, orderId, orderNumber, cancelUrl, successUrl, failureUrl, metadata }
 *
 * Yoco amount is in CENTS (integer).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      secretKey,
      amount,       // rands — we convert to cents
      currency = 'ZAR',
      orderId,
      orderNumber,
      successUrl,
      cancelUrl,
      failureUrl,
      metadata = {},
    } = body

    if (!secretKey) return NextResponse.json({ error: 'Missing Yoco secret key' }, { status: 400 })
    if (!amount || !orderId) return NextResponse.json({ error: 'Missing amount or orderId' }, { status: 400 })

    const amountCents = Math.round(Number(amount) * 100)

    const res = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        amount: amountCents,
        currency,
        successUrl,
        cancelUrl,
        failureUrl: failureUrl ?? cancelUrl,
        metadata: {
          order_id: orderId,
          order_number: orderNumber,
          ...metadata,
        },
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.errorMessage ?? data?.message ?? 'Yoco API error', detail: data },
        { status: res.status }
      )
    }

    // data.redirectUrl  — send customer here
    return NextResponse.json({ redirectUrl: data.redirectUrl, checkoutId: data.id })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Yoco checkout failed' },
      { status: 500 }
    )
  }
}
