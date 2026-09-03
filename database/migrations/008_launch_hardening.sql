-- ============================================================
-- Stallspace — Launch hardening
-- Migration: 008_launch_hardening
--
-- 1. Close three privilege-escalation paths (role + vendor status)
-- 2. Add the columns the order lifecycle was missing
-- 3. Make the stock adjustment idempotent
-- 4. Keep categories.product_count accurate
-- 5. Per-vendor contact visibility
-- Idempotent — safe to re-run.
-- ============================================================


-- ------------------------------------------------------------
-- 1a. Signup must never trust a client-supplied role.
--     raw_user_meta_data is whatever the browser passed to
--     signUp(), so reading 'role' from it let anyone register
--     as an admin. New accounts are always customers; role
--     changes happen admin-side only.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;


-- ------------------------------------------------------------
-- 1b. A user may edit their own profile, but must never be able
--     to make themselves an admin.
--
--     The RLS policy alone cannot express this: on UPDATE,
--     Postgres reuses USING as the check, and (auth.uid() = id)
--     stays true after the row's role changes. Guard the column
--     with a trigger instead.
--
--     'admin' is the ONLY privileged role. customer <-> vendor is
--     a normal part of signing up to sell — /join/register does
--     exactly that self-promotion right after signUp — and the
--     vendor portal gates on the vendors row and its approval
--     status, not on this column. So block only admin.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.role = 'admin' OR OLD.role = 'admin')
     AND NEW.role IS DISTINCT FROM OLD.role
     AND NOT is_admin() THEN
    RAISE EXCEPTION 'the admin role may only be granted or removed by an administrator';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS trg_guard_profile_role ON profiles;
CREATE TRIGGER trg_guard_profile_role
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION guard_profile_role();


-- ------------------------------------------------------------
-- 1c. A vendor may edit their own storefront, but not their
--     approval status or their billing. Same missing-WITH CHECK
--     shape as above; same fix.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_vendor_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.status              IS DISTINCT FROM OLD.status
  OR NEW.subscription_plan   IS DISTINCT FROM OLD.subscription_plan
  OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
  OR NEW.reviewed_by         IS DISTINCT FROM OLD.reviewed_by THEN
    RAISE EXCEPTION 'vendor status and billing may only be changed by an administrator';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS trg_guard_vendor_fields ON vendors;
CREATE TRIGGER trg_guard_vendor_fields
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION guard_vendor_privileged_fields();


-- ------------------------------------------------------------
-- 1d. is_admin() is SECURITY DEFINER and every admin policy
--     depends on it — pin its search_path.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog;


-- ------------------------------------------------------------
-- 2. Order columns the lifecycle was missing.
--    fulfilment was accepted by the API and then dropped, so a
--    pending row could not be told apart from a collection one.
--    paid_at records money actually received — including cash
--    on collection, which no gateway will ever tell us about.
-- ------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfilment      TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at         TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_failure TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_adjusted  BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_orders_pending_lookup
  ON orders (status, created_at)
  WHERE status = 'pending';


-- ------------------------------------------------------------
-- 3. Make the stock adjustment idempotent.
--    The old trigger decremented on every pending -> confirmed
--    transition and restored nothing on the way back, so
--    toggling an order walked stock down repeatedly. Track
--    whether this order has already been adjusted.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION adjust_stock_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  item        JSONB;
  became_paid BOOLEAN;
  became_void BOOLEAN;
BEGIN
  became_paid := (OLD.status = 'pending' AND NEW.status = 'confirmed'
                  AND COALESCE(OLD.stock_adjusted, FALSE) = FALSE);

  became_void := (NEW.status IN ('cancelled', 'refunded')
                  AND OLD.status IN ('confirmed', 'processing', 'shipped', 'delivered', 'completed')
                  AND COALESCE(OLD.stock_adjusted, FALSE) = TRUE);

  IF became_paid THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
      UPDATE products
      SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - (item->>'quantity')::int)
      WHERE id = (item->>'product_id')::uuid
        AND track_inventory = TRUE
        AND stock_quantity IS NOT NULL;
    END LOOP;
    NEW.stock_adjusted := TRUE;

  ELSIF became_void THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
      UPDATE products
      SET stock_quantity = COALESCE(stock_quantity, 0) + (item->>'quantity')::int
      WHERE id = (item->>'product_id')::uuid
        AND track_inventory = TRUE
        AND stock_quantity IS NOT NULL;
    END LOOP;
    NEW.stock_adjusted := FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- BEFORE, not AFTER — the function now writes to NEW.stock_adjusted.
DROP TRIGGER IF EXISTS trg_adjust_stock ON orders;
CREATE TRIGGER trg_adjust_stock
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION adjust_stock_on_status_change();

-- Existing paid orders have already had their stock taken off.
UPDATE orders
SET stock_adjusted = TRUE
WHERE status IN ('confirmed', 'processing', 'shipped', 'delivered', 'completed')
  AND stock_adjusted = FALSE;


-- ------------------------------------------------------------
-- 4. categories.product_count was a denormalised column that
--    nothing ever wrote, so every category showed 0. Maintain
--    it from the products table.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_category_product_count()
RETURNS TRIGGER AS $$
DECLARE
  affected UUID[];
  cat      UUID;
BEGIN
  affected := ARRAY(
    SELECT DISTINCT c FROM unnest(ARRAY[
      CASE WHEN TG_OP <> 'INSERT' THEN OLD.category_id END,
      CASE WHEN TG_OP <> 'DELETE' THEN NEW.category_id END
    ]) AS c WHERE c IS NOT NULL
  );

  FOREACH cat IN ARRAY affected LOOP
    UPDATE categories
    SET product_count = (
      SELECT COUNT(*) FROM products
      WHERE category_id = cat
        AND is_available = TRUE
        AND is_archived  = FALSE
    )
    WHERE id = cat;
  END LOOP;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS trg_category_count ON products;
CREATE TRIGGER trg_category_count
  AFTER INSERT OR DELETE OR UPDATE OF category_id, is_available, is_archived ON products
  FOR EACH ROW EXECUTE FUNCTION refresh_category_product_count();

-- Backfill for everything already listed.
UPDATE categories c
SET product_count = (
  SELECT COUNT(*) FROM products p
  WHERE p.category_id = c.id
    AND p.is_available = TRUE
    AND p.is_archived  = FALSE
);


-- ------------------------------------------------------------
-- 5. Vendors control which contact details are public.
--     Defaults are TRUE so existing storefronts are unchanged.
-- ------------------------------------------------------------
ALTER TABLE vendor_store_settings ADD COLUMN IF NOT EXISTS show_email   BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE vendor_store_settings ADD COLUMN IF NOT EXISTS show_phone   BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE vendor_store_settings ADD COLUMN IF NOT EXISTS show_address BOOLEAN NOT NULL DEFAULT TRUE;

-- The storefront is public, so the public read policy must expose
-- these flags. Re-assert it rather than assume 002 is present.
DROP POLICY IF EXISTS "Anyone can view store settings" ON vendor_store_settings;
CREATE POLICY "Anyone can view store settings" ON vendor_store_settings
  FOR SELECT USING (TRUE);


-- ------------------------------------------------------------
-- 6. Enquiry notifications must fire once.
--    /api/notifications/send accepted enquiry.new unauthenticated
--    with no already-sent guard, so a loop emailed a vendor
--    without limit.
-- ------------------------------------------------------------
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
