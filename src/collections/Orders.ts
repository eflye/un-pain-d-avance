import { ValidationError } from 'payload'
import type { CollectionConfig, FieldAccess } from 'payload'

import { authenticated } from '@/access'
import {
  canTransition,
  generateReference,
  ORDER_STATUSES,
  type OrderStatus,
  statusLabel,
} from '@/lib/orders'

// Champs fixés à la création par le serveur (API locale) : jamais modifiables depuis l'admin ou l'API REST.
const serverOnly: FieldAccess = () => false

const euroAdmin = {
  components: {
    Field: '/components/admin/EuroPriceField#EuroPriceField',
    Cell: '/components/admin/EuroPriceCell#EuroPriceCell',
  },
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Commande', plural: 'Commandes' },
  defaultSort: '-createdAt',
  admin: {
    group: 'Commandes',
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'pickupSlot', 'status', 'totalCents', 'createdAt'],
    listSearchableFields: ['reference', 'customer.lastName', 'customer.email'],
  },
  access: {
    // Commandes créées uniquement par le serveur (parcours de paiement) et jamais supprimées.
    read: authenticated,
    create: () => false,
    update: authenticated,
    delete: () => false,
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation !== 'create' || !data || data.reference) return data
        // Référence courte unique ; la collision est très improbable mais vérifiée.
        for (;;) {
          const reference = generateReference()
          const { totalDocs } = await req.payload.count({
            collection: 'orders',
            where: { reference: { equals: reference } },
            req,
          })
          if (totalDocs === 0) return { ...data, reference }
        }
      },
    ],
    beforeChange: [
      ({ data, originalDoc, operation, req }) => {
        if (operation !== 'update' || !data.status || !originalDoc) return data
        const from = originalDoc.status as OrderStatus
        const to = data.status as OrderStatus
        // « Payée » est réservé à la confirmation Stripe (API locale, sans utilisateur connecté).
        if (req.user && to === 'payee' && from !== 'payee') {
          throw new ValidationError({
            collection: 'orders',
            errors: [
              {
                path: 'status',
                message:
                  'Seul un paiement confirmé par Stripe peut passer une commande à « Payée ».',
              },
            ],
            req,
          })
        }
        if (!canTransition(from, to)) {
          throw new ValidationError({
            collection: 'orders',
            errors: [
              {
                path: 'status',
                message: `Passage du statut « ${statusLabel(from)} » à « ${statusLabel(to)} » impossible.`,
              },
            ],
            req,
          })
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'reference',
      type: 'text',
      label: 'Référence',
      unique: true,
      index: true,
      access: { update: serverOnly },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Statut',
      required: true,
      defaultValue: 'en_attente_paiement',
      index: true,
      options: [...ORDER_STATUSES],
      admin: {
        position: 'sidebar',
        description:
          'Le passage à « Payée » est fait automatiquement à la confirmation du paiement Stripe. Seuls les changements de statut cohérents sont acceptés.',
      },
    },
    {
      name: 'pickupSlot',
      type: 'relationship',
      label: 'Passage',
      relationTo: 'pickup-slots',
      required: true,
      index: true,
      access: { update: serverOnly },
    },
    {
      name: 'customer',
      type: 'group',
      label: 'Client',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'firstName', type: 'text', label: 'Prénom', required: true },
            { name: 'lastName', type: 'text', label: 'Nom', required: true },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'email', type: 'email', label: 'E-mail', required: true },
            { name: 'phone', type: 'text', label: 'Téléphone', required: true },
          ],
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: 'Articles',
      labels: { singular: 'Article', plural: 'Articles' },
      required: true,
      minRows: 1,
      access: { update: serverOnly },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'product',
              type: 'relationship',
              label: 'Produit',
              relationTo: 'products',
            },
            {
              name: 'productName',
              type: 'text',
              label: 'Libellé à la commande',
              required: true,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'unitPriceCents',
              type: 'number',
              label: 'Prix unitaire',
              required: true,
              admin: euroAdmin,
            },
            { name: 'quantity', type: 'number', label: 'Quantité', required: true, min: 1 },
            {
              name: 'lineTotalCents',
              type: 'number',
              label: 'Total ligne',
              required: true,
              admin: euroAdmin,
            },
          ],
        },
      ],
    },
    {
      name: 'totalCents',
      type: 'number',
      label: 'Total',
      required: true,
      min: 0,
      access: { update: serverOnly },
      admin: { ...euroAdmin, position: 'sidebar' },
    },
    {
      name: 'customerNote',
      type: 'textarea',
      label: 'Message du client',
      access: { update: serverOnly },
    },
    {
      name: 'internalNote',
      type: 'textarea',
      label: 'Note interne',
      admin: { description: 'Visible uniquement dans le back-office.' },
    },
    {
      type: 'collapsible',
      label: 'Paiement',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'expiresAt',
          type: 'date',
          label: 'Expiration de la session de paiement',
          access: { update: serverOnly },
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'paidAt',
          type: 'date',
          label: 'Payée le',
          access: { update: serverOnly },
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'stripeCheckoutSessionId',
          type: 'text',
          label: 'Session Stripe Checkout',
          unique: true,
          index: true,
          access: { update: serverOnly },
        },
        {
          name: 'stripePaymentIntentId',
          type: 'text',
          label: 'Paiement Stripe (PaymentIntent)',
          access: { update: serverOnly },
        },
        {
          name: 'termsAcceptedAt',
          type: 'date',
          label: 'CGV acceptées le',
          required: true,
          access: { update: serverOnly },
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
  ],
}
