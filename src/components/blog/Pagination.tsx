import Link from 'next/link'

import type { Locale } from '@/lib/locales'

type Props = {
  category?: string
  locale: Locale
  page: number
  totalPages: number
}

function pageHref(locale: Locale, page: number, category?: string) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return `/${locale}${query ? `?${query}` : ''}`
}

export function Pagination({ category, locale, page, totalPages }: Props) {
  if (totalPages <= 1) return null

  const previous = locale === 'zh' ? '上一页' : 'Previous'
  const next = locale === 'zh' ? '下一页' : 'Next'

  return (
    <nav aria-label={locale === 'zh' ? '分页' : 'Pagination'} className="pagination">
      {page > 1 ? <Link href={pageHref(locale, page - 1, category)}>{previous}</Link> : <span />}
      <span>
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={pageHref(locale, page + 1, category)}>{next}</Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
