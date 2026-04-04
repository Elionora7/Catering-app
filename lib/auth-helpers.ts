import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { authOptions } from './auth'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'


interface AuthResult {
  error: NextResponse | null
  token: JWT | null
  session?: Session | null // Keep for backward compatibility
}

interface AdminResult {
  error: NextResponse | null
}

/**
 * Require authentication for API routes
 * 
 * @param request - Request object to extract headers for session
 * @returns Object with error response (if unauthenticated) and session
 * @example
 * ```ts
 * const { error, session } = await requireAuth(request)
 * if (error) return error
 * // Use session.user.id, session.user.role, etc.
 * ```
 */
export async function requireAuth(request?: Request | NextRequest): Promise<AuthResult> {
  if (!request) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Request required' },
        { status: 401 }
      ),
      token: null,
    }
  }

  try {
    // Extract cookies for logging
    const cookieHeader = request.headers.get('cookie') || ''
    console.log('[requireAuth] Cookie header present:', !!cookieHeader)
    
    if (cookieHeader) {
      // Check for NextAuth session token cookie
      const hasNextAuthCookie = cookieHeader.includes('next-auth.session-token') || 
                                cookieHeader.includes('__Secure-next-auth.session-token') ||
                                cookieHeader.includes('__Host-next-auth.session-token')
      console.log('[requireAuth] NextAuth cookie found:', hasNextAuthCookie)
      if (hasNextAuthCookie) {
        console.log('[requireAuth] Cookie value preview:', cookieHeader.substring(0, 150))
      }
    }
    
    // Use getToken with the request and secret (as per template)
    const token = await getToken({
      req: request instanceof NextRequest ? request : (request as any),
      secret: process.env.NEXTAUTH_SECRET,
    })

    console.log('[requireAuth] Token retrieved:', token ? 'Yes' : 'No')
    if (token) {
      console.log('[requireAuth] Token contents:', {
        id: token.id,
        email: token.email,
        role: token.role,
        sub: token.sub,
        hasId: !!token.id,
        hasRole: !!token.role,
      })
    } else {
      console.log('[requireAuth] No token found - cookies:', cookieHeader.substring(0, 200))
    }

    if (!token) {
      console.log('[requireAuth] Token validation failed - no token returned')
      return {
        error: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
        token: null,
      }
    }

    // Validate required token fields
    if (!token.id && !token.sub) {
      console.log('[requireAuth] Token missing id/sub:', token)
      return {
        error: NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        ),
        token: null,
      }
    }

    // Reconstruct session from token for backward compatibility
    const session: Session = {
      user: {
        id: (token.id as string) || (token.sub as string),
        email: (token.email as string) || '',
        name: (token.name as string | null | undefined) || null,
        role: (token.role as string) || 'USER',
      },
      expires: token.exp && typeof token.exp === 'number' ? new Date(token.exp * 1000).toISOString() : '',
    }

    return {
      error: null,
      token,
      session, // Keep for backward compatibility
    }
  } catch (error) {
    console.error('[requireAuth] Error getting session:', error)
    if (error instanceof Error) {
      console.error('[requireAuth] Error message:', error.message)
      console.error('[requireAuth] Error stack:', error.stack)
    }
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
      token: null,
    }
  }
}

/**
 * Require admin role for API routes
 * 
 * @param request - Request object to extract headers for session
 * @returns Object with error response (if unauthenticated or not admin)
 * @example
 * ```ts
 * const { error } = await requireAdmin(request)
 * if (error) return error
 * ```
 */
export async function requireAdmin(request?: Request | NextRequest): Promise<AdminResult> {
  if (!request) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized - Request required' },
        { status: 401 }
      ),
    }
  }

  try {
    // Use getToken with the request and secret (as per template)
    const token = await getToken({
      req: request instanceof NextRequest ? request : (request as any),
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token || !token.id || !token.role) {
      return {
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    if (token.role !== 'ADMIN') {
      return {
        error: NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        ),
      }
    }

    return { error: null }
  } catch (error) {
    console.error('Error getting session in requireAdmin:', error)
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
}
