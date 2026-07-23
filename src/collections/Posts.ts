import type { CollectionConfig } from 'payload'

import { authenticated, authenticatedOrPublished } from '@/access'
import { createSlugField } from '@/fields/slug'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['title', '_status', 'publishedAt', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    createSlugField(),
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      maxLength: 320,
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
      required: true,
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      hasMany: true,
      relationTo: 'categories',
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (value) return value
            return siblingData?._status === 'published' ? new Date().toISOString() : value
          },
        ],
      },
      localized: true,
    },
    {
      name: 'meta',
      type: 'group',
      fields: [
        {
          name: 'title',
          type: 'text',
          maxLength: 70,
        },
        {
          name: 'description',
          type: 'textarea',
          maxLength: 160,
        },
      ],
      localized: true,
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 800,
      },
      localizeStatus: true,
    },
    maxPerDoc: 50,
  },
}
