import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/siteUrl'

/** Public marketing URLs only — helps search engines discover main pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const paths: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'] }[] =
    [
      { path: '', priority: 1, changeFrequency: 'weekly' },
      { path: '/menu', priority: 0.9, changeFrequency: 'weekly' },
      { path: '/contact', priority: 0.8, changeFrequency: 'monthly' },
      { path: '/service-areas', priority: 0.8, changeFrequency: 'monthly' },
      { path: '/request-quote', priority: 0.7, changeFrequency: 'monthly' },
    ]

  const now = new Date()
  return paths.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}
