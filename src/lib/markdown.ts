import { convertLexicalToMarkdown, convertMarkdownToLexical } from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical'

type UnknownRecord = Record<string, unknown>

const warningMessages = {
  alignment: 'Markdown 不支持文本对齐，应用后该格式会被移除。',
  indent: 'Markdown 不支持缩进，应用后该格式会被移除。',
  relationship: 'Markdown 不支持关系节点，应用后该内容可能被规范化。',
  subscript: 'Markdown 不支持上下标，应用后该格式会被移除。',
  underline: 'Markdown 不支持下划线，应用后该格式会被移除。',
} as const

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function visit(value: unknown, visitor: (node: UnknownRecord) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, visitor)
    return
  }

  if (!isRecord(value)) return

  visitor(value)
  for (const child of Object.values(value)) visit(child, visitor)
}

export function normalizeUploadNodes(data: SerializedEditorState): SerializedEditorState {
  const normalized = structuredClone(data)

  visit(normalized, (node) => {
    if (node.type !== 'upload' || !isRecord(node.value)) return

    const id = node.value.id
    if (typeof id === 'number' || typeof id === 'string') {
      node.value = id
    }
  })

  return normalized
}

export function collectMarkdownWarnings(data: SerializedEditorState): string[] {
  const warnings = new Set<string>()

  visit(data, (node) => {
    if (node.type === 'relationship') warnings.add(warningMessages.relationship)
    if (typeof node.indent === 'number' && node.indent > 0) warnings.add(warningMessages.indent)
    if (
      typeof node.format === 'string' &&
      node.format !== '' &&
      node.format !== 'left' &&
      node.type !== 'text'
    ) {
      warnings.add(warningMessages.alignment)
    }

    if (node.type === 'text' && typeof node.format === 'number') {
      if ((node.format & 8) !== 0) warnings.add(warningMessages.underline)
      if ((node.format & (32 | 64)) !== 0) warnings.add(warningMessages.subscript)
    }
  })

  return [...warnings]
}

export function convertPostLexicalToMarkdown({
  data,
  editorConfig,
}: {
  data: SerializedEditorState
  editorConfig: SanitizedServerEditorConfig
}) {
  return {
    markdown: convertLexicalToMarkdown({
      data: normalizeUploadNodes(data),
      editorConfig,
    }),
    warnings: collectMarkdownWarnings(data),
  }
}

export function convertPostMarkdownToLexical({
  editorConfig,
  markdown,
}: {
  editorConfig: SanitizedServerEditorConfig
  markdown: string
}) {
  return convertMarkdownToLexical({ editorConfig, markdown })
}
