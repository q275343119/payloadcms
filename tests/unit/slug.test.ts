import { describe, expect, it } from 'vitest'

import { formatSlug } from '@/lib/slug'

describe('formatSlug', () => {
  it('normalizes Latin titles into URL-safe slugs', () => {
    expect(formatSlug('  A Calm & Useful Post  ')).toBe('a-calm-useful-post')
  })

  it('preserves Chinese letters and replaces punctuation with hyphens', () => {
    expect(formatSlug('你好，Payload CMS！')).toBe('你好-payload-cms')
  })

  it('collapses separators and removes combining marks', () => {
    expect(formatSlug('Café --- déjà vu')).toBe('cafe-deja-vu')
  })
})
