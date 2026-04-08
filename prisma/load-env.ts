/**
 * Match Next.js: `.env` then `.env.local` (local overrides).
 * `import 'dotenv/config'` only loads `.env`, so `npm run db:seed` could
 * point at a different DB than `next dev` when DATABASE_URL is only in `.env.local`.
 */
import { config } from 'dotenv'
import { resolve } from 'path'

export function loadEnv() {
  // Force production DB only for this command (see package.json `db:seed:prod`).
  if (process.env.PRISMA_SEED_USE_PRODUCTION === 'true') {
    config({ path: resolve(process.cwd(), '.env.production') })
    return
  }
  config({ path: resolve(process.cwd(), '.env') })
  config({ path: resolve(process.cwd(), '.env.local'), override: true })
  // Production URL is often only in `.env.production` (Next.js build). Seed would otherwise hit the wrong DB.
  if (!process.env.DATABASE_URL?.trim()) {
    config({ path: resolve(process.cwd(), '.env.production') })
  }
}

loadEnv()
