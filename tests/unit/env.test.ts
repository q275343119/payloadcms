import { describe, expect, it } from 'vitest'

import { getServerConfig } from '@/lib/env'

const productionEnvironment = {
  CORS_ORIGINS: 'https://one.example, https://two.example',
  DATABASE_URL: 'postgres://payload:secret@db.example:5432/payload',
  PAYLOAD_SECRET: 'a-production-secret',
  R2_ACCESS_KEY_ID: 'access-key',
  R2_BUCKET: 'blog-media',
  R2_ENDPOINT: 'https://account.r2.cloudflarestorage.com',
  R2_PUBLIC_URL: 'https://media.example.com/',
  R2_SECRET_ACCESS_KEY: 'secret-key',
  SITE_URL: 'https://blog.example.com/',
}

describe('server environment', () => {
  it('normalizes production URLs and CORS origins', () => {
    const config = getServerConfig(productionEnvironment, 'production')

    expect(config.siteURL).toBe('https://blog.example.com')
    expect(config.corsOrigins).toEqual([
      'https://blog.example.com',
      'https://one.example',
      'https://two.example',
    ])
    expect(config.r2?.publicURL).toBe('https://media.example.com')
  })

  it('fails production startup when R2 configuration is incomplete', () => {
    const { R2_SECRET_ACCESS_KEY: _removed, ...environment } = productionEnvironment

    expect(() => getServerConfig(environment, 'production')).toThrow(
      'Missing required production environment variables: R2_SECRET_ACCESS_KEY',
    )
  })

  it('uses safe local defaults and disables incomplete R2 configuration in development', () => {
    const config = getServerConfig({ R2_BUCKET: 'incomplete' }, 'development')

    expect(config.databaseURL).toBe('postgres://payload:payload@localhost:5432/payload')
    expect(config.siteURL).toBe('http://localhost:3000')
    expect(config.r2).toBeNull()
  })
})
