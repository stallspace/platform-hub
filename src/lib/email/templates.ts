import { APP_URL } from './resend'
import { escapeHtml as esc } from '@/lib/utils'

// ─── Shared layout ──────────────────────────────────────────────────────────

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Stallspace</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#0D3B2E;border-radius:12px 12px 0 0;padding:28px 36px;text-align:center;">
            <span style="display:inline-block;background:#2ECC8E;border-radius:6px;padding:6px 10px;margin-bottom:12px;">
              <span style="color:#fff;font-weight:900;font-size:16px;letter-spacing:-0.5px;">M</span>
            </span>
            <div style="color:#fff;font-weight:900;font-size:22px;letter-spacing:-0.5px;">Stallspace</div>
            <div style="color:rgba(255,255,255,0.4);font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">Marketplace Platform</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px;border-left:1px solid #e8ecf0;border-right:1px solid #e8ecf0;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f9fc;border:1px solid #e8ecf0;border-top:none;border-radius:0 0 12px 12px;padding:20px 36px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              © ${new Date().getFullYear()} Stallspace · South African Marketplace
            </p>
            <p style="margin:6px 0 0;color:#9ca3af;font-size:11px;">
              <a href="${APP_URL}" style="color:#2ECC8E;text-decoration:none;">Stallspace.co.za</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 8px;color:#0D3B2E;font-size:22px;font-weight:800;line-height:1.2;">${text}</h1>`
}

function para(text: string): string {
  return `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">${text}</p>`
}

function badge(text: string, color: string): string {
  const colors: Record<string, string> = {
    green:  'background:#dcfce7;color:#166534;border:1px solid #bbf7d0;',
    red:    'background:#fee2e2;color:#991b1b;border:1px solid #fecaca;',
    blue:   'background:#dbeafe;color:#1e40af;border:1px solid #bfdbfe;',
    amber:  'background:#fef3c7;color:#92400e;border:1px solid #fde68a;',
    gray:   'background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;',
  }
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;${colors[color] ?? colors.gray}">${text}</span>`
}

function ctaButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:28px 0 8px;">
    <a href="${url}" style="display:inline-block;background:#0D3B2E;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;letter-spacing:0.2px;">${text}</a>
  </div>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e8ecf0;margin:24px 0;" />`
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 12px;background:#f8f9fc;border-bottom:1px solid #e8ecf0;color:#6b7280;font-size:13px;font-weight:600;width:40%;">${label}</td>
    <td style="padding:8px 12px;background:#f8f9fc;border-bottom:1px solid #e8ecf0;color:#111827;font-size:13px;">${value}</td>
  </tr>`
}

function infoTable(rows: [string, string][]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e8ecf0;margin:16px 0;">
    <tbody>${rows.map(([l, v]) => infoRow(l, v)).join('')}</tbody>
  </table>`
}

// ─── Templates ──────────────────────────────────────────────────────────────

export function vendorApprovedEmail(data: {
  ownerName: string
  businessName: string
  plan: string
  dashboardUrl: string
}): { subject: string; html: string } {
  const subject = `🎉 Welcome to Stallspace — ${data.businessName} is approved!`
  const html = layout(`
    ${heading('Your application has been approved!')}
    ${para(`Hi ${esc(data.ownerName)}, great news — <strong>${esc(data.businessName)}</strong> has been approved on the Stallspace marketplace. Your storefront is now live and you can start listing products immediately.`)}
    ${infoTable([
      ['Business', esc(data.businessName)],
      ['Plan', data.plan.charAt(0).toUpperCase() + data.plan.slice(1)],
      ['Status', '✅ Approved & Active'],
    ])}
    ${para('Head to your dashboard to complete your storefront setup, add products, and configure your payment gateway.')}
    ${ctaButton('Go to Dashboard', data.dashboardUrl)}
    ${divider()}
    ${para('<span style="color:#6b7280;font-size:13px;">If you have any questions, reply to this email and our team will assist you.</span>')}
  `)
  return { subject, html }
}

