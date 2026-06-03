'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, Store, CreditCard, CheckCircle,
  ArrowRight, ArrowLeft, Upload, Eye, EyeOff, Loader2, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────
interface StepOneData {
  business_name: string
  owner_name: string
  email: string
  password: string
  phone: string
  business_address: string
  company_registration: string
  business_description: string
}

interface StepTwoData {
  logo: File | null
  banner: File | null
  documents: File[]
}

type PlanId = 'starter' | 'growth' | 'premium'

// ─── Constants ───────────────────────────────────────────────
const STEPS = [
  { n: 1, label: 'Business Details' },
  { n: 2, label: 'Upload Files' },
  { n: 3, label: 'Choose Plan' },
  { n: 4, label: 'Review & Submit' },
]

const PLANS = [
  {
    id: 'starter' as PlanId,
    name: 'Starter',
    price: 199,
    limit: '100 products',
    features: [
      'Up to 100 product listings',
      'Dedicated storefront page',
      'Basic analytics dashboard',
      'All payment providers supported',
      'Email support',
    ],
  },
  {
    id: 'growth' as PlanId,
    name: 'Growth',
    price: 399,
    limit: '500 products',
    popular: true,
    features: [
      'Up to 500 product listings',
      'Dedicated storefront page',
      'Advanced analytics dashboard',
      'All payment providers supported',
      'Bulk product upload',
      'Priority support',
    ],
  },
  {
    id: 'premium' as PlanId,
    name: 'Premium',
    price: 699,
    limit: 'Unlimited products',
    features: [
      'Unlimited product listings',
      'Dedicated storefront page',
      'Full analytics suite',
      'All payment providers supported',
      'Bulk product upload',
      'Featured placement priority',
      'Dedicated account support',
    ],
  },
]

