import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Endpoint, PayloadHandler, SanitizedConfig } from 'payload'

import { convertPostLexicalToMarkdown, convertPostMarkdownToLexical } from '@/lib/markdown'
import { getPostContentEditorConfig } from '@/lib/postContentEditor'

export const MAX_MARKDOWN_REQUEST_BYTES = 1024 * 1024

type HandlerDependencies = {
  getEditorConfig?: typeof getPostContentEditorConfig
  toLexical?: typeof convertPostMarkdownToLexical
  toMarkdown?: typeof convertPostLexicalToMarkdown
}

function isLexicalState(value: unknown): value is SerializedEditorState {
  if (typeof value !== 'object' || value === null || !('root' in value)) return false
  const root = value.root

  return (
    typeof root === 'object' &&
    root !== null &&
    'children' in root &&
    Array.isArray(root.children) &&
    root.children.length > 0 &&
    'type' in root &&
    root.type === 'root'
  )
}

export function createMarkdownConvertHandler({
  getEditorConfig = getPostContentEditorConfig,
  toLexical = convertPostMarkdownToLexical,
  toMarkdown = convertPostLexicalToMarkdown,
}: HandlerDependencies = {}): PayloadHandler {
  return async (req) => {
    if (!req.user) {
      return Response.json({ error: '禁止访问' }, { status: 403 })
    }

    const rawBody = await req.text()
    if (new TextEncoder().encode(rawBody).byteLength > MAX_MARKDOWN_REQUEST_BYTES) {
      return Response.json({ error: '请求内容过大' }, { status: 413 })
    }

    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return Response.json({ error: '请求格式无效' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null || !('direction' in body)) {
      return Response.json({ error: '请求格式无效' }, { status: 400 })
    }

    try {
      const editorConfig = getEditorConfig(req.payload.config as SanitizedConfig)

      if (
        body.direction === 'lexical-to-markdown' &&
        'lexical' in body &&
        isLexicalState(body.lexical)
      ) {
        return Response.json(toMarkdown({ data: body.lexical, editorConfig }))
      }

      if (
        body.direction === 'markdown-to-lexical' &&
        'markdown' in body &&
        typeof body.markdown === 'string' &&
        body.markdown.trim().length > 0
      ) {
        return Response.json({
          lexical: toLexical({ editorConfig, markdown: body.markdown }),
        })
      }

      return Response.json({ error: '请求格式无效' }, { status: 400 })
    } catch {
      return Response.json({ error: 'Markdown 转换失败' }, { status: 422 })
    }
  }
}

export const markdownConvertEndpoint: Endpoint = {
  handler: createMarkdownConvertHandler(),
  method: 'post',
  path: '/markdown/convert',
}
