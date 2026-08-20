import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { createNotification } from '@/lib/notifications/create'
import {
  vendorApprovedEmail,
  vendorRejectedEmail,
  vendorSuspendedEmail,
  vendorReactivatedEmail,
  newEnquiryEmail,
  subscriptionPaymentFailedEmail,
  subscriptionReminderEmail,
  subscriptionCancelledEmail,
} from '@/lib/email/templates'

const PLAN_PRICES: Record<string, number> = { starter: 250, growth: 500, premium: 1000 }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://Stallspace.co.za'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, payload } = body as { event: string; payload: Record<string, any> }

    if (!event || !payload) {
      return NextResponse.json({ error: 'Missing event or payload' }, { status: 400 })
    }

    // Authorisation: vendor lifecycle and subscription events may only be
    // triggered by an admin. (enquiry.new is triggered by public enquiry
    // submissions and is validated against a real enquiry row below.)
    if (event.startsWith('vendor.') || event.startsWith('subscription.')) {
      const authClient = await createClient()
      const { data: { user } } = await authClient.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
      const { data: profile } = await authClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    switch (event) {

      case 'vendor.approved': {
        const { vendorId } = payload
        const supabase = await createClient()
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id, owner_name, business_name, email, subscription_plan, user_id')
          .eq('id', vendorId)
          .single()
        if (!vendor) break

        const tpl = vendorApprovedEmail({
          ownerName: vendor.owner_name,
          businessName: vendor.business_name,
          plan: vendor.subscription_plan ?? 'starter',
          dashboardUrl: `${APP_URL}/vendor/dashboard`,
        })
        await sendEmail({ to: vendor.email, ...tpl })
        await createNotification({
          userId: vendor.user_id,
          type: 'account',
          title: 'Application approved!',
          message: `${vendor.business_name} is now live on Stallspace.`,
          actionUrl: '/vendor/dashboard',
        })
        break
      }

      case 'vendor.rejected': {
        const { vendorId, reason } = payload
        const supabase = await createClient()
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id, owner_name, business_name, email, user_id')
          .eq('id', vendorId)
          .single()
        if (!vendor) break

        const tpl = vendorRejectedEmail({
          ownerName: vendor.owner_name,
          businessName: vendor.business_name,
          reason,
        })
        await sendEmail({ to: vendor.email, ...tpl })
        await createNotification({
          userId: vendor.user_id,
          type: 'account',
          title: 'Application not approved',
          message: 'Your Stallspace vendor application was not approved.',
          actionUrl: '/join',
        })
        break
      }

      case 'vendor.suspended': {
        const { vendorId, reason } = payload
        const supabase = await createClient()
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id, owner_name, business_name, email, user_id')
          .eq('id', vendorId)
          .single()
        if (!vendor) break

        const tpl = vendorSuspendedEmail({
          ownerName: vendor.owner_name,
          businessName: vendor.business_name,
          reason,
        })
        await sendEmail({ to: vendor.email, ...tpl })
        await createNotification({
          userId: vendor.user_id,
          type: 'account',
          title: 'Account suspended',
          message: 'Your Stallspace vendor account has been suspended.',
        })
        break
      }

      case 'vendor.reactivated': {
        const { vendorId } = payload
        const supabase = await createClient()
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id, owner_name, business_name, email, user_id')
          .eq('id', vendorId)
          .single()
        if (!vendor) break

        const tpl = vendorReactivatedEmail({
          ownerName: vendor.owner_name,
          businessName: vendor.business_name,
          dashboardUrl: `${APP_URL}/vendor/dashboard`,
        })
        await sendEmail({ to: vendor.email, ...tpl })
        await createNotification({
          userId: vendor.user_id,
          type: 'account',
          title: 'Account reactivated',
          message: `${vendor.business_name} is back live on Stallspace.`,
          actionUrl: '/vendor/dashboard',
        })
        break
      }

      case 'enquiry.new': {
        const { enquiryId } = payload
        const supabase = await createClient()
        const { data: enquiry } = await supabase
          .from('enquiries')
          .select('*, vendors(owner_name, business_name, email, user_id), products(name)')
          .eq('id', enquiryId)
          .single()
        if (!enquiry || !enquiry.vendors) break

        const vendor = enquiry.vendors as any
        const product = enquiry.products as any

        const tpl = newEnquiryEmail({
          vendorName: vendor.owner_name,
          businessName: vendor.business_name,
          customerName: enquiry.customer_name,
          customerEmail: enquiry.customer_email,
          customerPhone: enquiry.customer_phone,
          message: enquiry.message,
          productName: product?.name ?? null,
          enquiriesUrl: `${APP_URL}/vendor/enquiries`,
        })
        await sendEmail({ to: vendor.email, ...tpl })
        await createNotification({
          userId: vendor.user_id,
          type: 'enquiry',
          title: `New enquiry from ${enquiry.customer_name}`,
          message: enquiry.message.slice(0, 100),
          actionUrl: '/vendor/enquiries',
        })
        break
      }

      case 'subscription.payment_failed': {
        const { vendorId, amount } = payload
        const supabase = await createClient()
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id, owner_name, business_name, email, subscription_plan, user_id')
          .eq('id', vendorId)
          .single()
        if (!vendor) break

        const amountStr = `R ${(amount ?? PLAN_PRICES[vendor.subscription_plan ?? 'starter']).toFixed(2)}`

        const tpl = subscriptionPaymentFailedEmail({
          ownerName: vendor.owner_name,
          businessName: vendor.business_name,
          plan: vendor.subscription_plan ?? 'starter',
          amount: amountStr,
          retryUrl: `${APP_URL}/vendor/subscription`,
        })
        await sendEmail({ to: vendor.email, ...tpl })
        await createNotification({
          userId: vendor.user_id,
          type: 'subscription',
          title: 'Payment failed',
          message: `Your subscription payment of ${amountStr} could not be processed.`,
          actionUrl: '/vendor/subscription',
        })
        break
      }

      case 'subscription.reminder': {
        const { vendorId } = payload
        const supabase = await createClient()
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id, owner_name, business_name, email, subscription_plan, subscription_next_billing, user_id')
          .eq('id', vendorId)
          .single()
        if (!vendor) break

        const plan = vendor.subscription_plan ?? 'starter'
        const amountStr = `R ${PLAN_PRICES[plan].toFixed(2)}`
        const dueDate = vendor.subscription_next_billing
          ? new Date(vendor.subscription_next_billing).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
          : 'as soon as possible'

        const tpl = subscriptionReminderEmail({
          ownerName: vendor.owner_name,
          businessName: vendor.business_name,
          plan,
          amount: amountStr,
          dueDate,
        })
        await sendEmail({ to: vendor.email, ...tpl })
        await createNotification({
          userId: vendor.user_id,
          type: 'subscription',
          title: 'Subscription payment reminder',
          message: `Your ${plan} subscription (${amountStr}) is due ${dueDate}.`,
          actionUrl: '/vendor/subscription',
        })
        break
      }

      case 'subscription.cancelled': {
        const { vendorId, endDate } = payload
        const supabase = await createClient()
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id, owner_name, business_name, email, user_id')
          .eq('id', vendorId)
          .single()
        if (!vendor) break

        const tpl = subscriptionCancelledEmail({
          ownerName: vendor.owner_name,
          businessName: vendor.business_name,
          endDate: endDate ?? 'end of billing period',
        })
        await sendEmail({ to: vendor.email, ...tpl })
        await createNotification({
          userId: vendor.user_id,
          type: 'subscription',
          title: 'Subscription cancelled',
          message: 'Your Stallspace subscription has been cancelled.',
          actionUrl: '/vendor/subscription',
        })
        break
      }

      default:
        return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[notifications/send]', err)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}
