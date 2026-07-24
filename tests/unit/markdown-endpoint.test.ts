import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { PayloadRequest, SanitizedConfig } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { createMarkdownConvertHandler, MAX_MARKDOWN_REQUEST_BYTES } from '@/endpoints/markdown'

const editorConfig = {} as never

function request(
  body: unknown,
  user: PayloadRequest['user'] = { id: 1 } as PayloadRequest['user'],
) {
  const webRequest = new Request('http://localhost/api/markdown/convert', {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })

  return Object.assign(webRequest, {
    payload: {
      config: {} as SanitizedConfig,
    },
    user,
  }) as PayloadRequest
}

describe('Markdown conversion endpoint', () => {
  it('rejects anonymous requests', async () => {
    const handler = createMarkdownConvertHandler({
      getEditorConfig: () => editorConfig,
    })

    const response = await handler(
      request({ direction: 'markdown-to-lexical', markdown: '# Hi' }, null),
    )

    expect(response.status).toBe(403)
  })

  it('rejects malformed and empty requests', async () => {
    const handler = createMarkdownConvertHandler({
      getEditorConfig: () => editorConfig,
    })

    const malformed = await handler(request({ direction: 'unknown' }))
    const empty = await handler(request({ direction: 'markdown-to-lexical', markdown: '   ' }))
    const emptyLexical = await handler(
      request({
        direction: 'lexical-to-markdown',
        lexical: {
          root: {
            children: [],
            type: 'root',
            version: 1,
          },
        },
      }),
    )

    expect(malformed.status).toBe(400)
    expect(empty.status).toBe(400)
    expect(emptyLexical.status).toBe(400)
  })

  it('rejects request bodies larger than one MiB', async () => {
    const handler = createMarkdownConvertHandler({
      getEditorConfig: () => editorConfig,
    })

    const response = await handler(
      request({
        direction: 'markdown-to-lexical',
        markdown: 'a'.repeat(MAX_MARKDOWN_REQUEST_BYTES),
      }),
    )

    expect(response.status).toBe(413)
  })

  it('returns converted Markdown without updating a document', async () => {
    const toMarkdown = vi.fn(() => ({ markdown: '# Converted', warnings: ['warning'] }))
    const handler = createMarkdownConvertHandler({
      getEditorConfig: () => editorConfig,
      toMarkdown,
    })
    const lexical = {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Converted',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            textFormat: 0,
            textStyle: '',
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    } as unknown as SerializedEditorState

    const response = await handler(request({ direction: 'lexical-to-markdown', lexical }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ markdown: '# Converted', warnings: ['warning'] })
    expect(toMarkdown).toHaveBeenCalledWith({ data: lexical, editorConfig })
  })

  it('maps conversion failures to an unprocessable response', async () => {
    const handler = createMarkdownConvertHandler({
      getEditorConfig: () => editorConfig,
      toLexical: () => {
        throw new Error('bad markdown')
      },
    })

    const response = await handler(
      request({ direction: 'markdown-to-lexical', markdown: '# Broken' }),
    )

    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({ error: 'Markdown 转换失败' })
  })
})
