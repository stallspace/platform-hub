-- ============================================================
-- Stallspace — Only show products from APPROVED vendors publicly
-- Migration: 005_hide_unapproved_vendor_products
--
-- Previously the public products policy only checked is_available/is_archived,
-- so a suspended (or pending/rejected) vendor's products could still appear in
-- listings and search. This ties public product visibility to vendor approval,
-- enforcing it everywhere regardless of the query. Vendors still see and manage
-- their own products (separate policy), and admins see all.
-- Idempotent.
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view available products" ON products;
CREATE POLICY "Anyone can view available products" ON products
  FOR SELECT USING (
    is_available = TRUE
    AND is_archived = FALSE
    AND EXISTS (
      SELECT 1 FROM vendors
      WHERE vendors.id = products.vendor_id
        AND vendors.status = 'approved'
    )
  );