export function vendorRejectedEmail(data: {
  ownerName: string
  businessName: string
  reason?: string
}): { subject: string; html: string } {
  const subject = `Stallspace — Application Update for ${data.businessName}`
  const html = layout(`
    ${heading('Application not approved')}
    ${para(`Hi ${esc(data.ownerName)}, thank you for applying to join the Stallspace marketplace.`)}
    ${para(`After reviewing your application for <strong>${esc(data.businessName)}</strong>, we were unable to approve it at this time.`)}
    ${data.reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Reason:</strong> ${esc(data.reason)}</p>
    </div>` : ''}
    ${para('If you believe this was made in error or would like to reapply with additional documentation, please contact our support team.')}
    ${ctaButton('Contact Support', `${APP_URL}/contact`)}
  `)
  return { subject, html }
}

export function vendorSuspendedEmail(data: {
  ownerName: string
  businessName: string
  reason?: string
}): { subject: string; html: string } {
  const subject = `Stallspace — ${data.businessName} account suspended`
  const html = layout(`
    ${heading('Your account has been suspended')}
    ${para(`Hi ${esc(data.ownerName)}, your Stallspace vendor account for <strong>${esc(data.businessName)}</strong> has been temporarily suspended.`)}
    ${data.reason ? `<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#92400e;font-size:14px;"><strong>Reason:</strong> ${esc(data.reason)}</p>
    </div>` : ''}
    ${para('During suspension, your storefront and products are hidden from the marketplace. Please contact support to resolve this.')}
    ${ctaButton('Contact Support', `${APP_URL}/contact`)}
  `)
  return { subject, html }
}

export function vendorReactivatedEmail(data: {
  ownerName: string
  businessName: string
  dashboardUrl: string
}): { subject: string; html: string } {
  const subject = `Stallspace — ${data.businessName} is back online!`
  const html = layout(`
    ${heading('Your account has been reactivated')}
    ${para(`Hi ${esc(data.ownerName)}, great news — your Stallspace vendor account for <strong>${esc(data.businessName)}</strong> has been reactivated.`)}
    ${para('Your storefront and products are now visible on the marketplace again.')}
    ${ctaButton('Go to Dashboard', data.dashboardUrl)}
  `)
  return { subject, html }
}

export function newEnquiryEmail(data: {
  vendorName: string
  businessName: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  message: string
  productName: string | null
  enquiriesUrl: string
}): { subject: string; html: string } {
  const subject = `New enquiry from ${data.customerName}${data.productName ? ` about ${data.productName}` : ''}`
  const html = layout(`
    ${heading('You have a new customer enquiry')}
    ${para(`Hi ${esc(data.vendorName)}, a customer has sent an enquiry${data.productName ? ` about <strong>${esc(data.productName)}</strong>` : ''} on your Stallspace storefront.`)}
    ${infoTable([
      ['From', esc(data.customerName)],
      ['Email', esc(data.customerEmail)],
      ...(data.customerPhone ? [['Phone', esc(data.customerPhone)] as [string, string]] : []),
      ...(data.productName ? [['Product', esc(data.productName)] as [string, string]] : []),
    ])}
    <div style="background:#f8f9fc;border:1px solid #e8ecf0;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 6px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Message</p>
      <p style="margin:0;color:#111827;font-size:14px;line-height:1.6;">${esc(data.message)}</p>
    </div>
    ${ctaButton('View Enquiry', data.enquiriesUrl)}
  `)
  return { subject, html }
}

export function subscriptionPaymentFailedEmail(data: {
  ownerName: string
  businessName: string
  plan: string
  amount: string
  retryUrl: string
}): { subject: string; html: string } {
  const subject = `Action required — Payment failed for ${data.businessName}`
  const html = layout(`
    ${heading('Payment failed')}
    ${para(`Hi ${esc(data.ownerName)}, we were unable to process your subscription payment for <strong>${esc(data.businessName)}</strong>.`)}
    ${infoTable([
      ['Plan', data.plan.charAt(0).toUpperCase() + data.plan.slice(1)],
      ['Amount Due', data.amount],
      ['Status', '⚠️ Payment Failed'],
    ])}
    ${para('Please update your payment details to avoid suspension of your Stallspace storefront. Your account will be suspended if payment is not resolved within 7 days.')}
    ${ctaButton('Update Payment', data.retryUrl)}
  `)
  return { subject, html }
}

export function subscriptionReminderEmail(data: {
  ownerName: string
  businessName: string
  plan: string
  amount: string
  dueDate: string
  payInstructions?: string
}): { subject: string; html: string } {
  const subject = `Payment reminder — Stallspace subscription for ${data.businessName}`
  const html = layout(`
    ${heading('Subscription payment reminder')}
    ${para(`Hi ${esc(data.ownerName)}, this is a friendly reminder that your Stallspace subscription for <strong>${esc(data.businessName)}</strong> is due.`)}
    ${infoTable([
      ['Plan', data.plan.charAt(0).toUpperCase() + data.plan.slice(1)],
      ['Amount Due', data.amount],
      ['Due Date', esc(data.dueDate)],
    ])}
    ${para(data.payInstructions ? esc(data.payInstructions) : 'Please make your payment to keep your storefront active. If you have already paid, you can ignore this message.')}
    ${para('<span style="color:#6b7280;font-size:13px;">Questions about your subscription? Just reply to this email.</span>')}
  `)
  return { subject, html }
}

export function subscriptionCancelledEmail(data: {
  ownerName: string
  businessName: string
  endDate: string
}): { subject: string; html: string } {
  const subject = `Stallspace — Subscription cancelled for ${data.businessName}`
  const html = layout(`
    ${heading('Subscription cancelled')}
    ${para(`Hi ${esc(data.ownerName)}, your Stallspace subscription for <strong>${esc(data.businessName)}</strong> has been cancelled.`)}
    ${infoTable([
      ['Business', esc(data.businessName)],
      ['Access Until', esc(data.endDate)],
      ['Status', 'Cancelled'],
    ])}
    ${para('Your storefront will remain active until the end of your current billing period. After that, your store and products will be hidden from the marketplace.')}
    ${para("We'd love to have you back. Resubscribe anytime from your dashboard.")}
    ${ctaButton('Resubscribe', `${APP_URL}/vendor/subscription`)}
  `)
  return { subject, html }
}

export function orderConfirmationEmail(data: {
  customerName: string
  orderNumber: string
  businessName: string
  total: string
  items: Array<{ product_name: string; quantity: number; unit_price: number; total_price: number }>
  ordersUrl: string
}): { subject: string; html: string } {
  const subject = `Order confirmed — ${data.orderNumber}`
  const itemRows = data.items
    .map(
      i => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ecf0;color:#111827;font-size:13px;">${esc(i.product_name)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ecf0;color:#6b7280;font-size:13px;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ecf0;color:#111827;font-size:13px;text-align:right;">R${Number(i.total_price).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
      </tr>`
    )
    .join('')
  const html = layout(`
    ${heading('Order confirmed! 🎉')}
    ${para(`Hi ${esc(data.customerName)}, your order from <strong>${esc(data.businessName)}</strong> has been received and is being processed.`)}
    ${infoTable([
      ['Order Number', esc(data.orderNumber)],
      ['Vendor', esc(data.businessName)],
      ['Total', data.total],
      ['Status', '✅ Confirmed'],
    ])}
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #e8ecf0;margin:16px 0;">
      <thead>
        <tr style="background:#f8f9fc;">
          <th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Product</th>
          <th style="padding:8px 12px;text-align:center;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Qty</th>
          <th style="padding:8px 12px;text-align:right;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    ${para('The vendor will update you when your order is dispatched or ready for collection.')}
    ${ctaButton('View Order', data.ordersUrl)}
  `)
  return { subject, html }
}

