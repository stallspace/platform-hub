import { createHmac } from 'crypto'

/**
 * Build a valid Ozow payment URL including the mandatory SHA512 HashCheck.
 * Ozow docs: https://ozow.com/integrations/
 *
 * All field values must be lowercased before hashing (Ozow requirement).
 */
export interface OzowParams {
  siteCode: string
  privateKey: string
  amount: number          // rands, e.g. 250.00
  transactionReference: string
  bankReference?: string
  optional1?: string
  optional2?: string
  optional3?: string
  optional4?: string
  optional5?: string
  currencyCode?: string
  isTest?: boolean
  successUrl: string
  cancelUrl: string
  errorUrl: string
  notifyUrl: string
}

export function buildOzowUrl(p: OzowParams): string {
  const isTest = p.isTest ?? process.env.NODE_ENV !== 'production'
  const currencyCode = p.currencyCode ?? 'ZAR'
  const amount = p.amount.toFixed(2)

  // Fields in the exact order Ozow specifies for hashing
  const hashInput = [
    p.siteCode,
    'ZA',
    currencyCode,
    amount,
    p.bankReference ?? p.transactionReference,
    p.optional1 ?? '',
    p.optional2 ?? '',
    p.optional3 ?? '',
    p.optional4 ?? '',
    p.optional5 ?? '',
    p.cancelUrl,
    p.errorUrl,
    p.successUrl,
    p.notifyUrl,
    isTest ? 'true' : 'false',
    p.privateKey,
  ].join('')

  const hash = createHmac('sha512', p.privateKey)
    .update(hashInput.toLowerCase())
    .digest('hex')
    .toLowerCase()

  const params = new URLSearchParams({
    SiteCode: p.siteCode,
    CountryCode: 'ZA',
    CurrencyCode: currencyCode,
    Amount: amount,
    TransactionReference: p.transactionReference,
    BankReference: p.bankReference ?? p.transactionReference,
    ...(p.optional1 ? { Optional1: p.optional1 } : {}),
    ...(p.optional2 ? { Optional2: p.optional2 } : {}),
    ...(p.optional3 ? { Optional3: p.optional3 } : {}),
    ...(p.optional4 ? { Optional4: p.optional4 } : {}),
    ...(p.optional5 ? { Optional5: p.optional5 } : {}),
    CancelUrl: p.cancelUrl,
    ErrorUrl: p.errorUrl,
    SuccessUrl: p.successUrl,
    NotifyUrl: p.notifyUrl,
    IsTest: isTest ? 'true' : 'false',
    HashCheck: hash,
  })

  return `https://pay.ozow.com/?${params.toString()}`
}
