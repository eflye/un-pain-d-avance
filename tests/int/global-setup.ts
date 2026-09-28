import { getPayload } from 'payload'

import config from '@/payload.config'

/**
 * Initialise Payload une fois avant tous les fichiers de test : sur une base vide (CI),
 * le schéma est créé ici au lieu d'être poussé en parallèle par chaque fichier.
 */
export async function setup() {
  const payload = await getPayload({ config: await config })
  await payload.destroy()
}
