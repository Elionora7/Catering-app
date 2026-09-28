import type { Metadata } from 'next'
import { getPageUrl } from '@/lib/siteUrl'
import { HomePageClient } from './HomePageClient'

const homeUrl = getPageUrl('/')

const homeTitle =
  'Lebanese Catering Sydney | Authentic Lebanese & Mediterranean Catering | Daily Family Meals'

const homeDescription =
  'Eliora Signature Catering — authentic Lebanese catering Sydney and Mediterranean catering for events, offices, and daily meals for family. Fresh platters, traditional flavours, delivery across Sydney. Order online.'

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  keywords: [
    'Lebanese catering Sydney',
    'authentic Lebanese catering Sydney',
    'Mediterranean catering Sydney',
    'daily meals for family Sydney',
    'family catering Sydney',
    'Lebanese food catering',
    'Mediterranean food Sydney',
    'Eliora Signature Catering',
    'corporate catering Sydney',
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

export default function Home() {
  return <HomePageClient />
}
