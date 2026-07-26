/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Type-checking still runs and must pass; we just don't let ESLint style
  // warnings block a production deploy. (Run `npm run lint` manually anytime.)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
