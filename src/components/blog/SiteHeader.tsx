import Link from 'next/link'

import type { Locale } from '@/lib/locales'

type LocaleLinks = Partial<Record<Locale, string>>

type Props = {
  locale: Locale
  localeLinks?: LocaleLinks
  siteName: string
}

const labels: Record<Locale, { home: string; language: string }> = {
  en: {
    home: 'Writing',
    language: 'Language',
  },
  zh: {
    home: '文章',
    language: '语言',
  },
}

export function SiteHeader({ locale, localeLinks, siteName }: Props) {
  const links = localeLinks || {
    en: '/en',
    zh: '/zh',
  }

  return (
    <header className="site-header">
      <Link className="site-wordmark" href={`/${locale}`}>
        {siteName}
      </Link>
      <nav aria-label={labels[locale].language} className="site-nav">
        <Link href={`/${locale}`}>{labels[locale].home}</Link>
        <span aria-hidden="true" className="nav-separator" />
        {(['en', 'zh'] as const).map((candidate) => {
          const href = links[candidate]
          const text = candidate === 'en' ? 'EN' : '中文'

          return href ? (
            <Link
              aria-current={candidate === locale ? 'page' : undefined}
              className="locale-link"
              href={href}
              key={candidate}
            >
              {text}
            </Link>
          ) : (
            <span aria-disabled="true" className="locale-link is-disabled" key={candidate}>
              {text}
            </span>
          )
        })}
      </nav>
    </header>
  )
}
