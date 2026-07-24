import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { describe, expect, it } from 'vitest'

import {
  collectMarkdownWarnings,
  convertPostLexicalToMarkdown,
  convertPostMarkdownToLexical,
  normalizeUploadNodes,
} from '@/lib/markdown'
import { getPostContentEditorConfig } from '@/lib/postContentEditor'
import configPromise from '@/payload.config'

const paragraph = (text: string): Record<string, unknown> => ({
  children: [
    {
      detail: 0,
      format: 0,
      mode: 'normal',
      style: '',
      text,
      type: 'text',
      version: 1,
    },
  ],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  textFormat: 0,
  textStyle: '',
  type: 'paragraph',
  version: 1,
})

const lexicalContent = (...children: Record<string, unknown>[]): SerializedEditorState =>
  ({
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }) as unknown as SerializedEditorState

describe('post Markdown conversion', () => {
  it('round-trips common Markdown and fenced code through the post editor config', async () => {
    const config = await configPromise
    const editorConfig = getPostContentEditorConfig(config)
    const markdown = [
      '## Heading',
      '',
      'A **bold** and *italic* [link](https://example.com).',
      '',
      '- first',
      '- second',
      '',
      '> quoted',
      '',
      '```ts',
      'const answer = 42',
      '```',
    ].join('\n')

    const lexical = convertPostMarkdownToLexical({ editorConfig, markdown })
    const roundTripped = convertPostLexicalToMarkdown({ data: lexical, editorConfig }).markdown

    expect(roundTripped).toContain('## Heading')
    expect(roundTripped).toContain('**bold**')
    expect(roundTripped).toContain('[link](https://example.com)')
    expect(roundTripped).toContain('- first')
    expect(roundTripped).toContain('> quoted')
    expect(roundTripped).toContain('```ts\nconst answer = 42\n```')
  })

  it('preserves Payload upload relationships with the official placeholder syntax', async () => {
    const config = await configPromise
    const editorConfig = getPostContentEditorConfig(config)
    const source = lexicalContent(paragraph('Before image'), {
      fields: {},
      format: '',
      id: 'upload-node',
      relationTo: 'media',
      type: 'upload',
      value: {
        alt: 'A diagram',
        id: 42,
        mimeType: 'image/png',
        url: 'https://media.example.com/diagram.png',
      },
      version: 1,
    })
    const snapshot = structuredClone(source)

    const result = convertPostLexicalToMarkdown({ data: source, editorConfig })
    const restored = convertPostMarkdownToLexical({
      editorConfig,
      markdown: result.markdown,
    })
    const upload = restored.root.children.find((node) => node.type === 'upload')

    expect(result.markdown).toContain('![media:42]()')
    expect(upload).toMatchObject({ relationTo: 'media', value: 42 })
    expect(source).toEqual(snapshot)
  })

  it('normalizes populated upload nodes without mutating the source', () => {
    const source = lexicalContent({
      fields: {},
      format: '',
      id: 'upload-node',
      relationTo: 'media',
      type: 'upload',
      value: { id: 7, url: '/seven.png' },
      version: 1,
    })

    const normalized = normalizeUploadNodes(source)

    expect(normalized.root.children[0]).toMatchObject({ value: 7 })
    expect(source.root.children[0]).toMatchObject({ value: { id: 7, url: '/seven.png' } })
  })

  it('warns about Lexical formatting that Markdown cannot preserve', () => {
    const source = lexicalContent({
      ...paragraph('Styled'),
      format: 'center',
      indent: 1,
      children: [
        {
          detail: 0,
          format: 8 | 32,
          mode: 'normal',
          style: '',
          text: 'Styled',
          type: 'text',
          version: 1,
        },
      ],
    })

    expect(collectMarkdownWarnings(source)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('下划线'),
        expect.stringContaining('上下标'),
        expect.stringContaining('对齐'),
        expect.stringContaining('缩进'),
      ]),
    )
  })
})
