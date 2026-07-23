-- Vendors whose next billing date is within 7 days or already past — i.e. who to
-- send an EFT payment reminder to. Excludes cancelled vendors.
SELECT
  business_name,
  email,
  subscription_plan,
  subscription_status,
  subscription_next_billing::date AS next_billing,
  (subscription_next_billing::date - CURRENT_DATE) AS days_until_due
FROM vendors
WHERE subscription_status IS DISTINCT FROM 'cancelled'
  AND subscription_next_billing IS NOT NULL
  AND subscription_next_billing::date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY subscription_next_billing ASC;
