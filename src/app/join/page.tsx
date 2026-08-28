import Link from 'next/link'
import Image from 'next/image'
import {
  ShieldCheck, Store, TrendingUp, Users, Package,
  CreditCard, ArrowRight, CheckCircle2, Clock,
  Star, Zap, Globe, BarChart3, HeartHandshake,
  BadgeCheck, ChevronRight
} from 'lucide-react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 250,
    limit: '20 products',
    description: 'Perfect for getting started',
    features: [
      'Up to 20 product listings',
      'Dedicated storefront page',
      'Basic analytics dashboard',
      'Take payments your way',
      'Email support',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 500,
    limit: '50 products',
    description: 'For growing businesses',
    popular: true,
    features: [
      'Up to 50 product listings',
      'Dedicated storefront page',
      'Advanced analytics',
      'Take payments your way',
      'Bulk product upload',
      'Priority support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1000,
    limit: 'Unlimited products',
    description: 'For established businesses',
    features: [
      'Unlimited product listings',
      'Dedicated storefront page',
      'Full analytics suite',
      'Take payments your way',
      'Bulk product upload',
      'Featured placement priority',
      'Dedicated account support',
    ],
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: <Store className="w-6 h-6" />,
    title: 'Apply Online',
    description: 'Fill in your business details, upload your logo and supporting documents, and choose your subscription plan. Takes less than 10 minutes.',
  },
  {
    step: '02',
    icon: <ShieldCheck className="w-6 h-6" />,
    title: 'Get Vetted',
    description: 'Our team reviews your application within 2–3 business days. We verify your business details to maintain marketplace quality.',
  },
  {
    step: '03',
    icon: <CreditCard className="w-6 h-6" />,
    title: 'Activate & Pay',
    description: 'Once approved, you receive a billing setup link via email. Connect your payment gateway and your subscription goes live.',
  },
  {
    step: '04',
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Start Selling',
    description: 'List your products, customise your storefront, and start reaching customers looking for what you sell.',
  },
]

const WHY_Stallspace = [
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Reach Real Customers',
    description: 'Access a growing base of customers actively looking for products like yours.',
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: 'No Commission Fees',
    description: 'We charge a flat monthly subscription. Every rand from a sale goes directly to you.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Verified Badge',
    description: 'Approved vendors get a verified badge, building immediate trust with customers.',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: 'Your Own Storefront',
    description: 'A dedicated page at Stallspace.co.za/store/yourbusiness — your mini website on the marketplace.',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Built-in Analytics',
    description: 'Track store visits, product views, enquiries, and sales from a single dashboard.',
  },
  {
    icon: <HeartHandshake className="w-5 h-5" />,
    title: 'Local Support',
    description: 'A responsive team that understands your market, your payment needs, and your customers.',
  },
]

