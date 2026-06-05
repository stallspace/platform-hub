'use client'

import { Crown, Check, ArrowUpRight, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'

interface Vendor {
  id: string
  business_name: string
  subscription_plan: string | null
  subscription_status: string | null
  subscription_id: string | null
  subscription_next_billing: string | null
}

interface Props { vendor: Vendor }

const PLANS = [
  { id: 'starter', name: 'Starter', price: 199, limit: '100 products', popular: false, features: ['Up to 100 product listings', 'Dedicated storefront page', 'Basic analytics', 'All payment providers', 'Email support'] },
  { id: 'growth', name: 'Growth', price: 399, limit: '500 products', popular: true, features: ['Up to 500 product listings', 'Dedicated storefront page', 'Advanced analytics', 'All payment providers', 'Bulk product upload', 'Priority support'] },
  { id: 'premium', name: 'Premium', price: 699, limit: 'Unlimited products', popular: false, features: ['Unlimited product listings', 'Dedicated storefront page', 'Full analytics suite', 'All payment providers', 'Bulk product upload', 'Featured placement priority', 'Dedicated support'] },
]

function StatusBadge({ status }: { status: string | null }) {
  if (status === 'active') return <span className="flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full"><CheckCircle className="w-3.5 h-3.5" /> Active</span>
  if (status === 'past_due') return <span className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full"><AlertCircle className="w-3.5 h-3.5" /> Past Due</span>
  if (status === 'suspended') return <span className="flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 px-3 py-1 rounded-full"><XCircle className="w-3.5 h-3.5" /> Suspended</span>
  if (status === 'cancelled') return <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>
  return <span className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full"><Clock className="w-3.5 h-3.5" /> No Plan</span>
}

export default function SubscriptionClient({ vendor }: Props) {
  const currentPlan = PLANS.find(p => p.id === vendor.subscription_plan)
  let nextBilling = ''
  if (vendor.subscription_next_billing) {
    const d = new Date(vendor.subscription_next_billing)
    nextBilling = d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your MARCRTE subscription plan</p>
      </div>

      <div className="bg-gradient-to-r from-brand-navy to-brand-accent rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <p className="text-white/70 text-sm">Current Plan</p>
              <p className="text-xl font-bold">{currentPlan ? currentPlan.name : 'No Active Plan'}</p>
            </div>
          </div>
          <StatusBadge status={vendor.subscription_status} />
        </div>
        {currentPlan && (
          <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4">
            <div>
              <p className="text-white/60 text-xs">Monthly Rate</p>
              <p className="text-white font-semibold">R{currentPlan.price}/month</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Product Limit</p>
              <p className="text-white font-semibold">{currentPlan.limit}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Next Billing</p>
              <p className="text-white font-semibold">{nextBilling || 'Not set'}</p>
            </div>
          </div>
        )}
        {vendor.subscription_status === 'past_due' && (
          <div className="mt-4 bg-amber-400/20 border border-amber-400/30 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
            <p className="text-amber-200 text-sm">Your payment is overdue. Please update your billing to avoid suspension.</p>
          </div>
        )}
        {vendor.subscription_status === 'suspended' && (
          <div className="mt-4 bg-red-400/20 border border-red-400/30 rounded-xl p-3 flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">Your account is suspended due to non-payment. Reactivate below to restore access.</p>
          </div>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Available Plans</h2>
        <p className="text-gray-500 text-sm mt-0.5">To change your plan, contact us at billing@marcrte.co.za</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {PLANS.map(plan => {
          const isCurrent = vendor.subscription_plan === plan.id
          const currentIdx = PLANS.findIndex(p => p.id === vendor.subscription_plan)
          const planIdx = PLANS.findIndex(p => p.id === plan.id)
          const label = currentIdx < planIdx ? 'Upgrade' : 'Switch'
          const mailBody = 'Hi, I would like to change my plan to ' + plan.name + '. My business: ' + vendor.business_name
          const mailHref = 'mailto:billing@marcrte.co.za?subject=Plan Change&body=' + encodeURIComponent(mailBody)
          return (
            <div key={plan.id} className={"relative rounded-2xl border-2 p-5 " + (isCurrent ? 'border-brand-accent bg-blue-50' : 'border-gray-100 bg-white')}>
              {plan.popular && !isCurrent && (
                <span className="absolute -top-3 left-4 text-xs font-semibold bg-brand-accent text-white px-3 py-1 rounded-full">Most Popular</span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 left-4 text-xs font-semibold bg-green-500 text-white px-3 py-1 rounded-full">Current Plan</span>
              )}
              <div className="mb-4">
                <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{plan.limit}</p>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-brand-navy">R{plan.price}</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="w-full text-center text-sm font-medium text-brand-accent py-2">Your current plan</div>
              ) : (
                <a href={mailHref} className="flex items-center justify-center gap-2 w-full py-2 px-4 text-sm font-medium border border-brand-navy text-brand-navy rounded-lg hover:bg-brand-navy hover:text-white transition-colors">
                  {label} to {plan.name}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Billing Support</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <a href="mailto:billing@marcrte.co.za" className="flex items-center gap-2 text-brand-accent hover:underline"><ArrowUpRight className="w-4 h-4" />Contact billing support</a>
          <a href="mailto:billing@marcrte.co.za?subject=Cancel Subscription" className="flex items-center gap-2 text-gray-500 hover:text-gray-900"><ArrowUpRight className="w-4 h-4" />Request cancellation</a>
          <a href="mailto:billing@marcrte.co.za?subject=Reactivate Account" className="flex items-center gap-2 text-gray-500 hover:text-gray-900"><ArrowUpRight className="w-4 h-4" />Reactivate account</a>
        </div>
      </div>
    </div>
  )
}
