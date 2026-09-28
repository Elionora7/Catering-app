import { getSiteUrl } from '@/lib/siteUrl'

const SERVICE_AREAS = [
  'Bankstown',
  'Parramatta',
  'Inner West Sydney',
  'South West Sydney',
  'Sydney CBD',
  'Vaucluse',
  'Watsons Bay',
  'Mosman',
  'Double Bay',
] as const

/** Schema.org LocalBusiness + FoodEstablishment JSON-LD for site-wide structured data. */
export function getLocalBusinessJsonLd() {
  const siteUrl = getSiteUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    additionalType: 'https://schema.org/FoodEstablishment',
    name: 'Eliora Signature Catering',
    url: siteUrl,
    telephone: '+61410759741',
    email: 'info@eliorasignaturecatering.com.au',
    servesCuisine: ['Lebanese', 'Mediterranean'],
    logo: `${siteUrl}/logo.png`,
    image: `${siteUrl}/menu-images/tabouleh.png`,
    priceRange: '$$',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '09:00',
      closes: '18:00',
    },
    areaServed: SERVICE_AREAS.map((name) => ({
      '@type': 'Place',
      name,
    })),
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Sydney',
      addressRegion: 'NSW',
      addressCountry: 'AU',
    },
    sameAs: [
      'https://www.facebook.com/elioracatering',
      'https://www.instagram.com/eliorasignaturecatering',
    ],
  }
}
