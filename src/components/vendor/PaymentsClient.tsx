'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Shield, Eye, EyeOff, Loader2, Check } from 'lucide-react'

interface MaskedConfig {
  id: string
  provider: string
  is_active: boolean
  config_masked: Record<string, string>
}

interface Props {
  vendorId: string
  configs?: unknown // legacy prop, no longer used for values
}

type Provider = 'payfast' | 'peach' | 'yoco' | 'ozow'

// Stallspace uses PayFast for all customer payments. Payments go directly to the
// vendor's own PayFast account — Stallspace never handles the funds.
const PROVIDERS = [
  { id: 'payfast' as Provider, name: 'PayFast', description: 'Payments go straight to your PayFast account' },
]

const FIELDS: Record<Provider, { key: string; label: string; masked: boolean; placeholder: string }[]> = {
  payfast: [
    { key: 'merchant_id', label: 'Merchant ID', masked: false, placeholder: '10000100' },
    { key: 'merchant_key', label: 'Merchant Key', masked: true, placeholder: '46f0cd694581a' },
    { key: 'passphrase', label: 'Passphrase', masked: true, placeholder: 'Your passphrase' },
  ],
  peach: [
    { key: 'entity_id', label: 'Entity ID', masked: false, placeholder: '8a829417...' },
    { key: 'access_token', label: 'Access Token', masked: true, placeholder: 'OGE4Mjk0...' },
  ],
  yoco: [
    { key: 'public_key', label: 'Public Key', masked: false, placeholder: 'pk_live_...' },
    { key: 'secret_key', label: 'Secret Key', masked: true, placeholder: 'sk_live_...' },
  ],
  ozow: [
    { key: 'site_code', label: 'Site Code', masked: false, placeholder: 'ZA-123456-01' },
    { key: 'private_key', label: 'Private Key', masked: true, placeholder: 'Your private key' },
  ],
}

function MaskedInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint"
      />
      <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

const SECRET_KEYS = new Set(['merchant_key', 'passphrase', 'secret_key', 'private_key', 'access_token'])

export default function PaymentsClient({ vendorId }: Props) {
  const [provider, setProvider] = useState<Provider>('payfast')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedConfigs, setSavedConfigs] = useState<MaskedConfig[]>([])
  const [fields, setFields] = useState<Record<string, string>>({})

  const existing = savedConfigs.find(c => c.provider === provider)

  // Fields the vendor has typed but not yet saved (only these get sent).
  function prefillFor(p: Provider, list: MaskedConfig[]) {
    const ex = list.find(c => c.provider === p)
    if (!ex) return {}
    // Prefill non-secret fields with their real (masked route returns real) values;
    // leave secret fields blank so they can be kept or replaced.
    const next: Record<string, string> = {}
    for (const [k, v] of Object.entries(ex.config_masked)) {
      if (!SECRET_KEYS.has(k)) next[k] = v
    }
    return next
  }

  async function loadConfigs() {
    try {
      const res = await fetch('/api/vendor/payment-config')
      const json = await res.json()
      const list: MaskedConfig[] = json.configs ?? []
      setSavedConfigs(list)
      setFields(prefillFor(provider, list))
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadConfigs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleProviderChange(p: Provider) {
    setProvider(p)
    setFields(prefillFor(p, savedConfigs))
    setSaved(false)
    setError(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      // Send only fields the vendor actually entered; blank secrets are kept server-side.
      const config: Record<string, string> = {}
      for (const [k, v] of Object.entries(fields)) {
        if (v && v.trim() !== '') config[k] = v.trim()
      }
      const res = await fetch('/api/vendor/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, config }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save')
      setSaved(true)
      await loadConfigs()
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save payment configuration.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Configuration</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configure how customers pay for your products</p>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Select Payment Provider</h2>
          <div className="grid grid-cols-2 gap-3">
            {PROVIDERS.map(p => {
              const configured = savedConfigs.some(c => c.provider === p.id && c.is_active)
              return (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={"text-left p-4 rounded-xl border-2 transition-all " + (provider === p.id ? 'border-brand-mint bg-blue-50' : 'border-gray-100 hover:border-gray-200')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{p.name}</span>
                    <div className={"w-4 h-4 rounded-full border-2 flex items-center justify-center " + (provider === p.id ? 'border-brand-mint' : 'border-gray-300')}>
                      {provider === p.id && <div className="w-2 h-2 rounded-full bg-brand-mint" />}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{p.description}</p>
                  {configured && <span className="text-xs text-green-600 font-medium mt-1 block">Configured</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-brand-mint" />
            <h2 className="font-semibold text-gray-900">{PROVIDERS.find(p => p.id === provider)?.name} Credentials</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Don&apos;t have a PayFast account yet?{' '}
            <a href="https://www.payfast.io/registration" target="_blank" rel="noopener noreferrer" className="text-brand-mint font-medium hover:underline">
              Create one free
            </a>
            , then copy your <strong>Merchant ID</strong> and <strong>Merchant Key</strong> from PayFast&nbsp;→&nbsp;Settings&nbsp;→&nbsp;Integration.
          </p>
          <div className="space-y-3">
            {FIELDS[provider].map(field => {
              const savedValue = existing?.config_masked?.[field.key]
              const placeholder = field.masked && savedValue
                ? `${savedValue} — leave blank to keep`
                : field.placeholder
              return (
                <div key={field.key}>
                  <label className="text-xs text-gray-500 mb-1 block">{field.label}</label>
                  {field.masked
                    ? <MaskedInput value={fields[field.key] ?? ''} onChange={v => setFields(prev => ({ ...prev, [field.key]: v }))} placeholder={placeholder} />
                    : <input type="text" value={fields[field.key] ?? ''} onChange={e => setFields(prev => ({ ...prev, [field.key]: e.target.value }))} placeholder={placeholder} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:border-brand-mint" />
                  }
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">Stallspace does not process, hold, or handle any customer payments. These credentials connect your storefront directly to your own merchant account. All payments go straight to you. You are solely responsible for your merchant account, compliance, and settlements.</p>
        </div>

        <div className="flex items-center justify-between pt-2 pb-6">
          <p className="text-xs text-gray-400">Customers pay directly to your merchant account</p>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-brand-forest text-white text-sm font-medium rounded-lg hover:bg-brand-mint transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saved && <Check className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}
