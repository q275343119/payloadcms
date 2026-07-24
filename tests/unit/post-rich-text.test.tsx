// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { PostRichText } from '@/components/blog/PostRichText'

describe('PostRichText', () => {
  afterEach(() => cleanup())

  it('renders Payload Code blocks as semantic preformatted code', () => {
    const { container } = render(
      <PostRichText
        data={
          {
            root: {
              children: [
                {
                  fields: {
                    blockName: '',
                    blockType: 'Code',
                    code: 'const answer = 42',
                    id: 'code-row',
                    language: 'ts',
                  },
                  format: '',
                  type: 'block',
                  version: 2,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          } as never
        }
      />,
    )

    const code = container.querySelector('pre > code')
    expect(code?.textContent).toBe('const answer = 42')
    expect(code?.getAttribute('data-language')).toBe('ts')
  })
})
