-- ============================================================
-- Stallspace — Pay on collection (no online payment required)
-- Migration: 007_pay_on_collection
--
-- Lets a vendor accept orders without any payment gateway: the customer
-- collects from the store and pays there. Vendors who don't want PayFast
-- can still trade on the marketplace.
-- Idempotent.
-- ============================================================

-- New payment "provider" representing payment handed over at collection.
ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'cash_on_collection';

-- Vendor opt-in. Only meaningful when the vendor offers collection
-- (fulfilment_type = 'collection' or 'both').
ALTER TABLE vendor_store_settings
  ADD COLUMN IF NOT EXISTS pay_on_collection BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN vendor_store_settings.pay_on_collection IS
  'When true, customers may place a collection order and pay the vendor on collection.';
