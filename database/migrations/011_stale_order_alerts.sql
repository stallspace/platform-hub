-- ============================================================
-- Stallspace — Stale order alerts
-- Migration: 011_stale_order_alerts
--
-- The reconciliation sweep can confirm Yoco/Peach payments by
-- asking the gateway, but for PayFast and Ozow it can only read
-- our own database — so a dropped ITN leaves an order pending
-- and nothing tells anyone. This column lets the sweep raise
-- exactly one alert per stuck order instead of either staying
-- silent or emailing every five minutes.
-- Idempotent — safe to re-run.
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS stale_alert_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.stale_alert_at IS
  'When we alerted that this order had been stuck at pending too long. '
  'NULL means no alert has been raised. Set once, so the sweep does not '
  'repeat the alert on every run.';

CREATE INDEX IF NOT EXISTS idx_orders_stale_unalerted
  ON orders (created_at)
  WHERE status = 'pending' AND stale_alert_at IS NULL;
