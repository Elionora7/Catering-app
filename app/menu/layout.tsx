import type { Metadata } from 'next'
import { getPageUrl } from '@/lib/siteUrl'

const menuUrl = getPageUrl('/menu')

const menuTitle = 'Lebanese Catering Menu Sydney | Platters, BBQ & Mezze'
const menuDescription =
  'Browse the Lebanese catering menu: BBQ platters, mezze, Mediterranean mains, and desserts. Delivery across Sydney. Order online or request a quote.'

/** Use generateMetadata (not a static metadata export) so this merges with the root generateMetadata. */
export function generateMetadata(): Metadata {
  return {
    title: { absolute: menuTitle },
    description: menuDescription,
    keywords: [
      'Lebanese catering menu Sydney',
      'Mediterranean catering menu',
      'authentic Lebanese food catering',
      'catering platters Sydney',
      'BBQ catering Sydney',
      'mezze catering Sydney',
    ],
    openGraph: {
      title: menuTitle,
      description: menuDescription,
      url: menuUrl,
      type: 'website',
      locale: 'en_AU',
      siteName: 'Eliora Signature Catering',
    },
    twitter: {
      card: 'summary_large_image',
      title: menuTitle,
      description: menuDescription,
    },
    alternates: {
      canonical: menuUrl,
    },
  }
}

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return children
}
