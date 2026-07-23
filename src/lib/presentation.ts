import type { Media } from '@/payload-types'

import type { Locale } from './locales'

export function parsePageNumber(value: string | undefined): number {
  const page = Number.parseInt(value || '', 10)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export function getSiteDefaults(
  locale: Locale,
  settings: { description?: string | null; siteName?: string | null },
) {
  return {
    description:
      settings.description ||
      (locale === 'zh'
        ? '用中文和英文记录值得保留的想法。'
        : 'Independent writing in English and Chinese.'),
    siteName: settings.siteName || (locale === 'zh' ? '日志' : 'Journal'),
  }
}

export function formatPostDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en', {
    day: 'numeric',
    month: locale === 'zh' ? 'long' : 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(value))
}

export function getMediaSource(
  media: Pick<Media, 'height' | 'sizes' | 'url' | 'width'>,
  size: 'card' | 'hero',
) {
  const requested = media.sizes?.[size]
  const source = requested?.url || media.url

  if (!source) return null

  return {
    height: requested?.height || media.height || (size === 'card' ? 600 : 1200),
    src: source,
    width: requested?.width || media.width || (size === 'card' ? 900 : 1800),
  }
}
