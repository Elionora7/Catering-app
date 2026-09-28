/**
 * Non-destructive admin upsert. Does not seed meals, events, or wipe orders.
 * Requires SEED_ADMIN=true, ADMIN_SEED_EMAIL, and ADMIN_SEED_PASSWORD.
 *
 * Never run this accidentally: it will create or update an ADMIN user.
 */
import './load-env'

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { resolveAdminSeedConfig } from './adminSeedConfig'

function requireDatabaseUrl(): string {
  const u = process.env.DATABASE_URL?.trim()
  if (!u) throw new Error('DATABASE_URL is not set')
  return u
}

async function main() {
  const config = resolveAdminSeedConfig()
  if (!config.enabled) {
    throw new Error(
      'Refusing to create/update admin. Set SEED_ADMIN=true, ADMIN_SEED_EMAIL, and ADMIN_SEED_PASSWORD.'
    )
  }

  const databaseUrl = requireDatabaseUrl()
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  } as any)

  try {
    const passwordHash = await bcrypt.hash(config.password, 10)
    await prisma.user.upsert({
      where: { email: config.email },
      update: {
        password: passwordHash,
        role: 'ADMIN',
      },
      create: {
        email: config.email,
        name: 'Admin User',
        password: passwordHash,
        role: 'ADMIN',
      },
    })
    console.log(`[create-admin] Admin user upserted for ${config.email}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
