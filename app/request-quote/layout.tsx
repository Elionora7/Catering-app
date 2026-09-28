import type { Metadata } from 'next'
import { getPageUrl } from '@/lib/siteUrl'

/** Use generateMetadata (not a static metadata export) so this merges with the root generateMetadata. */
export function generateMetadata(): Metadata {
  const url = getPageUrl('/request-quote')
  return {
    alternates: { canonical: url },
    openGraph: { url },
  }
}

export default function RequestQuoteLayout({ children }: { children: React.ReactNode }) {
  return children
}
