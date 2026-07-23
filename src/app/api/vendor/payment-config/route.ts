import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toEncryptedEnvelope, readConfigData, maskSecret } from '@/lib/crypto/secrets'

/**
 * Vendor payment-credential management. Credentials are encrypted server-side
 * before storage and never returned in plaintext to the browser.
 */

const SECRET_FIELDS = new Set(['merchant_key', 'passphrase'])

// Stallspace only supports PayFast for customer payments. Any other provider is rejected.
const REQUIRED_FIELDS: Record<string, string[]> = {
  payfast: ['merchant_id', 'merchant_key'],
}

async function getVendor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, vendor: null }
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single()
  return { supabase, user, vendor }
}

/** GET — return the vendor's configs with secret values masked for display. */
export async function GET() {
  const { user, vendor, supabase } = await getVendor()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 403 })

  const { data: rows } = await supabase
    .from('vendor_payment_configs')
    .select('id, provider, config_data, is_active')
    .eq('vendor_id', vendor.id)

  const configs = (rows ?? []).map((row) => {
    let masked: Record<string, string> = {}
    try {
      const plain = readConfigData(row.config_data)
      masked = Object.fromEntries(
        Object.entries(plain).map(([k, v]) => [k, SECRET_FIELDS.has(k) ? maskSecret(String(v)) : String(v)])
      )
    } catch {
      masked = {}
    }
    return { id: row.id, provider: row.provider, is_active: row.is_active, config_masked: masked }
  })

  return NextResponse.json({ configs })
}

/** POST — create/update an encrypted payment config for the vendor. */
export async function POST(request: NextRequest) {
  const { user, vendor, supabase } = await getVendor()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 403 })

  const { provider, config } = await request.json()
  if (!provider || !REQUIRED_FIELDS[provider]) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }
  if (typeof config !== 'object' || config === null) {
    return NextResponse.json({ error: 'Invalid config' }, { status: 400 })
  }

  // Only keep known string fields; drop anything unexpected.
  const clean: Record<string, string> = {}
  for (const [k, v] of Object.entries(config as Record<string, unknown>)) {
    if (typeof v === 'string' && v.trim() !== '') clean[k] = v.trim()
  }

  // RLS restricts this to the vendor's own row.
  const { data: existing } = await supabase
    .from('vendor_payment_configs')
    .select('id, config_data')
    .eq('vendor_id', vendor.id)
    .eq('provider', provider)
    .single()

  // Merge with existing so a vendor can leave a secret field blank to keep it.
  let existingConfig: Record<string, string> = {}
  if (existing?.config_data) {
    try { existingConfig = readConfigData(existing.config_data) } catch { existingConfig = {} }
  }
  const merged: Record<string, string> = { ...existingConfig, ...clean }

  for (const field of REQUIRED_FIELDS[provider]) {
    if (!merged[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
    }
  }

  const payload = {
    vendor_id: vendor.id,
    provider,
    config_data: toEncryptedEnvelope(merged),
    is_active: true,
    updated_at: new Date().toISOString(),
  }

  const { error } = existing?.id
    ? await supabase.from('vendor_payment_configs').update(payload).eq('id', existing.id)
    : await supabase.from('vendor_payment_configs').insert(payload)

  if (error) return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
