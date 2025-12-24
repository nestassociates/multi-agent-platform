import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

import { Posts } from './collections/Posts'
import { Media } from './collections/Media'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // Admin panel settings
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- Nest Associates',
    },
  },

  // Collections
  collections: [Users, Media, Posts],

  // Rich text editor
  editor: lexicalEditor(),

  // Secret for encryption
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-in-production',

  // TypeScript output
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // Database adapter - Supabase Postgres
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Use a separate schema for Payload tables to keep them organized
    schemaName: 'payload',
  }),

  // Image processing
  sharp,

  // Plugins (can add more later)
  plugins: [],
})
