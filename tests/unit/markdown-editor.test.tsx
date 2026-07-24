// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const form = vi.hoisted(() => ({
  dispatch: vi.fn(),
  fields: {
    content: {
      value: {
        root: {
          children: [],
          type: 'root',
          version: 1,
        },
      },
    },
  } as Record<string, { value?: unknown }>,
}))

vi.mock('@payloadcms/ui', () => ({
  useAllFormFields: () => [form.fields, form.dispatch],
}))

import { MarkdownSourceEditor } from '@/components/admin/MarkdownSourceEditor'

describe('MarkdownSourceEditor', () => {
  beforeEach(() => {
    form.dispatch.mockReset()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('loads Markdown on demand and applies converted Lexical state to the form', async () => {
    const converted = {
      root: {
        children: [{ type: 'heading', tag: 'h2', version: 1 }],
        type: 'root',
        version: 1,
      },
    }
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ markdown: '## Existing', warnings: [] }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ lexical: converted }), { status: 200 }))

    render(<MarkdownSourceEditor field={{} as never} path="markdownEditor" targetPath="content" />)

    fireEvent.click(screen.getByRole('button', { name: '使用 Markdown 编辑' }))
    const editor = await screen.findByLabelText('Markdown 源码')
    expect((editor as HTMLTextAreaElement).value).toBe('## Existing')

    fireEvent.change(editor, { target: { value: '## Updated' } })
    fireEvent.click(screen.getByRole('button', { name: '应用到正文' }))

    await waitFor(() => {
      expect(form.dispatch).toHaveBeenCalledWith({
        initialValue: converted,
        path: 'content',
        type: 'UPDATE',
        value: converted,
      })
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/markdown/convert',
      expect.objectContaining({
        body: JSON.stringify({
          direction: 'markdown-to-lexical',
          markdown: '## Updated',
        }),
      }),
    )
  })

  it('requires confirmation before discarding dirty Markdown', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ markdown: '# Existing', warnings: [] }), { status: 200 }),
    )
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<MarkdownSourceEditor field={{} as never} path="markdownEditor" targetPath="content" />)

    fireEvent.click(screen.getByRole('button', { name: '使用 Markdown 编辑' }))
    const editor = await screen.findByLabelText('Markdown 源码')
    fireEvent.change(editor, { target: { value: '# Unsaved' } })
    fireEvent.click(screen.getByRole('button', { name: '收起' }))

    expect(confirm).toHaveBeenCalled()
    expect(screen.getByLabelText('Markdown 源码')).toBeTruthy()
  })
})
