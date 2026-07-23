-- Subscription revenue by month, from recorded payments (charge_success events).
-- This reflects money actually collected (admin "Record Payment" logs these).
SELECT
  to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
  COUNT(*)          AS payments,
  SUM(amount)       AS total_revenue
FROM subscription_events
WHERE event_type = 'charge_success'
GROUP BY date_trunc('month', created_at)
ORDER BY month DESC;
