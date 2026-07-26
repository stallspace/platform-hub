-- ============================================================
-- Stallspace — Inventory handling + 'completed' order status
-- Migration: 003_stock_and_completed_status
-- Idempotent where possible.
-- ============================================================

-- ------------------------------------------------------------
-- 1. New terminal order status: 'completed'
--    (customer has received a delivery or collected their order)
-- ------------------------------------------------------------
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed';

-- ------------------------------------------------------------
-- 2. Automatic stock adjustment on order status changes
--    - Decrement when an order becomes paid (pending -> confirmed)
--    - Restore when a previously-active order is cancelled or refunded
--    Only affects products with track_inventory = TRUE and a set stock level.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION adjust_stock_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  item        JSONB;
  became_paid BOOLEAN;
  became_void BOOLEAN;
BEGIN
  became_paid := (OLD.status = 'pending' AND NEW.status = 'confirmed');
  became_void := (NEW.status IN ('cancelled', 'refunded')
                  AND OLD.status IN ('confirmed', 'processing', 'shipped', 'delivered', 'completed'));

  IF became_paid THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
      UPDATE products
      SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - (item->>'quantity')::int)
      WHERE id = (item->>'product_id')::uuid
        AND track_inventory = TRUE
        AND stock_quantity IS NOT NULL;
    END LOOP;

  ELSIF became_void THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
      UPDATE products
      SET stock_quantity = COALESCE(stock_quantity, 0) + (item->>'quantity')::int
      WHERE id = (item->>'product_id')::uuid
        AND track_inventory = TRUE
        AND stock_quantity IS NOT NULL;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_adjust_stock ON orders;
CREATE TRIGGER trg_adjust_stock
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION adjust_stock_on_status_change();
