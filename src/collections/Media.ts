import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      required: true,
    },
  ],
  upload: {
    crop: true,
    focalPoint: true,
    imageSizes: [
      {
        name: 'card',
        width: 900,
        height: 600,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1800,
        height: 1200,
        position: 'centre',
      },
    ],
    mimeTypes: ['image/*'],
  },
}
