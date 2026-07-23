-- Vendors awaiting admin review (pending or under review), oldest first.
SELECT
  business_name,
  owner_name,
  email,
  phone,
  status,
  created_at
FROM vendors
WHERE status IN ('pending', 'under_review')
ORDER BY created_at ASC;