// ─── Step Indicator ──────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${current > step.n ? 'bg-green-500 text-white' :
                current === step.n ? 'bg-brand-accent text-white ring-4 ring-brand-accent/20' :
                'bg-white/20 text-gray-400'}`}>
              {current > step.n ? <CheckCircle className="w-5 h-5" /> : step.n}
            </div>
            <span className={`text-xs mt-1.5 hidden sm:block font-medium
              ${current === step.n ? 'text-white' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-4 transition-all
              ${current > step.n ? 'bg-green-500' : 'bg-white/20'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────
export default function VendorRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [stepOne, setStepOne] = useState<StepOneData>({
    business_name: '',
    owner_name: '',
    email: '',
    password: '',
    phone: '',
    business_address: '',
    company_registration: '',
    business_description: '',
  })

  const [stepTwo, setStepTwo] = useState<StepTwoData>({
    logo: null,
    banner: null,
    documents: [],
  })

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('growth')

  // ── Validation ─────────────────────────────────────────────
  function validateStepOne(): string {
    if (!stepOne.business_name.trim()) return 'Business name is required'
    if (!stepOne.owner_name.trim()) return 'Owner name is required'
    if (!stepOne.email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stepOne.email)) return 'Enter a valid email address'
    if (!stepOne.password || stepOne.password.length < 8) return 'Password must be at least 8 characters'
    if (!stepOne.phone.trim()) return 'Phone number is required'
    if (!stepOne.business_address.trim()) return 'Business address is required'
    if (!stepOne.business_description.trim()) return 'Business description is required'
    if (stepOne.business_description.length < 30) return 'Description must be at least 30 characters'
    return ''
  }

  // ── File handlers ──────────────────────────────────────────
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setStepTwo(prev => ({ ...prev, logo: file }))
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setStepTwo(prev => ({ ...prev, banner: file }))
  }

  function handleDocumentsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setStepTwo(prev => ({ ...prev, documents: [...prev.documents, ...files].slice(0, 5) }))
  }

  function removeDocument(index: number) {
    setStepTwo(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== index) }))
  }

  // ── Navigation ─────────────────────────────────────────────
  function handleNext() {
    setError('')
    if (step === 1) {
      const err = validateStepOne()
      if (err) { setError(err); return }
    }
    setStep(s => s + 1)
    window.scrollTo(0, 0)
  }

  function handleBack() {
    setError('')
    setStep(s => s - 1)
    window.scrollTo(0, 0)
  }

  // ── Submit ─────────────────────────────────────────────────
  async function handleSubmit() {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: stepOne.email,
        password: stepOne.password,
        options: {
          data: { role: 'vendor', full_name: stepOne.owner_name },
        },
      })

      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error('Failed to create account')

      const userId = authData.user.id
      const slug = slugify(stepOne.business_name)

      // 2. Upload logo if provided
      let logoUrl: string | null = null
      if (stepTwo.logo) {
        const ext = stepTwo.logo.name.split('.').pop()
        const { data: logoData, error: logoError } = await supabase.storage
          .from('vendor-logos')
          .upload(`${userId}/logo.${ext}`, stepTwo.logo, { upsert: true })
        if (!logoError && logoData) {
          const { data: { publicUrl } } = supabase.storage
            .from('vendor-logos')
            .getPublicUrl(logoData.path)
          logoUrl = publicUrl
        }
      }

      // 3. Upload banner if provided
      let bannerUrl: string | null = null
      if (stepTwo.banner) {
        const ext = stepTwo.banner.name.split('.').pop()
        const { data: bannerData, error: bannerError } = await supabase.storage
          .from('vendor-banners')
          .upload(`${userId}/banner.${ext}`, stepTwo.banner, { upsert: true })
        if (!bannerError && bannerData) {
          const { data: { publicUrl } } = supabase.storage
            .from('vendor-banners')
            .getPublicUrl(bannerData.path)
          bannerUrl = publicUrl
        }
      }

      // 4. Create vendor record
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .insert({
          user_id: userId,
          business_name: stepOne.business_name,
          slug: slug,
          owner_name: stepOne.owner_name,
          email: stepOne.email,
          phone: stepOne.phone,
          business_address: stepOne.business_address,
          company_registration: stepOne.company_registration || null,
          business_description: stepOne.business_description,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          status: 'pending',
          subscription_plan: selectedPlan,
        })
        .select()
        .single()

      if (vendorError) throw new Error(vendorError.message)

      // 5. Upload supporting documents
      if (stepTwo.documents.length > 0 && vendor) {
        for (const doc of stepTwo.documents) {
          const { data: docData } = await supabase.storage
            .from('vendor-documents')
            .upload(`${userId}/${Date.now()}-${doc.name}`, doc, { upsert: true })

          if (docData) {
            await supabase.from('vendor_documents').insert({
              vendor_id: vendor.id,
              file_url: docData.path,
              file_name: doc.name,
              file_type: doc.type,
            })
          }
        }
      }

      // 6. Update profile role to vendor
      await supabase
        .from('profiles')
        .update({ role: 'vendor', full_name: stepOne.owner_name, phone: stepOne.phone })
        .eq('id', userId)

      // Success — go to confirmation
      setStep(5)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success Screen ─────────────────────────────────────────
  if (step === 5) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h1>
          <p className="text-gray-500 mb-2">
            Thank you, <strong>{stepOne.owner_name}</strong>. Your vendor application for{' '}
            <strong>{stepOne.business_name}</strong> has been received.
          </p>
          <p className="text-gray-500 mb-8 text-sm">
            Our team will review your application and contact you at <strong>{stepOne.email}</strong> within 2–3 business days.
          </p>
          <div className="bg-brand-navy/5 rounded-xl p-5 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">What happens next?</h3>
            <ol className="space-y-2">
              {[
                'Our team reviews your application & documents',
                'We verify your business details',
                'You receive approval & billing setup email',
                'Your storefront goes live on MARCRTE',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <span className="w-5 h-5 bg-brand-accent text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
          <Link href="/marketplace" className="btn-primary inline-flex items-center gap-2">
            Back to Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-navy py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Link href="/marketplace" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-white font-bold text-xl">MARCRTE</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Register as a Vendor</h1>
          <p className="text-gray-300 text-sm">Join South Africa&apos;s vetted marketplace</p>
          <div className="mt-8">
            <StepIndicator current={step} />
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="max-w-2xl mx-auto px-4 py-10">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm flex items-start gap-2">
            <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* ── STEP 1: Business Details ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Business Details</h2>
              <p className="text-gray-500 text-sm mt-0.5">Tell us about your business and create your account</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Business Name *</label>
                  <input
                    type="text"
                    placeholder="Acme Trading Co"
                    className="input"
                    value={stepOne.business_name}
                    onChange={e => setStepOne(p => ({ ...p, business_name: e.target.value }))}
                  />
                  {stepOne.business_name && (
                    <p className="text-xs text-gray-400 mt-1">
                      Storefront: marcrte.co.za/store/{slugify(stepOne.business_name)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">Owner Name *</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    className="input"
                    value={stepOne.owner_name}
                    onChange={e => setStepOne(p => ({ ...p, owner_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    type="email"
                    placeholder="hello@yourbusiness.co.za"
                    className="input"
                    value={stepOne.email}
                    onChange={e => setStepOne(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 characters"
                      className="input pr-10"
                      value={stepOne.password}
                      onChange={e => setStepOne(p => ({ ...p, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+27 82 000 0000"
                    className="input"
                    value={stepOne.phone}
                    onChange={e => setStepOne(p => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Company Reg Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    placeholder="2024/000000/07"
                    className="input"
                    value={stepOne.company_registration}
                    onChange={e => setStepOne(p => ({ ...p, company_registration: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="label">Business Address *</label>
                <input
                  type="text"
                  placeholder="123 Main Street, Cape Town, Western Cape, 8001"
                  className="input"
                  value={stepOne.business_address}
                  onChange={e => setStepOne(p => ({ ...p, business_address: e.target.value }))}
                />
              </div>

              <div>
                <label className="label">Business Description *</label>
                <textarea
                  rows={4}
                  placeholder="Describe your business — what you sell, your story, and what makes your products unique. (min 30 characters)"
                  className="input resize-none"
                  value={stepOne.business_description}
                  onChange={e => setStepOne(p => ({ ...p, business_description: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">{stepOne.business_description.length} / 500 characters</p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Upload Files ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Upload Files</h2>
              <p className="text-gray-500 text-sm mt-0.5">Add your logo, banner, and supporting documents</p>
            </div>
            <div className="p-6 space-y-6">
              {/* Logo */}
              <div>
                <label className="label">Business Logo <span className="text-gray-400 font-normal">(Recommended)</span></label>
                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-accent transition-colors cursor-pointer group">
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  {stepTwo.logo ? (
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{stepTwo.logo.name}</p>
                        <p className="text-xs text-gray-400">{(stepTwo.logo.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2 group-hover:text-brand-accent transition-colors" />
                      <p className="text-sm font-medium text-gray-700">Click to upload logo</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB · Square format recommended</p>
                    </>
                  )}
                </label>
              </div>

              {/* Banner */}
              <div>
                <label className="label">Store Banner <span className="text-gray-400 font-normal">(Optional)</span></label>
                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-accent transition-colors cursor-pointer group">
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                  {stepTwo.banner ? (
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{stepTwo.banner.name}</p>
                        <p className="text-xs text-gray-400">{(stepTwo.banner.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2 group-hover:text-brand-accent transition-colors" />
                      <p className="text-sm font-medium text-gray-700">Click to upload banner</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB · 1200×400px recommended</p>
                    </>
                  )}
                </label>
              </div>

              {/* Documents */}
              <div>
                <label className="label">Supporting Documents <span className="text-gray-400 font-normal">(Optional but recommended)</span></label>
                <p className="text-xs text-gray-500 mb-2">Upload CIPCs, ID documents, proof of address, or any other relevant business documents</p>
                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-accent transition-colors cursor-pointer group">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={handleDocumentsChange} />
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2 group-hover:text-brand-accent transition-colors" />
                  <p className="text-sm font-medium text-gray-700">Click to upload documents</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB each · Max 5 files</p>
                </label>

                {stepTwo.documents.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {stepTwo.documents.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{(doc.size / 1024 / 1024).toFixed(1)}MB</span>
                        </div>
                        <button onClick={() => removeDocument(i)} className="text-gray-400 hover:text-red-500 ml-2">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Choose Plan ── */}
        {step === 3 && (
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Choose Your Plan</h2>
              <p className="text-gray-500 text-sm">You can upgrade or downgrade at any time. Billing starts after approval.</p>
            </div>

            <div className="space-y-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative bg-white rounded-2xl border-2 p-6 cursor-pointer transition-all
                    ${selectedPlan === plan.id
                      ? 'border-brand-accent shadow-lg shadow-brand-accent/10'
                      : 'border-gray-100 hover:border-gray-200'}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-6 badge bg-brand-accent text-white text-xs px-3 py-1">
                      Most Popular
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Radio */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                        ${selectedPlan === plan.id ? 'border-brand-accent' : 'border-gray-300'}`}>
                        {selectedPlan === plan.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-accent" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                          <span className="text-sm text-gray-500">{plan.limit}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3">
                          {plan.features.map((f) => (
                            <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                              {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-2xl font-bold text-brand-navy">R{plan.price}</span>
                      <span className="text-gray-400 text-sm">/mo</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Billing only starts after your application is approved. You&apos;ll receive a payment link via email.
            </div>
          </div>
        )}

        {/* ── STEP 4: Review & Submit ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Business Details</h3>
                <button onClick={() => setStep(1)} className="text-brand-accent text-sm hover:underline">Edit</button>
              </div>
              <div className="p-5 grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Business Name', value: stepOne.business_name },
                  { label: 'Owner Name', value: stepOne.owner_name },
                  { label: 'Email', value: stepOne.email },
                  { label: 'Phone', value: stepOne.phone },
                  { label: 'Address', value: stepOne.business_address },
                  { label: 'Reg Number', value: stepOne.company_registration || '—' },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-gray-400 text-xs">{item.label}</p>
                    <p className="font-medium text-gray-900 mt-0.5 truncate">{item.value}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-gray-400 text-xs">Description</p>
                  <p className="font-medium text-gray-900 mt-0.5 text-sm">{stepOne.business_description}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Files</h3>
                <button onClick={() => setStep(2)} className="text-brand-accent text-sm hover:underline">Edit</button>
              </div>
              <div className="p-5 text-sm space-y-1">
                <p className="text-gray-600">Logo: <span className="font-medium text-gray-900">{stepTwo.logo?.name || 'Not uploaded'}</span></p>
                <p className="text-gray-600">Banner: <span className="font-medium text-gray-900">{stepTwo.banner?.name || 'Not uploaded'}</span></p>
                <p className="text-gray-600">Documents: <span className="font-medium text-gray-900">{stepTwo.documents.length} file(s)</span></p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Selected Plan</h3>
                <button onClick={() => setStep(3)} className="text-brand-accent text-sm hover:underline">Edit</button>
              </div>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-lg capitalize">{selectedPlan}</p>
                  <p className="text-gray-500 text-sm">{PLANS.find(p => p.id === selectedPlan)?.limit}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-brand-navy">R{PLANS.find(p => p.id === selectedPlan)?.price}</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
              By submitting you agree to our Terms of Service and confirm that all information provided is accurate.
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          {step > 1 ? (
            <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <Link href="/marketplace" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Cancel
            </Link>
          )}

          {step < 4 ? (
            <button onClick={handleNext} className="btn-primary flex items-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><Store className="w-4 h-4" /> Submit Application</>
              )}
            </button>
          )}
        </div>

        {/* Trust signals */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            Secure & Encrypted
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-blue-500" />
            Billing starts after approval
          </div>
        </div>
      </div>
    </div>
  )
}
