import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access'
import { ALLERGENS } from '@/fields/allergens'
import { slugify } from '@/lib/slug'

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
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nom',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Identifiant d’URL',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Généré depuis le nom à la création, puis stable.',
      },
      hooks: {
        // beforeValidate : le slug doit exister avant la validation de l'unicité.
        beforeValidate: [
          ({ value, data }) => value || (data?.name ? slugify(String(data.name)) : value),
        ],
      },
    },
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
