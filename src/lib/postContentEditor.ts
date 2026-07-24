import {
  BlocksFeature,
  CodeBlock,
  editorConfigFactory,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { RichTextField, SanitizedConfig } from 'payload'

export const postContentEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: [CodeBlock()],
    }),
  ],
})

export function getPostContentEditorConfig(config: SanitizedConfig) {
  const posts = config.collections.find((collection) => collection.slug === 'posts')
  const content = posts?.fields.find(
    (field): field is RichTextField =>
      'name' in field && field.name === 'content' && field.type === 'richText',
  )

  if (!content) {
    throw new Error('Posts.content rich text field is not configured')
  }

  return editorConfigFactory.fromField({ field: content })
}
