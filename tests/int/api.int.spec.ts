import config from '@/payload.config'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
const created = {
  authors: [] as number[],
  categories: [] as number[],
  media: [] as number[],
  posts: [] as number[],
}

const lexicalContent = (text: string) => ({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text,
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        textFormat: 0,
        textStyle: '',
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    type: 'root',
    version: 1,
  },
})

describe('public CMS API', () => {
  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  afterAll(async () => {
    for (const id of created.posts) {
      await payload.delete({ collection: 'posts', id, overrideAccess: true })
    }
    for (const id of created.categories) {
      await payload.delete({ collection: 'categories', id, overrideAccess: true })
    }
    for (const id of created.authors) {
      await payload.delete({ collection: 'authors', id, overrideAccess: true })
    }
    for (const id of created.media) {
      await payload.delete({ collection: 'media', id, overrideAccess: true })
    }
  })

  it('stores independent English and Chinese slugs and publication statuses', async () => {
    const unique = Date.now().toString(36)
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: 'A quiet desk',
      },
      file: {
        data: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4l8AAAAASUVORK5CYII=',
          'base64',
        ),
        mimetype: 'image/png',
        name: `integration-${unique}.png`,
        size: 68,
      },
      locale: 'en',
      overrideAccess: true,
    })
    created.media.push(media.id)

    const author = await payload.create({
      collection: 'authors',
      data: {
        bio: 'Writes about software and craft.',
        displayName: `Lin ${unique}`,
      },
      locale: 'en',
      overrideAccess: true,
    })
    created.authors.push(author.id)

    const category = await payload.create({
      collection: 'categories',
      data: {
        name: 'Engineering',
        slug: `engineering-${unique}`,
      },
      locale: 'en',
      overrideAccess: true,
    })
    created.categories.push(category.id)

    const post = await payload.create({
      collection: 'posts',
      data: {
        _status: 'published',
        author: author.id,
        categories: [category.id],
        content: lexicalContent('An English article.'),
        excerpt: 'A concise English summary.',
        heroImage: media.id,
        publishedAt: '2026-07-23T12:00:00.000Z',
        slug: `english-${unique}`,
        title: 'English title',
      },
      draft: false,
      locale: 'en',
      overrideAccess: true,
    })
    created.posts.push(post.id)

    const chineseBeforePublish = await payload.find({
      collection: 'posts',
      draft: false,
      fallbackLocale: false,
      locale: 'zh',
      overrideAccess: false,
      where: {
        id: {
          equals: post.id,
        },
      },
    })
    expect(chineseBeforePublish.docs).toHaveLength(0)

    await payload.update({
      collection: 'posts',
      id: post.id,
      data: {
        _status: 'published',
        content: lexicalContent('一篇中文文章。'),
        excerpt: '简短的中文摘要。',
        publishedAt: '2026-07-24T12:00:00.000Z',
        slug: `chinese-${unique}`,
        title: '中文标题',
      },
      draft: false,
      locale: 'zh',
      overrideAccess: true,
    })

    const [english, chinese] = await Promise.all([
      payload.findByID({
        collection: 'posts',
        id: post.id,
        draft: false,
        fallbackLocale: false,
        locale: 'en',
        overrideAccess: false,
      }),
      payload.findByID({
        collection: 'posts',
        id: post.id,
        draft: false,
        fallbackLocale: false,
        locale: 'zh',
        overrideAccess: false,
      }),
    ])

    expect(english.slug).toBe(`english-${unique}`)
    expect(english.title).toBe('English title')
    expect(chinese.slug).toBe(`chinese-${unique}`)
    expect(chinese.title).toBe('中文标题')
  })

  it('does not expose administrator email through the public authors collection', async () => {
    const authors = await payload.find({
      collection: 'authors',
      limit: 1,
      overrideAccess: false,
    })

    expect(authors.docs[0]).not.toHaveProperty('email')
  })
})
