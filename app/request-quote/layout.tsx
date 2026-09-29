import type { Metadata } from 'next'
import { getPageUrl } from '@/lib/siteUrl'

const requestQuoteUrl = getPageUrl('/request-quote')

const requestQuoteTitle = 'Request a Lebanese Catering Quote Sydney | Eliora'
const requestQuoteDescription =
  'Request a Lebanese catering quote from Eliora Signature Catering for events and corporate catering in Sydney. Call 0410 759 741 or send your details online.'

/** Use generateMetadata (not a static metadata export) so this merges with the root generateMetadata. */
export function generateMetadata(): Metadata {
  return {
    title: { absolute: requestQuoteTitle },
    description: requestQuoteDescription,
    keywords: [
      'Lebanese catering quote Sydney',
      'corporate catering Sydney',
      'event catering quote',
      'authentic Lebanese catering Sydney',
    ],
    openGraph: {
      title: requestQuoteTitle,
      description: requestQuoteDescription,
      url: requestQuoteUrl,
      type: 'website',
      locale: 'en_AU',
      siteName: 'Eliora Signature Catering',
    },
    twitter: {
      card: 'summary_large_image',
      title: requestQuoteTitle,
      description: requestQuoteDescription,
    },
    alternates: {
      canonical: requestQuoteUrl,
    },
  }
}

export default function RequestQuoteLayout({ children }: { children: React.ReactNode }) {
  return children
}
