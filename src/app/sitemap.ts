import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stallspace.co.za'

// Storefronts and products change as vendors edit them, so this must not be
// baked at build time.
export const revalidate = 3600

/**
 * Vendor storefronts and product pages are the whole value proposition to
 * vendors, and Google had no way to discover any of them.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`,                            changeFrequency: 'daily',   priority: 1 },
    { url: `${APP_URL}/marketplace`,                 changeFrequency: 'daily',   priority: 0.9 },
    { url: `${APP_URL}/marketplace/products`,        changeFrequency: 'daily',   priority: 0.9 },
    { url: `${APP_URL}/marketplace/vendors`,         changeFrequency: 'daily',   priority: 0.8 },
    { url: `${APP_URL}/join`,                        changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/contact`,                     changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${APP_URL}/legal/terms-of-service`,      changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${APP_URL}/legal/privacy-policy`,        changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${APP_URL}/legal/returns-and-refunds`,   changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${APP_URL}/legal/delivery`,              changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${APP_URL}/legal/popia`,                 changeFrequency: 'yearly',  priority: 0.3 },
  ]

  try {
    // Deliberately the cookie-free client. The session-aware one calls
    // next/headers cookies(), which makes this route dynamic and fails the
    // build with "couldn't be rendered statically".
    const supabase = createPublicClient()

    // Hard ceiling on the database round trip. This route runs during
    // `next build`; without a timeout, a slow or unreachable Supabase (it is
    // in Germany, ~200ms away on a good day) turns a deploy into a hang rather
    // than a clean failure. Falling back to the static routes is much better
    // than a stuck build.
    const withTimeout = <T,>(work: Promise<T>, ms = 10_000): Promise<T> =>
      Promise.race([
        work,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('sitemap: database timed out')), ms)
        ),
      ])

    const [{ data: vendors }, { data: products }, { data: categories }] = await withTimeout(Promise.all([
      supabase
        .from('vendors')
        .select('slug, updated_at')
        .eq('status', 'approved')
        .limit(5000),
      supabase
        .from('products')
        .select('slug, updated_at')
        .eq('is_available', true)
        .eq('is_archived', false)
        .limit(20000),
      supabase.from('categories').select('slug').limit(200),
    ]))

    const vendorRoutes: MetadataRoute.Sitemap = (vendors ?? []).map((v) => ({
      url: `${APP_URL}/marketplace/store/${v.slug}`,
      lastModified: v.updated_at ? new Date(v.updated_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${APP_URL}/marketplace/products/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
      url: `${APP_URL}/marketplace/products?category=${c.slug}`,
      changeFrequency: 'weekly',
      priority: 0.5,
    }))

    return [...staticRoutes, ...vendorRoutes, ...productRoutes, ...categoryRoutes]
  } catch (e) {
    // A database hiccup must not produce a 500 for Googlebot — serve what we
    // can and let the next revalidation pick up the rest.
    console.error('[sitemap]', e)
    return staticRoutes
  }
}
