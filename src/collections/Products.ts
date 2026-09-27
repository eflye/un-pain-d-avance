import { APIError } from 'payload'
import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access'
import { ALLERGENS } from '@/fields/allergens'
import { slugField } from '@/fields/slug'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Produit', plural: 'Produits' },
  orderable: true,
  admin: {
    group: 'Catalogue',
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'priceCents', 'active'],
  },
  access: {
    // Le public ne voit que les produits actifs ; le back-office voit tout.
    read: ({ req }) => (req.user ? true : { active: { equals: true } }),
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeDelete: [
      // Un produit déjà commandé reste en base pour l'historique : on le retire de la vente.
      async ({ id, req }) => {
        const { totalDocs } = await req.payload.count({
          collection: 'orders',
          where: { 'items.product': { equals: id } },
          req,
        })
        if (totalDocs > 0) {
          throw new APIError(
            'Ce produit figure dans des commandes : décochez « En vente » plutôt que de le supprimer.',
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
    },
    slugField('name', 'Généré depuis le nom à la création, puis stable.'),
    {
      name: 'category',
      type: 'relationship',
      label: 'Catégorie',
      relationTo: 'categories',
      required: true,
      index: true,
    },
    {
      name: 'priceCents',
      type: 'number',
      label: 'Prix',
      required: true,
      min: 1,
      admin: {
        description: 'Prix de vente TTC en euros (ex. 2,50).',
        components: {
          Field: '/components/admin/EuroPriceField#EuroPriceField',
          Cell: '/components/admin/EuroPriceCell#EuroPriceCell',
        },
      },
      validate: (value: number | null | undefined) =>
        (typeof value === 'number' && Number.isInteger(value) && value > 0) ||
        'Le prix doit être un montant positif (ex. 2,50).',
    },
    {
      name: 'unitLabel',
      type: 'text',
      label: 'Unité',
      admin: { description: 'Ex. « pièce », « 400 g », « 6 parts ».' },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    {
      name: 'image',
      type: 'upload',
      label: 'Photo',
      relationTo: 'media',
    },
    {
      name: 'allergens',
      type: 'select',
      label: 'Allergènes',
      hasMany: true,
      options: [...ALLERGENS],
      admin: { description: 'Affichés au client avant l’achat. Laisser vide si aucun.' },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'En vente',
      defaultValue: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Décocher pour retirer le produit de la vente sans le supprimer.',
      },
    },
  ],
}
