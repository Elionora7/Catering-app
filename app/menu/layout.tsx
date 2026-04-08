import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/siteUrl'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Menu — Lebanese & Mediterranean Catering Sydney',
  description:
    'Browse Eliora Signature Catering’s menu: authentic Lebanese and Mediterranean platters, finger food, salads, and daily meal options for family and events across Sydney.',
  keywords: [
    'Lebanese catering menu Sydney',
    'Mediterranean catering menu',
    'authentic Lebanese food catering',
    'catering platters Sydney',
    'family meals catering',
  ],
  openGraph: {
    title: 'Menu | Eliora Signature Catering — Lebanese & Mediterranean Sydney',
    description:
      'Lebanese and Mediterranean catering menu: platters, events, and daily family meals — Eliora Signature Catering.',
    url: `${siteUrl}/menu`,
    type: 'website',
    locale: 'en_AU',
    siteName: 'Eliora Signature Catering',
  },
  alternates: {
    canonical: `${siteUrl}/menu`,
  },
}

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return children
}
