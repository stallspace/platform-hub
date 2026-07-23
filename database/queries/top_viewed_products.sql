-- Most-viewed products across the marketplace (top 25).
SELECT
  p.name,
  v.business_name AS vendor,
  p.view_count,
  p.price,
  p.is_available
FROM products p
JOIN vendors v ON v.id = p.vendor_id
WHERE p.is_archived = FALSE
ORDER BY p.view_count DESC
LIMIT 25;
