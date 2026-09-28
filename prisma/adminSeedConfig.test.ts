import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveAdminSeedConfig } from './adminSeedConfig'

describe('resolveAdminSeedConfig', () => {
  it('does not create an admin when SEED_ADMIN is unset', () => {
    assert.deepEqual(resolveAdminSeedConfig({}), { enabled: false })
  })

  it('does not create an admin when SEED_ADMIN=false', () => {
    assert.deepEqual(resolveAdminSeedConfig({ SEED_ADMIN: 'false' }), { enabled: false })
  })

  it('fails when SEED_ADMIN=true and password is missing', () => {
    assert.throws(
      () =>
        resolveAdminSeedConfig({
          SEED_ADMIN: 'true',
          ADMIN_SEED_EMAIL: 'ops@example.com',
        }),
      /ADMIN_SEED_PASSWORD/
    )
  })

  it('fails when SEED_ADMIN=true and email is missing', () => {
    assert.throws(
      () =>
        resolveAdminSeedConfig({
          SEED_ADMIN: 'true',
          ADMIN_SEED_PASSWORD: 'a-strong-unique-secret',
        }),
      /ADMIN_SEED_EMAIL/
    )
  })

  it('returns email and password when explicitly enabled', () => {
    assert.deepEqual(
      resolveAdminSeedConfig({
        SEED_ADMIN: 'true',
        ADMIN_SEED_EMAIL: 'ops@example.com',
        ADMIN_SEED_PASSWORD: 'a-strong-unique-secret',
      }),
      {
        enabled: true,
        email: 'ops@example.com',
        password: 'a-strong-unique-secret',
      }
    )
  })
})
