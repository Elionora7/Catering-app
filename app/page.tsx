import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/siteUrl'
import { HomePageClient } from './HomePageClient'

const siteUrl = getSiteUrl()

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
    url: siteUrl,
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
    canonical: `${siteUrl}/`,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FoodEstablishment',
  name: 'Eliora Signature Catering',
  description: homeDescription,
  url: siteUrl,
  servesCuisine: ['Lebanese', 'Mediterranean'],
  areaServed: {
    '@type': 'City',
    name: 'Sydney',
    containedInPlace: { '@type': 'AdministrativeArea', name: 'New South Wales' },
  },
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomePageClient />
    </>
  )
}
