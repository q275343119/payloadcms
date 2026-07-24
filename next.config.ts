import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  typescript: {
    // `pnpm build` runs the full type check before Next starts, so Next only
    // performs its lightweight TypeScript setup verification here.
    ignoreBuildErrors: true,
  },
}

export default withPayload(nextConfig)
