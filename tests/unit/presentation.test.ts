import { describe, expect, it } from 'vitest'

import {
  formatPostDate,
  getMediaSource,
  getSiteDefaults,
  parsePageNumber,
} from '@/lib/presentation'

describe('blog presentation helpers', () => {
  it('accepts positive page numbers and normalizes invalid values', () => {
    expect(parsePageNumber('3')).toBe(3)
    expect(parsePageNumber('-1')).toBe(1)
    expect(parsePageNumber('anything')).toBe(1)
    expect(parsePageNumber(undefined)).toBe(1)
  })

  it('prefers a requested image size and falls back to the original', () => {
    const media = {
      url: 'https://media.example/original.jpg',
      sizes: {
        card: {
          height: 600,
          url: 'https://media.example/card.jpg',
          width: 900,
        },
      },
    }

    expect(getMediaSource(media, 'card')).toEqual({
      height: 600,
      src: 'https://media.example/card.jpg',
      width: 900,
    })
    expect(getMediaSource(media, 'hero')).toEqual({
      height: 1200,
      src: 'https://media.example/original.jpg',
      width: 1800,
    })
  })

  it('formats dates in the requested locale', () => {
    expect(formatPostDate('2026-07-23T12:00:00.000Z', 'en')).toContain('2026')
    expect(formatPostDate('2026-07-23T12:00:00.000Z', 'zh')).toContain('2026')
  })

  it('provides usable site copy before the settings global is populated', () => {
    expect(getSiteDefaults('en', {})).toEqual({
      description: 'Independent writing in English and Chinese.',
      siteName: 'Journal',
    })
    expect(getSiteDefaults('zh', { siteName: '我的博客' })).toEqual({
      description: '用中文和英文记录值得保留的想法。',
      siteName: '我的博客',
    })
  })
})
