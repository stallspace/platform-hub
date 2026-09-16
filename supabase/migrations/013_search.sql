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
-- A stored generated column fixes all three and lets both search
-- surfaces behave the same way.
-- Idempotent — safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- Products. Weighted so a match on the product name ranks above
-- a match on a tag, which ranks above one in the description.
-- coalesce throughout: a missing description must not blank the
-- whole vector.
-- ------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING GIN (search_vector);

-- The expression index nothing could use.
DROP INDEX IF EXISTS idx_products_fts;

-- ------------------------------------------------------------
-- Vendors, so searching the marketplace finds stores too.
-- ------------------------------------------------------------
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(business_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(business_description, '')), 'B')
  ) STORED;

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
