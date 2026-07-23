import { describe, expect, it } from 'vitest'

import { Authors } from '@/collections/Authors'
import { Categories } from '@/collections/Categories'
import { Media } from '@/collections/Media'
import { Posts } from '@/collections/Posts'
import { SiteSettings } from '@/globals/SiteSettings'

function field(config: { fields: unknown[] }, name: string) {
  return config.fields.find(
    (candidate) =>
      typeof candidate === 'object' &&
      candidate !== null &&
      'name' in candidate &&
      candidate.name === name,
  ) as Record<string, unknown> | undefined
}

describe('content model', () => {
  it('localizes editorial post fields and status', () => {
    for (const name of ['title', 'slug', 'excerpt', 'content', 'publishedAt', 'meta']) {
      expect(field(Posts, name)?.localized).toBe(true)
    }

    expect(Posts.versions).toMatchObject({
      drafts: {
        localizeStatus: true,
      },
    })
  })

  it('keeps post relationships shared across locales', () => {
    for (const name of ['heroImage', 'author', 'categories']) {
      expect(field(Posts, name)?.localized).not.toBe(true)
    }
  })

  it('separates public authors from administrator users', () => {
    expect(Authors.slug).toBe('authors')
    expect(field(Authors, 'displayName')).toBeDefined()
    expect(field(Authors, 'bio')?.localized).toBe(true)
  })

  it('localizes category labels, media alt text, and site metadata', () => {
    expect(field(Categories, 'name')?.localized).toBe(true)
    expect(field(Categories, 'slug')?.localized).toBe(true)
    expect(field(Media, 'alt')?.localized).toBe(true)
    expect(field(SiteSettings, 'siteName')?.localized).toBe(true)
    expect(field(SiteSettings, 'description')?.localized).toBe(true)
  })
})
