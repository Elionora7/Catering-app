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
    // Use getToken with the request and secret (as per template)
    const token = await getToken({
      req: request instanceof NextRequest ? request : (request as any),
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
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
    console.error('[requireAuth] Error getting session')
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
    console.error('Error getting session in requireAdmin')
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
}
