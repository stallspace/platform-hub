-- ============================================================
-- Stallspace — guarantee the fulfilment columns the storefront reads
-- Migration: 015_fulfilment_columns
--
-- src/lib/vendors/fulfilment.ts is now the single source of a vendor's
-- published delivery terms, and it selects these columns from
-- vendor_store_settings. Two of them (free_delivery_threshold,
-- estimated_delivery_time) were added to production outside the migration
-- files, so a fresh database built from migrations alone would not have them
-- and every storefront and product page would 400.
--
-- Idempotent. Safe to re-run against production, where these already exist.
-- ============================================================

ALTER TABLE vendor_store_settings
  ADD COLUMN IF NOT EXISTS free_delivery_threshold NUMERIC(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN vendor_store_settings.free_delivery_threshold IS
  'Order subtotal at or above which delivery is free. 0 means no threshold, not free delivery.';

ALTER TABLE vendor_store_settings
  ADD COLUMN IF NOT EXISTS estimated_delivery_time TEXT;

COMMENT ON COLUMN vendor_store_settings.estimated_delivery_time IS
  'Free-text delivery estimate the vendor publishes, e.g. "2 to 4 business days".';

-- The same fields also exist on vendors, written by nothing and read by
-- nobody since the storefront moved to vendor_store_settings. Left in place
-- rather than dropped, because dropping a column is not reversible and the
-- data may predate Store Settings.
COMMENT ON TABLE vendor_store_settings IS
  'A vendor''s published trading terms. Authoritative for delivery pricing: /api/orders/route.ts bills from this row.';
