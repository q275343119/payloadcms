import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('production compose configuration', () => {
  it('publishes amd64 images to GHCR from the main branch', () => {
    const workflowPath = resolve(process.cwd(), '.github/workflows/docker-image.yml')

    expect(existsSync(workflowPath)).toBe(true)
    if (!existsSync(workflowPath)) return

    const workflow = readFileSync(workflowPath, 'utf8').replace(/\r\n/g, '\n')

    expect(workflow).toContain('branches: [main]')
    expect(workflow).toContain('packages: write')
    expect(workflow).toContain('registry: ghcr.io')
    expect(workflow).toContain('platforms: linux/amd64')
    expect(workflow).toContain('R2_PUBLIC_URL=${{ vars.R2_PUBLIC_URL }}')
    expect(workflow).toContain('type=raw,value=latest')
    expect(workflow).toContain('type=sha,prefix=sha-')
    expect(workflow).toContain('push: true')
  })

  it('keeps production builds within constrained container memory', () => {
    const packageJSON = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as {
      scripts: Record<string, string>
    }
    const nextConfig = readFileSync(resolve(process.cwd(), 'next.config.ts'), 'utf8').replace(
      /\r\n/g,
      '\n',
    )

    expect(packageJSON.scripts.typecheck).toBe('tsc --noEmit')
    expect(packageJSON.scripts.build).toBe(
      'pnpm lint && pnpm typecheck && cross-env NODE_OPTIONS=--no-deprecation next build --no-lint',
    )
    expect(nextConfig).toContain('cpus: 1')
    expect(nextConfig).not.toContain('workerThreads: true')
    expect(nextConfig).toContain('ignoreBuildErrors: true')
  })

  it('keeps the container port independent from the published host port', () => {
    const compose = readFileSync(resolve(process.cwd(), 'compose.yaml'), 'utf8').replace(
      /\r\n/g,
      '\n',
    )

    expect(compose).toContain("ports:\n      - '127.0.0.1:${PORT:-3000}:3000'")
    expect(compose).toContain("environment:\n      PORT: '3000'")
  })

  it('runs migrations without invoking Corepack at runtime', () => {
    const compose = readFileSync(resolve(process.cwd(), 'compose.yaml'), 'utf8').replace(
      /\r\n/g,
      '\n',
    )

    expect(compose).toContain("command: ['./node_modules/.bin/payload', 'migrate']")
    expect(compose).not.toContain("command: ['pnpm', 'migrate']")
  })
})
