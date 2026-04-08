import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { getServerSession } from 'next-auth/next'
import './globals.css'
import { Providers } from './providers'
import { ClientLayout } from '@/components/ClientLayout'
import { authOptions } from '@/lib/auth'
import { getSiteUrl } from '@/lib/siteUrl'

const siteUrl = getSiteUrl()
const defaultTitle = 'Eliora Signature Catering | Authentic Lebanese Catering in Sydney'
const defaultDescription =
  'Eliora Signature Catering — fresh Mediterranean-inspired cuisine for events and daily meals. Authentic Lebanese catering in Sydney with fresh ingredients, traditional flavours, and professional service.'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: '%s | Eliora Signature Catering',
  },
  description: defaultDescription,
  keywords: [
    'Eliora Signature Catering',
    'Eliora Catering',
    'Lebanese catering Sydney',
    'Mediterranean catering Sydney',
    'catering Sydney',
    'event catering',
    'corporate catering Sydney',
  ],
  authors: [{ name: 'Eliora Signature Catering' }],
  creator: 'Eliora Signature Catering',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: siteUrl,
    siteName: 'Eliora Signature Catering',
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
  },
}

/** Session must be resolved per request (not at static build time) so NextAuth can skip a broken initial /api/auth/session fetch. */
export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  /** Coerce undefined → null so SessionProvider always gets a defined `session` prop (skips initial client fetch). */
  const session = (await getServerSession(authOptions)) ?? null

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        <Providers session={session}>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  )
}

