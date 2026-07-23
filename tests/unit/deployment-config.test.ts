import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('production compose configuration', () => {
  it('runs migrations without invoking Corepack at runtime', () => {
    const compose = readFileSync(resolve(process.cwd(), 'compose.yaml'), 'utf8')

    expect(compose).toContain("command: ['./node_modules/.bin/payload', 'migrate']")
    expect(compose).not.toContain("command: ['pnpm', 'migrate']")
  })
})
