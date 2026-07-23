import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { SiteHeader } from '@/components/blog/SiteHeader'
import { getPostBySlug, getSiteSettings, getTranslationSlug } from '@/lib/blog'
import { isLocale } from '@/lib/locales'
import { formatPostDate, getMediaSource } from '@/lib/presentation'
import type { Author, Category, Media } from '@/payload-types'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}

  const post = await getPostBySlug(locale, slug)
  if (!post) return {}

  const otherLocale = locale === 'en' ? 'zh' : 'en'
  const otherSlug = await getTranslationSlug(post.id, otherLocale)

  return {
    alternates: {
      canonical: `/${locale}/blog/${post.slug}`,
      languages: {
        [locale]: `/${locale}/blog/${post.slug}`,
        ...(otherSlug ? { [otherLocale]: `/${otherLocale}/blog/${otherSlug}` } : {}),
      },
    },
    description: post.meta?.description || post.excerpt,
    openGraph: {
      description: post.meta?.description || post.excerpt,
      images:
        typeof post.heroImage === 'object' && post.heroImage.url
          ? [{ alt: post.heroImage.alt, url: post.heroImage.url }]
          : [],
      title: post.meta?.title || post.title,
      type: 'article',
    },
    title: post.meta?.title || post.title,
  }
}

export default async function BlogPost({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()

  const post = await getPostBySlug(locale, slug)
  if (!post) notFound()

  const otherLocale = locale === 'en' ? 'zh' : 'en'
  const [settings, otherSlug] = await Promise.all([
    getSiteSettings(locale),
    getTranslationSlug(post.id, otherLocale),
  ])
  const hero = typeof post.heroImage === 'object' ? getMediaSource(post.heroImage, 'hero') : null
  const author = typeof post.author === 'object' ? (post.author as Author) : null
  const categories = (post.categories || []).filter(
    (category): category is Category => typeof category === 'object',
  )
  const localeLinks = {
    [locale]: `/${locale}/blog/${post.slug}`,
    ...(otherSlug ? { [otherLocale]: `/${otherLocale}/blog/${otherSlug}` } : {}),
  }

  return (
    <div className="page-shell article-shell">
      <SiteHeader locale={locale} localeLinks={localeLinks} siteName={settings.siteName} />
      <article>
        <header className="article-header">
          <Link className="back-link" href={`/${locale}`}>
            {locale === 'zh' ? '返回文章' : 'Back to writing'}
          </Link>
          <h1>{post.title}</h1>
          <p className="article-excerpt">{post.excerpt}</p>
          <div className="article-byline">
            {author ? <span>{author.displayName}</span> : null}
            {post.publishedAt ? (
              <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt, locale)}</time>
            ) : null}
          </div>
        </header>

        {hero ? (
          <figure className="article-hero">
            <Image
              alt={(post.heroImage as Media).alt}
              height={hero.height}
              priority
              sizes="(max-width: 767px) 100vw, 1120px"
              src={hero.src}
              width={hero.width}
            />
          </figure>
        ) : null}

        <div className="article-layout">
          <aside className="article-aside">
            {categories.map((category) => (
              <Link
                href={`/${locale}?category=${encodeURIComponent(category.slug)}`}
                key={category.id}
              >
                {category.name}
              </Link>
            ))}
          </aside>
          <div className="rich-text">
            <RichText data={post.content} />
          </div>
        </div>
      </article>
      <footer className="site-footer">
        <span>{settings.siteName}</span>
        <Link href={`/${locale}`}>{locale === 'zh' ? '全部文章' : 'All writing'}</Link>
      </footer>
    </div>
  )
}
