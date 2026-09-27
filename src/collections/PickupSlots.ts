import {
  APIError,
  commitTransaction,
  initTransaction,
  killTransaction,
  ValidationError,
} from 'payload'
import type { CollectionConfig, Where } from 'payload'

import { authenticated } from '@/access'
import { dateKeyToStorage, TIME_PATTERN, toShopDateKey } from '@/lib/dates'
import {
  computeDefaultDeadline,
  formatSlotTitle,
  validateDeadline,
  validateSlotTimes,
} from '@/lib/pickup-slots'
import {
  generateRecurringSlots,
  getDeadlineRule,
  parseRecurringSlotsInput,
} from '@/services/pickup-slots'

export const PickupSlots: CollectionConfig = {
  slug: 'pickup-slots',
  labels: { singular: 'Passage', plural: 'Passages' },
  defaultSort: 'date',
  admin: {
    group: 'Tournée',
    useAsTitle: 'title',
    defaultColumns: ['date', 'location', 'startTime', 'orderDeadline', 'maxOrders', 'isOpen'],
    listSearchableFields: ['title'],
    components: {
      beforeListTable: ['/components/admin/GenerateSlotsForm#GenerateSlotsForm'],
    },
  },
  access: {
    // Le public ne voit que les passages ouverts, pas encore clos, dans un lieu actif.
    read: ({ req }): boolean | Where =>
      req.user
        ? true
        : {
            and: [
              { isOpen: { equals: true } },
              { orderDeadline: { greater_than: new Date().toISOString() } },
              { 'location.active': { equals: true } },
            ],
          },
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  indexes: [{ fields: ['location', 'date'], unique: true }],
  endpoints: [
    {
      // POST /api/pickup-slots/generate : création en série des passages récurrents.
      path: '/generate',
      method: 'post',
      handler: async (req) => {
        if (!req.user) throw new APIError('Non autorisé.', 401, undefined, true)
        const input = parseRecurringSlotsInput(await req.json?.())
        if (typeof input === 'string') return Response.json({ error: input }, { status: 400 })

        const location = await req.payload.findByID({
          collection: 'locations',
          id: input.location,
          depth: 0,
          disableErrors: true,
          req,
        })
        if (!location) return Response.json({ error: 'Lieu introuvable.' }, { status: 400 })

        const shouldCommit = await initTransaction(req)
        try {
          const result = await generateRecurringSlots(req.payload, input, req)
          if (shouldCommit) await commitTransaction(req)
          return Response.json(result)
        } catch (error) {
          await killTransaction(req)
          const message = error instanceof Error ? error.message : 'Erreur inconnue.'
          return Response.json({ error: message }, { status: 400 })
        }
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const merged = { ...originalDoc, ...data }
        const dateKey = toShopDateKey(merged.date)
        const locationId =
          typeof merged.location === 'object' ? merged.location?.id : merged.location

        const duplicate = await req.payload.count({
          collection: 'pickup-slots',
          where: {
            and: [
              { location: { equals: locationId } },
              { date: { equals: dateKeyToStorage(dateKey) } },
              ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
            ],
          },
          req,
        })
        if (duplicate.totalDocs > 0) {
          throw new ValidationError({
            collection: 'pickup-slots',
            errors: [
              { path: 'date', message: 'Un passage existe déjà pour ce lieu à cette date.' },
            ],
            req,
          })
        }

        if (!merged.orderDeadline) {
          const rule = await getDeadlineRule(req.payload, req)
          data.orderDeadline = computeDefaultDeadline(dateKey, rule).toISOString()
        }
        const deadlineError = validateDeadline(
          new Date(data.orderDeadline ?? merged.orderDeadline),
          dateKey,
          merged.startTime,
        )
        if (deadlineError) {
          throw new ValidationError({
            collection: 'pickup-slots',
            errors: [{ path: 'orderDeadline', message: deadlineError }],
            req,
          })
        }

        const location = await req.payload.findByID({
          collection: 'locations',
          id: locationId,
          depth: 0,
          req,
        })
        data.title = formatSlotTitle(dateKey, location.name, merged.startTime, merged.endTime)
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Passage',
      admin: { hidden: true },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'date',
          label: 'Date',
          required: true,
          index: true,
          admin: {
            date: { pickerAppearance: 'dayOnly', displayFormat: 'EEEE d MMMM yyyy' },
          },
          hooks: {
            // Date civile à Paris, stockée à midi UTC (voir src/lib/dates.ts).
            beforeValidate: [
              ({ value }) => (value ? dateKeyToStorage(toShopDateKey(value)) : value),
            ],
          },
        },
        {
          name: 'location',
          type: 'relationship',
          label: 'Lieu',
          relationTo: 'locations',
          required: true,
          index: true,
          filterOptions: { active: { equals: true } },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startTime',
          type: 'text',
          label: 'Début',
          required: true,
          admin: { placeholder: '09:30', description: 'HH:mm' },
          validate: (value: string | null | undefined) =>
            (typeof value === 'string' && TIME_PATTERN.test(value)) || 'Format HH:mm (ex. 09:30).',
        },
        {
          name: 'endTime',
          type: 'text',
          label: 'Fin',
          required: true,
          admin: { placeholder: '10:15', description: 'HH:mm' },
          validate: (
            value: string | null | undefined,
            { siblingData }: { siblingData: Partial<{ startTime: string }> },
          ) => validateSlotTimes(String(siblingData.startTime ?? ''), String(value ?? '')) ?? true,
        },
      ],
    },
    {
      name: 'orderDeadline',
      type: 'date',
      label: 'Date limite de commande',
      index: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'EEEE d MMMM yyyy HH:mm' },
        description:
          'Laisser vide pour appliquer la règle des réglages boutique (par défaut la veille à 18:00).',
      },
    },
    {
      name: 'maxOrders',
      type: 'number',
      label: 'Commandes maximum',
      min: 1,
      admin: { description: 'Optionnel. Laisser vide pour ne pas limiter.' },
      validate: (value: number | null | undefined) =>
        value === null ||
        value === undefined ||
        (Number.isInteger(value) && value >= 1) ||
        'Nombre entier supérieur ou égal à 1.',
    },
    {
      name: 'productLimits',
      type: 'array',
      label: 'Quantités maximum par produit',
      labels: { singular: 'Limite', plural: 'Limites' },
      admin: {
        description: 'Optionnel. Ex. 20 brioches au maximum pour ce passage.',
        initCollapsed: true,
      },
      validate: (rows: unknown) => {
        const ids = ((rows as { product?: number | { id: number } }[] | null) ?? []).map((row) =>
          typeof row.product === 'object' ? row.product?.id : row.product,
        )
        return new Set(ids).size === ids.length || 'Chaque produit ne peut apparaître qu’une fois.'
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'product',
              type: 'relationship',
              label: 'Produit',
              relationTo: 'products',
              required: true,
            },
            {
              name: 'maxQuantity',
              type: 'number',
              label: 'Quantité maximum',
              required: true,
              min: 1,
              validate: (value: number | null | undefined) =>
                (typeof value === 'number' && Number.isInteger(value) && value >= 1) ||
                'Nombre entier supérieur ou égal à 1.',
            },
          ],
        },
      ],
    },
    {
      name: 'publicNote',
      type: 'text',
      label: 'Note pour les clients',
      admin: { description: 'Ex. « Le camion sera exceptionnellement devant la mairie ».' },
    },
    {
      name: 'isOpen',
      type: 'checkbox',
      label: 'Ouvert aux commandes',
      defaultValue: true,
      index: true,
      admin: { position: 'sidebar' },
    },
  ],
}
