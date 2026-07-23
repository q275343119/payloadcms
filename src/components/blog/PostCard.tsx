import Image from 'next/image'
import Link from 'next/link'

import type { Locale } from '@/lib/locales'
import { formatPostDate, getMediaSource } from '@/lib/presentation'
import type { Author, Category, Media, Post } from '@/payload-types'

type Props = {
  locale: Locale
  post: Post
}

export function PostCard({ locale, post }: Props) {
  const image =
    typeof post.heroImage === 'object' ? getMediaSource(post.heroImage as Media, 'card') : null
  const author = typeof post.author === 'object' ? (post.author as Author) : null
  const categories = (post.categories || []).filter(
    (category): category is Category => typeof category === 'object',
  )

  return (
    <article className="post-card">
      <Link
        aria-label={post.title}
        className="post-card-image"
        href={`/${locale}/blog/${post.slug}`}
      >
        {image ? (
          <Image
            alt={(post.heroImage as Media).alt}
            height={image.height}
            sizes="(max-width: 767px) 100vw, 42vw"
            src={image.src}
            width={image.width}
          />
        ) : (
          <span className="image-placeholder" />
        )}
      </Link>
      <div className="post-card-copy">
        <div className="post-meta">
          {post.publishedAt ? <time>{formatPostDate(post.publishedAt, locale)}</time> : null}
          {author ? <span>{author.displayName}</span> : null}
        </div>
        <h2>
          <Link href={`/${locale}/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        <p>{post.excerpt}</p>
        {categories.length > 0 ? (
          <div aria-label={locale === 'zh' ? '分类' : 'Categories'} className="category-list">
            {categories.map((category) => (
              <Link
                href={`/${locale}?category=${encodeURIComponent(category.slug)}`}
                key={category.id}
              >
                {category.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
