/**
 * Opt-in admin seeding. Never hard-code credentials.
 * SEED_ADMIN must be exactly "true" (case-insensitive) to create/update an admin.
 */

export type AdminSeedConfig =
  | { enabled: false }
  | { enabled: true; email: string; password: string }

export function resolveAdminSeedConfig(
  env: NodeJS.Dict<string | undefined> = process.env
): AdminSeedConfig {
  const flag = env.SEED_ADMIN?.trim().toLowerCase()
  if (flag !== 'true') {
    return { enabled: false }
  }

  const email = env.ADMIN_SEED_EMAIL?.trim() ?? ''
  const password = env.ADMIN_SEED_PASSWORD ?? ''

  if (!email) {
    throw new Error('SEED_ADMIN=true requires ADMIN_SEED_EMAIL')
  }
  if (!email.includes('@')) {
    throw new Error('ADMIN_SEED_EMAIL must be a valid email address')
  }
  if (!password) {
    throw new Error('SEED_ADMIN=true requires ADMIN_SEED_PASSWORD (no fallback password)')
  }

  return { enabled: true, email, password }
}
