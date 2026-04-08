/** Canonical public site origin (no trailing slash). Used for metadata, sitemap, robots. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'https://eliorasignaturecatering.com.au'
  return raw.replace(/\/$/, '')
}