export function orderStatusUpdateEmail(data: {
  customerName: string
  orderNumber: string
  businessName: string
  newStatus: string
  statusMessage?: string
  ordersUrl: string
}): { subject: string; html: string } {
  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    dispatched: 'Dispatched',
    delivered: 'Delivered',
    completed: 'Completed',
    ready_for_collection: 'Ready for Collection',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  }
  const statusColors: Record<string, string> = {
    confirmed: 'green',
    processing: 'blue',
    shipped: 'blue',
    dispatched: 'blue',
    delivered: 'green',
    completed: 'green',
    ready_for_collection: 'green',
    cancelled: 'red',
    refunded: 'red',
    pending: 'amber',
  }
  const label = statusLabels[data.newStatus] ?? data.newStatus
  const color = statusColors[data.newStatus] ?? 'gray'
  const subject = `Order ${data.orderNumber} — ${label}`
  const html = layout(`
    ${heading(`Order update: ${label}`)}
    ${para(`Hi ${esc(data.customerName)}, there's an update on your order from <strong>${esc(data.businessName)}</strong>.`)}
    ${infoTable([
      ['Order Number', esc(data.orderNumber)],
      ['Vendor', esc(data.businessName)],
      ['New Status', badge(label, color)],
    ])}
    ${data.statusMessage ? `<div style="background:#f8f9fc;border:1px solid #e8ecf0;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">${esc(data.statusMessage)}</p>
    </div>` : ''}
    ${ctaButton('View Order', data.ordersUrl)}
  `)
  return { subject, html }
}
