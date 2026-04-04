'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { useState, type ReactNode } from 'react'

/**
 * App providers wrapper
 * 
 * Provides React Query and NextAuth session context to the entire app.
 * 
 * @example
 * ```tsx
 * <Providers session={session}>
 *   <App />
 * </Providers>
 * ```
 */
export function Providers({
  children,
  session,
}: {
  children: ReactNode
  /** From getServerSession in root layout — avoids a cold-start race where /api/auth/session 404s (HTML) during Turbopack compile. */
  session: Session | null
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  return (
    <SessionProvider session={session} refetchOnWindowFocus>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}

