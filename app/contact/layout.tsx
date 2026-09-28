import type { Metadata } from 'next'
import { getPageUrl } from '@/lib/siteUrl'

const url = getPageUrl('/contact')

export const metadata: Metadata = {
  alternates: { canonical: url },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
