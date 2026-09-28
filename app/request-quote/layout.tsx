import type { Metadata } from 'next'
import { getPageUrl } from '@/lib/siteUrl'

const url = getPageUrl('/request-quote')

export const metadata: Metadata = {
  alternates: { canonical: url },
}

export default function RequestQuoteLayout({ children }: { children: React.ReactNode }) {
  return children
}
