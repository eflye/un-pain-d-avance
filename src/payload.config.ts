import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { fr } from '@payloadcms/translations/languages/fr'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Locations } from './collections/Locations'
import { PickupSlots } from './collections/PickupSlots'
import { Orders } from './collections/Orders'
import { ShopSettings } from './globals/ShopSettings'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Orders, PickupSlots, Locations, Categories, Products, Media, Users],
  globals: [ShopSettings],
  i18n: {
    supportedLanguages: { fr },
    fallbackLanguage: 'fr',
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // En production (NODE_ENV=production), les migrations sont appliquées au démarrage.
    // En dev, Payload pousse le schéma directement : créer une migration à chaque changement
    // de schéma destiné à être déployé (npm run payload migrate:create <nom>).
    prodMigrations: migrations,
  }),
  // SMTP si configuré (Mailpit en dev, prestataire en production) ; sinon e-mails écrits dans les logs.
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.EMAIL_FROM || 'commandes@example.fr',
        defaultFromName: process.env.EMAIL_FROM_NAME || "Un pain d'avance",
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
            : undefined,
        },
      })
    : undefined,
  sharp,
  plugins: [],
})
