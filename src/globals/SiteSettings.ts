import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      maxLength: 200,
      required: true,
    },
    {
      name: 'defaultMeta',
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
}
