export const LOCALES = ['en', 'zh'] as const
export const DEFAULT_LOCALE = 'en' as const

export type Locale = (typeof LOCALES)[number]

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALES.includes(value as Locale)
}

export function getLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE

  const languages = header
    .split(',')
    .map((part, index) => {
      const [tag = '', ...parameters] = part.trim().toLowerCase().split(';')
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith('q='))
      const quality = qualityParameter ? Number.parseFloat(qualityParameter.trim().slice(2)) : 1

      return {
        index,
        quality: Number.isFinite(quality) ? quality : 0,
        tag,
      }
    })
    .sort((a, b) => b.quality - a.quality || a.index - b.index)

  for (const language of languages) {
    const primary = language.tag.split('-')[0]
    if (isLocale(primary)) return primary
  }

  return DEFAULT_LOCALE
}

export function localizedPath(pathname: string, locale: Locale): string {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0 || !isLocale(segments[0])) return `/${locale}`

  segments[0] = locale
  return `/${segments.join('/')}`
}
