import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('production compose configuration', () => {
  it('keeps the container port independent from the published host port', () => {
    const compose = readFileSync(resolve(process.cwd(), 'compose.yaml'), 'utf8')

    expect(compose).toContain("ports:\n      - '127.0.0.1:${PORT:-3000}:3000'")
    expect(compose).toContain("environment:\n      PORT: '3000'")
  })

  it('runs migrations without invoking Corepack at runtime', () => {
    const compose = readFileSync(resolve(process.cwd(), 'compose.yaml'), 'utf8')

    expect(compose).toContain("command: ['./node_modules/.bin/payload', 'migrate']")
    expect(compose).not.toContain("command: ['pnpm', 'migrate']")
  })
})
