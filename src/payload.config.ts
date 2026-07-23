import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'
import { getServerConfig } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const server = getServerConfig()
const r2 = server.r2

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Authors, Categories, Media, Posts],
  cors: server.corsOrigins,
  csrf: server.corsOrigins,
  db: postgresAdapter({
    pool: {
      connectionString: server.databaseURL,
      max: process.env.NODE_ENV === 'production' ? 10 : 5,
      ssl: server.databaseURL.includes('supabase') ? { rejectUnauthorized: false } : undefined,
    },
    push: process.env.NODE_ENV !== 'production',
  }),
  editor: lexicalEditor(),
  experimental: {
    localizeStatus: true,
  },
  globals: [SiteSettings],
  localization: {
    defaultLocale: 'en',
    fallback: false,
    locales: [
      {
        code: 'en',
        label: 'English',
      },
      {
        code: 'zh',
        label: '中文',
      },
    ],
  },
  plugins: [
    s3Storage({
      alwaysInsertFields: true,
      bucket: r2?.bucket || 'local-media',
      collections: {
        media: {
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename: mediaFilename, prefix }) => {
            const key = [prefix, mediaFilename].filter(Boolean).join('/')
            return `${r2?.publicURL || server.siteURL}/${key}`
          },
          prefix: 'media',
        },
      },
      config: {
        credentials: {
          accessKeyId: r2?.accessKeyId || 'local',
          secretAccessKey: r2?.secretAccessKey || 'local',
        },
        endpoint: r2?.endpoint || 'http://localhost',
        forcePathStyle: true,
        region: 'auto',
      },
      enabled: Boolean(r2),
    }),
  ],
  secret: server.payloadSecret,
  serverURL: server.siteURL,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
