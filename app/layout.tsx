import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { getServerSession } from 'next-auth/next'
import './globals.css'
import { Providers } from './providers'
import { ClientLayout } from '@/components/ClientLayout'
import { authOptions } from '@/lib/auth'

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
  title: 'Eliora Signature Catering | Authentic Lebanese Catering in Sydney',
  description: 'Fresh Mediterranean-Inspired Cuisine for Events & Daily Meals. Authentic Lebanese catering in Sydney with fresh ingredients, traditional flavors, and professional service.',
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

