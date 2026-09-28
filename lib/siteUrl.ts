/** Canonical public site origin (no trailing slash). Used for metadata, sitemap, robots. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'https://eliorasignaturecatering.com.au'
  return raw.replace(/\/$/, '')
}

/** Absolute URL for the current pathname. Matches Next.js default URLs (no trailing slash). */
export function getPageUrl(pathname: string): string {
  const base = getSiteUrl()
  const pathOnly = pathname.split('?')[0]?.split('#')[0] ?? '/'
  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`
  if (withLeadingSlash === '/') return base
  return `${base}${withLeadingSlash.replace(/\/+$/, '')}`
}

/** Cart, checkout, account, auth, and admin routes must not be indexed. */
export function isNoIndexPath(pathname: string): boolean {
  const path = (pathname.split('?')[0] || '/').replace(/\/+$/, '') || '/'
  return (
    path === '/cart' ||
    path === '/checkout' ||
    path === '/profile' ||
    path.startsWith('/admin') ||
    path.startsWith('/auth')
  )
}
