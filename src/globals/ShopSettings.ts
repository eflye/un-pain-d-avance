import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { TIME_PATTERN } from '@/lib/dates'
import { FALLBACK_DEADLINE_RULE } from '@/lib/pickup-slots'

export const ShopSettings: GlobalConfig = {
  slug: 'shop-settings',
  label: 'Réglages boutique',
  admin: { group: 'Réglages' },
  access: {
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: 'shopName',
      type: 'text',
      label: 'Nom de la boutique',
      required: true,
      defaultValue: "Un pain d'avance",
    },
    {
      type: 'row',
      fields: [
        { name: 'contactEmail', type: 'email', label: 'E-mail de contact' },
        { name: 'contactPhone', type: 'text', label: 'Téléphone de contact' },
      ],
    },
    {
      name: 'defaultDeadline',
      type: 'group',
      label: 'Date limite de commande par défaut',
      admin: {
        description:
          'Appliquée à chaque nouveau passage dont la date limite est laissée vide. Modifiable ensuite passage par passage.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'daysBefore',
              type: 'number',
              label: 'Jours avant le passage',
              required: true,
              min: 0,
              max: 14,
              defaultValue: FALLBACK_DEADLINE_RULE.daysBefore,
              admin: { description: '0 = le jour même, 1 = la veille…' },
              validate: (value: number | null | undefined) =>
                (typeof value === 'number' &&
                  Number.isInteger(value) &&
                  value >= 0 &&
                  value <= 14) ||
                'Nombre entier de jours entre 0 et 14.',
            },
            {
              name: 'time',
              type: 'text',
              label: 'Heure limite',
              required: true,
              defaultValue: FALLBACK_DEADLINE_RULE.time,
              admin: { description: 'Format HH:mm, heure de Paris (ex. 18:00).' },
              validate: (value: string | null | undefined) =>
                (typeof value === 'string' && TIME_PATTERN.test(value)) ||
                'Heure attendue au format HH:mm (ex. 18:00).',
            },
          ],
        },
      ],
    },
    {
      name: 'termsOfSale',
      type: 'richText',
      label: 'Conditions générales de vente',
      admin: {
        description:
          'Doivent mentionner que le droit de rétractation ne s’applique pas aux denrées périssables.',
      },
    },
  ],
}
