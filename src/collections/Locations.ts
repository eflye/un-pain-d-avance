import { APIError } from 'payload'
import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access'
import { slugField } from '@/fields/slug'

export const Locations: CollectionConfig = {
  slug: 'locations',
  labels: { singular: 'Lieu de retrait', plural: 'Lieux de retrait' },
  orderable: true,
  admin: {
    group: 'Tournée',
    useAsTitle: 'name',
    defaultColumns: ['name', 'address', 'active'],
  },
  access: {
    read: ({ req }) => (req.user ? true : { active: { equals: true } }),
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeDelete: [
      // Supprimer un lieu casserait l'historique des passages et des commandes : on le désactive.
      async ({ id, req }) => {
        const { totalDocs } = await req.payload.count({
          collection: 'pickup-slots',
          where: { location: { equals: id } },
          req,
        })
        if (totalDocs > 0) {
          throw new APIError(
            'Ce lieu a des passages : décochez « Actif » plutôt que de le supprimer.',
            400,
            undefined,
            true,
          )
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nom',
      required: true,
      unique: true,
      admin: { description: 'Nom affiché au client, en général le village (ex. « Montgeroult »).' },
    },
    slugField(
      'name',
      'Adresse de la page du village (ex. /village/montgeroult), à utiliser dans les QR codes. Générée à la création, puis stable.',
    ),
    {
      name: 'address',
      type: 'text',
      label: 'Emplacement',
      required: true,
      admin: { description: 'Ex. « Place de l’église, 95650 Montgeroult ».' },
    },
    {
      name: 'directions',
      type: 'textarea',
      label: 'Indications',
      admin: { description: 'Précisions pour trouver le camion (optionnel).' },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Actif',
      defaultValue: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Un lieu inactif et ses passages ne sont plus proposés aux clients.',
      },
    },
  ],
}
