import type { TextField } from 'payload'

import { slugify } from '@/lib/slug'

/** Identifiant d'URL généré depuis `sourceField` à la création, puis stable (liens et QR codes). */
export function slugField(sourceField: string, description: string): TextField {
  return {
    name: 'slug',
    type: 'text',
    label: 'Identifiant d’URL',
    unique: true,
    index: true,
    admin: { position: 'sidebar', description },
    hooks: {
      // beforeValidate : le slug doit exister avant la validation de l'unicité.
      beforeValidate: [
        ({ value, data }) =>
          value || (data?.[sourceField] ? slugify(String(data[sourceField])) : value),
      ],
    },
  }
}
