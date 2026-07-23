type Environment = Record<string, string | undefined>

type R2Config = {
  accessKeyId: string
  bucket: string
  endpoint: string
  publicURL: string
  secretAccessKey: string
}

export type ServerConfig = {
  corsOrigins: string[]
  databaseURL: string
  payloadSecret: string
  r2: R2Config | null
  siteURL: string
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export function getServerConfig(
  environment: Environment = process.env,
  nodeEnvironment = process.env.NODE_ENV,
): ServerConfig {
  const production = nodeEnvironment === 'production'
  const requiredProductionVariables = [
    'DATABASE_URL',
    'PAYLOAD_SECRET',
    'SITE_URL',
    'R2_BUCKET',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_ENDPOINT',
    'R2_PUBLIC_URL',
  ] as const

  if (production) {
    const missing = requiredProductionVariables.filter((name) => !environment[name]?.trim())
    if (missing.length > 0) {
      throw new Error(`Missing required production environment variables: ${missing.join(', ')}`)
    }
  }

  const siteURL = trimTrailingSlash(environment.SITE_URL || 'http://localhost:3000')
  const r2Values = {
    accessKeyId: environment.R2_ACCESS_KEY_ID,
    bucket: environment.R2_BUCKET,
    endpoint: environment.R2_ENDPOINT,
    publicURL: environment.R2_PUBLIC_URL,
    secretAccessKey: environment.R2_SECRET_ACCESS_KEY,
  }
  const hasCompleteR2 = Object.values(r2Values).every((value) => Boolean(value?.trim()))

  const configuredOrigins = (environment.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => trimTrailingSlash(origin.trim()))
    .filter(Boolean)

  return {
    corsOrigins: [...new Set([siteURL, ...configuredOrigins])],
    databaseURL: environment.DATABASE_URL || 'postgres://payload:payload@localhost:5432/payload',
    payloadSecret: environment.PAYLOAD_SECRET || 'local-development-only-secret',
    r2: hasCompleteR2
      ? {
          accessKeyId: r2Values.accessKeyId!,
          bucket: r2Values.bucket!,
          endpoint: trimTrailingSlash(r2Values.endpoint!),
          publicURL: trimTrailingSlash(r2Values.publicURL!),
          secretAccessKey: r2Values.secretAccessKey!,
        }
      : null,
    siteURL,
  }
}
