import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Media } from '@/payload-types'
import {
  RichText as PayloadRichText,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'

type CodeBlockFields = {
  code?: string
  language?: string
}

type PostNodeTypes = DefaultNodeTypes | SerializedBlockNode<CodeBlockFields>

const postConverters: JSXConvertersFunction<PostNodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  upload: (args) => {
    const { node } = args
    if (!node.value || typeof node.value !== 'object') return null

    const media = node.value as Media
    if (!media.url) return null
    if (!media.mimeType?.startsWith('image/')) {
      const converter = defaultConverters.upload
      return typeof converter === 'function' ? converter(args) : converter
    }

    return (
      // Body images must not use the cropped card/hero responsive sources.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={node.fields?.alt || media.alt || ''}
        height={media.height || undefined}
        src={media.url}
        width={media.width || undefined}
      />
    )
  },
  blocks: {
    ...defaultConverters.blocks,
    Code: ({ node }: { node: SerializedBlockNode<CodeBlockFields> }) => (
      <pre>
        <code data-language={node.fields.language || undefined}>{node.fields.code || ''}</code>
      </pre>
    ),
  },
})

export function PostRichText({ data }: { data: SerializedEditorState }) {
  return <PayloadRichText converters={postConverters} data={data} />
}
