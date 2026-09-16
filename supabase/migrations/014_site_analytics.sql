-- ============================================================
-- Stallspace — Site-wide visit tracking
-- Migration: 014_site_analytics
--
-- store_views and product_views already record visits to a
-- storefront or a product page, but nothing recorded a visit to
-- the marketplace itself — so "how many people are visiting the
-- site" could only ever be answered for people who happened to
-- open a store. This records every marketplace page view.
--
-- PRIVACY: session_id is a random value held in sessionStorage
-- for the length of one browsing session. No IP address, no
-- cookie, nothing that identifies a person, and it is gone when
-- the tab closes. That keeps this outside POPIA's definition of
-- personal information, and it is why the numbers below are
-- "sessions" rather than "people".
-- Idempotent — safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS page_views (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path       TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Written by the service role only (see /api/track), read by admins.
DROP POLICY IF EXISTS "Admins can read page views" ON page_views;
CREATE POLICY "Admins can read page views" ON page_views
  FOR SELECT USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session    ON page_views (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path       ON page_views (path, created_at DESC);

-- The existing view tables were never indexed for time-range reporting.
CREATE INDEX IF NOT EXISTS idx_store_views_created_at   ON store_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_views_vendor_time  ON store_views (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_created_at ON product_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_vendor     ON product_views (vendor_id, created_at DESC);

/**
 * Daily unique sessions and total page views, for the admin chart.
 *
 * Done in SQL rather than pulling every row into the app: at any real traffic
 * level that is thousands of rows to count client-side, and Supabase sits
 * ~200ms away.
 */
CREATE OR REPLACE FUNCTION admin_daily_traffic(p_days INT DEFAULT 30)
RETURNS TABLE (day DATE, visitors BIGINT, views BIGINT) AS $$
  SELECT
    d::date AS day,
    COUNT(DISTINCT pv.session_id) AS visitors,
    COUNT(pv.id) AS views
  FROM generate_series(
         (NOW() - (p_days - 1) * INTERVAL '1 day')::date,
         NOW()::date,
         INTERVAL '1 day'
       ) AS d
  LEFT JOIN page_views pv
    ON pv.created_at >= d
   AND pv.created_at <  d + INTERVAL '1 day'
  GROUP BY d
  ORDER BY d;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog;

/**
 * Visits per storefront over a window, so the admin can see which stores are
 * actually getting traffic. Counts both the storefront page and that vendor's
 * product pages, because both are visits to that vendor.
 */
CREATE OR REPLACE FUNCTION admin_store_traffic(p_days INT DEFAULT 30)
RETURNS TABLE (
  vendor_id UUID,
  business_name TEXT,
  slug TEXT,
  store_views BIGINT,
  product_views BIGINT,
  visitors BIGINT
) AS $$
  WITH windowed AS (
    SELECT sv.vendor_id, sv.session_id, 1 AS is_store, 0 AS is_product
    FROM store_views sv
    WHERE sv.created_at >= NOW() - (p_days || ' days')::interval
    UNION ALL
    SELECT pv.vendor_id, pv.session_id, 0, 1
    FROM product_views pv
    WHERE pv.created_at >= NOW() - (p_days || ' days')::interval
  )
  SELECT
    v.id,
    v.business_name,
    v.slug,
    COALESCE(SUM(w.is_store), 0)::bigint,
    COALESCE(SUM(w.is_product), 0)::bigint,
    COUNT(DISTINCT w.session_id)::bigint
  FROM vendors v
  LEFT JOIN windowed w ON w.vendor_id = v.id
  WHERE v.status = 'approved'
  GROUP BY v.id, v.business_name, v.slug
  ORDER BY COUNT(DISTINCT w.session_id) DESC, v.business_name;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION admin_daily_traffic(INT) FROM anon;
REVOKE EXECUTE ON FUNCTION admin_store_traffic(INT) FROM anon;

/** Housekeeping — page_views is otherwise unbounded. */
CREATE OR REPLACE FUNCTION prune_page_views()
RETURNS void AS $$
  DELETE FROM page_views WHERE created_at < NOW() - INTERVAL '400 days';
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_catalog;
