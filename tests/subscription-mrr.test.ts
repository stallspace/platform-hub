import { test } from 'node:test'
import assert from 'node:assert/strict'

/**
 * Mirrors the MRR calculation in src/app/admin/dashboard/page.tsx and
 * src/app/admin/reports/page.tsx.
 *
 * The rule: a vendor on a free trial is fully active and pays nothing, so
 * they must never be counted as revenue. A launch cohort entirely on trial
 * previously reported MRR that was 100% phantom.
 */
const PLAN_PRICES: Record<string, number> = { starter: 250, growth: 500, premium: 1000 }

interface V {
  subscription_status: string | null
  subscription_plan: string | null
  trial_ends_at: string | null
}

function mrr(vendors: V[], now = Date.now()): number {
  const onTrial = (v: V) =>
    Boolean(v.trial_ends_at) && new Date(v.trial_ends_at as string).getTime() > now
  return vendors
    .filter(v => v.subscription_status === 'active' && !onTrial(v))
    .reduce((sum, v) => sum + (PLAN_PRICES[v.subscription_plan ?? 'starter'] ?? 0), 0)
}

const FUTURE = new Date(Date.now() + 60 * 86_400_000).toISOString()
const PAST   = new Date(Date.now() - 60 * 86_400_000).toISOString()

test('a launch cohort entirely on trial reports zero MRR', () => {
  const vendors: V[] = [
    { subscription_status: 'active', subscription_plan: 'starter', trial_ends_at: FUTURE },
    { subscription_status: 'active', subscription_plan: 'growth',  trial_ends_at: FUTURE },
    { subscription_status: 'active', subscription_plan: 'premium', trial_ends_at: FUTURE },
  ]
  assert.equal(mrr(vendors), 0)
})

test('a vendor whose trial has ended counts as revenue', () => {
  assert.equal(
    mrr([{ subscription_status: 'active', subscription_plan: 'growth', trial_ends_at: PAST }]),
    500
  )
})

test('a vendor who was never on a trial counts as revenue', () => {
  assert.equal(
    mrr([{ subscription_status: 'active', subscription_plan: 'premium', trial_ends_at: null }]),
    1000
  )
})

test('mixed cohort counts only the payers', () => {
  const vendors: V[] = [
    { subscription_status: 'active',    subscription_plan: 'starter', trial_ends_at: FUTURE }, // trial
    { subscription_status: 'active',    subscription_plan: 'starter', trial_ends_at: PAST },   // R250
    { subscription_status: 'active',    subscription_plan: 'premium', trial_ends_at: null },   // R1000
    { subscription_status: 'cancelled', subscription_plan: 'premium', trial_ends_at: null },   // not active
    { subscription_status: 'past_due',  subscription_plan: 'growth',  trial_ends_at: null },   // not active
  ]
  assert.equal(mrr(vendors), 1250)
})

test('an unknown plan contributes nothing rather than NaN', () => {
  const total = mrr([{ subscription_status: 'active', subscription_plan: 'enterprise', trial_ends_at: null }])
  assert.equal(total, 0)
  assert.equal(Number.isNaN(total), false)
})

test('a trial ending exactly now is already over', () => {
  const now = Date.now()
  const vendors: V[] = [
    { subscription_status: 'active', subscription_plan: 'starter', trial_ends_at: new Date(now).toISOString() },
  ]
  assert.equal(mrr(vendors, now), 250)
})
