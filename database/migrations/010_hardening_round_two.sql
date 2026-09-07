-- ============================================================
-- Stallspace — Hardening round two
-- Migration: 010_hardening_round_two
--
-- 1. Durable rate limiting (the in-process Map reset on every
--    Netlify cold start, so the one limit that existed fell to
--    concurrency).
-- 2. Product limits also respect vendor approval status.
-- Idempotent — safe to re-run.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Rate limiting that survives cold starts.
--    Netlify gives each function instance its own memory, so an
--    in-process counter is not a limit — it is a suggestion.
--    One row per (key, window), incremented atomically.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key   TEXT        NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  hits         INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_key, window_start)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role touches this table.

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits (window_start);

/**
 * Consume one unit against a bucket. Returns TRUE when the caller is within
 * the limit, FALSE when it should be rejected.
 *
 * Fixed-window rather than sliding: cheaper, and precise enough for abuse
 * prevention. INSERT .. ON CONFLICT makes the increment atomic, so parallel
 * function instances cannot race past the limit.
 */
CREATE OR REPLACE FUNCTION consume_rate_limit(
  p_key      TEXT,
  p_limit    INT,
  p_window_s INT
) RETURNS BOOLEAN AS $$
DECLARE
  v_window TIMESTAMPTZ;
  v_hits   INT;
BEGIN
  v_window := to_timestamp(floor(extract(epoch FROM NOW()) / p_window_s) * p_window_s);

  INSERT INTO rate_limits (bucket_key, window_start, hits)
  VALUES (p_key, v_window, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET hits = rate_limits.hits + 1
  RETURNING hits INTO v_hits;

  RETURN v_hits <= p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

/** Housekeeping — call occasionally; the table is otherwise unbounded. */
CREATE OR REPLACE FUNCTION prune_rate_limits()
RETURNS void AS $$
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 day';
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_catalog;


-- ------------------------------------------------------------
-- 2. Product limits: check approval, not just plan.
--    The old trigger read subscription_plan and never looked at
--    vendors.status, so a pending, rejected or suspended vendor
--    could still create products.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_product_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan   subscription_plan;
  v_status vendor_status;
  v_limit  INT;
  v_count  INT;
BEGIN
  SELECT subscription_plan, status INTO v_plan, v_status
  FROM vendors WHERE id = NEW.vendor_id;

  IF v_status IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'Your vendor account is not approved, so products cannot be added yet.'
      USING ERRCODE = 'check_violation';
  END IF;

  v_limit := CASE v_plan
    WHEN 'starter' THEN 20
    WHEN 'growth'  THEN 50
    WHEN 'premium' THEN 2147483647   -- effectively unlimited
    ELSE 20                          -- no plan yet: Starter cap
  END;

  SELECT COUNT(*) INTO v_count
  FROM products
  WHERE vendor_id = NEW.vendor_id AND is_archived = FALSE;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'Product limit reached for your plan (max %). Upgrade to add more products.', v_limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_product_limit ON products;
CREATE TRIGGER trg_enforce_product_limit
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION enforce_product_limit();


-- ------------------------------------------------------------
-- 3. The seeded homepage hero still carried the pre-rebrand name
--    and pointed at /vendor/register, a route that no longer
--    exists. Fix the live row, not just the seed file.
-- ------------------------------------------------------------
UPDATE homepage_content
SET content = content
      || jsonb_build_object('secondary_cta_text', 'Sell on Stallspace')
      || jsonb_build_object('secondary_cta_url', '/join')
WHERE content->>'secondary_cta_text' ILIKE '%MARCRTE%'
   OR content->>'secondary_cta_url' = '/vendor/register';
