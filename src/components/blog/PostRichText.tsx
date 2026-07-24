import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
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
