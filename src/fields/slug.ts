import type { Field } from 'payload'

import { formatSlug } from '@/lib/slug'

export const createSlugField = (): Field => ({
  name: 'slug',
  type: 'text',
  admin: {
    description: 'Used in the public URL. Leave empty to generate it from the title.',
    position: 'sidebar',
  },
  hooks: {
    beforeValidate: [
      ({ siblingData, value }) => {
        if (typeof value === 'string' && value.trim()) return formatSlug(value)
        if (typeof siblingData?.title === 'string') return formatSlug(siblingData.title)
        if (typeof siblingData?.name === 'string') return formatSlug(siblingData.name)
        return value
      },
    ],
  },
  index: true,
  localized: true,
  required: true,
  unique: true,
})
