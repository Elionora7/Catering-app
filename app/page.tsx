import type { Metadata } from 'next'
import { getPageUrl } from '@/lib/siteUrl'
import { HomePageClient } from './HomePageClient'

const homeUrl = getPageUrl('/')

const homeTitle = 'Lebanese Catering Sydney | Eliora Signature Catering'
const homeDescription =
  'Authentic Lebanese catering Sydney from Eliora Signature Catering. Mediterranean platters, mezze, and corporate catering delivered across Sydney. Order online.'

export function generateMetadata(): Metadata {
  return {
    title: { absolute: homeTitle },
    description: homeDescription,
    keywords: [
      'Lebanese catering Sydney',
      'authentic Lebanese catering Sydney',
      'Mediterranean catering Sydney',
      'corporate catering Sydney',
      'Lebanese food catering',
      'Eliora Signature Catering',
      'event catering Sydney',
      'catering platters Sydney',
    ],
    openGraph: {
      title: homeTitle,
      description: homeDescription,
      url: homeUrl,
      siteName: 'Eliora Signature Catering',
      locale: 'en_AU',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: homeTitle,
      description: homeDescription,
    },
    alternates: {
      canonical: homeUrl,
    },
  }
}

export default function Home() {
  return <HomePageClient />
}
