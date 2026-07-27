-- ============================================================
-- Stallspace — Public storage bucket for site/homepage assets
-- Migration: 004_site_assets_bucket
-- Used by the admin Content page to upload hero / promo banner images.
-- Idempotent.
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for everything in the bucket (banners are shown on the public homepage).
DROP POLICY IF EXISTS "Public read site-assets" ON storage.objects;
CREATE POLICY "Public read site-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-assets');

-- Writes happen server-side via the service role (admin-gated route), which
-- bypasses RLS — so no INSERT/UPDATE policy is required here.
