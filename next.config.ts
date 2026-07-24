import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = []

if (process.env.R2_PUBLIC_URL) {
  const mediaURL = new URL(process.env.R2_PUBLIC_URL)
  remotePatterns.push({
    hostname: mediaURL.hostname,
    pathname: `${mediaURL.pathname.replace(/\/$/, '')}/**`,
    port: mediaURL.port,
    protocol: mediaURL.protocol.replace(':', '') as 'http' | 'https',
  })
}

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    remotePatterns,
  },
  output: 'standalone',
  typescript: {
    // `pnpm build` runs the full type check before Next starts, so Next only
    // performs its lightweight TypeScript setup verification here.
    ignoreBuildErrors: true,
  },
}

export default withPayload(nextConfig)
