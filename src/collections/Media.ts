import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Média', plural: 'Médias' },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texte alternatif',
      required: true,
    },
  ],
  // MEDIA_DIR (production) : dossier persistant monté en volume ; sinon dossier par défaut de Payload.
  upload: process.env.MEDIA_DIR ? { staticDir: process.env.MEDIA_DIR } : true,
}
