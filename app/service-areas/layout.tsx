import type { Metadata } from 'next'
import { getPageUrl } from '@/lib/siteUrl'

const url = getPageUrl('/service-areas')

export const metadata: Metadata = {
  alternates: { canonical: url },
}

export default function ServiceAreasLayout({ children }: { children: React.ReactNode }) {
  return children
}
