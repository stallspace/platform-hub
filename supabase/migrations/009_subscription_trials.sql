-- ============================================================
-- Stallspace — Trials are not revenue
-- Migration: 009_subscription_trials
--
-- The 3-months-free button set subscription_status = 'active'
-- with no trial marker, and the admin dashboard computed MRR
-- from every active vendor. For a launch cohort entirely on
-- trial, reported MRR was 100% phantom.
-- Idempotent — safe to re-run.
-- ============================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

COMMENT ON COLUMN vendors.trial_ends_at IS
  'End of a free trial. While this is in the future the vendor is fully '
  'active but pays nothing, and must be excluded from MRR. NULL means the '
  'vendor has never been on a trial; a past date means the trial converted.';

CREATE INDEX IF NOT EXISTS idx_vendors_trial_ends_at
  ON vendors (trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

-- ------------------------------------------------------------
-- Backfill: an active vendor who has never had a successful
-- charge recorded against them has not paid us anything, so
-- whatever their next billing date is, that is a trial.
-- ------------------------------------------------------------
UPDATE vendors v
SET trial_ends_at = v.subscription_next_billing
WHERE v.trial_ends_at IS NULL
  AND v.subscription_status = 'active'
  AND v.subscription_next_billing IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM subscription_events e
    WHERE e.vendor_id = v.id
      AND e.event_type = 'charge_success'
  );

-- ------------------------------------------------------------
-- Recording a successful charge ends the trial: the vendor has
-- now actually paid, so they belong in MRR from that point.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION end_trial_on_first_charge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'charge_success' THEN
    UPDATE vendors
    SET trial_ends_at = LEAST(COALESCE(trial_ends_at, NOW()), NOW())
    WHERE id = NEW.vendor_id
      AND (trial_ends_at IS NULL OR trial_ends_at > NOW());
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS trg_end_trial_on_charge ON subscription_events;
CREATE TRIGGER trg_end_trial_on_charge
  AFTER INSERT ON subscription_events
  FOR EACH ROW EXECUTE FUNCTION end_trial_on_first_charge();
