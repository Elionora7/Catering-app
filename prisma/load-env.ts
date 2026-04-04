/**
 * Match Next.js: `.env` then `.env.local` (local overrides).
 * `import 'dotenv/config'` only loads `.env`, so `npm run db:seed` could
 * point at a different DB than `next dev` when DATABASE_URL is only in `.env.local`.
 */
import { config } from 'dotenv'
import { resolve } from 'path'

export function loadEnv() {
  config({ path: resolve(process.cwd(), '.env') })
  config({ path: resolve(process.cwd(), '.env.local'), override: true })
}

loadEnv()
