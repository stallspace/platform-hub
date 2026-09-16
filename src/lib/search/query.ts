/**
 * Shared search behaviour for the marketplace.
 *
 * Two surfaces search products — /marketplace/search and
 * /marketplace/products — and they used to do it differently: one with
 * `name ILIKE '%q%'`, the other with full-text search on `name` alone.
 * Neither could use an index. This module is the single definition of what
 * searching means here, so the two agree.
 *
 * The strategy is full-text first, substring second:
 *
 *   FTS handles multi-word queries in any order ("bloom oud" finds "Oud in
 *   Bloom"), stems plurals and tenses, searches name, tags and description
 *   together, and uses a GIN index.
 *
 *   What it cannot do is match part of a word — "perf" will never match
 *   "Perfume", because stemming is not prefix matching. A shopper typing into
 *   a search box does that constantly, so when FTS finds nothing we retry with
 *   a substring match rather than show an empty page.
 */

/**
 * Strip characters that break PostgREST's filter syntax or confuse the
 * tsquery parser. `websearch_to_tsquery` is forgiving — unlike `to_tsquery`
 * it never throws on odd input — but the PostgREST URL grammar is not.
 */
export function sanitiseSearchQuery(raw: string): string {
  return raw
    .replace(/[,()%*\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
}

/** Escape the wildcards in a value going into an ILIKE pattern. */
export function likePattern(q: string): string {
  return `%${q.replace(/[%_]/g, ' ')}%`
}

export const PRODUCT_SEARCH_COLUMNS = 'name,description'
export const VENDOR_SEARCH_COLUMNS = 'business_name,business_description'

/**
 * Build the `.or()` filter used for the substring fallback.
 * Kept here so both surfaces fall back identically.
 */
export function substringFilter(columns: string, q: string): string {
  const pattern = likePattern(q)
  return columns
    .split(',')
    .map((c) => `${c}.ilike.${pattern}`)
    .join(',')
}
