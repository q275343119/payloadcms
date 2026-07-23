import { describe, expect, it } from 'vitest'

import { DEFAULT_LOCALE, getLocaleFromAcceptLanguage, isLocale, localizedPath } from '@/lib/locales'

describe('locale helpers', () => {
  it('recognizes only supported locales', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('zh')).toBe(true)
    expect(isLocale('en-US')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })

  it('prefers Chinese when it has the highest language quality', () => {
    expect(getLocaleFromAcceptLanguage('en-US;q=0.7, zh-CN;q=0.9')).toBe('zh')
  })

  it('defaults to English when the header is missing or unsupported', () => {
    expect(getLocaleFromAcceptLanguage(null)).toBe(DEFAULT_LOCALE)
    expect(getLocaleFromAcceptLanguage('fr-FR, de;q=0.8')).toBe('en')
  })

  it('replaces the locale prefix without altering the remaining path', () => {
    expect(localizedPath('/en/blog/a-post', 'zh')).toBe('/zh/blog/a-post')
    expect(localizedPath('/admin', 'zh')).toBe('/zh')
  })
})
