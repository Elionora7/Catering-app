import type { DeliveryZone } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Normalize suburb for comparison (Unicode NFKC, trim, collapse spaces, lowercase).
 * Safe for null / non-string DB values (never throws).
 */
export function normalizeSuburbLabel(suburb: string | null | undefined): string {
  const s = suburb == null ? '' : String(suburb)
  if (!s) return ''
  try {
    return s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
  } catch {
    return s.trim().replace(/\s+/g, ' ').toLowerCase()
  }
}

/**
 * Find an active zone only when postcode AND suburb match a row (suburb compared after normalization).
 * Wrong suburb for a valid postcode returns null → validation / API returns the standard error message.
 */
export async function findActiveDeliveryZone(
  postcode: string,
  suburb: string
): Promise<DeliveryZone | null> {
  const p = postcode.trim()
  const subNorm = normalizeSuburbLabel(suburb)
  if (!p || !subNorm) return null

  const zones = await prisma.deliveryZone.findMany({
    where: { postcode: p, isActive: true },
  })

  return zones.find((z) => normalizeSuburbLabel(z.suburb) === subNorm) ?? null
}
