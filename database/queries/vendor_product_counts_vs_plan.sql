-- Product count per vendor vs their plan limit (Starter 20, Growth 50, Premium unlimited).
-- Useful for spotting vendors near or at their cap.
SELECT
  v.business_name,
  v.subscription_plan,
  COUNT(p.id) FILTER (WHERE p.is_archived = FALSE) AS active_products,
  CASE v.subscription_plan
    WHEN 'starter' THEN '20'
    WHEN 'growth'  THEN '50'
    WHEN 'premium' THEN 'unlimited'
    ELSE '20 (no plan)'
  END AS product_limit
FROM vendors v
LEFT JOIN products p ON p.vendor_id = v.id
GROUP BY v.id, v.business_name, v.subscription_plan
ORDER BY active_products DESC;
