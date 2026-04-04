import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

/** Ensure session/callback routes are always handled dynamically (avoids stale/404 issues). */
export const dynamic = 'force-dynamic'

export { handler as GET, handler as POST }

