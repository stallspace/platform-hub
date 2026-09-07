import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stallspace.co.za'

/**
 * Without this file every route was crawlable by default, including the
 * admin, vendor, account and checkout areas.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/vendor',
          '/vendor/',
          '/account',
          '/account/',
          '/auth/',
          '/api/',
          '/marketplace/checkout',
          '/marketplace/cart',
          '/marketplace/compare',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
