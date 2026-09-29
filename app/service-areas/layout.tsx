import type { Metadata } from 'next'
import { getPageUrl } from '@/lib/siteUrl'

const serviceAreasUrl = getPageUrl('/service-areas')

const serviceAreasTitle = 'Lebanese Catering Delivery Across Sydney | Eliora'
const serviceAreasDescription =
  'Lebanese catering delivery across Sydney: Bankstown, Parramatta, Inner West, South West, CBD, plus Vaucluse, Watsons Bay, Mosman, and Double Bay.'

/** Use generateMetadata (not a static metadata export) so this merges with the root generateMetadata. */
export function generateMetadata(): Metadata {
  return {
    title: { absolute: serviceAreasTitle },
    description: serviceAreasDescription,
    keywords: [
      'Lebanese catering delivery Sydney',
      'Lebanese catering Sydney',
      'catering Bankstown',
      'catering Parramatta',
      'corporate catering Sydney',
    ],
    openGraph: {
      title: serviceAreasTitle,
      description: serviceAreasDescription,
      url: serviceAreasUrl,
      type: 'website',
      locale: 'en_AU',
      siteName: 'Eliora Signature Catering',
    },
    twitter: {
      card: 'summary_large_image',
      title: serviceAreasTitle,
      description: serviceAreasDescription,
    },
    alternates: {
      canonical: serviceAreasUrl,
    },
  }
}

export default function ServiceAreasLayout({ children }: { children: React.ReactNode }) {
  return children
}
