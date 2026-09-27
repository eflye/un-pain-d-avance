/**
 * Données de démonstration pour le développement : catégories, produits, deux villages
 * et leurs passages des quatre prochaines semaines. Idempotent : ne recrée pas l'existant.
 *
 *   podman compose exec app npm run seed:demo
 *
 * Contenus fictifs (noms, prix) : à remplacer par le vrai catalogue dans l'admin.
 */
import 'dotenv/config'

import { getPayload } from 'payload'

import { addDays, toShopDateKey } from '../src/lib/dates'
import config from '../src/payload.config'
import { generateRecurringSlots } from '../src/services/pickup-slots'

const CATALOG: Record<string, [string, number, string, string[]][]> = {
  Pains: [
    ['Baguette tradition', 130, 'pièce', ['gluten']],
    ['Pain de campagne', 380, '800 g', ['gluten']],
    ['Pain aux céréales', 420, '500 g', ['gluten', 'sesame']],
  ],
  Viennoiseries: [
    ['Croissant pur beurre', 125, 'pièce', ['gluten', 'lait', 'oeufs']],
    ['Pain au chocolat', 140, 'pièce', ['gluten', 'lait', 'oeufs', 'soja']],
    ['Brioche tressée', 650, '500 g', ['gluten', 'lait', 'oeufs']],
  ],
  Pâtisseries: [
    ['Tarte aux pommes', 1650, '6 parts', ['gluten', 'lait', 'oeufs']],
    ['Flan pâtissier', 290, 'part', ['gluten', 'lait', 'oeufs']],
  ],
}

const VILLAGES = [
  {
    name: 'Montgeroult',
    address: 'Place de l’église, 95650 Montgeroult',
    weekday: 6,
    start: '09:30',
    end: '10:15',
  },
  {
    name: 'Courcelles-sur-Viosne',
    address: 'Parking de la mairie, 95650 Courcelles-sur-Viosne',
    weekday: 6,
    start: '10:45',
    end: '11:30',
  },
]

async function findOrCreate<T extends { id: number }>(
  find: () => Promise<{ docs: T[] }>,
  create: () => Promise<T>,
): Promise<[T, boolean]> {
  const { docs } = await find()
  return docs[0] ? [docs[0], false] : [await create(), true]
}

async function main() {
  const payload = await getPayload({ config: await config })
  let created = 0

  let limitedProductId: number | undefined
  for (const [categoryName, products] of Object.entries(CATALOG)) {
    const [category, isNew] = await findOrCreate(
      () =>
        payload.find({
          collection: 'categories',
          where: { name: { equals: categoryName } },
          limit: 1,
        }),
      () => payload.create({ collection: 'categories', data: { name: categoryName } }),
    )
    created += Number(isNew)
    for (const [name, priceCents, unitLabel, allergens] of products) {
      const [product, productIsNew] = await findOrCreate(
        () => payload.find({ collection: 'products', where: { name: { equals: name } }, limit: 1 }),
        () =>
          payload.create({
            collection: 'products',
            data: {
              name,
              priceCents,
              unitLabel,
              category: category.id,
              allergens: allergens as never,
            },
          }),
      )
      created += Number(productIsNew)
      if (name === 'Brioche tressée') limitedProductId = product.id
    }
  }

  const today = toShopDateKey(new Date())
  for (const village of VILLAGES) {
    const [location, isNew] = await findOrCreate(
      () =>
        payload.find({
          collection: 'locations',
          where: { name: { equals: village.name } },
          limit: 1,
        }),
      () =>
        payload.create({
          collection: 'locations',
          data: { name: village.name, address: village.address },
        }),
    )
    created += Number(isNew)
    const result = await generateRecurringSlots(payload, {
      location: location.id,
      weekday: village.weekday,
      startTime: village.start,
      endTime: village.end,
      from: addDays(today, 2),
      to: addDays(today, 30),
      maxOrders: 40,
    })
    created += result.created.length
    // Un plafond produit sur le premier passage, pour voir l'affichage « Plus que N ».
    if (result.created[0] && limitedProductId) {
      const { docs } = await payload.find({
        collection: 'pickup-slots',
        where: { location: { equals: location.id } },
        sort: 'date',
        limit: 1,
      })
      await payload.update({
        collection: 'pickup-slots',
        id: docs[0].id,
        data: { productLimits: [{ product: limitedProductId, maxQuantity: 6 }] },
      })
    }
  }

  // Coordonnées publiques de la boulangerie (https://www.lamiedeininge.fr/), si pas encore saisies.
  const settings = await payload.findGlobal({ slug: 'shop-settings' })
  if (!settings.contactPhone && !settings.contactEmail) {
    await payload.updateGlobal({
      slug: 'shop-settings',
      data: {
        shopName: 'La Mie Deininge',
        contactPhone: '01 34 66 54 53',
        contactEmail: 'lamiedeininge@gmail.com',
      },
    })
    created += 1
  }

  payload.logger.info(`Données de démonstration : ${created} élément(s) créé(s).`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
