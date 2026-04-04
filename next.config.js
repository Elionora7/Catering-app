/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // In dev, avoid stale optimized images when you replace files under public/ with the same filename
    minimumCacheTTL: process.env.NODE_ENV === 'development' ? 0 : 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig

