import { describe, expect, it } from 'vitest'

import { authenticated, authenticatedOrPublished } from '@/access'

describe('collection access', () => {
  it('allows authenticated users to manage content', () => {
    expect(authenticated({ req: { user: { id: 1 } } } as never)).toBe(true)
    expect(authenticated({ req: { user: null } } as never)).toBe(false)
  })

  it('limits anonymous post reads to published documents', () => {
    expect(authenticatedOrPublished({ req: { user: null } } as never)).toEqual({
      _status: {
        equals: 'published',
      },
    })
  })

  it('allows authenticated users to read drafts', () => {
    expect(authenticatedOrPublished({ req: { user: { id: 1 } } } as never)).toBe(true)
  })
})
