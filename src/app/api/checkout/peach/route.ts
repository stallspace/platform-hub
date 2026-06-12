import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/checkout/peach
 *
 * Initiates a Peach Payments COPYandPAY hosted checkout and returns the checkoutId.
 * Docs: https://developer.peachpayments.com/docs/checkout-overview
 *
 * The client then redirects to:
 *   https://sandbox.peachpayments.com/checkout/initiate?checkoutId=<id>&merchantTransactionId=<order>
 *
 * Body:
 *   { entityId, accessToken, amount, currency, orderId, orderNumber, shopperResultUrl, nonce }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      entityId,
      accessToken,
      amount,
      currency = 'ZAR',
      orderId,
      orderNumber,
      shopperResultUrl,
      nonce,
    } = body

    if (!entityId || !accessToken) return NextResponse.json({ error: 'Missing Peach credentials' }, { status: 400 })
    if (!amount || !orderId) return NextResponse.json({ error: 'Missing amount or orderId' }, { status: 400 })

    const isSandbox = entityId.startsWith('8a8') || process.env.NODE_ENV !== 'production'
    const baseUrl = isSandbox
      ? 'https://eu-test.oppwa.com/v1/checkouts'
      : 'https://eu-prod.oppwa.com/v1/checkouts'

    const params = new URLSearchParams({
      entityId,
      amount: Number(amount).toFixed(2),
      currency,
      paymentType: 'DB',
      merchantTransactionId: orderNumber,
      'customParameters[order_id]': orderId,
      'customParameters[nonce]': nonce ?? '',
    })

    if (shopperResultUrl) params.set('shopperResultUrl', shopperResultUrl)

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await res.json()

    // Peach success result codes: ^(000\.000\.|000\.100\.1|000\.[36])
    const resultCode: string = data?.result?.code ?? ''
    const isSuccess = /^(000\.000\.|000\.100\.1|000\.[36])/.test(resultCode)

    if (!res.ok || !isSuccess) {
      return NextResponse.json(
        { error: data?.result?.description ?? 'Peach Payments API error', detail: data },
        { status: 400 }
      )
    }

    const checkoutId: string = data.id
    const hostedUrl = isSandbox
      ? `https://eu-test.oppwa.com/v1/paymentWidgets.js?checkoutId=${checkoutId}`
      : `https://eu-prod.oppwa.com/v1/paymentWidgets.js?checkoutId=${checkoutId}`

    // Redirect URL the customer visits
    const redirectUrl = isSandbox
      ? `https://sandbox.peachpayments.com/checkout/initiate?checkoutId=${checkoutId}&merchantTransactionId=${encodeURIComponent(orderNumber)}`
      : `https://peachpayments.com/checkout/initiate?checkoutId=${checkoutId}&merchantTransactionId=${encodeURIComponent(orderNumber)}`

    return NextResponse.json({ checkoutId, redirectUrl, widgetUrl: hostedUrl })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Peach checkout failed' },
      { status: 500 }
    )
  }
}