export default function VendorJoinPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── NAVBAR ──────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-brand-forest border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link href="/marketplace" className="flex items-center gap-2 min-w-0 flex-shrink">
            <Image src="/logo-white.png" alt="Stallspace" width={44} height={32} className="h-7 sm:h-9 w-auto object-contain flex-shrink-0" priority />
            <span className="text-white font-bold text-lg sm:text-xl tracking-tight truncate">Stallspace</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Secondary links are hidden on small screens — the primary
                action (Apply Now) is what matters on a phone. */}
            <Link
              href="/marketplace"
              className="hidden md:inline text-gray-300 hover:text-white text-sm transition-colors whitespace-nowrap"
            >
              Browse Marketplace
            </Link>
            <Link
              href="/auth/login"
              className="hidden sm:inline text-gray-300 hover:text-white text-sm transition-colors whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link
              href="/join/register"
              className="bg-brand-mint hover:bg-[#22a370] text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────── */}
      <section className="relative bg-brand-forest overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }}
        />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-mint opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <BadgeCheck className="w-4 h-4 text-green-400" />
              <span className="text-white/90 text-sm font-medium">Applications open — limited vendor spots available</span>
            </div>

            <h1 className="text-[34px] sm:text-5xl md:text-6xl font-bold text-white leading-[1.12] mb-5 sm:mb-6">
              Sell on a <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2ECC8E] to-[#5dd9a8]">
                Trusted Marketplace
              </span>
            </h1>

            <p className="text-gray-300 text-base sm:text-lg md:text-xl leading-relaxed mb-7 sm:mb-8 max-w-2xl">
              Stallspace connects verified local businesses with customers who want to buy from them.
              No commission fees. No middlemen. Just a flat monthly subscription and your
              products in front of real buyers.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-9 sm:mb-12">
              <Link
                href="/join/register"
                className="inline-flex items-center justify-center gap-2 bg-brand-mint hover:bg-[#22a370]
                           text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-colors shadow-lg text-sm sm:text-base"
              >
                Apply to Become a Vendor <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/30
                           text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl hover:border-white transition-colors text-sm sm:text-base"
              >
                View Pricing Plans
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { value: 'R0',       label: 'Commission fees' },
                { value: '2–3 days', label: 'Approval time' },
                { value: 'R250',     label: 'From, per month' },
                { value: '100%',     label: 'Vendor vetted' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY Stallspace ─────────────────────────────── */}
      <section className="py-10 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-brand-mint" />
              <span className="text-brand-mint text-sm font-semibold uppercase tracking-wider">Why Stallspace</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-forest">
              Built for Independent Vendors
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Everything you need to sell online — without the complexity or the commission cuts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_Stallspace.map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-brand-mint/10 text-brand-mint flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────── */}
      <section className="py-10 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-forest">How It Works</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              From application to your first sale in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gray-100 -z-0 -translate-x-6" />
                )}
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-brand-forest text-white flex items-center justify-center mb-5 shadow-lg relative">
                    {step.icon}
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-brand-mint text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-[#F8FAF3] border border-[#2ECC8E]/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Clock className="w-8 h-8 text-brand-mint flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Billing only starts after approval</p>
              <p className="text-sm text-gray-500 mt-0.5">
                You choose your plan during registration, but you won&apos;t be charged until your application is approved and you receive your billing setup link.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────── */}
      <section id="pricing" className="py-10 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-forest">Simple, Flat Pricing</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              One monthly fee. No commission. No hidden costs. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 p-8 flex flex-col
                  ${plan.popular ? 'border-brand-mint shadow-xl shadow-brand-mint/10' : 'border-gray-100 shadow-sm'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-mint text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-bold text-brand-forest">R{plan.price}</span>
                    <span className="text-gray-400 mb-1">/month</span>
                  </div>
                  <p className="text-sm text-brand-mint font-medium mt-1">{plan.limit}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/join/register?plan=${plan.id}`}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors
                    ${plan.popular
                      ? 'bg-brand-mint hover:bg-[#22a370] text-white'
                      : 'bg-brand-forest hover:bg-[#081f18] text-white'}`}
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            All plans include a dedicated storefront, customer enquiry inbox, and all supported payment providers.
            You can upgrade or downgrade at any time.
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────── */}
      <section className="py-10 sm:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-brand-forest text-center mb-10">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Does Stallspace take a commission on my sales?',
                a: 'No. Stallspace charges a flat monthly subscription fee only. Every rand from a customer sale goes directly to you via your chosen payment gateway.',
              },
              {
                q: 'Which payment providers are supported?',
                a: 'You can accept card and EFT payments through your own PayFast account — funds go straight to you, never to Stallspace. You can also accept payment on collection if you prefer not to use an online gateway.',
              },
              {
                q: 'How long does approval take?',
                a: 'Our team reviews applications within 2–3 business days. You\'ll receive an email with the outcome and next steps.',
              },
              {
                q: 'Can I change my plan later?',
                a: 'Yes. You can upgrade or downgrade your subscription at any time from your vendor dashboard. Changes take effect at the next billing cycle.',
              },
              {
                q: 'What documents do I need to apply?',
                a: 'Business documents are optional but recommended — CIPC registration, ID document, or proof of address helps speed up your approval. A logo is also recommended.',
              },
              {
                q: 'What happens if I don\'t pay my subscription?',
                a: 'You\'ll receive reminder emails before any action is taken. After a grace period, your storefront will be temporarily suspended until payment is made, then automatically reactivated.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-brand-mint flex-shrink-0 mt-0.5" />
                  {q}
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed pl-6">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────── */}
      <section className="py-10 sm:py-16 bg-brand-forest relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-mint opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Selling?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Join our vetted marketplace. Your application takes less than 10 minutes.
          </p>
          <Link
            href="/join/register"
            className="inline-flex items-center gap-2 bg-brand-mint hover:bg-[#22a370]
                       text-white font-bold px-10 py-4 rounded-xl transition-colors shadow-lg text-base"
          >
            Apply Now — It&apos;s Free to Apply <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-400 text-sm mt-4">
            Already have a vendor account?{' '}
            <Link href="/auth/login" className="text-white hover:underline">Sign in here</Link>
          </p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer className="bg-black py-6 px-4 text-center text-xs text-gray-600">
        <Link href="/marketplace" className="text-gray-400 hover:text-white transition-colors">
          &larr; Back to Marketplace
        </Link>
        <span className="mx-3 text-gray-700">·</span>
        <span>© {new Date().getFullYear()} Stallspace. All rights reserved.</span>
      </footer>
    </div>
  )
}
