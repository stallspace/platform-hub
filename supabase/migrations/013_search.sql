-- ============================================================
-- Stallspace — Search that can actually use an index
-- Migration: 013_search
--
-- Three problems with what was there:
--
-- 1. idx_products_fts was built on the expression
--    to_tsvector('english', name || ' ' || description). No query
--    could match that expression, so the index was never used —
--    and because `||` with a NULL description yields NULL, any
--    product without a description was not indexed at all.
-- 2. /marketplace/search used name/description ILIKE '%q%', which
--    cannot use any index and only matches a contiguous substring:
--    "bloom oud" finds nothing, "perfumes" misses "perfume".
-- 3. /marketplace/products used textSearch on `name` alone, so
--    descriptions and tags were invisible to it.
--
-- NOTE ON THE IMPLEMENTATION: this uses a trigger-maintained
-- column rather than GENERATED ALWAYS AS. A generated column
-- requires a strictly IMMUTABLE expression, and array_to_string()
-- is only STABLE — it calls the element type's output function,
-- which Postgres cannot assume is immutable. Including `tags` in
-- the vector therefore rules generated columns out.
--
-- Idempotent — safe to re-run.
-- ============================================================

-- A partially-applied earlier attempt may have left a generated column
-- behind. Drop before recreating so this is genuinely re-runnable.
ALTER TABLE products DROP COLUMN IF EXISTS search_vector;
ALTER TABLE vendors  DROP COLUMN IF EXISTS search_vector;

ALTER TABLE products ADD COLUMN search_vector tsvector;
ALTER TABLE vendors  ADD COLUMN search_vector tsvector;


-- ------------------------------------------------------------
-- Products. Weighted so a match on the product name ranks above
-- a match on a tag, which ranks above one in the description.
-- coalesce throughout: a missing description must not blank the
-- whole vector, which is exactly what the old index got wrong.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION products_search_vector_refresh()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_search_vector ON products;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF name, description, tags ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_refresh();

-- Backfill. Sets search_vector directly rather than relying on the trigger,
-- which only fires when one of the watched columns is written.
UPDATE products
SET search_vector =
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'B') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'C');

CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING GIN (search_vector);

-- The expression index nothing could use.
DROP INDEX IF EXISTS idx_products_fts;


-- ------------------------------------------------------------
-- Vendors, so searching the marketplace finds stores too.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION vendors_search_vector_refresh()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.business_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.business_description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vendors_search_vector ON vendors;
CREATE TRIGGER trg_vendors_search_vector
  BEFORE INSERT OR UPDATE OF business_name, business_description ON vendors
  FOR EACH ROW EXECUTE FUNCTION vendors_search_vector_refresh();

UPDATE vendors
SET search_vector =
  setweight(to_tsvector('english', coalesce(business_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(business_description, '')), 'B');

CREATE INDEX IF NOT EXISTS idx_vendors_search_vector
  ON vendors USING GIN (search_vector);


-- ------------------------------------------------------------
-- Trigram indexes for the substring fallback.
--
-- Full-text search matches whole words, so a shopper typing
-- "perf" gets nothing for "Perfume" — stemming does not do
-- prefixes. The app falls back to ILIKE when FTS finds nothing,
-- and these make that fallback use an index instead of scanning.
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_vendors_business_name_trgm
  ON vendors USING GIN (business_name gin_trgm_ops);
