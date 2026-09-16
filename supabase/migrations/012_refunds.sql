-- ============================================================
-- Stallspace — Real refunds
-- Migration: 012_refunds
--
-- Until now 'refunded' was a status with nothing behind it: the
-- customer was emailed that they had been refunded while no
-- money moved. A vendor cancelling a PAID order was worse —
-- stock was restored, the order closed, and the customer was
-- simply out of pocket with nobody tracking it.
--
-- Refunds are made on the VENDOR's own PayFast account, so
-- Stallspace still never touches the money.
-- Idempotent — safe to re-run.
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_status    TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount    NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at      TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reference TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_error     TEXT;

COMMENT ON COLUMN orders.refund_status IS
  'NULL = nothing owed. ''owed'' = a paid order was cancelled and the customer '
  'is out of pocket. ''processing'' = sent to the gateway. ''refunded'' = the '
  'gateway accepted it. ''failed'' = the gateway refused; see refund_error. '
  '''manual'' = the vendor refunded outside Stallspace and told us.';

-- Anything already cancelled after payment is money a customer never got back.
-- Flag it rather than leave it invisible.
UPDATE orders
SET refund_status = 'owed'
WHERE status IN ('cancelled', 'refunded')
  AND paid_at IS NOT NULL
  AND refund_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_refund_owed
  ON orders (vendor_id, created_at)
  WHERE refund_status IN ('owed', 'failed');
