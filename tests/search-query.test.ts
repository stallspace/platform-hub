import { test } from 'node:test'
import assert from 'node:assert/strict'

const { sanitiseSearchQuery, substringFilter, likePattern, PRODUCT_SEARCH_COLUMNS } =
  await import('../src/lib/search/query.ts')

test('ordinary queries pass through unchanged', () => {
  assert.equal(sanitiseSearchQuery('oud in bloom'), 'oud in bloom')
  assert.equal(sanitiseSearchQuery('Eau De Parfum'), 'Eau De Parfum')
})

test('characters that break the PostgREST filter grammar are stripped', () => {
  // Commas and parentheses are structural in a PostgREST `or()` filter — left
  // in, a query like "a,b" would be read as two separate conditions.
  assert.equal(sanitiseSearchQuery('smoker,s (choice)'), 'smoker s choice')
  assert.equal(sanitiseSearchQuery('100% pure'), '100 pure')
  assert.equal(sanitiseSearchQuery('back\\slash'), 'back slash')
})

test('whitespace is collapsed and trimmed', () => {
  assert.equal(sanitiseSearchQuery('  oud    bloom  '), 'oud bloom')
  assert.equal(sanitiseSearchQuery('\n\tperfume\n'), 'perfume')
})

test('a very long query is capped', () => {
  assert.equal(sanitiseSearchQuery('x'.repeat(500)).length, 100)
})

test('an empty or whitespace-only query comes back empty', () => {
  assert.equal(sanitiseSearchQuery(''), '')
  assert.equal(sanitiseSearchQuery('     '), '')
  assert.equal(sanitiseSearchQuery(',,,()'), '')
})

test('ILIKE wildcards in user input cannot widen the match', () => {
  // Without this, searching "%" would match every product in the catalogue.
  assert.equal(likePattern('%'), '% %')
  assert.equal(likePattern('a_b'), '%a b%')
  assert.equal(likePattern('oud'), '%oud%')
})

test('the fallback filter covers every configured column', () => {
  const filter = substringFilter(PRODUCT_SEARCH_COLUMNS, 'oud')
  assert.equal(filter, 'name.ilike.%oud%,description.ilike.%oud%')
})

test('the fallback filter handles a multi-word query', () => {
  const filter = substringFilter(PRODUCT_SEARCH_COLUMNS, 'oud bloom')
  assert.ok(filter.includes('name.ilike.%oud bloom%'))
  assert.ok(filter.includes('description.ilike.%oud bloom%'))
})
