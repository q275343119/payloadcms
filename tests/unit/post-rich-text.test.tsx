// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { PostRichText } from '@/components/blog/PostRichText'

const originalImage = {
  alt: 'Media alt',
  url: '/original.png',
  width: 640,
  height: 1600,
  mimeType: 'image/png',
}

function renderUpload(value: unknown, fields = {}) {
  return render(
    <PostRichText data={{ root: {
      children: [{ type: 'upload', version: 3, relationTo: 'media', value, fields }],
      direction: 'ltr', format: '', indent: 0, type: 'root', version: 1,
    } } as never} />,
  )
}

describe('PostRichText', () => {
  afterEach(() => cleanup())

  it('uses the original image without cropped responsive sources', () => {
    const size = { width: 900, height: 600, mimeType: 'image/png', filesize: 100, filename: 'crop.png' }
    const { container } = renderUpload({ ...originalImage, sizes: {
      card: { ...size, url: '/card.png' },
      hero: { ...size, width: 1800, height: 1200, url: '/hero.png' },
    } })
    const image = container.querySelector('img')
    expect(image?.getAttribute('src')).toBe('/original.png')
    expect(image?.getAttribute('width')).toBe('640')
    expect(image?.getAttribute('height')).toBe('1600')
    expect(container.querySelector('picture, source, [srcset]')).toBeNull()
  })

  it('renders an original image without generated sizes', () => {
    const { container } = renderUpload(originalImage)
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/original.png')
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('Media alt')
  })

  it('prefers the node alt text', () => {
    const { container } = renderUpload(originalImage, { alt: 'Node alt' })
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('Node alt')
  })

  it.each([42, null, { ...originalImage, url: undefined }, { ...originalImage, url: '' }])(
    'skips unavailable original media: %j', (value) => {
      const { container } = renderUpload(value)
      expect(container.querySelector('img')).toBeNull()
    },
  )

  it('preserves non-image attachment links', () => {
    const { container } = renderUpload({ url: '/file.pdf', mimeType: 'application/pdf', filename: 'file.pdf' })
    const link = container.querySelector('a')
    expect(link?.getAttribute('href')).toBe('/file.pdf')
    expect(link?.textContent).toBe('file.pdf')
  })

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
