-- ============================================================
-- Stallspace — Security Hardening & Schema Reconciliation
-- Migration: 002_security_hardening
--
-- Idempotent: safe to run more than once. Reconciles tables that were added
-- to the live database directly (customer_addresses, customer_favourites,
-- vendor_store_settings), locks down payment credentials, adds admin policies,
-- and enforces per-plan product limits at the database level.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Reconcile tables that drifted out of migration control
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'South Africa',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

CREATE TABLE IF NOT EXISTS vendor_store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE UNIQUE,
  fulfilment_type TEXT NOT NULL DEFAULT 'delivery',    -- 'delivery' | 'collection' | 'both'
  delivery_areas TEXT[] NOT NULL DEFAULT '{}',
  delivery_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  collection_address TEXT,
  collection_hours TEXT,
  collection_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON vendor_store_settings;
CREATE TRIGGER trg_store_settings_updated_at BEFORE UPDATE ON vendor_store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE customer_addresses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favourites    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_store_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views          ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_views            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_content       ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------
-- 2. Lock down vendor payment credentials
--    Only the owning vendor may read/write. NO public read.
--    (The server uses the service-role key, which bypasses RLS, for checkout.)
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can view payment configs"            ON vendor_payment_configs;
DROP POLICY IF EXISTS "Public can view payment configs"            ON vendor_payment_configs;
DROP POLICY IF EXISTS "Vendors can manage their payment config"    ON vendor_payment_configs;

CREATE POLICY "Vendors manage own payment config" ON vendor_payment_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM vendors WHERE id = vendor_payment_configs.vendor_id AND user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- 3. Customer-owned data policies
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Customers manage own addresses" ON customer_addresses;
CREATE POLICY "Customers manage own addresses" ON customer_addresses
  FOR ALL USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customers manage own favourites" ON customer_favourites;
CREATE POLICY "Customers manage own favourites" ON customer_favourites
  FOR ALL USING (customer_id = auth.uid());

-- ------------------------------------------------------------
-- 4. Store settings — public read (checkout needs delivery info),
--    vendor write, admin manage.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can view store settings" ON vendor_store_settings;
CREATE POLICY "Anyone can view store settings" ON vendor_store_settings
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Vendors manage own store settings" ON vendor_store_settings;
CREATE POLICY "Vendors manage own store settings" ON vendor_store_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM vendors WHERE id = vendor_store_settings.vendor_id AND user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- 5. Analytics — public INSERT only (tracking), no public read.
--    Writes actually go through the service role; these policies are a safety net.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Vendors read own product views" ON product_views;
CREATE POLICY "Vendors read own product views" ON product_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM vendors WHERE id = product_views.vendor_id AND user_id = auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "Vendors read own store views" ON store_views;
CREATE POLICY "Vendors read own store views" ON store_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM vendors WHERE id = store_views.vendor_id AND user_id = auth.uid())
    OR is_admin()
  );

-- ------------------------------------------------------------
-- 6. Admin & vendor policies for existing tables
-- ------------------------------------------------------------

-- Orders: vendors + customers already covered in 001. Add admin manage.
DROP POLICY IF EXISTS "Admins manage all orders" ON orders;
CREATE POLICY "Admins manage all orders" ON orders
  FOR ALL USING (is_admin());

-- Reviews: vendors manage their own, admins manage all.
DROP POLICY IF EXISTS "Vendors manage own reviews" ON reviews;
CREATE POLICY "Vendors manage own reviews" ON reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM vendors WHERE id = reviews.vendor_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage all reviews" ON reviews;
CREATE POLICY "Admins manage all reviews" ON reviews
  FOR ALL USING (is_admin());

-- Enquiries: admins manage all (vendors already covered in 001).
DROP POLICY IF EXISTS "Admins manage all enquiries" ON enquiries;
CREATE POLICY "Admins manage all enquiries" ON enquiries
  FOR ALL USING (is_admin());

-- Subscription events: vendor read own, admin manage.
DROP POLICY IF EXISTS "Vendors read own billing events" ON subscription_events;
CREATE POLICY "Vendors read own billing events" ON subscription_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM vendors WHERE id = subscription_events.vendor_id AND user_id = auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "Admins manage billing events" ON subscription_events;
CREATE POLICY "Admins manage billing events" ON subscription_events
  FOR ALL USING (is_admin());

-- Categories: public read, admin manage.
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage categories" ON categories;
CREATE POLICY "Admins manage categories" ON categories
  FOR ALL USING (is_admin());

-- Homepage content: public read active, admin manage.
DROP POLICY IF EXISTS "Anyone can view homepage content" ON homepage_content;
CREATE POLICY "Anyone can view homepage content" ON homepage_content
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins manage homepage content" ON homepage_content;
CREATE POLICY "Admins manage homepage content" ON homepage_content
  FOR ALL USING (is_admin());

-- Audit logs: admin read only (writes via service role).
DROP POLICY IF EXISTS "Admins read audit logs" ON audit_logs;
CREATE POLICY "Admins read audit logs" ON audit_logs
  FOR SELECT USING (is_admin());

-- Vendor documents: vendor manage own, admin read.
DROP POLICY IF EXISTS "Vendors manage own documents" ON vendor_documents;
CREATE POLICY "Vendors manage own documents" ON vendor_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM vendors WHERE id = vendor_documents.vendor_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins read vendor documents" ON vendor_documents;
CREATE POLICY "Admins read vendor documents" ON vendor_documents
  FOR SELECT USING (is_admin());

-- ------------------------------------------------------------
-- 7. Enforce per-plan product limits at the database level
--    (cannot be bypassed by the client). NULL plan / unapproved
--    vendors get the Starter cap as a floor.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_product_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_plan  subscription_plan;
  v_limit INT;
  v_count INT;
BEGIN
  SELECT subscription_plan INTO v_plan FROM vendors WHERE id = NEW.vendor_id;

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
-- 8. Helpful indexes for the reconciled tables
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer   ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_favourites_customer  ON customer_favourites(customer_id);
CREATE INDEX IF NOT EXISTS idx_store_settings_vendor         ON vendor_store_settings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status                 ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number           ON orders(order_number);
