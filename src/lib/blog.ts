import type { Payload } from 'payload'

import type { Locale } from './locales'
import { getSiteDefaults } from './presentation'

type ListOptions = {
  category?: string
  page: number
}

export function buildPostListQuery(locale: Locale, { category, page }: ListOptions) {
  return {
    collection: 'posts' as const,
    depth: 2,
    draft: false,
    fallbackLocale: false as const,
    limit: 10,
    locale,
    overrideAccess: false,
    page,
    sort: '-publishedAt',
    where: category
      ? {
          'categories.slug': {
            equals: category,
          },
        }
      : undefined,
  }
}

export function buildPostBySlugQuery(locale: Locale, slug: string) {
  return {
    collection: 'posts' as const,
    depth: 2,
    draft: false,
    fallbackLocale: false as const,
    limit: 1,
    locale,
    overrideAccess: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  }
}

async function getPayloadClient(): Promise<Payload> {
  const [{ getPayload }, { default: config }] = await Promise.all([
    import('payload'),
    import('@/payload.config'),
  ])

  return getPayload({ config })
}

export async function getPostList(locale: Locale, options: ListOptions) {
  const payload = await getPayloadClient()
  return payload.find(buildPostListQuery(locale, options))
}

export async function getPostBySlug(locale: Locale, slug: string) {
  const payload = await getPayloadClient()
  const result = await payload.find(buildPostBySlugQuery(locale, slug))
  return result.docs[0] ?? null
}

export async function getCategories(locale: Locale) {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'categories',
    depth: 0,
    fallbackLocale: false,
    limit: 100,
    locale,
    overrideAccess: false,
    sort: 'name',
  })
}

export async function getSiteSettings(locale: Locale) {
  const payload = await getPayloadClient()
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 1,
    fallbackLocale: false,
    locale,
    overrideAccess: false,
  })

  return {
    ...settings,
    ...getSiteDefaults(locale, settings),
  }
}

export async function getTranslationSlug(postID: number, locale: Locale): Promise<string | null> {
  const payload = await getPayloadClient()

  try {
    const post = await payload.findByID({
      collection: 'posts',
      id: postID,
      depth: 0,
      draft: false,
      fallbackLocale: false,
      locale,
      overrideAccess: false,
    })

    return post.slug || null
  } catch {
    return null
  }
}
