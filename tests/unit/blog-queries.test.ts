import { describe, expect, it } from 'vitest'

import { buildPostBySlugQuery, buildPostListQuery } from '@/lib/blog'

describe('public blog queries', () => {
  it('lists only the requested locale without fallback or access override', () => {
    expect(buildPostListQuery('zh', { page: 2 })).toMatchObject({
      collection: 'posts',
      depth: 2,
      draft: false,
      fallbackLocale: false,
      limit: 10,
      locale: 'zh',
      overrideAccess: false,
      page: 2,
      sort: '-publishedAt',
    })
  })

  it('filters a localized category slug when supplied', () => {
    expect(buildPostListQuery('en', { category: 'engineering', page: 1 }).where).toEqual({
      'categories.slug': {
        equals: 'engineering',
      },
    })
  })

  it('looks up a localized post slug without fallback', () => {
    expect(buildPostBySlugQuery('en', 'a-useful-post')).toMatchObject({
      collection: 'posts',
      draft: false,
      fallbackLocale: false,
      limit: 1,
      locale: 'en',
      overrideAccess: false,
      where: {
        slug: {
          equals: 'a-useful-post',
        },
      },
    })
  })
})
