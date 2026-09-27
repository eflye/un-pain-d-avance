import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Catégorie', plural: 'Catégories' },
  orderable: true,
  admin: {
    group: 'Catalogue',
    useAsTitle: 'name',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nom',
      required: true,
      unique: true,
    },
  ],
}
