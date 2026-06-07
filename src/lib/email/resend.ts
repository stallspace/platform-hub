import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@marcrte.co.za'
export const FROM_NAME  = process.env.RESEND_FROM_NAME  ?? 'MARCRTE'
export const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://marcrte.co.za'

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  try {
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
