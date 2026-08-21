import { Resend } from 'resend'

/**
 * Lazily create the Resend client.
 *
 * Creating it at module scope crashes the production build when
 * RESEND_API_KEY isn't present (Next evaluates route modules while
 * collecting page data). Building it on first use keeps the build safe
 * and turns a missing key into a graceful runtime no-op.
 */
let _resend: Resend | null = null
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!_resend) _resend = new Resend(key)
  return _resend
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@Stallspace.co.za'
export const FROM_NAME  = process.env.RESEND_FROM_NAME  ?? 'Stallspace'
export const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://Stallspace.co.za'

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  try {
    const resend = getResend()
    if (!resend) {
      console.warn('[email] RESEND_API_KEY is not set — skipping send to', to)
      return { ok: false, error: 'Email is not configured' }
    }
    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Unknown error' }
  }
}
