import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Pagination } from '@/components/blog/Pagination'
import { PostCard } from '@/components/blog/PostCard'
import { SiteHeader } from '@/components/blog/SiteHeader'
import { getCategories, getPostList, getSiteSettings } from '@/lib/blog'
import { isLocale } from '@/lib/locales'
import { parsePageNumber } from '@/lib/presentation'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string; page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const settings = await getSiteSettings(locale)
  const title = settings.defaultMeta?.title || settings.siteName
  const description = settings.defaultMeta?.description || settings.description

  return {
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        zh: '/zh',
      },
    },
    description,
    title,
  }
}

export default async function BlogIndex({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  if (!isLocale(locale)) notFound()

  const page = parsePageNumber(query.page)
  const [posts, categories, settings] = await Promise.all([
    getPostList(locale, { category: query.category, page }),
    getCategories(locale),
    getSiteSettings(locale),
  ])
  const copy =
    locale === 'zh'
      ? {
          all: '全部',
          empty: '这里还没有已发布的中文文章。',
          heading: '思考、实践与长期记录。',
        }
      : {
          all: 'All',
          empty: 'No English articles have been published yet.',
          heading: 'Ideas, practice, and work worth keeping.',
        }

  return (
    <div className="page-shell">
      <SiteHeader locale={locale} siteName={settings.siteName} />
      <section className="index-intro">
        <h1>{copy.heading}</h1>
        <p>{settings.description}</p>
      </section>

      <nav aria-label={locale === 'zh' ? '文章分类' : 'Post categories'} className="filters">
        <Link aria-current={!query.category ? 'page' : undefined} href={`/${locale}`}>
          {copy.all}
        </Link>
        {categories.docs.map((category) => (
          <Link
            aria-current={query.category === category.slug ? 'page' : undefined}
            href={`/${locale}?category=${encodeURIComponent(category.slug)}`}
            key={category.id}
          >
            {category.name}
          </Link>
        ))}
      </nav>

      {posts.docs.length > 0 ? (
        <div className="post-grid">
          {posts.docs.map((post) => (
            <PostCard key={post.id} locale={locale} post={post} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>{copy.empty}</p>
          <Link href="/admin">{locale === 'zh' ? '前往后台写作' : 'Open the editor'}</Link>
        </div>
      )}

      <Pagination
        category={query.category}
        locale={locale}
        page={posts.page || page}
        totalPages={posts.totalPages}
      />
      <footer className="site-footer">
        <span>{settings.siteName}</span>
        <Link href="/admin">CMS</Link>
      </footer>
    </div>
  )
}
