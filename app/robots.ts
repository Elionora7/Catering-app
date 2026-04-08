import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/siteUrl'

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl()
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin-login', '/api/', '/auth/', '/profile', '/cart', '/checkout'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
