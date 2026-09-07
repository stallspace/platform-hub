import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { escapeHtml } from '@/lib/utils'
import { limitRequest, tooManyRequests } from '@/lib/utils/rate-limit-db'
import { Resend } from 'resend'

// Created lazily — a module-scope client crashes the build when the key is absent.
let _resend: Resend | null = null
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!_resend) _resend = new Resend(key)
  return _resend
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // The recipient is NOT taken from the request. It used to be, which made any
  // approved vendor an authenticated relay: they owned one enquiry but could
  // address the mail to anyone, with attacker-chosen body text, sent from our
  // domain. The address comes from the enquiry row below.
  const { enquiryId, replyText } = await req.json()

  if (!enquiryId || !replyText?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (String(replyText).length > 5000) {
    return NextResponse.json({ error: 'Reply is too long' }, { status: 400 })
  }

  if (!(await limitRequest(req.headers, { bucket: 'enquiry-reply', limit: 30, windowSeconds: 3600, subject: user.id }))) {
    return tooManyRequests()
  }

  const vReply = escapeHtml(replyText)

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, business_name, email')
    .eq('user_id', user.id)
    .single()

  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

  const bizName = escapeHtml(vendor.business_name)

  const { data: enquiry } = await supabase
    .from('enquiries')
    .select('id, vendor_id, customer_email, customer_name')
    .eq('id', enquiryId)
    .eq('vendor_id', vendor.id)
    .single()

  if (!enquiry) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })

  const toEmail = enquiry.customer_email
  const vName = escapeHtml(enquiry.customer_name ?? 'there')

  try {
    const resend = getResend()
    if (!resend) return NextResponse.json({ error: 'Email is not configured' }, { status: 503 })
    await resend.emails.send({
      // Strip anything that could break out of the From header. A business
      // name is vendor-controlled, and CR/LF there is header injection.
      from: `${vendor.business_name.replace(/[\r\n<>"]/g, '').trim().slice(0, 60) || 'A vendor'} via Stallspace <noreply@stallspace.co.za>`,
      to: toEmail,
      reply_to: vendor.email,
      subject: `Re: Your enquiry to ${vendor.business_name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0D3B2E; padding: 20px 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 18px;">Stallspace</h2>
          </div>
          <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; margin-top: 0;">Hi ${vName},</p>
            <p style="color: #374151;">${bizName} has replied to your enquiry:</p>
            <div style="background: #f9fafb; border-left: 3px solid #2ECC8E; padding: 16px; border-radius: 4px; margin: 16px 0;">
              <p style="color: #374151; margin: 0; white-space: pre-wrap;">${vReply}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">You can reply directly to this email to continue the conversation.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">This message was sent via Stallspace marketplace</p>
          </div>
        </div>
      `,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Resend error:', err)
    return NextResponse.json({ error: 'Email failed' }, { status: 500 })
  }
}
