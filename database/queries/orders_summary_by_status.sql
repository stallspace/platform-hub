-- Order counts and value grouped by status (all vendors).
SELECT
  status,
  COUNT(*)     AS orders,
  SUM(total)   AS total_value
FROM orders
GROUP BY status
ORDER BY orders DESC;
