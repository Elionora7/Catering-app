import type { Metadata } from 'next'
import { getPageUrl } from '@/lib/siteUrl'

const contactUrl = getPageUrl('/contact')

const contactTitle = 'Contact Eliora Signature Catering | Lebanese Sydney'
const contactDescription =
  'Contact Eliora Signature Catering for Lebanese catering Sydney. Call 0410 759 741 or email info@eliorasignaturecatering.com.au. Open Mon–Sun, 9am–6pm.'

/** Use generateMetadata (not a static metadata export) so this merges with the root generateMetadata. */
export function generateMetadata(): Metadata {
  return {
    title: { absolute: contactTitle },
    description: contactDescription,
    keywords: [
      'contact Eliora Signature Catering',
      'Lebanese catering Sydney',
      'catering phone Sydney',
    ],
    openGraph: {
      title: contactTitle,
      description: contactDescription,
      url: contactUrl,
      type: 'website',
      locale: 'en_AU',
      siteName: 'Eliora Signature Catering',
    },
    twitter: {
      card: 'summary_large_image',
      title: contactTitle,
      description: contactDescription,
    },
    alternates: {
      canonical: contactUrl,
    },
  }
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
